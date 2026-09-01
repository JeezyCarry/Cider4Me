import type { ChatMessage } from '../../lib/shared/types';
import { stripTrailingCopySuffix } from '../../lib/shared/title';

export interface PreparedMessageEdit {
  draft: string;
  retainedMessages: ChatMessage[];
}

export function cloneChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.map((message) => ({ ...message }));
}

export function buildConversationBackupTitle(title: string, existingTitles: string[]): string {
  const trimmedTitle = title.trim();
  const baseTitle = stripTrailingCopySuffix(trimmedTitle || 'Conversation');
  const usedTitles = new Set(existingTitles);

  let copyNumber = 1;
  let nextTitle = `${baseTitle} (${copyNumber})`;
  while (usedTitles.has(nextTitle)) {
    copyNumber += 1;
    nextTitle = `${baseTitle} (${copyNumber})`;
  }

  return nextTitle;
}

/**
 * Decides whether submitting a message edit should regenerate the answer(s).
 *
 * Submitting always regenerates — even when the text is unchanged — because the
 * user may deliberately want a fresh run (different randomness / runtime
 * context). Only cancelling (which never calls this) aborts without regenerating.
 */
export function shouldRegenerateOnEditSubmit(editedContent: string): boolean {
  return editedContent.trim().length > 0;
}

export function prepareMessageEdit(messages: ChatMessage[], messageId: string): PreparedMessageEdit | null {
  const targetIndex = messages.findIndex((message) => message.id === messageId && message.role === 'user');
  if (targetIndex < 0) return null;

  return {
    draft: messages[targetIndex]?.content ?? '',
    retainedMessages: cloneChatMessages(messages.slice(0, targetIndex)),
  };
}
