import { normalizeProviderApiKey } from '../ai/openai-compatible-url';
import type { AppSettings, PublicAppSettings, SettingsSecrets } from './types';

const SECRET_METADATA_KEYS = new Set([
  'apikey',
  'api_key',
  'authorization',
  'bearer',
  'token',
  'secret',
  'password',
  'credential',
]);

/**
 * Normalizes stored provider API keys (trim whitespace from copy/paste).
 */
export function normalizeProviderSecrets(secrets: SettingsSecrets | undefined): SettingsSecrets {
  const result: SettingsSecrets = {};
  if (!secrets) return result;
  for (const [providerId, apiKey] of Object.entries(secrets)) {
    result[providerId] = normalizeProviderApiKey(apiKey);
  }
  return result;
}

/**
 * Settings never embed API keys (they live in the secrets store), so this is
 * a pass-through kept for API compatibility.
 */
export function toPublicSettings(settings: AppSettings): PublicAppSettings {
  return settings;
}

/**
 * Redacts secret-like values from debug log metadata.
 */
export function sanitizeLogMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    sanitized[key] = sanitizeLogMetadataValue(key, value);
  }
  return sanitized;
}

function sanitizeLogMetadataValue(key: string, value: unknown): unknown {
  if (isSecretMetadataKey(key)) {
    return '[redacted]';
  }

  if (Array.isArray(value)) {
    return value.map((entry) => (typeof entry === 'object' && entry !== null ? sanitizeLogObject(entry as Record<string, unknown>) : entry));
  }

  if (typeof value === 'object' && value !== null) {
    return sanitizeLogObject(value as Record<string, unknown>);
  }

  return value;
}

function sanitizeLogObject(value: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value)) {
    sanitized[key] = sanitizeLogMetadataValue(key, entry);
  }
  return sanitized;
}

function isSecretMetadataKey(key: string): boolean {
  const normalized = key.replace(/[^a-z0-9]/gi, '').toLowerCase();
  if (SECRET_METADATA_KEYS.has(normalized)) return true;
  return normalized.includes('apikey') || normalized.endsWith('key') && normalized.includes('api');
}

/**
 * Returns true when a persisted settings object still embeds legacy provider
 * API keys (pre-migration shape) that must be split out.
 */
export function persistedSettingsContainApiKeys(settings: unknown): boolean {
  if (!settings || typeof settings !== 'object') return false;
  const record = settings as {
    apiKey?: string;
    openRouter?: { apiKey?: string };
    googleGemini?: { apiKey?: string };
    providers?: Array<{ apiKey?: string }>;
  };
  if (typeof record.apiKey === 'string' && record.apiKey.length > 0) return true;
  if (typeof record.openRouter?.apiKey === 'string' && record.openRouter.apiKey.length > 0) return true;
  if (typeof record.googleGemini?.apiKey === 'string' && record.googleGemini.apiKey.length > 0) return true;
  if (Array.isArray(record.providers)) {
    return record.providers.some((provider) => typeof provider?.apiKey === 'string' && provider.apiKey.length > 0);
  }
  return false;
}
