import { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { BookmarkForm } from '@/components/bookmarks/bookmark-form';
import { BookmarksFilters } from '@/components/bookmarks/bookmarks-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { getBookmarks } from '@/modules/bookmarks/queries';
import { deleteBookmarkAction } from '@/modules/bookmarks/actions';
import { Bookmark } from 'lucide-react';
import { getPageLocale } from '@/i18n/page';

export default async function BookmarksPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const [{ dictionary: dict }, params] = await Promise.all([getPageLocale(routeParams), searchParams]);
  const bookmarks = await getBookmarks(params.q, params.type);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.bookmarks.title}</h1>
        <p className="text-sm text-muted-foreground">{dict.bookmarks.subtitle}</p>
      </div>
      <Suspense fallback={null}><BookmarksFilters /></Suspense>
      <div className="mb-5 max-w-xl"><BookmarkForm /></div>
      {bookmarks.length === 0 ? (
        <EmptyState icon={Bookmark} title={dict.bookmarks.noBookmarks} description={dict.bookmarks.subtitle} />
      ) : (
        <div className="grid min-w-0 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {bookmarks.map((b) => {
            const image = typeof b.metadata?.image === 'string' ? b.metadata.image : null;
            return (
              <Card key={b.id} className="min-w-0 overflow-hidden">
                <div className="relative grid h-36 place-items-center bg-gradient-to-br from-muted to-background">
                  {image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={image} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-3xl font-black tracking-widest">{b.type === 'video' ? 'VIDEO' : 'LINK'}</span>
                  )}
                </div>
                <div className="p-4">
                  <a href={b.url} target="_blank" rel="noreferrer" className="line-clamp-2 font-semibold hover:text-primary">{b.title}</a>
                  <p className="truncate text-sm text-muted-foreground">{b.url}</p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-lg bg-muted px-2 py-1 text-xs">{b.type}</span>
                    <form action={deleteBookmarkAction}>
                      <input type="hidden" name="id" value={b.id} />
                      <button type="submit" className="text-xs text-red-400">{dict.common.delete}</button>
                    </form>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
