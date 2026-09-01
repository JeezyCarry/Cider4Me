import browser from 'webextension-polyfill';
import type { Conversation, DebugLogRecord, AppSettings, PublicAppSettings, SettingsSecrets } from '../shared/types';
import {
  STORAGE_DEFAULTS,
  STORAGE_KEYS,
  migrateStorage,
  pruneDebugLogs,
  type RawStorageInput,
  type StorageShape,
} from '../shared/storage-schema';
import {
  normalizeProviderSecrets,
  persistedSettingsContainApiKeys,
  toPublicSettings,
} from '../shared/settings-secrets';
import { toPlainData } from '../shared/clone';
import { setSiderDebugModeEnabled, siderLogError, siderLogInfo, siderLogWarn } from './sider-log';

const STORAGE_TIMEOUT_MS = 2000;

async function withTimeout<T>(label: string, promise: Promise<T>, timeoutMs = STORAGE_TIMEOUT_MS): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

async function readRawStorage(): Promise<RawStorageInput> {
  if (typeof browser === 'undefined' || !browser.storage || !browser.storage.local) {
    siderLogWarn('storage', 'browser storage API not found, likely running standalone');
    return {};
  }

  const data = await withTimeout('browser.storage.local.get', browser.storage.local.get(Object.values(STORAGE_KEYS)));
  const settings = data[STORAGE_KEYS.settings] as PublicAppSettings | AppSettings | undefined;
  if (settings && 'debugMode' in settings) {
    setSiderDebugModeEnabled(settings.debugMode);
  }

  siderLogInfo('storage', 'raw storage read complete', {
    hasSettings: Boolean(data[STORAGE_KEYS.settings]),
    hasSecrets: Boolean(data[STORAGE_KEYS.secrets]),
    hasConversations: Boolean(data[STORAGE_KEYS.conversations]),
    hasDebugLogs: Boolean(data[STORAGE_KEYS.debugLogs]),
    version: data[STORAGE_KEYS.version] ?? null,
  });
  return {
    version: data[STORAGE_KEYS.version] as number | undefined,
    settings,
    secrets: data[STORAGE_KEYS.secrets] as StorageShape['secrets'] | undefined,
    conversations: data[STORAGE_KEYS.conversations] as Conversation[] | undefined,
    debugLogs: data[STORAGE_KEYS.debugLogs] as DebugLogRecord[] | undefined,
  };
}

export async function getStorageSnapshot(): Promise<StorageShape> {
  try {
    const migrated = migrateStorage(await readRawStorage());
    setSiderDebugModeEnabled(migrated.settings.debugMode);
    siderLogInfo('storage', 'migrated storage snapshot', {
      conversationCount: migrated.conversations.length,
      debugLogCount: migrated.debugLogs.length,
      defaultModelId: migrated.settings.defaultModelId,
    });
    return migrated;
  } catch (error) {
    siderLogError('storage', 'getStorageSnapshot failed, falling back to defaults', { error: String(error) });
    return STORAGE_DEFAULTS;
  }
}

/**
 * Public settings without API keys. Use in content scripts and sidebar UI.
 */
export async function getSettings(): Promise<AppSettings> {
  return (await getStorageSnapshot()).settings;
}

/**
 * Settings without API keys. Use in content scripts and sidebar UI.
 */
export async function getPublicSettings(): Promise<PublicAppSettings> {
  return (await getStorageSnapshot()).settings;
}

export interface SettingsWithSecrets {
  settings: AppSettings;
  secrets: SettingsSecrets;
}

/**
 * Settings plus the separate provider API keys. Use only in the options page
 * and background worker.
 */
export async function getSettingsWithSecrets(): Promise<SettingsWithSecrets> {
  const snapshot = await getStorageSnapshot();
  return {
    settings: snapshot.settings,
    secrets: normalizeProviderSecrets(snapshot.secrets),
  };
}

/**
 * Persists public settings plus provider secrets. Use only in the options page.
 */
export async function saveSettings(settings: AppSettings, secrets: SettingsSecrets): Promise<void> {
  setSiderDebugModeEnabled(settings.debugMode);
  siderLogInfo('storage', 'saving settings');
  await withTimeout(
    'saveSettings',
    browser.storage.local.set({
      [STORAGE_KEYS.version]: STORAGE_DEFAULTS.version,
      [STORAGE_KEYS.settings]: toPlainData(toPublicSettings(settings)),
      [STORAGE_KEYS.secrets]: toPlainData(normalizeProviderSecrets(secrets)),
    }),
  );
}

/**
 * Persists non-secret settings without overwriting stored API keys.
 */
export async function savePublicSettings(publicSettings: PublicAppSettings): Promise<void> {
  setSiderDebugModeEnabled(publicSettings.debugMode);
  siderLogInfo('storage', 'saving public settings');
  await withTimeout(
    'savePublicSettings',
    browser.storage.local.set({
      [STORAGE_KEYS.settings]: toPlainData(publicSettings),
      [STORAGE_KEYS.version]: STORAGE_DEFAULTS.version,
    }),
  );
}

export async function getConversations(): Promise<Conversation[]> {
  return (await getStorageSnapshot()).conversations;
}

export async function saveConversations(conversations: Conversation[]): Promise<void> {
  await withTimeout(
    'saveConversations',
    browser.storage.local.set({ [STORAGE_KEYS.conversations]: toPlainData(conversations), [STORAGE_KEYS.version]: STORAGE_DEFAULTS.version }),
  );
}

export async function appendDebugLog(log: DebugLogRecord): Promise<void> {
  const snapshot = await getStorageSnapshot();
  await withTimeout(
    'appendDebugLog',
    browser.storage.local.set({ [STORAGE_KEYS.debugLogs]: toPlainData(pruneDebugLogs([...snapshot.debugLogs, log])) }),
  );
}

export async function getDebugLogs(): Promise<DebugLogRecord[]> {
  return (await getStorageSnapshot()).debugLogs;
}

/**
 * Rewrites legacy combined settings into split public + secrets storage keys.
 */
export async function ensureSplitStorageLayoutAsync(): Promise<void> {
  if (typeof browser === 'undefined' || !browser.storage?.local) return;

  const raw = await readRawStorage();
  const needsSecretsKey = !raw.secrets;
  const needsPublicStrip = persistedSettingsContainApiKeys(raw.settings);
  if (!needsSecretsKey && !needsPublicStrip) return;

  const snapshot = await getStorageSnapshot();
  siderLogInfo('storage', 'migrating legacy inline API keys to split storage');
  await withTimeout(
    'ensureSplitStorageLayout',
    browser.storage.local.set({
      [STORAGE_KEYS.version]: snapshot.version,
      [STORAGE_KEYS.settings]: toPlainData(snapshot.settings),
      [STORAGE_KEYS.secrets]: toPlainData(snapshot.secrets),
    }),
  );
}
