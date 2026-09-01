import { startChatStream } from '../../lib/ai/chat-client';
import { getI18n } from '../../lib/i18n';
import type { ChatMessage, ProviderMessage } from '../../lib/shared/types';
import { getAllModels } from '../../lib/shared/model-registry';
import { chatState } from '../chat/chat-state.svelte';
import { resolveSelectedModelRef } from '../chat/chat-submit';
import { createConversation, upsertConversation } from '../history/conversation-actions';
import { buildChatRequest } from '../chat/prompt-builder';
import { openSidebar } from '../overlay/overlay-state.svelte';
import { selectionState } from '../selection/selection-state.svelte';
import { contentSettingsState } from '../settings/content/settings-state.svelte';
import { initInlineChat, inlineChatState } from './inline-chat-state.svelte';

function toProviderMessage(message: ChatMessage): ProviderMessage {
  return { role: message.role, content: message.content };
}

export function sendInlinePrompt(prompt: string): void {
  const trimmed = prompt.trim();
  if (!trimmed || inlineChatState.isLoading) return;

  if (!inlineChatState.isActive) {
    initInlineChat(selectionState.selectedText.trim());
  }

  const userMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    kind: 'plain',
    content: trimmed,
    createdAt: new Date().toISOString(),
  };
  const assistantMessage: ChatMessage = {
    id: crypto.randomUUID(),
    role: 'assistant',
    kind: 'plain',
    content: '',
    createdAt: new Date().toISOString(),
    status: 'streaming',
  };

  const history = inlineChatState.messages.filter((message) => message.status !== 'streaming');
  inlineChatState.messages = [...history, userMessage, assistantMessage];
  inlineChatState.isLoading = true;

  const requestId = crypto.randomUUID();
  inlineChatState.currentRequestId = requestId;

  const freshSettings = contentSettingsState.settings;
  const activeMode = freshSettings.modes?.find((mode) => mode.id === freshSettings.activeModeId);
  const combinedSystemPrompt = [freshSettings.systemPrompt || '', activeMode?.systemPrompt || ''].filter(Boolean).join('\n\n');

  const request = buildChatRequest({
    userPrompt: trimmed,
    conversationMessages: history.map(toProviderMessage),
    explicitContext: [],
    selectionContext: inlineChatState.selectionContext ? { text: inlineChatState.selectionContext } : null,
    systemPrompt: combinedSystemPrompt,
  });

  const stop = startChatStream(requestId, resolveSelectedModelRef(getAllModels(freshSettings), freshSettings.defaultModelId), request.messages, {
    onChunk(chunk) {
      const last = inlineChatState.messages.at(-1);
      if (last) last.content += chunk;
    },
    onSuccess(content) {
      const last = inlineChatState.messages.at(-1);
      if (last) {
        last.content = content;
        last.status = 'done';
      }
      inlineChatState.isLoading = false;
      inlineChatState.currentRequestId = null;
      inlineChatState.stopStream = null;
      stop();
    },
    onError(error) {
      const last = inlineChatState.messages.at(-1);
      if (last) {
        last.content = error.message;
        last.status = 'error';
      }
      inlineChatState.isLoading = false;
      inlineChatState.currentRequestId = null;
      inlineChatState.stopStream = null;
      stop();
    },
  });

  inlineChatState.stopStream = stop;
}

export function escalateInlineToSidebar(): void {
  if (!inlineChatState.isActive || inlineChatState.messages.length === 0) return;

  const messages: ChatMessage[] = inlineChatState.selectionContext
    ? [
        {
          id: crypto.randomUUID(),
          role: 'user',
          kind: 'plain',
          content: inlineChatState.selectionContext,
          createdAt: new Date().toISOString(),
        },
        ...inlineChatState.messages,
      ]
    : inlineChatState.messages;

  const firstUserText =
    inlineChatState.messages.find((message) => message.role === 'user')?.content ?? '';
  const fallbackTitle = getI18n(contentSettingsState.settings.locale).sidebar.defaults.newConversationTitle;

  const created = createConversation(
    firstUserText.slice(0, 60) || fallbackTitle,
    {
      origin: window.location.origin,
      url: window.location.href,
      title: document.title,
      branchGroupId: crypto.randomUUID(),
    },
    messages,
  );

  chatState.activeConversationId = created.id;
  chatState.messages = [...messages];
  void upsertConversation(created);
  openSidebar();
}
