import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'USD', locale: string = 'en-US') {
  const currencyLocale = locale.startsWith('ar') ? 'en-US-u-nu-latn' : locale;

  return new Intl.NumberFormat(currencyLocale, {
    style: 'currency',
    currency: currency,
    numberingSystem: 'latn'
  }).format(amount);
}

export function formatDate(date: Date | string, locale: string = 'en-US') {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    numberingSystem: 'latn'
  }).format(new Date(date));
}
