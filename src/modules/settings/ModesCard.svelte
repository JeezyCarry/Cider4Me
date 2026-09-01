<script lang="ts">
  import Check from "lucide-svelte/icons/check";
  import Plus from "lucide-svelte/icons/plus";
  import Trash2 from "lucide-svelte/icons/trash-2";
  import { settingsState } from "./settings-state.svelte";
  import {
    addCustomMode,
    removeCustomMode,
    setActiveMode,
    updateCustomMode,
  } from "./settings-actions";
  import { getI18n, localeStore } from "../../lib/i18n";
  import SaveIndicator from "./SaveIndicator.svelte";

  const copy = $derived(getI18n($localeStore));
</script>

<article class="card modes-card">
  <div class="card-header compact-header">
    <div>
      <h2>{copy.options.sections.modes.title}</h2>
      <p class="muted">{copy.options.sections.modes.body}</p>
    </div>
    <SaveIndicator section="modes" />
    <button
      class="secondary icon-button"
      type="button"
      onclick={addCustomMode}
      aria-label={copy.options.sections.modes.addMode}
    >
      <Plus size={14} />
      <span>{copy.options.sections.modes.addMode}</span>
    </button>
  </div>

  <div class="modes-list">
    {#if settingsState.settings.modes.length === 0}
      <p class="muted empty">{copy.options.sections.modes.empty}</p>
    {/if}
    {#each settingsState.settings.modes as mode, index (mode.id)}
      {@const isActive = settingsState.settings.activeModeId === mode.id}
      <div class="mode-row" class:active={isActive}>
        <div class="mode-header-line">
          <button
            class="active-toggle"
            class:is-active={isActive}
            type="button"
            onclick={() => setActiveMode(mode.id)}
            aria-label={copy.options.sections.modes.setActiveAria(mode.label)}
            aria-pressed={isActive}
            title={isActive
              ? copy.options.sections.modes.activeLabel
              : copy.options.sections.modes.setActiveAria(mode.label)}
          >
            <Check size={14} />
          </button>
          <input
            type="text"
            value={mode.label}
            class="mode-name-input"
            placeholder={copy.options.sections.modes.label}
            oninput={(event) =>
              updateCustomMode(
                index,
                "label",
                (event.currentTarget as HTMLInputElement).value,
              )}
          />
          {#if isActive}
            <span class="active-badge"
              >{copy.options.sections.modes.activeLabel}</span
            >
          {/if}
          <button
            class="ghost danger icon-only"
            type="button"
            onclick={() => removeCustomMode(index)}
            aria-label={copy.options.sections.modes.removeModeAria}
          >
            <Trash2 size={14} />
          </button>
        </div>

        <div class="mode-prompt-container">
          <textarea
            id="mode-prompt-input-{index}"
            value={mode.systemPrompt}
            class="mode-prompt-input"
            rows="3"
            oninput={(event) =>
              updateCustomMode(
                index,
                "systemPrompt",
                (event.currentTarget as HTMLTextAreaElement).value,
              )}
          ></textarea>
        </div>
      </div>
    {/each}
  </div>
</article>

<style>
  .card {
    padding: 24px;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.15);
    display: flex;
    flex-direction: column;
    gap: 16px;
    box-shadow:
      0 4px 6px -1px rgb(0 0 0 / 0.1),
      0 2px 4px -2px rgb(0 0 0 / 0.1);
    min-height: 200px;
    height: auto;
    width: 100%;
    box-sizing: border-box;
  }
  .card-header {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    align-items: flex-start;
  }
  .compact-header {
    margin-bottom: 2px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
    color: #1e293b;
  }
  .muted {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }
  .empty {
    padding: 8px 0;
  }
  .secondary {
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font: inherit;
    transition: all 140ms ease;
    background: #f1f5f9;
    color: #1e293b;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
  }
  .secondary:hover {
    background: #e2e8f0;
  }
  .ghost {
    border: none;
    border-radius: 12px;
    cursor: pointer;
    font: inherit;
    transition: all 140ms ease;
    background: transparent;
    color: #64748b;
  }
  .ghost:hover {
    background: #f8fafc;
    color: #1e293b;
  }
  .danger {
    color: #ef4444;
  }
  .danger:hover {
    background: #fef2f2;
  }
  .icon-button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .icon-only {
    width: 38px;
    height: 38px;
    display: grid;
    place-items: center;
    padding: 0;
  }
  .modes-list {
    display: grid;
    gap: 16px;
  }
  .mode-row {
    display: flex;
    flex-direction: column;
    gap: 10px;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 14px;
  }
  .mode-row.active {
    border-color: rgba(132, 204, 22, 0.45);
    box-shadow: 0 0 0 1px rgba(132, 204, 22, 0.12);
  }
  .mode-header-line {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .active-toggle {
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: 9999px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: transparent;
    cursor: pointer;
    display: grid;
    place-items: center;
    padding: 0;
    transition: all 140ms ease;
  }
  .active-toggle:hover {
    border-color: #84cc16;
    color: #a3e635;
  }
  .active-toggle.is-active {
    border-color: #84cc16;
    background: rgba(132, 204, 22, 0.12);
    color: #65a30d;
  }
  .active-badge {
    flex-shrink: 0;
    padding: 2px 8px;
    border-radius: 9999px;
    background: rgba(132, 204, 22, 0.12);
    color: #65a30d;
    font-size: 11px;
    font-weight: 600;
  }
  .mode-name-input {
    flex: 1;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 8px 12px;
    font: inherit;
    font-weight: 600;
    font-size: 14px;
  }
  .mode-name-input:focus {
    outline: none;
    border-color: #84cc16;
  }
  .mode-prompt-container {
    width: 100%;
  }
  .mode-prompt-input {
    width: 100%;
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    font: inherit;
    font-size: 13px;
    resize: vertical;
  }
  .mode-prompt-input:focus {
    outline: none;
    border-color: #84cc16;
  }

  :global(.theme-dark) .mode-row {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.1);
  }
  :global(.theme-dark) .mode-row.active {
    border-color: rgba(132, 204, 22, 0.35);
  }
  :global(.theme-dark) .active-toggle {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.2);
  }
  :global(.theme-dark) .active-toggle.is-active {
    background: rgba(132, 204, 22, 0.18);
    color: #a3e635;
    border-color: rgba(132, 204, 22, 0.45);
  }
  :global(.theme-dark) .active-badge {
    background: rgba(132, 204, 22, 0.18);
    color: #a3e635;
  }
  :global(.theme-dark) .mode-name-input {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #f8fafc;
  }
  :global(.theme-dark) .mode-prompt-input {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #f8fafc;
  }
</style>
