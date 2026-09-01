import {
	normalizeOpenAiCompatibleBaseUrl,
	normalizeProviderApiKey,
} from "../../lib/ai/openai-compatible-url";
import { DEFAULT_OPENAI_COMPATIBLE_BASE_URL } from "../../lib/ai/openai-compatible-url";
import {
	getSettingsWithSecrets,
	saveSettings,
} from "../../lib/browser/storage";
import { reloadTabsMatchingDomains } from "../../lib/browser/tabs";
import {
	setSiderDebugModeEnabled,
	siderLogError,
	siderLogInfo,
} from "../../lib/browser/sider-log";
import type {
	AppSettings,
	ModelConfig,
	ProviderInstance,
	ProviderType,
} from "../../lib/shared/types";
import {
	normalizeBlockedDomains,
	validateSearchEngines,
	createSearchEngineDraft,
} from "./search-provider-editor";
import { settingsState } from "./settings-state.svelte";
import { buildModelConfigs, normalizeModelLabels } from "./model-config";
import { getI18n, setLocale } from "../../lib/i18n";
import {
	ensureValidDefaultModelId,
	getModelRef,
} from "../../lib/shared/model-registry";
import {
	createModelDraft,
	upsertModel,
	validateModelDraft,
	type ModelDraft,
} from "./model-editor";

export type SettingsSection = string;

function getProvider(providerId: string): ProviderInstance | undefined {
	return settingsState.settings.providers.find(
		(provider) => provider.id === providerId,
	);
}

function setProviderModels(providerId: string, models: ModelConfig[]): void {
	settingsState.settings.providers = settingsState.settings.providers.map(
		(provider) =>
			provider.id === providerId ? { ...provider, models } : provider,
	);
}

function persistProviderPatch(
	providerId: string,
	modelToSync?: { modelId: string },
): void {
	if (
		settingsState.form.editingModelId === modelToSync?.modelId &&
		settingsState.form.editingModelProvider === providerId
	) {
		syncDraftFromModel(providerId, modelToSync.modelId);
	}
	settingsState.settings.defaultModelId = ensureValidDefaultModelId(
		settingsState.settings,
	);
	void persistSettings(providerId);
}

function resetModelDraft(providerId: string = "openrouter"): void {
	settingsState.form.modelDraft = createModelDraft(providerId);
	settingsState.form.modelDraftLabelMirrorsId = true;
	settingsState.form.editingModelId = null;
	settingsState.form.editingModelProvider = null;
	settingsState.form.modelDraftError = "";
}

function syncDraftFromModel(providerId: string, modelId: string): void {
	if (
		settingsState.form.editingModelId !== modelId ||
		settingsState.form.editingModelProvider !== providerId
	)
		return;
	const model = getProvider(providerId)?.models.find(
		(entry) => entry.id === modelId,
	);
	if (!model) return;
	settingsState.form.modelDraft = createModelDraft(providerId, model);
}

export async function loadSettings(): Promise<void> {
	settingsState.isLoading = true;
	try {
		siderLogInfo("options", "loadSettings start");
		const { settings, secrets } = await getSettingsWithSecrets();
		settingsState.settings = normalizeModelLabels(settings);
		settingsState.secrets = secrets;
		setSiderDebugModeEnabled(settingsState.settings.debugMode);
		setLocale(settingsState.settings.locale);
		resetModelDraft();
		siderLogInfo("options", "loadSettings complete", {
			defaultModelId: settingsState.settings.defaultModelId,
			providerCount: settingsState.settings.providers.length,
		});
	} catch (error) {
		siderLogError("options", "loadSettings failed", { error: String(error) });
	} finally {
		settingsState.isLoading = false;
	}
}

export function updateSetting<K extends keyof AppSettings>(
	key: K,
	value: AppSettings[K],
): void {
	settingsState.settings = { ...settingsState.settings, [key]: value };
	if (key === "debugMode") {
		setSiderDebugModeEnabled(Boolean(value));
	}
	if (key === "locale") {
		setLocale(value as AppSettings["locale"]);
		autoPersist("language");
	} else if (key === "systemPrompt") {
		autoPersist("system-prompt", 800);
	} else {
		autoPersist("behavior");
	}
}

export function updateTakeInputIgnoredFields(text: string): void {
	updateSetting(
		"takeInputIgnoredFields",
		text
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean),
	);
}

export function updatePromptTemplate(
	key: keyof AppSettings["promptTemplates"],
	value: string,
): void {
	settingsState.settings.promptTemplates = {
		...settingsState.settings.promptTemplates,
		[key]: value,
	};
	autoPersist("prompt-templates", 800);
}

