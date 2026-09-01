import { describe, expect, mock, test } from "bun:test";
import { DEFAULT_OPENAI_COMPATIBLE_BASE_URL } from "../src/lib/ai/openai-compatible-url";
import type { AppSettings } from "../src/lib/shared/types";

const providerSettings = (defaultModelId: string): AppSettings => ({
	defaultModelId,
	providers: [
		{
			id: "openrouter",
			type: "openrouter" as const,
			label: "OpenRouter",
			baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
			enabled: true,
			models: [
				{
					id: "qwen/qwen3.5-9b",
					label: "Qwen",
					providerId: "openrouter",
					enabled: true,
					supportsImages: true,
					webSearchEnabled: false,
				},
			],
		},
		{
			id: "google-gemini",
			type: "google-gemini" as const,
			label: "Google Gemini",
			baseUrl: "",
			enabled: true,
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
	theme: "system",
	modes: [],
	activeModeId: "",
	mcpServers: [],
	mcpBridgeEnabled: false,
	mcpBridgeUrl: "",
	takeInputEnabled: false,
	takeInputIgnoredFields: [],
});

describe("chat service routing", () => {
	test("routes a Gemini reference to the Gemini provider with its stored key", async () => {
		const streamChat = mock(async (input: any, handlers: any) => {
			expect(input.provider.type).toBe("google-gemini");
			expect(input.model.id).toBe("gemini-2.5-flash");
			expect(input.apiKey).toBe("sk-gemini");
			expect(input.signal).toBeInstanceOf(AbortSignal);
			handlers.onComplete({ content: "gemini response" });
		});

		mock.module("../src/lib/browser/storage", () => ({
			getSettingsWithSecrets: async () => ({
				settings: providerSettings("google-gemini:gemini-2.5-flash"),
				secrets: { openrouter: "", "google-gemini": "sk-gemini" },
			}),
		}));

		mock.module("../src/lib/ai/provisioning", () => ({
			streamChat,
			buildGoogleGeminiRequestPayload: () => ({}),
		}));

		const { handleChatRequest } = await import(
			"../src/background/services/chat-service"
		);

		const onChunk = mock(() => undefined);
		const onSuccess = mock(() => undefined);
		const onError = mock(() => undefined);

		await handleChatRequest(
			{
				type: "chat.request",
				requestId: "req-1",
				payload: {
					model: "google-gemini:gemini-2.5-flash",
					messages: [{ role: "user", content: "Hello Gemini" }],
				},
			},
			new AbortController().signal,
			{ onChunk, onSuccess, onError },
		);

		expect(streamChat).toHaveBeenCalledTimes(1);
		expect(onSuccess).toHaveBeenCalledWith("gemini response", undefined);
		expect(onError).not.toHaveBeenCalled();
	});

	test("resolves a duplicate model id to the correct provider instance", async () => {
		const settings = providerSettings("b:grok");
		settings.providers = [
			{
				id: "a",
				type: "openrouter" as const,
				label: "A",
				baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
				enabled: true,
				models: [
					{
						id: "grok",
						label: "Grok A",
						providerId: "a",
						enabled: true,
						supportsImages: true,
						webSearchEnabled: false,
					},
				],
			},
			{
				id: "b",
				type: "openai-compatible" as const,
				label: "B",
				baseUrl: "https://example.com/v1",
				enabled: true,
				models: [
					{
						id: "grok",
						label: "Grok B",
						providerId: "b",
						enabled: true,
						supportsImages: true,
						webSearchEnabled: false,
					},
				],
			},
		];
		settings.defaultModelId = "b:grok";

		const captured: any[] = [];
		const streamChat = mock(async (input: any, handlers: any) => {
			captured.push({ providerId: input.provider.id, modelId: input.model.id });
			handlers.onComplete({ content: "from B" });
		});

		mock.module("../src/lib/browser/storage", () => ({
			getSettingsWithSecrets: async () => ({
				settings,
				secrets: { a: "", b: "key-b" },
			}),
		}));

		mock.module("../src/lib/ai/provisioning", () => ({
			streamChat,
			buildGoogleGeminiRequestPayload: () => ({}),
		}));

		const { handleChatRequest } = await import(
			"../src/background/services/chat-service"
		);
		const onSuccess = mock(() => undefined);

		await handleChatRequest(
			{
				type: "chat.request",
				requestId: "req-2",
				payload: {
					model: "b:grok",
					messages: [{ role: "user", content: "Hi" }],
				},
			},
			new AbortController().signal,
			{
				onChunk: mock(() => undefined),
				onSuccess,
				onError: mock(() => undefined),
			},
		);

		expect(captured).toEqual([{ providerId: "b", modelId: "grok" }]);
		expect(onSuccess).toHaveBeenCalledWith("from B", undefined);
	});
});
