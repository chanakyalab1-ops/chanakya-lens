import type { DigestStory } from "./digestStories";

const SITE = "https://chanakyalens.com";
const INK = "#0A0D11";
const MUTED = "#5b6472";
const RULE = "#d6d6cf";
const FONT = "-apple-system, 'Segoe UI', Helvetica, Arial, sans-serif";

export function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function storyUrl(s: DigestStory): string {
  return `${SITE}/story/${encodeURIComponent(s.slug)}`;
}

function sourceCount(s: DigestStory): number {
  return s.sources?.length ?? 0;
}

function countryCount(s: DigestStory): number {
  return Object.keys(s.off_lens_countries ?? {}).length;
}

function meta(s: DigestStory): string {
  const bits = [esc(s.category)];
  const n = sourceCount(s);
  if (n > 0) bits.push(`${n} source${n === 1 ? "" : "s"}`);
  return bits.join(" · ");
}

function image(s: DigestStory, width: number, height: number): string {
  if (!s.image_url) return "";
  return `<a href="${storyUrl(s)}"><img src="${esc(s.image_url)}" alt="" width="${width}" height="${height}" style="display:block;width:${width}px;max-width:100%;height:${height}px;object-fit:cover;border:0;" /></a>`;
}

function readMore(s: DigestStory): string {
  return `<a href="${storyUrl(s)}" style="font-size:12px;font-weight:700;color:${INK};text-decoration:underline;">Read More</a>`;
}

function text(s: DigestStory): string {
  return `
    <div style="font-size:11px;color:${MUTED};margin-bottom:6px;">${meta(s)}</div>
    <div style="font-size:17px;line-height:1.25;font-weight:800;margin-bottom:8px;"><a href="${storyUrl(s)}" style="color:${INK};text-decoration:none;">${esc(s.headline)}</a></div>
    <div style="font-size:13px;line-height:1.45;color:#333;margin-bottom:10px;">${esc(s.dek)}</div>
    ${readMore(s)}`;
}

// Two columns: image and text, swapping sides on alternate stories. Stacks
// on narrow screens where the client supports media queries.
function topStory(s: DigestStory, index: number): string {
  const img = s.image_url ? `<td class="col" width="240" valign="top" style="padding:${index % 2 === 0 ? "0 16px 0 0" : "0 0 0 16px"};">${image(s, 240, 160)}</td>` : "";
  const txt = `<td class="col" valign="top">${text(s)}</td>`;
  const cells = index % 2 === 0 ? img + txt : txt + img;
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0;padding-bottom:20px;border-bottom:1px solid ${RULE};"><tr>${cells}</tr></table>`;
}

function offLensCard(s: DigestStory): string {
  const n = countryCount(s);
  return `
    <td class="col" width="50%" valign="top" style="padding:0 8px;">
      ${image(s, 260, 150)}
      <div style="font-size:11px;color:${MUTED};margin:8px 0 4px 0;">Covered by ${n} countr${n === 1 ? "y" : "ies"}</div>
      <div style="font-size:15px;line-height:1.3;font-weight:700;margin-bottom:8px;"><a href="${storyUrl(s)}" style="color:${INK};text-decoration:none;">${esc(s.headline)}</a></div>
      ${readMore(s)}
    </td>`;
}

function heading(label: string): string {
  return `<div style="font-size:26px;font-weight:800;color:${INK};margin:8px 0 18px 0;">${label}</div>`;
}

export function buildDigestHtml(stories: DigestStory[], topicLabel: string, email: string, fellBack = false): string {
  const top = stories.slice(0, 3);
  const rest = stories.slice(3);
  const offLens = [...stories]
    .filter((s) => countryCount(s) >= 2)
    .sort((a, b) => countryCount(b) - countryCount(a))
    .slice(0, 2);
  const more = rest.filter((s) => !offLens.includes(s));

  const note = fellBack
    ? `<p style="font-size:13px;color:#444;margin:0 0 20px 0;">None of today's stories were in your chosen topics, so here are today's top stories instead.</p>`
    : "";

  const offLensBlock =
    offLens.length > 0
      ? `${heading("Off-Lens")}
         <p style="font-size:13px;color:#333;margin:-8px 0 14px 0;">The same news, covered very differently depending on where you read it.</p>
         <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 -8px 20px -8px;width:calc(100% + 16px);"><tr>${offLens.map(offLensCard).join("")}</tr></table>
         <div style="border-top:1px solid ${RULE};margin:0 0 20px 0;"></div>`
      : "";

  const moreBlock =
    more.length > 0
      ? `${heading("Also today")}
         ${more
           .map(
             (s) => `<div style="margin:0 0 14px 0;"><div style="font-size:11px;color:${MUTED};">${meta(s)}</div><a href="${storyUrl(s)}" style="font-size:15px;font-weight:700;color:${INK};text-decoration:none;">${esc(s.headline)}</a></div>`
           )
           .join("")}
         <div style="border-top:1px solid ${RULE};margin:6px 0 20px 0;"></div>`
      : "";

  return `<!doctype html>
<html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
<style>@media (max-width:520px){.col{display:block!important;width:100%!important;padding:0 0 12px 0!important;}}</style></head>
<body style="margin:0;background:#33332f;">
  <div style="max-width:600px;margin:0 auto;padding:16px;">
    <div style="background:#f0f0ea;padding:24px 28px;font-family:${FONT};color:${INK};">
      <div style="margin-bottom:6px;">
        <img src="${SITE}/logo-mark.png" alt="" width="28" height="28" style="vertical-align:middle;border-radius:50%;" />
        <span style="vertical-align:middle;font-weight:800;font-size:26px;letter-spacing:0.02em;margin-left:6px;color:#000;">DAILY DIGEST</span>
      </div>
      <p style="font-size:13px;line-height:1.5;color:#333;margin:0 0 18px 0;">Chanakya Lens daily digest: today's stories, with what they mean for you and how different countries cover the same news. ${esc(topicLabel)}.</p>
      <div style="border-top:1px solid ${RULE};margin:0 0 18px 0;"></div>
      ${note}
      ${heading("Top Stories")}
      ${top.map(topStory).join("")}
      ${offLensBlock}
      ${moreBlock}
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="background:#1f2328;padding:22px 24px;">
        <div style="font-size:16px;font-weight:800;color:#fff;margin-bottom:6px;">Want more?</div>
        <div style="font-size:13px;color:#d8d8d8;margin-bottom:14px;">Every story has the full analysis, what it means for you, and the Off-Lens view.</div>
        <a href="${SITE}" style="display:inline-block;background:#fff;color:${INK};font-size:13px;font-weight:700;padding:9px 16px;text-decoration:none;">Read on chanakyalens.com</a>
      </td></tr></table>
      <div style="text-align:center;margin-top:22px;">
        <p style="font-size:11px;color:${MUTED};margin:0 0 6px 0;">You're receiving this because you subscribed at chanakyalens.com.</p>
        <a href="${SITE}/unsubscribe?email=${encodeURIComponent(email)}" style="font-size:11px;color:${MUTED};">Unsubscribe</a>
      </div>
    </div>
  </div>
</body></html>`;
}
