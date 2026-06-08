const TELEGRAM_API_BASE = 'https://api.telegram.org';

type TelegramApiResponse<T> = {
  ok: boolean;
  result?: T;
  description?: string;
};

function getBotToken() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Missing TELEGRAM_BOT_TOKEN.');
  return token;
}

async function telegramRequest<T>(method: string, body: Record<string, unknown>) {
  const response = await fetch(`${TELEGRAM_API_BASE}/bot${getBotToken()}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const payload = (await response.json()) as TelegramApiResponse<T>;

  if (!response.ok || !payload.ok) {
    throw new Error(payload.description ?? `Telegram ${method} failed.`);
  }

  return payload.result as T;
}

export async function sendTelegramMessage(chatId: number | string, text: string) {
  return telegramRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
  });
}

export async function setTelegramWebhook(url: string, secretToken: string) {
  return telegramRequest('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message'],
  });
}

export async function getTelegramWebhookInfo() {
  return telegramRequest<{
    url?: string;
    has_custom_certificate?: boolean;
    pending_update_count?: number;
    last_error_message?: string | null;
  }>('getWebhookInfo', {});
}