export function addBlockedDomain(): void {
	settingsState.settings.siteAccessPolicy = {
		domains: [...settingsState.settings.siteAccessPolicy.domains, ""],
	};
}

export function updateBlockedDomain(index: number, value: string): void {
	const domains = [...settingsState.settings.siteAccessPolicy.domains];
	domains[index] = value;
	settingsState.settings.siteAccessPolicy = { domains };
	autoPersist("site-blocklist", 800);
}

export function removeBlockedDomain(index: number): void {
	settingsState.settings.siteAccessPolicy = {
		domains: settingsState.settings.siteAccessPolicy.domains.filter(
			(_, currentIndex) => currentIndex !== index,
		),
	};
	autoPersist("site-blocklist");
}

export function addSearchProvider(): void {
	settingsState.settings.searchEngines = [
		...settingsState.settings.searchEngines,
		createSearchEngineDraft(),
	];
}

const PROVIDER_LABELS: Record<ProviderType, string> = {
	openrouter: "OpenRouter",
	"openai-compatible": "OpenAI-compatible",
	"google-gemini": "Google Gemini",
};

const PROVIDER_BASE_URLS: Record<ProviderType, string> = {
	openrouter: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
	"openai-compatible": "",
	"google-gemini": "",
};

/** Adds a new provider instance and returns its id. */
export function addProvider(type: ProviderType): string {
	return createProvider(type, PROVIDER_LABELS[type], PROVIDER_BASE_URLS[type]);
}

/** Adds a new provider instance with explicit label/base URL and returns its id. */
export function createProvider(
	type: ProviderType,
	label: string,
	baseUrl: string,
): string {
	const isBuiltin =
		(type === "openrouter" && !getProvider("openrouter")) ||
		(type === "google-gemini" && !getProvider("google-gemini"));
	const id = isBuiltin
		? type
		: `${type}-${Math.random().toString(36).slice(2, 9)}`;
	const instance: ProviderInstance = {
		id,
		type,
		label: label.trim() || PROVIDER_LABELS[type],
		baseUrl,
		models: [],
		enabled: true,
	};
	settingsState.settings.providers = [
		...settingsState.settings.providers,
		instance,
	];
	settingsState.secrets[id] = "";
	settingsState.settings.defaultModelId = ensureValidDefaultModelId(
		settingsState.settings,
	);
	void persistSettings(id);
	return id;
}

/** Removes a provider instance and its associated API key. */
export function removeProvider(providerId: string): void {
	settingsState.settings.providers = settingsState.settings.providers.filter(
		(provider) => provider.id !== providerId,
	);
	delete settingsState.secrets[providerId];
	settingsState.settings.defaultModelId = ensureValidDefaultModelId(
		settingsState.settings,
	);
	if (settingsState.form.editingModelProvider === providerId)
		resetModelDraft(providerId);
	void persistSettings();
}

export function updateProviderLabel(providerId: string, label: string): void {
	settingsState.settings.providers = settingsState.settings.providers.map(
		(provider) =>
			provider.id === providerId ? { ...provider, label } : provider,
	);
	autoPersist(providerId, 800);
}

export function updateProviderBaseUrl(
	providerId: string,
	baseUrl: string,
): void {
	settingsState.settings.providers = settingsState.settings.providers.map(
		(provider) =>
			provider.id === providerId ? { ...provider, baseUrl } : provider,
	);
	autoPersist(providerId, 800);
}

export function updateProviderEnabled(
	providerId: string,
	enabled: boolean,
): void {
	settingsState.settings.providers = settingsState.settings.providers.map(
		(provider) =>
			provider.id === providerId ? { ...provider, enabled } : provider,
	);
	settingsState.settings.defaultModelId = ensureValidDefaultModelId(
		settingsState.settings,
	);
	void persistSettings(providerId);
}

export function setProviderApiKey(providerId: string, apiKey: string): void {
	settingsState.secrets[providerId] = normalizeProviderApiKey(apiKey);
	autoPersist(providerId, 800);
}

export function startEditModel(providerId: string, modelId: string): void {
	const model = getProvider(providerId)?.models.find(
		(entry) => entry.id === modelId,
	);
	if (!model) return;
	settingsState.form.modelDraft = createModelDraft(providerId, model);
	settingsState.form.modelDraftLabelMirrorsId = false;
	settingsState.form.editingModelId = modelId;
	settingsState.form.editingModelProvider = providerId;
	settingsState.form.modelDraftError = "";
}

export function cancelModelEdit(providerId: string): void {
	resetModelDraft(providerId);
}

