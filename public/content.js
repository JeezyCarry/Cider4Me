(async () => {
  const SETTINGS_KEY = 'settings.data';

  async function isDebugModeEnabledAsync() {
    const storage = globalThis.browser?.storage?.local ?? globalThis.chrome?.storage?.local;
    if (!storage?.get) return false;

    try {
      const data = await storage.get(SETTINGS_KEY);
      return Boolean(data?.[SETTINGS_KEY]?.debugMode);
    } catch {
      return false;
    }
  }

  function createLogger(debugModeEnabled) {
    return {
      info(source, message, metadata) {
        if (!debugModeEnabled) return;
        const prefix = `[Sider][${source}] ${message}`;
        if (metadata) console.info(prefix, metadata);
        else console.info(prefix);
      },
      error(source, message, metadata) {
        if (!debugModeEnabled) return;
        const prefix = `[Sider][${source}] ${message}`;
        if (metadata) console.error(prefix, metadata);
        else console.error(prefix);
      },
    };
  }

  try {
    const runtime = globalThis.browser?.runtime ?? globalThis.chrome?.runtime;
    const appUrl = runtime?.getURL ? runtime.getURL('content-app.js') : null;
    const debugModeEnabled = await isDebugModeEnabledAsync();
    const log = createLogger(debugModeEnabled);

    log.info('content-loader', 'loader start', {
      href: window.location.href,
      appUrl,
    });

    if (!appUrl) {
      log.error('content-loader', 'no runtime URL available');
      return;
    }

    await import(appUrl);
    log.info('content-loader', 'loader imported content-app.js');
  } catch (error) {
    const debugModeEnabled = await isDebugModeEnabledAsync();
    if (debugModeEnabled) {
      console.error('[Sider][content-loader] loader failed', error);
    }
  }
})();
