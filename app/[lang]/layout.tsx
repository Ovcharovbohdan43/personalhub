import { notFound } from 'next/navigation';
import { AppProviders } from '@/components/providers/app-providers';
import { isLocale } from '@/i18n/config';

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return <AppProviders locale={lang}>{children}</AppProviders>;
}
