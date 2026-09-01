import { afterEach, describe, expect, it } from 'bun:test';
import { EXTENSION_ROOT_ID } from '../src/lib/shared/constants';
import { getCurrentSelection, observeSelection, resolvePopupDebounceDelay, type ObservedSelection } from '../src/lib/context/selection-observer';

interface MockSelectionOptions {
  anchorNode?: Node;
  commonAncestorContainer?: Node;
  focusNode?: Node;
  rect?: Partial<DOMRect>;
}

function mockSelection(text: string, node: Node, options: MockSelectionOptions = {}): Selection {
  const range = {
    commonAncestorContainer: options.commonAncestorContainer ?? node,
    getBoundingClientRect: () =>
      ({ top: 10, left: 20, width: 30, height: 40, bottom: 50, right: 50, x: 20, y: 10, toJSON: () => ({}), ...options.rect }) as DOMRect,
  } as unknown as Range;

  return {
    anchorNode: options.anchorNode ?? node,
    focusNode: options.focusNode ?? node,
    rangeCount: 1,
    isCollapsed: false,
    toString: () => text,
    getRangeAt: () => range,
  } as unknown as Selection;
}

document.hasFocus = () => true;

afterEach(() => {
  document.body.innerHTML = '';
  document.getSelection = () => null;
  document.hasFocus = () => true;
});

describe('getCurrentSelection', () => {
  it('returns page selections with their rect', () => {
    const node = document.createTextNode('Page selection');
    document.body.append(node);
    document.getSelection = () => mockSelection('Page selection', node);

    const result = getCurrentSelection(document);

    expect(result).toEqual({
      text: 'Page selection',
      rect: expect.objectContaining({ top: 10, left: 20, width: 30, height: 40 }),
      source: 'page',
    });
  });

  it('marks sidebar selections as extension selections', () => {
    const host = document.createElement('div');
    host.id = EXTENSION_ROOT_ID;
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('div');
    const textNode = document.createTextNode('Sidebar selection');
    wrapper.append(textNode);
    shadowRoot.append(wrapper);
    document.body.append(host);
    document.getSelection = () => mockSelection('Sidebar selection', textNode);

    const result = getCurrentSelection(document);

    expect(result).toEqual({ text: 'Sidebar selection', rect: null, source: 'extension' });
  });

  it('marks selections inside the sidebar as extension selections even when the range ancestor is outside the shadow root', () => {
    const host = document.createElement('div');
    host.id = EXTENSION_ROOT_ID;
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('div');
    const textNode = document.createTextNode('Sidebar selection');
    wrapper.append(textNode);
    shadowRoot.append(wrapper);
    document.body.append(host);
    document.getSelection = () =>
      mockSelection('Sidebar selection', textNode, {
        anchorNode: textNode,
        commonAncestorContainer: document.body,
        focusNode: textNode,
      });

    const result = getCurrentSelection(document);

    expect(result).toEqual({ text: 'Sidebar selection', rect: null, source: 'extension' });
  });

  it('marks toolbar selections separately so the popup can stay open while editing', () => {
    const host = document.createElement('div');
    host.id = EXTENSION_ROOT_ID;
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const toolbar = document.createElement('div');
    toolbar.setAttribute('data-selection-toolbar', 'true');
    const textNode = document.createTextNode('Toolbar selection');
    toolbar.append(textNode);
    shadowRoot.append(toolbar);
    document.body.append(host);
    document.getSelection = () => mockSelection('Toolbar selection', textNode);

    const result = getCurrentSelection(document);

    expect(result).toEqual({ text: 'Toolbar selection', rect: null, source: 'toolbar' });
  });

  it('ignores selections while the page does not have focus', () => {
    const node = document.createTextNode('Find result selection');
    document.body.append(node);
    document.hasFocus = () => false;
    document.getSelection = () => mockSelection('Find result selection', node);

    expect(getCurrentSelection(document)).toBeNull();
  });
});

describe('observeSelection', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.getSelection = () => null;
    document.hasFocus = () => true;
  });

  it('suppresses selection popups after the browser find shortcut', async () => {
    const node = document.createTextNode('Find result selection');
    document.body.append(node);
    document.getSelection = () => mockSelection('Find result selection', node);

    const changes: Array<ObservedSelection | null> = [];
    const stopObserving = observeSelection((selection) => changes.push(selection));

    document.dispatchEvent(
      new KeyboardEvent('keydown', {
        bubbles: true,
        ctrlKey: true,
        key: 'f',
      }),
    );
    document.dispatchEvent(new Event('selectionchange'));

    await new Promise((resolve) => setTimeout(resolve, 40));

    stopObserving();

    expect(changes.at(-1)).toBeNull();
  });

  it('uses a longer debounce delay after a double click than after a single click', () => {
    expect(resolvePopupDebounceDelay(2)).toBeGreaterThan(resolvePopupDebounceDelay(1));
    expect(resolvePopupDebounceDelay(3)).toBeGreaterThan(0);
  });

  it('does not show the popup immediately after a double click (debounce)', async () => {
    const node = document.createTextNode('dblclick selection');
    document.body.append(node);
    document.getSelection = () => mockSelection('dblclick selection', node);

    const changes: Array<ObservedSelection | null> = [];
    const stopObserving = observeSelection((selection) => changes.push(selection));

    // Simulate a double click: two mouse-down/up sequences.
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, detail: 1 }));
    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, button: 0 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, button: 0, detail: 2 }));

    // The old behaviour scheduled the popup after 50ms, which was fast enough to
    // let a third click select the popup content. After the fix nothing should be
    // reported this early.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(changes).toHaveLength(0);

    // Once the (longer) debounce window has elapsed the stable selection is reported.
    await new Promise((resolve) => setTimeout(resolve, 450));
    expect(changes.at(-1)?.text).toBe('dblclick selection');

    stopObserving();
  });
});
