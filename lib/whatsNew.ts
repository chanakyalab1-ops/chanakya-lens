// Public change log for readers. Add a new entry at the TOP when a feature ships
// (never before it is live), with the date it went live. Keep each to a sentence or two.
export type WhatsNewEntry = { date: string; title: string; body: string; href?: string; linkLabel?: string };

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    date: "2026-10-25",
    title: "Related stories now follow the story",
    body: "The three stories at the bottom of each article are now the ones about the same running event first, then the same topic and country, so you can follow a story as it develops.",
  },
  {
    date: "2026-10-15",
    title: "A new Daily Digest",
    body: "The daily email has a fresh layout: top stories with pictures, an Off-Lens section showing how different countries cover the same news, and a short list of everything else.",
    href: "/digest",
    linkLabel: "Get the digest",
  },
];

export function sortedWhatsNew(entries: WhatsNewEntry[] = WHATS_NEW): WhatsNewEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}
