<script lang="ts">
  import { overlayState } from './overlay-state.svelte';
  import { chatState } from '../chat/chat-state.svelte';
  import { openSidebar } from './overlay-state.svelte';
  import { getI18n, localeStore } from '../../lib/i18n';

  let value = $state('');
  const copy = $derived(getI18n($localeStore));

  function close(): void {
    overlayState.isCustomPromptOpen = false;
  }

  function submit(): void {
    chatState.composer.text = value.trim();
    close();
    openSidebar();
    value = '';
  }

  function stopKeyboardPropagation(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  function handleBackdropKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') close();
  }
</script>

{#if overlayState.isCustomPromptOpen}
  <div class="backdrop" role="button" tabindex="0" aria-label={copy.content.customPrompt.closeAria} onclick={close} onkeydown={handleBackdropKeydown}>
    <div
      class="dialog"
      role="dialog"
      aria-modal="true"
      tabindex="-1"
      onclick={(event) => event.stopPropagation()}
      onkeydown={stopKeyboardPropagation}
      onkeyup={stopKeyboardPropagation}
      onkeypress={stopKeyboardPropagation}
    >
      <h3>{copy.content.customPrompt.title}</h3>
      <textarea rows="6" bind:value placeholder={copy.content.customPrompt.placeholder}></textarea>
      <div class="actions">
        <button onclick={close}>{copy.common.cancel}</button>
        <button onclick={submit} disabled={!value.trim()}>{copy.content.customPrompt.submit}</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop { position:fixed; inset:0; background:rgba(2,6,23,.45); display:grid; place-items:center; z-index:4; }
  .dialog { width:min(560px, calc(100vw - 32px)); border-radius:18px; background:#ffffff; color:#1e293b; padding:20px; border:1px solid rgba(132,204,22,.2); box-shadow:0 16px 36px rgba(15,23,42,.18); }
  :global(.theme-dark) .dialog { background:#1e293b; color:#f8fafc; border-color:rgba(148,163,184,.15); box-shadow:0 16px 36px rgba(0,0,0,.4); }
  h3 { margin:0 0 12px; }
  textarea { width:100%; border-radius:12px; border:1px solid #e2e8f0; background:#f8fafc; color:#1e293b; padding:12px; font:inherit; }
  :global(.theme-dark) textarea { border-color:#334155; background:#020617; color:white; }
  .actions { margin-top:12px; display:flex; justify-content:flex-end; gap:8px; }
  button { border:none; border-radius:10px; padding:10px 14px; cursor:pointer; background:#f1f5f9; color:#475569; }
  button:hover:not(:disabled) { background:#e2e8f0; color:#1e293b; }
  button:last-child { background:linear-gradient(135deg,#84cc16,#65a30d); color:#ffffff; }
  button:last-child:hover:not(:disabled) { background:linear-gradient(135deg,#4d7c0f,#3f6212); color:#ffffff; }
  :global(.theme-dark) button { background:rgba(148,163,184,.1); color:#cbd5e1; }
  :global(.theme-dark) button:hover:not(:disabled) { background:rgba(148,163,184,.2); color:#f8fafc; }
  :global(.theme-dark) button:last-child { background:linear-gradient(135deg,#4d7c0f,#3f6212); color:#ffffff; }
  :global(.theme-dark) button:last-child:hover:not(:disabled) { background:linear-gradient(135deg,#84cc16,#65a30d); }
</style>
