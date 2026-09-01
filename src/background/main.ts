import browser from 'webextension-polyfill';
import { registerChatHandler } from './handlers/chat-handler';
import { registerOptionsHandler } from './handlers/options-handler';
import { writeDebugLog } from './services/debug-log-service';
import { ensureSplitStorageLayoutAsync, getSettings } from '../lib/browser/storage';
import { initSiderDebugModeSync, siderLogInfo } from '../lib/browser/sider-log';

initSiderDebugModeSync();
void ensureSplitStorageLayoutAsync().then(() => getSettings()).then(() => {
  siderLogInfo('background', 'background starting', {
    optionsUrl: browser.runtime.getURL('options.html'),
  });
});

registerChatHandler();
registerOptionsHandler();
import { initMcpBridgeClient } from './services/mcp-bridge-client';
void initMcpBridgeClient();

void getSettings().then(() => {
  siderLogInfo('background', 'handlers registered');
});

browser.runtime.onInstalled.addListener(async () => {
  await ensureSplitStorageLayoutAsync();
  await getSettings();
  siderLogInfo('background', 'onInstalled fired', {
    optionsUrl: browser.runtime.getURL('options.html'),
  });
  await writeDebugLog('info', 'background', 'Extension installed');
});
