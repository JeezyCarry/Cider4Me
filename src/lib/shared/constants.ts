import {
	CORTECS_OPENAI_COMPATIBLE_BASE_URL,
	DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
} from "../ai/openai-compatible-url";
import { toPublicSettings } from "./settings-secrets";
import type {
	AppLocale,
	AppSettings,
	ModelConfig,
	ProviderInstance,
	SearchEngine,
} from "./types";

export const EXTENSION_ROOT_ID = "sider-for-me-root";
export const DEFAULT_SIDEBAR_WIDTH = 420;
export const MIN_SIDEBAR_WIDTH = 150;
export const MAX_SIDEBAR_WIDTH = 900;

export function clampSidebarWidth(width: number): number {
	return Math.min(MAX_SIDEBAR_WIDTH, Math.max(DEFAULT_SIDEBAR_WIDTH, width));
}
export const DEFAULT_OPENROUTER_MODEL_ID = "qwen/qwen3.5-9b";
export const DEFAULT_GEMINI_MODEL_ID = "gemini-3.1-flash-lite-preview";
export const DEFAULT_CORTECS_MODEL_ID = "deepseek-chat";

/** Default provider instance ids referenced by default models. */
export const DEFAULT_OPENROUTER_INSTANCE_ID = "openrouter";
export const DEFAULT_GEMINI_INSTANCE_ID = "google-gemini";
export const DEFAULT_CORTECS_INSTANCE_ID = "cortecs";

export const STORAGE_VERSION = 5;
export const DEFAULT_LOCALE: AppLocale = "en";
export const DEBUG_LOG_RETENTION_DAYS = 5;
export const MAX_IMPLICIT_CONTEXT_CHARS = 24000;
export const MAX_EXPLICIT_SNIPPETS = 5;

export const DEFAULT_SEARCH_ENGINES: SearchEngine[] = [
	{
		id: "google",
		label: "Google",
		enabled: true,
		template: "https://www.google.com/search?q={query}",
	},
	{
		id: "duckduckgo",
		label: "DuckDuckGo",
		enabled: true,
		template: "https://duckduckgo.com/?q={query}",
	},
];

export const DEFAULT_OPENROUTER_MODEL: ModelConfig = {
	id: DEFAULT_OPENROUTER_MODEL_ID,
	label: "Qwen 3.5 9B",
	providerId: DEFAULT_OPENROUTER_INSTANCE_ID,
	enabled: true,
	supportsImages: true,
	webSearchEnabled: false,
	contextWindow: 250000,
};

export const DEFAULT_GEMINI_MODEL: ModelConfig = {
	id: DEFAULT_GEMINI_MODEL_ID,
	label: "Gemini 3.1 Flash Lite",
	providerId: DEFAULT_GEMINI_INSTANCE_ID,
	enabled: true,
	supportsImages: true,
	webSearchEnabled: true,
	contextWindow: 250000,
};

export const DEFAULT_CORTECS_MODEL: ModelConfig = {
	id: DEFAULT_CORTECS_MODEL_ID,
	label: "DeepSeek Chat",
	providerId: DEFAULT_CORTECS_INSTANCE_ID,
	enabled: true,
	supportsImages: false,
	webSearchEnabled: false,
	contextWindow: 128000,
};

export const DEFAULT_PROVIDER_INSTANCES: ProviderInstance[] = [
	{
		id: DEFAULT_CORTECS_INSTANCE_ID,
		type: "openai-compatible",
		label: "Cortecs",
		baseUrl: CORTECS_OPENAI_COMPATIBLE_BASE_URL,
		models: [DEFAULT_CORTECS_MODEL],
		enabled: true,
	},
	{
		id: DEFAULT_GEMINI_INSTANCE_ID,
		type: "google-gemini",
		label: "Google Gemini",
		baseUrl: "",
		models: [DEFAULT_GEMINI_MODEL],
		enabled: true,
	},
	{
		id: DEFAULT_OPENROUTER_INSTANCE_ID,
		type: "openrouter",
		label: "OpenRouter",
		baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
		models: [DEFAULT_OPENROUTER_MODEL],
		enabled: true,
	},
];

export const DEFAULT_SETTINGS: AppSettings = {
	defaultModelId: `${DEFAULT_OPENROUTER_INSTANCE_ID}:${DEFAULT_OPENROUTER_MODEL_ID}`,
	providers: DEFAULT_PROVIDER_INSTANCES,
	searchEngines: DEFAULT_SEARCH_ENGINES,
	siteAccessPolicy: { domains: [] },
	textWrappingEnabled: true,
	promptTemplates: {
		explainSelection:
			"Explain the following selection clearly and concisely:\n\n{{selection}}",
		translateSelection:
			"Translate the following selection to English and preserve the intent:\n\n{{selection}}",
		askSelection:
			"Use the following selection as context for my request:\n\n{{selection}}",
	},
	systemPrompt: "You are a helpful assistant.",
	debugMode: false,
	autoReadPage: true,
	autoSendQuickActions: true,
	selectionPopupTakesFocus: false,
	sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
	composerSubmitMode: "enter",
	popupChatTarget: "current-chat",
	locale: DEFAULT_LOCALE,
	theme: "system",
	modes: [
		{ id: "default", label: "Default", systemPrompt: "", isCustom: true },
		{
			id: "mentor",
			label: "Mentor",
			systemPrompt:
				"You are an educational programming mentor. Guide the user step-by-step, explaining concepts, rather than just writing the code for them.",
			isCustom: true,
		},
	],
	activeModeId: "default",
	mcpServers: [],
	mcpBridgeEnabled: false,
	mcpBridgeUrl: "ws://localhost:3000",
	takeInputEnabled: false,
	takeInputIgnoredFields: ["search", "query", "q"],
};

export const DEFAULT_SETTINGS_SECRETS = {};

export const DEFAULT_PUBLIC_SETTINGS = toPublicSettings(DEFAULT_SETTINGS);
