import { getCurrentSelection, observeSelection, type ObservedSelection } from '../../lib/context/selection-observer';
import { EXTENSION_ROOT_ID } from '../../lib/shared/constants';
import { canInjectOnUrl } from '../../lib/browser/site-access';
import { siderLogInfo } from '../../lib/browser/sider-log';
import { contentSettingsState } from '../settings/content/settings-state.svelte';
import { contextState } from '../context/context-state.svelte';
import { overlayState } from '../overlay/overlay-state.svelte';
import { resetInlineChat } from '../inline-chat/inline-chat-state.svelte';
import { selectionState } from './selection-state.svelte';

function canShowSelectionToolbarOnCurrentPage(): boolean {
  return !overlayState.isLauncherTemporarilyHidden && canInjectOnUrl(window.location.href, contentSettingsState.settings.siteAccessPolicy);
}

function isExtensionInteractionActive(): boolean {
  const host = document.getElementById(EXTENSION_ROOT_ID);
  if (!host) return false;

  if (document.activeElement === host) return true;

  const shadowActiveElement = host.shadowRoot?.activeElement;
  return Boolean(shadowActiveElement);
}

function resetSelectionState(): void {
  resetInlineChat();
  selectionState.selectedText = '';
  selectionState.popupText = '';
  selectionState.capturedSelection = '';
  selectionState.isSelectionVisible = false;
  selectionState.selectionRect = null;
  selectionState.dragOffset = { x: 0, y: 0 };
  contextState.currentSelectionContext = null;
}

export function setSelection(selection: ObservedSelection | null): void {
  if (!canShowSelectionToolbarOnCurrentPage()) {
    siderLogInfo('selection', 'cannot show toolbar on current page');
    resetSelectionState();
    return;
  }

  if (!selection) {
    const interactionActive = isExtensionInteractionActive();
    if (interactionActive) {
      siderLogInfo('selection', 'extension interaction active, keeping selection');
      return;
    }
    selectionState.dismissedSelectionText = null;
    resetSelectionState();
    return;
  }

  siderLogInfo('selection', 'setting selection state', { source: selection.source, hasRect: Boolean(selection.rect), text: selection.text.slice(0, 20) });

  if (selection.source === 'toolbar') return;

  if (selection.source === 'extension') {
    resetSelectionState();
    return;
  }

  if (selection.text === selectionState.dismissedSelectionText) return;
  selectionState.dismissedSelectionText = null;

  selectionState.selectedText = selection.text;
  selectionState.popupText = selection.text;
  selectionState.capturedSelection = selection.text;
  selectionState.isSelectionVisible = Boolean(selection.text && selection.rect);
  selectionState.selectionRect = selection.rect
    ? {
        top: selection.rect.top + window.scrollY,
        left: selection.rect.left + window.scrollX,
        width: selection.rect.width,
        height: selection.rect.height,
      }
    : null;
  contextState.currentSelectionContext = selection.text ? { text: selection.text } : null;
}

export function clearSelection(): void {
  selectionState.dismissedSelectionText = selectionState.selectedText || null;
  resetSelectionState();
}

export function hideSelectionToolbar(): void {
  resetInlineChat();
  selectionState.dismissedSelectionText = selectionState.selectedText || null;
  selectionState.isSelectionVisible = false;
  selectionState.selectionRect = null;
}

export function startSelectionObserver(): () => void {
  setSelection(getCurrentSelection());
  return observeSelection((selection) => setSelection(selection));
}
