import { describe, expect, it, beforeEach } from 'bun:test';
import { addSelectionToContext, submitAskAiFromPopup } from '../src/modules/selection/selection-actions';
import { hideSelectionToolbar, setSelection } from '../src/modules/selection/selection-visibility';
import { overlayState } from '../src/modules/overlay/overlay-state.svelte';
import { selectionState } from '../src/modules/selection/selection-state.svelte';
import { contextState } from '../src/modules/context/context-state.svelte';
import { inlineChatState, resetInlineChat } from '../src/modules/inline-chat/inline-chat-state.svelte';

const FAKE_RECT = { top: 0, left: 0, width: 10, height: 10 } as DOMRect;

function pageSelection(text: string) {
  return { text, rect: FAKE_RECT, source: 'page' as const };
}

describe('selection-actions', () => {
  beforeEach(() => {
    overlayState.isSidebarOpen = false;
    selectionState.popupText = 'Test selection';
    selectionState.selectedText = 'Test selection';
    selectionState.isSelectionVisible = false;
    selectionState.selectionRect = null;
    selectionState.dismissedSelectionText = null;
    contextState.explicitContextItems = [];
    resetInlineChat();
  });

  it('addSelectionToContext opens the sidebar and adds the selection to context', () => {
    expect(overlayState.isSidebarOpen).toBe(false);
    
    addSelectionToContext();
    
    expect(overlayState.isSidebarOpen).toBe(true);
    expect(contextState.explicitContextItems.length).toBe(1);
    expect(contextState.explicitContextItems[0].text).toBe('Test selection');
    expect(selectionState.popupText).toBe('');
  });

  it('addSelectionToContext does not close the sidebar if it was already open', () => {
    overlayState.isSidebarOpen = true;
    
    addSelectionToContext();
    
    expect(overlayState.isSidebarOpen).toBe(true);
  });

  it('submitAskAiFromPopup starts the inline chat with the template when text is unchanged', () => {
    selectionState.selectedText = 'Original selection';
    selectionState.popupText = 'Original selection';
    
    submitAskAiFromPopup();
    
    // The inline chat is active and the selection is shown as context
    expect(inlineChatState.isActive).toBe(true);
    expect(inlineChatState.selectionContext).toBe('Original selection');
    // The default template contains "selection" and "context"
    expect(inlineChatState.messages.length).toBe(2);
    expect(inlineChatState.messages[0].content).toContain('Original selection');
    expect(inlineChatState.messages[0].content).toContain('context');
    // Input is cleared so a follow-up can be typed
    expect(selectionState.popupText).toBe('');
  });

  it('submitAskAiFromPopup uses raw text when text is changed by user', () => {
    selectionState.selectedText = 'Original selection';
    selectionState.popupText = 'My custom question';
    
    submitAskAiFromPopup();
    
    expect(inlineChatState.isActive).toBe(true);
    expect(inlineChatState.messages[0].content).toBe('My custom question');
  });

  it('submitAskAiFromPopup appends a follow-up question to the inline history', () => {
    selectionState.selectedText = 'Original selection';
    selectionState.popupText = 'Original selection';
    submitAskAiFromPopup();
    // simulate the first streaming reply completing so a follow-up can be typed
    inlineChatState.isLoading = false;
    inlineChatState.messages.at(-1)!.status = 'done';

    selectionState.popupText = 'Follow up question';
    submitAskAiFromPopup();

    // 4 messages: first user + assistant, second user + assistant
    expect(inlineChatState.messages.length).toBe(4);
    expect(inlineChatState.messages[2].content).toBe('Follow up question');
    expect(selectionState.popupText).toBe('');
  });

  it('hides toolbar and keeps it hidden for the same selection text', () => {
    setSelection(pageSelection('foo'));
    expect(selectionState.isSelectionVisible).toBe(true);

    hideSelectionToolbar();
    expect(selectionState.isSelectionVisible).toBe(false);

    setSelection(pageSelection('foo'));
    expect(selectionState.isSelectionVisible).toBe(false);
  });

  it('re-arms when the selection collapses after a dismissal', () => {
    setSelection(pageSelection('foo'));
    hideSelectionToolbar();
    expect(selectionState.isSelectionVisible).toBe(false);

    setSelection(null);
    setSelection(pageSelection('foo'));
    expect(selectionState.isSelectionVisible).toBe(true);
  });

  it('re-arms when a different text is selected after a dismissal', () => {
    setSelection(pageSelection('foo'));
    hideSelectionToolbar();

    setSelection(pageSelection('bar'));
    expect(selectionState.isSelectionVisible).toBe(true);
  });

  it('addSelectionToContext dismisses so a same-text re-detection does not re-show', () => {
    setSelection(pageSelection('Test selection'));
    expect(selectionState.isSelectionVisible).toBe(true);

    addSelectionToContext();
    expect(selectionState.isSelectionVisible).toBe(false);

    setSelection(pageSelection('Test selection'));
    expect(selectionState.isSelectionVisible).toBe(false);
  });
});
