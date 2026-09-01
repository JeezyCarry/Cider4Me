import { getConversations, saveConversations } from '../../lib/browser/storage';
import { conversationState } from './conversation-state.svelte';
import type { ChatMessage, Conversation } from '../../lib/shared/types';
import { chatState, resetComposer, resetMessageEditing } from '../chat/chat-state.svelte';
import { openSidebarScreen } from '../chat/sidebar-navigation-state.svelte';

export async function loadConversations(): Promise<void> {
  conversationState.conversations = await getConversations();
}

export async function upsertConversation(conversation: Conversation): Promise<void> {
  const next = [...conversationState.conversations.filter((item) => item.id !== conversation.id), conversation].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  conversationState.conversations = next;
  await saveConversations(next);
}

export function createConversation(title: string, metadata: Conversation['metadata'], messages: ChatMessage[] = []): Conversation {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    metadata,
    messages,
  };
}

export function selectConversation(id: string): void {
  const conversation = conversationState.conversations.find((item) => item.id === id);
  if (!conversation) return;
  chatState.activeConversationId = conversation.id;
  chatState.messages = [...conversation.messages];
  resetComposer();
  resetMessageEditing();
  openSidebarScreen('chat');
}

export function startNewConversation(): void {
  chatState.activeConversationId = null;
  chatState.messages = [];
  resetComposer();
  resetMessageEditing();
  openSidebarScreen('chat');
}

export async function renameConversation(id: string, title: string): Promise<void> {
  const nextTitle = title.trim();
  if (!nextTitle) return;

  const next = conversationState.conversations.map((conversation) =>
    conversation.id === id
      ? {
          ...conversation,
          title: nextTitle,
          updatedAt: new Date().toISOString(),
        }
      : conversation,
  );

  conversationState.conversations = next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  await saveConversations(conversationState.conversations);
}
