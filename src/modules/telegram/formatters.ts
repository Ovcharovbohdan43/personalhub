import type { Locale } from '@/i18n/config';
import type { Budget, CreditCard, Task, Transaction } from '@/types/database';

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatMoney(amount: number, currency = 'GBP') {
  return `${Number(amount).toFixed(2)} ${currency}`;
}

export function formatTaskList(tasks: Task[], title: string) {
  const lines = tasks.map((task, index) => {
    const due = task.due_date ? ` (${task.due_date})` : '';
    const status = task.status !== 'todo' ? ` [${task.status}]` : '';
    return `${index + 1}. ${escapeHtml(task.title)}${due}${status}`;
  });
  return `<b>${escapeHtml(title)}</b>\n${lines.join('\n')}`;
}

export function formatTransactionList(transactions: Transaction[], title: string) {
  const lines = transactions.map((tx, index) => {
    const category = tx.expense_categories?.name ? ` · ${escapeHtml(tx.expense_categories.name)}` : '';
    const sign = tx.type === 'income' ? '+' : '-';
    const note = tx.note ? ` — ${escapeHtml(tx.note)}` : '';
    return `${index + 1}. ${sign}${formatMoney(Number(tx.amount))} (${tx.occurred_on})${category}${note}`;
  });
  return `<b>${escapeHtml(title)}</b>\n${lines.join('\n')}`;
}

export function formatBudgetList(budgets: Budget[], spentByCategory: Map<string, number>, title: string) {
  const lines = budgets.map((budget, index) => {
    const name = budget.expense_categories?.name ?? '?';
    const spent = spentByCategory.get(budget.category_id) ?? 0;
    const limit = Number(budget.limit_amount);
    const percent = limit > 0 ? Math.round((spent / limit) * 100) : 0;
    return `${index + 1}. ${escapeHtml(name)}: ${formatMoney(spent)} / ${formatMoney(limit)} (${percent}%)`;
  });
  return `<b>${escapeHtml(title)}</b>\n${lines.join('\n')}`;
}

export function formatCardList(cards: CreditCard[], title: string) {
  const lines = cards.map((card, index) => {
    const limit = Number(card.credit_limit);
    const balance = Number(card.current_balance);
    const available = Math.max(0, limit - balance);
    return `${index + 1}. ${escapeHtml(card.name)}: debt ${formatMoney(balance)} / ${formatMoney(limit)} (free ${formatMoney(available)})`;
  });
  return `<b>${escapeHtml(title)}</b>\n${lines.join('\n')}`;
}

export function formatFinanceSummary(input: {
  title: string;
  income: number;
  expense: number;
  balance: number;
  periodStart: string;
  periodEnd: string;
  topCategories: { name: string; spent: number }[];
}) {
  const lines = [
    `<b>${escapeHtml(input.title)}</b>`,
    `${input.periodStart} — ${input.periodEnd}`,
    `Income: ${formatMoney(input.income)}`,
    `Expense: ${formatMoney(input.expense)}`,
    `Balance: ${formatMoney(input.balance)}`,
  ];
  if (input.topCategories.length) {
    lines.push('', 'Top categories:');
    for (const category of input.topCategories) {
      lines.push(`• ${escapeHtml(category.name)}: ${formatMoney(category.spent)}`);
    }
  }
  return lines.join('\n');
}
