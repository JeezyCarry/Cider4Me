import type { ModelDraft } from './model-editor';

export interface SettingsFormState {
  modelDraft: ModelDraft;
  /** When true, typing a model ID copies into the display label until the label is edited. */
  modelDraftLabelMirrorsId: boolean;
  editingModelId: string | null;
  /** Provider instance id currently being edited (null when not editing). */
  editingModelProvider: string | null;
  modelDraftError: string;
}
