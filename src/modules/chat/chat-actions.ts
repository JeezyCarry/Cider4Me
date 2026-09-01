import { startChatStream } from "../../lib/ai/chat-client";
import {
	buildPageContextMessage,
	buildFormInputMessage,
	shouldInjectPageContext,
} from "../../lib/context/page-context";
import {
	compileIgnoredPatterns,
	parseFormInputFromDocument,
	type CapturedFormInput,
} from "../../lib/context/form-input-parser";
import { getI18n } from "../../lib/i18n";
import type {
	ChatMessage,
	Conversation,
	ExplicitContextItem,
	PageContext,
	ProviderMessage,
	SelectionContext,
} from "../../lib/shared/types";
import { buildChatRequest } from "./prompt-builder";
import {
	chatState,
	resetComposer,
	resetMessageEditing,
} from "./chat-state.svelte";
import { conversationState } from "../history/conversation-state.svelte";
import {
	createConversation,
	upsertConversation,
} from "../history/conversation-actions";
import { contextState } from "../context/context-state.svelte";
import {
	clearNextMessageContext,
	ensureFreshPageContextBeforeSend,
} from "../context/context-actions";
import { contentSettingsState } from "../settings/content/settings-state.svelte";
import {
	resolveSelectedModel,
	resolveSelectedModelRef,
	getImageCompatibilityError,
} from "./chat-submit";
import { readFileAsDataUrl } from "./input-section-images";
import { getAllModels } from "../../lib/shared/model-registry";
import {
	buildConversationBackupTitle,
	cloneChatMessages,
	prepareMessageEdit,
} from "./chat-edit";
import { siderLogInfo } from "../../lib/browser/sider-log";

function toProviderMessage(message: ChatMessage): ProviderMessage {
	return { role: message.role, content: message.content };
}

/**
 * Builds the persisted sentContext fragment list from a context snapshot:
 * the trimmed selection text first, then the trimmed non-empty pinned texts.
 */
function buildSentContextFragments(
	selectionContext: SelectionContext | null,
	explicitContext: ExplicitContextItem[],
): string[] {
	return [
		...(selectionContext?.text?.trim() ? [selectionContext.text.trim()] : []),
		...explicitContext
			.map((item) => item.text.trim())
			.filter((text) => text.length > 0),
	];
}

function toProviderMessages(messages: ChatMessage[]): ProviderMessage[] {
	return messages.map(toProviderMessage);
}

/**
 * Summarizes a provider message's content for debug logging, replacing base64
 * image data with a length marker to avoid console spam.
 */
function summarizeMessageContent(
	content: ProviderMessage["content"],
): string | Array<Record<string, unknown>> {
	if (typeof content === "string") return content;
	return content.map((part) =>
		part.type === "text"
			? { type: "text", text: part.text }
			: { type: "image", imageDataUrlLength: part.image_url.url.length },
	);
}

function ensureActiveConversation(): Conversation {
	const active = conversationState.conversations.find(
		(conversation) => conversation.id === chatState.activeConversationId,
	);
	if (active) return active;

	const created = createConversation(
		document.title ||
			getI18n(contentSettingsState.settings.locale).sidebar.defaults
				.newConversationTitle,
		{
			origin: window.location.origin,
			url: window.location.href,
			pageHash: contextState.pageContextSnapshot?.hash,
			title: document.title,
			branchGroupId: crypto.randomUUID(),
		},
	);
	chatState.activeConversationId = created.id;
	void upsertConversation(created);
	return created;
}

function createPageContextChatMessage(pageContext: PageContext): ChatMessage {
	return {
		id: crypto.randomUUID(),
		role: "user",
		kind: "page-context",
		content: buildPageContextMessage(pageContext),
		createdAt: new Date().toISOString(),
		pageContextPreview: {
			hash: pageContext.hash,
			title: pageContext.title,
			url: pageContext.url,
			createdAt: pageContext.capturedAt,
		},
	};
}

function createFormInputChatMessage(captured: CapturedFormInput): ChatMessage {
	return {
		id: crypto.randomUUID(),
		role: "user",
		kind: "form-input",
		content: buildFormInputMessage(captured),
		createdAt: new Date().toISOString(),
	};
}

function createFormInputChatMessageIfAny(): ChatMessage | null {
	const captured = parseFormInputFromDocument(
		document,
		compileIgnoredPatterns(contentSettingsState.settings.takeInputIgnoredFields),
	);
	if (captured.fields.length === 0) return null;
	return createFormInputChatMessage(captured);
}

