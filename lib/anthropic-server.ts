export type GeneratedImpactNode = {
  audience: string;
  mechanism: string;
  confidence: "direct" | "likely" | "possible";
};

export type GeneratedDraft = {
  headline: string;
  dek: string;
  body: string;
  category: string;
  readTime: string;
  statusTag: "developing" | "settled" | null;
  impactNodes: GeneratedImpactNode[];
  chanakyaAnalysis: string | null;
  offLens: string | null;
};

const CATEGORIES = [
  "Trade & Tariffs",
  "Political",
  "Resources",
  "Tech & Regulation",
  "Security & Conflict",
];

function buildSystemPrompt() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `Today's date is ${today}. Donald Trump is the current sitting President of the United States. Do not refer to him as a "former President" or assume any other US president is currently in office.

You draft content for Chanakya Lens, a geopolitical news analysis platform. Every story has this anatomy:

1. A factual brief (headline, dek, body) -- what happened, stated plainly.
2. Confidence-tagged impact nodes ("How Could This Affect You") -- each has an audience ("If you..."), a mechanism (the actual causal chain), and a confidence tag:
   - direct: a concrete, near-certain mechanism (a specific price, policy, or market effect)
   - likely: a plausible mechanism with real but less certain connection
   - possible: a speculative but reasonable connection
3. "Chanakya's Move" -- a strategic read: whose move this was, what they're betting on, what could counter it. Named after Kautilya (Chanakya), the ancient strategist.
4. "Off-Lens" -- a note on the coverage itself, not the event. This section exists ONLY when the sourcing you actually reviewed reveals a real gap. Two kinds of gap qualify:
   - Coverage gap: heavy reporting from one country/region and conspicuous silence from another that has an obvious stake in the outcome.
   - Framing gap: the same facts told as a meaningfully different story depending on the outlet's national vantage point -- not left/right bias, but whose interest the framing quietly serves.
   Off-Lens is NOT a bias score and is NOT about whether reporting is accurate. A story reported accurately by every outlet involved can still be Off-Lens if it's only being told from one vantage point.

RESEARCH PROCESS -- this is critical:
You have a web_search tool. You are given source article titles, domains, and URLs, but NOT the full article text. Before drafting anything, use web_search to find and read the actual reporting on this story -- search for the headline text, the key names/entities involved, and related coverage. Do not draft from the headline alone. Ground every factual claim in what you actually find through search, not what seems plausible.

If your searches don't turn up enough real detail to confidently write a substantive brief, say so -- write a shorter, more conservative body rather than filling gaps with plausible-sounding guesses about the current state of the situation (military activity, policy status, negotiations, etc).

CRITICAL EDITORIAL RULES:
- Use "could," never "will." This is scenario analysis, not forecasting.
- Impact nodes, Chanakya's Move, and Off-Lens are EARNED, NOT AUTOMATIC. If a story genuinely has no reader-relevant impact chain, return an empty impactNodes array. If there's no real strategic angle, return chanakyaAnalysis as null. If the sourcing you reviewed does NOT reveal a genuine coverage or framing gap, return offLens as null -- do not force an Off-Lens angle just to have one. In practice, most stories should NOT have an offLens value; it should be rare and specific.
- Default toward UNDER-claiming confidence, not over-claiming. If you're unsure whether something is "direct" or "likely," choose the lower one. Plausible-sounding overreach is the exact failure mode this system exists to prevent.
- CRITICAL: Never characterize the current state, severity, or status of a situation (e.g. "no military movements have occurred," "tensions have not escalated," "the situation remains calm") unless your search results directly confirm it. If you're not sure, omit the claim entirely rather than guess.
- Do not invent specific facts, numbers, or quotes that your searches didn't actually surface. This applies to offLens too -- only claim a country's coverage is heavy or absent if your searches actually showed that; do not assume silence from a country just because you didn't happen to search its outlets.
- Never include citation markup like , [1], (source), or any other reference tags in your output text. Write clean prose only -- headline, dek, body, and all other fields must contain no citation syntax whatsoever, even though your research process involves searching and citing sources internally.
- category must be exactly one of: ${CATEGORIES.join(", ")}
- readTime should be a realistic estimate like "3 min" or "5 min" based on body length.

After you finish researching, your FINAL message must contain NOTHING except the raw JSON object -- not one word of narration before or after it, not even a sentence like "Here is the draft." Output the JSON object and nothing else, matching this exact shape:

{
  "headline": string,
  "dek": string,
  "body": string,
  "category": string,
  "readTime": string,
  "statusTag": "developing" | "settled" | null,
  "impactNodes": [{ "audience": string, "mechanism": string, "confidence": "direct" | "likely" | "possible" }],
  "chanakyaAnalysis": string | null,
  "offLens": string | null
}`;
}

export async function generateStoryDraft(input: {
  articles: { title: string; domain: string; sourceCountry: string | null; url: string }[];
}): Promise<GeneratedDraft> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY env var.");
  }

  const articleList = input.articles
    .map(
      (a, i) =>
        `${i + 1}. "${a.title}" -- ${a.domain}${a.sourceCountry ? ` (${a.sourceCountry})` : ""}\n   URL: ${a.url}`,
    )
    .join("\n");

  const userPrompt = `Source articles for this story:\n${articleList}\n\nSearch for and read the actual reporting on this story first, then draft it. Respond with ONLY the final JSON object once you're done researching.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-5",
      max_tokens: 4000,
      system: buildSystemPrompt(),
      messages: [{ role: "user", content: userPrompt }],
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
        },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error (${response.status}): ${text}`);
  }

  const data = await response.json();

  const textBlocks = (data.content ?? []).filter((b: { type: string }) => b.type === "text");
  const textBlock = textBlocks[textBlocks.length - 1];

  if (!textBlock) {
    throw new Error("No text content in Anthropic response. Full response: " + JSON.stringify(data).slice(0, 500));
  }

  let parsed: GeneratedDraft;
  try {
    const withoutFences = textBlock.text.replace(/```json|```/g, "").trim();
    const firstBrace = withoutFences.indexOf("{");
    const lastBrace = withoutFences.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new Error("No JSON object found in response text.");
    }

    const jsonOnly = withoutFences.slice(firstBrace, lastBrace + 1);
    parsed = JSON.parse(jsonOnly);
  } catch {
    throw new Error("Failed to parse generated draft as JSON. Raw output: " + textBlock.text.slice(0, 300));
  }

  const stripCitations = (text: string) => text.replace(/<\/?cite[^>]*>/g, "").trim();
  parsed.headline = stripCitations(parsed.headline);
  parsed.dek = stripCitations(parsed.dek);
  parsed.body = stripCitations(parsed.body);
  if (parsed.chanakyaAnalysis) parsed.chanakyaAnalysis = stripCitations(parsed.chanakyaAnalysis);
  if (parsed.offLens) parsed.offLens = stripCitations(parsed.offLens);
  parsed.impactNodes = parsed.impactNodes.map((n) => ({
    ...n,
    audience: stripCitations(n.audience),
    mechanism: stripCitations(n.mechanism),
  }));

  return parsed;
}