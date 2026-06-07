import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import type { AppNotification, Transaction } from '@/types/database';

type ReportTransaction = Transaction & {
  expense_categories?: { name: string | null; color?: string | null } | { name: string | null; color?: string | null }[] | null;
  credit_cards?: { name: string | null } | { name: string | null }[] | null;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function relationName(relation: { name: string | null } | { name: string | null }[] | null | undefined) {
  if (Array.isArray(relation)) return relation[0]?.name ?? null;
  return relation?.name ?? null;
}

function getRollingWeekRange(reference = new Date()) {
  const end = new Date(reference);
  end.setHours(0, 0, 0, 0);

  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  return { start: toDateKey(start), end: toDateKey(end) };
}

export async function ensureWeeklyReportNotification() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { start, end } = getRollingWeekRange();

  const { data: existing } = await supabase
    .from('app_notifications')
    .select('*')
    .eq('user_id', user.id)
    .eq('type', 'weekly_report')
    .eq('period_start', start)
    .eq('period_end', end)
    .maybeSingle();

  const { data } = await supabase
    .from('transactions')
    .select('*, expense_categories(name,color), credit_cards(name)')
    .eq('user_id', user.id)
    .gte('occurred_on', start)
    .lte('occurred_on', end)
    .order('occurred_on', { ascending: false });

  const transactions = (data ?? []) as ReportTransaction[];
  const income = transactions.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expense = transactions.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const creditPayments = transactions.filter((tx) => tx.credit_card_id || relationName(tx.expense_categories)?.toLowerCase() === 'оплата кредитки');
  const creditPaymentTotal = creditPayments.reduce((sum, tx) => sum + Number(tx.amount), 0);

  const categoryTotals = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    const category = relationName(tx.expense_categories) ?? 'Без категории';
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + Number(tx.amount));
  }

  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  const paymentLines = creditPayments.slice(0, 5).map((tx) => ({
    title: tx.note ?? 'Оплата кредитки',
    card: relationName(tx.credit_cards),
    amount: Number(tx.amount),
    date: tx.occurred_on,
  }));

  const bodyParts = [
    `Доходы: ${formatMoney(income)}`,
    `Расходы: ${formatMoney(expense)}`,
    `Баланс недели: ${formatMoney(income - expense)}`,
    creditPaymentTotal > 0 ? `Платежи по кредиткам: ${formatMoney(creditPaymentTotal)}` : 'Платежей по кредиткам не было',
    topCategories.length
      ? `Топ расходов: ${topCategories.map((item) => `${item.name} ${formatMoney(item.amount)}`).join(', ')}`
      : 'Расходов по категориям не было',
  ];

  const payload = {
    income,
    expense,
    balance: income - expense,
    creditPaymentTotal,
    transactionCount: transactions.length,
    topCategories,
    creditPayments: paymentLines,
  };

  if (existing) {
    const { data: updated } = await supabase
      .from('app_notifications')
      .update({
        title: `Недельный отчёт: ${start} — ${end}`,
        body: bodyParts.join('\n'),
        payload,
      })
      .eq('id', existing.id)
      .eq('user_id', user.id)
      .select('*')
      .single();

    return (updated ?? existing) as AppNotification;
  }

  const { data: inserted } = await supabase
    .from('app_notifications')
    .insert({
      user_id: user.id,
      type: 'weekly_report',
      title: `Недельный отчёт: ${start} — ${end}`,
      body: bodyParts.join('\n'),
      payload,
      period_start: start,
      period_end: end,
    })
    .select('*')
    .single();

  return (inserted ?? null) as AppNotification | null;
}

export async function getNotifications() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  await ensureWeeklyReportNotification();

  const { data } = await supabase
    .from('app_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (data ?? []) as AppNotification[];
}
