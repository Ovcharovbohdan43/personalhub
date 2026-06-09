import { findCategoryByName, getCurrentFinancePeriodForUser } from '@/modules/telegram/db-helpers';
import { COPY } from '@/modules/telegram/copy';
import {
  escapeHtml,
  formatBudgetList,
  formatCardList,
  formatFinanceSummary,
  formatMoney,
  formatTransactionList,
} from '@/modules/telegram/formatters';
import { sendTelegramMessage } from '@/modules/telegram/telegram-api';
import type { BotContext } from '@/modules/telegram/types';
import type { Budget, CreditCard, ExpenseCategory, Transaction } from '@/types/database';

const LIST_LIMIT = 10;

async function fetchRecentTransactions(ctx: BotContext) {
  const { data } = await ctx.supabase
    .from('transactions')
    .select('*, expense_categories(name,color), credit_cards(name)')
    .eq('user_id', ctx.connection.user_id)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  return (data ?? []) as Transaction[];
}

async function getTransactionByIndex(ctx: BotContext, index: number) {
  const transactions = await fetchRecentTransactions(ctx);
  return transactions[index - 1] ?? null;
}

async function fetchActiveCards(ctx: BotContext) {
  const { data } = await ctx.supabase
    .from('credit_cards')
    .select('*')
    .eq('user_id', ctx.connection.user_id)
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .limit(LIST_LIMIT);

  return (data ?? []) as CreditCard[];
}

async function getCardByIndex(ctx: BotContext, index: number) {
  const cards = await fetchActiveCards(ctx);
  return cards[index - 1] ?? null;
}

export async function showFinanceReport(ctx: BotContext) {
  const copy = COPY[ctx.locale];
  const period = await getCurrentFinancePeriodForUser(ctx.supabase, ctx.connection.user_id);

  const { data } = await ctx.supabase
    .from('transactions')
    .select('*, expense_categories(name)')
    .eq('user_id', ctx.connection.user_id)
    .gte('occurred_on', period.start)
    .lte('occurred_on', period.end);

  const transactions = (data ?? []) as Transaction[];
  const income = transactions.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + Number(tx.amount), 0);
  const expense = transactions.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + Number(tx.amount), 0);

  const spentMap = new Map<string, { name: string; spent: number }>();
  for (const tx of transactions) {
    if (tx.type !== 'expense' || !tx.category_id) continue;
    const name = tx.expense_categories?.name ?? 'Other';
    const current = spentMap.get(tx.category_id) ?? { name, spent: 0 };
    current.spent += Number(tx.amount);
    spentMap.set(tx.category_id, current);
  }

  const topCategories = [...spentMap.values()]
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  await sendTelegramMessage(
    ctx.chatId,
    formatFinanceSummary({
      title: copy.finTitle,
      income,
      expense,
      balance: income - expense,
      periodStart: period.start,
      periodEnd: period.end,
      topCategories,
    }),
  );
}

export async function listTransactions(ctx: BotContext) {
  const copy = COPY[ctx.locale];
  const transactions = await fetchRecentTransactions(ctx);
  await sendTelegramMessage(
    ctx.chatId,
    transactions.length ? formatTransactionList(transactions, copy.txListTitle) : copy.emptyTx,
  );
}

export async function addTransaction(
  ctx: BotContext,
  input: { txType: 'income' | 'expense'; amount: number; categoryName?: string; note: string },
) {
  const copy = COPY[ctx.locale];
  let categoryId: string | null = null;

  if (input.categoryName) {
    const category = await findCategoryByName(ctx.supabase, ctx.connection.user_id, input.categoryName);
    if (!category) {
      await sendTelegramMessage(ctx.chatId, copy.categoryNotFound);
      return;
    }
    categoryId = category.id;
  }

  const { error } = await ctx.supabase.from('transactions').insert({
    user_id: ctx.connection.user_id,
    amount: input.amount,
    currency: 'GBP',
    type: input.txType,
    category_id: categoryId,
    credit_card_id: null,
    occurred_on: new Date().toISOString().slice(0, 10),
    note: input.note,
  });

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.txAdded} ${input.txType} ${formatMoney(input.amount)} — <b>${escapeHtml(input.note)}</b>`,
  );
}

export async function editTransaction(
  ctx: BotContext,
  index: number,
  field: 'amount' | 'note' | 'date' | 'type',
  value: string,
) {
  const copy = COPY[ctx.locale];
  const tx = await getTransactionByIndex(ctx, index);
  if (!tx) {
    await sendTelegramMessage(ctx.chatId, copy.txNotFound);
    return;
  }

  const payload: Record<string, unknown> = {};
  if (field === 'amount') {
    const amount = Number(value.replace(',', '.'));
    if (!Number.isFinite(amount) || amount <= 0) {
      await sendTelegramMessage(ctx.chatId, copy.invalidAmount);
      return;
    }
    payload.amount = amount;
  } else if (field === 'note') {
    payload.note = value.trim();
  } else if (field === 'date') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      await sendTelegramMessage(ctx.chatId, copy.invalidDate);
      return;
    }
    payload.occurred_on = value;
  } else if (field === 'type') {
    const txType = value.toLowerCase();
    if (txType !== 'income' && txType !== 'expense') {
      await sendTelegramMessage(ctx.chatId, copy.invalidCommand);
      return;
    }
    payload.type = txType;
  }

  const { error } = await ctx.supabase
    .from('transactions')
    .update(payload)
    .eq('id', tx.id)
    .eq('user_id', ctx.connection.user_id);

  if (error) throw error;

  await sendTelegramMessage(ctx.chatId, `${copy.txUpdated} #${index}`);
}

