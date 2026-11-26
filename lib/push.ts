import { sendNotification, setVapidDetails } from "web-push";
import { supabaseServer } from "./supabase-server";
import { buildPayload, canSendToday, matchesPrefs, nextCounter, type PushPrefs, type PushStory, type PushTopic } from "./pushMatch";

// Browser push notifications. Keys come from NEXT_PUBLIC_VAPID_PUBLIC_KEY and
// VAPID_PRIVATE_KEY (generate a pair on /admin/push); VAPID_SUBJECT is optional.
export function pushConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && !!process.env.VAPID_PRIVATE_KEY;
}

function configure(): boolean {
  if (!pushConfigured()) return false;
  setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:chanakya.lab1@gmail.com", process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, process.env.VAPID_PRIVATE_KEY!);
  return true;
}

type Row = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  topics: PushTopic[] | null;
  breaking_only: boolean | null;
  sent_day: string | null;
  sent_today: number | null;
  user_id?: string | null;
};

export type PushResult = { sent: number; skipped: number; removed: number; failed: number };

// Sends one story to everyone who wants it: followers of its topic, and readers
// who asked for the biggest stories when it is one. At most a few alerts a day each.
export async function notifyForStory(story: PushStory, kind: "new" | "update"): Promise<PushResult> {
  const result: PushResult = { sent: 0, skipped: 0, removed: 0, failed: 0 };
  if (!configure()) return result;

  const supabase = supabaseServer();
  const { data, error } = await supabase.from("push_subscriptions").select("id, endpoint, p256dh, auth, topics, breaking_only, sent_day, sent_today, user_id").limit(5000);
  if (error || !data) return result;

  // Readers who asked to watch this exact story get its updates whatever else they follow.
  const watchers = new Set<string>();
  if (kind === "update") {
    try {
      const { data: w } = await supabase.from("story_watches").select("user_id").eq("slug", story.slug);
      for (const r of (w ?? []) as { user_id: string }[]) watchers.add(r.user_id);
    } catch {
      // table not created yet
    }
  }

  const payload = JSON.stringify(buildPayload(story, kind));
  const rows = data as Row[];

  for (let i = 0; i < rows.length; i += 25) {
    await Promise.all(
      rows.slice(i, i + 25).map(async (row) => {
        const prefs: PushPrefs = { breakingOnly: !!row.breaking_only, topics: row.topics ?? [] };
        const watching = !!row.user_id && watchers.has(row.user_id);
        if (!watching && (!matchesPrefs(story, prefs) || !canSendToday(row))) {
          result.skipped++;
          return;
        }
        try {
          await sendNotification({ endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } }, payload, { TTL: 6 * 60 * 60 });
          await supabase.from("push_subscriptions").update({ ...nextCounter(row), last_sent_at: new Date().toISOString() }).eq("id", row.id);
          result.sent++;
        } catch (e) {
          const status = (e as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await supabase.from("push_subscriptions").delete().eq("id", row.id);
            result.removed++;
          } else {
            result.failed++;
          }
        }
      })
    );
  }
  return result;
}
