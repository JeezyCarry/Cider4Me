import { DEFAULT_SETTINGS } from './constants';
import type { ModelConfig, ProviderInstance } from './types';

/** Structural subset satisfied by both AppSettings and PublicAppSettings. */
export type SettingsWithProviders = {
  providers: ProviderInstance[];
  defaultModelId: string;
};

export interface FlattenedModel {
  provider: ProviderInstance;
  model: ModelConfig;
}

/** Composite reference `${providerId}:${modelId}` used for selection/default. */
export function getModelRef(providerId: string, modelId: string): string {
  return `${providerId}:${modelId}`;
}

export function getFlattenedModels(settings: SettingsWithProviders): FlattenedModel[] {
  return settings.providers.flatMap((provider) =>
    provider.models.map((model) => ({ provider, model })),
  );
}

export function getEnabledModels(settings: SettingsWithProviders): FlattenedModel[] {
  return getFlattenedModels(settings).filter(
    (entry) => entry.provider.enabled && entry.model.enabled,
  );
}

/** Flattened ModelConfig list for display/overview (order-preserving). */
export function getAllModels(settings: SettingsWithProviders): ModelConfig[] {
  return getFlattenedModels(settings).map((entry) => entry.model);
}

export function findModelByRef(
  settings: SettingsWithProviders,
  ref: string,
): FlattenedModel | undefined {
  return getFlattenedModels(settings).find(
    (entry) => getModelRef(entry.provider.id, entry.model.id) === ref,
  );
}

export function getProvider(
  settings: SettingsWithProviders,
  providerId: string,
): ProviderInstance | undefined {
  return settings.providers.find((provider) => provider.id === providerId);
}

export function ensureValidDefaultModelIdFromProviders(
  providers: ProviderInstance[],
  defaultModelId: string,
): string {
  const settings = { providers, defaultModelId };
  if (findModelByRef(settings, defaultModelId)) return defaultModelId;

  const fallback = getEnabledModels(settings)[0] ?? getFlattenedModels(settings)[0];
  return fallback ? getModelRef(fallback.provider.id, fallback.model.id) : DEFAULT_SETTINGS.defaultModelId;
}

export function ensureValidDefaultModelId(settings: SettingsWithProviders): string {
  return ensureValidDefaultModelIdFromProviders(settings.providers, settings.defaultModelId);
}
