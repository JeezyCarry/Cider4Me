import { describe, expect, test } from 'bun:test';
import {
  buildOpenAiChatCompletionsUrl,
  CORTECS_OPENAI_COMPATIBLE_BASE_URL,
  DEFAULT_OPENAI_COMPATIBLE_BASE_URL,
  formatChatCompletionHttpError,
  getOpenAiCompatibleBaseUrlForPreset,
  getOpenRouterBaseUrlWarning,
  isOpenRouterBaseUrl,
  normalizeOpenAiCompatibleBaseUrl,
  normalizeProviderApiKey,
  resolveOpenAiCompatibleBaseUrlPreset,
} from '../src/lib/ai/openai-compatible-url';

describe('openai-compatible-url', () => {
  test('uses OpenRouter as the default base URL', () => {
    expect(DEFAULT_OPENAI_COMPATIBLE_BASE_URL).toBe('https://openrouter.ai/api/v1');
    expect(CORTECS_OPENAI_COMPATIBLE_BASE_URL).toBe('https://api.cortecs.ai/v1');
  });

  test('resolves built-in base URL presets', () => {
    expect(resolveOpenAiCompatibleBaseUrlPreset('https://openrouter.ai/api/v1/')).toBe('openrouter');
    expect(resolveOpenAiCompatibleBaseUrlPreset('https://api.cortecs.ai/v1')).toBe('cortecs');
    expect(resolveOpenAiCompatibleBaseUrlPreset('https://api.openai.com/v1')).toBe('custom');
    expect(getOpenAiCompatibleBaseUrlForPreset('cortecs')).toBe(CORTECS_OPENAI_COMPATIBLE_BASE_URL);
  });

  test('normalizes trailing slashes and chat completions suffix', () => {
    expect(normalizeOpenAiCompatibleBaseUrl('https://api.openai.com/v1/')).toBe('https://api.openai.com/v1');
    expect(normalizeOpenAiCompatibleBaseUrl('https://api.openai.com/v1/chat/completions')).toBe(
      'https://api.openai.com/v1',
    );
  });

  test('builds the chat completions endpoint', () => {
    expect(buildOpenAiChatCompletionsUrl('https://api.openai.com/v1')).toBe(
      'https://api.openai.com/v1/chat/completions',
    );
  });

  test('detects OpenRouter hosts', () => {
    expect(isOpenRouterBaseUrl('https://openrouter.ai/api/v1')).toBe(true);
    expect(isOpenRouterBaseUrl('https://api.openai.com/v1')).toBe(false);
  });

  test('trims API keys', () => {
    expect(normalizeProviderApiKey('  sk-or-v1-test  ')).toBe('sk-or-v1-test');
  });

  test('warns when OpenRouter base URL omits /v1', () => {
    expect(getOpenRouterBaseUrlWarning('https://openrouter.ai/api')).toBe('openrouter-missing-v1');
    expect(getOpenRouterBaseUrlWarning('https://openrouter.ai/api/v1')).toBeNull();
  });

  test('maps misleading OpenRouter 401 errors', () => {
    const message = formatChatCompletionHttpError(
      401,
      '{"error":{"message":"User not found.","code":401}}',
      'en',
      'https://openrouter.ai/api/v1',
    );
    expect(message).toContain('openrouter.ai/keys');
  });
});
