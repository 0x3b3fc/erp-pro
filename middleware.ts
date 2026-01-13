import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n/config';
import { auth } from '@/lib/auth';

// Create the intl middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];

// Routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/register'];

function getPathnameWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`)) {
      return pathname.replace(`/${locale}`, '');
    }
    if (pathname === `/${locale}`) {
      return '/';
    }
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string | null {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin routes use a separate auth flow and should not be localized.
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Skip API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // First, handle intl
  const intlResponse = intlMiddleware(request);

  // Get locale from path
  const locale = getLocaleFromPath(pathname) || defaultLocale;
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathnameWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathnameWithoutLocale.startsWith(route));

  // For public routes, just return intl response
  if (isPublicRoute) {
    // Get session to check if we should redirect auth routes
    const session = await auth();
    const isAuthenticated = !!session?.user;

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }

    return intlResponse;
  }

  // For protected routes, check authentication
  const session = await auth();
  const isAuthenticated = !!session?.user;

  // Redirect unauthenticated users to login
  if (!isAuthenticated && pathnameWithoutLocale !== '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect root to dashboard or login
  if (pathnameWithoutLocale === '/') {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/${isAuthenticated ? 'dashboard' : 'login'}`;
    return NextResponse.redirect(url);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*', '/((?!api|_next|.*\\..*).*)'],
};