async function performChatCompletion(
	active: Conversation,
	messages: ChatMessage[],
	promptForTitle: string,
	syntheticPageContextMessage: ChatMessage | null,
	explicitContext: ExplicitContextItem[],
	selectionContext: SelectionContext | null,
): Promise<void> {
	const requestId = crypto.randomUUID();
	const freshSettings = contentSettingsState.settings;

	const requestConversationMessages = toProviderMessages(
		messages.filter((m) => m.status !== "streaming"),
	);

	chatState.isLoading = true;
	chatState.currentRequestId = requestId;
	chatState.streamState = "";

	// Save initial state
	void upsertConversation({
		...active,
		updatedAt: new Date().toISOString(),
		messages: [...chatState.messages],
	});

	const activeMode = freshSettings.modes?.find(
		(m) => m.id === freshSettings.activeModeId,
	);
	const activeModePrompt = activeMode?.systemPrompt || "";
	const baseSystemPrompt = freshSettings.systemPrompt || "";
	const combinedSystemPrompt = [baseSystemPrompt, activeModePrompt]
		.filter(Boolean)
		.join("\n\n");

	const selectedModelRef = resolveSelectedModelRef(
		getAllModels(freshSettings),
		freshSettings.defaultModelId,
	);
	const selectedModelForLog = resolveSelectedModel(
		getAllModels(freshSettings),
		freshSettings.defaultModelId,
	);

	const request = buildChatRequest({
		userPrompt: promptForTitle,
		conversationMessages: requestConversationMessages,
		explicitContext,
		selectionContext,
		userImageUrl: chatState.composer.pendingImage?.dataUrl,
		systemPrompt: combinedSystemPrompt,
		model: selectedModelRef,
	});

	const lastAssistantMessage = chatState.messages.at(-1);
	if (lastAssistantMessage && lastAssistantMessage.role === "assistant") {
		lastAssistantMessage.modelRef = selectedModelRef;
	}

	if (freshSettings.debugMode) {
		const loggedMessages = messages
			.filter((m) => m.status !== "streaming")
			.map((m) => {
				if (m.kind === "form-input") {
					const fieldCount = m.content
						.split("\n")
						.filter((line) => line.startsWith("- ")).length;
					return {
						role: m.role,
						content: `[form-input: ${fieldCount} fields — values redacted]`,
					};
				}
				return { role: m.role, content: summarizeMessageContent(m.content) };
			});
		siderLogInfo("chat", "send payload", {
			model: selectedModelRef,
			providerId: selectedModelForLog?.providerId,
			systemPrompt: combinedSystemPrompt,
			pageContextInjected: Boolean(syntheticPageContextMessage),
			messageCount: request.messages.length,
			messages: loggedMessages,
		});
	}

	const stop = startChatStream(requestId, selectedModelRef, request.messages, {
		onChunk(chunk) {
			chatState.streamState += chunk;
			const last = chatState.messages.at(-1);
			if (last) last.content += chunk;
		},
		onSuccess(content, sources) {
			chatState.isLoading = false;
			chatState.currentRequestId = null;
			chatState.stopStream = null;
			const last = chatState.messages.at(-1);
			if (last) {
				last.content = content;
				last.status = "done";
				if (sources?.length) last.sources = sources;
			}
			const updated = {
				id: active.id,
				title: promptForTitle.slice(0, 60),
				createdAt:
					conversationState.conversations.find(
						(conversation) => conversation.id === active.id,
					)?.createdAt ?? new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				metadata: {
					...active.metadata,
					origin: window.location.origin,
					url: window.location.href,
					pageHash: contextState.pageContextSnapshot?.hash,
					title: document.title,
					lastInjectedPageContextHash:
						syntheticPageContextMessage?.pageContextPreview?.hash ??
						active.metadata.lastInjectedPageContextHash,
					lastInjectedPageContextAt:
						syntheticPageContextMessage?.pageContextPreview?.createdAt ??
						active.metadata.lastInjectedPageContextAt,
					lastInjectedPageContextTitle:
						syntheticPageContextMessage?.pageContextPreview?.title ??
						active.metadata.lastInjectedPageContextTitle,
					lastInjectedPageContextUrl:
						syntheticPageContextMessage?.pageContextPreview?.url ??
						active.metadata.lastInjectedPageContextUrl,
				},
				messages: [...chatState.messages],
			};
			void upsertConversation(updated);
			chatState.composer.pendingImage = null;
			chatState.composer.error = "";
			stop();
		},
		onError(error) {
			chatState.isLoading = false;
			chatState.currentRequestId = null;
			chatState.stopStream = null;
			const last = chatState.messages.at(-1);
			if (last) {
				last.content = error.message;
				last.status = "error";
			}
			const updated = {
				id: active.id,
				title: promptForTitle.slice(0, 60),
				createdAt:
					conversationState.conversations.find(
						(conversation) => conversation.id === active.id,
					)?.createdAt ?? new Date().toISOString(),
				updatedAt: new Date().toISOString(),
				metadata: {
					...active.metadata,
					origin: window.location.origin,
					url: window.location.href,
					pageHash: contextState.pageContextSnapshot?.hash,
					title: document.title,
					lastInjectedPageContextHash:
						syntheticPageContextMessage?.pageContextPreview?.hash ??
						active.metadata.lastInjectedPageContextHash,
					lastInjectedPageContextAt:
						syntheticPageContextMessage?.pageContextPreview?.createdAt ??
						active.metadata.lastInjectedPageContextAt,
					lastInjectedPageContextTitle:
						syntheticPageContextMessage?.pageContextPreview?.title ??
						active.metadata.lastInjectedPageContextTitle,
					lastInjectedPageContextUrl:
						syntheticPageContextMessage?.pageContextPreview?.url ??
						active.metadata.lastInjectedPageContextUrl,
				},
				messages: [...chatState.messages],
			};
			void upsertConversation(updated);
			stop();
		},
	});

	chatState.stopStream = stop;
}

