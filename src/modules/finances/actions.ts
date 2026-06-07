'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentFinancePeriod } from '@/modules/finances/periods';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const txSchema = z.object({
  title: z.string().min(1),
  amount: z.coerce.number().positive(),
  type: z.enum(['income', 'expense']),
  categoryId: z.preprocess((value) => value ?? '', z.string().uuid().or(z.literal(''))),
  creditCardId: z.preprocess((value) => value ?? '', z.string().uuid().or(z.literal(''))),
  occurredOn: z.preprocess((value) => value ?? '', z.string()),
  note: z.preprocess((value) => value ?? '', z.string()),
});

export type ActionState = { error?: string; ok?: boolean };

export async function createTransactionAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = txSchema.safeParse({
    title: formData.get('title'),
    amount: formData.get('amount'),
    type: formData.get('type'),
    categoryId: formData.get('categoryId'),
    creditCardId: formData.get('creditCardId'),
    occurredOn: formData.get('occurredOn'),
    note: formData.get('note'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Ошибка' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const isCreditCardPayment = Boolean(parsed.data.creditCardId);

  if (isCreditCardPayment && parsed.data.type !== 'expense') {
    return { error: 'Оплата кредитки должна быть расходом' };
  }

  let categoryId = parsed.data.categoryId || null;

  if (isCreditCardPayment) {
    const { data: paymentCategory } = await supabase
      .from('expense_categories')
      .select('id')
      .eq('user_id', user.id)
      .ilike('name', 'Оплата кредитки')
      .maybeSingle();
    categoryId = paymentCategory?.id ?? categoryId;
  }

  const { error } = await supabase.from('transactions').insert({
    user_id: user.id,
    amount: parsed.data.amount,
    currency: 'GBP',
    type: parsed.data.type,
    category_id: categoryId,
    credit_card_id: parsed.data.creditCardId || null,
    occurred_on: parsed.data.occurredOn || new Date().toISOString().slice(0, 10),
    note: parsed.data.note || parsed.data.title,
  });
  if (error) return { error: error.message };

  if (isCreditCardPayment) {
    const { data, error: paymentError } = await supabase.rpc('apply_credit_card_payment', {
      p_credit_card_id: parsed.data.creditCardId,
      p_amount: parsed.data.amount,
    });
    if (paymentError) return { error: paymentError.message };
    if (!data?.length) return { error: 'Кредитная карта не найдена или уже архивирована' };
  }

  revalidatePath('/finances');
  revalidatePath('/');
  return { ok: true };
}

export async function deleteTransactionAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();
  await supabase.from('transactions').delete().eq('id', id);
  revalidatePath('/finances');
  revalidatePath('/');
}

export async function upsertBudgetAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const categoryId = String(formData.get('categoryId') ?? '');
  const limit = Number(formData.get('limitAmount'));
  if (!categoryId || !limit) return { error: 'Заполните категорию и лимит' };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const currentPeriod = await getCurrentFinancePeriod(supabase);
  const periodStart = currentPeriod.start;
  const periodEnd = currentPeriod.end;

  const { data: existing } = await supabase
    .from('budgets')
    .select('id')
    .eq('user_id', user.id)
    .eq('category_id', categoryId)
    .lte('period_start', periodEnd)
    .gte('period_end', periodStart)
    .maybeSingle();

  const payload = {
    user_id: user.id,
    category_id: categoryId,
    limit_amount: limit,
    period_start: periodStart,
    period_end: periodEnd,
  };

  const { error } = existing?.id
    ? await supabase.from('budgets').update({ limit_amount: limit }).eq('id', existing.id)
    : await supabase.from('budgets').insert(payload);

  if (error) return { error: error.message };
  revalidatePath('/finances');
  revalidatePath('/');
  return { ok: true };
}
