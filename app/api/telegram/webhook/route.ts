import { NextResponse, type NextRequest } from 'next/server';
import { handleTelegramUpdate, type TelegramUpdate } from '@/modules/telegram/bot';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';

export const runtime = 'nodejs';

async function notifyWebhookFailure(update: TelegramUpdate, error: unknown) {
  const chatId = update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;
  if (!chatId || !process.env.TELEGRAM_BOT_TOKEN) return;

  const message = error instanceof Error ? error.message : 'Unknown server error';
  try {
    await sendTelegramMessage(
      chatId,
      `Personal Hub bot error: ${message}. Check Vercel env vars TELEGRAM_BOT_TOKEN and SUPABASE_SERVICE_ROLE_KEY, then register webhook again.`,
    );
  } catch {
    // Ignore secondary Telegram failures.
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: 'Telegram webhook is active. Telegram must send POST requests here.' });
}

export async function POST(request: NextRequest) {
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (expectedSecret) {
    const actualSecret = request.headers.get('x-telegram-bot-api-secret-token');
    if (actualSecret !== expectedSecret) {
      console.error('Telegram webhook rejected: secret mismatch');
      return NextResponse.json({ ok: false, error: 'secret_mismatch' }, { status: 401 });
    }
  }

  let update: TelegramUpdate | null = null;

  try {
    update = (await request.json()) as TelegramUpdate;
    const label = update.message?.text ?? update.callback_query?.data ?? '(no payload)';
    console.log('Telegram webhook update', update.update_id, label);
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    if (update) {
      await notifyWebhookFailure(update, error);
    }
    return NextResponse.json({ ok: true });
  }
}
