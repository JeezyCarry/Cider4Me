import { describe, expect, mock, test } from 'bun:test';
import type { GeminiGenerateContentRequest } from '../src/lib/ai/providers/google-gemini/google-gemini-request';

type StreamFactory = (request: unknown) => Promise<AsyncGenerator<{ text?: string }>>;

function makeRequest(): GeminiGenerateContentRequest {
  return {
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: 'hi there' }] }],
  };
}

function makeGenaiMock(generateContentStream: StreamFactory) {
  mock.module('@google/genai', () => ({
    GoogleGenAI: class {
      models = { generateContentStream };
    },
  }));
}

describe('streamGoogleGeminiChat', () => {
  test('forwards the AbortSignal as config.abortSignal to generateContentStream', async () => {
    const controller = new AbortController();
    let captured: unknown;
    const generateContentStream: StreamFactory = mock(async (request: unknown) => {
      captured = request;
      return (async function* () {
        yield { text: 'ok' };
      })();
    });
    makeGenaiMock(generateContentStream);

    const { streamGoogleGeminiChat } = await import('../src/lib/ai/providers/google-gemini/google-gemini-client');

    await streamGoogleGeminiChat(makeRequest(), 'AIza-key', controller.signal, {
      onChunk: mock(() => {}),
      onComplete: mock(() => {}),
      onError: mock(() => {}),
    });

    const requestWithAbort = captured as { config?: { abortSignal?: AbortSignal }; model: string };
    expect(generateContentStream).toHaveBeenCalledTimes(1);
    expect(requestWithAbort.model).toBe('gemini-2.5-flash');
    expect(requestWithAbort.config?.abortSignal).toBe(controller.signal);
  });

  test('does not call onError nor onComplete when aborted during streaming', async () => {
    const controller = new AbortController();
    const generateContentStream: StreamFactory = mock(async () => {
      return (async function* () {
        controller.abort();
        yield { text: undefined };
        throw new DOMException('The operation was aborted.', 'AbortError');
      })();
    });
    makeGenaiMock(generateContentStream);

    const { streamGoogleGeminiChat } = await import('../src/lib/ai/providers/google-gemini/google-gemini-client');

    const onChunk = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await streamGoogleGeminiChat(makeRequest(), 'AIza-key', controller.signal, { onChunk, onComplete, onError });

    expect(onChunk).not.toHaveBeenCalled();
    expect(onComplete).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  test('calls onComplete with aggregated content on a clean stream', async () => {
    const controller = new AbortController();
    const generateContentStream: StreamFactory = mock(async () => {
      return (async function* () {
        yield { text: 'Hel' };
        yield { text: 'lo' };
      })();
    });
    makeGenaiMock(generateContentStream);

    const { streamGoogleGeminiChat } = await import('../src/lib/ai/providers/google-gemini/google-gemini-client');

    const onChunk = mock(() => {});
    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await streamGoogleGeminiChat(makeRequest(), 'AIza-key', controller.signal, { onChunk, onComplete, onError });

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ content: 'Hello' });
    expect(onError).not.toHaveBeenCalled();
  });

  test('rethrows non-abort streaming errors', async () => {
    const controller = new AbortController();
    const generateContentStream: StreamFactory = mock(async () => {
      return (async function* () {
        yield { text: undefined };
        throw new Error('Upstream failure');
      })();
    });
    makeGenaiMock(generateContentStream);

    const { streamGoogleGeminiChat } = await import('../src/lib/ai/providers/google-gemini/google-gemini-client');

    const onComplete = mock(() => {});
    const onError = mock(() => {});

    await expect(
      streamGoogleGeminiChat(makeRequest(), 'AIza-key', controller.signal, {
        onChunk: mock(() => {}),
        onComplete,
        onError,
      }),
    ).rejects.toThrow('Upstream failure');

    expect(onComplete).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
