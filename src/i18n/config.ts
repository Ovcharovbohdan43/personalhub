export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';
export const LANG_COOKIE = 'personal-hub-lang';

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}

export function stripLocale(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    const path = `/${segments.slice(1).join('/')}`;
    return { locale: segments[0] as Locale, path: path === '/' ? '/' : path };
  }
  return { locale: null as Locale | null, path: pathname || '/' };
}

export function withLocale(locale: Locale, path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const { path: stripped } = stripLocale(normalized);
  if (stripped === '/') return `/${locale}`;
  return `/${locale}${stripped}`;
}

export function switchLocalePath(pathname: string, nextLocale: Locale) {
  const { path } = stripLocale(pathname);
  return withLocale(nextLocale, path);
}
