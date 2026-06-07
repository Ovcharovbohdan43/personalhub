'use client';

import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDictionary } from '@/i18n/get-dictionary';
import { LANG_COOKIE, switchLocalePath, withLocale, type Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/types';

type LanguageContextValue = {
  locale: Locale;
  dictionary: Dictionary;
  setLocale: (locale: Locale) => void;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function setLocaleCookie(locale: Locale) {
  document.cookie = `${LANG_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const dictionary = useMemo(() => getDictionary(locale), [locale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    setLocaleCookie(locale);
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      if (nextLocale === locale) return;
      setLocaleCookie(nextLocale);
      router.push(switchLocalePath(pathname, nextLocale));
    },
    [locale, pathname, router],
  );

  const value = useMemo(() => ({ locale, dictionary, setLocale }), [locale, dictionary, setLocale]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}

export function useLocalizedPath() {
  const { locale } = useLanguage();
  return useCallback((path: string) => withLocale(locale, path), [locale]);
}
