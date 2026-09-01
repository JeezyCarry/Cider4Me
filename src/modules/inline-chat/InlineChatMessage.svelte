<script lang="ts">
  import type { ChatMessage } from '../../lib/shared/types';

  let { message }: { message: ChatMessage } = $props();

  const isUser = $derived(message.role === 'user' && message.kind !== 'page-context');
</script>

<div
  class="inline-message"
  class:user={isUser}
  class:assistant={message.role === 'assistant'}
  data-role={message.role}
>
  <p class="inline-message-content">{message.content || '…'}</p>
</div>

<style>
  .inline-message {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .inline-message-content {
    margin: 0;
    padding: 7px 10px;
    border-radius: 10px;
    font-size: 13px;
    line-height: 1.5;
    word-break: break-word;
    white-space: pre-wrap;
  }

  .inline-message.user .inline-message-content {
    align-self: flex-end;
    background: linear-gradient(135deg, #4d7c0f, #3f6212);
    color: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.2);
  }

  .inline-message.assistant .inline-message-content {
    align-self: flex-start;
    background: #ffffff;
    color: #1e293b;
    border: 1px solid #e2e8f0;
  }

  :global(.theme-dark) .inline-message.user .inline-message-content {
    background: linear-gradient(135deg, #84cc16, #65a30d);
  }

  :global(.theme-dark) .inline-message.assistant .inline-message-content {
    background: rgba(30, 41, 59, 0.9);
    color: #f8fafc;
    border-color: rgba(148, 163, 184, 0.16);
  }
</style>
