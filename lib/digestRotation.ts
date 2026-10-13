// When there are more subscribers than the email provider allows per day, split
// them into a few fixed groups and send each group on its own day, so everyone
// still gets the digest regularly and nobody is silently dropped.

// Aim a little under the real limit: hash-based groups are not perfectly even.
const HEADROOM = 0.85;

// FNV-1a: stable across runs, so a subscriber stays in the same group.
export function hashEmail(email: string): number {
  let h = 2166136261;
  for (const ch of email.trim().toLowerCase()) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function cohortCount(subscribers: number, dailyLimit: number): number {
  const perDay = Math.max(1, Math.floor(dailyLimit * HEADROOM));
  return Math.max(1, Math.ceil(subscribers / perDay));
}

export function dayIndex(now = Date.now()): number {
  return Math.floor(now / 86_400_000);
}

export function isSendDay(email: string, cohorts: number, day: number): boolean {
  if (cohorts <= 1) return true;
  return hashEmail(email) % cohorts === day % cohorts;
}
