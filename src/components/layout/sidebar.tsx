'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Bookmark, Brain, CheckSquare, FileText, LayoutDashboard, NotebookText, Settings, User } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { stripLocale } from '@/i18n/config';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();
  const { path } = stripLocale(pathname);
  const { dictionary: t } = useLanguage();
  const localize = useLocalizedPath();

  const items = [
    ['/', t.nav.dashboard, LayoutDashboard],
    ['/finances', t.nav.finances, BarChart3],
    ['/notes', t.nav.notes, NotebookText],
    ['/tasks', t.nav.tasks, CheckSquare],
    ['/bookmarks', t.nav.bookmarks, Bookmark],
    ['/documents', t.nav.documents, FileText],
    ['/ai-assessment', t.nav.aiAssessment, Brain],
  ] as const;

  return (
    <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r bg-card/55 p-5 backdrop-blur lg:block">
      <div className="mb-8 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500">🌈</div>
        <b>Personal Hub</b>
      </div>
      <nav className="space-y-2">
        {items.map(([href, label, Icon]) => (
          <Link key={href} href={localize(href)} className={`nav-item ${isActive(path, href) ? 'nav-item-active' : ''}`}>
            <Icon size={18} />{label}
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-5 left-5 right-5 space-y-2 border-t pt-5">
        <Link href={localize('/profile')} className={`nav-item ${path === '/profile' ? 'nav-item-active' : ''}`}><User size={18} />{t.nav.profile}</Link>
        <Link href={localize('/settings')} className={`nav-item ${path === '/settings' ? 'nav-item-active' : ''}`}><Settings size={18} />{t.nav.settings}</Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
