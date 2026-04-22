import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Check for language cookie
  const cookieLang = request.cookies.get('ins_lang')?.value;
  
  if (cookieLang === 'en') {
    request.nextUrl.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  } else if (cookieLang === 'fr') {
    request.nextUrl.pathname = `/fr${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // No cookie, check Accept-Language header
  const acceptLang = request.headers.get('accept-language');
  let locale = defaultLocale;
  
  if (acceptLang && acceptLang.toLowerCase().startsWith('en')) {
    locale = 'en';
  }

  if (locale === 'en') {
    request.nextUrl.pathname = `/en${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  } else {
    request.nextUrl.pathname = `/fr${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, API) and public files
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
