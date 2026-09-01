/**
 * Shared token substitution helpers for the selection feature.
 *
 * Search-engine templates use a `{query}` token (URL-encoded), while prompt
 * templates use a `{{selection}}` token (raw text). Centralising them here
 * avoids the two ad-hoc substitution mechanisms that previously lived inline
 * in the selection action layer.
 */

/** Substitute the `{query}` token in a search-engine URL template. */
export function substituteQueryToken(template: string, query: string): string {
  return template.replace('{query}', encodeURIComponent(query));
}

/** Substitute the `{{selection}}` token in a prompt template. */
export function substituteSelectionToken(template: string, selection: string): string {
  return template.replaceAll('{{selection}}', selection);
}