export async function submitChat(options?: {
	takeInput?: boolean;
}): Promise<void> {
	const prompt = chatState.composer.text.trim();
	if ((!prompt && !chatState.composer.pendingImage) || chatState.isLoading)
		return;

	const freshSettings = contentSettingsState.settings;
	const selectedModel = resolveSelectedModel(
		getAllModels(freshSettings),
		freshSettings.defaultModelId,
	);
	const imageCompatibilityError = getImageCompatibilityError(
		selectedModel,
		Boolean(chatState.composer.pendingImage),
		getI18n(freshSettings.locale).sidebar.composer.modelImageUnsupported,
	);
	if (imageCompatibilityError) {
		chatState.composer.error = imageCompatibilityError;
		return;
	}

	const active = ensureActiveConversation();
	const pageContext = contextState.pageContextEnabled
		? await ensureFreshPageContextBeforeSend()
		: null;
	const shouldInjectFreshPageContext = shouldInjectPageContext(
		pageContext,
		active.metadata.lastInjectedPageContextHash,
	);
	const syntheticPageContextMessage = shouldInjectFreshPageContext
		? createPageContextChatMessage(pageContext as PageContext)
		: null;
	const syntheticFormInputMessage = options?.takeInput
		? createFormInputChatMessageIfAny()
		: null;

	const explicitContextSnapshot = [...contextState.explicitContextItems];
	const selectionContextSnapshot = contextState.currentSelectionContext;
	const sentContextFragments = buildSentContextFragments(
		selectionContextSnapshot,
		explicitContextSnapshot,
	);

	const userMessage: ChatMessage = {
		id: crypto.randomUUID(),
		role: "user",
		kind: "plain",
		content: prompt,
		createdAt: new Date().toISOString(),
		...(sentContextFragments.length > 0
			? { sentContext: { fragments: sentContextFragments } }
			: {}),
	};
	const assistantMessage: ChatMessage = {
		id: crypto.randomUUID(),
		role: "assistant",
		kind: "plain",
		content: "",
		createdAt: new Date().toISOString(),
		status: "streaming",
		webSearchEnabled: Boolean(selectedModel?.webSearchEnabled),
	};

	chatState.messages = [
		...active.messages,
		...(syntheticPageContextMessage ? [syntheticPageContextMessage] : []),
		...(syntheticFormInputMessage ? [syntheticFormInputMessage] : []),
		userMessage,
		assistantMessage,
	];
	chatState.composer = {
		...chatState.composer,
		text: "",
		error: "",
		takeInputPromptOpen: false,
	};
	resetMessageEditing();
	clearNextMessageContext();

	await performChatCompletion(
		active,
		chatState.messages,
		prompt,
		syntheticPageContextMessage,
		explicitContextSnapshot,
		selectionContextSnapshot,
	);
}

