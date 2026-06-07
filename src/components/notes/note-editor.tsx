'use client';

import { useEffect, useRef, useActionState } from 'react';
import ReactMarkdown from 'react-markdown';
import { saveNoteAction, type ActionState } from '@/modules/notes/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useActionToast } from '@/lib/use-action-toast';
import { useLanguage } from '@/components/providers/language-provider';
import type { Note } from '@/types/database';

export function NoteEditor({ note }: { note?: Note }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveNoteAction, {});
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | null>(null);
  const { dictionary: t } = useLanguage();

  useActionToast(state);

  useEffect(() => {
    if (!state.ok || note) return;
    formRef.current?.reset();
  }, [note, state.ok]);

  useEffect(() => {
    if (!note || !formRef.current) return;

    const form = formRef.current;
    const onInput = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        const data = new FormData(form);
        data.set('id', note.id);
        void saveNoteAction({}, data);
      }, 1500);
    };

    form.addEventListener('input', onInput);
    return () => {
      form.removeEventListener('input', onInput);
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [note]);

  return (
    <div className="min-w-0 space-y-4">
      <form ref={formRef} action={action} className="space-y-4">
        {note ? <input type="hidden" name="id" value={note.id} /> : null}
        <Input name="title" placeholder={t.notes.titlePlaceholder} defaultValue={note?.title} required />
        <Input name="tags" placeholder={t.notes.tagsPlaceholder} defaultValue={note?.tags?.join(', ')} />
        <textarea
          name="content"
          className="min-h-[240px] w-full rounded-xl border bg-background/50 p-4 font-mono text-sm leading-7 sm:min-h-[280px] sm:p-5"
          defaultValue={note?.content}
          placeholder={t.notes.markdownPlaceholder}
        />
        {note ? <p className="text-xs text-muted-foreground">{t.notes.autosaveHint}</p> : null}
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">{pending ? t.finances.saving : t.common.save}</Button>
      </form>
      {note?.content ? (
        <div className="rounded-xl border bg-background/50 p-4 sm:p-5">
          <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">{t.notes.preview}</p>
          <article className="prose prose-invert max-w-none break-words text-sm leading-7">
            <ReactMarkdown>{note.content}</ReactMarkdown>
          </article>
        </div>
      ) : null}
    </div>
  );
}
