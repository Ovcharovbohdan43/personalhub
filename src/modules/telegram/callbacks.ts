import { COPY } from '@/modules/telegram/copy';
import {
  archiveCardById,
  deleteTransactionById,
  listBudgets,
  listCards,
  listTransactions,
  payCardById,
  setBudgetByCategoryId,
  showFinanceReport,
} from '@/modules/telegram/finance-commands';
import { mainMenuKeyboard } from '@/modules/telegram/keyboards';
import {
  deleteTaskById,
  listTasks,
  updateTaskStatusById,
} from '@/modules/telegram/task-commands';
import { setPendingAction } from '@/modules/telegram/pending-actions';
import { answerCallbackQuery, sendTelegramMessage } from '@/modules/telegram/telegram-api';
import { showMainMenu } from '@/modules/telegram/commands';
import type { BotContext } from '@/modules/telegram/types';

export async function handleCallbackQuery(ctx: BotContext, callbackId: string, data: string) {
  const copy = COPY[ctx.locale];

  try {
    if (data === 'nav:menu') {
      await showMainMenu(ctx);
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (data === 'nav:tasks') {
      await listTasks(ctx, 'open');
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (data === 'nav:tasks:done') {
      await listTasks(ctx, 'done');
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (data === 'nav:tx') {
      await listTransactions(ctx);
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (data === 'nav:fin') {
      await showFinanceReport(ctx);
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (data === 'nav:budget') {
      await listBudgets(ctx);
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (data === 'nav:cards') {
      await listCards(ctx);
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    const [prefix, action, id] = data.split(':');

    if (prefix === 't' && id) {
      if (action === 'go') await updateTaskStatusById(ctx, id, 'in_progress');
      if (action === 'ok') await updateTaskStatusById(ctx, id, 'done');
      if (action === 'del') await deleteTaskById(ctx, id);
      if (action === 'ren') {
        await setPendingAction(ctx.supabase, {
          chatId: ctx.chatId,
          userId: ctx.connection.user_id,
          action: 'rename_task',
          entityType: 'task',
          entityId: id,
        });
        await sendTelegramMessage(ctx.chatId, copy.promptRename, mainMenuKeyboard(ctx.locale));
      }
      if (action === 'due') {
        await setPendingAction(ctx.supabase, {
          chatId: ctx.chatId,
          userId: ctx.connection.user_id,
          action: 'due_task',
          entityType: 'task',
          entityId: id,
        });
        await sendTelegramMessage(ctx.chatId, copy.promptDue, mainMenuKeyboard(ctx.locale));
      }
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (prefix === 'x' && id) {
      if (action === 'del') await deleteTransactionById(ctx, id);
      if (action === 'amt') {
        await setPendingAction(ctx.supabase, {
          chatId: ctx.chatId,
          userId: ctx.connection.user_id,
          action: 'tx_amount',
          entityType: 'transaction',
          entityId: id,
        });
        await sendTelegramMessage(ctx.chatId, copy.promptAmount, mainMenuKeyboard(ctx.locale));
      }
      if (action === 'nte') {
        await setPendingAction(ctx.supabase, {
          chatId: ctx.chatId,
          userId: ctx.connection.user_id,
          action: 'tx_note',
          entityType: 'transaction',
          entityId: id,
        });
        await sendTelegramMessage(ctx.chatId, copy.promptNote, mainMenuKeyboard(ctx.locale));
      }
      if (action === 'dat') {
        await setPendingAction(ctx.supabase, {
          chatId: ctx.chatId,
          userId: ctx.connection.user_id,
          action: 'tx_date',
          entityType: 'transaction',
          entityId: id,
        });
        await sendTelegramMessage(ctx.chatId, copy.promptDate, mainMenuKeyboard(ctx.locale));
      }
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (prefix === 'c' && id) {
      if (action === 'arc') await archiveCardById(ctx, id);
      if (action === 'pay') {
        await setPendingAction(ctx.supabase, {
          chatId: ctx.chatId,
          userId: ctx.connection.user_id,
          action: 'card_pay',
          entityType: 'credit_card',
          entityId: id,
        });
        await sendTelegramMessage(ctx.chatId, copy.promptCardPay, mainMenuKeyboard(ctx.locale));
      }
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    if (prefix === 'b' && action === 'set' && id) {
      await setPendingAction(ctx.supabase, {
        chatId: ctx.chatId,
        userId: ctx.connection.user_id,
        action: 'budget_limit',
        entityType: 'category',
        entityId: id,
      });
      await sendTelegramMessage(ctx.chatId, copy.promptBudget, mainMenuKeyboard(ctx.locale));
      await answerCallbackQuery(callbackId, copy.actionDone);
      return;
    }

    await answerCallbackQuery(callbackId, copy.invalidCommand);
  } catch (error) {
    const message = error instanceof Error ? error.message : copy.invalidCommand;
    await answerCallbackQuery(callbackId, message);
    throw error;
  }
}
