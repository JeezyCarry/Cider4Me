import type { ChatMessage } from '../../lib/shared/types';

export const inlineChatState = $state({
  isActive: false,
  selectionContext: '',
  messages: [] as ChatMessage[],
  isLoading: false,
  currentRequestId: null as string | null,
  stopStream: null as (() => void) | null,
});

export function initInlineChat(selectionContext: string): void {
  inlineChatState.isActive = true;
  inlineChatState.selectionContext = selectionContext;
  inlineChatState.messages = [];
  inlineChatState.isLoading = false;
  inlineChatState.currentRequestId = null;
  inlineChatState.stopStream = null;
}

export function resetInlineChat(): void {
  if (inlineChatState.stopStream) {
    inlineChatState.stopStream();
  }
  inlineChatState.isActive = false;
  inlineChatState.selectionContext = '';
  inlineChatState.messages = [];
  inlineChatState.isLoading = false;
  inlineChatState.currentRequestId = null;
  inlineChatState.stopStream = null;
}
