import { type EmailOtpType } from '@supabase/supabase-js';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/ru/login';

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });

    if (!error) {
      if (next.startsWith('http://') || next.startsWith('https://')) {
        return NextResponse.redirect(next);
      }

      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = next.startsWith('/') ? next : `/${next}`;
      redirectUrl.search = '';
      return NextResponse.redirect(redirectUrl);
    }
  }

  const errorUrl = request.nextUrl.clone();
  errorUrl.pathname = '/ru/login';
  errorUrl.search = '?error=auth_confirm_failed';
  return NextResponse.redirect(errorUrl);
}
