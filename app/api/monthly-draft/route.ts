import { NextRequest, NextResponse } from "next/server";
import { generateMonthlyDraft } from "@/lib/monthlyDraft";
import { currentPeriod } from "@/lib/monthlyStats";
import { sendAlert } from "@/lib/alerts";

export const maxDuration = 60;

// Runs on the 27th of each month (see vercel.json): drafts that month's Lens Monthly so it
// can be reviewed and published on the last day. Always saved unpublished.
export async function GET(req: NextRequest) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await generateMonthlyDraft(currentPeriod());
  if (!result.ok) await sendAlert("monthly-draft", result.error);
  return NextResponse.json(result);
}
