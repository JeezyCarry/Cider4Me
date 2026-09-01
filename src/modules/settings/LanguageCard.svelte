<script lang="ts">
  import { settingsState } from './settings-state.svelte';
  import { updateSetting } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';

  const copy = $derived(getI18n($localeStore));
</script>

<article class="card language-card">
  <div class="section-heading card-header">
    <div>
      <h2>{copy.options.sections.language.title}</h2>
      <p class="muted">{copy.options.sections.language.body}</p>
    </div>
    <SaveIndicator section="language" />
  </div>
  <label>
    <span>{copy.options.sections.language.label}</span>
    <select
      bind:value={settingsState.settings.locale}
      onchange={(event) => updateSetting('locale', (event.currentTarget as HTMLSelectElement).value as 'en' | 'nl')}
    >
      <option value="en">{copy.options.sections.language.english}</option>
      <option value="nl">{copy.options.sections.language.dutch}</option>
    </select>
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
  label {
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 14px;
    color: #475569;
  }
  select {
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 10px 12px;
    font: inherit;
    transition: border-color 140ms ease;
  }
  select:focus {
    outline: none;
    border-color: #84cc16;
  }
  .muted {
    margin: 0;
    color: #64748b;
    font-size: 13px;
    line-height: 1.45;
  }
</style>
