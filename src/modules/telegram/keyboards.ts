import type { Locale } from '@/i18n/config';
import type { Budget, CreditCard, Task, Transaction } from '@/types/database';
import type { TelegramInlineKeyboardButton, TelegramReplyMarkup } from '@/modules/telegram/telegram-api';

const MENU = {
  ru: {
    tasks: 'Задачи',
    tasksDone: 'Выполненные',
    finances: 'Транзакции',
    report: 'Отчёт',
    budgets: 'Бюджеты',
    cards: 'Кредитки',
    addTask: 'Добавить дело',
    addExpense: 'Расход',
    addIncome: 'Доход',
    start: 'В работу',
    done: 'Готово',
    rename: 'Переименовать',
    due: 'Срок',
    del: 'Удалить',
    amount: 'Сумма',
    note: 'Заметка',
    date: 'Дата',
    pay: 'Оплатить',
    archive: 'Архив',
    budget: 'Лимит',
    refresh: 'Обновить',
    back: 'Меню',
  },
  en: {
    tasks: 'Tasks',
    tasksDone: 'Completed',
    finances: 'Transactions',
    report: 'Report',
    budgets: 'Budgets',
    cards: 'Cards',
    addTask: 'Add task',
    addExpense: 'Expense',
    addIncome: 'Income',
    start: 'Start',
    done: 'Done',
    rename: 'Rename',
    due: 'Due date',
    del: 'Delete',
    amount: 'Amount',
    note: 'Note',
    date: 'Date',
    pay: 'Pay',
    archive: 'Archive',
    budget: 'Limit',
    refresh: 'Refresh',
    back: 'Menu',
  },
} as const;

export function getMenuLabels(locale: Locale) {
  return MENU[locale];
}

export function mainMenuKeyboard(locale: Locale): TelegramReplyMarkup {
  const m = MENU[locale];
  return {
    keyboard: [
      [{ text: m.tasks }, { text: m.finances }, { text: m.report }],
      [{ text: m.budgets }, { text: m.cards }, { text: m.addTask }],
      [{ text: m.addExpense }, { text: m.addIncome }],
    ],
    resize_keyboard: true,
  };
}

export function navRow(locale: Locale, extra?: string): TelegramReplyMarkup {
  const m = MENU[locale];
  const row: TelegramInlineKeyboardButton[] = [{ text: m.back, callback_data: 'nav:menu' }];
  if (extra) row.unshift({ text: m.refresh, callback_data: extra });
  return { inline_keyboard: [row] };
}

export function taskItemKeyboard(locale: Locale, task: Task): TelegramReplyMarkup {
  const m = MENU[locale];
  const id = task.id;
  return {
    inline_keyboard: [[
      { text: m.start, callback_data: `t:go:${id}` },
      { text: m.done, callback_data: `t:ok:${id}` },
      { text: m.rename, callback_data: `t:ren:${id}` },
      { text: m.due, callback_data: `t:due:${id}` },
      { text: m.del, callback_data: `t:del:${id}` },
    ]],
  };
}

export function txItemKeyboard(locale: Locale, tx: Transaction): TelegramReplyMarkup {
  const m = MENU[locale];
  const id = tx.id;
  return {
    inline_keyboard: [[
      { text: m.amount, callback_data: `x:amt:${id}` },
      { text: m.note, callback_data: `x:nte:${id}` },
      { text: m.date, callback_data: `x:dat:${id}` },
      { text: m.del, callback_data: `x:del:${id}` },
    ]],
  };
}

export function cardItemKeyboard(locale: Locale, card: CreditCard): TelegramReplyMarkup {
  const m = MENU[locale];
  const id = card.id;
  return {
    inline_keyboard: [[
      { text: m.pay, callback_data: `c:pay:${id}` },
      { text: m.archive, callback_data: `c:arc:${id}` },
    ]],
  };
}

export function budgetItemKeyboard(locale: Locale, budget: Budget): TelegramReplyMarkup {
  const m = MENU[locale];
  return {
    inline_keyboard: [[
      { text: m.budget, callback_data: `b:set:${budget.category_id}` },
    ]],
  };
}

export function tasksFilterKeyboard(locale: Locale): TelegramReplyMarkup {
  const m = MENU[locale];
  return {
    inline_keyboard: [[
      { text: m.tasks, callback_data: 'nav:tasks' },
      { text: m.tasksDone, callback_data: 'nav:tasks:done' },
      { text: m.back, callback_data: 'nav:menu' },
    ]],
  };
}
