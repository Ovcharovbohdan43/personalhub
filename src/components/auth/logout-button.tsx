'use client';

import { LogOut } from 'lucide-react';
import { logoutAction } from '@/modules/auth/actions';
import { useLanguage } from '@/components/providers/language-provider';

export function LogoutButton({ className }: { className?: string }) {
  const { dictionary: t, locale } = useLanguage();

  return (
    <form action={logoutAction}>
      <input type="hidden" name="locale" value={locale} />
      <button type="submit" className={className ?? 'nav-item w-full'}>
        <LogOut size={18} /> {t.nav.logout}
      </button>
    </form>
  );
}
