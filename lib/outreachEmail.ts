// Builds the cold email to a creator and the Gmail link that opens it as a draft.
// Pure functions, so the wording is easy to test. Nothing here sends anything.

export type OutreachVersion = "geo" | "econ";
export type OutreachStatus = "draft" | "sent" | "replied" | "yes" | "no";

export const FOLLOWUP_DAYS = 5;
export const INSTAGRAM_URL = "instagram.com/chanakya.lab";

export type OutreachInput = {
  name: string;
  videoTitle: string;
  topic: string;
  specific: string;
  version: OutreachVersion;
  sender: string;
};

export const firstName = (full: string): string => full.trim().split(/\s+/)[0] || "there";

export function buildEmail(i: OutreachInput): { subject: string; body: string } {
  const topic = i.topic.trim();
  const sender = i.sender.trim() || "[Your name]";
  const subject = topic
    ? i.version === "econ" ? `Oil, tariffs and the rupee, for your audience on ${topic}` : `A tool for your audience on ${topic}`
    : i.version === "econ" ? "Who is covering the story, and what it means for India" : "Who is covering the story, and who is not";
  // With a real video and detail the opener is specific. Without them it is a plain, honest line and never invents a video.
  const watched = i.videoTitle.trim()
    ? `I watched your "${i.videoTitle.trim()}"${topic ? ` on ${topic}` : ""}`
    : `I really like the ${i.version === "econ" ? "geopolitics and economy" : "geopolitics"} content you post${topic ? ` on ${topic}` : ""}`;
  const liked = i.specific.trim() && i.videoTitle.trim() ? ` and liked how you ${i.specific.trim().replace(/[.\s]+$/, "")}` : "";
  const what =
    i.version === "econ"
      ? "For each world story we show what happened, what it means for India and for ordinary readers (fuel, food, exports, jobs), and who is covering it and who is not. It is a ten-second visual you could put straight into a video."
      : "For each world story we show what happened, who it affects, and who is covering it and who is not. It is a ten-second visual you could put straight into a video.";
  const body = [
    `Hi ${firstName(i.name)},`,
    "",
    `${watched}${liked}.`,
    "",
    `I run Chanakya Lens (chanakyalens.com). ${what}`,
    "",
    "I would like to invite you to partner with us. Lens+, our member tier, is opening soon. As a partner you get:",
    "- free Lens+ for as long as we work together",
    "- a personal link, so every signup is counted for you",
    "- 20% of first-year revenue from members you bring in (payouts start when paid membership opens)",
    "- a feature on our creators page",
    "",
    "There is no fee and no script. Say only what you honestly think, and disclose the partnership as your platform requires.",
    "",
    'If you would like to try it first, reply "yes" and I will set up a free account. Details are at chanakyalens.com/creators.',
    "",
    `To see what we post, we are on Instagram: ${INSTAGRAM_URL} (@chanakya.lab).`,
    "",
    'If it is not for you, reply "no thanks" and I will not write again.',
    "",
    sender,
    "Founder, Chanakya Lens",
    "chanakyalens.com",
  ].join("\n");
  return { subject, body };
}

export function buildFollowup(i: Pick<OutreachInput, "name" | "sender">, originalSubject: string): { subject: string; body: string } {
  const body = [
    `Hi ${firstName(i.name)},`,
    "",
    'A quick nudge in case this got buried. I am happy to set up a free Lens+ account so you can look around, with nothing expected in return. Just reply "yes".',
    "",
    "If now is not the time, I will not write again.",
    "",
    i.sender.trim() || "[Your name]",
  ].join("\n");
  return { subject: `Re: ${originalSubject}`, body };
}

// Opens a prefilled draft in Gmail's compose window. The person still presses Send.
export function gmailComposeUrl(to: string, subject: string, body: string): string {
  const q = new URLSearchParams({ view: "cm", fs: "1", to, su: subject, body });
  return `https://mail.google.com/mail/?${q.toString()}`;
}

