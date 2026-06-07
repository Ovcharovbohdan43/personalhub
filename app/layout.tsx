import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'Personal Hub', description: 'Personal hub for finances, tasks, notes and bookmarks' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
