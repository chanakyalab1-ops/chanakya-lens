import type { WhatsNewEntry } from "./whatsNew";

export type PopupDecision = { kind: "welcome" } | { kind: "whatsNew"; entries: WhatsNewEntry[] } | null;

// First visit: a welcome. Later visits: only what is newer than the last thing
// this browser was shown. Nothing otherwise, so the pop-up stays rare.
export function decidePopup(opts: { seenIntro: boolean; lastSeenDate: string | null; entries: WhatsNewEntry[]; max?: number }): PopupDecision {
  if (!opts.seenIntro) return { kind: "welcome" };
  const fresh = opts.entries.filter((e) => !opts.lastSeenDate || e.date > opts.lastSeenDate);
  return fresh.length > 0 ? { kind: "whatsNew", entries: fresh.slice(0, opts.max ?? 3) } : null;
}

const HIDDEN_PREFIXES = ["/review", "/admin", "/account", "/membership", "/unsubscribe", "/auth", "/start-here", "/whats-new"];

// Not shown in the admin tools, sign-in and account pages, or on the pages it links to.
export function popupAllowedOn(pathname: string): boolean {
  return !HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function latestDate(entries: WhatsNewEntry[]): string | null {
  return entries.reduce<string | null>((max, e) => (!max || e.date > max ? e.date : max), null);
}
