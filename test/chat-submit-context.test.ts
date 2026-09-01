import { beforeEach, describe, expect, it, mock } from "bun:test";
import type { StreamCallbacks } from "../src/lib/ai/chat-client";

// ---------------------------------------------------------------------------
// Mocks — must be registered before importing the module under test.
// ---------------------------------------------------------------------------

type StreamBehavior = (callbacks: StreamCallbacks) => void;

// Default: the stream stays open (no callbacks fired), so tests can assert
// state after submitChat() but before the stream completes.
let streamBehavior: StreamBehavior = () => {};
// Captures the exact request messages handed to the stream, so tests can prove
// the request was built from the context snapshot (not the cleared live state).
let lastStreamMessages: unknown = null;

mock.module("webextension-polyfill", () => ({
	default: {
		runtime: {
			onConnect: { addListener: () => {} },
			onMessage: { addListener: () => {} },
		},
		storage: undefined,
		tabs: {},
	},
}));

mock.module("../src/lib/browser/storage", () => ({
	getConversations: async () => [],
	saveConversations: async () => {},
}));

mock.module("../src/lib/ai/chat-client", () => ({
	startChatStream: (
		_requestId: string,
		_model: string,
		messages: unknown,
		callbacks: StreamCallbacks,
	) => {
		lastStreamMessages = messages;
		streamBehavior(callbacks);
		return () => {};
	},
}));

// Deterministic page context snapshot without needing DOMParser/Readability.
mock.module("../src/lib/context/page-parser", () => ({
	parsePageContextFromDocument: () => ({
		title: "Test Page",
		url: "https://example.com/",
		content: "Page body text",
		blocks: [],
		hash: "ctx_test_hash",
		capturedAt: "2026-08-07T12:00:00.000Z",
	}),
}));

// Deterministic form-input capture; test controls the captured fields.
let capturedFormFields: Array<Record<string, unknown>> = [];
mock.module("../src/lib/context/form-input-parser", () => ({
	compileIgnoredPatterns: () => [],
	parseFormInputFromDocument: () => ({
		fields: capturedFormFields,
		url: "https://example.com/",
		capturedAt: "2026-08-07T12:00:00.000Z",
	}),
}));

// Capture the debug-mode send payload so tests can assert value redaction.
let lastSendPayload: Record<string, unknown> | null = null;
mock.module("../src/lib/browser/sider-log", () => ({
	setSiderDebugModeEnabled: () => {},
	isSiderDebugModeEnabled: () => false,
	initSiderDebugModeSync: () => {},
	siderLogInfo: (
		_source: string,
		_message: string,
		metadata?: Record<string, unknown>,
	) => {
		lastSendPayload = metadata ?? null;
	},
	siderLogWarn: () => {},
	siderLogError: () => {},
}));

const { submitChat, updateMessageInline } = await import(
	"../src/modules/chat/chat-actions"
);
const { chatState } = await import("../src/modules/chat/chat-state.svelte");
const { contextState } = await import(
	"../src/modules/context/context-state.svelte"
);
const { contentSettingsState } = await import(
	"../src/modules/settings/content/settings-state.svelte"
);
const { conversationState } = await import(
	"../src/modules/history/conversation-state.svelte"
);
const { addExplicitContext } = await import(
	"../src/modules/context/context-actions"
);

