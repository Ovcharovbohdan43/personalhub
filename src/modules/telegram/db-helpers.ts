import { monthBounds } from '@/lib/format';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { FinancePeriod } from '@/types/database';

export type FinancePeriodBounds = {
  start: string;
  end: string;
  source: 'custom' | 'calendar';
  period: FinancePeriod | null;
};

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getCurrentFinancePeriodForUser(supabase: SupabaseClient, userId: string): Promise<FinancePeriodBounds> {
  const today = toDateKey(new Date());
  const { data } = await supabase
    .from('finance_periods')
    .select('*')
    .eq('user_id', userId)
    .lte('period_start', today)
    .gte('period_end', today)
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (data) {
    const period = data as FinancePeriod;
    return {
      start: period.period_start,
      end: period.period_end,
      source: 'custom',
      period,
    };
  }

  return {
    ...monthBounds(new Date()),
    source: 'calendar',
    period: null,
  };
}

export async function findCategoryByName(supabase: SupabaseClient, userId: string, name: string) {
  const { data } = await supabase
    .from('expense_categories')
    .select('*')
    .eq('user_id', userId)
    .ilike('name', name)
    .maybeSingle();

  return data;
}
