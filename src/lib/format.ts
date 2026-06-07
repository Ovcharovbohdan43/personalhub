export function formatMoney(amount: number, currency = 'GBP') {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount);
}

import type { Dictionary } from '@/i18n/types';
import type { Locale } from '@/i18n/config';

export function formatDate(value: string | null, locale: Locale = 'ru') {
  if (!value) return '—';
  const intlLocale = locale === 'en' ? 'en-GB' : 'ru-RU';
  return new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'short' }).format(new Date(value));
}

export function monthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** index;
  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

export function getPriorityLabels(dict: Dictionary): Record<number, string> {
  return { 1: dict.priority.high, 2: dict.priority.medium, 3: dict.priority.low };
}
