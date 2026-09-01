import type { PageContext, PageContextInvalidationReason } from '../../lib/shared/types';
import { parsePageContextFromDocument } from '../../lib/context/page-parser';
import { getI18n } from '../../lib/i18n';
import { shouldRefreshPageContext } from '../../lib/context/page-context';
import { contextState } from './context-state.svelte';
import { contentSettingsState } from '../settings/content/settings-state.svelte';

let pendingPageContextRead: Promise<PageContext> | null = null;

function resetPageContextLifecycle(): void {
  contextState.pageContextSnapshot = null;
  contextState.pageContextStatus = 'idle';
  contextState.pageContextInvalidationReason = null;
  contextState.lastPageContextCheckAt = null;
  contextState.lastPageContextCapturedAt = null;
  contextState.pageContextError = '';
}

export async function readPageContextSnapshot(documentRef: Document = document): Promise<PageContext> {
  if (pendingPageContextRead) return pendingPageContextRead;

  contextState.pageContextStatus = 'refreshing';
  contextState.pageContextError = '';
  contextState.lastPageContextCheckAt = new Date().toISOString();

  pendingPageContextRead = Promise.resolve()
    .then(() => parsePageContextFromDocument(documentRef))
    .then((parsed) => {
      contextState.pageContextSnapshot = parsed;
      contextState.pageContextStatus = 'fresh';
      contextState.pageContextInvalidationReason = null;
      contextState.lastPageContextCapturedAt = parsed.capturedAt;
      return parsed;
    })
    .catch((error: unknown) => {
      contextState.pageContextStatus = 'error';
      contextState.pageContextError = error instanceof Error ? error.message : String(error);
      throw error;
    })
    .finally(() => {
      pendingPageContextRead = null;
    });

  return pendingPageContextRead;
}

export async function ensureFreshPageContext(documentRef: Document = document): Promise<PageContext | null> {
  if (!contextState.pageContextEnabled) return null;

  contextState.lastPageContextCheckAt = new Date().toISOString();

  if (!shouldRefreshPageContext(contextState.pageContextSnapshot, contextState.pageContextStatus)) {
    return contextState.pageContextSnapshot;
  }

  return readPageContextSnapshot(documentRef);
}

export async function ensureFreshPageContextBeforeSend(documentRef: Document = document): Promise<PageContext | null> {
  return ensureFreshPageContext(documentRef);
}

export function markPageContextStale(reason: PageContextInvalidationReason): void {
  contextState.pageContextInvalidationReason = reason;
  contextState.pageContextError = '';

  if (contextState.pageContextStatus === 'refreshing') return;
  contextState.pageContextStatus = contextState.pageContextSnapshot ? 'stale' : 'idle';
}

export function addExplicitContext(text: string, label = getI18n(contentSettingsState.settings.locale).actions.selectionContext): void {
  if (!text.trim()) return;
  contextState.explicitContextItems = [
    ...contextState.explicitContextItems,
    {
      id: crypto.randomUUID(),
      label,
      text,
      createdAt: new Date().toISOString(),
      priority: contextState.explicitContextItems.length,
    },
  ];
}

export function addPinnedNextMessageContext(text: string, label = getI18n(contentSettingsState.settings.locale).actions.pinnedSnippet): void {
  addExplicitContext(text, label);
}

export function removePinnedNextMessageContext(id: string): void {
  contextState.explicitContextItems = contextState.explicitContextItems
    .filter((item) => item.id !== id)
    .map((item, index) => ({
      ...item,
      priority: index,
    }));
}

export function clearNextMessageContext(): void {
  contextState.currentSelectionContext = null;
  contextState.explicitContextItems = [];
}

export function togglePageContextInChat(): void {
  const enabled = !contentSettingsState.settings.autoReadPage;
  contentSettingsState.settings.autoReadPage = enabled;
  contextState.pageContextEnabled = enabled;

  if (!enabled) {
    resetPageContextLifecycle();
  }
}

export function setPageContextInChat(enabled: boolean): void {
  contextState.pageContextEnabled = enabled;
}

export function resetPageScopedContext(reason: PageContextInvalidationReason = 'url'): void {
  resetPageContextLifecycle();
  contextState.pageContextInvalidationReason = reason;
  clearNextMessageContext();
  contextState.pageContextEnabled = contentSettingsState.settings.autoReadPage;
}
