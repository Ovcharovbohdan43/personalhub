'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';
import type { ExpenseCategory } from '@/types/database';

export function FinanceFilters({ categories }: { categories: ExpenseCategory[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { dictionary: t } = useLanguage();
  const localize = useLocalizedPath();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${localize('/finances')}?${next.toString()}`);
  }

  return (
    <div className="mb-5 grid gap-3 sm:flex sm:flex-wrap">
      <input
        type="month"
        className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm sm:w-auto"
        defaultValue={params.get('month') ?? new Date().toISOString().slice(0, 7)}
        onChange={(e) => update('month', e.target.value)}
      />
      <select
        className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm sm:w-auto"
        defaultValue={params.get('category') ?? ''}
        onChange={(e) => update('category', e.target.value)}
      >
        <option value="">{t.notes.all} {t.finances.budgets.toLowerCase()}</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm sm:w-auto"
        defaultValue={params.get('type') ?? ''}
        onChange={(e) => update('type', e.target.value)}
      >
        <option value="">{t.notes.all}</option>
        <option value="income">{t.common.income}</option>
        <option value="expense">{t.common.expense}</option>
      </select>
    </div>
  );
}
