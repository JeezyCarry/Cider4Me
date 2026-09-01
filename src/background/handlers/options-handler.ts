import browser from 'webextension-polyfill';
import type { DebugLogsGetMessage, RuntimeMessage, SettingsOpenMessage } from '../../lib/shared/messages';
import { getSettings } from '../../lib/browser/storage';
import { listDebugLogs } from '../services/debug-log-service';
import { siderLogError, siderLogInfo, siderLogWarn } from '../../lib/browser/sider-log';

export function registerOptionsHandler(): void {
  browser.runtime.onMessage.addListener((rawMessage: unknown) => {
    const message = rawMessage as RuntimeMessage;

    if (message.type === 'settings.open') {
      return (async () => {
        const _msg = message as SettingsOpenMessage;
        siderLogInfo('options-handler', 'opening options page');
        try {
          await browser.runtime.openOptionsPage();
          return { opened: true, via: _msg.type };
        } catch (error) {
          siderLogWarn('options-handler', 'openOptionsPage failed, trying tabs.create', { error: String(error) });
          try {
            await browser.tabs.create({ url: browser.runtime.getURL('options.html') });
            return { opened: true, via: `${_msg.type}.fallback` };
          } catch (fallbackError) {
            siderLogError('options-handler', 'fallback to tabs.create failed', { error: String(fallbackError) });
            return { opened: false, error: String(fallbackError) };
          }
        }
      })();
    }

    if (message.type === 'debug.logs.get') {
      return (async () => {
        const _msg = message as DebugLogsGetMessage;
        const settings = await getSettings();
        return { type: 'debug.logs.result', payload: { logs: settings.debugMode ? await listDebugLogs() : [] }, via: _msg.type };
      })();
    }

    return undefined;
  });
}
