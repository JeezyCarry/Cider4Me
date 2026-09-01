import { appendDebugLog, getPublicSettings, getDebugLogs } from '../../lib/browser/storage';
import { sanitizeLogMetadata } from '../../lib/shared/settings-secrets';
import type { DebugLogRecord, LogLevel } from '../../lib/shared/types';


function writeConsoleLog(level: LogLevel, source: string, message: string, metadata?: Record<string, unknown>): void {
  const prefix = `[Sider Debug][${source}] ${message}`;
  let logger: typeof console.info;
  switch (level) {
    case 'error':
      logger = console.error;
      break;
    case 'warn':
      logger = console.warn;
      break;
    case 'debug':
      logger = console.warn;
      break;
    default:
      logger = console.info;
  }

  const safeMetadata = sanitizeLogMetadata(metadata);
  if (safeMetadata) {
    logger(prefix, safeMetadata);
    return;
  }

  logger(prefix);
}

export async function writeDebugLog(level: LogLevel, source: string, message: string, metadata?: Record<string, unknown>): Promise<void> {
  const settings = await getPublicSettings();
  if (!settings.debugMode) return;

  const safeMetadata = sanitizeLogMetadata(metadata);
  const record: DebugLogRecord = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    metadata: safeMetadata,
  };

  try {
    writeConsoleLog(level, source, message, safeMetadata);
    await appendDebugLog(record);
  } catch (error) {
    console.error(`[Sider Debug][storage] Failed to write log: ${error}`);
  }
}

export async function listDebugLogs(): Promise<DebugLogRecord[]> {
  try {
    return getDebugLogs();
  } catch (error) {
    console.error(`[Sider Debug][storage] Failed to list logs: ${error}`);
    return [];
  }
}