'use client';

import { useActionState } from 'react';
import { createBookmarkAction, type ActionState } from '@/modules/bookmarks/actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

export function BookmarkForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(createBookmarkAction, {});
  const { dictionary: t } = useLanguage();
  useActionToast({ ...state, message: state.ok ? t.bookmarks.bookmarkSaved : undefined });

  return (
    <form action={action} className="glass space-y-3 p-4">
      <Input name="url" placeholder="https://..." required />
      <Input name="title" placeholder={t.bookmarks.titleOptional} />
      <Input name="tags" placeholder={t.bookmarks.tagsPlaceholder} />
      <Input name="description" placeholder={t.bookmarks.descriptionOptional} />
      {state.error ? <p className="text-sm text-red-400">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-green-400">{t.bookmarks.saved}</p> : null}
      <Button type="submit" disabled={pending}>{t.bookmarks.addBookmark}</Button>
    </form>
  );
}
