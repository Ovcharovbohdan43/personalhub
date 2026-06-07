'use client';

import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { dictionary: t } = useLanguage();
  const localize = useLocalizedPath();

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const value = query.trim();
    if (!value) return;
    router.push(`${localize('/search')}?q=${encodeURIComponent(value)}`);
  }

  return (
    <form onSubmit={onSubmit} className="relative hidden md:block">
      <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="h-10 w-72 rounded-xl border bg-card pl-9 text-sm"
        placeholder={t.search.placeholder}
      />
    </form>
  );
}