export function updateModelDraft<K extends keyof ModelDraft>(
	providerId: string,
	key: K,
	value: ModelDraft[K],
): void {
	const labelMirrorsId = settingsState.form.modelDraftLabelMirrorsId;
	const nextDraft: ModelDraft = {
		...settingsState.form.modelDraft,
		providerId,
		[key]: value,
	};

	if (key === "id" && labelMirrorsId) {
		nextDraft.label = value as string;
	}

	settingsState.form.modelDraft = nextDraft;

	if (key === "label") {
		settingsState.form.modelDraftLabelMirrorsId = false;
	}

	if (settingsState.form.modelDraftError)
		settingsState.form.modelDraftError = "";
}

export function saveModelDraft(providerId: string): boolean {
	const draft = { ...settingsState.form.modelDraft, providerId };
	const error = validateModelDraft(draft, settingsState.settings.locale);
	if (error) {
		settingsState.form.modelDraftError = error;
		return false;
	}

	const provider = getProvider(providerId);
	if (!provider) return false;

	const nextModels = upsertModel(
		provider.models,
		draft,
		settingsState.form.editingModelId,
		providerId,
	);
	setProviderModels(providerId, nextModels);
	settingsState.settings.defaultModelId = ensureValidDefaultModelId(
		settingsState.settings,
	);
	resetModelDraft(providerId);
	void persistSettings(providerId);
	return true;
}

export function toggleModelSupportsImages(
	providerId: string,
	modelId: string,
): void {
	const provider = getProvider(providerId);
	if (!provider) return;
	setProviderModels(
		providerId,
		provider.models.map((model) =>
			model.id === modelId
				? { ...model, supportsImages: !model.supportsImages }
				: model,
		),
	);
	persistProviderPatch(providerId, { modelId });
}

export function toggleModelWebSearch(
	providerId: string,
	modelId: string,
): void {
	const provider = getProvider(providerId);
	if (!provider) return;
	setProviderModels(
		providerId,
		provider.models.map((model) =>
			model.id === modelId
				? { ...model, webSearchEnabled: !model.webSearchEnabled }
				: model,
		),
	);
	persistProviderPatch(providerId, { modelId });
}

export function setDefaultModel(providerId: string, modelId: string): void {
	const provider = getProvider(providerId);
	if (!provider?.models.some((model) => model.id === modelId)) return;
	settingsState.settings.defaultModelId = getModelRef(providerId, modelId);
	void persistSettings(providerId);
}

export function removeModel(providerId: string, modelId: string): void {
	const provider = getProvider(providerId);
	if (!provider) return;
	setProviderModels(
		providerId,
		provider.models.filter((model) => model.id !== modelId),
	);
	settingsState.settings.defaultModelId = ensureValidDefaultModelId(
		settingsState.settings,
	);
	if (
		settingsState.form.editingModelId === modelId &&
		settingsState.form.editingModelProvider === providerId
	) {
		resetModelDraft(providerId);
	}
	void persistSettings(providerId);
}

export function updateSearchProvider(
	index: number,
	key: "label" | "template" | "enabled",
	value: string | boolean,
): void {
	settingsState.settings.searchEngines =
		settingsState.settings.searchEngines.map((engine, currentIndex) =>
			currentIndex === index ? { ...engine, [key]: value } : engine,
		);
	autoPersist("search-providers", 800);
}

export function removeSearchProvider(index: number): void {
	settingsState.settings.searchEngines =
		settingsState.settings.searchEngines.filter(
			(_, currentIndex) => currentIndex !== index,
		);
	autoPersist("search-providers");
}

export function addCustomMode(): void {
	const id = "mode-" + Math.random().toString(36).substring(2, 9);
	settingsState.settings.modes = [
		...settingsState.settings.modes,
		{ id, label: "", systemPrompt: "", isCustom: true },
	];
}

export function updateCustomMode(
	index: number,
	key: "label" | "systemPrompt",
	value: string,
): void {
	settingsState.settings.modes = settingsState.settings.modes.map(
		(mode, currentIndex) =>
			currentIndex === index ? { ...mode, [key]: value } : mode,
	);
	autoPersist("modes", 800);
}

/** Sets the active agent mode used in chat (only one mode is active at a time). */
export function setActiveMode(modeId: string): void {
	if (!settingsState.settings.modes.some((mode) => mode.id === modeId)) return;
	settingsState.settings.activeModeId = modeId;
	autoPersist("modes");
}

export function removeCustomMode(index: number): void {
	const mode = settingsState.settings.modes[index];
	const remainingModes = settingsState.settings.modes.filter(
		(_, currentIndex) => currentIndex !== index,
	);
	settingsState.settings.modes = remainingModes;
	if (mode && mode.id === settingsState.settings.activeModeId) {
		settingsState.settings.activeModeId =
			remainingModes.find((remaining) => remaining.id === "default")?.id ??
			remainingModes[0]?.id ??
			"";
	}
	autoPersist("modes");
}

