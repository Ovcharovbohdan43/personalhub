import { COPY } from '@/modules/telegram/copy';
import {
  addCard,
  addTransaction,
  archiveCard,
  deleteTransaction,
  editTransaction,
  listBudgets,
  listCards,
  listTransactions,
  payCard,
  setBudget,
  showFinanceReport,
} from '@/modules/telegram/finance-commands';
import { parseTelegramCommand } from '@/modules/telegram/parser';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';
import {
  addTask,
  deleteTask,
  editTaskDueDate,
  editTaskTitle,
  listTasks,
  updateTaskStatus,
} from '@/modules/telegram/task-commands';
import type { BotContext, ParsedCommand } from '@/modules/telegram/types';

export async function dispatchParsedCommand(ctx: BotContext, command: ParsedCommand) {
  switch (command.kind) {
    case 'help':
      await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].help);
      return;
    case 'tasks':
      await listTasks(ctx, command.filter);
      return;
    case 'task_add':
      await addTask(ctx, command.title);
      return;
    case 'task_status':
      await updateTaskStatus(ctx, command.index, command.status);
      return;
    case 'task_edit':
      await editTaskTitle(ctx, command.index, command.title);
      return;
    case 'task_due':
      await editTaskDueDate(ctx, command.index, command.dueDate);
      return;
    case 'task_delete':
      await deleteTask(ctx, command.index);
      return;
    case 'fin':
      await showFinanceReport(ctx);
      return;
    case 'tx_list':
      await listTransactions(ctx);
      return;
    case 'tx_add':
      await addTransaction(ctx, command);
      return;
    case 'tx_edit':
      await editTransaction(ctx, command.index, command.field, command.value);
      return;
    case 'tx_delete':
      await deleteTransaction(ctx, command.index);
      return;
    case 'budget_list':
      await listBudgets(ctx);
      return;
    case 'budget_set':
      await setBudget(ctx, command.categoryName, command.limitAmount);
      return;
    case 'cards_list':
      await listCards(ctx);
      return;
    case 'card_add':
      await addCard(ctx, command.name, command.creditLimit);
      return;
    case 'card_pay':
      await payCard(ctx, command.index, command.amount);
      return;
    case 'card_archive':
      await archiveCard(ctx, command.index);
      return;
    case 'plain_text':
      if (command.text.startsWith('/')) {
        await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].invalidCommand);
        return;
      }
      await addTask(ctx, command.text);
      return;
    default:
      await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].invalidCommand);
  }
}

export async function handleLinkedMessage(ctx: BotContext, text: string) {
  const parsed = parseTelegramCommand(text);
  if (parsed.kind === 'start') {
    await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].help);
    return;
  }
  await dispatchParsedCommand(ctx, parsed);
}
