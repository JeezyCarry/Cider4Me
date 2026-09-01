<script lang="ts">
  import { tick } from 'svelte';
  import DOMPurify from 'dompurify';
  import { marked } from 'marked';
  import Pencil from 'lucide-svelte/icons/pencil';
  import type { ChatMessage as ChatMessageModel } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { shouldRegenerateOnEditSubmit } from './chat-edit';
  import { openTextInNewTab } from '../../lib/browser/tabs';

  interface Props {
    message: ChatMessageModel;
    onEdit?: (messageId: string) => void;
    onUpdate?: (messageId: string, newContent: string) => void;
    editable?: boolean;
  }

  let { message, onEdit, onUpdate, editable = false }: Props = $props();
  let bodyElement = $state<HTMLDivElement | null>(null);
  let isEditing = $state(false);
  let editText = $state('');

  const copy = $derived(getI18n($localeStore));
  const html = $derived(DOMPurify.sanitize(marked.parse(message.content || '') as string));
  const isPageContext = $derived(message.kind === 'page-context' && Boolean(message.pageContextPreview));

  const copyIconSvg =
    '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';

  async function copyCode(preElement: HTMLElement, button: HTMLButtonElement): Promise<void> {
    const codeText = preElement.querySelector('code')?.textContent ?? preElement.textContent ?? '';
    if (!codeText.trim()) return;

    await navigator.clipboard.writeText(codeText);
    button.dataset.state = 'copied';
    button.title = copy.common.copied;
    window.setTimeout(() => {
      button.dataset.state = 'idle';
      button.title = copy.common.copyCode;
    }, 1200);
  }

  function enhanceCodeBlocks(): void {
    if (!bodyElement || message.kind === 'page-context') return;

    for (const preElement of bodyElement.querySelectorAll('pre')) {
      if (preElement.querySelector('.code-copy-button')) continue;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-button';
      button.setAttribute('aria-label', copy.common.copyCode);
      button.title = copy.common.copyCode;
      button.dataset.state = 'idle';
      button.innerHTML = copyIconSvg;
      button.addEventListener('click', () => void copyCode(preElement as HTMLElement, button));
      preElement.append(button);
    }
  }

  $effect(() => {
    const currentHtml = html;
    const copyCodeLabel = copy.common.copyCode;
    if (currentHtml !== undefined || copyCodeLabel !== undefined) {
      void tick().then(() => {
        enhanceCodeBlocks();
      });
    }
  });

  const roleLabel = $derived.by(() => {
    if (message.kind === 'page-context') return copy.sidebar.chatList.pageContextRole;
    if (message.kind === 'form-input') return copy.sidebar.chatList.formInputRole;
    return message.role === 'assistant' ? copy.sidebar.chatList.assistantRole : copy.sidebar.chatList.userRole;
  });
  const canEdit = $derived(Boolean(editable && onEdit && message.role === 'user' && message.kind !== 'page-context' && message.kind !== 'form-input'));
  const sentContextText = $derived(message.sentContext?.fragments?.join(' · ') ?? '');
  const sentContextTooltip = $derived(
    sentContextText.length > 500 ? `${sentContextText.slice(0, 499)}…` : sentContextText,
  );

  function handleOpenSentContext(): void {
    const fragments = message.sentContext?.fragments ?? [];
    if (fragments.length === 0) return;
    openTextInNewTab(document.title || 'Selection', fragments);
  }
  const editButtonStyle =
    'position:absolute;top:8px;right:8px;width:28px;height:28px;display:grid;place-items:center;border:none;border-radius:9999px;cursor:pointer;color:#ffffff;background:rgba(15,23,42,.2); transition: all 140ms ease;';

  function handleStartEdit(): void {
    isEditing = true;
    editText = message.content;
  }

  function handleCancelEdit(): void {
    isEditing = false;
    editText = '';
  }

  function handleSaveEdit(): void {
    const next = editText.trim();
    // Submitting always regenerates the following answer(s), even when the
    // text is unchanged (user may want a fresh run / different context).
    // Cancel (handleCancelEdit) is the only path that aborts without regenerating.
    if (shouldRegenerateOnEditSubmit(editText)) {
      onUpdate?.(message.id, next);
    }
    isEditing = false;
  }
</script>

<article
  class="message"
  class:message-page-context={message.kind === 'page-context'}
  class:message-user={message.role === 'user' && message.kind !== 'page-context'}
  class:message-assistant={message.role === 'assistant' && message.kind !== 'page-context'}
