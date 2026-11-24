// The Shelf: stories a reader keeps, each with an optional private note.
export const SHELF_FREE_LIMIT = 20;
export const NOTE_MAX = 280;

// The free limit only applies once membership is open to the public; until then
// nobody is asked to pay for something that cannot be bought.
export function canAddToShelf(currentCount: number, opts: { isMember: boolean; membershipPublic: boolean }): boolean {
  if (!opts.membershipPublic || opts.isMember) return true;
  return currentCount < SHELF_FREE_LIMIT;
}

export function cleanNote(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/\s+/g, " ").trim().slice(0, NOTE_MAX);
}
