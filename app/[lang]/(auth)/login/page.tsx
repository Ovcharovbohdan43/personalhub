import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { defaultLocale, isLocale, withLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ lang }, query] = await Promise.all([params, searchParams]);
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = getDictionary(locale);

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="glass w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">🌈</div>
          <h1 className="text-2xl font-bold">{t.auth.login}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.welcomeBack}</p>
        </div>
        <LoginForm next={query.next} />
        <p className="mt-4 text-center text-sm">
          <Link className="text-primary" href={withLocale(locale, '/forgot-password')}>{t.auth.forgotPassword}</Link>
        </p>
      </section>
    </main>
  );
}
