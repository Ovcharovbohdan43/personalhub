import { RegisterForm } from '@/components/auth/register-form';
import { defaultLocale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export default async function RegisterPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = getDictionary(locale);

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="glass w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-500">🌈</div>
          <h1 className="text-2xl font-bold">{t.auth.register}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.createAccount}</p>
        </div>
        <RegisterForm />
      </section>
    </main>
  );
}
