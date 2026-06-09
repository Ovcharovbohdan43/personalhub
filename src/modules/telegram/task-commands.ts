import { COPY } from '@/modules/telegram/copy';
import { escapeHtml, formatTaskList } from '@/modules/telegram/formatters';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';
import type { BotContext } from '@/modules/telegram/types';
import type { Task } from '@/types/database';

const LIST_LIMIT = 10;

async function fetchOpenTasks(ctx: BotContext) {
  const { data } = await ctx.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', ctx.connection.user_id)
    .in('status', ['todo', 'in_progress'])
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  return (data ?? []) as Task[];
}

async function fetchDoneTasks(ctx: BotContext) {
  const { data } = await ctx.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', ctx.connection.user_id)
    .eq('status', 'done')
    .order('completed_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  return (data ?? []) as Task[];
}

async function getOpenTaskByIndex(ctx: BotContext, index: number) {
  const tasks = await fetchOpenTasks(ctx);
  return tasks[index - 1] ?? null;
}

export async function listTasks(ctx: BotContext, filter: 'open' | 'done') {
  const copy = COPY[ctx.locale];
  const tasks = filter === 'done' ? await fetchDoneTasks(ctx) : await fetchOpenTasks(ctx);
  const title = filter === 'done' ? copy.doneTasksTitle : copy.tasksTitle;
  const empty = filter === 'done' ? copy.emptyDoneTasks : copy.emptyTasks;

  await sendTelegramMessage(
    ctx.chatId,
    tasks.length ? formatTaskList(tasks, title) : empty,
  );
}

export async function addTask(ctx: BotContext, title: string) {
  const cleanTitle = title.trim().slice(0, 240);
  if (!cleanTitle) return;

  const { error } = await ctx.supabase.from('tasks').insert({
    user_id: ctx.connection.user_id,
    title: cleanTitle,
    status: 'todo',
    priority: 2,
    due_date: new Date().toISOString().slice(0, 10),
    project_id: null,
  });

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${COPY[ctx.locale].added} <b>${escapeHtml(cleanTitle)}</b>`,
  );
}

export async function updateTaskStatus(ctx: BotContext, index: number, status: 'in_progress' | 'done') {
  const task = await getOpenTaskByIndex(ctx, index);
  const copy = COPY[ctx.locale];
  if (!task) {
    await sendTelegramMessage(ctx.chatId, copy.taskNotFound);
    return;
  }

  const { error } = await ctx.supabase
    .from('tasks')
    .update({
      status,
      completed_at: status === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', task.id)
    .eq('user_id', ctx.connection.user_id);

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.updated} <b>${escapeHtml(task.title)}</b> → ${status}`,
  );
}

export async function editTaskTitle(ctx: BotContext, index: number, title: string) {
  const task = await getOpenTaskByIndex(ctx, index);
  const copy = COPY[ctx.locale];
  if (!task) {
    await sendTelegramMessage(ctx.chatId, copy.taskNotFound);
    return;
  }

  const cleanTitle = title.trim().slice(0, 240);
  const { error } = await ctx.supabase
    .from('tasks')
    .update({ title: cleanTitle })
    .eq('id', task.id)
    .eq('user_id', ctx.connection.user_id);

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.updated} <b>${escapeHtml(cleanTitle)}</b>`,
  );
}

export async function editTaskDueDate(ctx: BotContext, index: number, dueDate: string) {
  const task = await getOpenTaskByIndex(ctx, index);
  const copy = COPY[ctx.locale];
  if (!task) {
    await sendTelegramMessage(ctx.chatId, copy.taskNotFound);
    return;
  }

  const { error } = await ctx.supabase
    .from('tasks')
    .update({ due_date: dueDate })
    .eq('id', task.id)
    .eq('user_id', ctx.connection.user_id);

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.updated} <b>${escapeHtml(task.title)}</b> → ${dueDate}`,
  );
}

export async function deleteTask(ctx: BotContext, index: number) {
  const task = await getOpenTaskByIndex(ctx, index);
  const copy = COPY[ctx.locale];
  if (!task) {
    await sendTelegramMessage(ctx.chatId, copy.taskNotFound);
    return;
  }

  const { error } = await ctx.supabase
    .from('tasks')
    .delete()
    .eq('id', task.id)
    .eq('user_id', ctx.connection.user_id);

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.deleted} <b>${escapeHtml(task.title)}</b>`,
  );
}

export async function sendDailyTasksForConnection(ctx: BotContext, today: string) {
  const { data } = await ctx.supabase
    .from('tasks')
    .select('*')
    .eq('user_id', ctx.connection.user_id)
    .in('status', ['todo', 'in_progress'])
    .or(`due_date.is.null,due_date.lte.${today}`)
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  const tasks = (data ?? []) as Task[];
  const copy = COPY[ctx.locale];
  await sendTelegramMessage(
    ctx.chatId,
    tasks.length ? formatTaskList(tasks, copy.dailyTitle) : copy.noDailyTasks,
  );
}
