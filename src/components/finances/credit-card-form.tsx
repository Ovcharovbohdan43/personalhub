'use client';

import { useActionState, useEffect, useRef } from 'react';
import { CreditCard } from 'lucide-react';
import { saveCreditCardAction, type ActionState } from '@/modules/finances/credit-card-actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

export function CreditCardForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCreditCardAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const { dictionary: t } = useLanguage();

  useActionToast(state);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="glass space-y-3 p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-500/20 text-amber-300">
          <CreditCard size={20} />
        </div>
        <div>
          <h3 className="font-semibold">{t.finances.newCreditCard}</h3>
          <p className="text-xs text-muted-foreground">{t.finances.creditCardHint}</p>
        </div>
      </div>
      <Input name="name" placeholder={t.finances.cardName} required />
      <Input name="creditLimit" type="number" step="0.01" placeholder={t.finances.creditLimit} required />
      <Input name="currentBalance" type="number" step="0.01" placeholder={t.finances.usedDebt} required />
      <Input name="monthlyPayment" type="number" step="0.01" placeholder={t.finances.monthlyPaymentFull} required />
      <div className="grid grid-cols-2 gap-3">
        <Input name="statementDay" type="number" min="1" max="31" placeholder={t.finances.statementDay} />
        <Input name="dueDay" type="number" min="1" max="31" placeholder={t.finances.dueDay} />
      </div>
      <Button type="submit" disabled={pending}>{pending ? t.finances.saving : t.finances.addCreditCard}</Button>
    </form>
  );
}