export async function deleteTransaction(ctx: BotContext, index: number) {
  const copy = COPY[ctx.locale];
  const tx = await getTransactionByIndex(ctx, index);
  if (!tx) {
    await sendTelegramMessage(ctx.chatId, copy.txNotFound);
    return;
  }

  const { error } = await ctx.supabase
    .from('transactions')
    .delete()
    .eq('id', tx.id)
    .eq('user_id', ctx.connection.user_id);

  if (error) throw error;

  await sendTelegramMessage(ctx.chatId, `${copy.txDeleted} #${index}`);
}

export async function listBudgets(ctx: BotContext) {
  const copy = COPY[ctx.locale];
  const period = await getCurrentFinancePeriodForUser(ctx.supabase, ctx.connection.user_id);

  const [budgetRes, txRes] = await Promise.all([
    ctx.supabase
      .from('budgets')
      .select('*, expense_categories(name,color)')
      .eq('user_id', ctx.connection.user_id)
      .lte('period_start', period.end)
      .gte('period_end', period.start),
    ctx.supabase
      .from('transactions')
      .select('category_id, amount, type')
      .eq('user_id', ctx.connection.user_id)
      .eq('type', 'expense')
      .gte('occurred_on', period.start)
      .lte('occurred_on', period.end),
  ]);

  const budgets = (budgetRes.data ?? []) as Budget[];
  const spentByCategory = new Map<string, number>();
  for (const tx of txRes.data ?? []) {
    if (!tx.category_id) continue;
    spentByCategory.set(tx.category_id, (spentByCategory.get(tx.category_id) ?? 0) + Number(tx.amount));
  }

  await sendTelegramMessage(
    ctx.chatId,
    budgets.length ? formatBudgetList(budgets, spentByCategory, copy.budgetListTitle) : copy.emptyBudgets,
  );
}

export async function setBudget(ctx: BotContext, categoryName: string, limitAmount: number) {
  const copy = COPY[ctx.locale];
  const category = await findCategoryByName(ctx.supabase, ctx.connection.user_id, categoryName) as ExpenseCategory | null;
  if (!category) {
    await sendTelegramMessage(ctx.chatId, copy.categoryNotFound);
    return;
  }

  const period = await getCurrentFinancePeriodForUser(ctx.supabase, ctx.connection.user_id);
  const { data: existing } = await ctx.supabase
    .from('budgets')
    .select('id')
    .eq('user_id', ctx.connection.user_id)
    .eq('category_id', category.id)
    .lte('period_start', period.end)
    .gte('period_end', period.start)
    .maybeSingle();

  const payload = {
    user_id: ctx.connection.user_id,
    category_id: category.id,
    limit_amount: limitAmount,
    period_start: period.start,
    period_end: period.end,
  };

  const { error } = existing?.id
    ? await ctx.supabase.from('budgets').update({ limit_amount: limitAmount }).eq('id', existing.id).eq('user_id', ctx.connection.user_id)
    : await ctx.supabase.from('budgets').insert(payload);

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.budgetSet} <b>${escapeHtml(category.name)}</b> → ${formatMoney(limitAmount)}`,
  );
}

export async function listCards(ctx: BotContext) {
  const copy = COPY[ctx.locale];
  const cards = await fetchActiveCards(ctx);
  await sendTelegramMessage(
    ctx.chatId,
    cards.length ? formatCardList(cards, copy.cardsTitle) : copy.emptyCards,
  );
}

export async function addCard(ctx: BotContext, name: string, creditLimit: number) {
  const copy = COPY[ctx.locale];
  const { error } = await ctx.supabase.from('credit_cards').insert({
    user_id: ctx.connection.user_id,
    name,
    credit_limit: creditLimit,
    current_balance: 0,
    monthly_payment: 0,
    statement_day: null,
    due_day: null,
    is_archived: false,
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.cardAdded} <b>${escapeHtml(name)}</b> (${formatMoney(creditLimit)})`,
  );
}

export async function payCard(ctx: BotContext, index: number, amount: number) {
  const copy = COPY[ctx.locale];
  const card = await getCardByIndex(ctx, index);
  if (!card) {
    await sendTelegramMessage(ctx.chatId, copy.cardNotFound);
    return;
  }

  const paymentCategory = await findCategoryByName(ctx.supabase, ctx.connection.user_id, 'Оплата кредитки');
  const { error: txError } = await ctx.supabase.from('transactions').insert({
    user_id: ctx.connection.user_id,
    amount,
    currency: 'GBP',
    type: 'expense',
    category_id: paymentCategory?.id ?? null,
    credit_card_id: card.id,
    occurred_on: new Date().toISOString().slice(0, 10),
    note: `Card payment: ${card.name}`,
  });

  if (txError) throw txError;

  const { data, error: paymentError } = await ctx.supabase.rpc('apply_credit_card_payment', {
    p_credit_card_id: card.id,
    p_amount: amount,
  });

  if (paymentError) throw paymentError;
  if (!data?.length) {
    await sendTelegramMessage(ctx.chatId, copy.cardNotFound);
    return;
  }

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.cardPaid} <b>${escapeHtml(card.name)}</b> — ${formatMoney(amount)}`,
  );
}

export async function archiveCard(ctx: BotContext, index: number) {
  const copy = COPY[ctx.locale];
  const card = await getCardByIndex(ctx, index);
  if (!card) {
    await sendTelegramMessage(ctx.chatId, copy.cardNotFound);
    return;
  }

  const { error } = await ctx.supabase
    .from('credit_cards')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', card.id)
    .eq('user_id', ctx.connection.user_id);

  if (error) throw error;

  await sendTelegramMessage(
    ctx.chatId,
    `${copy.cardArchived} <b>${escapeHtml(card.name)}</b>`,
  );
}
