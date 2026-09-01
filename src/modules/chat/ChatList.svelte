<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import Sparkles from 'lucide-svelte/icons/sparkles';
  import ChatMessage from './ChatMessage.svelte';
  import type { ChatMessage as ChatMessageModel } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { chatState } from './chat-state.svelte';

  interface Props {
    messages: ChatMessageModel[];
    isLoading: boolean;
    onEditMessage?: (messageId: string) => void;
    onUpdateMessage?: (messageId: string, content: string) => void;
  }

  let { messages, isLoading, onEditMessage, onUpdateMessage }: Props = $props();
  const copy = $derived(getI18n($localeStore));

  let scrollContainer: HTMLDivElement | undefined = $state();
  let isProgrammaticScroll = false;

  function scrollToBottom() {
    if (scrollContainer) {
      isProgrammaticScroll = true;
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
      chatState.isScrolledDown = true;
      requestAnimationFrame(() => {
        isProgrammaticScroll = false;
      });
    }
  }

  function scrollToTop() {
    if (scrollContainer) {
      isProgrammaticScroll = true;
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      chatState.isScrolledDown = false;
      requestAnimationFrame(() => {
        isProgrammaticScroll = false;
      });
    }
  }

  function handleScroll() {
    if (!scrollContainer || isProgrammaticScroll) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;

    // Track if we are scrolled down (more than 40px from top)
    chatState.isScrolledDown = scrollTop > 40;

    // 50px threshold
    const isAtBottom = scrollHeight - clientHeight - scrollTop < 50;
    
    // If we were latched but user scrolled up, unlatch
    if (chatState.isLatchedToBottom && !isAtBottom) {
      chatState.isLatchedToBottom = false;
    }
    
    // If we weren't latched but user scrolled to the very bottom, we can optionally auto-latch
    // User requested "control", so we only latch via button? 
    // Actually, "if I scroll back down I latch" is usually what users expect.
    // But for now let's stick to the button being the main driver.
    if (!chatState.isLatchedToBottom && isAtBottom) {
       chatState.isLatchedToBottom = true;
    }
  }

  onMount(() => {
    if (!scrollContainer) return;

    // Initial scroll to bottom if there are messages
    if (messages.length > 0) {
      scrollToBottom();
    }

    const observer = new MutationObserver(() => {
      if (chatState.isLatchedToBottom) {
        scrollToBottom();
      }
    });

    observer.observe(scrollContainer, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  });

  // When button is clicked (isLatchedToBottom becomes true), scroll immediately
  $effect(() => {
    if (chatState.isLatchedToBottom) {
      untrack(() => {
        scrollToBottom();
      });
    }
  });

  // Handle scroll to top requests
  $effect(() => {
    if (chatState.scrollRequest > 0) {
      untrack(() => {
        scrollToTop();
      });
    }
  });
</script>

<div
  bind:this={scrollContainer}
  onscroll={handleScroll}
  class:has-messages={messages.length > 0}
  class="chat-list"
>
  {#if messages.length === 0}
    <section class="empty-state" aria-label={copy.sidebar.chatList.emptyAria}>
      <div class="empty-icon" aria-hidden="true"><Sparkles size={18} /></div>
      <div class="empty-copy">
        <strong>{copy.sidebar.chatList.emptyTitle}</strong>
        <p>{copy.sidebar.chatList.emptyBody}</p>
      </div>
    </section>
  {:else}
    <ul class="messages-list">
      {#each messages as message (message.id)}
        <li class="message-item">
          <ChatMessage {message} onEdit={onEditMessage} onUpdate={onUpdateMessage} editable={!isLoading} />
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .chat-list {
    flex:1;
    overflow-y:auto;
    overflow-x:hidden;
    min-height:0;
    padding-right:2px;
    display:flex;
    flex-direction:column;
    gap:12px;
  }
  .chat-list.has-messages { padding-top:4px; }
  .messages-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .message-item {
    margin: 0;
    padding: 0;
  }
  .empty-state {
    display:grid;
    grid-template-columns:auto 1fr;
    gap:14px;
    align-items:start;
    padding:20px;
    border-radius:24px;
    border:1px dashed rgba(132, 204, 22, 0.4);
    background:linear-gradient(180deg,#ffffff,#f9fafb);
    color:#475569;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
  }
  .empty-icon {
    width:40px;
    height:40px;
    display:grid;
    place-items:center;
    border-radius:14px;
    background:rgba(132, 204, 22, 0.1);
    color:#65a30d;
    font-size:17px;
    flex-shrink:0;
  }
  .empty-copy { display:grid; gap:5px; }
  .empty-copy strong { color:#1e293b; font-size:16px; line-height:1.2; }
  .empty-copy p { margin:0; color:#64748b; font-size:14px; line-height:1.45; max-width:32ch; }

  @media (max-width: 520px) {
    .empty-state { grid-template-columns:1fr; }
  }
</style>
