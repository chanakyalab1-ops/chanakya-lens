// Lens+ waitlist helpers (pure, so they can be tested without a database).
export function cleanEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[^\s@<>()"',;:]{2,}$/.test(e)) return null;
  return e;
}

export function cleanSource(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/[^a-z0-9-]/gi, "").slice(0, 30) : "";
}

export function waitlistEmailHtml(): string {
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a">
<div style="font:600 12px monospace;letter-spacing:.12em;text-transform:uppercase;color:#0E7080">Chanakya Lens</div>
<h1 style="font-size:26px;line-height:1.2;margin:10px 0 14px">You are on the Lens+ waitlist</h1>
<p style="font-size:16px;line-height:1.6">Thank you. When Lens+ opens, you will get an email first and can join before everyone else.</p>
<p style="font-size:16px;line-height:1.6">Every story stays free. Lens+ adds the tools: a Watchlist and My Lens feed, saved stories, alerts on single stories, Ask the Lens and more.</p>
<p style="font:12px sans-serif;color:#888;margin-top:28px">You signed up at chanakyalens.com. If this was not you, ignore this email and you will not hear from us again.</p></div>`;
}
