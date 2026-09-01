export type LogLevel = "debug" | "info" | "warn" | "error";

export interface SiteAccessPolicy {
	domains: string[];
}

export interface SearchEngine {
	id: string;
	label: string;
	enabled: boolean;
	template: string;
}

/** Supported provider backends. */
export type ProviderType = "openrouter" | "openai-compatible" | "google-gemini";

/**
 * A configured model attached to a {@link ProviderInstance}.
 * `providerId` references the owning provider instance's `id` so the same
 * model id may exist under multiple provider instances (duplicates allowed).
 */
export interface ModelConfig {
	id: string;
	label: string;
	providerId: string;
	enabled: boolean;
	supportsImages: boolean;
	webSearchEnabled: boolean;
	/** Reasoning effort for reasoning models; unset means the provider default. */
	thinkingLevel?: "low" | "medium" | "high";
	contextWindow?: number;
}

/**
 * A user-configurable provider instance. API keys are NOT stored here; they
 * live in the separate secrets store keyed by instance `id`.
 */
export interface ProviderInstance {
	id: string;
	type: ProviderType;
	label: string;
	baseUrl: string;
	models: ModelConfig[];
	enabled: boolean;
}

export interface PromptTemplates {
	explainSelection: string;
	translateSelection: string;
	askSelection: string;
}

export type PopupChatTarget = "current-chat" | "new-chat";

export type ComposerSubmitMode = "enter" | "shift-enter";
export type AppLocale = "en" | "nl";

/**
 * API keys keyed by provider instance id, persisted outside the public
 * settings blob.
 */
export type SettingsSecrets = Record<string, string>;

/** Settings exposed to untrusted page contexts (content script / sidebar). */
export type PublicAppSettings = AppSettings;

export type AppTheme = "light" | "dark" | "system";

export interface ModeConfig {
	id: string;
	label: string;
	systemPrompt: string;
	isCustom: boolean;
}

export interface McpServerConfig {
	id: string;
	name: string;
	url: string;
	transport: "sse" | "websocket";
	enabled: boolean;
}

export interface AppSettings {
	/** Composite reference `${providerId}:${modelId}` to the default model. */
	defaultModelId: string;
	providers: ProviderInstance[];
	searchEngines: SearchEngine[];
	siteAccessPolicy: SiteAccessPolicy;
	textWrappingEnabled: boolean;
	promptTemplates: PromptTemplates;
	systemPrompt: string;
	debugMode: boolean;
	autoReadPage: boolean;
	autoSendQuickActions: boolean;
	selectionPopupTakesFocus: boolean;
	sidebarWidth: number;
	composerSubmitMode: ComposerSubmitMode;
	popupChatTarget: PopupChatTarget;
	locale: AppLocale;
	theme: AppTheme;
	modes: ModeConfig[];
	activeModeId: string;
	mcpServers: McpServerConfig[];
	mcpBridgeEnabled: boolean;
	mcpBridgeUrl: string;
	takeInputEnabled: boolean;
	takeInputIgnoredFields: string[];
}

export interface DebugLogRecord {
	id: string;
	timestamp: string;
	level: LogLevel;
	source: string;
	message: string;
	metadata?: Record<string, unknown>;
}

export interface SelectionContext {
	text: string;
	surroundingText?: string;
}

export interface PageContextBlock {
	kind: "heading" | "paragraph" | "list" | "code";
	text: string;
}

export interface PageContext {
	title: string;
	url: string;
	byline?: string;
	excerpt?: string;
	content: string;
	blocks: PageContextBlock[];
	hash: string;
	capturedAt: string;
}

export type PageContextStatus =
	| "idle"
	| "fresh"
	| "stale"
	| "refreshing"
	| "error";
export type PageContextInvalidationReason =
	| "url"
	| "history"
	| "dom"
	| "focus"
	| "visibility"
	| "manual";

export interface ExplicitContextItem {
	id: string;
	label: string;
	text: string;
	createdAt: string;
	priority: number;
}

export interface InjectedPageContextPreview {
	hash: string;
	title: string;
	url: string;
	createdAt: string;
}

export interface ChatMessage {
	id: string;
	role: "system" | "user" | "assistant";
	content: string;
	createdAt: string;
	updatedAt?: string;
	status?: "streaming" | "done" | "error";
	kind?: "plain" | "page-context" | "form-input";
	pageContextPreview?: InjectedPageContextPreview;
	/** Persisted snapshot of the next-message context sent with this message. */
	sentContext?: {
		fragments: string[];
	};
	/** True when the request that produced this message ran with web search enabled. */
	webSearchEnabled?: boolean;
	/** Composite model ref (`${providerId}:${modelId}`) of the request that produced this assistant message. */
	modelRef?: string;
	/** Web-search sources surfaced by the provider, if any. */
	sources?: WebSearchSource[];
}

/** A web-search source cited by the provider in the answer. */
export interface WebSearchSource {
	url: string;
	title?: string;
}

export interface ConversationMetadata {
	origin: string;
	url: string;
	pageHash?: string;
	title?: string;
	lastInjectedPageContextHash?: string;
	lastInjectedPageContextAt?: string;
	lastInjectedPageContextTitle?: string;
	lastInjectedPageContextUrl?: string;
	branchGroupId?: string;
	activeModeId?: string;
}

export interface Conversation {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	messages: ChatMessage[];
	metadata: ConversationMetadata;
}

export interface TokenUsage {
	promptTokens?: number;
	completionTokens?: number;
	totalTokens?: number;
}

export interface ProviderTextContentPart {
	type: "text";
	text: string;
}

export interface ProviderImageUrlContentPart {
	type: "image_url";
	image_url: {
		url: string;
	};
}

export type ProviderContentPart =
	| ProviderTextContentPart
	| ProviderImageUrlContentPart;
export type ProviderMessageContent = string | ProviderContentPart[];

export interface ProviderMessage {
	role: "system" | "user" | "assistant";
	content: ProviderMessageContent;
}
