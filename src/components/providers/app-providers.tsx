'use client';

import type { Locale } from '@/i18n/config';
import { LanguageProvider } from './language-provider';
import { ThemeProvider } from './theme-provider';
import { ToastProvider } from './toast-provider';

export function AppProviders({ children, locale = 'ru' }: { children: React.ReactNode; locale?: Locale }) {
  return (
    <LanguageProvider locale={locale}>
      <ThemeProvider>
        <ToastProvider>{children}</ToastProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
