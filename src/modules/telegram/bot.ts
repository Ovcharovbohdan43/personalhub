import { createAdminClient } from '@/lib/supabase/admin';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';
import type { Locale } from '@/i18n/config';
import type { Task, TelegramConnection } from '@/types/database';

type TelegramUser = {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
};

type TelegramMessage = {
  message_id: number;
  text?: string;
  chat: { id: number; type: string };
  from?: TelegramUser;
};

export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
};

type LinkTokenRow = {
  id: string;
  user_id: string;
  preferred_locale: Locale;
  expires_at: string;
  used_at: string | null;
};

const COPY = {
  ru: {
    linked: 'Готово, Telegram подключён к Personal Hub. Теперь отправь мне текст дела, и я добавлю его в список задач.',
    invalidToken: 'Код привязки недействителен или истёк. Сгенерируй новый код в Settings → Telegram.',
    notLinked: 'Сначала подключи Telegram в Personal Hub: Settings → Telegram, затем отправь /start с кодом.',
    help: 'Команды:\n/add Купить молоко — добавить дело\n/tasks — показать открытые дела\nЛюбое обычное сообщение тоже добавляется как дело.',
    emptyTasks: 'Открытых дел пока нет.',
    added: 'Добавил дело:',
    dailyTitle: 'Напоминание на сегодня',
    noDailyTasks: 'На сегодня открытых дел нет.',
    tasksTitle: 'Открытые дела',
  },
  en: {
    linked: 'Done, Telegram is connected to Personal Hub. Send me a task text and I will add it to your task list.',
    invalidToken: 'The link code is invalid or expired. Generate a new code in Settings → Telegram.',
    notLinked: 'Connect Telegram in Personal Hub first: Settings → Telegram, then send /start with the code.',
    help: 'Commands:\n/add Buy milk — add a task\n/tasks — show open tasks\nAny regular message is also added as a task.',
    emptyTasks: 'No open tasks yet.',
    added: 'Added task:',
    dailyTitle: 'Daily reminder',
    noDailyTasks: 'No open tasks for today.',
    tasksTitle: 'Open tasks',
  },
} satisfies Record<Locale, Record<string, string>>;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function normalizeTaskTitle(text: string) {
  return text.replace(/^\/add(@\w+)?\s*/i, '').trim();
}

function formatTaskList(tasks: Task[], locale: Locale, title: string) {
  const lines = tasks.slice(0, 10).map((task, index) => {
    const due = task.due_date ? ` (${task.due_date})` : '';
    return `${index + 1}. ${escapeHtml(task.title)}${due}`;
  });

  return `<b>${escapeHtml(title)}</b>\n${lines.join('\n')}`;
}

async function findConnection(chatId: number) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('telegram_connections')
    .select('*')
    .eq('chat_id', chatId)
    .maybeSingle();

  return data as TelegramConnection | null;
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

async function addTaskFromMessage(connection: TelegramConnection, title: string) {
  const supabase = createAdminClient();
  const cleanTitle = title.trim().slice(0, 240);
  if (!cleanTitle) return;

  const { error } = await supabase
    .from('tasks')
    .insert({
      user_id: connection.user_id,
      title: cleanTitle,
      status: 'todo',
      priority: 2,
      due_date: new Date().toISOString().slice(0, 10),
      project_id: null,
    });

  if (error) throw error;

  await sendTelegramMessage(
    connection.chat_id,
    `${COPY[connection.preferred_locale].added} <b>${escapeHtml(cleanTitle)}</b>`,
  );
}

async function sendOpenTasks(connection: TelegramConnection) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', connection.user_id)
    .in('status', ['todo', 'in_progress'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(10);

  const tasks = (data ?? []) as Task[];
  const copy = COPY[connection.preferred_locale];
  await sendTelegramMessage(
    connection.chat_id,
    tasks.length ? formatTaskList(tasks, connection.preferred_locale, copy.tasksTitle) : copy.emptyTasks,
  );
}

export async function handleTelegramUpdate(update: TelegramUpdate) {
  const message = update.message;
  const text = message?.text?.trim();
  if (!message || !text || message.chat.type !== 'private') return;

  const [command, maybeToken] = text.split(/\s+/, 2);
  if (command.startsWith('/start')) {
    await handleStart(message, maybeToken);
    return;
  }

  const connection = await findConnection(message.chat.id);
  if (!connection) {
    await sendTelegramMessage(message.chat.id, COPY.ru.notLinked);
    return;
  }

  if (command.startsWith('/help')) {
    await sendTelegramMessage(connection.chat_id, COPY[connection.preferred_locale].help);
    return;
  }

  if (command.startsWith('/tasks')) {
    await sendOpenTasks(connection);
    return;
  }

  const title = command.startsWith('/add') ? normalizeTaskTitle(text) : text;
  await addTaskFromMessage(connection, title);
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
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', connection.user_id)
      .in('status', ['todo', 'in_progress'])
      .or(`due_date.is.null,due_date.lte.${today}`)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .limit(10);

    const tasks = (data ?? []) as Task[];
    const copy = COPY[connection.preferred_locale];
    await sendTelegramMessage(
      connection.chat_id,
      tasks.length ? formatTaskList(tasks, connection.preferred_locale, copy.dailyTitle) : copy.noDailyTasks,
    );
    sent += 1;
  }

  return { sent };
}
