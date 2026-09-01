import browser from 'webextension-polyfill';
import type { RuntimeMessage } from '../shared/messages';
import { toPlainData } from '../shared/clone';
import { siderLogWarn } from './sider-log';

export async function sendRuntimeMessage<TResponse = unknown>(message: RuntimeMessage): Promise<TResponse> {
  if (typeof browser === 'undefined' || !browser.runtime || !browser.runtime.sendMessage) {
    siderLogWarn('runtime', 'browser.runtime.sendMessage not found, likely standalone');
    return undefined as unknown as TResponse;
  }
  return (await browser.runtime.sendMessage(toPlainData(message))) as TResponse;
}

export function connectRuntimePort(name: string): browser.Runtime.Port {
  if (typeof browser === 'undefined' || !browser.runtime || !browser.runtime.connect) {
    siderLogWarn('runtime', 'browser.runtime.connect not found, likely standalone');
    return { name, onMessage: { addListener: () => {} }, onDisconnect: { addListener: () => {} }, disconnect: () => {}, postMessage: () => {} } as unknown as browser.Runtime.Port;
  }
  return browser.runtime.connect({ name });
}

export function getAssetUrl(path: string): string {
  if (typeof browser === 'undefined' || !browser.runtime || !browser.runtime.getURL) {
    return path;
  }
  return browser.runtime.getURL(path);
}
