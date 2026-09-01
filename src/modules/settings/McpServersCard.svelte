<script lang="ts">
  import Plus from 'lucide-svelte/icons/plus';
  import Trash2 from 'lucide-svelte/icons/trash-2';
  import { settingsState } from './settings-state.svelte';
  import {
    addMcpServer,
    removeMcpServer,
    updateMcpServer,
    updateMcpBridgeEnabled,
    updateMcpBridgeUrl,
  } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';

  const copy = $derived(getI18n($localeStore));

  /** Whole card is non-interactive until MCP settings ship. */
  const isCardDisabled = true;
</script>

<article class="card mcp-card" class:card-disabled={isCardDisabled}>
  <div class="card-header">
    <div>
      <h2>{copy.options.sections.mcp.title}</h2>
      <p class="muted">{copy.options.sections.mcp.body}</p>
    </div>
    <SaveIndicator section="mcp" />
  </div>

  <fieldset class="mcp-content" disabled={isCardDisabled}>
  <!-- Local Bridge Configuration -->
  <section class="mcp-section bridge-section">
    <div class="bridge-header">
      <div class="bridge-info">
        <h3>{copy.options.sections.mcp.bridgeTitle}</h3>
        <p class="muted">{copy.options.sections.mcp.bridgeBody}</p>
      </div>
      <label class="toggle-switch">
        <input
          type="checkbox"
          checked={settingsState.settings.mcpBridgeEnabled}
          onchange={(event) => updateMcpBridgeEnabled((event.currentTarget as HTMLInputElement).checked)}
        />
        <span class="slider"></span>
      </label>
    </div>

    {#if settingsState.settings.mcpBridgeEnabled}
      <div class="field-group">
        <label for="bridge-url">{copy.options.sections.mcp.bridgeUrl}</label>
        <input
          id="bridge-url"
          type="text"
          value={settingsState.settings.mcpBridgeUrl}
          placeholder="ws://localhost:3000"
          oninput={(event) => updateMcpBridgeUrl((event.currentTarget as HTMLInputElement).value)}
        />
      </div>
    {/if}
  </section>

  <hr class="divider" />

  <!-- Custom Servers Configuration -->
  <section class="mcp-section custom-servers-section">
    <div class="section-header">
      <h3>{copy.options.sections.mcp.customServersTitle}</h3>
      <button
        class="secondary icon-button"
        type="button"
        disabled={isCardDisabled}
        onclick={addMcpServer}
        aria-label={copy.options.sections.mcp.addServer}
      >
        <Plus size={14} />
        <span>{copy.options.sections.mcp.addServer}</span>
      </button>
    </div>

    {#if settingsState.settings.mcpServers.length === 0}
      <p class="empty-state">{copy.options.sections.mcp.empty || 'No custom servers configured.'}</p>
    {:else}
      <div class="servers-list">
        {#each settingsState.settings.mcpServers as server, index (server.id)}
          <div class="server-row">
            <label class="server-toggle">
              <input
                type="checkbox"
                checked={server.enabled}
                onchange={(event) => updateMcpServer(index, 'enabled', (event.currentTarget as HTMLInputElement).checked)}
              />
            </label>

            <div class="server-fields">
              <input
                type="text"
                value={server.name}
                class="server-name-input"
                placeholder={copy.options.sections.mcp.serverName || 'Server Name'}
                oninput={(event) => updateMcpServer(index, 'name', (event.currentTarget as HTMLInputElement).value)}
              />
              <input
                type="text"
                value={server.url}
                class="server-url-input"
                placeholder={copy.options.sections.mcp.serverUrl || 'http://localhost:3001/sse or ws://...'}
                oninput={(event) => updateMcpServer(index, 'url', (event.currentTarget as HTMLInputElement).value)}
              />
              <select
                value={server.transport}
                class="server-transport-select"
                onchange={(event) => updateMcpServer(index, 'transport', (event.currentTarget as HTMLSelectElement).value)}
              >
                <option value="sse">SSE</option>
                <option value="websocket">WebSocket</option>
              </select>
            </div>

            <button
              class="ghost danger icon-only"
              type="button"
              disabled={isCardDisabled}
              onclick={() => removeMcpServer(index)}
              aria-label="Remove server"
            >
              <Trash2 size={14} />
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </section>
  </fieldset>
</article>

<style>
  .card-disabled {
    opacity: 0.55;
    pointer-events: none;
    user-select: none;
  }
  .mcp-content {
    border: 0;
    margin: 0;
    padding: 0;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .card-disabled .mcp-content :is(input, select, button, .toggle-switch .slider) {
    cursor: not-allowed;
  }
  .card-disabled .toggle-switch .slider {
    background-color: #e2e8f0;
  }
  .card-disabled input:checked + .slider {
    background-color: #cbd5e1;
  }
  .card {
    padding: 24px;
    border-radius: 18px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.15);
    display: flex;
    flex-direction: column;
    gap: 20px;
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
  h2 {
    margin: 0;
    font-size: 18px;
    color: #1e293b;
  }
  h3 {
    margin: 0 0 4px;
    font-size: 15px;
    color: #0f172a;
  }
  .muted {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }
  .divider {
    border: 0;
    border-top: 1px solid #e2e8f0;
    margin: 4px 0;
  }
  .mcp-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .bridge-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }
  .bridge-info {
    flex: 1;
  }
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 44px;
    height: 24px;
    flex-shrink: 0;
  }
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #cbd5e1;
    transition: .2s;
    border-radius: 24px;
  }
  .slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .2s;
    border-radius: 50%;
  }
  input:checked + .slider {
    background-color: #84cc16;
  }
  input:checked + .slider:before {
    transform: translateX(20px);
  }
  .field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .field-group label {
    font-size: 12px;
    font-weight: 500;
    color: #475569;
  }
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
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
  .empty-state {
    margin: 0;
    font-size: 13px;
    color: #94a3b8;
    text-align: center;
    padding: 20px;
    border: 1px dashed #e2e8f0;
    border-radius: 14px;
  }
  .servers-list {
    display: grid;
    gap: 12px;
  }
  .server-row {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    gap: 12px;
    align-items: center;
    border-radius: 14px;
    border: 1px solid #e2e8f0;
    padding: 12px;
    background: #ffffff;
  }
  .server-toggle {
    display: grid;
    place-items: center;
  }
  .server-fields {
    display: grid;
    grid-template-columns: minmax(140px, 0.6fr) minmax(0, 1.4fr) minmax(110px, 0.4fr);
    gap: 10px;
  }
  input[type="text"] {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 8px 12px;
    font: inherit;
    font-size: 13px;
  }
  input[type="text"]:focus {
    outline: none;
    border-color: #84cc16;
  }
  select {
    border-radius: 10px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 8px 10px;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  select:focus {
    outline: none;
    border-color: #84cc16;
  }

  :global(.theme-dark) .divider {
    border-color: rgba(148, 163, 184, 0.1);
  }
  :global(.theme-dark) h3 {
    color: #f8fafc;
  }
  :global(.theme-dark) .field-group label {
    color: #cbd5e1;
  }
  :global(.theme-dark) .empty-state {
    border-color: rgba(148, 163, 184, 0.15);
    color: #64748b;
  }
  :global(.theme-dark) .server-row {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.1);
  }
  :global(.theme-dark) input[type="text"] {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #f8fafc;
  }
  :global(.theme-dark) select {
    background: #0f172a;
    border-color: rgba(148, 163, 184, 0.15);
    color: #f8fafc;
  }
  :global(.theme-dark) .card-disabled .toggle-switch .slider {
    background-color: #334155;
  }
  :global(.theme-dark) .card-disabled input:checked + .slider {
    background-color: #475569;
  }
</style>
