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
}> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "{}";
  
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
    return { claim, verified: false, confidence: 0, sources: [], note: "Parse error" };
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

    const verifiedCount = results.filter((r) => r.verified).length;
    const avgConfidence = results.length
      ? Math.round(results.reduce((sum, r) => sum + r.confidence, 0) / results.length)
      : 0;
    const qualityScore = results.length
      ? Math.round((verifiedCount / results.length) * 100 * 0.5 + avgConfidence * 0.5)
      : 0;

    await supabase
      .from("story_drafts")
      .update({
        fact_check_status: "done",
        fact_check_flags: { claims: results, overall_score: qualityScore },
        quality_score: qualityScore,
      })
      .eq("id", draft_id);

    return NextResponse.json({ success: true, quality_score: qualityScore, claims: results });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    // Without this, a mid-run failure (e.g. Gemini erroring) leaves the
    // draft stuck at "checking" forever instead of surfacing as failed.
    await supabase
      .from("story_drafts")
      .update({ fact_check_status: "failed" })
      .eq("id", draft_id);
    await sendAlert("fact-check", `Draft ${draft.slug}: ${message}`);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}