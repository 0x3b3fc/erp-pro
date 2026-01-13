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
  const hostname = request.headers.get('host') || '';

  // Admin routes use a separate auth flow and should not be localized.
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Skip API routes
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Skip static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Tenant subdomain is derived from host, but validation happens in server routes.
  const subdomain = hostname.split('.')[0];

  // Get locale from path first
  const locale = getLocaleFromPath(pathname) || defaultLocale;
  const pathnameWithoutLocale = getPathnameWithoutLocale(pathname);

  // Check if current route is public
  const isPublicRoute = publicRoutes.some(route => pathnameWithoutLocale.startsWith(route));
  const isAuthRoute = authRoutes.some(route => pathnameWithoutLocale.startsWith(route));

  // For protected routes, check authentication first (before intl middleware)
  if (!isPublicRoute) {
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
  }

  // For public routes, check if authenticated and redirect away from auth pages
  if (isPublicRoute) {
    const session = await auth();
    const isAuthenticated = !!session?.user;

    // Redirect authenticated users away from auth pages
    if (isAuthenticated && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  // Finally, handle intl middleware (must be last to handle routing)
  const intlResponse = intlMiddleware(request);
  
  // Add subdomain header for downstream handlers, if needed.
  if (subdomain && intlResponse instanceof NextResponse) {
    intlResponse.headers.set('x-tenant-subdomain', subdomain);
  }

  return intlResponse;
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*', '/((?!api|_next|.*\\..*).*)'],
};
