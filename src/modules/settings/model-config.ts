import {
  DEFAULT_OPENROUTER_MODEL,
  DEFAULT_OPENROUTER_INSTANCE_ID,
} from "../../lib/shared/constants";
import type { AppSettings, ModelConfig } from "../../lib/shared/types";

export function formatModelLabel(id: string): string {
  const labelSource = id.includes("/") ? (id.split("/").at(-1) ?? id) : id;

  return labelSource
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])(\d)/gi, "$1 $2")
    .split(/\s+/)
    .filter(Boolean)
    .map((segment) => {
      if (/^\d+[a-z]$/i.test(segment)) {
        return segment.slice(0, -1) + segment.slice(-1).toUpperCase();
      }

      if (/^[a-z]+$/i.test(segment)) {
        return segment.charAt(0).toUpperCase() + segment.slice(1);
      }

      return segment;
    })
    .join(" ");
}

function shouldReplaceGenericLabel(label: string | undefined): boolean {
  if (!label) return true;
  return label.trim().toLowerCase() === "primary model";
}

export function buildModelConfigs(
  modelIds: string[],
  currentModels: ModelConfig[],
  providerId: string = DEFAULT_OPENROUTER_INSTANCE_ID,
): ModelConfig[] {
  return modelIds.map((id) => {
    const currentModel = currentModels.find((model) => model.id === id);
    return {
      id,
      label: shouldReplaceGenericLabel(currentModel?.label)
        ? formatModelLabel(id)
        : currentModel!.label,
      providerId: currentModel?.providerId ?? providerId,
      enabled: currentModel?.enabled ?? true,
      supportsImages: currentModel?.supportsImages ?? false,
      webSearchEnabled: currentModel?.webSearchEnabled ?? false,
      thinkingLevel: currentModel?.thinkingLevel,
      contextWindow:
        currentModel?.contextWindow ?? DEFAULT_OPENROUTER_MODEL.contextWindow,
    };
  });
}

export function normalizeModelLabels<T extends AppSettings>(settings: T): T {
  return {
    ...settings,
    providers: settings.providers.map((provider) => ({
      ...provider,
      models: buildModelConfigs(
        provider.models.map((model) => model.id),
        provider.models,
        provider.id,
      ),
    })),
  };
}
