'use client';

import { useActionState } from 'react';
import { resetPasswordAction, type AuthState } from '@/modules/auth/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(resetPasswordAction, {});
  const { dictionary: t, locale } = useLanguage();

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <Input name="password" type="password" placeholder={t.auth.newPassword} required />
      <Input name="confirmPassword" type="password" placeholder={t.auth.confirmPassword} required />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      <Button className="w-full" type="submit" disabled={pending}>
        {pending ? t.auth.savingPassword : t.auth.savePassword}
      </Button>
    </form>
  );
}
