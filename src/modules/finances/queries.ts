import { createClient } from '@/lib/supabase/server';
import { monthBounds } from '@/lib/format';
import { getCreditCards } from '@/modules/finances/credit-cards';
import { getCurrentFinancePeriod } from '@/modules/finances/periods';
import type { Budget, ExpenseCategory, Transaction } from '@/types/database';

export type FinanceFilters = {
  month?: string;
  categoryId?: string;
  type?: 'income' | 'expense';
};

export async function getFinanceOverview(filters: FinanceFilters = {}) {
  const supabase = await createClient();
  const baseDate = filters.month ? new Date(`${filters.month}-01`) : new Date();
  const period = filters.month ? { ...monthBounds(baseDate), source: 'calendar' as const, period: null } : await getCurrentFinancePeriod(supabase);
  const { start, end } = period;

  let txQuery = supabase
    .from('transactions')
    .select('*, expense_categories(name,color), credit_cards(name)')
    .gte('occurred_on', start)
    .lte('occurred_on', end)
    .order('occurred_on', { ascending: false });

  if (filters.categoryId) txQuery = txQuery.eq('category_id', filters.categoryId);
  if (filters.type) txQuery = txQuery.eq('type', filters.type);

  const [txRes, catRes, budgetRes, creditCards] = await Promise.all([
    txQuery,
    supabase.from('expense_categories').select('*').order('name'),
    supabase.from('budgets').select('*, expense_categories(name,color)').lte('period_start', end).gte('period_end', start),
    getCreditCards(),
  ]);

  const transactions = (txRes.data ?? []) as Transaction[];
  const categories = (catRes.data ?? []) as ExpenseCategory[];
  const budgets = (budgetRes.data ?? []) as Budget[];

  const income = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);

  const spentByCategory = categories.map((cat) => {
    const spent = transactions.filter((t) => t.category_id === cat.id && t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    const budget = budgets.find((b) => b.category_id === cat.id);
    const limit = budget ? Number(budget.limit_amount) : 0;
    const percent = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : spent > 0 ? 100 : 0;
    return { ...cat, spent, limit, percent };
  }).filter((c) => c.spent > 0 || c.limit > 0).sort((a, b) => b.spent - a.spent);

  const dailyCashflow = buildDailyCashflow(transactions, start, end);

  return {
    transactions,
    categories,
    budgets,
    income,
    expense,
    balance: income - expense,
    spentByCategory,
    creditCards,
    creditSummary: {
      totalLimit: creditCards.reduce((sum, card) => sum + card.credit_limit, 0),
      totalDebt: creditCards.reduce((sum, card) => sum + card.current_balance, 0),
      totalAvailable: creditCards.reduce((sum, card) => sum + card.availableLimit, 0),
      totalMonthlyPayment: creditCards.reduce((sum, card) => sum + card.monthly_payment, 0),
    },
    dailyCashflow,
    dailyExpenses: dailyCashflow.map((day) => ({
      date: day.date,
      amount: day.expense,
      percent: day.expensePercent,
    })),
    period,
  };
}

function buildDailyCashflow(transactions: Transaction[], start: string, end: string) {
  const expenseMap = new Map<string, number>();
  const incomeMap = new Map<string, number>();

  for (const t of transactions) {
    const amount = Number(t.amount);
    const targetMap = t.type === 'income' ? incomeMap : expenseMap;
    targetMap.set(t.occurred_on, (targetMap.get(t.occurred_on) ?? 0) + amount);
  }

  const today = new Date();
  const endDate = new Date(end);
  const visibleEnd = today < endDate ? today : endDate;
  const cursor = new Date(start);
  const days: { date: string; income: number; expense: number; net: number }[] = [];

  while (cursor <= visibleEnd) {
    const key = cursor.toISOString().slice(0, 10);
    const income = incomeMap.get(key) ?? 0;
    const expense = expenseMap.get(key) ?? 0;
    days.push({ date: key, income, expense, net: income - expense });
    cursor.setDate(cursor.getDate() + 1);
  }

  const maxIncome = Math.max(...days.map((d) => d.income), 1);
  const maxExpense = Math.max(...days.map((d) => d.expense), 1);
  const maxTotal = Math.max(maxIncome, maxExpense, 1);

  return days.map((d) => ({
    ...d,
    incomePercent: Math.round((d.income / maxTotal) * 100),
    expensePercent: Math.round((d.expense / maxTotal) * 100),
  }));
}
