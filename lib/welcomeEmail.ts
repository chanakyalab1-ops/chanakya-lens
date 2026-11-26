import { PERKS } from "./plans";

const SITE = "https://chanakyalens.com";
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export type WelcomeOptions = { gift?: boolean; endsAt?: string | null };

// The email a new Lens+ member gets: what they have now, three first steps, how to
// cancel and get a refund, and where to ask for help.
export function welcomeEmailHtml(opts: WelcomeOptions = {}): string {
  const ends = opts.endsAt ? new Date(opts.endsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  const intro = opts.gift
    ? `Your gift is active${ends ? ` and runs until ${esc(ends)}` : ""}. There is no card and nothing to cancel.`
    : "Thank you for backing independent reporting. Every story stays free for everyone, and Lens+ adds the tools below.";
  const perks = PERKS.map((p) => `<li style="margin:0 0 6px"><b>${esc(p.title)}.</b> ${esc(p.text)}</li>`).join("");
  const step = (n: number, label: string, href: string, text: string) =>
    `<p style="margin:0 0 10px"><b>${n}.</b> <a href="${SITE}${href}" style="color:#0E7080;font-weight:700">${esc(label)}</a> ${esc(text)}</p>`;
  return `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a">
<div style="font:600 12px monospace;letter-spacing:.12em;text-transform:uppercase;color:#0E7080">Chanakya Lens+</div>
<h1 style="font-size:28px;line-height:1.2;margin:10px 0 14px">Welcome to Lens+</h1>
<p style="font-size:16px;line-height:1.6">${intro}</p>
<h2 style="font-size:18px;margin:24px 0 8px">Start here</h2>
<div style="font-size:15px;line-height:1.5">
${step(1, "Build your Watchlist", "/account/watchlist", "with the countries, places and topics you care about. Your My Lens feed and daily digest follow it.")}
${step(2, "Open Your tools", "/tools", "for everything you now have and where to find it.")}
${step(3, "Ask the Lens", "/ask", "a question about anything we have covered.")}
</div>
<h2 style="font-size:18px;margin:24px 0 8px">What you have</h2>
<ul style="font-size:15px;line-height:1.5;padding-left:20px;margin:0">${perks}</ul>
<h2 style="font-size:18px;margin:24px 0 8px">Good to know</h2>
<p style="font-size:15px;line-height:1.6">${opts.gift ? "Your membership simply ends on its end date." : `Cancel any time from <a href="${SITE}/account" style="color:#0E7080">your account</a>, and you keep your tools until the end of what you have paid for. Our <a href="${SITE}/refund" style="color:#0E7080">refund policy</a> explains how refunds are handled through Paddle.`}</p>
<p style="font-size:15px;line-height:1.6">Questions or ideas? Just reply to this email or write to chanakya.lab1@gmail.com.</p>
<p style="font:12px sans-serif;color:#888;margin-top:28px">You are getting this because you joined Chanakya Lens+ at chanakyalens.com.</p></div>`;
}
