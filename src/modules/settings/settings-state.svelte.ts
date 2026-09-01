import { DEFAULT_SETTINGS, DEFAULT_OPENROUTER_INSTANCE_ID } from '../../lib/shared/constants';
import type { AppSettings, SettingsSecrets } from '../../lib/shared/types';
import type { SettingsFormState } from './settings-types';
import { createModelDraft } from './model-editor';

export const settingsState = $state({
  settings: DEFAULT_SETTINGS as AppSettings,
  /** Provider API keys keyed by provider instance id (kept out of `settings`). */
  secrets: {} as SettingsSecrets,
  form: {
    modelDraft: createModelDraft(DEFAULT_OPENROUTER_INSTANCE_ID),
    modelDraftLabelMirrorsId: true,
    editingModelId: null,
    editingModelProvider: null,
    modelDraftError: '',
  } as SettingsFormState,
  isLoading: true,
  isSaving: false,
  saveMessage: '',
  saveStatus: 'idle' as 'idle' | 'saving' | 'success' | 'error',
  sectionStatus: {} as Record<string, 'idle' | 'saving' | 'success' | 'error'>,
});
