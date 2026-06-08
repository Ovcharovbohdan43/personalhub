'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/providers/theme-provider';
import { useLanguage } from '@/components/providers/language-provider';
import { FinanceSettingsPanel } from '@/components/settings/finance-settings-panel';
import { TelegramSettingsPanel } from '@/components/settings/telegram-settings-panel';
import type { Locale } from '@/i18n/config';
import { syncSystemLocaleAction } from '@/modules/settings/actions';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { dictionary: t, locale, setLocale } = useLanguage();
  const changeLocale = (nextLocale: Locale) => {
    setLocale(nextLocale);
    void syncSystemLocaleAction(nextLocale);
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold sm:text-3xl">{t.settings.title}</h1>

      <Card className="mb-5 space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="font-semibold">{t.settings.languageTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.settings.languageHint}</p>
        </div>
        <div className="grid gap-3 sm:flex">
          <Button
            type="button"
            onClick={() => changeLocale('ru' as Locale)}
            className={`w-full sm:w-auto ${locale === 'ru' ? '' : 'bg-muted text-foreground'}`}
          >
            {t.settings.russian}
          </Button>
          <Button
            type="button"
            onClick={() => changeLocale('en' as Locale)}
            className={`w-full sm:w-auto ${locale === 'en' ? '' : 'bg-muted text-foreground'}`}
          >
            {t.settings.english}
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-4 sm:p-6">
        <div>
          <h2 className="font-semibold">{t.settings.themeTitle}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{t.settings.themeHint}</p>
        </div>
        <div className="grid gap-3 sm:flex">
          <Button
            type="button"
            onClick={() => setTheme('dark')}
            className={`w-full sm:w-auto ${theme === 'dark' ? '' : 'bg-muted text-foreground'}`}
          >
            {t.settings.dark}
          </Button>
          <Button
            type="button"
            onClick={() => setTheme('light')}
            className={`w-full sm:w-auto ${theme === 'light' ? '' : 'bg-muted text-foreground'}`}
          >
            {t.settings.light}
          </Button>
        </div>
      </Card>

      <div className="mt-5">
        <FinanceSettingsPanel />
      </div>
      <div className="mt-5">
        <TelegramSettingsPanel />
      </div>
    </div>
  );
}
