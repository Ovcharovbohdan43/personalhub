import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { NoteEditor } from '@/components/notes/note-editor';
import { NotesSidebar } from '@/components/notes/notes-sidebar';
import { getNotes, getAllNoteTags } from '@/modules/notes/queries';
import { getPageLocale } from '@/i18n/page';

export default async function NotesPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ id?: string; q?: string; tag?: string }>;
}) {
  const [{ dictionary: t }, params] = await Promise.all([getPageLocale(routeParams), searchParams]);
  const [notes, tags] = await Promise.all([
    getNotes(params.q, params.tag),
    getAllNoteTags(),
  ]);
  const active = params.id ? notes.find((n) => n.id === params.id) : undefined;

  return (
    <>
      <div className="mb-6 flex items-center justify-between"><h1 className="text-2xl font-bold sm:text-3xl">{t.notes.title}</h1></div>
      <div className="grid min-w-0 gap-5 xl:grid-cols-[360px_1fr]">
        <Card className="min-w-0 p-4">
          <Suspense fallback={<p className="text-sm text-muted-foreground">{t.common.loading}</p>}>
            <NotesSidebar notes={notes} tags={tags} activeId={active?.id} />
          </Suspense>
        </Card>
        <Card className="min-w-0 p-4 sm:p-6">
          <NoteEditor note={active} />
        </Card>
      </div>
    </>
  );
}
