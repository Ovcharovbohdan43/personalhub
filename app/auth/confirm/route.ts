import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const RECOVERY_COOKIE = 'personal-hub-password-recovery';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/ru/login';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      const redirectUrl = request.nextUrl.clone();

      if (next.startsWith('http://') || next.startsWith('https://')) {
        const nextUrl = new URL(next);
        redirectUrl.pathname = nextUrl.pathname;
        redirectUrl.search = nextUrl.search;
      } else {
        redirectUrl.pathname = next.startsWith('/') ? next : `/${next}`;
        redirectUrl.search = '';
      }

      if (type === 'recovery') {
        const localeMatch = redirectUrl.pathname.match(/^\/(ru|en)(?:\/|$)/);
        const locale = localeMatch?.[1] ?? 'ru';
        redirectUrl.pathname = `/${locale}/reset-password`;
        redirectUrl.search = '';
      }

      const response = NextResponse.redirect(redirectUrl);
      if (type === 'recovery') {
        response.cookies.set(RECOVERY_COOKIE, '1', {
          httpOnly: true,
          maxAge: 60 * 20,
          path: '/',
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
        });
      }

      return response;
    }
  }

  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = '/ru/login';
  errorUrl.search = '?error=auth_confirm_failed';
  return NextResponse.redirect(errorUrl);
}
