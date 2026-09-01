import { truncateText } from "./page-context";

/**
 * A single captured form field from the active page. Values are already
 * truncated to a sane per-field cap so one long field can't flood the prompt.
 */
export interface CapturedFormField {
	/** Human label: linked <label>, aria-label, aria-labelledby, placeholder, name/id fallback. */
	label: string;
	name?: string;
	id?: string;
	/** Normalized field type: 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'email' | ... */
	type: string;
	/** Filled value (select/checkbox/radio → chosen option text). */
	value: string;
	required: boolean;
	/** Compact path "formLabel > label", e.g. "Checkout > Email". */
	fieldPath: string;
	formLabel?: string;
}

export interface CapturedFormInput {
	fields: CapturedFormField[];
	url: string;
	capturedAt: string;
}

/** Field types that are never captured (not user-disableable). */
const EXCLUDED_TYPES = new Set([
	"hidden",
	"password",
	"submit",
	"button",
	"image",
	"reset",
	"file",
	"color",
]);

/** Hardcoded sensitive-name guard (not user-disableable). */
const SENSITIVE_PATTERN =
	/cc-|card|cvc|cvv|expir|ssn|bsn|iban|account|secret|token|otp|one.?time|2fa|totp|\bpin(code)?\b|pin[_-]?number\b|password|passwd|\bpwd\b/i;

/** Compiles settings pattern strings into RegExp[]; invalid patterns are skipped silently. */
export function compileIgnoredPatterns(patterns: string[]): RegExp[] {
	const output: RegExp[] = [];
	for (const raw of patterns) {
		const pattern = raw.trim();
		if (!pattern) continue;
		try {
			output.push(new RegExp(pattern, "i"));
		} catch {
			// Invalid regex from user input is skipped without throwing.
		}
	}
	return output;
}

function getNormalizedType(el: Element): string {
	const input = el as HTMLInputElement;
	if (el.tagName === "SELECT") return "select";
	if (el.tagName === "TEXTAREA") return "textarea";
	if (el.tagName === "INPUT") return (input.type || "text").toLowerCase();
	return "text";
}

function isExcludedType(el: Element): boolean {
	const type = getNormalizedType(el);
	return EXCLUDED_TYPES.has(type);
}

function attributeProbe(el: Element): string {
	return [
		el.getAttribute("name"),
		el.getAttribute("id"),
		el.getAttribute("autocomplete"),
	]
		.filter(Boolean)
		.join(" ");
}

function matchesSensitiveName(el: Element): boolean {
	if (SENSITIVE_PATTERN.test(attributeProbe(el))) return true;
	const autocomplete = (el.getAttribute("autocomplete") ?? "").toLowerCase();
	return (
		autocomplete.startsWith("cc-") ||
		autocomplete === "one-time-code" ||
		autocomplete === "current-password" ||
		autocomplete === "new-password"
	);
}

function matchesIgnoredPatterns(
	patterns: RegExp[],
	name?: string,
	id?: string,
	label?: string,
): boolean {
	if (patterns.length === 0) return false;
	const probe = [name, id, label].filter(Boolean).join(" ");
	return patterns.some((pattern) => pattern.test(probe));
}

function isVisible(el: Element): boolean {
	const htmlEl = el as HTMLElement;
	return Boolean(htmlEl.offsetParent) || htmlEl.getClientRects().length > 0;
}

function resolveLabel(el: Element, doc: Document): string {
	const labels = (el as HTMLInputElement).labels;
	if (labels && labels.length > 0) {
		const text = labels[0]?.textContent?.trim();
		if (text) return text;
	}
	// jsdom does not expose wrapped labels via .labels; fall back to the ancestor label.
	const wrapped = el.closest("label")?.textContent?.trim();
	if (wrapped) return wrapped;

	const ariaLabel = el.getAttribute("aria-label");
	if (ariaLabel?.trim()) return ariaLabel.trim();

	const labelledBy = el.getAttribute("aria-labelledby");
	if (labelledBy) {
		const labelledEl = doc.getElementById(labelledBy);
		if (labelledEl?.textContent?.trim()) return labelledEl.textContent.trim();
	}

	const placeholder = el.getAttribute("placeholder");
	if (placeholder?.trim()) return placeholder.trim();

	const name = el.getAttribute("name");
	if (name?.trim()) return name.trim();

	const id = el.getAttribute("id");
	if (id?.trim()) return id.trim();

	return "";
}

