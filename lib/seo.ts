import type { Metadata } from "next";

const SITE_NAME = "Chanakya Lens";

// Title, description, Open Graph and Twitter tags for a page, with og:url set
// to the page itself. The layout's openGraph names the homepage, and a page's
// own openGraph replaces it wholesale, so every field is repeated here.
export function pageMeta(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: { type: "website", siteName: SITE_NAME, title, description, url: path },
    twitter: { card: "summary_large_image", title, description },
  };
}

// Google shows about 60 characters of a title. Keep a long headline whole when
// it fits; otherwise cut at a clause break, or at a word boundary with an ellipsis.
export function seoTitle(headline: string, max = 60): string {
  const h = headline.trim();
  if (h.length <= max) return h;
  const head = h.slice(0, max);
  const clause = Math.max(head.lastIndexOf(": "), head.lastIndexOf(" -- "), head.lastIndexOf(" — "), head.lastIndexOf(" - "), head.lastIndexOf(", "));
  if (clause >= 30) return head.slice(0, clause).trim();
  const cut = head.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 30 ? cut.slice(0, space) : cut).replace(/[\s,;:.\-–—]+$/, "")}…`;
}
