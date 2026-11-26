// A tiny, safe subset of Markdown for Dispatches. Nothing is ever inserted as raw
// HTML: text becomes plain strings, links must be https, images must be https.
export type Inline = { t: "text"; v: string } | { t: "b"; v: string } | { t: "i"; v: string } | { t: "a"; v: string; href: string };
export type Block =
  | { t: "h2"; v: string }
  | { t: "h3"; v: string }
  | { t: "p"; v: Inline[] }
  | { t: "ul"; v: Inline[][] }
  | { t: "quote"; v: Inline[] }
  | { t: "img"; alt: string; src: string };

const isHttps = (u: string) => /^https:\/\/[^\s]+$/i.test(u);

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: "b", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "i", v: m[2] });
    else out.push({ t: "a", v: m[3], href: m[4] });
    last = m.index + m[0].length;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

export function parseBlocks(md: string): Block[] {
  const blocks: Block[] = [];
  const paras = md.replace(/\r\n/g, "\n").split(/\n{2,}/);
  for (const raw of paras) {
    const chunk = raw.trim();
    if (!chunk) continue;
    const img = chunk.match(/^!\[([^\]]*)\]\((https:\/\/[^\s)]+)\)$/);
    if (img && isHttps(img[2])) blocks.push({ t: "img", alt: img[1], src: img[2] });
    else if (chunk.startsWith("### ")) blocks.push({ t: "h3", v: chunk.slice(4).trim() });
    else if (chunk.startsWith("## ")) blocks.push({ t: "h2", v: chunk.slice(3).trim() });
    else if (chunk.split("\n").every((l) => /^[-*] /.test(l))) blocks.push({ t: "ul", v: chunk.split("\n").map((l) => parseInline(l.slice(2).trim())) });
    else if (chunk.startsWith("> ")) blocks.push({ t: "quote", v: parseInline(chunk.split("\n").map((l) => l.replace(/^> ?/, "")).join(" ").trim()) });
    else blocks.push({ t: "p", v: parseInline(chunk.replace(/\n/g, " ")) });
  }
  return blocks;
}

// What a reader without access sees: the opening blocks only.
export const previewBlocks = (blocks: Block[], n = 3): Block[] => blocks.slice(0, n);
