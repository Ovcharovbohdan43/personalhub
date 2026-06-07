'use client';

import { useActionState } from 'react';
import { uploadAvatarAction, type ActionState } from '@/modules/profile/actions';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/components/providers/language-provider';

export function AvatarUpload() {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadAvatarAction, {});
  const { dictionary: t } = useLanguage();

  return (
    <form action={action} className="flex flex-col items-center gap-2">
      <input name="avatar" type="file" accept="image/*" className="text-sm" required />
      <Button type="submit" disabled={pending} className="bg-muted text-foreground">
        {pending ? t.common.loading : t.profile.uploadAvatar}
      </Button>
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-400">{t.profile.avatarUpdated}</p> : null}
    </form>
  );
}
