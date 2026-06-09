import { COPY } from '@/modules/telegram/copy';
import {
  addCard,
  addTransaction,
  archiveCard,
  deleteTransaction,
  editTransaction,
  editTransactionById,
  listBudgets,
  listCards,
  listTransactions,
  payCard,
  payCardById,
  setBudget,
  setBudgetByCategoryId,
  showFinanceReport,
} from '@/modules/telegram/finance-commands';
import { mainMenuKeyboard } from '@/modules/telegram/keyboards';
import { menuWelcome, parseMenuButton } from '@/modules/telegram/menu';
import { parseTelegramCommand } from '@/modules/telegram/parser';
import { clearPendingAction, getPendingAction, setPendingAction } from '@/modules/telegram/pending-actions';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';
import {
  addTask,
  deleteTask,
  editTaskDueDate,
  editTaskDueDateById,
  editTaskTitle,
  editTaskTitleById,
  listTasks,
  updateTaskStatus,
} from '@/modules/telegram/task-commands';
import type { BotContext, MenuAction, ParsedCommand } from '@/modules/telegram/types';

function parseAmountNote(text: string) {
  const parts = text.trim().split(/\s+/);
  const amount = Number((parts[0] ?? '').replace(',', '.'));
  const note = parts.slice(1).join(' ').trim();
  if (!Number.isFinite(amount) || amount <= 0 || !note) return null;
  return { amount, note };
}

async function handlePendingInput(ctx: BotContext, text: string) {
  const pending = await getPendingAction(ctx.supabase, ctx.chatId);
  if (!pending || pending.user_id !== ctx.connection.user_id) return false;

  const copy = COPY[ctx.locale];

  try {
    switch (pending.action) {
      case 'add_task':
        await addTask(ctx, text);
        break;
      case 'add_expense': {
        const parsed = parseAmountNote(text);
        if (!parsed) {
          await sendTelegramMessage(ctx.chatId, copy.promptAddExpense);
          return true;
        }
        await addTransaction(ctx, { txType: 'expense', amount: parsed.amount, note: parsed.note });
        break;
      }
      case 'add_income': {
        const parsed = parseAmountNote(text);
        if (!parsed) {
          await sendTelegramMessage(ctx.chatId, copy.promptAddIncome);
          return true;
        }
        await addTransaction(ctx, { txType: 'income', amount: parsed.amount, note: parsed.note });
        break;
      }
      case 'rename_task':
        if (pending.entity_id) await editTaskTitleById(ctx, pending.entity_id, text);
        break;
      case 'due_task':
        if (pending.entity_id) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(text.trim())) {
            await sendTelegramMessage(ctx.chatId, copy.invalidDate);
            return true;
          }
          await editTaskDueDateById(ctx, pending.entity_id, text.trim());
        }
        break;
      case 'tx_amount':
        if (pending.entity_id) await editTransactionById(ctx, pending.entity_id, 'amount', text);
        break;
      case 'tx_note':
        if (pending.entity_id) await editTransactionById(ctx, pending.entity_id, 'note', text);
        break;
      case 'tx_date':
        if (pending.entity_id) await editTransactionById(ctx, pending.entity_id, 'date', text.trim());
        break;
      case 'budget_limit':
        if (pending.entity_id) {
          const amount = Number(text.replace(',', '.'));
          if (!Number.isFinite(amount) || amount <= 0) {
            await sendTelegramMessage(ctx.chatId, copy.invalidAmount);
            return true;
          }
          await setBudgetByCategoryId(ctx, pending.entity_id, amount);
        }
        break;
      case 'card_pay':
        if (pending.entity_id) {
          const amount = Number(text.replace(',', '.'));
          if (!Number.isFinite(amount) || amount <= 0) {
            await sendTelegramMessage(ctx.chatId, copy.invalidAmount);
            return true;
          }
          await payCardById(ctx, pending.entity_id, amount);
        }
        break;
      default:
        break;
    }
  } finally {
    await clearPendingAction(ctx.supabase, ctx.chatId);
  }

  return true;
}

async function startMenuAction(ctx: BotContext, action: MenuAction) {
  const copy = COPY[ctx.locale];

  switch (action) {
    case 'tasks':
      await listTasks(ctx, 'open');
      return;
    case 'tasks_done':
      await listTasks(ctx, 'done');
      return;
    case 'finances':
      await listTransactions(ctx);
      return;
    case 'report':
      await showFinanceReport(ctx);
      return;
    case 'budgets':
      await listBudgets(ctx);
      return;
    case 'cards':
      await listCards(ctx);
      return;
    case 'add_task':
      await setPendingAction(ctx.supabase, { chatId: ctx.chatId, userId: ctx.connection.user_id, action: 'add_task' });
      await sendTelegramMessage(ctx.chatId, copy.promptAddTask, mainMenuKeyboard(ctx.locale));
      return;
    case 'add_expense':
      await setPendingAction(ctx.supabase, { chatId: ctx.chatId, userId: ctx.connection.user_id, action: 'add_expense' });
      await sendTelegramMessage(ctx.chatId, copy.promptAddExpense, mainMenuKeyboard(ctx.locale));
      return;
    case 'add_income':
      await setPendingAction(ctx.supabase, { chatId: ctx.chatId, userId: ctx.connection.user_id, action: 'add_income' });
      await sendTelegramMessage(ctx.chatId, copy.promptAddIncome, mainMenuKeyboard(ctx.locale));
      return;
  }
}

export async function dispatchParsedCommand(ctx: BotContext, command: ParsedCommand) {
  switch (command.kind) {
    case 'help':
      await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].help, mainMenuKeyboard(ctx.locale));
      return;
    case 'menu':
      await startMenuAction(ctx, command.action);
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
        await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].invalidCommand, mainMenuKeyboard(ctx.locale));
        return;
      }
      await addTask(ctx, command.text);
      return;
    default:
      await sendTelegramMessage(ctx.chatId, COPY[ctx.locale].invalidCommand, mainMenuKeyboard(ctx.locale));
  }
}

export async function handleLinkedMessage(ctx: BotContext, text: string) {
  if (await handlePendingInput(ctx, text)) return;

  const menuAction = parseMenuButton(ctx.locale, text);
  if (menuAction) {
    await startMenuAction(ctx, menuAction);
    return;
  }

  const parsed = parseTelegramCommand(text);
  if (parsed.kind === 'start') {
    await sendTelegramMessage(ctx.chatId, menuWelcome(ctx.locale), mainMenuKeyboard(ctx.locale));
    return;
  }

  await dispatchParsedCommand(ctx, parsed);
}

export async function showMainMenu(ctx: BotContext) {
  await sendTelegramMessage(ctx.chatId, menuWelcome(ctx.locale), mainMenuKeyboard(ctx.locale));
}
