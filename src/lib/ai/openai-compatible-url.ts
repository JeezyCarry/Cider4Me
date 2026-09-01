import { getI18n } from '../i18n';
import type { AppLocale } from '../shared/types';

/** Default OpenRouter API root (append `/chat/completions` for requests). */
export const DEFAULT_OPENAI_COMPATIBLE_BASE_URL = 'https://openrouter.ai/api/v1';

/** Cortecs OpenAI-compatible API root. */
export const CORTECS_OPENAI_COMPATIBLE_BASE_URL = 'https://api.cortecs.ai/v1';

export type OpenAiCompatibleBaseUrlPresetId = 'openrouter' | 'cortecs' | 'custom';

export interface OpenAiCompatibleBaseUrlPreset {
  id: Exclude<OpenAiCompatibleBaseUrlPresetId, 'custom'>;
  baseUrl: string;
}

/** Built-in OpenAI-compatible API base URL presets for the options UI. */
export const OPENAI_COMPATIBLE_BASE_URL_PRESETS: OpenAiCompatibleBaseUrlPreset[] = [
  { id: 'openrouter', baseUrl: DEFAULT_OPENAI_COMPATIBLE_BASE_URL },
  { id: 'cortecs', baseUrl: CORTECS_OPENAI_COMPATIBLE_BASE_URL },
];

/**
 * Resolves which preset matches a stored base URL, or `custom` when none match.
 */
export function resolveOpenAiCompatibleBaseUrlPreset(baseUrl: string): OpenAiCompatibleBaseUrlPresetId {
  const normalized = normalizeOpenAiCompatibleBaseUrl(baseUrl);
  const match = OPENAI_COMPATIBLE_BASE_URL_PRESETS.find(
    (preset) => normalizeOpenAiCompatibleBaseUrl(preset.baseUrl) === normalized,
  );
  return match?.id ?? 'custom';
}

/**
 * Returns the canonical base URL for a built-in preset id.
 */
export function getOpenAiCompatibleBaseUrlForPreset(
  presetId: Exclude<OpenAiCompatibleBaseUrlPresetId, 'custom'>,
): string {
  const preset = OPENAI_COMPATIBLE_BASE_URL_PRESETS.find((entry) => entry.id === presetId);
  return preset?.baseUrl ?? DEFAULT_OPENAI_COMPATIBLE_BASE_URL;
}

/** Trims whitespace from a provider API key (common copy/paste issue). */
export function normalizeProviderApiKey(apiKey: string): string {
  return apiKey.trim();
}

/**
 * Normalizes a user-entered OpenAI-compatible API base URL.
 * Strips trailing slashes and accidental `/chat/completions` suffixes.
 */
export function normalizeOpenAiCompatibleBaseUrl(input: string): string {
  let url = input.trim();
  if (!url) return '';

  url = url.replace(/\/+$/, '');
  if (url.endsWith('/chat/completions')) {
    url = url.slice(0, -'/chat/completions'.length).replace(/\/+$/, '');
  }

  return url;
}

/**
 * Builds the streaming chat completions endpoint from a normalized base URL.
 */
export function buildOpenAiChatCompletionsUrl(baseUrl: string): string {
  const normalized = normalizeOpenAiCompatibleBaseUrl(baseUrl);
  if (!normalized) {
    throw new Error('OpenAI-compatible API base URL is not configured');
  }

  return `${normalized}/chat/completions`;
}

/**
 * Returns true when the base URL points at OpenRouter (for optional provider headers).
 */
export function isOpenRouterBaseUrl(baseUrl: string): boolean {
  try {
    const hostname = new URL(normalizeOpenAiCompatibleBaseUrl(baseUrl)).hostname.toLowerCase();
    return hostname === 'openrouter.ai' || hostname.endsWith('.openrouter.ai');
  } catch {
    return false;
  }
}

/**
 * Returns a warning when an OpenRouter base URL is missing the `/v1` segment.
 */
export function getOpenRouterBaseUrlWarning(baseUrl: string): string | null {
  if (!isOpenRouterBaseUrl(baseUrl)) return null;

  const normalized = normalizeOpenAiCompatibleBaseUrl(baseUrl);
  if (!normalized.includes('/v1')) {
    return 'openrouter-missing-v1';
  }

  return null;
}

/**
 * Maps HTTP error bodies from OpenAI-compatible providers into user-facing messages.
 */
export function formatChatCompletionHttpError(
  status: number,
  responseBody: string,
  locale: AppLocale,
  baseUrl: string,
): string {
  const copy = getI18n(locale);
  let apiMessage: string | undefined;

  try {
    const parsed = JSON.parse(responseBody) as { error?: { message?: string } };
    apiMessage = parsed.error?.message;
  } catch {
    apiMessage = undefined;
  }

  if (status === 401) {
    if (isOpenRouterBaseUrl(baseUrl) && apiMessage === 'User not found.') {
      return copy.errors.openRouterApiKeyRejected;
    }

    return apiMessage
      ? `${copy.errors.apiAuthenticationFailed}: ${apiMessage}`
      : copy.errors.apiAuthenticationFailed;
  }

  if (apiMessage) {
    return `${copy.errors.chatCompletionFailed} (${status}): ${apiMessage}`;
  }

  return `${copy.errors.chatCompletionFailed} (${status}): ${responseBody}`;
}
