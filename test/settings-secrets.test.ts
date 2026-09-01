import { describe, expect, test } from 'bun:test';
import { DEFAULT_SETTINGS } from '../src/lib/shared/constants';
import {
  normalizeProviderSecrets,
  persistedSettingsContainApiKeys,
  sanitizeLogMetadata,
  toPublicSettings,
} from '../src/lib/shared/settings-secrets';

describe('settings secrets', () => {
  test('public settings never embed API keys', () => {
    const publicSettings = toPublicSettings(DEFAULT_SETTINGS);
    expect(publicSettings.providers.length).toBeGreaterThan(0);
  });

  test('normalizes stored provider API keys by trimming whitespace', () => {
    const normalized = normalizeProviderSecrets({
      openrouter: '  sk-or-1  ',
      'google-gemini': 'AIza-abcd',
    });
    expect(normalized.openrouter).toBe('sk-or-1');
    expect(normalized['google-gemini']).toBe('AIza-abcd');
  });

  test('handles undefined secrets gracefully', () => {
    expect(normalizeProviderSecrets(undefined)).toEqual({});
  });

  test('detects legacy persisted api keys', () => {
    expect(persistedSettingsContainApiKeys({ openRouter: { apiKey: 'x' } })).toBe(true);
    expect(persistedSettingsContainApiKeys({ providers: [{ apiKey: 'x' }] })).toBe(true);
    expect(persistedSettingsContainApiKeys({ providers: [] })).toBe(false);
  });

  test('redacts secret metadata keys', () => {
    const sanitized = sanitizeLogMetadata({
      apiKey: 'secret',
      nested: { authorization: 'Bearer x' },
      count: 2,
    });
    expect(sanitized?.apiKey).toBe('[redacted]');
    expect(sanitized?.nested).toEqual({ authorization: '[redacted]' });
    expect(sanitized?.count).toBe(2);
  });
});
