import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="min-h-screen w-full max-w-full overflow-x-hidden p-4 pb-28 sm:p-5 sm:pb-28 lg:ml-64 lg:w-[calc(100%-16rem)] lg:p-8 lg:pb-8">{children}</main>
      <MobileNav />
    </>
  );
}
