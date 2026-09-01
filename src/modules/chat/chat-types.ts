export interface PendingImageAttachment {
	kind: "image";
	dataUrl: string;
	mimeType: string;
}

export interface ComposerDraft {
	text: string;
	mode: "normal" | "selection";
	pendingImage: PendingImageAttachment | null;
	error: string;
	takeInputPromptOpen: boolean;
}
