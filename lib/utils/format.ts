import { format as dateFnsFormat } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { Locale } from '@/lib/i18n/config';

const dateLocales = {
  ar: ar,
  en: enUS,
};

/**
 * Format a number as currency (Egyptian Pounds)
 */
export function formatCurrency(
  amount: number,
  locale: Locale = 'ar',
  currency: string = 'EGP'
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number with locale-specific formatting
 */
export function formatNumber(
  value: number,
  locale: Locale = 'ar',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(
    locale === 'ar' ? 'ar-EG' : 'en-EG',
    options
  ).format(value);
}

/**
 * Format a percentage
 */
export function formatPercent(
  value: number,
  locale: Locale = 'ar',
  decimals: number = 2
): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

/**
 * Format a date based on locale
 */
export function formatDate(
  date: Date | string,
  locale: Locale = 'ar',
  formatStr: string = 'PPP'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateFnsFormat(dateObj, formatStr, {
    locale: dateLocales[locale],
  });
}

/**
 * Format date for display in tables (short format)
 */
export function formatDateShort(
  date: Date | string,
  locale: Locale = 'ar'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatStr = locale === 'ar' ? 'yyyy/MM/dd' : 'dd/MM/yyyy';
  return dateFnsFormat(dateObj, formatStr, {
    locale: dateLocales[locale],
  });
}

/**
 * Format datetime
 */
export function formatDateTime(
  date: Date | string,
  locale: Locale = 'ar'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const formatStr = locale === 'ar' ? 'yyyy/MM/dd HH:mm' : 'dd/MM/yyyy HH:mm';
  return dateFnsFormat(dateObj, formatStr, {
    locale: dateLocales[locale],
  });
}
