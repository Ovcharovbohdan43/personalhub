import { Sidebar } from './sidebar';
import { MobileNav } from './mobile-nav';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <main className="mx-auto box-border min-h-screen w-full max-w-[100vw] overflow-x-clip px-4 py-4 pb-28 sm:px-5 sm:py-5 sm:pb-28 lg:ml-64 lg:mr-0 lg:w-[calc(100%-16rem)] lg:max-w-none lg:p-8 lg:pb-8">{children}</main>
      <MobileNav />
    </>
  );
}