export function cancelChat(): void {
	if (chatState.stopStream) {
		chatState.stopStream();
		chatState.stopStream = null;
	}
	chatState.isLoading = false;
	chatState.currentRequestId = null;
}

export async function attachPastedImage(file: File): Promise<void> {
	const dataUrl = await readFileAsDataUrl(file);
	chatState.composer.pendingImage = {
		kind: "image",
		dataUrl,
		mimeType: file.type || "image/png",
	};
	chatState.composer.error = "";
}

export function clearPendingImage(): void {
	chatState.composer.pendingImage = null;
	chatState.composer.error = "";
}

export async function startEditingMessage(messageId: string): Promise<void> {
	if (chatState.isLoading || !chatState.activeConversationId) return;

	const activeConversation = conversationState.conversations.find(
		(conversation) => conversation.id === chatState.activeConversationId,
	);
	if (!activeConversation) return;

	const preparedEdit = prepareMessageEdit(
		activeConversation.messages,
		messageId,
	);
	if (!preparedEdit) return;

	const backupTitle = buildConversationBackupTitle(
		activeConversation.title,
		conversationState.conversations.map((conversation) => conversation.title),
	);
	const backupConversation = createConversation(
		backupTitle,
		{
			...activeConversation.metadata,
		},
		cloneChatMessages(activeConversation.messages),
	);
	await upsertConversation(backupConversation);

	const truncatedConversation = {
		...activeConversation,
		updatedAt: new Date().toISOString(),
		messages: preparedEdit.retainedMessages,
	};

	chatState.messages = preparedEdit.retainedMessages;
	chatState.editingMessageId = messageId;
	chatState.editingBackupTitle = backupTitle;
	chatState.composer = {
		...chatState.composer,
		text: preparedEdit.draft,
		mode: "normal",
		pendingImage: null,
		error: "",
	};

	await upsertConversation(truncatedConversation);
}

export async function updateMessageInline(
	messageId: string,
	newContent: string,
): Promise<void> {
	if (chatState.isLoading || !chatState.activeConversationId) return;

	const activeConversation = conversationState.conversations.find(
		(conversation) => conversation.id === chatState.activeConversationId,
	);
	if (!activeConversation) return;

	// Branching: Create a backup of the current state before we truncate and change it
	const backupTitle = buildConversationBackupTitle(
		activeConversation.title,
		conversationState.conversations.map((conversation) => conversation.title),
	);
	const backupConversation = createConversation(
		backupTitle,
		{
			...activeConversation.metadata,
		},
		cloneChatMessages(activeConversation.messages),
	);
	await upsertConversation(backupConversation);

	// Now truncate the current conversation at the edit point
	const messageIndex = chatState.messages.findIndex((m) => m.id === messageId);
	if (messageIndex === -1) return;

	// Snapshot and clear the next-message context, mirroring submitChat: the
	// edit-resubmit consumes the attached context, so the box must not keep
	// showing it and the message chip must reflect what was actually sent.
	const explicitContextSnapshot = [...contextState.explicitContextItems];
	const selectionContextSnapshot = contextState.currentSelectionContext;
	const sentContextFragments = buildSentContextFragments(
		selectionContextSnapshot,
		explicitContextSnapshot,
	);

	const updatedUserMessage: ChatMessage = {
		...chatState.messages[messageIndex],
		content: newContent,
		updatedAt: new Date().toISOString(),
		...(sentContextFragments.length > 0
			? { sentContext: { fragments: sentContextFragments } }
			: {}),
	};
	if (sentContextFragments.length === 0) {
		delete updatedUserMessage.sentContext;
	}

	const newAssistantMessage: ChatMessage = {
		id: crypto.randomUUID(),
		role: "assistant",
		kind: "plain",
		content: "",
		createdAt: new Date().toISOString(),
		status: "streaming",
	};

	const truncatedMessages = [
		...chatState.messages.slice(0, messageIndex),
		updatedUserMessage,
		newAssistantMessage,
	];

	chatState.messages = truncatedMessages;
	clearNextMessageContext();

	await performChatCompletion(
		activeConversation,
		truncatedMessages,
		newContent,
		null,
		explicitContextSnapshot,
		selectionContextSnapshot,
	);
}

export function clearComposer(): void {
	resetComposer();
	resetMessageEditing();
}
