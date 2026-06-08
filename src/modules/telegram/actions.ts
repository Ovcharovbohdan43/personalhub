'use server';

import crypto from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { isLocale, type Locale } from '@/i18n/config';

export type TelegramLinkState = {
  error?: string;
  token?: string;
  botUsername?: string;
};

function createLinkToken() {
  return crypto.randomBytes(16).toString('base64url');
}

export async function createTelegramLinkTokenAction(
  _prev: TelegramLinkState,
  formData: FormData,
): Promise<TelegramLinkState> {
  const localeValue = formData.get('locale');
  const locale: Locale = typeof localeValue === 'string' && isLocale(localeValue) ? localeValue : 'ru';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const token = createLinkToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  await supabase
    .from('telegram_link_tokens')
    .delete()
    .eq('user_id', user.id)
    .is('used_at', null);

  const { error } = await supabase
    .from('telegram_link_tokens')
    .insert({
      user_id: user.id,
      token,
      preferred_locale: locale,
      expires_at: expiresAt,
    });

  if (error) return { error: error.message };

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

  revalidatePath('/settings');
  return { token, botUsername: process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME };
}
