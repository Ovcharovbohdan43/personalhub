'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';

export function DocumentsFilters({ tags }: { tags: string[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const { dictionary: t } = useLanguage();
  const localize = useLocalizedPath();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${localize('/documents')}?${next.toString()}`);
  }

  return (
    <div className="mb-5 grid gap-3 sm:flex sm:flex-wrap">
      <Input
        placeholder={t.documents.searchPlaceholder}
        className="w-full sm:max-w-sm"
        defaultValue={params.get('q') ?? ''}
        onChange={(event) => update('q', event.target.value)}
      />
      <select
        className="h-11 w-full rounded-xl border bg-background/60 px-3 text-sm sm:w-auto"
        defaultValue={params.get('tag') ?? ''}
        onChange={(event) => update('tag', event.target.value)}
      >
        <option value="">{t.documents.allTags}</option>
        {tags.map((tag) => (
          <option key={tag} value={tag}>{tag}</option>
        ))}
      </select>
    </div>
  );
}
