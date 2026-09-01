/**
 * Shim for standalone debugging (localhost).
 * This provides a minimal mock of the WebExtension API when running outside of an extension environment.
 */
import { siderLogInfo } from './sider-log';

if (typeof (globalThis as any).chrome === 'undefined' || !(globalThis as any).chrome.runtime) {
  siderLogInfo('debug', 'Initializing extension API shim for standalone mode');
  
  const chromeMock = {
    runtime: {
      id: 'debug-mode',
      getURL: (path: string) => path,
      sendMessage: () => Promise.resolve(),
      connect: () => ({
        onMessage: {
          addListener: () => {},
          removeListener: () => {},
          hasListener: () => false,
        },
        onDisconnect: {
          addListener: () => {},
          removeListener: () => {},
          hasListener: () => false,
        },
        disconnect: () => {},
        postMessage: () => {},
      }),
      onMessage: {
        addListener: () => {},
        removeListener: () => {},
        hasListener: () => false,
      },
    },
    storage: {
      local: {
        get: () => Promise.resolve({}),
        set: () => Promise.resolve(),
        onChanged: {
          addListener: () => {},
          removeListener: () => {},
          hasListener: () => false,
        },
      },
    },
    tabs: {
      query: () => Promise.resolve([]),
      reload: () => Promise.resolve(),
    },
  };

  (globalThis as any).chrome = chromeMock;
  
  // Some polyfills check for 'browser' as well
  if (typeof (globalThis as any).browser === 'undefined') {
    (globalThis as any).browser = chromeMock;
  }
}

export {};