// Opens the phone's default mail app (Gmail on most Android phones) with the email filled in.
export function mailtoUrl(to: string, subject: string, body: string): string {
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function followupDueAt(sentAt: string | null, days = FOLLOWUP_DAYS): Date | null {
  if (!sentAt) return null;
  const t = new Date(sentAt).getTime();
  return Number.isFinite(t) ? new Date(t + days * 86400000) : null;
}

// A follow-up is due once, five days after the first email, if nobody has replied yet.
export function needsFollowup(row: { status: string; sent_at: string | null; followup_sent_at: string | null }, now: number = Date.now()): boolean {
  if (row.status !== "sent" || row.followup_sent_at) return false;
  const due = followupDueAt(row.sent_at);
  return !!due && due.getTime() <= now;
}

export function validEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s.trim());
}

export type BulkRow = { name: string; email: string; channelUrl: string; version: OutreachVersion };

export const isInstagram = (url: string): boolean => /^https?:\/\/(www\.)?instagram\.com\//i.test(url);

// "@handle" or a bare handle becomes an Instagram link; a full link is kept.
export function normalizeChannel(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  if (v.startsWith("@")) return `https://instagram.com/${v.slice(1)}`;
  return "";
}

// How we reach someone: by email, by an Instagram DM, or through a contact form on their site.
export type OutreachRoute = "email" | "dm" | "form";
export function routeOf(r: { email: string | null; channel_url: string }): OutreachRoute {
  if (r.email) return "email";
  return isInstagram(r.channel_url) ? "dm" : "form";
}

// Parses pasted lines like "Tanya Vats | tanya@x.com | @tanyaavats_ | geo". Separators: | , or tab.
// A line needs an email, or an @handle or link to reach them by DM or contact page.
export function parseBulk(text: string): { rows: BulkRow[]; errors: string[] } {
  const rows: BulkRow[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/[|\t,]/).map((p) => p.trim()).filter(Boolean);
    const email = parts.find((p) => validEmail(p)) ?? "";
    const rest = parts.filter((p) => p !== email);
    const name = rest.find((p) => !/^https?:\/\//i.test(p) && !p.startsWith("@") && !/^(geo|econ)$/i.test(p)) ?? "";
    if (!name) {
      errors.push(`No name: ${line.slice(0, 60)}`);
      continue;
    }
    const channelUrl = normalizeChannel(rest.find((p) => /^https?:\/\//i.test(p) || p.startsWith("@")) ?? "");
    if (!email && !channelUrl) {
      errors.push(`Add an email, @handle or link: ${line.slice(0, 60)}`);
      continue;
    }
    const v = rest.find((p) => /^(geo|econ)$/i.test(p));
    const key = (email || channelUrl).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({ name, email: email.toLowerCase(), channelUrl, version: v && v.toLowerCase() === "econ" ? "econ" : "geo" });
  }
  return { rows, errors };
}

// A short message for an Instagram DM or a website contact form.
export function buildDm(i: Pick<OutreachInput, "name" | "topic" | "version" | "sender" | "videoTitle" | "specific">): string {
  const topic = i.topic.trim();
  const liked = i.videoTitle.trim() && i.specific.trim()
    ? `I watched your "${i.videoTitle.trim()}" and liked how you ${i.specific.trim().replace(/[.\s]+$/, "")}.`
    : `I really like the ${i.version === "econ" ? "geopolitics and economy" : "geopolitics"} content you post${topic ? ` on ${topic}` : ""}.`;
  return [
    `Hi ${firstName(i.name)}, ${liked}`,
    "",
    "I run Chanakya Lens (chanakyalens.com). For each world story we show what happened, who it affects, and who is covering it and who is not.",
    "",
    "I would like to invite you to partner with us: free Lens+, a personal link so every signup is counted for you, and 20% of first-year revenue from members you bring in (payouts start when paid membership opens). No fee, no script. Say only what you honestly think, and disclose the partnership as your platform requires.",
    "",
    "Details: chanakyalens.com/creators. If you would like to try it first, reply \"yes\" and I will set up a free account.",
    "",
    'If it is not for you, just say "no thanks" and I will not message again.',
    "",
    `${i.sender.trim() || "[Your name]"}, Chanakya Lens (@chanakya.lab)`,
  ].join("\n");
}

export function buildDmFollowup(i: Pick<OutreachInput, "name" | "sender">): string {
  return `Hi ${firstName(i.name)}, a quick nudge in case this got buried. I am happy to set up a free Lens+ account so you can look around, with nothing expected in return. Just reply "yes". If now is not the time, I will not message again. ${i.sender.trim() || "[Your name]"}`;
}
