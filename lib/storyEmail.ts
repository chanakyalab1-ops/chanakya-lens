const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// A clean, readable email of one story: headline, summary, the opening of the
// story and a link to the full analysis.
export function storyEmailHtml(s: { slug: string; headline: string; dek: string; category: string; body: string }): string {
  const url = `https://chanakyalens.com/story/${encodeURIComponent(s.slug)}`;
  const paras = s.body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean).slice(0, 3);
  return `<div style="font-family:Georgia,serif;max-width:620px;margin:0 auto;padding:24px;color:#1a1a1a">
<div style="font:600 12px monospace;letter-spacing:.12em;text-transform:uppercase;color:#0E7080">${esc(s.category)}</div>
<h1 style="font-size:26px;line-height:1.2;margin:8px 0 12px">${esc(s.headline)}</h1>
<p style="font-size:17px;line-height:1.5;color:#444">${esc(s.dek)}</p>
${paras.map((p) => `<p style="font-size:16px;line-height:1.6">${esc(p)}</p>`).join("\n")}
<p style="margin-top:24px"><a href="${url}" style="background:#0E7080;color:#fff;padding:12px 20px;text-decoration:none;font:600 14px sans-serif">Read the full analysis</a></p>
<p style="font:12px sans-serif;color:#888;margin-top:28px">Sent from your Chanakya Lens account.</p></div>`;
}
