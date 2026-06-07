import type { Locale } from './config';
import type { Dictionary } from './types';
import ru from './dictionaries/ru';
import en from './dictionaries/en';

const dictionaries: Record<Locale, Dictionary> = { ru, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries.ru;
}
