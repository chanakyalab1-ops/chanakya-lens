import { NextResponse } from 'next/server';
import { autoGenerateBatch } from '@/lib/auto-generate';
import { sendAlert } from '@/lib/alerts';

export const maxDuration = 60;

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await autoGenerateBatch(40);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await sendAlert('auto-generate', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}