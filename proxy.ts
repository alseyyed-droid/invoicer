import { NextResponse, type NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'ar'],
  defaultLocale: 'en'
});

const publicRoutes = new Set(['/en/login', '/ar/login']);
const publicRoutePrefixes = ['/en/shared/invoices/', '/ar/shared/invoices/'];

function isPublicPath(pathname: string) {
  return publicRoutes.has(pathname) || publicRoutePrefixes.some((prefix) => pathname.startsWith(prefix));
}

export default async function proxy(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  const { pathname } = request.nextUrl;
  const isPublicRoute = isPublicPath(pathname);
  const matchedLocale = pathname.match(/^\/(en|ar)(?:\/|$)/)?.[1] ?? 'en';

  if (!token && (pathname === '/' || !isPublicRoute)) {
    const loginUrl = new URL(`/${matchedLocale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isPublicRoute) {
    const appUrl = new URL(`/${matchedLocale}`, request.url);
    return NextResponse.redirect(appUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ['/', '/(ar|en)/:path*']
};