describe("submitChat next-message context", () => {
	beforeEach(() => {
		streamBehavior = () => {};
		lastStreamMessages = null;
		capturedFormFields = [];
		lastSendPayload = null;
		contentSettingsState.settings.debugMode = false;
		chatState.messages = [];
		chatState.isLoading = false;
		chatState.currentRequestId = null;
		chatState.stopStream = null;
		chatState.activeConversationId = null;
		chatState.composer.text = "Test prompt";
		chatState.composer.pendingImage = null;
		chatState.composer.error = "";
		conversationState.conversations = [];
		contextState.explicitContextItems = [];
		contextState.currentSelectionContext = null;
		contextState.pageContextEnabled = false;
		contextState.pageContextSnapshot = null;
		contextState.pageContextStatus = "idle";
	});

	it("clears selection and pinned context immediately after send, before the stream completes", async () => {
		contextState.currentSelectionContext = { text: "Live selection text" };
		addExplicitContext("Pinned text", "Pinned");

		await submitChat();

		// The stream is still open (no callbacks fired), proving the context box is
		// cleared at send time instead of after a successful response.
		expect(chatState.isLoading).toBe(true);
		expect(contextState.explicitContextItems).toEqual([]);
		expect(contextState.currentSelectionContext).toBeNull();
	});

	it("clears context even when the stream errors", async () => {
		contextState.currentSelectionContext = { text: "Live selection text" };
		addExplicitContext("Pinned text", "Pinned");
		// Fire the error asynchronously (like a real runtime-port message): a
		// synchronous callback would hit the not-yet-initialized `stop` binding.
		streamBehavior = (callbacks) =>
			queueMicrotask(() =>
				callbacks.onError({
					code: "provider",
					message: "boom",
					retryable: false,
					source: "provider",
				}),
			);

		await submitChat();

		expect(contextState.explicitContextItems).toEqual([]);
		expect(contextState.currentSelectionContext).toBeNull();
		expect(chatState.messages.at(-1)?.status).toBe("error");
	});

	it("attaches sentContext.fragments with the selection and pinned texts in order", async () => {
		contextState.currentSelectionContext = { text: "Live selection text" };
		addExplicitContext("Pinned one", "Pinned");
		addExplicitContext("Pinned two", "Pinned");

		await submitChat();

		const userMessage = chatState.messages.find(
			(m) => m.role === "user" && m.kind !== "page-context",
		);
		expect(userMessage?.sentContext?.fragments).toEqual([
			"Live selection text",
			"Pinned one",
			"Pinned two",
		]);
	});

	it("omits sentContext when no context was attached", async () => {
		await submitChat();

		const userMessage = chatState.messages.find(
			(m) => m.role === "user" && m.kind !== "page-context",
		);
		expect(userMessage).toBeDefined();
		expect(userMessage?.sentContext).toBeUndefined();
	});

	it("injects the page context message without a statusLabel in the preview", async () => {
		contextState.pageContextEnabled = true;

		await submitChat();

		const pageContextMessage = chatState.messages.find(
			(m) => m.kind === "page-context",
		);
		expect(pageContextMessage).toBeDefined();
		const preview = pageContextMessage?.pageContextPreview;
		expect(preview?.hash).toBe("ctx_test_hash");
		expect(preview?.title).toBe("Test Page");
		expect(preview && "statusLabel" in preview).toBe(false);
		expect(Object.keys(preview ?? {}).sort()).toEqual([
			"createdAt",
			"hash",
			"title",
			"url",
		]);
	});
});

describe("updateMessageInline next-message context", () => {
	beforeEach(() => {
		streamBehavior = () => {};
		lastStreamMessages = null;
		chatState.messages = [];
		chatState.isLoading = false;
		chatState.currentRequestId = null;
		chatState.stopStream = null;
		chatState.activeConversationId = null;
		chatState.composer.text = "Test prompt";
		chatState.composer.pendingImage = null;
		chatState.composer.error = "";
		conversationState.conversations = [];
		contextState.explicitContextItems = [];
		contextState.currentSelectionContext = null;
		contextState.pageContextEnabled = false;
		contextState.pageContextSnapshot = null;
		contextState.pageContextStatus = "idle";
	});

	/** Sends an initial message, then allows editing by ending the open stream state. */
	async function sendInitialMessage(): Promise<string> {
		await submitChat();
		// The stream stays open; end the loading state so the edit is allowed.
		chatState.isLoading = false;
		chatState.currentRequestId = null;
		const userMessage = chatState.messages.find(
			(m) => m.role === "user" && m.kind !== "page-context",
		);
		expect(userMessage).toBeDefined();
		return userMessage!.id;
	}

	it("clears context and refreshes sentContext on edit-resubmit", async () => {
		contextState.currentSelectionContext = { text: "Original selection" };
		const messageId = await sendInitialMessage();
		expect(
			chatState.messages.find((m) => m.id === messageId)?.sentContext
				?.fragments,
		).toEqual(["Original selection"]);

		contextState.currentSelectionContext = { text: "New selection" };
		addExplicitContext("New pinned", "Pinned");

		await updateMessageInline(messageId, "Edited prompt");

		expect(contextState.explicitContextItems).toEqual([]);
		expect(contextState.currentSelectionContext).toBeNull();

		const edited = chatState.messages.find((m) => m.id === messageId);
		expect(edited?.content).toBe("Edited prompt");
		expect(edited?.sentContext?.fragments).toEqual([
			"New selection",
			"New pinned",
		]);

		// The outgoing request must contain the snapshot context even though the
		// live state was cleared before the stream started.
		const requestPayload = JSON.stringify(lastStreamMessages);
		expect(requestPayload).toContain("New selection");
		expect(requestPayload).toContain("New pinned");
	});

	it("removes the sentContext chip when an edit-resubmit has no attached context", async () => {
		contextState.currentSelectionContext = { text: "Original selection" };
		const messageId = await sendInitialMessage();
		expect(
			chatState.messages.find((m) => m.id === messageId)?.sentContext
				?.fragments,
		).toEqual(["Original selection"]);

		await updateMessageInline(messageId, "Edited prompt");

		const edited = chatState.messages.find((m) => m.id === messageId);
		expect(edited?.content).toBe("Edited prompt");
		expect(edited && "sentContext" in edited).toBe(false);
	});
});

