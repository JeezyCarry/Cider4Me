import { translations, type TranslationDictionary } from './translations';
import type { AppLocale } from '../shared/types';

export { localeStore, localeState, setLocale } from './locale-state';

export function getI18n(locale: AppLocale): TranslationDictionary {
  return translations[locale] ?? translations.en;
}
