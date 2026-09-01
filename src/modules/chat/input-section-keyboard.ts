import type { ComposerSubmitMode, AppLocale } from '../../lib/shared/types';
import { getI18n } from '../../lib/i18n';

export interface ComposerKeyboardInput {
  disabled: boolean;
  submitMode: ComposerSubmitMode;
  key: string;
  shiftKey: boolean;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  isComposing: boolean;
}

export function getComposerKeyboardHint(submitMode: ComposerSubmitMode, locale: AppLocale = 'en'): string {
  return getI18n(locale).sidebar.composer.keyboardHint(submitMode);
}

export function shouldSubmitComposerFromKeyboard(input: ComposerKeyboardInput): boolean {
  if (input.disabled) return false;
  if (input.isComposing || input.key !== 'Enter') return false;
  if (input.altKey || input.ctrlKey || input.metaKey) return false;

  return input.submitMode === 'enter' ? !input.shiftKey : input.shiftKey;
}
