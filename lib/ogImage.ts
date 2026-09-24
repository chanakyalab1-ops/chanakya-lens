// Fetches a source article's own og:image/twitter:image instead of
// re-hosting a copy of it -- we only ever link to the publisher's own file,
// the same mechanism link-preview tools (Slack, iMessage, Twitter) use.
// Nothing here downloads or stores the image itself.

const FETCH_TIMEOUT_MS = 6000;
const USER_AGENT = "Mozilla/5.0 (compatible; ChanakyaLensBot/1.0; +https://chanakyalens.com)";

const NON_PHOTO_HINTS = ["logo", "favicon", "sprite", "placeholder", "default-social", "og-default"];

function extractMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`, "i"),
    new RegExp(`<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${property}["']`, "i"),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match) return match[1];
  }
  return null;
}

function looksLikeRealPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  if (NON_PHOTO_HINTS.some((hint) => lower.includes(hint))) return false;
  return /\.(jpe?g|png|webp|avif)(\?|$)/i.test(lower) || lower.includes("image");
}

export async function fetchSourceOgImage(sourceUrl: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": USER_AGENT },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return null;

    const html = await res.text();
    const imageUrl = extractMetaContent(html, "og:image") ?? extractMetaContent(html, "twitter:image");
    if (!imageUrl || !looksLikeRealPhoto(imageUrl)) return null;

    return new URL(imageUrl, sourceUrl).toString();
  } catch {
    return null; // timeout, network error, blocked, or malformed HTML -- fall through to the stock pipeline
  }
}
