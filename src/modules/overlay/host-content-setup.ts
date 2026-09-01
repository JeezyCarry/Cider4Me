import browser from 'webextension-polyfill';
import { parsePageContextFromDocument } from '../../lib/context/page-parser';
import { overlayState } from './overlay-state.svelte';
import { startSelectionObserver } from '../selection/selection-visibility';
import { loadContentSettings, registerContentSettingsSync } from '../settings/content/settings-actions';

export function startHostSetup(): () => void {
  void loadContentSettings();
  const stopSettingsSync = registerContentSettingsSync();
  const stopSelectionObserver = startSelectionObserver();

  const handleKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      overlayState.isCustomPromptOpen = false;
      if (overlayState.isSidebarOpen) overlayState.isSidebarOpen = false;
    }
  };
  window.addEventListener('keydown', handleKeydown);

  const handleRuntimeMessage = async (message: unknown): Promise<unknown> => {
    if (
      typeof message !== 'object' ||
      message === null ||
      (message as { type?: string }).type !== 'GET_ACTIVE_TAB_CONTEXT'
    ) {
      return;
    }

    const selection = window.getSelection()?.toString() || '';
    try {
      const parsed = parsePageContextFromDocument(document);
      return {
        success: true,
        context: {
          url: window.location.href,
          title: document.title,
          content: parsed.content,
          selection: selection || null,
        },
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
  browser.runtime.onMessage.addListener(handleRuntimeMessage);

  return () => {
    window.removeEventListener('keydown', handleKeydown);
    browser.runtime.onMessage.removeListener(handleRuntimeMessage);
    stopSettingsSync();
    stopSelectionObserver();
  };
}
