'use client';

import { useEffect, useRef, useActionState } from 'react';
import { createTransactionAction, type ActionState } from '@/modules/finances/actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';
import type { CreditCardSummary } from '@/modules/finances/credit-cards';
import type { ExpenseCategory } from '@/types/database';

export function TransactionForm({ categories, creditCards }: { categories: ExpenseCategory[]; creditCards: CreditCardSummary[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(createTransactionAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const { dictionary: t } = useLanguage();
  useActionToast({ ...state, message: state.ok ? t.finances.transactionAdded : undefined });

  useEffect(() => {
    if (!state.ok) return;
    formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="glass space-y-3 p-4">
      <h3 className="font-semibold">{t.finances.newTransaction}</h3>
      <Input name="title" placeholder={t.finances.description} required />
      <Input name="amount" type="number" step="0.01" placeholder={t.finances.amount} required />
      <select name="type" className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm" defaultValue="expense">
        <option value="expense">{t.finances.expenseSingular}</option>
        <option value="income">{t.finances.incomeSingular}</option>
      </select>
      <select name="categoryId" className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm">
        <option value="">{t.finances.noCategory}</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <select name="creditCardId" className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm">
        <option value="">{t.finances.notCreditPayment}</option>
        {creditCards.map((card) => (
          <option key={card.id} value={card.id}>
            {t.finances.paymentFor.replace('{name}', card.name).replace('{debt}', card.current_balance.toFixed(2))}
          </option>
        ))}
      </select>
      <p className="text-xs text-muted-foreground">{t.finances.creditPaymentHint}</p>
      <Input name="occurredOn" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-400">{t.finances.saved}</p> : null}
      <Button type="submit" disabled={pending}>{pending ? t.finances.saving : t.common.add}</Button>
    </form>
  );
}
