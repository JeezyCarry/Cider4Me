<script lang="ts">
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import Grip from 'lucide-svelte/icons/grip';
  import { settingsState } from './settings-state.svelte';
  import {
    addBlockedDomain,
    removeBlockedDomain,
    updateBlockedDomain,
  } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';

  const copy = $derived(getI18n($localeStore));
</script>

<article class="card site-card">
  <div class="card-header compact-header">
    <div>
      <h2>{copy.options.sections.siteBlocklist.title}</h2>
      <p class="muted">{copy.options.sections.siteBlocklist.body}</p>
    </div>
    <SaveIndicator section="site-blocklist" />
    <button
      class="secondary icon-button"
      type="button"
      onclick={addBlockedDomain}
      aria-label={copy.options.sections.siteBlocklist.addAria}
    >
      <Plus size={14} />
      <span>{copy.common.add}</span>
    </button>
  </div>

  <div class="stack compact-stack">
    {#if settingsState.settings.siteAccessPolicy.domains.length === 0}
      <p class="muted">{copy.options.sections.siteBlocklist.empty}</p>
    {:else}
      {#each settingsState.settings.siteAccessPolicy.domains as domain, index (`${index}-${domain}`)}
        <div class="list-row domain-row">
          <span class="row-icon"><Grip size={14} /></span>
          <input
            type="text"
            class="row-input"
            value={domain}
            placeholder="example.com"
            oninput={(event) => updateBlockedDomain(index, (event.currentTarget as HTMLInputElement).value)}
          />
          <button
            class="ghost danger icon-only"
            type="button"
            onclick={() => removeBlockedDomain(index)}
            aria-label={copy.options.sections.siteBlocklist.removeAria}
          >
            <Trash2 size={14} />
          </button>
        </div>
      {/each}
    {/if}
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
  .stack {
    display: grid;
    gap: 10px;
  }
  .compact-stack {
    align-content: start;
  }
  .list-row {
    display: grid;
    gap: 10px;
    align-items: center;
    border-radius: 14px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    padding: 10px;
  }
  .domain-row {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }
  .row-icon {
    color: #94a3b8;
    display: grid;
    place-items: center;
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
  .row-input {
    width: 100%;
    border-color: transparent;
  }
  .row-input:focus {
    background: #f8fafc;
  }
</style>
