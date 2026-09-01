import { describe, expect, test } from "bun:test";
import {
	CORTECS_OPENAI_COMPATIBLE_BASE_URL,
	DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
} from "../src/lib/ai/openai-compatible-url";
import {
	migrateStorage,
	normalizeAgentModes,
	pruneDebugLogs,
} from "../src/lib/shared/storage-schema";

describe("storage schema", () => {
	test("migrates missing values to provider-based defaults", () => {
		const migrated = migrateStorage(undefined);
		expect(migrated.settings.defaultModelId).toBeTruthy();
		expect(migrated.settings.defaultModelId).toContain(":");
		expect(migrated.settings.siteAccessPolicy.domains).toEqual([]);
		expect(migrated.settings.locale).toBe("en");
		expect(migrated.settings.providers).toHaveLength(3);
		const cortecsProvider = migrated.settings.providers[0];
		expect(cortecsProvider?.id).toBe("cortecs");
		expect(cortecsProvider?.type).toBe("openai-compatible");
		expect(cortecsProvider?.baseUrl).toBe("https://api.cortecs.ai/v1");
		const openRouterProvider = migrated.settings.providers.find(
			(p) => p.type === "openrouter",
		);
		expect(openRouterProvider).toBeDefined();
		expect(openRouterProvider?.baseUrl).toBe(DEFAULT_OPENAI_COMPATIBLE_BASE_URL);
		expect(openRouterProvider?.models[0]?.supportsImages).toBe(true);
		expect(openRouterProvider?.models[0]?.webSearchEnabled).toBe(false);
		expect(openRouterProvider?.models[0]?.providerId).toBe("openrouter");
		expect(migrated.settings.providers[1]?.models).toHaveLength(1);
		expect(migrated.settings.selectionPopupTakesFocus).toBe(false);
		expect(migrated.conversations).toEqual([]);
	});

	test("fills new take-input settings with defaults when legacy settings lack them", () => {
		const migrated = migrateStorage({
			settings: {
				textWrappingEnabled: false,
			} as never,
		});
		expect(migrated.settings.takeInputEnabled).toBe(false);
		expect(migrated.settings.takeInputIgnoredFields).toEqual([
			"search",
			"query",
			"q",
		]);
	});

	test("seeds default providers in Cortecs → Gemini → OpenRouter order", () => {
		const migrated = migrateStorage(undefined);
		const ids = migrated.settings.providers.map((p) => p.id);
		expect(ids).toEqual(["cortecs", "google-gemini", "openrouter"]);
		expect(migrated.settings.providers.every((p) => p.enabled)).toBe(true);
	});

	test("merges legacy hidden launcher domains into the site blocklist", () => {
		const migrated = migrateStorage({
			settings: {
				...({
					apiKey: "",
					defaultModelId: "x-ai/grok-4-fast",
					models: [],
					searchEngines: [],
					siteAccessPolicy: { domains: ["www.example.com"] },
					textWrappingEnabled: true,
					promptTemplates: {
						explainSelection: "",
						translateSelection: "",
						askSelection: "",
					},
					systemPrompt: "",
					debugMode: false,
					autoReadPage: true,
					autoSendQuickActions: true,
					selectionPopupTakesFocus: false,
					sidebarWidth: 420,
					composerSubmitMode: "shift-enter",
					popupChatTarget: "current-chat",
					locale: "en",
				} as const),
				hiddenLauncherDomains: ["blog.example.com", "example.org"],
			} as never,
		});

		expect(migrated.settings.siteAccessPolicy.domains).toEqual([
			"blog.example.com",
			"example.com",
			"example.org",
		]);
		expect("hiddenLauncherDomains" in migrated.settings).toBe(false);
	});

	test("converts legacy fixed slots into provider instances preserving models and keys", () => {
		const migrated = migrateStorage({
			settings: {
				apiKey: "",
				defaultModelId: "openai/gpt-4.1-mini",
				models: [
					{
						id: "openai/gpt-4.1-mini",
						label: "GPT-4.1 Mini",
						provider: "openrouter",
						enabled: true,
					},
				],
				searchEngines: [],
				siteAccessPolicy: { domains: [] },
				textWrappingEnabled: true,
				promptTemplates: {
					explainSelection: "",
					translateSelection: "",
					askSelection: "",
				},
				systemPrompt: "",
				debugMode: false,
				autoReadPage: true,
				autoSendQuickActions: true,
				selectionPopupTakesFocus: false,
				sidebarWidth: 420,
				composerSubmitMode: "shift-enter",
				popupChatTarget: "current-chat",
				locale: "en",
			} as never,
		});

		const openRouterProvider = migrated.settings.providers.find(
			(p) => p.type === "openrouter",
		);
		expect(openRouterProvider?.models[0]?.supportsImages).toBe(false);
		expect(openRouterProvider?.models[0]?.webSearchEnabled).toBe(false);
		expect(openRouterProvider?.models[0]?.providerId).toBe("openrouter");
		expect("apiKey" in migrated.settings).toBe(false);
		expect(migrated.secrets.openrouter).toBe("");
	});

	test("prefixes a legacy bare default model id with its provider instance id", () => {
		const migrated = migrateStorage({
			settings: {
				defaultModelId: "gemini-2.5-flash",
				openRouter: { baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL, models: [] },
				googleGemini: {
					models: [
						{
							id: "gemini-2.5-flash",
							label: "Gemini",
							provider: "google-gemini",
							enabled: true,
						},
					],
				},
			} as never,
		});

		expect(migrated.settings.defaultModelId).toBe(
			"google-gemini:gemini-2.5-flash",
		);
	});

	test("prefers dedicated secrets storage and migrates its legacy shape", () => {
		const migrated = migrateStorage({
			settings: {
				defaultModelId: "openrouter:qwen/qwen3.5-9b",
				providers: [
					{
						id: "openrouter",
						type: "openrouter",
						label: "OpenRouter",
						baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
						models: [],
						enabled: true,
					},
					{
						id: "google-gemini",
						type: "google-gemini",
						label: "Google Gemini",
						baseUrl: "",
						models: [],
						enabled: true,
					},
				],
			} as never,
			secrets: {
				openRouter: { apiKey: "from-secrets-store" },
				googleGemini: { apiKey: "gem-secret" },
			} as never,
		});

		expect(migrated.secrets.openrouter).toBe("from-secrets-store");
		expect(migrated.secrets["google-gemini"]).toBe("gem-secret");
	});

	test("preserves already-migrated providers and their composite default", () => {
		const migrated = migrateStorage({
			settings: {
				defaultModelId: "google-gemini:gemini-2.5-flash",
				providers: [
					{
						id: "openrouter",
						type: "openrouter",
						label: "OpenRouter",
						baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
						models: [],
						enabled: true,
					},
					{
						id: "google-gemini",
						type: "google-gemini",
						label: "Google Gemini",
						baseUrl: "",
						models: [
							{
								id: "gemini-2.5-flash",
								label: "Gemini 2.5 Flash",
								providerId: "google-gemini",
								enabled: true,
								supportsImages: true,
								webSearchEnabled: true,
							},
						],
						enabled: true,
					},
				],
				searchEngines: [],
				siteAccessPolicy: { domains: [] },
				textWrappingEnabled: true,
				promptTemplates: {
					explainSelection: "",
					translateSelection: "",
					askSelection: "",
				},
				systemPrompt: "",
				debugMode: false,
				autoReadPage: true,
				autoSendQuickActions: true,
				selectionPopupTakesFocus: false,
				sidebarWidth: 420,
				composerSubmitMode: "shift-enter",
				popupChatTarget: "current-chat",
				locale: "en",
			} as never,
			secrets: { openrouter: "sk-openrouter", "google-gemini": "sk-gemini" },
		});

		expect("apiKey" in migrated.settings).toBe(false);
		expect(migrated.secrets.openrouter).toBe("sk-openrouter");
		expect(migrated.secrets["google-gemini"]).toBe("sk-gemini");
		expect(migrated.settings.providers[1]?.models[0]?.providerId).toBe(
			"google-gemini",
		);
		expect(migrated.settings.defaultModelId).toBe(
			"google-gemini:gemini-2.5-flash",
		);
	});

	test("demotes openrouter-labeled providers with a non-OpenRouter base URL", () => {
		const migrated = migrateStorage({
			settings: {
				defaultModelId: "openrouter:mistral-small-2503",
				providers: [
					{
						id: "cortecs",
						type: "openrouter",
						label: "Cortecs",
						baseUrl: CORTECS_OPENAI_COMPATIBLE_BASE_URL,
						models: [],
						enabled: true,
					},
					{
						id: "openrouter",
						type: "openrouter",
						label: "OpenRouter",
						baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
						models: [],
						enabled: true,
					},
				],
			} as never,
		});

		expect(migrated.settings.providers[0]?.type).toBe("openai-compatible");
		expect(migrated.settings.providers[1]?.type).toBe("openrouter");
	});

	test("prepends default mode when missing and keeps a valid activeModeId", () => {
		const normalized = normalizeAgentModes(
			[
				{
					id: "mentor",
					label: "Mentor",
					systemPrompt: "Teach gently.",
					isCustom: true,
				},
			],
			"mentor",
		);

		expect(normalized.modes.map((mode) => mode.id)).toEqual([
			"default",
			"mentor",
		]);
		expect(normalized.activeModeId).toBe("mentor");
	});

	test("prunes debug logs older than retention window", () => {
		const logs = [
			{
				id: "1",
				timestamp: "2026-03-01T00:00:00.000Z",
				level: "info" as const,
				source: "t",
				message: "old",
			},
			{
				id: "2",
				timestamp: "2026-03-12T00:00:00.000Z",
				level: "info" as const,
				source: "t",
				message: "new",
			},
		];
		const pruned = pruneDebugLogs(logs, new Date("2026-03-12T12:00:00.000Z"));
		expect(pruned.map((log) => log.id)).toEqual(["2"]);
	});
});
