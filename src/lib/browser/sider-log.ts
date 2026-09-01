import browser from "webextension-polyfill";
import { STORAGE_KEYS } from "../shared/storage-schema";
import { sanitizeLogMetadata } from "../shared/settings-secrets";
import type { PublicAppSettings } from "../shared/types";

let debugModeEnabled = false;
let siderHidden = false;

/**
 * Updates the in-memory debug mode flag used to gate console logs.
 */
export function setSiderDebugModeEnabled(enabled: boolean): void {
 debugModeEnabled = enabled;
}

/**
 * Marks Sider as hidden on the current site (hide-for-now or hide-forever).
 * While hidden, no Sider console logs are emitted at any level.
 */
export function setSiderHidden(hidden: boolean): void {
 siderHidden = hidden;
}

/**
 * Returns whether Sider console logging is currently enabled.
 */
export function isSiderDebugModeEnabled(): boolean {
 return debugModeEnabled;
}

/**
 * Keeps the debug mode flag in sync when settings change in another extension context.
 */
export function initSiderDebugModeSync(): void {
 if (typeof browser === "undefined" || !browser.storage?.onChanged) return;

 browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes[STORAGE_KEYS.settings]?.newValue) return;
  setSiderDebugModeEnabled(
   (changes[STORAGE_KEYS.settings].newValue as PublicAppSettings).debugMode,
  );
 });
}

function writeLog(
 level: "info" | "warn" | "error",
 source: string,
 message: string,
 metadata?: Record<string, unknown>,
): void {
 if (!debugModeEnabled || siderHidden) return;

 const prefix = `[Sider][${source}] ${message}`;
 const logger =
  level === "error"
   ? console.error
   : level === "warn"
     ? console.warn
     : console.info;

 const safeMetadata = sanitizeLogMetadata(metadata);
 if (safeMetadata) {
  logger(prefix, safeMetadata);
  return;
 }

 logger(prefix);
}

/**
 * Writes an info-level Sider log when debug mode is enabled.
 */
export function siderLogInfo(
 source: string,
 message: string,
 metadata?: Record<string, unknown>,
): void {
 writeLog("info", source, message, metadata);
}

/**
 * Writes a warn-level Sider log when debug mode is enabled.
 */
export function siderLogWarn(
 source: string,
 message: string,
 metadata?: Record<string, unknown>,
): void {
 writeLog("warn", source, message, metadata);
}

/**
 * Writes an error-level Sider log when debug mode is enabled.
 */
export function siderLogError(
 source: string,
 message: string,
 metadata?: Record<string, unknown>,
): void {
 writeLog("error", source, message, metadata);
}
