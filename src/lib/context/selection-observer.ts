import { EXTENSION_ROOT_ID } from '../shared/constants';
import { siderLogInfo } from '../browser/sider-log';

export interface ObservedSelection {
  text: string;
  rect: DOMRect | null;
  source: 'page' | 'extension' | 'toolbar';
}

function isNodeInsideExtensionRoot(node: Node | null, documentRef: Document): boolean {
  if (!node) return false;

  const host = documentRef.getElementById(EXTENSION_ROOT_ID);
  if (!host) return false;

  let currentNode: Node | null = node;

  while (currentNode) {
    if (currentNode === host || host.contains(currentNode)) return true;

    const rootNode = currentNode.getRootNode?.();
    if (rootNode === host.shadowRoot) return true;

    if (rootNode && 'host' in rootNode && rootNode.host instanceof Node) {
      currentNode = rootNode.host;
      continue;
    }

    currentNode = currentNode.parentNode;
  }

  return false;
}

function getElementFromNode(node: Node | null, documentRef: Document): Element | null {
  if (!node) return null;
  return node.nodeType === documentRef.ELEMENT_NODE ? (node as Element) : node.parentElement;
}

function resolveSelectionSource(selection: Selection, range: Range, documentRef: Document): ObservedSelection['source'] {
  const candidateNodes = [selection.anchorNode, selection.focusNode, range.commonAncestorContainer];
  const sourceNode = candidateNodes.find((node) => isNodeInsideExtensionRoot(node, documentRef));
  if (!sourceNode) return 'page';

  const element = getElementFromNode(sourceNode, documentRef) ?? getElementFromNode(range.commonAncestorContainer, documentRef);
  if (element?.closest('[data-selection-toolbar="true"]')) return 'toolbar';

  return 'extension';
}

/**
 * Delay before reporting a selection after a mouse-up.
 * A double/triple-click (`detail >= 2`) fires several mouse-up events in quick
 * succession; using a longer delay there keeps the popup from appearing while
 * the sequence is still finishing, so a later click can't accidentally select
 * the popup content instead of the page text.
 */
export function resolvePopupDebounceDelay(detail: number): number {
  return detail >= 2 ? 400 : 250;
}

export function getCurrentSelection(documentRef: Document = document): ObservedSelection | null {
  if (!documentRef.hasFocus()) return null;

  const selection = documentRef.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

  const text = selection.toString().trim();
  if (!text) return null;

  const range = selection.getRangeAt(0);
  const source = resolveSelectionSource(selection, range, documentRef);
  
  siderLogInfo('selection', 'detected', { text: text.slice(0, 20), source, isCollapsed: selection.isCollapsed });

  if (source !== 'page') {
    return { text, rect: null, source };
  }

  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) {
    siderLogInfo('selection', 'no valid rect');
    return null;
  }

  return { text, rect, source };
}

export function observeSelection(onChange: (selection: ObservedSelection | null) => void): () => void {
  let timeout: number | undefined;
  let isMouseSelecting = false;
  let suppressSelectionsUntil = 0;
  let lastMouseUpTime = 0;

  const isSelectionSuppressed = (): boolean => Date.now() < suppressSelectionsUntil;

  const schedule = (delay = 15): void => {
    if (timeout) window.clearTimeout(timeout);
    timeout = window.setTimeout(() => {
      const current = getCurrentSelection();
      onChange(isSelectionSuppressed() ? null : current);
    }, delay);
  };

  const clearSuppression = (): void => {
    suppressSelectionsUntil = 0;
  };

  const suppressSelection = (durationMs = 1500): void => {
    suppressSelectionsUntil = Date.now() + durationMs;
  };

  const handleMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return;
    isMouseSelecting = true;
    clearSuppression();
    if (timeout) {
      window.clearTimeout(timeout);
      timeout = undefined;
    }
  };

  const handleMouseUp = (event: MouseEvent): void => {
    if (event.button !== 0) return;
    isMouseSelecting = false;
    lastMouseUpTime = Date.now();

    if (event.detail === 1) {
      schedule(250);
    } else if (event.detail >= 2) {
      schedule(resolvePopupDebounceDelay(event.detail));
    }
  };

  const handleSelectionChange = (): void => {
    if (isMouseSelecting) return;
    if (Date.now() - lastMouseUpTime < 250) return;
    schedule(15);
  };

  const handleKeyUp = (): void => {
    schedule(15);
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'f') {
      suppressSelection();
      schedule(0);
    }
  };

  const handleWindowBlur = (): void => {
    schedule(0);
  };

  document.addEventListener('mousedown', handleMouseDown);
  document.addEventListener('keydown', handleKeyDown);
  document.addEventListener('selectionchange', handleSelectionChange);
  document.addEventListener('mouseup', handleMouseUp);
  document.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', handleWindowBlur);

  return () => {
    if (timeout) window.clearTimeout(timeout);
    document.removeEventListener('mousedown', handleMouseDown);
    document.removeEventListener('keydown', handleKeyDown);
    document.removeEventListener('selectionchange', handleSelectionChange);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('keyup', handleKeyUp);
    window.removeEventListener('blur', handleWindowBlur);
  };
}
