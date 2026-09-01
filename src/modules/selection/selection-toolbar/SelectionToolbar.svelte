<script lang="ts">
  import { tick } from "svelte";
  import Sparkles from "lucide-svelte/icons/sparkles";
  import Copy from "lucide-svelte/icons/copy";
  import ExternalLink from "lucide-svelte/icons/external-link";
  import Lightbulb from "lucide-svelte/icons/lightbulb";
  import Languages from "lucide-svelte/icons/languages";
  import ListPlus from "lucide-svelte/icons/list-plus";
  import { getI18n, localeStore } from "../../../lib/i18n";
  import { selectionState } from "../selection-state.svelte";
  import { inlineChatState } from "../../inline-chat/inline-chat-state.svelte";
  import InlineChatMessage from "../../inline-chat/InlineChatMessage.svelte";
  import {
    addSelectionToContext,
    openInlineChatInSidebar,
    openSelectionAsUrl,
    preparePromptFromSelection,
    searchSelection,
    searchSelectionWithDefaultEngine,
    submitAskAiFromPopup,
  } from "../selection-actions";
  import { hideSelectionToolbar } from "../selection-visibility";
  import { contentSettingsState } from "../../settings/content/settings-state.svelte";
  import { computeToolbarStyle } from "./style";
  import { createDragHandlers } from "./drag";
  import { handleCopy } from "./copy";
  import { canOpenSelectionAsUrl } from "./url";
  import { getEngineGlyph } from "./glyph";
  import { createToolbarKeydownHandler } from "./keydown";

  let inputElement = $state<HTMLInputElement | null>(null);
  let lastFocusedSelection = $state("");
  const i18n = $derived(getI18n($localeStore));
  const drag = createDragHandlers();

  const style = $derived.by(() => {
    const rect = selectionState.selectionRect;
    if (!rect) return "";
    return computeToolbarStyle(rect, selectionState.dragOffset, window);
  });

  const activeSearchEngines = $derived(
    contentSettingsState.settings.searchEngines.filter(
      (engine) => engine.enabled,
    ),
  );

  const canOpenAsUrl = $derived(canOpenSelectionAsUrl(selectionState.popupText));

  $effect(() => {
    if (!selectionState.isSelectionVisible || !selectionState.selectionRect)
      return;

    const handler = createToolbarKeydownHandler({
      getInputElement: () => inputElement,
      onSubmitPopup: () => void submitAskAiFromPopup(),
      onSearch: () => searchSelectionWithDefaultEngine(),
    });

    window.addEventListener("keydown", handler, { capture: true });
    return () => {
      window.removeEventListener("keydown", handler, { capture: true });
    };
  });

  $effect(() => {
    const currentSelection = selectionState.capturedSelection;
    if (
      !selectionState.isSelectionVisible ||
      !currentSelection ||
      currentSelection === lastFocusedSelection
    )
      return;

    lastFocusedSelection = currentSelection;
    if (!contentSettingsState.settings.selectionPopupTakesFocus) return;

    void tick().then(() => {
      inputElement?.focus();
      inputElement?.select();
    });
  });

  function stopKeyboardPropagation(event: KeyboardEvent): void {
    event.stopPropagation();
  }
</script>

