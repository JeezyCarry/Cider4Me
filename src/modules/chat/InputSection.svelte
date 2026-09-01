<script lang="ts">
  import type { ComposerSubmitMode } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { getComposerKeyboardHint, shouldSubmitComposerFromKeyboard } from './input-section-keyboard';
  import type { PendingImageAttachment } from './chat-types';
  import { getClipboardImageFile } from './input-section-images';
  import X from 'lucide-svelte/icons/x';

  interface Props {
    value: string;
    disabled: boolean;
    submitMode: ComposerSubmitMode;
    pendingImage?: PendingImageAttachment | null;
    errorMessage?: string;
    isEditing?: boolean;
    editingNotice?: string;
    onInput: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    onClearDraft?: () => void;
    onPasteImage: (file: File) => void;
    onClearPendingImage: () => void;
    embedded?: boolean;
  }

  let {
    value,
    disabled,
    submitMode,
    pendingImage = null,
    errorMessage = '',
    isEditing = false,
    editingNotice = '',
    onInput,
    onSubmit,
    onCancel,
    onClearDraft,
    onPasteImage,
    onClearPendingImage,
    embedded = false,
  }: Props = $props();
  const copy = $derived(getI18n($localeStore));

  const keyboardHint = $derived(getComposerKeyboardHint(submitMode, $localeStore));
  const secondaryLabel = $derived(disabled ? copy.sidebar.composer.cancel : isEditing ? copy.sidebar.composer.cancelEdit : copy.sidebar.composer.cancel);
  const secondaryDisabled = $derived(!disabled && !isEditing);

  function stopKeyboardPropagation(event: KeyboardEvent): void {
    event.stopPropagation();
  }

  function handleKeydown(event: KeyboardEvent): void {
    event.stopPropagation();
    const shouldSubmit = shouldSubmitComposerFromKeyboard({
      disabled,
      submitMode,
      key: event.key,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      isComposing: event.isComposing,
    });

    if (!shouldSubmit) return;

    event.preventDefault();
    if (value.trim() || pendingImage) onSubmit();
  }

  function handlePaste(event: ClipboardEvent): void {
    const file = getClipboardImageFile(event.clipboardData?.items);
    if (!file) return;

    event.preventDefault();
    onPasteImage(file);
  }

  function handleSecondaryAction(): void {
    if (disabled) {
      onCancel();
      return;
    }

    if (isEditing) onClearDraft?.();
  }
</script>

