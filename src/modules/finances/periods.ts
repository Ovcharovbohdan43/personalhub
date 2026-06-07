import { monthBounds } from '@/lib/format';
import type { SupabaseClient } from '@supabase/supabase-js';

export type FinancePeriod = {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  salary_amount: number;
  salary_transaction_id: string | null;
  note: string | null;
  created_at: string;
};

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

export function buildFinancialMonthBounds(periodStart: string) {
  const startDate = new Date(`${periodStart}T00:00:00`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  endDate.setDate(endDate.getDate() - 1);

  return {
    start: toDateKey(startDate),
    end: toDateKey(endDate),
  };
}

export async function getCurrentFinancePeriod(supabase: SupabaseClient): Promise<FinancePeriodBounds> {
  const today = toDateKey(new Date());
  const { data } = await supabase
    .from('finance_periods')
    .select('*')
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
