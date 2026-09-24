// Posts a short message to a Slack-compatible incoming webhook when
// ALERT_WEBHOOK_URL is configured, so cron-job failures (which nobody is
// watching a terminal for) surface somewhere a human will see them.
// No-op, and never throws, when the env var isn't set -- alerting is
// opt-in and must never be the thing that breaks a cron job.
export async function sendAlert(source: string, message: string): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `⚠️ *${source}*: ${message}` }),
    });
  } catch (err) {
    console.error("Failed to send alert:", err);
  }
}
