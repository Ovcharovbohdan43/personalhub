import { NextResponse, type NextRequest } from 'next/server';
import { getTelegramWebhookInfo } from '@/modules/telegram/telegram-api';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const setupSecret = process.env.TELEGRAM_SETUP_SECRET;
  if (!setupSecret || request.headers.get('authorization') !== `Bearer ${setupSecret}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const info = await getTelegramWebhookInfo();
    return NextResponse.json({
      ok: true,
      webhook: info,
      expectedUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://personalhub-pi.vercel.app'}/api/telegram/webhook`,
      hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasWebhookSecret: Boolean(process.env.TELEGRAM_WEBHOOK_SECRET),
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
