<script lang="ts">
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import { settingsState } from './settings-state.svelte';
  import {
    addSearchProvider,
    removeSearchProvider,
    updateSearchProvider,
  } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';

  const copy = $derived(getI18n($localeStore));
</script>

<article class="card search-card">
  <div class="card-header compact-header">
    <div>
      <h2>{copy.options.sections.searchProviders.title}</h2>
      <p class="muted">{copy.options.sections.searchProviders.body}</p>
    </div>
    <SaveIndicator section="search-providers" />
    <button
      class="secondary icon-button"
      type="button"
      onclick={addSearchProvider}
      aria-label={copy.options.sections.searchProviders.addAria}
    >
      <Plus size={14} />
      <span>{copy.options.sections.searchProviders.addLabel}</span>
    </button>
  </div>

  <div class="search-list">
    {#each settingsState.settings.searchEngines as engine, index (engine.id)}
      <div class="search-row">
        <label
          class="search-toggle"
          aria-label={copy.options.sections.searchProviders.enableAria(engine.label)}
        >
          <input
            type="checkbox"
            checked={engine.enabled}
            onchange={(event) => updateSearchProvider(index, 'enabled', (event.currentTarget as HTMLInputElement).checked)}
          />
        </label>

        <div class="search-fields">
          <input
            type="text"
            value={engine.label}
            class="search-name"
            placeholder={copy.options.sections.searchProviders.providerNamePlaceholder}
            oninput={(event) => updateSearchProvider(index, 'label', (event.currentTarget as HTMLInputElement).value)}
          />
          <input
            type="text"
            value={engine.template}
            class="search-template"
            placeholder={"https://example.com/search?q={query}"}
            oninput={(event) => updateSearchProvider(index, 'template', (event.currentTarget as HTMLInputElement).value)}
          />
        </div>

        <button
          class="ghost danger icon-only"
          type="button"
          onclick={() => removeSearchProvider(index)}
          aria-label={copy.options.sections.searchProviders.removeAria}
        >
          <Trash2 size={14} />
        </button>
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
    min-height: 320px;
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
  .search-list {
    display: grid;
    gap: 10px;
  }
  .search-row {
    display: grid;
    gap: 10px;
    align-items: center;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 10px;
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .search-toggle {
    display: grid;
    place-items: center;
  }
  .search-fields {
    display: grid;
    grid-template-columns: minmax(180px, 0.8fr) minmax(0, 1.6fr);
    gap: 10px;
  }
  input {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 10px 12px;
    font: inherit;
    transition: border-color 140ms ease;
  }
  input:focus {
    outline: none;
    border-color: #84cc16;
  }
  .search-name,
  .search-template {
    width: 100%;
    border-color: transparent;
  }
  .search-name:focus,
  .search-template:focus {
    background: #f8fafc;
  }
</style>
