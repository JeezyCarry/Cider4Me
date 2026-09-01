<script lang="ts">
  import { settingsState } from './settings-state.svelte';
  import { updatePromptTemplate } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';

  const copy = $derived(getI18n($localeStore));
</script>

<article class="card prompt-card">
  <div class="section-heading card-header">
    <div>
      <h2>{copy.options.sections.promptTemplates.title}</h2>
      <p class="muted">{copy.options.sections.promptTemplates.body}</p>
    </div>
    <SaveIndicator section="prompt-templates" />
  </div>
  <label>
    <span>{copy.options.sections.promptTemplates.ask}</span>
    <textarea
      rows="4"
      value={settingsState.settings.promptTemplates.askSelection}
      oninput={(e) =>
        updatePromptTemplate('askSelection', (e.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </label>
  <label>
    <span>{copy.options.sections.promptTemplates.explain}</span>
    <textarea
      rows="4"
      value={settingsState.settings.promptTemplates.explainSelection}
      oninput={(e) =>
        updatePromptTemplate('explainSelection', (e.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </label>
  <label>
    <span>{copy.options.sections.promptTemplates.translate}</span>
    <textarea
      rows="4"
      value={settingsState.settings.promptTemplates.translateSelection}
      oninput={(e) =>
        updatePromptTemplate('translateSelection', (e.currentTarget as HTMLTextAreaElement).value)}
    ></textarea>
  </label>
  <p class="muted">{copy.options.sections.promptTemplates.helper}</p>
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
  .prompt-card {
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
  textarea {
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    border-radius: 12px;
    border: 1px solid #e2e8f0;
    background: #ffffff;
    color: #0f172a;
    padding: 10px 12px;
    font: inherit;
    transition: border-color 140ms ease;
    resize: vertical;
  }
  textarea:focus {
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
