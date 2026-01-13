export const locales = ['ar', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ar';

export const localeNames: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
};

export const localeConfig: Record<
  Locale,
  {
    name: string;
    direction: 'rtl' | 'ltr';
    dateFormat: string;
    numberLocale: string;
    currency: string;
  }
> = {
  ar: {
    name: 'العربية',
    direction: 'rtl',
    dateFormat: 'yyyy/MM/dd',
    numberLocale: 'ar-EG',
    currency: 'EGP',
  },
  en: {
    name: 'English',
    direction: 'ltr',
    dateFormat: 'dd/MM/yyyy',
    numberLocale: 'en-EG',
    currency: 'EGP',
  },
};

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return localeConfig[locale].direction;
}

export function isRTL(locale: Locale): boolean {
  return localeConfig[locale].direction === 'rtl';
}
