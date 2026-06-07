import { Suspense } from 'react';
import { FileText } from 'lucide-react';
import { DocumentCard } from '@/components/documents/document-card';
import { DocumentUploadForm } from '@/components/documents/document-upload-form';
import { DocumentsFilters } from '@/components/documents/documents-filters';
import { EmptyState } from '@/components/ui/empty-state';
import { getAllDocumentTags, getDocuments } from '@/modules/documents/queries';
import { getPageLocale } from '@/i18n/page';

export default async function DocumentsPage({
  params: routeParams,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const [{ dictionary: dict }, params] = await Promise.all([getPageLocale(routeParams), searchParams]);
  const [documents, tags] = await Promise.all([
    getDocuments(params.q, params.tag),
    getAllDocumentTags(),
  ]);

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.documents.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{dict.documents.subtitle}</p>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[380px_1fr]">
        <DocumentUploadForm />
        <section className="min-w-0">
          <Suspense fallback={null}>
            <DocumentsFilters tags={tags} />
          </Suspense>

          {documents.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={dict.documents.noDocuments}
              description={dict.documents.subtitle}
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
