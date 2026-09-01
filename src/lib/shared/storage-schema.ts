import {
  isOpenRouterBaseUrl,
  normalizeOpenAiCompatibleBaseUrl,
  normalizeProviderApiKey,
} from "../ai/openai-compatible-url";
import {
  DEBUG_LOG_RETENTION_DAYS,
  DEFAULT_GEMINI_INSTANCE_ID,
  DEFAULT_OPENROUTER_INSTANCE_ID,
  DEFAULT_SETTINGS,
  STORAGE_VERSION,
} from "./constants";
import { normalizeSiteDomain } from "../browser/site-access";
import { ensureValidDefaultModelId } from "./model-registry";
import { normalizeProviderSecrets, toPublicSettings } from "./settings-secrets";
import type {
  AppSettings,
  Conversation,
  DebugLogRecord,
  ModeConfig,
  ModelConfig,
  ProviderInstance,
  PublicAppSettings,
  SettingsSecrets,
} from "./types";

const DEFAULT_AGENT_MODE = DEFAULT_SETTINGS.modes.find(
  (mode) => mode.id === "default",
)!;

/** Ensures the built-in default mode exists and activeModeId points at a valid mode. */
export function normalizeAgentModes(
  modes: ModeConfig[] | undefined,
  activeModeId: string | undefined,
): { modes: ModeConfig[]; activeModeId: string } {
  const source = modes ?? DEFAULT_SETTINGS.modes;
  const resolvedModes = source.some((mode) => mode.id === "default")
    ? source
    : [DEFAULT_AGENT_MODE, ...source];

  if (resolvedModes.length === 0) {
    return { modes: [], activeModeId: "" };
  }

  const candidateActiveId = activeModeId ?? DEFAULT_SETTINGS.activeModeId;
  const resolvedActiveId = resolvedModes.some(
    (mode) => mode.id === candidateActiveId,
  )
    ? candidateActiveId
    : (resolvedModes.find((mode) => mode.id === "default")?.id ??
      resolvedModes[0]?.id ??
      "");

  return { modes: resolvedModes, activeModeId: resolvedActiveId };
}

export interface StorageShape {
  version: number;
  settings: PublicAppSettings;
  secrets: SettingsSecrets;
  conversations: Conversation[];
  debugLogs: DebugLogRecord[];
}

export const STORAGE_KEYS = {
  version: "app.version",
  settings: "settings.data",
  secrets: "settings.secrets",
  conversations: "chat.conversations",
  debugLogs: "debug.logs",
} as const;

export const STORAGE_DEFAULTS: StorageShape = {
  version: STORAGE_VERSION,
  settings: toPublicSettings(DEFAULT_SETTINGS),
  secrets: {},
  conversations: [],
  debugLogs: [],
};

export function pruneDebugLogs(
  logs: DebugLogRecord[],
  now = new Date(),
): DebugLogRecord[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - DEBUG_LOG_RETENTION_DAYS);
  return logs.filter((log) => new Date(log.timestamp) >= cutoff);
}

type LegacyModel = Partial<ModelConfig> & { provider?: string };

type LegacyProviderSlot = {
  apiKey?: string;
  baseUrl?: string;
  models?: LegacyModel[];
};

type LegacySettings = Partial<Omit<AppSettings, "providers">> & {
  apiKey?: string;
  models?: LegacyModel[];
  providers?: ProviderInstance[];
  openRouter?: LegacyProviderSlot;
  googleGemini?: LegacyProviderSlot;
  hiddenLauncherDomains?: string[];
  siteAccessPolicy?: {
    domains?: string[];
    mode?: "all" | "allowlist" | "blocklist";
  };
  locale?: "en" | "nl";
};

function normalizeProviderModels(
  models: LegacyModel[] | undefined,
  fallbackProviderId: string,
): ModelConfig[] | undefined {
  if (!models) return undefined;

  return models.map((model) => ({
    id: model.id ?? "",
    label: model.label ?? "",
    providerId: model.providerId ?? model.provider ?? fallbackProviderId,
    enabled: model.enabled ?? true,
    supportsImages: model.supportsImages ?? false,
    webSearchEnabled: model.webSearchEnabled ?? false,
    contextWindow: model.contextWindow,
  }));
}

