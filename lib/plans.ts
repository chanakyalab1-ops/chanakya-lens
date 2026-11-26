// One list of what Lens+ adds, used by the membership page and the waitlist page
// so they can never disagree with each other (or with lib/entitlements.ts).
export type Perk = { icon: string; title: string; text: string };

export const PERKS: Perk[] = [
  { icon: "shield", title: "Back independent reporting", text: "No ads, no sponsored stories. Your membership pays for the research behind every story." },
  { icon: "target", title: "An unlimited Watchlist", text: "Watch as many countries, chokepoints, actors and topics as you like. Free readers can watch 3." },
  { icon: "mail", title: "A digest built from your Watchlist", text: "Your daily email leads with today's stories on what you watch." },
  { icon: "chat", title: "Ask the Lens", text: "Ask a question and get an answer built only from our own stories, with the stories it came from. 5 a day." },
  { icon: "compass", title: "Reading Map and streak", text: "See what you read, how long your streak is, and which countries you keep missing." },
  { icon: "compare", title: "Compare", text: "Pick two countries, places or actors and see what they share and where they differ." },
  { icon: "compass", title: "Lens Monthly", text: "A report on the month in world news, with charts drawn from our own data. Everyone reads the opening; members get the whole report." },
  { icon: "eye", title: "Watch single stories", text: "An alert when one specific story is updated, with a plain note on what changed." },
  { icon: "mail", title: "Email me a story, export your saves", text: "Send any story to your inbox, and download your saved stories as a spreadsheet." },
];

export const COMPARE: { row: string; free: string; paid: string }[] = [
  { row: "Every story and its full analysis", free: "✓", paid: "✓" },
  { row: "Off-Lens coverage maps", free: "✓", paid: "✓" },
  { row: "Daily digest and notifications", free: "✓", paid: "✓" },
  { row: "Save stories and read them offline", free: "✓", paid: "✓" },
  { row: "My Lens feed and Focus filters", free: "✓", paid: "✓" },
  { row: "Connected stories", free: "✓", paid: "✓" },
  { row: "Watchlist items", free: "3", paid: "Unlimited" },
  { row: "Digest built from your Watchlist", free: "–", paid: "✓" },
  { row: "Ask the Lens", free: "–", paid: "5 a day" },
  { row: "Reading Map and streak", free: "–", paid: "✓" },
  { row: "Compare", free: "–", paid: "✓" },
  { row: "Lens Monthly report", free: "Opening", paid: "Full report" },
  { row: "Watch a single story", free: "–", paid: "✓" },
  { row: "Email me, CSV export", free: "–", paid: "✓" },
];
