import type {
	ChatMessage,
	ExplicitContextItem,
	ModeConfig,
	PageContext,
	ProviderMessage,
	SelectionContext,
} from "../../lib/shared/types";
import { buildChatRequest } from "./prompt-builder";

export interface ChatExportInput {
	messages: ChatMessage[];
	baseSystemPrompt: string;
	activeMode?: ModeConfig | null;
	/** Currently selected composite model ref, reported as `request.model`. */
	model?: string | null;
	explicitContext: ExplicitContextItem[];
	selectionContext?: SelectionContext | null;
	pageContext?: PageContext | null;
	userImageUrl?: string | null;
}

export interface ChatExportPayload {
	exportedAt: string;
	systemPrompt: {
		base: string;
		activeMode: ModeConfig | null;
		combined: string;
	};
	context: {
		pageContext: PageContext | null;
		selectionContext: SelectionContext | null;
		explicitContext: ExplicitContextItem[];
	};
	messages: ChatMessage[];
	request: { model: string; messages: ProviderMessage[] };
}

export function buildChatExport(input: ChatExportInput): ChatExportPayload {
	const activeModePrompt = input.activeMode?.systemPrompt || "";
	const combinedSystemPrompt = [input.baseSystemPrompt, activeModePrompt]
		.filter(Boolean)
		.join("\n\n");

	const lastUserMessage = [...input.messages]
		.reverse()
		.find(
			(m) =>
				m.role === "user" && m.kind !== "page-context" && m.kind !== "form-input",
		);

	const request = buildChatRequest({
		userPrompt: lastUserMessage?.content ?? "",
		conversationMessages: input.messages
			.filter((m) => m.status !== "streaming")
			.map((m): ProviderMessage => ({ role: m.role, content: m.content })),
		explicitContext: input.explicitContext,
		selectionContext: input.selectionContext ?? null,
		userImageUrl: input.userImageUrl ?? null,
		systemPrompt: combinedSystemPrompt,
		model: input.model ?? null,
	});

	return {
		exportedAt: new Date().toISOString(),
		systemPrompt: {
			base: input.baseSystemPrompt,
			activeMode: input.activeMode ?? null,
			combined: combinedSystemPrompt,
		},
		context: {
			pageContext: input.pageContext ?? null,
			selectionContext: input.selectionContext ?? null,
			explicitContext: input.explicitContext,
		},
		messages: input.messages,
		request,
	};
}

export function downloadChatExport(
	payload: ChatExportPayload,
	filename: string,
): void {
	const blob = new Blob([JSON.stringify(payload, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
