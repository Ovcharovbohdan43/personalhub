import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { globalSearch } from '@/modules/search/queries';
import { formatMoney } from '@/lib/format';
import { getPageLocale } from '@/i18n/page';
import { withLocale } from '@/i18n/config';

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ dictionary: dict, locale }, queryParams] = await Promise.all([getPageLocale(params), searchParams]);
  const query = queryParams.q?.trim() ?? '';
  const results = await globalSearch(query);
  const total = results.notes.length + results.tasks.length + results.bookmarks.length + results.documents.length + results.transactions.length;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-2 text-2xl font-bold sm:text-3xl">{dict.search.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {query
          ? dict.search.resultsFor.replace('{query}', query).replace('{total}', String(total))
          : dict.search.enterQuery}
      </p>

      {!query ? null : total === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">{dict.search.noResults}</Card>
      ) : (
        <div className="grid gap-5">
          {results.notes.length > 0 ? (
            <ResultSection title={dict.notes.title}>
              {results.notes.map((note) => (
                <Link key={note.id} href={`${withLocale(locale, '/notes')}?id=${note.id}`} className="block min-w-0 rounded-xl bg-muted/40 p-3 hover:bg-muted/60">
                  <p className="truncate font-medium">{note.title}</p>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{note.content || dict.search.emptyNote}</p>
                </Link>
              ))}
            </ResultSection>
          ) : null}

          {results.tasks.length > 0 ? (
            <ResultSection title={dict.tasks.title}>
              {results.tasks.map((task) => (
                <Link key={task.id} href={withLocale(locale, '/tasks')} className="block min-w-0 rounded-xl bg-muted/40 p-3 hover:bg-muted/60">
                  <p className="truncate font-medium">{task.title}</p>
                  <p className="text-sm text-muted-foreground">{task.status}</p>
                </Link>
              ))}
            </ResultSection>
          ) : null}

          {results.bookmarks.length > 0 ? (
            <ResultSection title={dict.bookmarks.title}>
              {results.bookmarks.map((bookmark) => (
                <a key={bookmark.id} href={bookmark.url} target="_blank" rel="noreferrer" className="block min-w-0 rounded-xl bg-muted/40 p-3 hover:bg-muted/60">
                  <p className="truncate font-medium">{bookmark.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{bookmark.url}</p>
                </a>
              ))}
            </ResultSection>
          ) : null}

          {results.documents.length > 0 ? (
            <ResultSection title={dict.documents.title}>
              {results.documents.map((document) => (
                <Link key={document.id} href={withLocale(locale, '/documents')} className="block min-w-0 rounded-xl bg-muted/40 p-3 hover:bg-muted/60">
                  <p className="truncate font-medium">{document.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {document.file_name}{document.signed_by ? ` · ${dict.search.signedBy}: ${document.signed_by}` : ''}
                  </p>
                </Link>
              ))}
            </ResultSection>
          ) : null}

          {results.transactions.length > 0 ? (
            <ResultSection title={dict.finances.transactions}>
              {results.transactions.map((tx) => (
                <Link key={tx.id} href={withLocale(locale, '/finances')} className="block min-w-0 rounded-xl bg-muted/40 p-3 hover:bg-muted/60">
                  <p className="truncate font-medium">{tx.note ?? dict.finances.transaction}</p>
                  <p className="text-sm text-muted-foreground">
                    {tx.type === 'income' ? '+' : '-'}{formatMoney(Number(tx.amount))}
                  </p>
                </Link>
              ))}
            </ResultSection>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="min-w-0">
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="space-y-2">{children}</CardContent>
    </Card>
  );
}
