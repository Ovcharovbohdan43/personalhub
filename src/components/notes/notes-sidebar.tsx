'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';
import { Pin } from 'lucide-react';
import { togglePinNoteAction, deleteNoteAction } from '@/modules/notes/actions';
import { Input } from '@/components/ui/input';
import type { Note } from '@/types/database';
import { formatDate } from '@/lib/format';

export function NotesSidebar({ notes, tags, activeId }: { notes: Note[]; tags: string[]; activeId?: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { dictionary: t, locale } = useLanguage();
  const localize = useLocalizedPath();

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'id') next.delete('id');
    router.push(`${localize('/notes')}?${next.toString()}`);
  }

  return (
    <div className="min-w-0 space-y-3">
      <Input
        placeholder={t.notes.searchPlaceholder}
        defaultValue={params.get('q') ?? ''}
        onChange={(e) => updateFilter('q', e.target.value)}
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={`rounded-lg px-2 py-1 text-xs ${!params.get('tag') ? 'bg-primary/20 text-primary' : 'bg-muted'}`}
          onClick={() => updateFilter('tag', '')}
        >
          {t.notes.all}
        </button>
        {tags.map((tag) => (
          <button
            key={tag}
            type="button"
            className={`rounded-lg px-2 py-1 text-xs ${params.get('tag') === tag ? 'bg-primary/20 text-primary' : 'bg-muted'}`}
            onClick={() => updateFilter('tag', tag)}
          >
            {tag}
          </button>
        ))}
      </div>
      <Link href={localize('/notes')} className="block rounded-xl border p-3 text-sm text-primary">{t.notes.newNote}</Link>
      {notes.map((n) => (
        <div key={n.id} className={`min-w-0 rounded-xl border p-4 ${activeId === n.id ? 'bg-primary/20 border-primary' : ''}`}>
          <div className="flex items-start justify-between gap-2">
            <Link href={`${localize('/notes')}?id=${n.id}`} className="min-w-0 flex-1">
              <p className="truncate font-medium">{n.title}</p>
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{n.content || t.notes.emptyNote}</p>
              <span className="mt-3 inline-block rounded-lg bg-muted px-2 py-1 text-xs">{formatDate(n.updated_at, locale)}</span>
            </Link>
            <form action={togglePinNoteAction}>
              <input type="hidden" name="id" value={n.id} />
              <input type="hidden" name="pinned" value={String(n.is_pinned)} />
              <button type="submit" className={n.is_pinned ? 'text-yellow-400' : 'text-muted-foreground'}>
                <Pin size={16} />
              </button>
            </form>
          </div>
          <form action={deleteNoteAction} className="mt-2">
            <input type="hidden" name="id" value={n.id} />
            <button type="submit" className="text-xs text-red-400">{t.common.delete}</button>
          </form>
        </div>
      ))}
    </div>
  );
}
