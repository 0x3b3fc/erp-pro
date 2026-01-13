import { getRequestConfig } from 'next-intl/server';
import { locales, defaultLocale, type Locale } from '@/lib/i18n/config';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming locale is valid, fallback to default
  const resolvedLocale =
    locale && locales.includes(locale as Locale) ? locale : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`@/messages/${resolvedLocale}.json`)).default,
    timeZone: 'Africa/Cairo',
    now: new Date(),
  };
});
