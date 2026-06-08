import { NextResponse, type NextRequest } from 'next/server';
import { handleTelegramUpdate, type TelegramUpdate } from '@/modules/telegram/bot';

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const actualSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (actualSecret !== expectedSecret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    // Always return 200 so Telegram does not keep retrying forever.
    return NextResponse.json({ ok: true });
  }
}
