import { supabaseServer } from "./supabase-server";
import { getStoriesForMonth } from "./stories";
import { isValidPeriod, monthlyStats, periodLabel } from "./monthlyStats";
import { assembleBody, buildPrompt, parseDraftText } from "./monthlyDraftText";
import { brevoConfigured, resendConfigured, sendEmail } from "./emailSend";

const OWNER_EMAIL = "chanakya.lab1@gmail.com";

export type DraftResult = { ok: true; slug: string; created: boolean } | { ok: false; error: string };

// Makes the Lens Monthly draft for a month, once. It is saved unpublished; nothing goes
// live until the owner reviews and publishes it.
export async function generateMonthlyDraft(period: string): Promise<DraftResult> {
  if (!isValidPeriod(period)) return { ok: false, error: "Use a month like 2026-11." };
  const slug = `lens-monthly-${period}`;
  const db = supabaseServer();
  const { data: existing, error: readError } = await db.from("dispatches").select("slug").eq("slug", slug).maybeSingle();
  if (readError) return { ok: false, error: "Could not read reports. Has supabase/lens-monthly.sql been run?" };
  if (existing) return { ok: true, slug, created: false };

  const stories = await getStoriesForMonth(period);
  if (stories.length < 5) return { ok: false, error: `Only ${stories.length} stories in ${periodLabel(period)}, not enough for a report.` };
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { ok: false, error: "Missing ANTHROPIC_API_KEY." };

  const stats = monthlyStats(stories, period);
  const { system, user } = buildPrompt(stats);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: "claude-haiku-4-5-20251001", max_tokens: 1800, system, messages: [{ role: "user", content: user }] }),
  });
  if (!res.ok) return { ok: false, error: `The AI service answered ${res.status}.` };
  const data = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
  const draft = parseDraftText(text);
  if (!draft) return { ok: false, error: "The draft text came back in an unusable form. Try again." };

  const { error } = await db.from("dispatches").insert({
    slug, title: draft.title, summary: draft.summary, body: assembleBody(draft, stats), hero_url: "", theme: "Monthly", period,
    published: false, published_at: null, updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false, error: "Could not save the draft. Has supabase/lens-monthly.sql been run?" };

  const provider = brevoConfigured() ? "brevo" : resendConfigured() ? "resend" : null;
  if (provider) {
    await sendEmail(
      { to: OWNER_EMAIL, subject: `Your Lens Monthly draft for ${periodLabel(period)} is ready`, html: `<p style="font-family:sans-serif;font-size:15px">The ${periodLabel(period)} draft is ready to review. Read it, edit anything, and publish when you are happy.</p><p><a href="https://chanakyalens.com/admin/monthly?edit=${slug}" style="font-family:sans-serif">Open the draft</a></p>` },
      provider,
    ).catch(() => {});
  }
  return { ok: true, slug, created: true };
}
