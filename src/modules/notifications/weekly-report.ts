import { createClient } from '@/lib/supabase/server';
import { formatMoney } from '@/lib/format';
import { getServerLocale } from '@/lib/locale';
import type { Locale } from '@/i18n/config';
import type { AppNotification, Transaction } from '@/types/database';

type ReportTransaction = Transaction & {
  expense_categories?: { name: string | null; color?: string | null } | { name: string | null; color?: string | null }[] | null;
  credit_cards?: { name: string | null } | { name: string | null }[] | null;
};

type WeeklyNotificationKey = Pick<AppNotification, 'id' | 'period_start' | 'period_end'>;

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

export function getCalendarWeekRange(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start: toDateKey(start), end: toDateKey(end) };
}

function getReportCopy(locale: Locale) {
  return locale === 'en'
    ? {
        uncategorized: 'Uncategorized',
        creditCardPayment: 'Credit card payment',
        noCreditPayments: 'No credit card payments this week',
        noCategoryExpenses: 'No categorized expenses this week',
        income: 'Income',
        expense: 'Expenses',
        balance: 'Weekly balance',
        creditPayments: 'Credit card payments',
        topExpenses: 'Top expenses',
        title: 'Weekly report',
      }
    : {
        uncategorized: 'Без категории',
        creditCardPayment: 'Оплата кредитки',
        noCreditPayments: 'Платежей по кредиткам не было',
        noCategoryExpenses: 'Расходов по категориям не было',
        income: 'Доходы',
        expense: 'Расходы',
        balance: 'Баланс недели',
        creditPayments: 'Платежи по кредиткам',
        topExpenses: 'Топ расходов',
        title: 'Недельный отчёт',
      };
}

function overlapsRange(notification: WeeklyNotificationKey, start: string, end: string) {
  if (!notification.period_start || !notification.period_end) return false;
  return notification.period_start <= end && notification.period_end >= start;
}

function isCanonicalWeek(notification: WeeklyNotificationKey, start: string, end: string) {
  return notification.period_start === start && notification.period_end === end;
}

export async function ensureWeeklyReportNotification(locale?: Locale) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const reportLocale = locale ?? await getServerLocale();
  const copy = getReportCopy(reportLocale);
  const { start, end } = getCalendarWeekRange();

  const { data: notificationKeys } = await supabase
    .from('app_notifications')
    .select('id, period_start, period_end')
    .eq('user_id', user.id)
    .eq('type', 'weekly_report')
    .order('created_at', { ascending: false })
    .limit(20);

  const duplicateIds = ((notificationKeys ?? []) as WeeklyNotificationKey[])
    .filter((notification) => overlapsRange(notification, start, end) && !isCanonicalWeek(notification, start, end))
    .map((notification) => notification.id);

  if (duplicateIds.length > 0) {
    await supabase
      .from('app_notifications')
      .delete()
      .eq('user_id', user.id)
      .in('id', duplicateIds);
  }

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
    const category = relationName(tx.expense_categories) ?? copy.uncategorized;
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + Number(tx.amount));
  }

  const topCategories = [...categoryTotals.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  const paymentLines = creditPayments.slice(0, 5).map((tx) => ({
    title: tx.note ?? copy.creditCardPayment,
    card: relationName(tx.credit_cards),
    amount: Number(tx.amount),
    date: tx.occurred_on,
  }));

  const bodyParts = [
    `${copy.income}: ${formatMoney(income)}`,
    `${copy.expense}: ${formatMoney(expense)}`,
    `${copy.balance}: ${formatMoney(income - expense)}`,
    creditPaymentTotal > 0 ? `${copy.creditPayments}: ${formatMoney(creditPaymentTotal)}` : copy.noCreditPayments,
    topCategories.length
      ? `${copy.topExpenses}: ${topCategories.map((item) => `${item.name} ${formatMoney(item.amount)}`).join(', ')}`
      : copy.noCategoryExpenses,
  ];

  const payload = {
    income,
    expense,
    balance: income - expense,
    creditPaymentTotal,
    transactionCount: transactions.length,
    topCategories,
    creditPayments: paymentLines,
    locale: reportLocale,
  };

  if (existing) {
    const { data: updated } = await supabase
      .from('app_notifications')
      .update({
        title: `${copy.title}: ${start} — ${end}`,
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
      title: `${copy.title}: ${start} — ${end}`,
      body: bodyParts.join('\n'),
      payload,
      period_start: start,
      period_end: end,
    })
    .select('*')
    .single();

  return (inserted ?? null) as AppNotification | null;
}

export async function getNotifications(locale?: Locale) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  await ensureWeeklyReportNotification(locale);

  const { data } = await supabase
    .from('app_notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (data ?? []) as AppNotification[];
}
