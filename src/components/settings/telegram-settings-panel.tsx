'use client';

import { useActionState } from 'react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';
import {
  createTelegramLinkTokenAction,
  type TelegramLinkState,
} from '@/modules/telegram/actions';

export function TelegramSettingsPanel() {
  const [state, action, pending] = useActionState<TelegramLinkState, FormData>(createTelegramLinkTokenAction, {});
  const { dictionary: t, locale } = useLanguage();
  const command = state.token ? `/start ${state.token}` : '';
  const botLink = state.token && state.botUsername
    ? `https://t.me/${state.botUsername}?start=${state.token}`
    : null;

  return (
    <section className="glass space-y-4 p-4 sm:p-6">
      <div>
        <h2 className="font-semibold">{t.settings.telegramTitle}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t.settings.telegramHint}</p>
      </div>

      <form action={action}>
        <input type="hidden" name="locale" value={locale} />
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? t.common.loading : t.settings.telegramGenerateCode}
        </Button>
      </form>

      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}

      {state.token ? (
        <div className="space-y-3 rounded-xl border bg-background/40 p-3">
          <p className="text-sm text-muted-foreground">{t.settings.telegramCodeHint}</p>
          <code className="block break-all rounded-lg bg-muted p-3 text-sm">{command}</code>
          {botLink ? (
            <a className="text-sm text-primary" href={botLink} target="_blank" rel="noreferrer">
              {t.settings.telegramOpenBot}
            </a>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
