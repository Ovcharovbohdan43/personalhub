'use client';

import { useActionState } from 'react';
import { Archive, CreditCard, Pencil } from 'lucide-react';
import { archiveCreditCardAction, saveCreditCardAction, type ActionState } from '@/modules/finances/credit-card-actions';
import { type CreditCardSummary } from '@/modules/finances/credit-cards';
import { formatMoney } from '@/lib/format';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

export function CreditCardList({ cards }: { cards: CreditCardSummary[] }) {
  const { dictionary: t } = useLanguage();
  const totalDebt = cards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalAvailable = cards.reduce((sum, card) => sum + card.availableLimit, 0);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold sm:text-xl">{t.finances.creditObligations}</h2>
          <p className="text-sm text-muted-foreground">
            {t.finances.debtAvailable.replace('{debt}', formatMoney(totalDebt)).replace('{available}', formatMoney(totalAvailable))}
          </p>
        </div>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-sm text-muted-foreground">
          {t.finances.creditEmptyHint}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((card) => <CreditCardItem key={card.id} card={card} />)}
        </div>
      )}
    </section>
  );
}

function CreditCardItem({ card }: { card: CreditCardSummary }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveCreditCardAction, {});
  const { dictionary: t } = useLanguage();
  useActionToast(state);

  const payoffText = card.monthsToPayoff
    ? t.finances.monthsToPayoff.replace('{months}', String(card.monthsToPayoff))
    : card.current_balance > 0
      ? t.finances.addMonthlyPayment
      : t.finances.paidOff;

  return (
    <article className="glass min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-500/20 text-amber-300">
          <CreditCard size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold">{card.name}</h3>
          <p className="break-words text-sm text-muted-foreground">{payoffText}</p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <Stat label={t.finances.limit} value={formatMoney(card.credit_limit)} />
        <Stat label={t.finances.available} value={formatMoney(card.availableLimit)} />
        <Stat label={t.finances.debt} value={formatMoney(card.current_balance)} danger />
        <Stat label={t.finances.monthlyPayment} value={formatMoney(card.monthly_payment)} />
      </div>

      <div className="mb-4">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>{t.finances.usedLimit}</span>
          <span>{card.usedPercent}%</span>
        </div>
        <div className="h-2 rounded-full bg-muted">
          <div className="h-2 rounded-full bg-amber-400" style={{ width: `${card.usedPercent}%` }} />
        </div>
      </div>

      <details className="mb-4 rounded-xl border bg-background/40 p-3">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2"><Pencil size={14} /> {t.finances.editData}</span>
        </summary>
        <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={card.id} />
          <Input name="name" defaultValue={card.name} placeholder={t.finances.cardName} required />
          <Input name="creditLimit" type="number" step="0.01" defaultValue={card.credit_limit} placeholder={t.finances.limit} required />
          <Input name="currentBalance" type="number" step="0.01" defaultValue={card.current_balance} placeholder={t.finances.debt} required />
          <Input name="monthlyPayment" type="number" step="0.01" defaultValue={card.monthly_payment} placeholder={t.finances.monthlyPaymentFull} required />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="statementDay" type="number" min="1" max="31" defaultValue={card.statement_day ?? ''} placeholder={t.finances.statementDay} />
            <Input name="dueDay" type="number" min="1" max="31" defaultValue={card.due_day ?? ''} placeholder={t.finances.dueDay} />
          </div>
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? t.finances.saving : t.common.save}</Button>
        </form>
      </details>

      <form action={archiveCreditCardAction}>
        <input type="hidden" name="id" value={card.id} />
        <button type="submit" className="inline-flex items-center gap-2 text-xs text-red-400">
          <Archive size={14} /> {t.finances.archive}
        </button>
      </form>
    </article>
  );
}

function Stat({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className="rounded-xl bg-muted/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={danger ? 'break-words font-semibold text-red-300' : 'break-words font-semibold'}>{value}</p>
    </div>
  );
}
