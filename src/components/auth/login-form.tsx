'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { loginAction, type AuthState } from '@/modules/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction, {});
  const { dictionary: t, locale } = useLanguage();
  const localize = useLocalizedPath();

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Input name="email" type="email" placeholder="email@example.com" required />
      <Input name="password" type="password" placeholder={t.auth.password} required />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <Button className="w-full" type="submit" disabled={pending}>{pending ? t.auth.signingIn : t.auth.signIn}</Button>
      <div className="text-center text-sm text-muted-foreground">
        {t.auth.noAccount} <Link className="text-primary" href={localize('/register')}>{t.auth.signUp}</Link>
      </div>
    </form>
  );
}
