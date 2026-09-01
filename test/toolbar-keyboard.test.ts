import { describe, expect, it, beforeEach } from 'bun:test';
import { EXTENSION_ROOT_ID } from '../src/lib/shared/constants';
import { resolveToolbarEnterAction } from '../src/modules/selection/toolbar-keyboard';

function dispatchEnter(target: Node | null): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true });
  Object.defineProperty(event, 'composedPath', {
    value: () => {
      const path: EventTarget[] = [];
      let node: Node | null = target;
      while (node) {
        path.push(node);
        node = node.parentNode;
      }
      return path;
    },
  });
  return event;
}

describe('resolveToolbarEnterAction', () => {
  let host: HTMLElement;

  beforeEach(() => {
    document.body.innerHTML = '';
    host = document.createElement('div');
    host.id = EXTENSION_ROOT_ID;
    document.body.append(host);
  });

  it('returns submit-popup when the event originates in the popup input', () => {
    const input = document.createElement('input');
    host.append(input);

    const action = resolveToolbarEnterAction(dispatchEnter(input), input, host);

    expect(action).toBe('submit-popup');
  });

  it('returns ignore for events inside the extension host that are not the popup input', () => {
    const wrapper = document.createElement('div');
    wrapper.append(document.createElement('span'));
    host.append(wrapper);

    const action = resolveToolbarEnterAction(dispatchEnter(wrapper.firstChild), null, host);

    expect(action).toBe('ignore');
  });

  it('returns ignore for an editable element on the page', () => {
    const cases: Array<{ el: HTMLElement; name: string }> = [
      { el: document.createElement('input'), name: 'input' },
      { el: document.createElement('textarea'), name: 'textarea' },
      { el: document.createElement('div'), name: 'contenteditable' },
    ];

    for (const { el, name } of cases) {
      if (name === 'contenteditable') {
        Object.defineProperty(el, 'isContentEditable', { value: true, configurable: true });
      }
      document.body.append(el);
      const action = resolveToolbarEnterAction(dispatchEnter(el), null, null);
      expect(action, name).toBe('ignore');
      el.remove();
    }
  });

  it('returns search for events on the page body', () => {
    const action = resolveToolbarEnterAction(dispatchEnter(document.body), null, host);

    expect(action).toBe('search');
  });
});
