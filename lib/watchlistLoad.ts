import type { SupabaseClient } from "@supabase/supabase-js";
import type { Interest, InterestKind } from "./interests";
import { membershipVisibleTo } from "./memberAccess";
import { isActiveMember } from "./membership";

// Watchlists for digest subscribers who have an account and may use the feature:
// only the owner until MEMBERSHIP_PUBLIC=true, then active Lens+ members.
// Keyed by lower-cased email. Any failure returns what it has, so the ordinary
// digest is never blocked by this.
export async function loadWatchlistsByEmail(supabase: SupabaseClient, emails: string[]): Promise<Map<string, Interest[]>> {
  const out = new Map<string, Interest[]>();
  try {
    const wanted = new Set(emails.map((e) => e.toLowerCase()).filter((e) => membershipVisibleTo(e)));
    if (wanted.size === 0) return out;

    const idByEmail = new Map<string, string>();
    for (let page = 1; page <= 5; page++) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (error || !data?.users?.length) break;
      for (const u of data.users) if (u.email && wanted.has(u.email.toLowerCase())) idByEmail.set(u.email.toLowerCase(), u.id);
      if (data.users.length < 1000) break;
    }
    if (idByEmail.size === 0) return out;
    const ids = [...idByEmail.values()];

    let eligible = new Set(ids);
    if (process.env.MEMBERSHIP_PUBLIC === "true") {
      const { data } = await supabase.from("memberships").select("user_id, status, current_period_end").in("user_id", ids);
      eligible = new Set(((data ?? []) as { user_id: string; status: string; current_period_end: string | null }[]).filter((m) => isActiveMember({ status: m.status, currentPeriodEnd: m.current_period_end })).map((m) => m.user_id));
    }

    const { data: items } = await supabase.from("watchlist_items").select("user_id, kind, slug").in("user_id", [...eligible]);
    const byUser = new Map<string, Interest[]>();
    for (const r of (items ?? []) as { user_id: string; kind: InterestKind; slug: string }[]) {
      byUser.set(r.user_id, [...(byUser.get(r.user_id) ?? []), { kind: r.kind, slug: r.slug }]);
    }
    for (const [email, id] of idByEmail) if (byUser.has(id)) out.set(email, byUser.get(id)!);
  } catch {
    // fall back to the ordinary digest
  }
  return out;
}
