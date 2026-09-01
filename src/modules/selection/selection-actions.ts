import { openUrl } from '../../lib/browser/tabs';
import { getI18n } from '../../lib/i18n';
import { contentSettingsState } from '../settings/content/settings-state.svelte';
import { chatState } from '../chat/chat-state.svelte';
import { addPinnedNextMessageContext } from '../context/context-actions';
import { overlayState } from '../overlay/overlay-state.svelte';
import { selectionState } from './selection-state.svelte';
import { startNewConversation } from '../history/conversation-actions';
import { submitChat } from '../chat/chat-actions';
import { escalateInlineToSidebar, sendInlinePrompt } from '../inline-chat/inline-chat-actions';
import { inlineChatState } from '../inline-chat/inline-chat-state.svelte';
import { clearSelection, hideSelectionToolbar } from './selection-visibility';
import { substituteQueryToken, substituteSelectionToken } from '../shared/utils/selection-template';

export function copySelection(): Promise<void> {
  return navigator.clipboard.writeText(selectionState.popupText.trim());
}

export function searchSelection(engineId: string): void {
  const engine = contentSettingsState.settings.searchEngines.find((candidate) => candidate.id === engineId);
  const query = selectionState.popupText.trim();
  if (!engine || !query) return;
  const url = substituteQueryToken(engine.template, query);
  openUrl(url);
  hideSelectionToolbar();
}

export function addSelectionToContext(): void {
  overlayState.isSidebarOpen = true;
  addPinnedNextMessageContext(selectionState.popupText.trim(), getI18n(contentSettingsState.settings.locale).actions.savedSelection);
  clearSelection();
}

export function preparePromptFromSelection(mode: 'explain' | 'translate' | 'ask'): void {
  overlayState.isSidebarOpen = true;
  const selection = selectionState.popupText.trim();
  if (!selection) return;

  if (mode === 'ask' && contentSettingsState.settings.popupChatTarget === 'new-chat') {
    startNewConversation();
  }

  chatState.composer.mode = 'selection';
  if (mode === 'explain') chatState.composer.text = substituteSelectionToken(contentSettingsState.settings.promptTemplates.explainSelection, selection);
  if (mode === 'translate') chatState.composer.text = substituteSelectionToken(contentSettingsState.settings.promptTemplates.translateSelection, selection);
  if (mode === 'ask') chatState.composer.text = substituteSelectionToken(contentSettingsState.settings.promptTemplates.askSelection, selection);
  selectionState.capturedSelection = selection;
  hideSelectionToolbar();

  if (contentSettingsState.settings.autoSendQuickActions && (mode === 'explain' || mode === 'translate')) {
    void submitChat();
  }
}

export function submitAskAiFromPopup(): void {
  const currentText = selectionState.popupText.trim();
  const originalSelection = selectionState.selectedText.trim();

  if (!currentText) return;

  // Follow-up questions always send the raw typed text.
  // The first message uses the template only when the input still holds the unchanged selection.
  let prompt: string;
  if (inlineChatState.isActive) {
    prompt = currentText;
  } else if (currentText !== originalSelection) {
    prompt = currentText;
  } else {
    prompt = substituteSelectionToken(contentSettingsState.settings.promptTemplates.askSelection, currentText);
  }

  selectionState.capturedSelection = currentText;
  selectionState.popupText = '';

  sendInlinePrompt(prompt);
}

export function openInlineChatInSidebar(): void {
  escalateInlineToSidebar();
  hideSelectionToolbar();
}

export function searchSelectionWithDefaultEngine(): void {
  const engine = contentSettingsState.settings.searchEngines.find((candidate) => candidate.enabled);
  if (!engine) return;
  searchSelection(engine.id);
}

export function openSelectionAsUrl(): void {
  const value = selectionState.popupText.trim();
  if (!value) return;

  try {
    const url = new URL(value);
    openUrl(url.toString());
    hideSelectionToolbar();
  } catch {
    // ignore invalid url attempts
  }
}
