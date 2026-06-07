'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';

export function BookmarksFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const { dictionary: t } = useLanguage();
  const localize = useLocalizedPath();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.push(`${localize('/bookmarks')}?${next.toString()}`);
  }

  return (
    <div className="mb-5 grid gap-3 sm:flex sm:flex-wrap">
      <Input
        placeholder={t.bookmarks.searchPlaceholder}
        className="w-full sm:max-w-sm"
        defaultValue={params.get('q') ?? ''}
        onChange={(e) => update('q', e.target.value)}
      />
      <select
        className="h-10 w-full rounded-xl border bg-background/60 px-3 text-sm sm:w-auto"
        defaultValue={params.get('type') ?? ''}
        onChange={(e) => update('type', e.target.value)}
      >
        <option value="">{t.bookmarks.allTypes}</option>
        <option value="link">{t.bookmarks.links}</option>
        <option value="video">{t.bookmarks.videos}</option>
        <option value="article">{t.bookmarks.articles}</option>
      </select>
    </div>
  );
}
