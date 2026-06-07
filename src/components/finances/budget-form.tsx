'use client';

import { useActionState } from 'react';
import { upsertBudgetAction, type ActionState } from '@/modules/finances/actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';
import type { ExpenseCategory } from '@/types/database';

export function BudgetForm({ categories }: { categories: ExpenseCategory[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(upsertBudgetAction, {});
  const { dictionary: t } = useLanguage();
  useActionToast({ ...state, message: state.ok ? t.finances.budgetSaved : undefined });
  const expenseCategories = categories.filter((category) => category.name !== '\u0414\u043e\u0445\u043e\u0434');

  return (
    <form action={action} className="glass space-y-3 p-4">
      <h3 className="font-semibold">{t.finances.monthlyBudget}</h3>
      <select name="categoryId" className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm" required>
        <option value="">{t.finances.category}</option>
        {expenseCategories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <Input name="limitAmount" type="number" step="0.01" placeholder={t.finances.limitAmount} required />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-400">{t.finances.budgetSaved}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? t.finances.saving : t.finances.setLimit}</Button>
    </form>
  );
}
