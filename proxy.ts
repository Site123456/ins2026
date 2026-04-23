import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const locales = ['fr', 'en'];
const defaultLocale = 'fr';

function getPreferredLocale(acceptLang: string | null): string {
  if (!acceptLang) return defaultLocale;
  
  const languages = acceptLang.split(',').map(lang => {
    const parts = lang.split(';q=');
    const localeStr = parts[0].trim().toLowerCase();
    const locale = localeStr.split('-')[0];
    const q = parts.length > 1 ? parseFloat(parts[1]) : 1.0;
    return { locale, q };
  }).sort((a, b) => b.q - a.q);

  for (const { locale } of languages) {
    if (locale === 'en' || locale === 'fr') {
      return locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  // Check for language cookie
  const cookieLang = request.cookies.get('ins_lang')?.value;
  
  if (cookieLang === 'en' || cookieLang === 'fr') {
    request.nextUrl.pathname = `/${cookieLang}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(request.nextUrl);
  }

  // No cookie, check Accept-Language header
  const acceptLang = request.headers.get('accept-language');
  const locale = getPreferredLocale(acceptLang);
  
  request.nextUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    // Skip all internal paths (_next, API) and public files
    '/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)',
  ],
};
