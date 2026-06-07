'use client';

import { useActionState, useEffect, useRef } from 'react';
import { Upload } from 'lucide-react';
import { uploadDocumentAction, type ActionState } from '@/modules/documents/actions';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';

export function DocumentUploadForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadDocumentAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const { dictionary: t } = useLanguage();

  useActionToast(state);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state.ok]);

  return (
    <form ref={formRef} action={action} className="glass min-w-0 space-y-4 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/20 text-primary">
          <Upload size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold">{t.documents.uploadTitle}</h2>
          <p className="text-sm text-muted-foreground">{t.documents.uploadHint}</p>
        </div>
      </div>

      <Input name="title" placeholder={t.documents.titlePlaceholder} required />
      <Input name="signedBy" placeholder={t.documents.signedByPlaceholder} />
      <Input name="tags" placeholder={t.documents.uploadTagsPlaceholder} />
      <textarea
        name="description"
        className="min-h-24 w-full rounded-xl border bg-background/60 p-3 text-sm"
        placeholder={t.documents.uploadDescriptionPlaceholder}
      />
      <input
        name="file"
        type="file"
        required
        className="block w-full min-w-0 rounded-xl border bg-background/60 p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:text-primary-foreground"
      />
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? t.common.loading : t.documents.upload}</Button>
    </form>
  );
}
