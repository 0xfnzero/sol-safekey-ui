import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always', // Show locale in URL for all languages
  localeDetection: false, // Disable automatic browser language detection
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(zh|en)/:path*'],
};
