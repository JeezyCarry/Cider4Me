import browser from 'webextension-polyfill';
import { getPublicSettings, savePublicSettings } from '../../../lib/browser/storage';
import { getSiteDomainForUrl } from '../../../lib/browser/site-access';
import { setLocale } from '../../../lib/i18n';
import { hideLauncherForCurrentPageLoad } from '../../overlay/overlay-state.svelte';
import { overlayState } from '../../overlay/overlay-state.svelte';
import { contentSettingsState } from './settings-state.svelte';
import { normalizeModelLabels } from '../model-config';
import { setPageContextInChat } from '../../context/context-actions';
import { STORAGE_KEYS } from '../../../lib/shared/storage-schema';
import { siderLogError, siderLogInfo } from '../../../lib/browser/sider-log';

function beginHydration(): void {
  contentSettingsState.isHydrating = true;
}

function endHydration(): void {
  queueMicrotask(() => {
    contentSettingsState.isHydrating = false;
  });
}

function applyLoadedSettings(): void {
  overlayState.sidebarWidth = contentSettingsState.settings.sidebarWidth;
  setPageContextInChat(contentSettingsState.settings.autoReadPage);
  setLocale(contentSettingsState.settings.locale);
  contentSettingsState.isLoaded = true;
}

export async function loadContentSettings(): Promise<void> {
  beginHydration();
  try {
    siderLogInfo('content', 'loadContentSettings start');
    contentSettingsState.settings = normalizeModelLabels(await getPublicSettings());
    applyLoadedSettings();
    siderLogInfo('content', 'loadContentSettings complete', {
      autoReadPage: contentSettingsState.settings.autoReadPage,
      locale: contentSettingsState.settings.locale,
    });
  } catch (error) {
    siderLogError('content', 'loadContentSettings failed', { error: String(error) });
  } finally {
    endHydration();
  }
}

export async function hideLauncherForeverForCurrentSite(): Promise<void> {
  const siteDomain = getSiteDomainForUrl(window.location.href);
  if (!siteDomain) return;

  const domains = new Set(contentSettingsState.settings.siteAccessPolicy.domains);
  domains.add(siteDomain);
  contentSettingsState.settings.siteAccessPolicy = {
    domains: Array.from(domains).sort(),
  };
  hideLauncherForCurrentPageLoad();
  await savePublicSettings(contentSettingsState.settings);
}

let storageListenerRegistered = false;

export function registerContentSettingsSync(): () => void {
  if (storageListenerRegistered) return () => undefined;

  const listener: Parameters<typeof browser.storage.onChanged.addListener>[0] = async (changes, areaName) => {
    if (areaName !== 'local' || !changes[STORAGE_KEYS.settings]) return;
    beginHydration();
    contentSettingsState.settings = normalizeModelLabels(await getPublicSettings());
    applyLoadedSettings();
    endHydration();
  };

  browser.storage.onChanged.addListener(listener);
  storageListenerRegistered = true;

  return () => {
    browser.storage.onChanged.removeListener(listener);
    storageListenerRegistered = false;
  };
}
