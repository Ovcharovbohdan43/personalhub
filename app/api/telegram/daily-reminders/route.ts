import { NextResponse, type NextRequest } from 'next/server';
import { sendDailyTaskReminders } from '@/modules/telegram/bot';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authorization = request.headers.get('authorization');
    if (authorization !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const result = await sendDailyTaskReminders();
  return NextResponse.json({ ok: true, ...result });
}
