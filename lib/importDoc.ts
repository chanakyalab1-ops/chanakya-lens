// Turns a Word or PDF file's content into the editor's heading and text. Pure functions, so they are easy to test.
// Everything produced goes through the same safe mini-Markdown the site already renders.

const decode = (s: string): string =>
  s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");

const stripTags = (s: string): string => decode(s.replace(/<[^>]+>/g, ""));

// Citations often arrive as "[[bbc](url)]" or glued together; make them tidy links.
export function tidyCitations(md: string): string {
  return md
    .replace(/\[\s*(\[[^\]]+\]\(https?:\/\/[^)\s]+\))\s*\]/g, "$1")
    .replace(/(\]\(https?:\/\/[^)\s]+\))\s*(?=\[[^\]]+\]\(https?:)/g, "$1, ")
    .replace(/\s+\.(?=\s*\[[^\]]+\]\(https?:)/g, ".")
    .replace(/\.(?=\[[^\]]+\]\(https?:)/g, ". ");
}

export function htmlToMarkdown(html: string): string {
  let s = html.replace(/\r?\n/g, " ");
  s = s.replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href: string, text: string) => {
    const t = stripTags(text).trim();
    return /^https:\/\//i.test(href) && t ? `[${t}](${href})` : t;
  });
  s = s.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t: string, inner: string) => (stripTags(inner).trim() ? `**${stripTags(inner).trim()}**` : ""));
  s = s.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t: string, inner: string) => (stripTags(inner).trim() ? `*${stripTags(inner).trim()}*` : ""));
  s = s.replace(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi, (_m, t: string) => `\n\n# ${stripTags(t).trim()}\n\n`);
  s = s.replace(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi, (_m, t: string) => `\n\n## ${stripTags(t).trim()}\n\n`);
  s = s.replace(/<h[3-6]\b[^>]*>([\s\S]*?)<\/h[3-6]>/gi, (_m, t: string) => `\n\n### ${stripTags(t).trim()}\n\n`);
  s = s.replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, (_m, t: string) => `\n- ${t.replace(/<\/?p\b[^>]*>/gi, " ").trim()}`);
  s = s.replace(/<\/(ul|ol)>/gi, "\n\n").replace(/<(ul|ol)\b[^>]*>/gi, "\n\n");
  s = s.replace(/<\/p>/gi, "\n\n").replace(/<br\s*\/?>/gi, " ");
  s = decode(s.replace(/<(?!\/?\s*$)[^>]+>/g, ""));
  return tidyCitations(s.replace(/[ \t]+/g, " ").replace(/ *\n */g, "\n").replace(/\n{3,}/g, "\n\n").trim());
}

const isBoldHeadingLine = (b: string): boolean => /^\*\*[^*\n]{2,100}\*\*$/.test(b) && !/[.:;]\*\*$/.test(b);

// Splits converted text into a heading and the body: the first heading (or a short opening line) is the title, a
// short byline right under it is dropped (the site adds the writer's name), and bold lines become section headings.
export function splitTitleAndBody(markdown: string): { title: string; body: string } {
  const blocks = markdown.replace(/\r\n/g, "\n").split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);
  let title = "";
  const h1 = blocks.findIndex((b) => b.startsWith("# "));
  if (h1 >= 0) {
    title = blocks[h1].slice(2).replace(/\*+/g, "").trim();
    blocks.splice(h1, 1);
    // anything before the title (stray lines) is dropped
    blocks.splice(0, h1);
  } else if (blocks.length > 1 && blocks[0].length <= 150 && !/[.!?]$/.test(blocks[0])) {
    title = blocks.shift()!.replace(/\*+/g, "").replace(/^#+\s*/, "").trim();
  }
  if (title && blocks.length > 0) {
    const next = blocks[0];
    const plain = next.replace(/\*+/g, "");
    if (plain.length < 90 && /(\||^by\s|^opinion|^analysis)/i.test(plain.trim()) && !/^[-#>]/.test(next)) blocks.shift();
  }
  const body = blocks
    .map((b) => (b.startsWith("# ") ? `## ${b.slice(2)}` : isBoldHeadingLine(b) ? `## ${b.replace(/\*\*/g, "")}` : b))
    .join("\n\n");
  return { title, body: tidyCitations(body) };
}

export function wordDocToEditor(html: string): { title: string; body: string } {
  return splitTitleAndBody(htmlToMarkdown(html));
}

// PDF text has no structure, only lines. Rebuild paragraphs from line lengths and punctuation.
export function pdfTextToEditor(raw: string): { title: string; body: string } {
  let lines = raw.replace(/\r\n/g, "\n").split("\n").map((l) => l.trim());
  // page numbers, and headers or footers that repeat on every page
  const counts = new Map<string, number>();
  for (const l of lines) if (l) counts.set(l, (counts.get(l) ?? 0) + 1);
  lines = lines.filter((l) => !/^(page\s*)?\d{1,3}(\s*(of|\/)\s*\d{1,3})?$/i.test(l) && !((counts.get(l) ?? 0) >= 3 && l.length < 80));

  const lens = lines.filter(Boolean).map((l) => l.length).sort((a, b) => a - b);
  const wide = lens.length ? lens[Math.floor(lens.length * 0.9)] : 0;
  const blocks: string[] = [];
  let cur = "";
  const flush = () => {
    if (cur.trim()) blocks.push(cur.trim());
    cur = "";
  };
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (!l) {
      flush();
      continue;
    }
    const endsSentence = /[.!?"”')\]]$/.test(l);
    // a short line with no full stop that follows the end of a paragraph, or opens the text, is a heading
    if (l.length <= 80 && !endsSentence && (cur === "" || /[.!?"”')\]]$/.test(cur)) && /^[A-Z0-9"“]/.test(l) && (lines[i + 1] ?? "") !== "") {
      flush();
      // a heading that wrapped onto a second line is one heading
      if (blocks.length > 0 && blocks[blocks.length - 1].startsWith("\u0000H") && lines[i - 1] !== "") blocks[blocks.length - 1] += ` ${l}`;
      else blocks.push(`\u0000H${l}`);
      continue;
    }
    cur = cur ? (/-$/.test(cur) && /^[a-z]/.test(l) ? `${cur.slice(0, -1)}${l}` : `${cur} ${l}`) : l;
    if (endsSentence && l.length < wide * 0.6) flush();
  }
  flush();
  const md = blocks.map((b) => (b.startsWith("\u0000H") ? `## ${b.slice(2)}` : b)).join("\n\n");
  // the first heading line is the title
  const first = md.split(/\n{2,}/)[0] ?? "";
  const asTitle = first.startsWith("## ") ? md.replace(/^## /, "# ") : md;
  return splitTitleAndBody(asTitle);
}

export const MAX_IMPORT_BYTES = 4 * 1024 * 1024;
export const MAX_IMPORT_CHARS = 60000;
