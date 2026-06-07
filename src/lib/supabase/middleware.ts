import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  defaultLocale,
  isLocale,
  LANG_COOKIE,
  stripLocale,
  withLocale,
  type Locale,
} from '@/i18n/config';

const AUTH_ROUTES = ['/login', '/register', '/forgot-password'];
const RECOVERY_COOKIE = 'personal-hub-password-recovery';
const PROTECTED_PATHS = [
  '/',
  '/reset-password',
  '/finances',
  '/notes',
  '/tasks',
  '/bookmarks',
  '/documents',
  '/ai-assessment',
  '/profile',
  '/search',
  '/settings',
];

function getSavedLocale(request: NextRequest): Locale {
  const cookieValue = request.cookies.get(LANG_COOKIE)?.value;
  return cookieValue && isLocale(cookieValue) ? cookieValue : defaultLocale;
}

function isAuthRoute(path: string) {
  return AUTH_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));
}

function isProtectedRoute(path: string) {
  if (isAuthRoute(path)) return false;
  return PROTECTED_PATHS.some((route) =>
    route === '/' ? path === '/' : path === route || path.startsWith(`${route}/`),
  );
}

export async function updateSession(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  const { pathname } = request.nextUrl;
  const savedLocale = getSavedLocale(request);
  const { locale: pathLocale, path: strippedPath } = stripLocale(pathname);
  const hasPendingPasswordRecovery = request.cookies.get(RECOVERY_COOKIE)?.value === '1';

  if (!pathLocale) {
    if (pathname.startsWith('/auth/')) {
      return NextResponse.next({ request });
    }

    const url = request.nextUrl.clone();
    url.pathname = withLocale(savedLocale, pathname);
    const response = NextResponse.redirect(url);
    response.cookies.set(LANG_COOKIE, savedLocale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
    return response;
  }

  let response = NextResponse.next({ request });
  response.cookies.set(LANG_COOKIE, pathLocale, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (user && hasPendingPasswordRecovery && strippedPath !== '/reset-password') {
    const url = request.nextUrl.clone();
    url.pathname = withLocale(pathLocale, '/reset-password');
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (!user && isProtectedRoute(strippedPath)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale(pathLocale, '/login');
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute(strippedPath)) {
    const url = request.nextUrl.clone();
    url.pathname = withLocale(pathLocale, '/');
    return NextResponse.redirect(url);
  }

  return response;
}
