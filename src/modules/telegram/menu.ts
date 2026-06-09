import type { Locale } from '@/i18n/config';
import type { MenuAction } from '@/modules/telegram/types';
import { getMenuLabels } from '@/modules/telegram/keyboards';

const REVERSE: Record<Locale, Record<string, MenuAction>> = {
  ru: {
    'Задачи': 'tasks',
    'Выполненные': 'tasks_done',
    'Транзакции': 'finances',
    'Отчёт': 'report',
    'Бюджеты': 'budgets',
    'Кредитки': 'cards',
    'Добавить дело': 'add_task',
    'Расход': 'add_expense',
    'Доход': 'add_income',
  },
  en: {
    'Tasks': 'tasks',
    'Completed': 'tasks_done',
    'Transactions': 'finances',
    'Report': 'report',
    'Budgets': 'budgets',
    'Cards': 'cards',
    'Add task': 'add_task',
    'Expense': 'add_expense',
    'Income': 'add_income',
  },
};

export function parseMenuButton(locale: Locale, text: string): MenuAction | null {
  return REVERSE[locale][text.trim()] ?? null;
}

export function menuWelcome(locale: Locale) {
  const m = getMenuLabels(locale);
  return locale === 'ru'
    ? `Выберите действие кнопками ниже.\n\n${m.tasks} — список дел\n${m.finances} — транзакции\n${m.report} — финансовый отчёт`
    : `Choose an action with the buttons below.\n\n${m.tasks} — task list\n${m.finances} — transactions\n${m.report} — finance report`;
}
