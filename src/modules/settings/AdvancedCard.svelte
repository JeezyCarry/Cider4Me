<script lang="ts">
  import { settingsState } from './settings-state.svelte';
  import { updateSetting, updateTakeInputIgnoredFields } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';
  import Info from 'lucide-svelte/icons/info';

  const copy = $derived(getI18n($localeStore));
</script>

<article class="card advanced-card">
  <div class="section-heading card-header">
    <div>
      <h2>{copy.options.sections.advanced.title}</h2>
      <p class="muted">{copy.options.sections.advanced.takeInput.description}</p>
    </div>
    <SaveIndicator section="advanced" />
  </div>

  <label class="toggle-card">
    <div>
      <span class="toggle-title">{copy.options.sections.advanced.takeInput.title}</span>
      <small>{copy.options.sections.advanced.takeInput.description}</small>
    </div>
    <input
      type="checkbox"
      checked={settingsState.settings.takeInputEnabled}
      onchange={(e) => updateSetting('takeInputEnabled', (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>

  <label class="ignored-fields">
    <span class="label-row">
      <span>{copy.options.sections.advanced.ignoredFields.title}</span>
      <span class="tooltip-anchor">
        <Info size={14} aria-label="info" />
        <span class="tooltip" role="tooltip">{copy.options.sections.advanced.ignoredFields.tooltip}</span>
      </span>
    </span>
    <textarea
      rows="4"
      value={settingsState.settings.takeInputIgnoredFields.join('\n')}
      onchange={(e) => updateTakeInputIgnoredFields((e.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </label>
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
  .section-heading {
    display: flex;
    flex-direction: column;
    gap: 4px;
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
  .muted {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }
  .toggle-card {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    padding: 12px;
    border-radius: 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
  }
  .toggle-title {
    font-weight: 600;
    color: #1e293b;
  }
  .toggle-card small {
    color: #64748b;
  }
  .ignored-fields {
    display: grid;
    gap: 8px;
    font-size: 14px;
    color: #475569;
  }
  .label-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }
  textarea {
    width: 100%;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 10px 12px;
    font: inherit;
    resize: vertical;
    box-sizing: border-box;
  }
  textarea:focus {
    outline: none;
    border-color: #84cc16;
  }
  .tooltip-anchor {
    position: relative;
    display: inline-flex;
    align-items: center;
    cursor: help;
  }
  .tooltip {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 260px;
    padding: 8px 10px;
    border-radius: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    color: #475569;
    font-size: 12px;
    line-height: 1.4;
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
    opacity: 0;
    pointer-events: none;
    transform: translateY(-4px);
    transition: all 0.16s ease;
    z-index: 2;
  }
  .tooltip-anchor:hover .tooltip,
  .tooltip-anchor:focus-within .tooltip {
    opacity: 1;
    transform: translateY(0);
  }
</style>
