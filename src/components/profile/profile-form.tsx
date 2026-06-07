'use client';

import { useActionState } from 'react';
import { updateProfileAction, type ActionState } from '@/modules/profile/actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';
import type { Profile } from '@/types/database';

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfileAction, {});
  const { dictionary: t } = useLanguage();
  useActionToast({ ...state, message: state.ok ? t.profile.profileUpdated : undefined });

  return (
    <form action={action} className="grid gap-4">
      <label className="space-y-2 text-sm">{t.profile.name}<Input name="displayName" defaultValue={profile?.display_name ?? ''} /></label>
      <label className="space-y-2 text-sm">Email<Input value={email} readOnly /></label>
      <label className="space-y-2 text-sm">{t.profile.bio}<textarea name="bio" className="min-h-28 w-full rounded-xl border bg-background/60 p-3 text-sm" defaultValue={profile?.bio ?? ''} /></label>
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-400">{t.profile.profileUpdated}</p> : null}
      <Button type="submit" disabled={pending}>{t.profile.saveChanges}</Button>
    </form>
  );
}
