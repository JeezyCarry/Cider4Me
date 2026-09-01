export type TakeInputKeyAction = "no" | "take" | "cancel" | null;

export interface TakeInputTargetState {
	/** True when the event target is inside the prompt element. */
	insidePopup: boolean;
	/** True when the event target is an input/contenteditable field. */
	isEditable: boolean;
}

/**
 * Whether the prompt should handle the key. Only act when focus is meaningful
 * for the prompt: the target is inside the popup, or it is a plain (non-
 * input/contenteditable) area. Keeps the global listener from firing a
 * consent action from fields on the host page.
 */
export function shouldHandleTakeInputKey(
	target: TakeInputTargetState,
): boolean {
	return target.insidePopup || !target.isEditable;
}

/** Only explicit keys; Enter/Tab run through native button focus (see plan §2). */
export function resolveTakeInputKeyAction(key: string): TakeInputKeyAction {
	if (key === "1") return "no";
	if (key === "2") return "take";
	if (key === "Escape") return "cancel";
	return null;
}
