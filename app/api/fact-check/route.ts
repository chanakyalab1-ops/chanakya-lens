import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;
import { createClient } from "@supabase/supabase-js";
import { sendAlert } from "@/lib/alerts";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function extractClaims(body: string): Promise<string[]> {
  const sentences = body
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.length > 40 && s.length < 300)
    .filter((s) => !s.toLowerCase().startsWith("the move") &&
                   !s.toLowerCase().startsWith("this is") &&
                   !s.toLowerCase().startsWith("the gambit") &&
                   !s.toLowerCase().startsWith("the counter") &&
                   !s.toLowerCase().startsWith("the risk"))
    .slice(0, 5);
  return sentences;
}

async function checkClaimWithGemini(claim: string): Promise<{
  claim: string;
  verified: boolean;
  confidence: number;
  sources: string[];
  note?: string;
  // Distinguishes "the API call itself failed" from "we asked Gemini and it
  // said this claim is unverified" -- these must never be scored the same
  // way. Conflating them is how this whole pipeline previously turned a
  // retired-model 404 into a hardcoded 0 on every single story.
  errored?: boolean;
}> {
  // "-latest" tracks Google's current supported model instead of pinning a
  // dated version -- gemini-1.5-flash was retired and every call to it 404'd
  // silently (see errored handling below), which is what caused every
  // quality_score to be 0 regardless of the actual story content.
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a news fact-checker. Determine if this event actually happened based on publicly available news sources.\n\nClaim: "${claim}"\n\nRespond with valid JSON only, no markdown:\n{\n  "verified": true or false,\n  "confidence": 0-100,\n  "sources": ["domain1.com", "domain2.com"],\n  "note": "optional brief note if unverified or disputed"\n}`
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json"
        },
        tools: [{ googleSearch: {} }]
      }),
    }
  );

  if (!response.ok) {
    const errBody = await response.text().catch(() => "");
    return {
      claim,
      verified: false,
      confidence: 0,
      sources: [],
      note: `Gemini API error ${response.status}: ${errBody.slice(0, 200)}`,
      errored: true,
    };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

  if (!text) {
    return { claim, verified: false, confidence: 0, sources: [], note: "Empty Gemini response", errored: true };
  }

  try {
    const parsed = JSON.parse(text);
    return {
      claim,
      verified: parsed.verified ?? false,
      confidence: parsed.confidence ?? 0,
      sources: parsed.sources ?? [],
      note: parsed.note,
    };
  } catch {
    return { claim, verified: false, confidence: 0, sources: [], note: "Parse error", errored: true };
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  const { draft_id } = await req.json();
  if (!draft_id) return NextResponse.json({ error: "draft_id required" }, { status: 400 });

  const { data: draft, error } = await supabase
    .from("story_drafts")
    .select("slug, headline, body, category, subject_countries")
    .eq("id", draft_id)
    .single();

  if (error || !draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

  await supabase
    .from("story_drafts")
    .update({ fact_check_status: "checking" })
    .eq("id", draft_id);

  try {
    const claims = await extractClaims(draft.body);
    const results = [];

    for (const claim of claims) {
      const result = await checkClaimWithGemini(claim);
      results.push(result);
      await sleep(4500);
    }

    // Only claims Gemini actually returned a verdict on count toward the
    // score -- an errored call (bad model, rate limit, malformed response)
    // is "unknown", not "confirmed false", and must not drag the score down
    // as if it were real negative evidence.
    const evaluated = results.filter((r) => !r.errored);
    const verifiedCount = evaluated.filter((r) => r.verified).length;
    const avgConfidence = evaluated.length
      ? Math.round(evaluated.reduce((sum, r) => sum + r.confidence, 0) / evaluated.length)
      : 0;

    let qualityScore: number;
    if (evaluated.length > 0) {
      qualityScore = Math.round((verifiedCount / evaluated.length) * 100 * 0.5 + avgConfidence * 0.5);
    } else {
      // Nothing could actually be checked (no extractable claims, or every
      // Gemini call errored) -- fall back to a score derived from the flags
      // we do have: sources checked is the base, each confirmed red flag
      // (a claim explicitly noted as unverified/disputed) is a penalty.
      const sourcesChecked = results.length;
      const confirmedFlags = results.filter((r) => !!r.note).length;
      qualityScore = Math.max(0, Math.min(100, sourcesChecked * 20 - confirmedFlags * 15));
    }

    if (results.length > 0 && evaluated.length === 0) {
      await sendAlert("fact-check", `Draft ${draft.slug}: all ${results.length} Gemini calls errored -- check GEMINI_API_KEY and model name`);
    }

    await supabase
      .from("story_drafts")
      .update({
        fact_check_status: "done",
        fact_check_flags: { claims: results, overall_score: qualityScore, evaluated_count: evaluated.length },
        quality_score: qualityScore,
        // Drafts are held out of the review queue (workflow_status=
        // 'fact_checking') until this completes, so a reviewer never sees
        // one that hasn't actually been checked yet.
        workflow_status: "in_review",
      })
      .eq("id", draft_id);

    return NextResponse.json({ success: true, quality_score: qualityScore, claims: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Without this, a mid-run failure (e.g. Gemini erroring) leaves the
    // draft stuck at "checking" forever instead of surfacing as failed. It
    // still needs to reach the review queue -- fact_check_status='failed'
    // is what flags it as unverified there, not withholding it forever.
    await supabase
      .from("story_drafts")
      .update({ fact_check_status: "failed", workflow_status: "in_review" })
      .eq("id", draft_id);
    await sendAlert("fact-check", `Draft ${draft.slug}: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}