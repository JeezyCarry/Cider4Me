import {
	MAX_EXPLICIT_SNIPPETS,
	MAX_IMPLICIT_CONTEXT_CHARS,
} from "../shared/constants";
import type {
	ExplicitContextItem,
	PageContext,
	PageContextStatus,
	SelectionContext,
} from "../shared/types";
import type { CapturedFormInput } from "./form-input-parser";

export interface BuildContextEnvelopeInput {
	explicitContext: ExplicitContextItem[];
	selectionContext?: SelectionContext | null;
}

export function truncateText(value: string, maxChars: number): string {
	if (value.length <= maxChars) return value;
	return `${value.slice(0, Math.max(0, maxChars - 1))}…`;
}

export function normalizeExplicitContext(
	items: ExplicitContextItem[],
): ExplicitContextItem[] {
	return [...items]
		.sort(
			(a, b) =>
				a.priority - b.priority || a.createdAt.localeCompare(b.createdAt),
		)
		.slice(0, MAX_EXPLICIT_SNIPPETS);
}

export function buildContextEnvelope({
	explicitContext,
	selectionContext,
}: BuildContextEnvelopeInput): string {
	const sections: string[] = [];

	if (selectionContext?.text) {
		sections.push(
			`## Current selection\n${truncateText(selectionContext.text, 4000)}`,
		);
	}

	const normalizedExplicit = normalizeExplicitContext(explicitContext);
	if (normalizedExplicit.length > 0) {
		sections.push(
			`## Explicit context\n${normalizedExplicit.map((item) => `### ${item.label}\n${truncateText(item.text, 3000)}`).join("\n\n")}`,
		);
	}

	return sections.join("\n\n");
}

export function buildPageContextMessage(pageContext: PageContext): string {
	const sections = [
		"[Page context]",
		`Title: ${pageContext.title}`,
		`URL: ${pageContext.url}`,
		`Captured at: ${pageContext.capturedAt}`,
	];

	if (pageContext.byline) sections.push(`Byline: ${pageContext.byline}`);
	if (pageContext.excerpt)
		sections.push(`Excerpt: ${truncateText(pageContext.excerpt, 500)}`);

	sections.push(
		"",
		truncateText(pageContext.content, MAX_IMPLICIT_CONTEXT_CHARS),
	);

	return sections.join("\n");
}

export function shouldRefreshPageContext(
	pageContext: PageContext | null,
	status: PageContextStatus,
): boolean {
	if (!pageContext) return true;
	return status === "idle" || status === "stale" || status === "error";
}

export function shouldInjectPageContext(
	pageContext: PageContext | null,
	lastInjectedHash?: string,
): boolean {
	return Boolean(pageContext && pageContext.hash !== (lastInjectedHash ?? ""));
}

export function buildFormInputMessage(captured: CapturedFormInput): string {
	const lines = [
		"[User-provided webpage form input]",
		`URL: ${captured.url}`,
		`Captured at: ${captured.capturedAt}`,
		"Fields:",
		...captured.fields.map((field) => {
			const required = field.required ? ", required" : "";
			return `- ${field.fieldPath} (${field.type}${required}): ${field.value}`;
		}),
	];
	return truncateText(lines.join("\n"), MAX_IMPLICIT_CONTEXT_CHARS);
}
