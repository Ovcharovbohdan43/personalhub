'use client';

import { useActionState } from 'react';
import { Download, FileText, PenLine, Trash2 } from 'lucide-react';
import {
  deleteDocumentAction,
  downloadDocumentAction,
  updateDocumentAction,
  type ActionState,
} from '@/modules/documents/actions';
import { formatDate, formatFileSize } from '@/lib/format';
import { useActionToast } from '@/lib/use-action-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/components/providers/language-provider';
import type { UserDocument } from '@/types/database';

export function DocumentCard({ document }: { document: UserDocument }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(updateDocumentAction, {});
  const { dictionary: t, locale } = useLanguage();
  useActionToast(state);

  return (
    <article className="glass min-w-0 p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
          <FileText size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold">{document.title}</h2>
          <p className="truncate text-sm text-muted-foreground">{document.file_name}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {formatFileSize(document.size_bytes)} · {t.documents.uploaded} {formatDate(document.created_at, locale)}
          </p>
        </div>
      </div>

      {document.description ? <p className="mb-3 break-words text-sm text-muted-foreground">{document.description}</p> : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {document.signed_by ? (
          <span className="min-w-0 break-words rounded-lg bg-green-500/15 px-2 py-1 text-xs text-green-300">
            {t.documents.signed}: {document.signed_by}
          </span>
        ) : (
          <span className="rounded-lg bg-muted px-2 py-1 text-xs text-muted-foreground">{t.documents.unsigned}</span>
        )}
        {document.tags.map((tag) => (
          <span key={tag} className="rounded-lg bg-muted px-2 py-1 text-xs">{tag}</span>
        ))}
      </div>

      <details className="mb-4 rounded-xl border bg-background/40 p-3">
        <summary className="cursor-pointer text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-2"><PenLine size={14} /> {t.documents.editSignature}</span>
        </summary>
        <form action={action} className="mt-3 space-y-3">
          <input type="hidden" name="id" value={document.id} />
          <Input name="title" defaultValue={document.title} placeholder={t.documents.name} required />
          <Input name="signedBy" defaultValue={document.signed_by ?? ''} placeholder={t.documents.signedBy} />
          <Input name="tags" defaultValue={document.tags.join(', ')} placeholder={t.documents.tags} />
          <textarea
            name="description"
            className="min-h-20 w-full rounded-xl border bg-background/60 p-3 text-sm"
            defaultValue={document.description ?? ''}
            placeholder={t.documents.description}
          />
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? t.finances.saving : t.documents.saveSignature}</Button>
        </form>
      </details>

      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <form action={downloadDocumentAction}>
          <input type="hidden" name="id" value={document.id} />
          <Button type="submit" className="w-full gap-2 sm:w-auto"><Download size={16} /> {t.documents.download}</Button>
        </form>
        <form action={deleteDocumentAction}>
          <input type="hidden" name="id" value={document.id} />
          <Button type="submit" className="w-full gap-2 bg-red-600 sm:w-auto"><Trash2 size={16} /> {t.common.delete}</Button>
        </form>
      </div>
    </article>
  );
}
