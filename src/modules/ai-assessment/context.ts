import { createClient } from '@/lib/supabase/server';

function sumBy<T>(items: T[], getValue: (item: T) => number) {
  return items.reduce((sum, item) => sum + getValue(item), 0);
}

function monthsBack(months: number) {
  const date = new Date();
  date.setMonth(date.getMonth() - months);
  return date.toISOString().slice(0, 10);
}

function relationName(relation: { name: string | null } | { name: string | null }[] | null | undefined) {
  if (Array.isArray(relation)) return relation[0]?.name ?? null;
  return relation?.name ?? null;
}

export async function getFinancialAssessmentContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Не авторизован');

  const since = monthsBack(6);

  const [
    profileRes,
    transactionsRes,
    budgetsRes,
    creditCardsRes,
    tasksRes,
    projectsRes,
    notesRes,
    bookmarksRes,
    documentsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('display_name,bio').eq('id', user.id).maybeSingle(),
    supabase
      .from('transactions')
      .select('amount,type,occurred_on,note,expense_categories(name),credit_cards(name)')
      .eq('user_id', user.id)
      .gte('occurred_on', since)
      .order('occurred_on', { ascending: false })
      .limit(500),
    supabase.from('budgets').select('limit_amount,period_start,period_end,expense_categories(name)').eq('user_id', user.id),
    supabase.from('credit_cards').select('name,credit_limit,current_balance,monthly_payment,due_day,is_archived').eq('user_id', user.id).eq('is_archived', false),
    supabase.from('tasks').select('title,status,priority,due_date').eq('user_id', user.id).neq('status', 'cancelled').limit(100),
    supabase.from('projects').select('title,status,target_date').eq('user_id', user.id).neq('status', 'archived').limit(50),
    supabase.from('notes').select('title,tags,updated_at').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(30),
    supabase.from('bookmarks').select('title,type,tags,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    supabase.from('user_documents').select('title,tags,signed_by,created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
  ]);

  const transactions = transactionsRes.data ?? [];
  const creditCards = creditCardsRes.data ?? [];
  const budgets = budgetsRes.data ?? [];

  const incomeTransactions = transactions.filter((tx) => tx.type === 'income');
  const expenseTransactions = transactions.filter((tx) => tx.type === 'expense');
  const totalIncome = sumBy(incomeTransactions, (tx) => Number(tx.amount));
  const totalExpense = sumBy(expenseTransactions, (tx) => Number(tx.amount));

  const categoryMap = new Map<string, number>();
  for (const tx of expenseTransactions) {
    const category = relationName(tx.expense_categories) ?? 'Без категории';
    categoryMap.set(category, (categoryMap.get(category) ?? 0) + Number(tx.amount));
  }

  const topExpenseCategories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([name, amount]) => ({ name, amount }));

  const creditDebt = sumBy(creditCards, (card) => Number(card.current_balance));
  const creditLimit = sumBy(creditCards, (card) => Number(card.credit_limit));
  const monthlyCreditPayments = sumBy(creditCards, (card) => Number(card.monthly_payment));

  return {
    generatedAt: new Date().toISOString(),
    currency: 'GBP',
    profile: profileRes.data ?? null,
    period: { since, until: new Date().toISOString().slice(0, 10), months: 6 },
    summary: {
      transactionCount: transactions.length,
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      averageMonthlyIncome: totalIncome / 6,
      averageMonthlyExpense: totalExpense / 6,
      creditDebt,
      creditLimit,
      creditAvailable: Math.max(0, creditLimit - creditDebt),
      monthlyCreditPayments,
      creditUtilizationPercent: creditLimit > 0 ? Math.round((creditDebt / creditLimit) * 100) : 0,
    },
    topExpenseCategories,
    recentTransactions: transactions.slice(0, 40).map((tx) => ({
      amount: Number(tx.amount),
      type: tx.type,
      date: tx.occurred_on,
      note: tx.note,
      category: relationName(tx.expense_categories),
      creditCard: relationName(tx.credit_cards),
    })),
    budgets: budgets.map((budget) => ({
      category: relationName(budget.expense_categories) ?? 'Без категории',
      limit: Number(budget.limit_amount),
      periodStart: budget.period_start,
      periodEnd: budget.period_end,
    })),
    creditCards: creditCards.map((card) => ({
      name: card.name,
      limit: Number(card.credit_limit),
      debt: Number(card.current_balance),
      available: Math.max(0, Number(card.credit_limit) - Number(card.current_balance)),
      monthlyPayment: Number(card.monthly_payment),
      payoffMonths: Number(card.monthly_payment) > 0 ? Math.ceil(Number(card.current_balance) / Number(card.monthly_payment)) : null,
      dueDay: card.due_day,
    })),
    tasks: tasksRes.data ?? [],
    projects: projectsRes.data ?? [],
    notesMeta: notesRes.data ?? [],
    bookmarksMeta: bookmarksRes.data ?? [],
    documentsMeta: documentsRes.data ?? [],
  };
}
