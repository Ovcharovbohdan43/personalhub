'use server';

import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getServerLocale } from '@/lib/locale';
import { isLocale, withLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

const RECOVERY_COOKIE = 'personal-hub-password-recovery';

async function resolveLocale(formData: FormData) {
  const fromForm = formData.get('locale');
  if (typeof fromForm === 'string' && isLocale(fromForm)) return fromForm;
  return getServerLocale();
}

export type AuthState = { error?: string };

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await resolveLocale(formData);
  const t = getDictionary(locale);

  const loginSchema = z.object({
    email: z.string().email(t.validation.invalidEmail),
    password: z.string().min(6, t.validation.minPassword),
  });

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t.validation.validationError };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: error.message };

  const next = formData.get('next');
  redirect(typeof next === 'string' && next.startsWith('/') ? next : withLocale(locale, '/'));
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await resolveLocale(formData);
  const t = getDictionary(locale);

  const registerSchema = z.object({
    displayName: z.string().min(2, t.validation.minName),
    email: z.string().email(t.validation.invalidEmail),
    password: z.string().min(6, t.validation.minPassword),
  });

  const parsed = registerSchema.safeParse({
    displayName: formData.get('displayName'),
    email: formData.get('email'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t.validation.validationError };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${getSiteUrl()}${withLocale(locale, '/')}`,
    },
  });
  if (error) return { error: error.message };

  redirect(withLocale(locale, '/'));
}

export async function logoutAction(formData: FormData) {
  const locale = await resolveLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(withLocale(locale, '/login'));
}

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await resolveLocale(formData);
  const t = getDictionary(locale);

  const email = z.string().email(t.validation.invalidEmail).safeParse(formData.get('email'));
  if (!email.success) return { error: t.validation.invalidEmail };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${getSiteUrl()}${withLocale(locale, '/reset-password')}`,
  });
  if (error) return { error: error.message };
  return {};
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const locale = await resolveLocale(formData);
  const t = getDictionary(locale);

  const resetSchema = z
    .object({
      password: z.string().min(6, t.validation.minPassword),
      confirmPassword: z.string().min(6, t.validation.minPassword),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t.validation.passwordMismatch,
      path: ['confirmPassword'],
    });

  const parsed = resetSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? t.validation.validationError };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: error.message };

  const cookieStore = await cookies();
  cookieStore.delete(RECOVERY_COOKIE);

  redirect(withLocale(locale, '/'));
}