describe("submitChat take-input", () => {
	beforeEach(() => {
		streamBehavior = () => {};
		lastStreamMessages = null;
		capturedFormFields = [];
		lastSendPayload = null;
		contentSettingsState.settings.debugMode = false;
		chatState.messages = [];
		chatState.isLoading = false;
		chatState.currentRequestId = null;
		chatState.stopStream = null;
		chatState.activeConversationId = null;
		chatState.composer.text = "Test prompt";
		chatState.composer.pendingImage = null;
		chatState.composer.error = "";
		conversationState.conversations = [];
		contextState.explicitContextItems = [];
		contextState.currentSelectionContext = null;
		contextState.pageContextEnabled = false;
		contextState.pageContextSnapshot = null;
		contextState.pageContextStatus = "idle";
	});

	function userMessage(): { id: string } | undefined {
		return chatState.messages.find(
			(m) => m.role === "user" && m.kind === "plain",
		);
	}

	it("injects a form-input message before the user message when takeInput is true", async () => {
		capturedFormFields = [
			{
				label: "Email",
				type: "email",
				value: "a@b.c",
				required: false,
				fieldPath: "form > Email",
				formLabel: "form",
			},
		];

		await submitChat({ takeInput: true });

		const formInputIndex = chatState.messages.findIndex(
			(m) => m.kind === "form-input",
		);
		const userIndex = chatState.messages.findIndex(
			(m) => m.id === userMessage()?.id,
		);
		expect(formInputIndex).toBeGreaterThanOrEqual(0);
		expect(formInputIndex).toBeLessThan(userIndex);
	});

	it("does not inject a form-input message when takeInput is false", async () => {
		await submitChat({ takeInput: false });
		expect(chatState.messages.some((m) => m.kind === "form-input")).toBe(false);
	});

	it("does not inject a form-input message by default", async () => {
		await submitChat();
		expect(chatState.messages.some((m) => m.kind === "form-input")).toBe(false);
	});

	it("adds no form-input message when takeInput is true but no fields are captured", async () => {
		capturedFormFields = [];
		await submitChat({ takeInput: true });
		expect(chatState.messages.some((m) => m.kind === "form-input")).toBe(false);
	});

	it("places the form-input message after the page-context message", async () => {
		contextState.pageContextEnabled = true;
		capturedFormFields = [
			{
				label: "Email",
				type: "email",
				value: "a@b.c",
				required: false,
				fieldPath: "form > Email",
				formLabel: "form",
			},
		];

		await submitChat({ takeInput: true });

		const pageContextIndex = chatState.messages.findIndex(
			(m) => m.kind === "page-context",
		);
		const formInputIndex = chatState.messages.findIndex(
			(m) => m.kind === "form-input",
		);
		const userIndex = chatState.messages.findIndex(
			(m) => m.role === "user" && m.kind === "plain",
		);
		expect(pageContextIndex).toBeGreaterThanOrEqual(0);
		expect(formInputIndex).toBeGreaterThan(pageContextIndex);
		expect(userIndex).toBeGreaterThan(formInputIndex);
	});

	it("redacts form-input values in the debug-mode payload", async () => {
		contentSettingsState.settings.debugMode = true;
		capturedFormFields = [
			{
				label: "Email",
				type: "email",
				value: "redacted-value@example.com",
				required: false,
				fieldPath: "form > Email",
				formLabel: "form",
			},
			{
				label: "Name",
				type: "text",
				value: "secret-value",
				required: false,
				fieldPath: "form > Name",
				formLabel: "form",
			},
		];

		await submitChat({ takeInput: true });

		const loggedMessages = (lastSendPayload?.messages ?? []) as Array<{
			role: string;
			content: string | unknown;
		}>;
		const formInputLog = loggedMessages.find(
			(m) =>
				typeof m.content === "string" && m.content.includes("[form-input:"),
		);
		expect(formInputLog).toBeDefined();
		const content = formInputLog!.content as string;
		expect(content).toContain("2 fields");
		expect(content).not.toContain("redacted-value@example.com");
		expect(content).not.toContain("secret-value");
	});
});