/** Normalizes already-migrated provider instances and their model lists. */
function normalizeProviderInstances(
  providers: ProviderInstance[] | undefined,
): ProviderInstance[] {
  if (!providers || providers.length === 0) return DEFAULT_SETTINGS.providers;

  return providers.map((provider) => ({
    ...provider,
    // Fix providers mislabeled 'openrouter' (e.g. Cortecs) whose base URL is not OpenRouter.
    type:
      provider.type === "openrouter" &&
      !isOpenRouterBaseUrl(provider.baseUrl ?? "")
        ? "openai-compatible"
        : provider.type,
    label: provider.label?.trim() ? provider.label : provider.type,
    baseUrl:
      provider.type === "openrouter" || provider.type === "openai-compatible"
        ? normalizeOpenAiCompatibleBaseUrl(provider.baseUrl ?? "")
        : (provider.baseUrl ?? ""),
    models: normalizeProviderModels(provider.models, provider.id) ?? [],
    enabled: provider.enabled ?? true,
  }));
}

function convertLegacySecrets(
  input: unknown,
  legacy: {
    openRouter?: LegacyProviderSlot;
    googleGemini?: LegacyProviderSlot;
    apiKey?: string;
  },
): SettingsSecrets {
  const out: SettingsSecrets = {};

  if (input && typeof input === "object") {
    const record = input as Record<string, unknown>;
    const values = Object.values(record);

    // New shape: Record<providerId, string> — pass through (trimmed).
    if (
      values.length > 0 &&
      values.every((value) => typeof value === "string")
    ) {
      return normalizeProviderSecrets(record as SettingsSecrets);
    }

    // Legacy shape: { openRouter: { apiKey }, googleGemini: { apiKey } }
    const openRouterKey = record["openRouter"] ?? record["openrouter"];
    const geminiKey = record["googleGemini"] ?? record["google-gemini"];
    if (openRouterKey && typeof openRouterKey === "object") {
      out["openrouter"] = (openRouterKey as { apiKey?: string }).apiKey ?? "";
    }
    if (geminiKey && typeof geminiKey === "object") {
      out["google-gemini"] = (geminiKey as { apiKey?: string }).apiKey ?? "";
    }
  }

  // Fall back to inline legacy keys when no secrets store provided them.
  if (out["openrouter"] === undefined) {
    out["openrouter"] = legacy.openRouter?.apiKey ?? legacy.apiKey ?? "";
  }
  if (out["google-gemini"] === undefined) {
    out["google-gemini"] = legacy.googleGemini?.apiKey ?? "";
  }

  return normalizeProviderSecrets(out);
}

function getDefaultProvider(providerId: string): ProviderInstance {
  return (
    DEFAULT_SETTINGS.providers.find((p) => p.id === providerId) ??
    DEFAULT_SETTINGS.providers[0]
  );
}

function buildProviderInstances(legacy: LegacySettings): ProviderInstance[] {
  const openRouterDefault = getDefaultProvider(DEFAULT_OPENROUTER_INSTANCE_ID);
  const geminiDefault = getDefaultProvider(DEFAULT_GEMINI_INSTANCE_ID);
  const openRouterModels =
    normalizeProviderModels(
      legacy.openRouter?.models ?? legacy.models,
      "openrouter",
    ) ?? openRouterDefault.models;
  const geminiModels =
    normalizeProviderModels(legacy.googleGemini?.models, "google-gemini") ??
    geminiDefault.models;

  const openRouterProvider = {
    ...openRouterDefault,
    baseUrl:
      normalizeOpenAiCompatibleBaseUrl(legacy.openRouter?.baseUrl ?? "") ||
      openRouterDefault.baseUrl,
    models: openRouterModels,
  };
  const geminiProvider = { ...geminiDefault, models: geminiModels };

  // Preserve the default seed order (incl. Cortecs) while overriding legacy OpenRouter/Gemini slots.
  return DEFAULT_SETTINGS.providers.map((preset) => {
    if (preset.id === DEFAULT_OPENROUTER_INSTANCE_ID) return openRouterProvider;
    if (preset.id === DEFAULT_GEMINI_INSTANCE_ID) return geminiProvider;
    return preset;
  });
}

