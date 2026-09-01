import type { Conversation } from '../../lib/shared/types';

export const conversationState = $state({
  conversations: [] as Conversation[],
  filter: 'page' as 'page' | 'all',
});
