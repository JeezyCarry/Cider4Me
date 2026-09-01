import { describe, expect, test } from "bun:test";
import {
	resolveTakeInputKeyAction,
	shouldHandleTakeInputKey,
} from "../src/modules/chat/take-input-prompt-keyboard";

describe("take input prompt keyboard", () => {
	test("maps 1 to no", () => {
		expect(resolveTakeInputKeyAction("1")).toBe("no");
	});

	test("maps 2 to take", () => {
		expect(resolveTakeInputKeyAction("2")).toBe("take");
	});

	test("maps Escape to cancel", () => {
		expect(resolveTakeInputKeyAction("Escape")).toBe("cancel");
	});

	test("maps Enter, Tab and other keys to null", () => {
		expect(resolveTakeInputKeyAction("Enter")).toBeNull();
		expect(resolveTakeInputKeyAction("Tab")).toBeNull();
		expect(resolveTakeInputKeyAction("a")).toBeNull();
		expect(resolveTakeInputKeyAction("EscapeWhatever")).toBeNull();
	});

	test("handles keys inside the popup regardless of target type", () => {
		expect(
			shouldHandleTakeInputKey({ insidePopup: true, isEditable: true }),
		).toBe(true);
		expect(
			shouldHandleTakeInputKey({ insidePopup: true, isEditable: false }),
		).toBe(true);
	});

	test("handles keys on plain (non-editable) targets outside the popup", () => {
		expect(
			shouldHandleTakeInputKey({ insidePopup: false, isEditable: false }),
		).toBe(true);
	});

	test("does not handle keys from editable fields on the host page (P3 consent guard)", () => {
		expect(
			shouldHandleTakeInputKey({ insidePopup: false, isEditable: true }),
		).toBe(false);
	});
});
