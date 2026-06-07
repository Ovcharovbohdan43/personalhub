'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bookmark, Brain, CheckSquare, FileText, LayoutDashboard, NotebookText } from 'lucide-react';
import { stripLocale } from '@/i18n/config';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';

const items = [
  ['/', LayoutDashboard],
  ['/finances', BarChart3],
  ['/notes', NotebookText],
  ['/tasks', CheckSquare],
  ['/bookmarks', Bookmark],
  ['/documents', FileText],
  ['/ai-assessment', Brain],
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const { path } = stripLocale(pathname);
  const { dictionary: t } = useLanguage();
  const localize = useLocalizedPath();
  const labels: Record<(typeof items)[number][0], string> = {
    '/': t.nav.dashboard,
    '/finances': t.nav.finances,
    '/notes': t.nav.notes,
    '/tasks': t.nav.tasks,
    '/bookmarks': t.nav.bookmarks,
    '/documents': t.nav.documents,
    '/ai-assessment': t.nav.aiAssessment,
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 overflow-x-auto border-t bg-card/95 px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden">
      <div className="mx-auto flex w-max max-w-full justify-center gap-2">
        {items.map(([href, Icon]) => {
          const active = href === '/' ? path === '/' : path.startsWith(href);
          return (
            <Link
              key={href}
              href={localize(href)}
              title={labels[href]}
              aria-label={labels[href]}
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${active ? 'bg-primary/15 text-primary' : 'text-muted-foreground'}`}
            >
              <Icon size={20} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