export type RawStorageInput = Partial<StorageShape> & {
  settings?: Partial<AppSettings> | PublicAppSettings;
};

export function migrateStorage(raw: RawStorageInput | undefined): StorageShape {
  const legacySettings = raw?.settings as LegacySettings | undefined;
  const {
    apiKey: legacyApiKey,
    models: legacyModels,
    openRouter: legacyOpenRouter,
    googleGemini: legacyGoogleGemini,
    providers: legacyProviders,
    hiddenLauncherDomains: _legacyHiddenLauncherDomains,
    siteAccessPolicy: legacySiteAccessPolicy,
    promptTemplates: legacyPromptTemplates,
    ...sanitizedLegacySettings
  } = legacySettings ?? {};

  const migratedBlockedDomains = Array.from(
    new Set(
      [
        ...(legacySiteAccessPolicy?.domains ?? []),
        ...(_legacyHiddenLauncherDomains ?? []),
      ]
        .map((domain) => normalizeSiteDomain(domain))
        .filter(Boolean),
    ),
  ).sort();

  const hasProviders = Array.isArray(legacyProviders);
  const providers = hasProviders
    ? normalizeProviderInstances(legacyProviders)
    : buildProviderInstances({
        apiKey: legacyApiKey,
        models: legacyModels,
        openRouter: legacyOpenRouter,
        googleGemini: legacyGoogleGemini,
      });

  const mergedSettings: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...(sanitizedLegacySettings as Partial<AppSettings>),
    providers,
    selectionPopupTakesFocus:
      sanitizedLegacySettings?.selectionPopupTakesFocus ??
      DEFAULT_SETTINGS.selectionPopupTakesFocus,
    siteAccessPolicy: {
      domains: migratedBlockedDomains,
    },
    promptTemplates: {
      ...DEFAULT_SETTINGS.promptTemplates,
      ...(legacyPromptTemplates ?? {}),
    },
    systemPrompt: legacySettings?.systemPrompt ?? DEFAULT_SETTINGS.systemPrompt,
    theme: legacySettings?.theme ?? DEFAULT_SETTINGS.theme,
    ...(() => {
      const normalizedModes = normalizeAgentModes(
        legacySettings?.modes,
        legacySettings?.activeModeId,
      );
      return {
        modes: normalizedModes.modes,
        activeModeId: normalizedModes.activeModeId,
      };
    })(),
    mcpServers: legacySettings?.mcpServers ?? DEFAULT_SETTINGS.mcpServers,
    mcpBridgeEnabled:
      legacySettings?.mcpBridgeEnabled ?? DEFAULT_SETTINGS.mcpBridgeEnabled,
    mcpBridgeUrl: legacySettings?.mcpBridgeUrl ?? DEFAULT_SETTINGS.mcpBridgeUrl,
  };

  mergedSettings.defaultModelId = migrateDefaultModelId(
    legacySettings?.defaultModelId,
    providers,
    mergedSettings,
  );

  const secrets = convertLegacySecrets(raw?.secrets, legacySettings ?? {});
  const settings = toPublicSettings(mergedSettings);

  return {
    version: STORAGE_VERSION,
    settings,
    secrets,
    conversations: raw?.conversations ?? [],
    debugLogs: pruneDebugLogs(raw?.debugLogs ?? []),
  };
}

/**
 * Converts a legacy bare model id into a composite `${providerId}:${modelId}`
 * reference by locating the matching model across provider instances.
 */
function migrateDefaultModelId(
  _legacyDefault: string | undefined,
  providers: ProviderInstance[],
  merged: AppSettings,
): string {
  const legacy = _legacyDefault ?? "";
  const hasSeparator = legacy.includes(":");

  if (hasSeparator) {
    const [prefix] = legacy.split(":");
    const provider = providers.find((p) => p.id === prefix);
    if (provider) return ensureValidDefaultModelId(merged);
  }

  for (const provider of providers) {
    if (provider.models.some((model) => model.id === legacy)) {
      return `${provider.id}:${legacy}`;
    }
  }

  return ensureValidDefaultModelId(merged);
}

// Re-export for callers that relied on key normalization helpers.
export { normalizeProviderApiKey };
