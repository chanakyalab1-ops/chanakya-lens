// Everything Chanakya Lens offers, for the public Features page. `tier`: what a reader needs.
// `gated` features are hidden from the public until MEMBERSHIP_PUBLIC=true, so the page
// calls them "Coming soon" until then.
export type FeatureTier = "everyone" | "account" | "plus";
export type Feature = { icon: string; name: string; text: string; how: string; tier: FeatureTier; gated?: boolean; href?: string };

export const FEATURES: Feature[] = [
  // Free for everyone
  { icon: "target", name: "Impact tracing", text: "Every story traces the news to what it could mean for you, with each effect rated Direct, Likely or Possible.", how: "In every story, under How could this affect you.", tier: "everyone", href: "/how-we-rate" },
  { icon: "eye", name: "Off-Lens", text: "Who is covering a story, from which countries, and whose view is missing.", how: "In every story, and on the Off-Lens page.", tier: "everyone", href: "/off-lens" },
  { icon: "compass", name: "Today's Signal", text: "The stories that matter most today, one from each topic, in a glance.", how: "At the top of the homepage.", tier: "everyone", href: "/today" },
  { icon: "link", name: "The Lens", text: "Pages for countries, chokepoints, actors and storylines, with background and the latest coverage.", how: "Open The Lens from the menu.", tier: "everyone", href: "/lens" },
  { icon: "mail", name: "Daily digest", text: "One email a day with the stories that matter, in the topics you pick.", how: "Sign up on the Digest page.", tier: "everyone", href: "/digest" },
  { icon: "eye", name: "Notifications", text: "A push alert when we publish the biggest stories or the topics you choose. At most three a day.", how: "Tap the bell at the top of the page.", tier: "everyone" },
  { icon: "compare", name: "What changed", text: "When a developing story is updated, a short note says what changed.", how: "At the top of an updated story.", tier: "everyone" },
  { icon: "link", name: "Connected stories", text: "See what else is happening on the same places, actors and themes, so you can follow one thread across the news.", how: "At the bottom of every story, under Connected through.", tier: "everyone", gated: true },
  // Free with an account
  { icon: "target", name: "Watchlist and My Lens", text: "Follow up to 3 countries, places, actors or topics. A My Lens tab on the homepage is built from them.", how: "Your account > Watchlist, then the My Lens tab.", tier: "account", gated: true },
  { icon: "bookmark", name: "Save stories", text: "Keep stories to read later.", how: "Tap Save at the top of any story.", tier: "account", gated: true },
  { icon: "search", name: "Focus filters", text: "Hide stories you have read, or narrow the feed by how certain the effect is, or by country.", how: "The Focus bar above the homepage feed.", tier: "account", gated: true },
  { icon: "offline", name: "Offline reading", text: "Saved stories open even without a connection.", how: "Save a story while online, then read it anywhere.", tier: "account", gated: true },
  // Lens+
  { icon: "target", name: "Unlimited Watchlist", text: "Watch as many countries, places, actors and topics as you like.", how: "Your account > Watchlist.", tier: "plus", gated: true },
  { icon: "mail", name: "Watchlist digest", text: "Your daily email leads with today's stories on what you watch.", how: "Automatic once you have a Watchlist and the digest.", tier: "plus", gated: true },
  { icon: "chat", name: "Ask the Lens", text: "Ask a question and get an answer built only from our own stories, with the stories it came from. 5 questions a day.", how: "Your account > Ask the Lens.", tier: "plus", gated: true },
  { icon: "compass", name: "Reading Map and streak", text: "What you read, your reading streak, and which countries you keep missing.", how: "Your account > Reading Map.", tier: "plus", gated: true },
  { icon: "compare", name: "Compare", text: "Pick two countries, places or actors and see what they share and where they differ.", how: "Your account > Compare.", tier: "plus", gated: true },
  { icon: "eye", name: "Watch a story", text: "An alert when one specific story is updated.", how: "Tap Watch at the top of a story.", tier: "plus", gated: true },
  { icon: "compass", name: "Lens Monthly", text: "A report on the month in world news, with charts drawn from our own data. Everyone reads the opening; members get the whole report.", how: "Published on the last day of each month.", tier: "plus", gated: true },
  { icon: "mail", name: "Email me and CSV export", text: "Send any story to your inbox, and download your saved stories as a spreadsheet.", how: "On a story, and on your Saved stories page.", tier: "plus", gated: true },
  { icon: "shield", name: "Gift Lens+", text: "Give a year of Lens+ to anyone with a one-off payment and a gift code. No renewal.", how: "On the Gift page.", tier: "plus", gated: true, href: "/gift" },
];

export const TIER_TITLE: Record<FeatureTier, { title: string; blurb: string }> = {
  everyone: { title: "Free for everyone", blurb: "No account needed." },
  account: { title: "Free with an account", blurb: "Sign in to use these." },
  plus: { title: "With Lens+", blurb: "The member plan. Every story stays free either way." },
};
