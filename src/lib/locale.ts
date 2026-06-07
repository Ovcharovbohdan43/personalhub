import { cookies } from 'next/headers';
import { defaultLocale, isLocale, type Locale } from '@/i18n/config';

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get('personal-hub-lang')?.value;
  return value && isLocale(value) ? value : defaultLocale;
}