export function addMcpServer(): void {
	const id = "mcp-" + Math.random().toString(36).substring(2, 9);
	settingsState.settings.mcpServers = [
		...settingsState.settings.mcpServers,
		{ id, name: "", url: "", transport: "sse", enabled: true },
	];
}

export function updateMcpServer(
	index: number,
	key: "name" | "url" | "transport" | "enabled",
	value: unknown,
): void {
	settingsState.settings.mcpServers = settingsState.settings.mcpServers.map(
		(server, currentIndex) =>
			currentIndex === index ? { ...server, [key]: value } : server,
	);
	autoPersist("mcp", 800);
}

export function removeMcpServer(index: number): void {
	settingsState.settings.mcpServers = settingsState.settings.mcpServers.filter(
		(_, currentIndex) => currentIndex !== index,
	);
	autoPersist("mcp");
}

export function updateMcpBridgeEnabled(enabled: boolean): void {
	settingsState.settings.mcpBridgeEnabled = enabled;
	autoPersist("mcp");
}

export function updateMcpBridgeUrl(url: string): void {
	settingsState.settings.mcpBridgeUrl = url;
	autoPersist("mcp", 800);
}

let saveMessageTimeout: ReturnType<typeof setTimeout> | null = null;
const sectionTimeouts: Record<string, ReturnType<typeof setTimeout>> = {};

function queueSaveFeedbackReset(section?: SettingsSection): void {
	if (section) {
		if (sectionTimeouts[section]) clearTimeout(sectionTimeouts[section]);
		sectionTimeouts[section] = setTimeout(() => {
			settingsState.sectionStatus[section] = "idle";
		}, 2800);
	} else {
		if (saveMessageTimeout) clearTimeout(saveMessageTimeout);
		saveMessageTimeout = setTimeout(() => {
			settingsState.saveMessage = "";
			settingsState.saveStatus = "idle";
		}, 2800);
	}
}

export async function persistSettings(
	section?: SettingsSection,
): Promise<void> {
	const copy = getI18n(settingsState.settings.locale);
	settingsState.isSaving = true;

	if (section) {
		settingsState.sectionStatus[section] = "saving";
	} else {
		settingsState.saveMessage = copy.common.saving;
		settingsState.saveStatus = "saving";
	}

	const payload = buildPersistPayload();
	payload.defaultModelId = ensureValidDefaultModelId(payload);

	try {
		const affectedDomains = payload.siteAccessPolicy.domains;
		await saveSettings(payload, settingsState.secrets);
		await reloadTabsMatchingDomains(affectedDomains);
		settingsState.settings = normalizeModelLabels(payload);
		setLocale(payload.locale);

		if (section) {
			settingsState.sectionStatus[section] = "success";
		} else {
			settingsState.saveMessage = copy.options.saveFeedback.success;
			settingsState.saveStatus = "success";
		}
		queueSaveFeedbackReset(section);
	} catch (error) {
		const detail = error instanceof Error ? error.message : copy.common.loading;
		if (section) {
			settingsState.sectionStatus[section] = "error";
		} else {
			settingsState.saveMessage = `${copy.options.saveFeedback.failure} ${detail}`;
			settingsState.saveStatus = "error";
		}
		queueSaveFeedbackReset(section);
	} finally {
		settingsState.isSaving = false;
	}
}

function buildPersistPayload(): AppSettings {
	return normalizeModelLabels({
		...settingsState.settings,
		siteAccessPolicy: {
			domains: normalizeBlockedDomains(
				settingsState.settings.siteAccessPolicy.domains,
			),
		},
		searchEngines: validateSearchEngines(settingsState.settings.searchEngines),
		providers: settingsState.settings.providers.map((provider) => ({
			...provider,
			models: buildModelConfigs(
				provider.models.map((model) => model.id),
				provider.models,
				provider.id,
			),
			...(provider.type === "openrouter" ||
			provider.type === "openai-compatible"
				? {
						baseUrl:
							normalizeOpenAiCompatibleBaseUrl(provider.baseUrl) ||
							provider.baseUrl,
					}
				: {}),
		})),
	});
}

const debouncedPersist: Record<string, ReturnType<typeof setTimeout>> = {};

export function autoPersist(section: SettingsSection, debounceMs = 0): void {
	if (debounceMs > 0) {
		if (debouncedPersist[section]) clearTimeout(debouncedPersist[section]);
		debouncedPersist[section] = setTimeout(() => {
			void persistSettings(section);
		}, debounceMs);
	} else {
		void persistSettings(section);
	}
}
