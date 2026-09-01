import { describe, expect, mock, test } from 'bun:test';
import { cancelRequest, clearAbortController, setAbortController } from '../src/background/handlers/cancel-handler';

// ---------------------------------------------------------------------------
// cancel-handler
// ---------------------------------------------------------------------------
describe('cancel-handler', () => {
  test('cancelRequest aborts with an AbortError reason', () => {
    clearAbortController('req-cancel');

    const controller = new AbortController();
    setAbortController('req-cancel', controller);
    expect(cancelRequest('req-cancel')).toBe(true);

    expect(controller.signal.aborted).toBe(true);
    expect(controller.signal.reason).toBeInstanceOf(DOMException);
    expect((controller.signal.reason as DOMException).name).toBe('AbortError');
    expect((controller.signal.reason as DOMException).message).toBe('Chat request cancelled');
  });

  test('cancelRequest returns false for an unknown requestId', () => {
    expect(cancelRequest('does-not-exist')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// chat-handler (registerChatHandler)
// ---------------------------------------------------------------------------
const runtimeState: {
  connectListener?: (port: unknown) => void;
  messageListener?: (raw: unknown) => unknown;
} = {};

let handleChatRequestImpl: (
  request: unknown,
  signal: AbortSignal,
  handlers: { onChunk?: (c: string) => void; onSuccess?: (c: string) => void; onError?: (e: unknown) => void },
) => Promise<void> = async () => {};

mock.module('webextension-polyfill', () => ({
  default: {
    runtime: {
      onConnect: {
        addListener: (fn: (port: unknown) => void) => {
          runtimeState.connectListener = fn;
        },
      },
      onMessage: {
        addListener: (fn: (raw: unknown) => unknown) => {
          runtimeState.messageListener = fn;
        },
      },
    },
  },
}));

mock.module('../src/background/services/chat-service', () => ({
  handleChatRequest: async (
    request: unknown,
    signal: AbortSignal,
    handlers: { onChunk?: (c: string) => void; onSuccess?: (c: string) => void; onError?: (e: unknown) => void },
  ) => {
    await handleChatRequestImpl(request, signal, handlers);
  },
}));

mock.module('../src/background/services/debug-log-service', () => ({
  writeDebugLog: async () => {},
}));

const { registerChatHandler } = await import('../src/background/handlers/chat-handler');

// Wire up the runtime listeners once (registerChatHandler registers the
// onConnect / onMessage hooks against the mocked polyfill).
registerChatHandler();

function makePort(postMessage: (message: unknown) => void): {
  port: unknown;
  request: (raw: unknown) => Promise<unknown>;
} {
  let onMessage: ((raw: unknown) => unknown) | undefined;
  const port = {
    name: 'chat',
    postMessage,
    onMessage: {
      addListener: (fn: (raw: unknown) => unknown) => {
        onMessage = fn;
      },
    },
  };
  return {
    port,
    request: (raw: unknown) => {
      const listener = onMessage as ((raw: unknown) => unknown) | undefined;
      return Promise.resolve(listener ? listener(raw) : undefined);
    },
  };
}

const requestMessage = {
  type: 'chat.request',
  requestId: 'req-1',
  payload: { model: 'm:1', messages: [{ role: 'user', content: 'Hi' }] },
};

describe('chat-handler', () => {
  test('does not throw an unhandled rejection when postMessage throws (disconnected port)', async () => {
    handleChatRequestImpl = async (_req, _signal, handlers) => {
      handlers.onSuccess?.('ok');
    };
    const posted: unknown[] = [];
    const { port, request } = makePort((m) => {
      posted.push(m);
      throw new Error('Attempting to use a disconnected port object');
    });

    runtimeState.connectListener?.(port);
    await expect(request(requestMessage)).resolves.toBeUndefined();
    expect(posted).toEqual([{ type: 'chat.success', requestId: 'req-1', payload: { content: 'ok', sources: undefined } }]);
  });

  test('onError does not post chat.error when the request is aborted', async () => {
    handleChatRequestImpl = async (_req, signal, handlers) => {
      await new Promise((r) => setTimeout(r, 0));
      expect(signal.aborted).toBe(true);
      handlers.onError?.(new Error('boom'));
    };
    const posted: unknown[] = [];
    const { port, request } = makePort((m) => posted.push(m));

    runtimeState.connectListener?.(port);
    const pending = request(requestMessage);

    // Cancel the request via the runtime message listener -> aborts the controller.
    runtimeState.messageListener?.({ type: 'chat.cancel', requestId: 'req-1' });

    await pending;
    expect(posted).toEqual([]);
  });

  test('onError posts chat.error when not aborted', async () => {
    handleChatRequestImpl = async (_req, _signal, handlers) => {
      handlers.onError?.(new Error('boom'));
    };
    const posted: unknown[] = [];
    const { port, request } = makePort((m) => posted.push(m));

    runtimeState.connectListener?.(port);
    await request(requestMessage);
    expect(posted).toHaveLength(1);
    expect((posted[0] as { type?: string }).type).toBe('chat.error');
    expect((posted[0] as { payload?: { message?: string } }).payload?.message).toBe('boom');
  });
});
