'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const creditCardSchema = z.object({
  id: z.preprocess((value) => value ?? '', z.string().uuid().or(z.literal(''))),
  name: z.preprocess((value) => value ?? '', z.string().trim().min(1, 'Введите название кредитки')),
  creditLimit: z.coerce.number().min(0, 'Лимит не может быть отрицательным'),
  currentBalance: z.coerce.number().min(0, 'Задолженность не может быть отрицательной'),
  monthlyPayment: z.coerce.number().min(0, 'Платёж не может быть отрицательным'),
  statementDay: z.preprocess((value) => value || null, z.coerce.number().int().min(1).max(31).nullable()),
  dueDay: z.preprocess((value) => value || null, z.coerce.number().int().min(1).max(31).nullable()),
});

export type ActionState = { error?: string; ok?: boolean; message?: string };

export async function saveCreditCardAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = creditCardSchema.safeParse({
    id: formData.get('id'),
    name: formData.get('name'),
    creditLimit: formData.get('creditLimit'),
    currentBalance: formData.get('currentBalance'),
    monthlyPayment: formData.get('monthlyPayment'),
    statementDay: formData.get('statementDay'),
    dueDay: formData.get('dueDay'),
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Проверьте поля кредитки' };
  if (parsed.data.currentBalance > parsed.data.creditLimit) {
    return { error: 'Задолженность не может быть больше лимита' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const payload = {
    user_id: user.id,
    name: parsed.data.name,
    credit_limit: parsed.data.creditLimit,
    current_balance: parsed.data.currentBalance,
    monthly_payment: parsed.data.monthlyPayment,
    statement_day: parsed.data.statementDay,
    due_day: parsed.data.dueDay,
    updated_at: new Date().toISOString(),
  };

  const { error } = parsed.data.id
    ? await supabase.from('credit_cards').update(payload).eq('id', parsed.data.id).eq('user_id', user.id)
    : await supabase.from('credit_cards').insert(payload);

  if (error) return { error: error.message };
  revalidatePath('/finances');
  revalidatePath('/');
  return { ok: true, message: parsed.data.id ? 'Кредитка обновлена' : 'Кредитка добавлена' };
}

export async function archiveCreditCardAction(formData: FormData) {
  const id = String(formData.get('id') ?? '');
  const supabase = await createClient();
  await supabase.from('credit_cards').update({ is_archived: true, updated_at: new Date().toISOString() }).eq('id', id);
  revalidatePath('/finances');
  revalidatePath('/');
}
