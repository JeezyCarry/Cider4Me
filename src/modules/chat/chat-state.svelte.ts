import type { ComposerDraft } from "./chat-types";
import type { ChatMessage } from "../../lib/shared/types";

export const chatState = $state({
	messages: [] as ChatMessage[],
	isLoading: false,
	currentRequestId: "" as string | null,
	stopStream: null as (() => void) | null,
	streamState: "" as string,
	activeConversationId: "" as string | null,
	queue: [] as string[],
	editingMessageId: "" as string | null,
	editingBackupTitle: "" as string | null,
	isLatchedToBottom: false,
	isScrolledDown: false,
	isContextPanelFullyHidden: false,
	scrollRequest: 0,
	composer: {
		text: "",
		mode: "normal",
		pendingImage: null,
		error: "",
		takeInputPromptOpen: false,
	} as ComposerDraft,
});

export function resetComposer(): void {
	chatState.composer = {
		text: "",
		mode: "normal",
		pendingImage: null,
		error: "",
		takeInputPromptOpen: false,
	};
}

export function resetMessageEditing(): void {
	chatState.editingMessageId = null;
	chatState.editingBackupTitle = null;
}
