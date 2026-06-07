'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { markNotificationReadAction } from '@/modules/notifications/actions';
import { formatDate, formatMoney } from '@/lib/format';
import { useLanguage } from '@/components/providers/language-provider';
import type { AppNotification } from '@/types/database';

type WeeklyPayload = {
  income?: number;
  expense?: number;
  balance?: number;
  creditPaymentTotal?: number;
  transactionCount?: number;
  topCategories?: { name: string; amount: number }[];
  creditPayments?: { title: string; card: string | null; amount: number; date: string }[];
};

export function NotificationBell({ notifications }: { notifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const { dictionary: t, locale } = useLanguage();
  const unread = notifications.filter((notification) => !notification.read_at).length;

  return (
    <div className="relative">
      <button
        type="button"
        className="relative rounded-xl border bg-card p-2 text-muted-foreground transition hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
        aria-label={t.notifications.ariaLabel}
      >
        <Bell size={18} />
        {unread > 0 ? (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed inset-x-3 top-20 z-50 max-h-[calc(100vh-7rem)] overflow-auto rounded-2xl border bg-card p-3 shadow-glow sm:absolute sm:inset-auto sm:right-0 sm:top-12 sm:w-[420px] sm:max-w-[calc(100vw-2rem)] sm:p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">{t.notifications.title}</h2>
            <span className="text-xs text-muted-foreground">{unread} {t.common.new}</span>
          </div>

          {notifications.length === 0 ? (
            <p className="rounded-xl bg-muted/40 p-4 text-sm text-muted-foreground">{t.notifications.empty}</p>
          ) : (
            <div className="max-h-[520px] space-y-3 overflow-auto pr-1">
              {notifications.map((notification) => (
                <NotificationItem key={notification.id} notification={notification} locale={locale} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NotificationItem({ notification, locale }: { notification: AppNotification; locale: 'ru' | 'en' }) {
  const { dictionary: t } = useLanguage();
  const payload = notification.payload as WeeklyPayload;

  return (
    <article className={`rounded-xl border p-4 ${notification.read_at ? 'bg-background/40' : 'bg-primary/10 border-primary/40'}`}>
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium">{notification.title}</h3>
          <p className="text-xs text-muted-foreground">{formatDate(notification.created_at, locale)}</p>
        </div>
        {!notification.read_at ? (
          <form action={markNotificationReadAction}>
            <input type="hidden" name="id" value={notification.id} />
            <button className="text-xs text-primary" type="submit">{t.common.read}</button>
          </form>
        ) : null}
      </div>

      <div className="grid gap-2 text-sm">
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label={t.common.earned} value={formatMoney(Number(payload.income ?? 0))} good />
          <MiniStat label={t.common.spent} value={formatMoney(Number(payload.expense ?? 0))} />
          <MiniStat label={t.common.balance} value={formatMoney(Number(payload.balance ?? 0))} good={Number(payload.balance ?? 0) >= 0} />
          <MiniStat label={t.common.creditPayments} value={formatMoney(Number(payload.creditPaymentTotal ?? 0))} />
        </div>

        {payload.topCategories?.length ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t.common.topExpenses}</p>
            <ul className="space-y-1">
              {payload.topCategories.map((category) => (
                <li key={category.name} className="flex justify-between rounded-lg bg-muted/40 px-2 py-1">
                  <span>{category.name}</span>
                  <span>{formatMoney(category.amount)}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {payload.creditPayments?.length ? (
          <div>
            <p className="mb-1 text-xs text-muted-foreground">{t.notifications.payments}</p>
            <ul className="space-y-1">
              {payload.creditPayments.map((payment, index) => (
                <li key={`${payment.date}-${index}`} className="rounded-lg bg-muted/40 px-2 py-1">
                  <div className="flex justify-between gap-2">
                    <span className="truncate">{payment.card ?? payment.title}</span>
                    <span>{formatMoney(payment.amount)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(payment.date, locale)}</p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

function MiniStat({ label, value, good = false }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="rounded-lg bg-muted/40 p-2">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className={good ? 'font-semibold text-green-300' : 'font-semibold text-red-300'}>{value}</p>
    </div>
  );
}