>
  {#if canEdit && !isEditing}
    <button class="edit-button" style={editButtonStyle} type="button" onclick={handleStartEdit} aria-label={copy.sidebar.chatList.editAria} title={copy.sidebar.chatList.edit}>
      <Pencil size={13} />
    </button>
  {/if}

  <div
    class="meta"
    class:meta-user={message.role === 'user' && message.kind !== 'page-context'}
    class:meta-other={message.role !== 'user' || message.kind === 'page-context'}
  >
    {roleLabel}
  </div>
  {#if isPageContext}
    <div class="context-preview">
      <p>{message.pageContextPreview?.url}</p>
    </div>
  {:else if isEditing}
    <div class="edit-zone">
      <textarea
        bind:value={editText}
        rows="3"
        placeholder={copy.sidebar.composer.placeholder}
        onkeydown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSaveEdit();
          }
          if (e.key === 'Escape') {
            handleCancelEdit();
          }
        }}
      ></textarea>
      <div class="edit-actions">
        <button class="save-button" onclick={handleSaveEdit}>{copy.common.save}</button>
        <button class="cancel-button" onclick={handleCancelEdit}>{copy.common.cancel}</button>
      </div>
    </div>
  {:else}
    {#if message.role === 'user' && message.sentContext?.fragments?.length}
      <div class="sent-context-anchor">
        <button
          class="sent-context"
          type="button"
          aria-label={copy.sidebar.chatList.openSentContext}
          onclick={handleOpenSentContext}
        >{sentContextText}</button>
        <div class="sent-context-tooltip" role="tooltip">{sentContextTooltip}</div>
      </div>
    {/if}
    {#if message.role === 'assistant' && message.status === 'streaming' && !message.content}
      <div class="status-indicator" aria-label={copy.sidebar.chatList.loadingAria} aria-busy="true">
        {#if message.webSearchEnabled}
          <span class="searching-label">{copy.sidebar.chatList.searching}…</span>
        {/if}
        <span class="typing-dots"><span></span><span></span><span></span></span>
      </div>
    {:else}
      <div class="body" bind:this={bodyElement}>{@html html}</div>
    {/if}
    {#if message.role === 'assistant' && message.sources?.length}
      <div class="sources">
        <div class="sources-title">{copy.sidebar.chatList.sources}</div>
        <ul>
          {#each message.sources as source (source.url)}
            <li><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title || source.url}</a></li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</article>

<style>
  .message {
    position: relative;
    border-radius: 16px;
    margin-bottom: 0;
    transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
  }

  .message-page-context {
    padding: 10px 12px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, .04);
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
  }

  .message-user {
    padding: 8px 10px;
    box-shadow: 0 8px 24px rgba(132, 204, 22, 0.15);
    background: linear-gradient(135deg, #4d7c0f, #3f6212);
    border: 1px solid rgba(132, 204, 22, 0.2);
  }

  .message-assistant {
    padding: 12px 13px;
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04);
    background: #ffffff;
    border: 1px solid #e2e8f0;
  }

  .meta {
    width: fit-content;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: .08em;
    margin-bottom: 6px;
    padding: 3px 8px;
    border-radius: 9999px;
    font-weight: 500;
  }
  .meta-user {
    color: rgba(255, 255, 255, 0.9);
    background: rgba(255, 255, 255, .15);
  }
  .meta-other {
    color: #475569;
    background: rgba(148, 163, 184, .1);
  }

  .body {
    color:#0f172a;
    line-height:1.55;
    word-break:break-word;
  }
  .message-user .body {
    color: #ffffff;
  }
  .sent-context-anchor {
    position: relative;
    display: block;
    margin-bottom: 6px;
  }
  .sent-context {
    display: block;
    width: 100%;
    margin: 0;
    padding: 6px 8px;
    border: none;
    border-radius: 12px;
    background: rgba(255, 255, 255, .15);
    color: rgba(255, 255, 255, .85);
    font: inherit;
    font-size: 12px;
    font-style: italic;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    cursor: pointer;
    transition: background .16s ease;
  }
  .sent-context:hover {
    background: rgba(255, 255, 255, .22);
  }
  .sent-context-tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 0;
    width: 100%;
    max-width: 360px;
    max-height: 220px;
    overflow: hidden;
    padding: 8px 10px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 12px;
    font-style: normal;
    line-height: 1.4;
    white-space: pre-wrap;
    word-break: break-word;
    box-shadow: 0 12px 24px rgba(0, 0, 0, .08);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translateY(4px);
    transition: opacity .16s ease, transform .16s ease, visibility .16s ease;
    z-index: 2;
  }
  .sent-context-anchor:hover .sent-context-tooltip,
  .sent-context-anchor:focus-within .sent-context-tooltip {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
  .status-indicator {
    display:flex;
    align-items:center;
    gap:8px;
    padding:8px 0;
    min-height:20px;
  }
  .searching-label {
    font-size:11px;
    color:#64748b;
    white-space:nowrap;
  }
  .typing-dots {
    display:inline-flex;
    gap:4px;
    align-items:center;
  }
  .typing-dots span {
    width:7px;
    height:7px;
    border-radius:9999px;
    background:#94a3b8;
    animation:typing-bounce 1.2s ease-in-out infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay:.15s; }
  .typing-dots span:nth-child(3) { animation-delay:.3s; }
  @keyframes typing-bounce {
    0%, 60%, 100% { transform:translateY(0); opacity:.45; }
    30% { transform:translateY(-5px); opacity:1; }
  }
  .sources {
    margin-top:10px;
    padding-top:8px;
    border-top:1px solid #e2e8f0;
  }
  .sources-title {
    font-size:10px;
    text-transform:uppercase;
    letter-spacing:.08em;
    color:#64748b;
    margin-bottom:4px;
  }
  .sources ul {
    list-style:none;
    padding:0;
    margin:0;
    display:grid;
    gap:3px;
  }
  .sources li {
    font-size:12px;
  }
  .sources a {
    color:#2563eb;
    text-decoration:underline;
    text-underline-offset:2px;
    word-break:break-all;
  }
  .context-preview {
    display:grid;
    gap:4px;
    color:#475569;
  }
  .context-preview p {
    margin:0;
    line-height:1.4;
    word-break:break-word;
  }
  .context-preview p { color:#64748b; font-size:12px; }
  .edit-button:hover {
    background:rgba(30,41,59,.52) !important;
    transform:translateY(-1px);
  }
  .body :global(*:first-child) { margin-top:0; }
  .body :global(*:last-child) { margin-bottom:0; }
  .body :global(p),
  .body :global(ul),
  .body :global(ol),
  .body :global(pre),
  .body :global(blockquote) { margin:0 0 8px; }
  .body :global(ul),
  .body :global(ol) { padding-left:18px; }
  .body :global(li + li) { margin-top:3px; }
  .body :global(code) {
    font-size:.92em;
    padding:.15em .4em;
    border-radius:6px;
    background:rgba(148,163,184,.1);
  }
  .message-user .body :global(code) {
    background:rgba(255,255,255,.2);
    color:white;
  }
  .body :global(pre) {
    position:relative;
    overflow:auto;
    background:#0f172a;
    padding:38px 11px 11px;
    border-radius:12px;
    border:1px solid rgba(148,163,184,.1);
  }
  .body :global(pre code) { padding:0; background:transparent; color: #e2e8f0; }
  .body :global(.code-copy-button) {
    position:absolute;
    top:8px;
    right:8px;
    width:28px;
    height:28px;
    display:grid;
    place-items:center;
    border:none;
    border-radius:9px;
    background:rgba(255,255,255,.1);
    color:#dbe4f0;
    cursor:pointer;
    transition:all .16s ease;
  }
  .body :global(.code-copy-button:hover) {
    background:rgba(255,255,255,.2);
    color:#ffffff;
    transform:translateY(-1px);
  }
  .body :global(.code-copy-button[data-state='copied']) {
    background:rgba(34,197,94,.2);
    color:#86efac;
  }
  .body :global(a) { color:#2563eb; text-decoration: underline; text-underline-offset: 2px; }
  .message-user .body :global(a) {
    color: white;
  }
  .body :global(blockquote) {
    padding-left:12px;
    border-left:3px solid #84cc16;
    color:#475569;
  }
  .message-user .body :global(blockquote) {
    border-color: rgba(255,255,255,.4);
    color: rgba(255,255,255,.9);
  }
  .edit-zone {
    display:grid;
    gap:8px;
    margin-top:4px;
  }
  textarea {
    width:100%;
    min-height:80px;
    padding:10px;
    border-radius:12px;
    background:#ffffff;
    border:1px solid #e2e8f0;
    color:#0f172a;
    font:inherit;
    font-size:14px;
    line-height:1.5;
    resize:vertical;
  }
  textarea:focus {
    outline:none;
    border-color:#84cc16;
  }
  .edit-actions {
    display:flex;
    justify-content:flex-end;
    gap:8px;
  }
  .save-button, .cancel-button {
    border:none;
    border-radius:10px;
    padding:6px 12px;
    font-size:12px;
    font-weight:600;
    cursor:pointer;
    transition:all .16s ease;
  }
  .save-button {
    background:#84cc16;
    color:white;
  }
  .cancel-button {
    background:#f1f5f9;
    color:#475569;
    border:1px solid #e2e8f0;
  }
  .save-button:hover, .cancel-button:hover {
    transform:translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  }

  :global(.theme-dark) .message-page-context {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  :global(.theme-dark) .message-assistant {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  }
  :global(.theme-dark) .meta-other {
    color: #e2e8f0;
    background: rgba(255, 255, 255, 0.08);
  }
  :global(.theme-dark) .body {
    color: #f8fafc;
  }
  :global(.theme-dark) .sources {
    border-top-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .searching-label {
    color: #94a3b8;
  }
  :global(.theme-dark) .body :global(blockquote) {
    border-color: #84cc16;
    color: #94a3b8;
  }
  :global(.theme-dark) .context-preview p {
    color: #94a3b8;
  }
  :global(.theme-dark) .sent-context-tooltip {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #cbd5e1;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.3);
  }
  :global(.theme-dark) textarea {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #f8fafc;
  }
  :global(.theme-dark) .cancel-button {
    background: #1e293b;
    color: #e2e8f0;
    border-color: rgba(148, 163, 184, 0.15);
  }
</style>