function resolveFormLabel(el: Element, doc: Document): string {
	const form = el.closest("form");
	if (!form) return "(page)";
	if (form.name?.trim()) return form.name.trim();
	if (form.id?.trim()) return form.id.trim();
	const ariaLabel = form.getAttribute("aria-label");
	if (ariaLabel?.trim()) return ariaLabel.trim();
	const index = Array.from(doc.forms).indexOf(form as HTMLFormElement) + 1;
	return `form #${index}`;
}

function captureSelect(el: HTMLSelectElement): string {
	return Array.from(el.selectedOptions)
		.map((option) => option.textContent?.trim() ?? "")
		.filter(Boolean)
		.join(", ");
}

function isRadio(el: Element): boolean {
	return el.tagName === "INPUT" && (el as HTMLInputElement).type === "radio";
}

function isCheckbox(el: Element): boolean {
	return el.tagName === "INPUT" && (el as HTMLInputElement).type === "checkbox";
}

function buildField(
	el: Element,
	type: string,
	formLabel: string,
	label: string,
	value: string,
	name?: string,
	id?: string,
): CapturedFormField {
	return {
		label,
		name,
		id,
		type,
		value: truncateText(value, 1000),
		required: Boolean((el as { required?: boolean }).required),
		fieldPath: `${formLabel} > ${label}`,
		formLabel,
	};
}

/** Single-shot capture. Installs no listeners and writes nothing to storage. */
export function parseFormInputFromDocument(
	doc: Document,
	ignoredPatterns: RegExp[],
): CapturedFormInput {
	const fields: CapturedFormField[] = [];
	const seenRadioGroups = new Set<string>();
	const url = doc.location?.href ?? "";

	doc.querySelectorAll("input, textarea, select").forEach((el) => {
		if (isExcludedType(el)) return;
		if (matchesSensitiveName(el)) return;

		const name = el.getAttribute("name") ?? undefined;
		const id = el.getAttribute("id") ?? undefined;
		const label = resolveLabel(el, doc);
		if (matchesIgnoredPatterns(ignoredPatterns, name, id, label)) return;

		if (!isVisible(el)) return;
		const disabled =
			(el as HTMLInputElement).disabled || (el as HTMLInputElement).readOnly;
		if (disabled) return;

		const formLabel = resolveFormLabel(el, doc);

		if (isRadio(el)) {
			const radio = el as HTMLInputElement;
			const groupKey = `${formLabel}|${name ?? ""}`;
			if (!name || seenRadioGroups.has(groupKey)) return;
			if (!radio.checked) return;
			seenRadioGroups.add(groupKey);
			const radioLabel = resolveLabel(el, doc);
			fields.push(
				buildField(el, "radio", formLabel, radioLabel, radioLabel, name, id),
			);
			return;
		}

		if (isCheckbox(el)) {
			const checkbox = el as HTMLInputElement;
			if (!checkbox.checked) return;
			fields.push(
				buildField(el, "checkbox", formLabel, label, "checked", name, id),
			);
			return;
		}

		let value: string;
		if (el.tagName === "SELECT") {
			value = captureSelect(el as HTMLSelectElement);
		} else {
			value = ((el as HTMLInputElement).value ?? "").trim();
		}
		if (!value) return;

		fields.push(
			buildField(el, getNormalizedType(el), formLabel, label, value, name, id),
		);
	});

	return {
		fields,
		url,
		capturedAt: new Date().toISOString(),
	};
}
