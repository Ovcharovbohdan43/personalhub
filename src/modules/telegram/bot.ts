import { createAdminClient } from '@/lib/supabase/admin';
import { COPY } from '@/modules/telegram/copy';
import { handleLinkedMessage } from '@/modules/telegram/commands';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';
import { sendDailyTasksForConnection } from '@/modules/telegram/task-commands';
import type { BotContext, TelegramMessage, TelegramUpdate } from '@/modules/telegram/types';
import type { Locale } from '@/i18n/config';
import type { TelegramConnection } from '@/types/database';

type LinkTokenRow = {
  id: string;
  user_id: string;
  preferred_locale: Locale;
  expires_at: string;
  used_at: string | null;
};

async function findConnection(chatId: number) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('telegram_connections')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle();

  return data as TelegramConnection | null;
}

function buildContext(connection: TelegramConnection): BotContext {
  return {
    connection,
    supabase: createAdminClient(),
    locale: connection.preferred_locale,
    chatId: connection.chat_id,
  };
}

async function handleStart(message: TelegramMessage, token: string | undefined) {
  const supabase = createAdminClient();
  const chatId = message.chat.id;
  const from = message.from;

  if (!token) {
    await sendTelegramMessage(chatId, COPY.ru.notLinked);
    return;
  }

  const { data: linkToken } = await supabase
    .from('telegram_link_tokens')
    .select('id, user_id, preferred_locale, expires_at, used_at')
    .eq('token', token)
    .is('used_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (!linkToken) {
    await sendTelegramMessage(chatId, COPY.ru.invalidToken);
    return;
  }

  const row = linkToken as LinkTokenRow;
  await supabase
    .from('telegram_connections')
    .delete()
    .or(`user_id.eq.${row.user_id},chat_id.eq.${chatId}`);

  const { error } = await supabase
    .from('telegram_connections')
    .insert({
      user_id: row.user_id,
      chat_id: chatId,
      telegram_user_id: from?.id ?? null,
      username: from?.username ?? null,
      first_name: from?.first_name ?? null,
      preferred_locale: row.preferred_locale,
      reminder_enabled: true,
      updated_at: new Date().toISOString(),
      linked_at: new Date().toISOString(),
    });

  if (error) {
    await sendTelegramMessage(chatId, COPY[row.preferred_locale].invalidToken);
    return;
  }

  await supabase
    .from('telegram_link_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', row.id);

  await sendTelegramMessage(chatId, COPY[row.preferred_locale].linked);
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  const text = message?.text?.trim();
  if (!message || !text || message.chat.type !== 'private') return;

  if (/^\/start(?:@\w+)?(?:\s|$)/i.test(text)) {
    const token = text.replace(/^\/start(?:@\w+)?\s*/i, '').trim() || undefined;
    await handleStart(message, token);
    return;
  }

  const connection = await findConnection(message.chat.id);
  if (!connection) {
    await sendTelegramMessage(message.chat.id, COPY.ru.notLinked);
    return;
  }

  await handleLinkedMessage(buildContext(connection), text);
}

export async function sendDailyTaskReminders() {
  const supabase = createAdminClient();
  const { data: connections } = await supabase
    .from('telegram_connections')
    .select('*')
    .eq('reminder_enabled', true);

  const today = new Date().toISOString().slice(0, 10);
  let sent = 0;

  for (const connection of (connections ?? []) as TelegramConnection[]) {
    await sendDailyTasksForConnection(buildContext(connection), today);
    sent += 1;
  }

  return { sent };
}

export type { TelegramUpdate } from '@/modules/telegram/types';
