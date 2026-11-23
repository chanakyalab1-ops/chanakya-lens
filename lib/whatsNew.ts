// Public change log for readers. Add a new entry at the TOP when a feature ships
// (never before it is live), with the date it went live. Keep each to a sentence or two.
export type WhatsNewEntry = { date: string; title: string; body: string; href?: string; linkLabel?: string };

export const WHATS_NEW: WhatsNewEntry[] = [
  {
    date: "2026-11-23",
    title: "Install Chanakya Lens as an app",
    body: "Add the site to your phone's home screen from your browser's menu and it opens like an app, with its own icon.",
  },
  {
    date: "2026-11-23",
    title: "Today's Signal shows five stories",
    body: "The strip of what moved most now has five stories, spread across different topics instead of three from one.",
    href: "/today",
    linkLabel: "See today's signal",
  },
  {
    date: "2026-11-23",
    title: "Off-Lens now says what its sample is",
    body: "Each Off-Lens map now notes that it shows only the sources we found, and that a missing country may still have covered the story.",
    href: "/how-we-rate",
    linkLabel: "How to read Off-Lens",
  },
  {
    date: "2026-11-23",
    title: "New topic: Sports & Power",
    body: "Stories where sport meets politics and money: hosting rights, boycotts, sanctions on athletes, state-backed investment. Pick it as a digest topic.",
    href: "/digest",
    linkLabel: "Choose your topics",
  },
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
