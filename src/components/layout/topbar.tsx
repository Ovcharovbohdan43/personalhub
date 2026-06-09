'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Settings, User } from 'lucide-react';
import { LogoutButton } from '@/components/auth/logout-button';
import { GlobalSearch } from '@/components/layout/global-search';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useLanguage, useLocalizedPath } from '@/components/providers/language-provider';
import { stripLocale } from '@/i18n/config';
import type { AppNotification, Profile } from '@/types/database';

export function Topbar({ profile, email, notifications }: { profile: Profile | null; email: string; notifications: AppNotification[] }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { path } = stripLocale(pathname);
  const { dictionary: t } = useLanguage();
  const localize = useLocalizedPath();
  const name = profile?.display_name ?? email.split('@')[0];

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{t.dashboard.title}</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{t.dashboard.subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <GlobalSearch />
        <NotificationBell notifications={notifications} />
        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-haspopup="menu"
            aria-label={t.nav.profile}
            className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2 transition hover:bg-muted"
          >
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-red-400 text-sm font-bold">
                {name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <span className="hidden max-w-36 truncate text-sm sm:inline">{name}</span>
          </button>
          {open ? (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 min-w-[12rem] rounded-xl border bg-card p-2 shadow-lg"
            >
              <p className="truncate px-3 py-2 text-sm font-medium">{name}</p>
              <Link
                href={localize('/profile')}
                role="menuitem"
                className={`nav-item ${path === '/profile' ? 'nav-item-active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <User size={18} />
                {t.nav.profile}
              </Link>
              <Link
                href={localize('/settings')}
                role="menuitem"
                className={`nav-item ${path === '/settings' ? 'nav-item-active' : ''}`}
                onClick={() => setOpen(false)}
              >
                <Settings size={18} />
                {t.nav.settings}
              </Link>
              <LogoutButton className="nav-item w-full" />
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
