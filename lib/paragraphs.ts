// A story body arrives as one string. Use its own paragraph breaks when it
// has them; otherwise split a long block into short paragraphs at sentence
// ends so it isn't a wall of text.
const ABBREVIATION = /(?:\b[A-Z]|\b(?:Mr|Mrs|Ms|Dr|St|Inc|Ltd|Corp|Co|vs|No))\.$/;

export function paragraphs(body: string): string[] {
  const text = body.replace(/\r\n/g, "\n").trim();
  if (!text) return [];
  const explicit = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);
  if (explicit.length > 1) return explicit;
  const single = explicit[0];
  if (single.length < 700) return [single];

  const sentences: string[] = [];
  for (const part of single.split(/(?<=[.!?]["”')\]]?)\s+(?=["“(]?[A-Z0-9])/)) {
    const last = sentences[sentences.length - 1];
    if (last && ABBREVIATION.test(last)) sentences[sentences.length - 1] = `${last} ${part}`;
    else sentences.push(part);
  }

  const out: string[] = [];
  let current = "";
  let count = 0;
  for (const sentence of sentences) {
    current = current ? `${current} ${sentence}` : sentence;
    count++;
    if ((count >= 3 && current.length >= 300) || current.length >= 520) {
      out.push(current);
      current = "";
      count = 0;
    }
  }
  if (current) {
    if (out.length > 0 && current.length < 160) out[out.length - 1] += ` ${current}`;
    else out.push(current);
  }
  return out;
}
