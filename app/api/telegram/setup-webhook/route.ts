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

  const siteUrl = getSiteUrl();
  const webhookUrl = `${siteUrl}/api/telegram/webhook`;

  if (/localhost|127\.0\.0\.1/i.test(siteUrl)) {
    return NextResponse.json({
      ok: false,
      error: 'NEXT_PUBLIC_SITE_URL points to localhost. Set it to https://personalhub-pi.vercel.app in Vercel, redeploy, then run setup-webhook again.',
      siteUrl,
      webhookUrl,
    }, { status: 500 });
  }

  try {
    const result = await setTelegramWebhook(webhookUrl, webhookSecret);
    return NextResponse.json({ ok: true, siteUrl, webhookUrl, result });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      siteUrl,
      webhookUrl,
    }, { status: 500 });
  }
}