{#if selectionState.isSelectionVisible && selectionState.selectionRect}
  <div
    class="toolbar"
    data-selection-toolbar="true"
    {style}
    role="toolbar"
    aria-label={i18n.content.selectionToolbar.toolbarAria}
  >
    <div
      class="drag-handle"
      role="button"
      tabindex="-1"
      aria-label="Drag handle"
      onpointerdown={drag.onPointerDown}
      onpointermove={drag.onPointerMove}
      onpointerup={drag.onPointerUp}
    ></div>
    <button
      class="close-button"
      type="button"
      aria-label={i18n.content.selectionToolbar.closeAria}
      onclick={hideSelectionToolbar}>×</button
    >

    {#if inlineChatState.isActive}
      <div class="inline-chat">
        {#if inlineChatState.selectionContext}
          <div class="inline-context">
            <span class="inline-context-label">{i18n.content.selectionToolbar.selectionContext}</span>
            <p class="inline-context-text">{inlineChatState.selectionContext}</p>
          </div>
        {/if}
        <div class="inline-messages">
          {#each inlineChatState.messages as message (message.id)}
            <InlineChatMessage {message} />
          {/each}
        </div>
        <button
          class="inline-escalate"
          type="button"
          title={i18n.content.selectionToolbar.openInSidebar}
          onclick={openInlineChatInSidebar}
        >
          <ExternalLink size={13} />
          <span>{i18n.content.selectionToolbar.openInSidebar}</span>
        </button>
      </div>
    {/if}

    <div class="input-container">
      <input
        bind:this={inputElement}
        bind:value={selectionState.popupText}
        class="text-input"
        type="text"
        onkeyup={stopKeyboardPropagation}
        onkeypress={stopKeyboardPropagation}
        aria-label={i18n.content.selectionToolbar.inputAria}
      />
      <div class="search-icons">
        {#each activeSearchEngines as engine (engine.id)}
          <button
            class="search-icon-btn"
            type="button"
            title={i18n.content.selectionToolbar.searchWith(engine.label)}
            onclick={() => searchSelection(engine.id)}
          >
            <span>{getEngineGlyph(engine.label)}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="actions-container">
      <button
        class="action-btn prominent"
        type="button"
        onclick={submitAskAiFromPopup}
      >
        <Sparkles size={16} />
        <span class="label">{i18n.content.selectionToolbar.askAi}</span>
      </button>

      <div class="separator"></div>

      <button
        class="action-btn icon-only"
        type="button"
        title={i18n.content.selectionToolbar.copyTitle}
        onclick={() => void handleCopy()}
      >
        <Copy size={16} />
      </button>
      <button
        class="action-btn icon-only"
        type="button"
        title={i18n.content.selectionToolbar.openUrlTitle}
        onclick={openSelectionAsUrl}
        disabled={!canOpenAsUrl}
      >
        <ExternalLink size={16} />
      </button>

      <div class="separator"></div>

      <button
        class="action-btn text"
        type="button"
        title={i18n.content.selectionToolbar.explain}
        onclick={() => preparePromptFromSelection("explain")}
      >
        <Lightbulb size={14} />
        <span class="label">{i18n.content.selectionToolbar.explain}</span>
      </button>
      <button
        class="action-btn text"
        type="button"
        title={i18n.content.selectionToolbar.translate}
        onclick={() => preparePromptFromSelection("translate")}
      >
        <Languages size={14} />
        <span class="label">{i18n.content.selectionToolbar.translate}</span>
      </button>
      <button
        class="action-btn text"
        type="button"
        title={i18n.content.selectionToolbar.context}
        onclick={addSelectionToContext}
      >
        <ListPlus size={14} />
        <span class="label">{i18n.content.selectionToolbar.context}</span>
      </button>
    </div>
  </div>
{/if}

<style>
  .toolbar {
    position: fixed;
    z-index: 2;
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 320px;
    max-width: min(520px, calc(100vw - 24px));
    padding: 10px 6px 6px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.2);
    box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
    color: #1e293b;
  }

  :global(.theme-dark) .toolbar {
    background: linear-gradient(
      180deg,
      rgba(15, 23, 42, 0.96),
      rgba(30, 41, 59, 0.94)
    );
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 18px 40px rgba(2, 6, 23, 0.42);
    color: #f8fafc;
  }

  .drag-handle {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: move;
    color: rgba(148, 163, 184, 0.3);
    border-radius: 14px 14px 0 0;
    transition:
      color 0.2s ease,
      background-color 0.2s ease;
  }

  .drag-handle:hover {
    color: rgba(100, 116, 139, 0.8);
    background: rgba(15, 23, 42, 0.05);
  }

  :global(.theme-dark) .drag-handle:hover {
    color: rgba(148, 163, 184, 0.7);
    background: rgba(255, 255, 255, 0.04);
  }

  .close-button {
    position: absolute;
    top: -4px;
    right: -4px;
    z-index: 2;
    width: 18px;
    height: 18px;
    border: none;
    border-radius: 9999px;
    background: rgba(148, 163, 184, 0.92);
    color: #0f172a;
    font-size: 12px;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.32);
    transition:
      background-color 140ms ease,
      transform 140ms ease;
  }

  .close-button:hover {
    background: #cbd5e1;
    transform: scale(1.04);
  }

  .inline-chat {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 320px;
  }

  .inline-context {
    padding: 8px 10px;
    border-radius: 10px;
    background: #f1f5f9;
    border: 1px solid #e2e8f0;
  }

  :global(.theme-dark) .inline-context {
    background: rgba(2, 6, 23, 0.62);
    border-color: rgba(148, 163, 184, 0.16);
  }

  .inline-context-label {
    display: block;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #64748b;
    margin-bottom: 4px;
  }

  :global(.theme-dark) .inline-context-label {
    color: rgba(148, 163, 184, 0.9);
  }

  .inline-context-text {
    margin: 0;
    font-size: 12px;
    line-height: 1.5;
    color: #334155;
    word-break: break-word;
    max-height: 64px;
    overflow-y: auto;
  }

  :global(.theme-dark) .inline-context-text {
    color: #e2e8f0;
  }

  .inline-messages {
    display: flex;
    flex-direction: column;
    gap: 8px;
    overflow-y: auto;
    max-height: 200px;
    padding-right: 2px;
  }

  .inline-escalate {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 10px;
    border: none;
    border-radius: 9px;
    background: rgba(132, 204, 22, 0.14);
    color: #4d7c0f;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      color 0.16s ease;
  }

  .inline-escalate:hover {
    background: rgba(132, 204, 22, 0.24);
    color: #3f6212;
  }

  :global(.theme-dark) .inline-escalate {
    background: rgba(132, 204, 22, 0.16);
    color: #bef264;
  }

  :global(.theme-dark) .inline-escalate:hover {
    background: rgba(132, 204, 22, 0.28);
    color: #ffffff;
  }

  .input-container {
    display: flex;
    align-items: center;
    gap: 6px;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 4px 6px;
    background: #f8fafc;
  }

  :global(.theme-dark) .input-container {
    border-color: rgba(148, 163, 184, 0.16);
    background: rgba(2, 6, 23, 0.62);
  }

  .text-input {
    flex: 1;
    min-width: 0;
    border: none;
    outline: none;
    background: transparent;
    color: #1e293b;
    font: inherit;
    font-size: 13px;
    padding: 4px 2px;
  }

  .text-input::placeholder {
    color: #94a3b8;
  }

  :global(.theme-dark) .text-input {
    color: #f8fafc;
  }

  .search-icons {
    display: flex;
    align-items: center;
    gap: 4px;
    padding-left: 6px;
    border-left: 1px solid #e2e8f0;
  }

  :global(.theme-dark) .search-icons {
    border-left-color: rgba(148, 163, 184, 0.14);
  }

  .search-icon-btn,
  .action-btn {
    border: none;
    border-radius: 9px;
    background: transparent;
    color: #475569;
    cursor: pointer;
    transition:
      background-color 0.16s ease,
      color 0.16s ease,
      border-color 0.16s ease;
  }

  .search-icon-btn {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    background: #e2e8f0;
    color: #334155;
    font-size: 11px;
    font-weight: 700;
  }

  .search-icon-btn:hover,
  .action-btn:hover:not(:disabled) {
    background: rgba(148, 163, 184, 0.22);
    color: #1e293b;
  }

  :global(.theme-dark) .search-icon-btn,
  :global(.theme-dark) .action-btn {
    color: #dbe4f0;
  }

  :global(.theme-dark) .search-icon-btn {
    background: rgba(30, 41, 59, 0.86);
    color: #e2e8f0;
  }

  :global(.theme-dark) .search-icon-btn:hover,
  :global(.theme-dark) .action-btn:hover:not(:disabled) {
    background: rgba(71, 85, 105, 0.34);
    color: #ffffff;
  }

  .actions-container {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .separator {
    width: 1px;
    height: 16px;
    background: rgba(148, 163, 184, 0.35);
    margin: 0 4px;
  }

  :global(.theme-dark) .separator {
    background: rgba(148, 163, 184, 0.18);
  }

  .action-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 7px 8px;
  }

  .action-btn.prominent {
    margin-right: 2px;
    padding: 7px 10px;
    background: linear-gradient(135deg, #84cc16, #65a30d);
    color: #ffffff;
    box-shadow: 0 4px 12px rgba(132, 204, 22, 0.2);
  }

  .action-btn.prominent:hover:not(:disabled) {
    background: linear-gradient(135deg, #4d7c0f, #3f6212);
    color: #ffffff;
  }

  :global(.theme-dark) .action-btn.prominent {
    background: linear-gradient(135deg, #4d7c0f, #3f6212);
    color: #ffffff;
  }

  :global(.theme-dark) .action-btn.prominent:hover:not(:disabled) {
    background: linear-gradient(135deg, #84cc16, #65a30d);
  }

  .action-btn.text .label,
  .action-btn.prominent .label {
    font-size: 12px;
    font-weight: 600;
  }

  .action-btn.icon-only {
    width: 30px;
    height: 30px;
    padding: 0;
  }

  .action-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