<div class:embedded class="composer">
  {#if isEditing && editingNotice}
    <p class="edit-notice">{editingNotice}</p>
  {/if}

  {#if pendingImage}
    <div class="image-preview">
      <img src={pendingImage.dataUrl} alt={copy.sidebar.composer.imagePreviewAlt} />
      <div class="image-preview-meta">
        <span>{copy.sidebar.composer.imageReady}</span>
      </div>
      <button class="ghost image-remove" type="button" onclick={onClearPendingImage} aria-label={copy.sidebar.composer.removeImageAria}>
        <X size={14} />
      </button>
    </div>
  {/if}

  <label for="chat-composer" class="sr-only">{copy.sidebar.composer.placeholder}</label>
  <textarea
    id="chat-composer"
    rows="3"
    value={value}
    oninput={(event) => onInput((event.currentTarget as HTMLTextAreaElement).value)}
    onkeydown={handleKeydown}
    onkeyup={stopKeyboardPropagation}
    onkeypress={stopKeyboardPropagation}
    onpaste={handlePaste}
    placeholder={copy.sidebar.composer.placeholder}
  ></textarea>
  {#if errorMessage}
    <p class="composer-error" role="alert">{errorMessage}</p>
  {/if}
  <div class="composer-footer">
    <div class="meta-row">
      <div class="keyboard-hint">{keyboardHint}</div>
    </div>
    <div class="actions">
      <button class="secondary" onclick={handleSecondaryAction} disabled={secondaryDisabled}>{secondaryLabel}</button>
      <button class="primary" onclick={onSubmit} disabled={disabled || (!value.trim() && !pendingImage)}>{copy.sidebar.composer.send}</button>
    </div>
  </div>
</div>

<style>
  .composer { display:grid; gap:5px; padding-top:6px; }
  .composer.embedded { padding:0; }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  .edit-notice {
    margin:0;
    padding:10px 12px;
    border-radius:14px;
    border:1px solid rgba(132, 204, 22, 0.2);
    background:rgba(132, 204, 22, 0.08);
    color:#4d7c0f;
    font-size:12px;
    line-height:1.45;
  }
  .image-preview {
    display:grid;
    grid-template-columns:auto minmax(0,1fr) auto;
    gap:10px;
    align-items:center;
    padding:10px;
    border-radius:14px;
    border:1px solid #e2e8f0;
    background:#ffffff;
  }
  .image-preview img {
    width:56px;
    height:56px;
    object-fit:cover;
    border-radius:10px;
    border:1px solid #e2e8f0;
    background:#f8fafc;
  }
  .image-preview-meta { min-width:0; color:#64748b; font-size:12px; line-height:1.35; }
  .image-remove { width:32px; height:32px; display:grid; place-items:center; border-radius:10px; color: #94a3b8; }
  .image-remove:hover { background: #fef2f2; color: #ef4444; }
  textarea {
    width:100%;
    resize:vertical;
    min-height:72px;
    max-height:140px;
    border-radius:18px;
    border:1px solid #e2e8f0;
    background:#ffffff;
    color:#0f172a;
    padding:11px 12px;
    font:inherit;
    line-height:1.45;
    transition:all .16s ease;
  }
  .composer:not(.embedded) textarea {
    border-radius:12px;
  }
  textarea:focus {
    outline:none;
    border-color: #84cc16;
    box-shadow: 0 0 0 3px rgba(132, 204, 22, 0.1);
  }
  .composer-footer {
    display:flex;
    justify-content:space-between;
    align-items:center;
    gap:8px;
    padding:0 2px 2px;
  }
  .meta-row {
    display:flex;
    align-items:center;
    gap:8px;
    flex-wrap:wrap;
    min-width:0;
  }
  .keyboard-hint { font-size:11px; color:#475569; line-height:1.3; }
  .composer-error { margin:0; color:#ef4444; font-size:12px; line-height:1.35; }
  .actions {
    display:flex;
    justify-content:flex-end;
    align-items:center;
    gap:6px;
    flex-shrink:0;
  }
  button {
    border:none;
    border-radius:10px;
    min-width:74px;
    min-height:36px;
    padding:7px 11px;
    cursor:pointer;
    font:inherit;
    transition:all .16s ease;
  }
  .primary { background:linear-gradient(135deg,#84cc16,#65a30d); color:white; font-weight: 600; box-shadow: 0 4px 12px rgba(132, 204, 22, 0.2); }
  .secondary { background:#f1f5f9; color:#475569; border: 1px solid #e2e8f0; }
  button:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 6px 16px rgba(132, 204, 22, 0.3); }
  .secondary:hover:not(:disabled) { background: #e2e8f0; color: #1e293b; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
  button:disabled { opacity:.5; cursor:not-allowed; }

  :global(.theme-dark) .edit-notice {
    background: rgba(132, 204, 22, 0.08);
    border-color: rgba(132, 204, 22, 0.2);
    color: #a3e635;
  }
  :global(.theme-dark) .image-preview {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .image-preview img {
    border-color: rgba(148, 163, 184, 0.15);
    background: #1e293b;
  }
  :global(.theme-dark) .image-preview-meta {
    color: #94a3b8;
  }
  :global(.theme-dark) textarea {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #f8fafc;
  }
  :global(.theme-dark) .secondary {
    background: #1e293b;
    color: #cbd5e1;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .secondary:hover:not(:disabled) {
    background: #334155;
    color: #f8fafc;
  }
  :global(.theme-dark) .keyboard-hint {
    color: #64748b;
  }

  @media (max-width: 520px) {
    .composer-footer { flex-direction:column; align-items:stretch; }
    .meta-row { align-items:flex-start; }
    .actions { width:100%; justify-content:stretch; }
    .actions button { flex:1; min-width:0; }
  }
</style>
