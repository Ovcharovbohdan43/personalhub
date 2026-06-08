import { NextResponse, type NextRequest } from 'next/server';
import { getSiteUrl } from '@/lib/site-url';
import { setTelegramWebhook } from '@/modules/telegram/telegram-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const setupSecret = process.env.TELEGRAM_SETUP_SECRET;
  if (!setupSecret || request.headers.get('authorization') !== `Bearer ${setupSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ ok: false, error: 'Missing TELEGRAM_WEBHOOK_SECRET' }, { status: 500 });
  }

  const result = await setTelegramWebhook(`${getSiteUrl()}/api/telegram/webhook`, webhookSecret);
  return NextResponse.json({ ok: true, result });
}
