import { defaultLocale, isLocale, type Locale } from './config';
import { getDictionary } from './get-dictionary';

export async function getPageLocale(params: Promise<{ lang: string }>) {
  const { lang } = await params;
  const locale: Locale = isLocale(lang) ? lang : defaultLocale;
  return { locale, dictionary: getDictionary(locale) };
}
