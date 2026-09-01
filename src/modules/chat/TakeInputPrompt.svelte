<script lang="ts">
  import { tick } from 'svelte';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { resolveTakeInputKeyAction, shouldHandleTakeInputKey } from './take-input-prompt-keyboard';

  interface Props {
    onNo: () => void;
    onTake: () => void;
    onCancel: () => void;
  }

  let { onNo, onTake, onCancel }: Props = $props();
  const copy = $derived(getI18n($localeStore));
  let noButton = $state<HTMLButtonElement | null>(null);
  let promptEl = $state<HTMLDivElement | null>(null);

  // Focus the "No" (default) button so Enter = No via native button activation.
  $effect(() => {
    void tick().then(() => noButton?.focus());
  });

  function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable) return true;
    return (
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement
    );
  }

  function handleKeydown(event: KeyboardEvent): void {
    // Only act when focus is meaningful for the prompt: target inside the popup,
    // or a plain (non-input/contenteditable) area — never from a field on the
    // host page. Combined with the focus-out cancel, this prevents consent
    // actions firing from the page.
    const target = event.target;
    const insidePopup = promptEl ? promptEl.contains(target as Node | null) : false;
    if (!shouldHandleTakeInputKey({ insidePopup, isEditable: isEditableTarget(target) })) return;

    const action = resolveTakeInputKeyAction(event.key);
    if (action === null) return;
    event.preventDefault();
    event.stopPropagation();
    if (action === 'no') onNo();
    else if (action === 'take') onTake();
    else if (action === 'cancel') onCancel();
  }

  // Close the prompt when focus leaves the popup (e.g. the user clicks into a
  // page field), so the global listener no longer fires "from the host page".
  function handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next) return;
    if (next && promptEl?.contains(next)) return;
    onCancel();
  }
</script>

<svelte:window onkeydown={handleKeydown} onfocusout={handleFocusOut} />

<div class="take-input-prompt" bind:this={promptEl} role="dialog" aria-label={copy.sidebar.takeInput.promptTitle}>
  <p class="prompt-title">{copy.sidebar.takeInput.promptTitle}</p>
  <div class="actions">
    <button class="primary no-btn" bind:this={noButton} type="button" onclick={onNo}>
      {copy.sidebar.takeInput.no}
    </button>
    <button class="secondary take-btn" type="button" onclick={onTake}>
      {copy.sidebar.takeInput.take}
    </button>
  </div>
  <p class="cancel-hint">{copy.sidebar.takeInput.cancelHint}</p>
</div>

<style>
  .take-input-prompt {
    display: grid;
    gap: 8px;
    padding: 12px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.2);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
  }
  .prompt-title {
    margin: 0;
    color: #1e293b;
    font-size: 13px;
    font-weight: 600;
  }
  .actions {
    display: flex;
    gap: 8px;
  }
  .cancel-hint {
    margin: 0;
    color: #64748b;
    font-size: 11px;
  }
  button {
    border: none;
    border-radius: 10px;
    padding: 8px 12px;
    font: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.16s ease;
  }
  .primary {
    background: linear-gradient(135deg, #84cc16, #65a30d);
    color: white;
  }
  .secondary {
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
  }
  button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  :global(.theme-dark) .take-input-prompt {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .prompt-title {
    color: #f8fafc;
  }
  :global(.theme-dark) .cancel-hint {
    color: #94a3b8;
  }
  :global(.theme-dark) .secondary {
    background: #0f172a;
    color: #cbd5e1;
    border-color: rgba(148, 163, 184, 0.15);
  }
</style>
