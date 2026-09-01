import { get, writable } from 'svelte/store';
import type { AppLocale } from '../shared/types';

export const localeStore = writable<AppLocale>('en');

export const localeState = {
  get locale(): AppLocale {
    return get(localeStore);
  },
};

export function setLocale(locale: AppLocale): void {
  localeStore.set(locale);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale;
  }
}
