import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionForm } from '@/components/finances/transaction-form';
import { BudgetForm } from '@/components/finances/budget-form';
import { CreditCardForm } from '@/components/finances/credit-card-form';
import { CreditCardList } from '@/components/finances/credit-card-list';
import { FinanceFilters } from '@/components/finances/finance-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { getFinanceOverview } from '@/modules/finances/queries';
import { deleteTransactionAction } from '@/modules/finances/actions';
import { formatDate, formatMoney } from '@/lib/format';
import { getPageLocale } from '@/i18n/page';
import { Wallet } from 'lucide-react';

export default async function FinancesPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ month?: string; category?: string; type?: string }>;
}) {
  const [{ dictionary: dict, locale }, params] = await Promise.all([getPageLocale(routeParams), searchParams]);
  const { transactions, categories, income, expense, balance, spentByCategory, creditCards, creditSummary } = await getFinanceOverview({
    month: params.month,
    categoryId: params.category,
    type: params.type as 'income' | 'expense' | undefined,
  });

  return (
    <>
      <div className="mb-6"><h1 className="text-2xl font-bold sm:text-3xl">{dict.finances.title}</h1><p className="text-sm text-muted-foreground">{dict.finances.subtitle}</p></div>
      <Suspense fallback={null}>
        <FinanceFilters categories={categories} />
      </Suspense>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="min-w-0 p-4 sm:p-5"><p className="text-sm text-muted-foreground">{dict.common.income}</p><h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{formatMoney(income)}</h2></Card>
        <Card className="min-w-0 p-4 sm:p-5"><p className="text-sm text-muted-foreground">{dict.common.expense}</p><h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{formatMoney(expense)}</h2></Card>
        <Card className="min-w-0 p-4 sm:p-5"><p className="text-sm text-muted-foreground">{dict.common.balance}</p><h2 className="mt-2 break-words text-2xl font-bold sm:text-3xl">{formatMoney(balance)}</h2></Card>
      </div>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <CreditCardList cards={creditCards} />
        <div className="space-y-5">
          <Card className="min-w-0 p-4 sm:p-5">
            <p className="text-sm text-muted-foreground">{dict.finances.totalDebt}</p>
            <h2 className="mt-2 break-words text-2xl font-bold text-red-300 sm:text-3xl">{formatMoney(creditSummary.totalDebt)}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {dict.finances.availableMonthly
                .replace('{available}', formatMoney(creditSummary.totalAvailable))
                .replace('{monthly}', formatMoney(creditSummary.totalMonthlyPayment))}
            </p>
          </Card>
          <CreditCardForm />
        </div>
      </section>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-5 xl:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>{dict.finances.budgetsByCategory}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {spentByCategory.length ? spentByCategory.map((c) => (
                <div key={c.id} className="min-w-0">
                  <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm"><span className="min-w-0 truncate">{c.name}</span><span className="shrink-0">{formatMoney(c.spent)}{c.limit ? ` ${dict.finances.ofLimit} ${formatMoney(c.limit)}` : ''}</span></div>
                  <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-green-500" style={{ width: `${c.percent}%` }} /></div>
                </div>
              )) : (
                <EmptyState icon={Wallet} title={dict.finances.noBudgets} description={dict.finances.noBudgetsHint} />
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>{dict.finances.recentTransactions}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex flex-col gap-3 rounded-xl bg-muted/50 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate">{tx.note ?? dict.finances.transaction}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.expense_categories?.name ?? '—'} · {formatDate(tx.occurred_on, locale)}
                      {tx.credit_cards?.name ? ` · ${tx.credit_cards.name}` : ''}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                    <b className={tx.type === 'income' ? 'text-green-400' : 'text-red-400'}>
                      {tx.type === 'income' ? '+' : '-'}{formatMoney(Number(tx.amount))}
                    </b>
                    <form action={deleteTransactionAction}>
                      <input type="hidden" name="id" value={tx.id} />
                      <button type="submit" className="text-xs text-red-400">×</button>
                    </form>
                  </div>
                </div>
              ))}
              {transactions.length === 0 ? <p className="text-sm text-muted-foreground">{dict.finances.noTransactions}</p> : null}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-5">
          <TransactionForm categories={categories} creditCards={creditCards} />
          <BudgetForm categories={categories} />
        </div>
      </div>
    </>
  );
}
