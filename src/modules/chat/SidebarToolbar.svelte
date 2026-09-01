<script lang="ts">
  import Plus from 'lucide-svelte/icons/plus';
  import History from 'lucide-svelte/icons/history';
  import ArrowDownToLine from 'lucide-svelte/icons/arrow-down-to-line';
  import Download from 'lucide-svelte/icons/download';
  import AppWindow from 'lucide-svelte/icons/app-window';
  import { scale } from 'svelte/transition';
  import ModelSelector from './ModelSelector.svelte';
  import ModeSelector from './ModeSelector.svelte';
  import type { ModelConfig, ModeConfig } from '../../lib/shared/types';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { chatState } from './chat-state.svelte';

  interface Props {
    onNewChat: () => void;
    onOpenHistory: () => void;
    models: ModelConfig[];
    value: string;
    onModelChange: (value: string) => void;
    modes: ModeConfig[];
    activeModeId: string;
    onModeChange: (value: string) => void;
    pageContextEnabled?: boolean;
    onTogglePageContext?: () => void;
    onExport?: () => void;
    embedded?: boolean;
  }

  let { 
    onNewChat, 
    onOpenHistory, 
    models, 
    value, 
    onModelChange, 
    modes,
    activeModeId,
    onModeChange,
    pageContextEnabled = false,
    onTogglePageContext = () => {},
    onExport,
    embedded = false 
  }: Props = $props();
  const copy = $derived(getI18n($localeStore));

  function toggleLatch() {
    chatState.isLatchedToBottom = !chatState.isLatchedToBottom;
  }
</script>

<div 
  class:embedded 
  class:scrolled={chatState.isContextPanelFullyHidden} 
  class="toolbar" 
  role="toolbar"
  aria-label={copy.sidebar.toolbar.aria}
>
  <button class="toolbar-button primary" onclick={onNewChat} aria-label={copy.sidebar.toolbar.newChatAria} title={copy.sidebar.toolbar.newChat}>
    <Plus size={16} />
  </button>
  <button class="toolbar-button" onclick={onOpenHistory} aria-label={copy.sidebar.toolbar.historyAria} title={copy.sidebar.toolbar.history}>
    <History size={16} />
  </button>
  <button
    class="toolbar-button"
    class:latched={chatState.isLatchedToBottom}
    onclick={toggleLatch}
    aria-label={copy.sidebar.toolbar.latchToBottomAria}
    aria-pressed={chatState.isLatchedToBottom}
    title={copy.sidebar.toolbar.latchToBottom}
  >
    <ArrowDownToLine size={16} />
  </button>

  {#if chatState.isContextPanelFullyHidden}
    <div transition:scale={{ duration: 200, start: 0.8 }}>
      <button
        class="toolbar-button context-indicator"
        class:active={pageContextEnabled}
        onclick={onTogglePageContext}
        aria-label={copy.sidebar.contextPanel.title}
        aria-pressed={pageContextEnabled}
        title={copy.sidebar.contextPanel.title}
      >
        <AppWindow size={16} />
      </button>
    </div>
  {/if}

  {#if onExport}
    <button
      class="toolbar-button"
      onclick={onExport}
      aria-label={copy.sidebar.toolbar.exportChatAria}
      title={copy.sidebar.toolbar.exportChat}
    >
      <Download size={16} />
    </button>
  {/if}

  <div class="toolbar-selectors">
    <div class="toolbar-model">
      <ModelSelector
        {models}
        {value}
        onChange={onModelChange}
        compact={true}
        labelHidden={true}
      />
    </div>

    {#if modes.length > 0}
      <div class="toolbar-mode">
        <ModeSelector
          {modes}
          value={activeModeId}
          onChange={onModeChange}
          compact={true}
          labelHidden={true}
        />
      </div>
    {/if}
  </div>
</div>

<style>
  .toolbar {
    display:flex;
    flex-wrap:nowrap;
    gap:8px;
    align-items:center;
    margin-bottom:10px;
    padding:6px;
    border-radius:14px;
    background:#ffffff;
    border:1px solid rgba(132, 204, 22, 0.15);
    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.03);
  }
  .toolbar.embedded {
    margin-bottom:0;
    padding:0;
    border:none;
    background:transparent;
    box-shadow: none;
  }
  .toolbar-button {
    flex-shrink:0;
    border:none;
    border-radius:10px;
    background:#f1f5f9;
    color:#64748b;
    width:36px;
    height:36px;
    padding:0;
    font:inherit;
    cursor:pointer;
    display:inline-grid;
    place-items:center;
    transition:all .16s ease;
  }
  .toolbar-button.primary { background:rgba(132, 204, 22, 0.1); color:#65a30d; border:1px solid rgba(132, 204, 22, 0.2); }
  .toolbar-button.primary:hover { background: rgba(132, 204, 22, 0.15); color: #4d7c0f; }
  .toolbar-button.latched { background:rgba(37, 99, 235, 0.08); color:#2563eb; border:1px solid rgba(37, 99, 235, 0.15); box-shadow:0 0 12px rgba(37, 99, 235, 0.05); }
  .toolbar-button.context-indicator { background:#f8fafc; color:#94a3b8; border:1px solid #e2e8f0; }
  .toolbar-button.context-indicator.active { background:rgba(132, 204, 22, 0.1); color:#65a30d; border-color:rgba(132, 204, 22, 0.2); }
  .toolbar-button.context-indicator:hover { color:#4d7c0f; background:rgba(132, 204, 22, 0.12); }
  .toolbar-button :global(svg) { width:15px; height:15px; }
  .toolbar-button:hover { transform:translateY(-1px); background: #e2e8f0; color: #1e293b; box-shadow:0 4px 12px rgba(2, 6, 23, 0.08); }
  .toolbar-button:focus-visible { outline:none; box-shadow:0 0 0 3px rgba(132, 204, 22, 0.2); }

  :global(.theme-dark) .toolbar-button {
    background: #1e293b;
    color: #cbd5e1;
  }
  :global(.theme-dark) .toolbar-button:hover {
    background: #334155;
    color: #f8fafc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  :global(.theme-dark) .toolbar-button.primary {
    background: rgba(132, 204, 22, 0.15);
    color: #a3e635;
    border-color: rgba(132, 204, 22, 0.3);
  }
  :global(.theme-dark) .toolbar-button.primary:hover {
    background: rgba(132, 204, 22, 0.25);
    color: #bef264;
  }
  :global(.theme-dark) .toolbar-button.latched {
    background: rgba(59, 130, 246, 0.15);
    color: #60a5fa;
    border-color: rgba(59, 130, 246, 0.3);
  }
  :global(.theme-dark) .toolbar-button.context-indicator {
    background: #0f172a;
    color: #64748b;
    border-color: rgba(148, 163, 184, 0.15);
  }
  :global(.theme-dark) .toolbar-button.context-indicator.active {
    background: rgba(132, 204, 22, 0.15);
    color: #a3e635;
    border-color: rgba(132, 204, 22, 0.3);
  }
  :global(.theme-dark) .toolbar-button.context-indicator:hover {
    color: #bef264;
    background: rgba(132, 204, 22, 0.25);
  }

  .toolbar-selectors {
    display: flex;
    flex: 1;
    min-width: 0;
    gap: 6px;
  }
  .toolbar-model,
  .toolbar-mode { 
    flex:1;
    min-width:0; 
  }
</style>
