<script lang="ts">
  import { settingsState } from './settings-state.svelte';
  import { updateSetting } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';

  const copy = $derived(getI18n($localeStore));
</script>

<footer class="debug-footer">
  <label class="debug-toggle">
    <span>{copy.options.debugFooter.title}</span>
    <input
      type="checkbox"
      checked={settingsState.settings.debugMode}
      onchange={(event) => updateSetting('debugMode', (event.currentTarget as HTMLInputElement).checked)}
    />
  </label>
  <p>{copy.options.debugFooter.body}</p>
</footer>

<style>
  .debug-footer {
    margin-top: 32px;
    padding-top: 20px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .debug-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 13px;
    color: #64748b;
  }

  .debug-toggle span {
    font-weight: 600;
    color: #475569;
  }

  .debug-toggle input {
    width: auto;
  }

  p {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
    line-height: 1.4;
  }

  :global(.theme-dark) .debug-footer {
    border-top-color: rgba(148, 163, 184, 0.15);
  }

  :global(.theme-dark) .debug-toggle {
    color: #94a3b8;
  }

  :global(.theme-dark) .debug-toggle span {
    color: #cbd5e1;
  }

  :global(.theme-dark) .debug-footer p {
    color: #64748b;
  }
</style>
