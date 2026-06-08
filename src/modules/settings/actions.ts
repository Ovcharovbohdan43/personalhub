'use server';

import { createClient } from '@/lib/supabase/server';
import { isLocale, type Locale } from '@/i18n/config';

export async function syncSystemLocaleAction(locale: Locale) {
  if (!isLocale(locale)) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await Promise.all([
    supabase
      .from('profiles')
      .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
      .eq('id', user.id),
    supabase
      .from('telegram_connections')
      .update({ preferred_locale: locale, updated_at: new Date().toISOString() })
      .eq('user_id', user.id),
  ]);
}
