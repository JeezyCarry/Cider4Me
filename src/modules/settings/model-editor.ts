import type { AppLocale, ModelConfig } from "../../lib/shared/types";
import { getI18n } from "../../lib/i18n";
import { formatModelLabel } from "./model-config";

export interface ModelDraft {
  id: string;
  label: string;
  /** Owning provider instance id. */
  providerId: string;
  enabled: boolean;
  supportsImages: boolean;
  webSearchEnabled: boolean;
  thinkingLevel: "low" | "medium" | "high" | "";
}

export function createModelDraft(
  providerId: string = "openrouter",
  model?: ModelConfig,
): ModelDraft {
  return {
    id: model?.id ?? "",
    label: model?.label ?? "",
    providerId: model?.providerId ?? providerId,
    enabled: model?.enabled ?? true,
    supportsImages: model?.supportsImages ?? false,
    webSearchEnabled: model?.webSearchEnabled ?? false,
    thinkingLevel: model?.thinkingLevel ?? "",
  };
}

export function validateModelDraft(
  draft: ModelDraft,
  locale: AppLocale,
): string | null {
  if (!draft.id.trim()) return getI18n(locale).errors.invalidModelId;
  return null;
}

export function upsertModel(
  models: ModelConfig[],
  draft: ModelDraft,
  editingModelId: string | null,
  providerId: string = draft.providerId,
): ModelConfig[] {
  const normalizedId = draft.id.trim();
  const normalizedLabel = draft.label.trim();

  const nextModel: ModelConfig = {
    id: normalizedId,
    label: normalizedLabel || formatModelLabel(normalizedId),
    providerId,
    enabled: draft.enabled,
    supportsImages: draft.supportsImages,
    webSearchEnabled: draft.webSearchEnabled,
    thinkingLevel: draft.thinkingLevel || undefined,
  };

  if (editingModelId) {
    return models.map((model) =>
      model.id === editingModelId ? nextModel : model,
    );
  }

  return [...models, nextModel];
}
