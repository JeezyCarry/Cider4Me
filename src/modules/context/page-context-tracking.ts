import { contentSettingsState } from '../settings/content/settings-state.svelte';
import { contextState } from './context-state.svelte';
import { overlayState } from '../overlay/overlay-state.svelte';
import { ensureFreshPageContext, markPageContextStale, resetPageScopedContext } from './context-actions';

function refreshPageContextIfNeeded(): void {
  if (overlayState.isSidebarOpen && contentSettingsState.settings.autoReadPage) {
    void ensureFreshPageContext();
  }
}

export function startPageContextTracking(): () => void {
  let currentHref = window.location.href;
  let mutationTimeout: number | null = null;
  let navigationInterval: number | null = null;

  const handleUrlTransition = (): void => {
    if (window.location.href !== currentHref) {
      currentHref = window.location.href;
      resetPageScopedContext('url');
    } else {
      markPageContextStale('history');
    }
    refreshPageContextIfNeeded();
  };

  const handleFocus = (): void => {
    if (!contextState.pageContextEnabled) return;
    markPageContextStale('focus');
  };

  const handleVisibilityChange = (): void => {
    if (!contextState.pageContextEnabled || document.visibilityState !== 'visible') return;
    markPageContextStale('visibility');
    refreshPageContextIfNeeded();
  };

  const historyRef = window.history;
  const originalPushState = historyRef.pushState.bind(historyRef);
  const originalReplaceState = historyRef.replaceState.bind(historyRef);

  try {
    historyRef.pushState = function pushState(...args) {
      const result = originalPushState(...args);
      handleUrlTransition();
      return result;
    };

    historyRef.replaceState = function replaceState(...args) {
      const result = originalReplaceState(...args);
      handleUrlTransition();
      return result;
    };
  } catch {
    navigationInterval = window.setInterval(() => {
      if (window.location.href !== currentHref) {
        handleUrlTransition();
      }
    }, 500);
  }

  const handlePopState = (): void => {
    handleUrlTransition();
  };

  const observer = new MutationObserver((mutations) => {
    if (!contextState.pageContextEnabled) return;

    const hasMeaningfulMutation = mutations.some((mutation) => {
      if (mutation.type === 'characterData') return Boolean(mutation.target.textContent?.trim());
      return mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0;
    });

    if (!hasMeaningfulMutation) return;
    if (mutationTimeout) window.clearTimeout(mutationTimeout);
    mutationTimeout = window.setTimeout(() => {
      markPageContextStale('dom');
    }, 500);
  });

  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  window.addEventListener('focus', handleFocus);
  window.addEventListener('popstate', handlePopState);

  return () => {
    window.removeEventListener('focus', handleFocus);
    window.removeEventListener('popstate', handlePopState);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    observer.disconnect();
    if (mutationTimeout) window.clearTimeout(mutationTimeout);
    if (navigationInterval) window.clearInterval(navigationInterval);
    try {
      historyRef.pushState = originalPushState;
      historyRef.replaceState = originalReplaceState;
    } catch {
      // ignore cleanup failures on browsers that expose non-writable History methods
    }
  };
}
