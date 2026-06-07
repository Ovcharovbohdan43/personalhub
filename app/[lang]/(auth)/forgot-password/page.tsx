import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { defaultLocale, isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/get-dictionary';

export default async function ForgotPasswordPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const locale = isLocale(lang) ? lang : defaultLocale;
  const t = getDictionary(locale);

  return (
    <main className="grid min-h-screen place-items-center p-4">
      <section className="glass w-full max-w-md p-5 sm:p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">{t.auth.resetPassword}</h1>
          <p className="text-sm text-muted-foreground">{t.auth.resetHint}</p>
        </div>
        <ForgotPasswordForm />
      </section>
    </main>
  );
}
