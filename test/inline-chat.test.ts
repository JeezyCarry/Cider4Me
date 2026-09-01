import { describe, expect, it, beforeEach, spyOn } from 'bun:test';
import { openInlineChatInSidebar, submitAskAiFromPopup } from '../src/modules/selection/selection-actions';
import { escalateInlineToSidebar, sendInlinePrompt } from '../src/modules/inline-chat/inline-chat-actions';
import { inlineChatState, resetInlineChat } from '../src/modules/inline-chat/inline-chat-state.svelte';
import { selectionState } from '../src/modules/selection/selection-state.svelte';
import { overlayState } from '../src/modules/overlay/overlay-state.svelte';
import { chatState } from '../src/modules/chat/chat-state.svelte';
import * as conversationActions from '../src/modules/history/conversation-actions';

function finishStream(): void {
  inlineChatState.isLoading = false;
  const last = inlineChatState.messages.at(-1);
  if (last) last.status = 'done';
}

describe('inline chat', () => {
  let upsertSpy: any;

  beforeEach(() => {
    resetInlineChat();
    selectionState.selectedText = 'Base selection';
    selectionState.popupText = '';
    overlayState.isSidebarOpen = false;
    chatState.messages = [];
    chatState.activeConversationId = null;
    upsertSpy = spyOn(conversationActions, 'upsertConversation').mockImplementation(() => Promise.resolve());
  });

  it('sendInlinePrompt initializes the session and appends user + assistant messages', () => {
    sendInlinePrompt('Question about selection');

    expect(inlineChatState.isActive).toBe(true);
    expect(inlineChatState.selectionContext).toBe('Base selection');
    expect(inlineChatState.messages).toHaveLength(2);
    expect(inlineChatState.messages[0].role).toBe('user');
    expect(inlineChatState.messages[0].content).toBe('Question about selection');
    expect(inlineChatState.messages[1].role).toBe('assistant');
    expect(inlineChatState.messages[1].status).toBe('streaming');
  });

  it('ignores empty prompts and prompts while a stream is running', () => {
    sendInlinePrompt('   ');
    expect(inlineChatState.isActive).toBe(false);

    sendInlinePrompt('First');
    const before = inlineChatState.messages.length;
    sendInlinePrompt('blocked');
    expect(inlineChatState.messages.length).toBe(before);
  });

  it('escalateInlineToSidebar creates a conversation with history and selection context', () => {
    sendInlinePrompt('First');
    finishStream();
    sendInlinePrompt('Second');
    finishStream();

    escalateInlineToSidebar();

    expect(upsertSpy).toHaveBeenCalled();
    const created = upsertSpy.mock.calls[0][0];
    // Selection context is included first, then the full message history
    expect(created.messages[0].content).toBe('Base selection');
    expect(created.messages.some((m: { content: string }) => m.content === 'First')).toBe(true);
    expect(created.messages.some((m: { content: string }) => m.content === 'Second')).toBe(true);
    expect(chatState.activeConversationId).toBe(created.id);
    expect(chatState.messages).toEqual(created.messages);
    expect(overlayState.isSidebarOpen).toBe(true);
  });

  it('openInlineChatInSidebar resets the inline session after escalating', () => {
    sendInlinePrompt('Hi');
    finishStream();

    openInlineChatInSidebar();

    expect(inlineChatState.isActive).toBe(false);
    expect(inlineChatState.messages).toHaveLength(0);
    expect(overlayState.isSidebarOpen).toBe(true);
  });

  it('submitAskAiFromPopup wires the first message through the inline flow', () => {
    selectionState.popupText = 'Base selection';
    submitAskAiFromPopup();

    expect(inlineChatState.isActive).toBe(true);
    expect(inlineChatState.selectionContext).toBe('Base selection');
    expect(inlineChatState.messages[0].content).toContain('Base selection');
  });
});
