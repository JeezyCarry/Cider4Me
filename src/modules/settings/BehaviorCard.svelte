<script lang="ts">
  import { settingsState } from './settings-state.svelte';
  import { updateSetting } from './settings-actions';
  import { getI18n, localeStore } from '../../lib/i18n';
  import SaveIndicator from './SaveIndicator.svelte';

  const copy = $derived(getI18n($localeStore));
</script>

<article class="card behavior-card">
  <div class="section-heading card-header">
    <div>
      <h2>{copy.options.sections.behavior.title}</h2>
      <p class="muted">{copy.options.sections.behavior.body}</p>
    </div>
    <SaveIndicator section="behavior" />
  </div>
  <label class="toggle-card">
    <div>
      <span class="toggle-title">{copy.options.sections.behavior.autoReadTitle}</span>
      <small>{copy.options.sections.behavior.autoReadBody}</small>
    </div>
    <input
      type="checkbox"
      checked={settingsState.settings.autoReadPage}
      onchange={(e) => updateSetting('autoReadPage', (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>
  <label class="toggle-card">
    <div>
      <span class="toggle-title">{copy.options.sections.behavior.autoSendQuickActionsTitle}</span>
      <small>{copy.options.sections.behavior.autoSendQuickActionsBody}</small>
    </div>
    <input
      type="checkbox"
      checked={settingsState.settings.autoSendQuickActions}
      onchange={(e) => updateSetting('autoSendQuickActions', (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>
  <label class="toggle-card">
    <div>
      <span class="toggle-title">{copy.options.sections.behavior.selectionPopupFocusTitle}</span>
      <small>{copy.options.sections.behavior.selectionPopupFocusBody}</small>
    </div>
    <input
      type="checkbox"
      checked={settingsState.settings.selectionPopupTakesFocus}
      onchange={(e) =>
        updateSetting('selectionPopupTakesFocus', (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>
  <label class="toggle-card">
    <div>
      <span class="toggle-title">{copy.options.sections.behavior.wrapTitle}</span>
      <small>{copy.options.sections.behavior.wrapBody}</small>
    </div>
    <input
      type="checkbox"
      checked={settingsState.settings.textWrappingEnabled}
      onchange={(e) =>
        updateSetting('textWrappingEnabled', (e.currentTarget as HTMLInputElement).checked)}
    />
  </label>
  <label>
    <span>{copy.options.sections.behavior.submitShortcut}</span>
    <select
      value={settingsState.settings.composerSubmitMode}
      onchange={(e) =>
        updateSetting(
          'composerSubmitMode',
          (e.currentTarget as HTMLSelectElement).value as 'shift-enter' | 'enter'
        )}
    >
      <option value="shift-enter">{copy.options.sections.behavior.submitShiftEnter}</option>
      <option value="enter">{copy.options.sections.behavior.submitEnter}</option>
    </select>
  </label>
  <label>
    <span>{copy.options.sections.behavior.popupTarget}</span>
    <select
      value={settingsState.settings.popupChatTarget}
      onchange={(e) =>
        updateSetting(
          'popupChatTarget',
          (e.currentTarget as HTMLSelectElement).value as 'current-chat' | 'new-chat'
        )}
    >
      <option value="current-chat">{copy.options.sections.behavior.popupTargetCurrent}</option>
      <option value="new-chat">{copy.options.sections.behavior.popupTargetNew}</option>
    </select>
  </label>
  <label>
    <span>{copy.options.sections.behavior.themeTitle}</span>
    <select
      value={settingsState.settings.theme}
      onchange={(e) =>
        updateSetting(
          'theme',
          (e.currentTarget as HTMLSelectElement).value as 'light' | 'dark' | 'system'
        )}
    >
      <option value="light">{copy.options.sections.behavior.themeLight}</option>
      <option value="dark">{copy.options.sections.behavior.themeDark}</option>
      <option value="system">{copy.options.sections.behavior.themeSystem}</option>
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
  input[type='checkbox'] {
    width: auto;
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
</style>
