import { COPY } from '@/modules/telegram/copy';
import { escapeHtml } from '@/modules/telegram/formatters';
import { navRow, taskItemKeyboard, tasksFilterKeyboard } from '@/modules/telegram/keyboards';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';
import type { BotContext } from '@/modules/telegram/types';
import type { Task } from '@/types/database';

const LIST_LIMIT = 8;

export async function fetchOpenTasks(ctx: BotContext) {
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

async function getOwnedTask(ctx: BotContext, taskId: string) {
  const { data } = await ctx.supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .eq('user_id', ctx.connection.user_id)
    .maybeSingle();

  return data as Task | null;
}

export async function listTasks(ctx: BotContext, filter: 'open' | 'done') {
  const copy = COPY[ctx.locale];
  const tasks = filter === 'done' ? await fetchDoneTasks(ctx) : await fetchOpenTasks(ctx);
  const title = filter === 'done' ? copy.doneTasksTitle : copy.tasksTitle;
  const empty = filter === 'done' ? copy.emptyDoneTasks : copy.emptyTasks;
  const refresh = filter === 'done' ? 'nav:tasks:done' : 'nav:tasks';

  if (!tasks.length) {
    await sendTelegramMessage(ctx.chatId, empty, tasksFilterKeyboard(ctx.locale));
    return;
  }

  await sendTelegramMessage(ctx.chatId, `<b>${escapeHtml(title)}</b>`, tasksFilterKeyboard(ctx.locale));

  for (const [index, task] of tasks.entries()) {
    const due = task.due_date ? ` (${task.due_date})` : '';
    const status = task.status !== 'todo' ? ` [${task.status}]` : '';
    const text = `${index + 1}. <b>${escapeHtml(task.title)}</b>${due}${status}`;
    const markup = filter === 'open' ? taskItemKeyboard(ctx.locale, task) : navRow(ctx.locale, refresh);
    await sendTelegramMessage(ctx.chatId, text, markup);
  }
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

export async function updateTaskStatusById(ctx: BotContext, taskId: string, status: 'in_progress' | 'done') {
  const task = await getOwnedTask(ctx, taskId);
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
    `${copy.updated} <b>${escapeHtml(task.title)}</b>`,
  );
}

export async function editTaskTitleById(ctx: BotContext, taskId: string, title: string) {
  const task = await getOwnedTask(ctx, taskId);
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

  await sendTelegramMessage(ctx.chatId, `${copy.updated} <b>${escapeHtml(cleanTitle)}</b>`);
}

export async function editTaskDueDateById(ctx: BotContext, taskId: string, dueDate: string) {
  const task = await getOwnedTask(ctx, taskId);
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

  await sendTelegramMessage(ctx.chatId, `${copy.updated} <b>${escapeHtml(task.title)}</b> → ${dueDate}`);
}

export async function deleteTaskById(ctx: BotContext, taskId: string) {
  const task = await getOwnedTask(ctx, taskId);
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

  await sendTelegramMessage(ctx.chatId, `${copy.deleted} <b>${escapeHtml(task.title)}</b>`);
}

export async function updateTaskStatus(ctx: BotContext, index: number, status: 'in_progress' | 'done') {
  const task = await getOpenTaskByIndex(ctx, index);
  if (!task) {
    await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].taskNotFound);
    return;
  }
  await updateTaskStatusById(ctx, task.id, status);
}

export async function editTaskTitle(ctx: BotContext, index: number, title: string) {
  const task = await getOpenTaskByIndex(ctx, index);
  if (!task) {
    await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].taskNotFound);
    return;
  }
  await editTaskTitleById(ctx, task.id, title);
}

export async function editTaskDueDate(ctx: BotContext, index: number, dueDate: string) {
  const task = await getOpenTaskByIndex(ctx, index);
  if (!task) {
    await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].taskNotFound);
    return;
  }
  await editTaskDueDateById(ctx, task.id, dueDate);
}

export async function deleteTask(ctx: BotContext, index: number) {
  const task = await getOpenTaskByIndex(ctx, index);
  if (!task) {
    await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].taskNotFound);
    return;
  }
  await deleteTaskById(ctx, task.id);
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

  if (!tasks.length) {
    await sendTelegramMessage(ctx.chatId, copy.noDailyTasks);
    return;
  }

  await sendTelegramMessage(ctx.chatId, `<b>${escapeHtml(copy.dailyTitle)}</b>`);
  for (const task of tasks) {
    const due = task.due_date ? ` (${task.due_date})` : '';
    await sendTelegramMessage(
      ctx.chatId,
      `<b>${escapeHtml(task.title)}</b>${due}`,
      taskItemKeyboard(ctx.locale, task),
    );
  }
}
