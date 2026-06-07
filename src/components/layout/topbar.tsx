'use client';

import { GlobalSearch } from '@/components/layout/global-search';
import { NotificationBell } from '@/components/layout/notification-bell';
import { useLanguage } from '@/components/providers/language-provider';
import type { AppNotification, Profile } from '@/types/database';

export function Topbar({ profile, email, notifications }: { profile: Profile | null; email: string; notifications: AppNotification[] }) {
  const { dictionary: t } = useLanguage();
  const name = profile?.display_name ?? email.split('@')[0];

  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-3 sm:mb-8 sm:gap-4">
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">{t.dashboard.title}</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">{t.dashboard.subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2 md:gap-4">
        <GlobalSearch />
        <NotificationBell notifications={notifications} />
        <div className="flex items-center gap-2 rounded-xl border bg-card px-3 py-2">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-orange-300 to-red-400 text-sm font-bold">
              {name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <span className="hidden max-w-36 truncate text-sm sm:inline">{name}</span>
        </div>
      </div>
    </header>
  );
}
