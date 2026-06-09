const TELEGRAM_API_BASE = 'https://api.telegram.org';

export type TelegramInlineKeyboardButton = {
  text: string;
  callback_data?: string;
};

export type TelegramReplyMarkup = {
  inline_keyboard?: TelegramInlineKeyboardButton[][];
  keyboard?: TelegramInlineKeyboardButton[][];
  resize_keyboard?: boolean;
  one_time_keyboard?: boolean;
};

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

export async function sendTelegramMessage(
  chatId: number | string,
  text: string,
  replyMarkup?: TelegramReplyMarkup,
) {
  return telegramRequest('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function editTelegramMessage(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: TelegramReplyMarkup,
) {
  return telegramRequest('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    disable_web_page_preview: true,
    ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return telegramRequest('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    ...(text ? { text, show_alert: false } : {}),
  });
}

export async function setTelegramWebhook(url: string, secretToken: string) {
  return telegramRequest('setWebhook', {
    url,
    secret_token: secretToken,
    allowed_updates: ['message', 'callback_query'],
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
