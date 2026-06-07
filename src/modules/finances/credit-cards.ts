import { createClient } from '@/lib/supabase/server';
import type { CreditCard } from '@/types/database';

export type CreditCardSummary = CreditCard & {
  availableLimit: number;
  usedPercent: number;
  monthsToPayoff: number | null;
};

export function summarizeCreditCard(card: CreditCard): CreditCardSummary {
  const creditLimit = Number(card.credit_limit);
  const currentBalance = Number(card.current_balance);
  const monthlyPayment = Number(card.monthly_payment);
  const availableLimit = Math.max(0, creditLimit - currentBalance);
  const usedPercent = creditLimit > 0 ? Math.min(100, Math.round((currentBalance / creditLimit) * 100)) : 0;
  const monthsToPayoff = monthlyPayment > 0 && currentBalance > 0 ? Math.ceil(currentBalance / monthlyPayment) : null;

  return {
    ...card,
    credit_limit: creditLimit,
    current_balance: currentBalance,
    monthly_payment: monthlyPayment,
    availableLimit,
    usedPercent,
    monthsToPayoff,
  };
}

export async function getCreditCards(includeArchived = false) {
  const supabase = await createClient();
  let query = supabase
    .from('credit_cards')
    .select('*')
    .order('created_at', { ascending: false });

  if (!includeArchived) query = query.eq('is_archived', false);

  const { data } = await query;
  return ((data ?? []) as CreditCard[]).map(summarizeCreditCard);
}
