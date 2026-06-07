'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

export type FinanceSettingsState = { error?: string; ok?: boolean; message?: string };

const resetSchema = z.object({
  confirmation: z.string().trim(),
});

const startMonthSchema = z.object({
  periodStart: z.preprocess((value) => value ?? '', z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  salaryAmount: z.coerce.number().positive(),
  salaryNote: z.preprocess((value) => value ?? '', z.string().trim().max(160)),
});

function revalidateFinanceViews() {
  revalidatePath('/');
  revalidatePath('/finances');
  revalidatePath('/settings');
  revalidatePath('/ai-assessment');
}

export async function resetFinanceReportAction(
  _prev: FinanceSettingsState,
  formData: FormData,
): Promise<FinanceSettingsState> {
  const parsed = resetSchema.safeParse({
    confirmation: formData.get('confirmation'),
  });

  if (!parsed.success || parsed.data.confirmation !== 'RESET') {
    return { error: 'Введите RESET для подтверждения сброса финансовых данных' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const operations = [
    supabase.from('finance_periods').delete().eq('user_id', user.id),
    supabase.from('app_notifications').delete().eq('user_id', user.id).eq('type', 'weekly_report'),
    supabase.from('budgets').delete().eq('user_id', user.id),
    supabase.from('transactions').delete().eq('user_id', user.id),
    supabase.from('credit_cards').delete().eq('user_id', user.id),
  ];

  for (const operation of operations) {
    const { error } = await operation;
    if (error) return { error: error.message };
  }

  revalidateFinanceViews();
  return { ok: true, message: 'Финансовые данные очищены' };
}

export async function startFinancialMonthAction(
  _prev: FinanceSettingsState,
  formData: FormData,
): Promise<FinanceSettingsState> {
  const parsed = startMonthSchema.safeParse({
    periodStart: formData.get('periodStart'),
    salaryAmount: formData.get('salaryAmount'),
    salaryNote: formData.get('salaryNote'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Проверьте данные нового месяца' };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Не авторизован' };

  const { data: existingPeriod } = await supabase
    .from('finance_periods')
    .select('id')
    .eq('user_id', user.id)
    .eq('period_start', parsed.data.periodStart)
    .maybeSingle();

  if (existingPeriod) {
    return { error: 'Финансовый месяц с этой датой старта уже существует' };
  }

  const { error } = await supabase.rpc('start_financial_month', {
    p_period_start: parsed.data.periodStart,
    p_salary_amount: parsed.data.salaryAmount,
    p_salary_note: parsed.data.salaryNote || null,
  });

  if (error) return { error: error.message };

  revalidateFinanceViews();
  return { ok: true, message: 'Новый финансовый месяц начат' };
}
