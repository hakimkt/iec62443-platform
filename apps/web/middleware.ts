import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/mfa',
  '/sso/callback',
];

const AUTH_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/mfa',
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

function isAppPath(pathname: string): boolean {
  return (
    pathname === '/dashboard' ||
    pathname.startsWith('/dashboard/') ||
    pathname === '/assessments' ||
    pathname.startsWith('/assessments/') ||
    pathname === '/requirements' ||
    pathname.startsWith('/requirements/') ||
    pathname === '/assets' ||
    pathname.startsWith('/assets/') ||
    pathname === '/purdue' ||
    pathname.startsWith('/purdue/') ||
    pathname === '/zones' ||
    pathname.startsWith('/zones/') ||
    pathname === '/findings' ||
    pathname.startsWith('/findings/') ||
    pathname === '/risks' ||
    pathname.startsWith('/risks/') ||
    pathname === '/evidence' ||
    pathname.startsWith('/evidence/') ||
    pathname === '/remediation' ||
    pathname.startsWith('/remediation/') ||
    pathname === '/csms' ||
    pathname.startsWith('/csms/') ||
    pathname === '/reports' ||
    pathname.startsWith('/reports/') ||
    pathname === '/admin' ||
    pathname.startsWith('/admin/')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/static') ||
    pathname.includes('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const authStorage = request.cookies.get('auth-storage')?.value;
  let isAuthenticated = false;

  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      isAuthenticated = parsed?.state?.isAuthenticated === true;
    } catch {
      isAuthenticated = false;
    }
  }

  if (!isAuthenticated && (isAppPath(pathname) || !isPublicPath(pathname))) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthenticated && isAuthPath(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
