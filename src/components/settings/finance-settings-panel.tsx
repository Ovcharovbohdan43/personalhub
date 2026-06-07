'use client';

import { useActionState } from 'react';
import { AlertTriangle, CalendarPlus, RotateCcw } from 'lucide-react';
import {
  resetFinanceReportAction,
  startFinancialMonthAction,
  type FinanceSettingsState,
} from '@/modules/finances/settings-actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

function todayKey() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function FinanceSettingsPanel() {
  const { dictionary: t } = useLanguage();
  const [startState, startAction, startPending] = useActionState<FinanceSettingsState, FormData>(startFinancialMonthAction, {});
  const [resetState, resetAction, resetPending] = useActionState<FinanceSettingsState, FormData>(resetFinanceReportAction, {});

  useActionToast(startState);
  useActionToast(resetState);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
            <CalendarPlus size={20} />
          </div>
          <div>
            <h2 className="font-semibold">{t.settings.financeMonthTitle}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t.settings.financeMonthHint}</p>
          </div>
        </div>

        <form action={startAction} className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">{t.settings.periodStart}</span>
            <Input name="periodStart" type="date" defaultValue={todayKey()} required />
          </label>
          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">{t.settings.salaryAmount}</span>
            <Input name="salaryAmount" type="number" min="0.01" step="0.01" placeholder="2450" required />
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">
            <span className="text-muted-foreground">{t.settings.salaryNote}</span>
            <Input name="salaryNote" placeholder={t.settings.salaryNotePlaceholder} />
          </label>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={startPending} className="w-full gap-2 sm:w-auto">
              <CalendarPlus size={16} />
              {startPending ? t.common.loading : t.settings.startFinanceMonth}
            </Button>
          </div>
          {startState.error ? <p className="sm:col-span-2 text-sm text-red-400">{startState.error}</p> : null}
        </form>
      </section>

      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-4 sm:p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-red-500/15 text-red-300">
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-red-100">{t.settings.resetFinanceTitle}</h2>
            <p className="mt-1 text-sm text-red-100/75">{t.settings.resetFinanceHint}</p>
          </div>
        </div>

        <form action={resetAction} className="grid gap-3">
          <Input name="confirmation" placeholder={t.settings.resetConfirmationPlaceholder} />
          <Button type="submit" disabled={resetPending} className="w-full gap-2 bg-red-600 sm:w-auto">
            <RotateCcw size={16} />
            {resetPending ? t.common.loading : t.settings.resetFinanceButton}
          </Button>
          {resetState.error ? <p className="text-sm text-red-300">{resetState.error}</p> : null}
        </form>
      </section>
    </div>
  );
}
