import { describe, expect, mock, test } from 'bun:test';
import type { ChatStreamInput } from '../src/lib/ai/provider-adapter';

function makeInput(overrides: Partial<ChatStreamInput> = {}): ChatStreamInput {
  return {
    provider: {
      id: 'openrouter',
      type: 'openrouter',
      label: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      enabled: true,
      models: [],
    },
    model: { id: 'qwen/qwen3.5-9b', label: 'Qwen', providerId: 'openrouter', enabled: true, supportsImages: true, webSearchEnabled: false },
    apiKey: 'sk-or-1',
    messages: [{ role: 'user', content: 'Hello' }],
    locale: 'en',
    signal: new AbortController().signal,
    ...overrides,
  };
}

describe('provisioning layer (OpenAI-compatible)', () => {
  test('passes OpenRouter web plugin via providerOptions when web search is enabled', async () => {
    const streamCalls: any[] = [];
    const streamText = mock((opts: any) => {
      streamCalls.push(opts);
      return {
        textStream: (async function* () {
          yield 'Hel';
          yield 'lo';
        })(),
        usage: Promise.resolve({ promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
      };
    });

    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock((opts: any) => ({
        languageModel: (id: string) => ({ id, opts }),
      })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    const chunks: string[] = [];
    let completed = false;
    await streamChat(makeInput({ model: { ...makeInput().model, webSearchEnabled: true } }), {
      onChunk: (c) => chunks.push(c),
      onComplete: (r) => {
        completed = true;
        expect(r.content).toBe('Hello');
        expect(r.usage?.totalTokens).toBe(15);
      },
      onError: mock(() => undefined),
    });

    expect(streamCalls[0]?.providerOptions).toEqual({ openaiCompatible: { plugins: [{ id: 'web' }] } });
    expect(chunks).toEqual(['Hel', 'lo']);
    expect(completed).toBe(true);
  });

  test('sends OpenRouter reasoning effort when a thinking level is set', async () => {
    const streamCalls: any[] = [];
    const streamText = mock((opts: any) => {
      streamCalls.push(opts);
      return {
        textStream: (async function* () {
          yield 'ok';
        })(),
        usage: Promise.resolve({ promptTokens: 1, completionTokens: 1, totalTokens: 2 }),
      };
    });

    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock((opts: any) => ({
        languageModel: (id: string) => ({ id, opts }),
      })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    await streamChat(
      makeInput({ model: { ...makeInput().model, thinkingLevel: 'low' } }),
      {
        onChunk: mock(() => undefined),
        onComplete: mock(() => undefined),
        onError: mock(() => undefined),
      },
    );

    expect(streamCalls[0]?.providerOptions).toEqual({
      openaiCompatible: { reasoning: { effort: 'low' } },
    });
  });

  test('sends top-level reasoning_effort for non-OpenRouter endpoints', async () => {
    const streamCalls: any[] = [];
    const streamText = mock((opts: any) => {
      streamCalls.push(opts);
      return {
        textStream: (async function* () {
          yield 'ok';
        })(),
        usage: Promise.resolve({ promptTokens: 1, completionTokens: 1, totalTokens: 2 }),
      };
    });

    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock((opts: any) => ({
        languageModel: (id: string) => ({ id, opts }),
      })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    await streamChat(
      makeInput({
        provider: { ...makeInput().provider, baseUrl: 'https://api.cortecs.ai/v1' },
        model: { ...makeInput().model, thinkingLevel: 'medium' },
      }),
      {
        onChunk: mock(() => undefined),
        onComplete: mock(() => undefined),
        onError: mock(() => undefined),
      },
    );

    expect(streamCalls[0]?.providerOptions).toEqual({
      openaiCompatible: { reasoning_effort: 'medium' },
    });
  });

  test('forwards web-search sources alongside the completed content', async () => {
    const streamCalls: any[] = [];
    const streamText = mock((opts: any) => {
      streamCalls.push(opts);
      const result: any = {
        textStream: (async function* () {
          yield 'Here is the answer';
        })(),
        usage: Promise.resolve({ promptTokens: 10, completionTokens: 5, totalTokens: 15 }),
      };
      result.sources = [
        { sourceType: 'url', id: '1', url: 'https://example.com/a', title: 'Example A' },
        { sourceType: 'url', id: '2', url: 'https://example.com/b' },
      ];
      return result;
    });

    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock(() => ({ languageModel: () => ({}) })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    let sources: any;
    await streamChat(makeInput({ model: { ...makeInput().model, webSearchEnabled: true } }), {
      onChunk: mock(() => undefined),
      onComplete: (r) => {
        sources = r.sources;
      },
      onError: mock(() => undefined),
    });

    expect(streamCalls[0]?.providerOptions).toEqual({ openaiCompatible: { plugins: [{ id: 'web' }] } });
    expect(sources).toEqual([
      { url: 'https://example.com/a', title: 'Example A' },
      { url: 'https://example.com/b', title: undefined },
    ]);
  });

  test('omits providerOptions when web search is disabled', async () => {
    const streamText = mock((_opts: any) => ({
      textStream: (async function* () {})(),
      usage: Promise.resolve(undefined),
    }));
    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock(() => ({ languageModel: () => ({}) })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');
    let completed = false;
    await streamChat(makeInput({ model: { ...makeInput().model, webSearchEnabled: false } }), {
      onChunk: mock(() => undefined),
      onComplete: () => {
        completed = true;
      },
      onError: mock(() => undefined),
    });

    expect(completed).toBe(true);
    expect(streamText.mock.calls[0]?.[0]?.providerOptions).toBeUndefined();
  });

  test('extracts system messages into the instructions option instead of the messages array', async () => {
    const streamCalls: any[] = [];
    const streamText = mock((opts: any) => {
      streamCalls.push(opts);
      return {
        textStream: (async function* () {})(),
        usage: Promise.resolve(undefined),
      };
    });

    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock(() => ({ languageModel: () => ({}) })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');
    let completed = false;
    await streamChat(
      makeInput({
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Hello' },
        ],
      }),
      {
        onChunk: mock(() => undefined),
        onComplete: () => {
          completed = true;
        },
        onError: mock(() => undefined),
      },
    );

    expect(completed).toBe(true);
    const opts = streamCalls[0];
    expect(opts?.instructions).toBe('You are a helpful assistant.');
    expect(opts?.messages).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(opts?.messages?.some((m: any) => m.role === 'system')).toBe(false);
  });

  test('throws when the API key is missing', async () => {
    mock.module('ai', () => ({ streamText: mock(() => ({})) }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock(() => ({ languageModel: () => ({}) })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');
    await expect(
      streamChat(makeInput({ apiKey: '  ' }), {
        onChunk: mock(() => undefined),
        onComplete: mock(() => undefined),
        onError: mock(() => undefined),
      }),
    ).rejects.toThrow();
  });

  test('reports an error thrown during stream iteration without completing', async () => {
    const streamError = new Error('boom during stream');
    const throwingStream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next: async () => {
            throw streamError;
          },
        };
      },
    };
    const streamText = mock(() => ({
      textStream: throwingStream,
      usage: Promise.resolve(undefined),
    }));
    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock(() => ({ languageModel: () => ({}) })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    let onErrorCalled: unknown;
    let completed = false;
    await streamChat(makeInput(), {
      onChunk: mock(() => undefined),
      onComplete: () => {
        completed = true;
      },
      onError: (e) => {
        onErrorCalled = e;
      },
    });

    expect(onErrorCalled).toBe(streamError);
    expect(completed).toBe(false);
  });

  test('silences errors and does not complete when the request is aborted', async () => {
    const controller = new AbortController();
    const abortingStream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return {
          next: async () => {
            controller.abort();
            throw new Error('AbortError');
          },
        };
      },
    };
    const streamText = mock(() => ({
      textStream: abortingStream,
      usage: Promise.resolve(undefined),
    }));
    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock(() => ({ languageModel: () => ({}) })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    let onErrorCalled = false;
    let completed = false;
    await streamChat(makeInput({ signal: controller.signal }), {
      onChunk: mock(() => undefined),
      onComplete: () => {
        completed = true;
      },
      onError: () => {
        onErrorCalled = true;
      },
    });

    expect(onErrorCalled).toBe(false);
    expect(completed).toBe(false);
  });

  test('surfaces a silent zero-output upstream error instead of an empty success', async () => {
    const upstreamError = new Error('Model not found');
    const emptyStream: AsyncIterable<string> = {
      [Symbol.asyncIterator]() {
        return { next: async () => ({ done: true as const, value: undefined }) };
      },
    };
    const streamText = mock((opts: any) => {
      // Simulate the SDK default error path: invoke the onError option we
      // passed in, then yield no text chunks at all.
      opts.onError?.({ error: upstreamError });
      return {
        textStream: emptyStream,
        usage: Promise.resolve(undefined),
      };
    });
    mock.module('ai', () => ({ streamText }));
    mock.module('@ai-sdk/openai-compatible', () => ({
      createOpenAICompatible: mock(() => ({ languageModel: () => ({}) })),
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    let onErrorCalled: unknown;
    let completed = false;
    await streamChat(makeInput(), {
      onChunk: mock(() => undefined),
      onComplete: () => {
        completed = true;
      },
      onError: (e) => {
        onErrorCalled = e;
      },
    });

    expect(onErrorCalled).toBe(upstreamError);
    expect(completed).toBe(false);
  });
});

describe('provisioning layer (Google Gemini)', () => {
  test('delegates to the Gemini client preserving Google Search grounding', async () => {
    // Mock @google/genai instead of the client module: mock.module is process-global,
    // and mocking the client module leaks into test/google-gemini-client.test.ts.
    let capturedApiKey: string | undefined;
    let capturedRequest: any;
    const generateContentStream = mock((request: any) => {
      capturedRequest = request;
      return (async function* () {
        yield { text: 'gem' };
      })();
    });
    mock.module('@google/genai', () => ({
      GoogleGenAI: class {
        constructor(opts: any) {
          capturedApiKey = opts?.apiKey;
        }
        models = { generateContentStream };
      },
    }));

    const { streamChat } = await import('../src/lib/ai/provisioning');

    const chunks: string[] = [];
    let completed = false;
    await streamChat(
      makeInput({
        provider: { id: 'google-gemini', type: 'google-gemini', label: 'Google Gemini', baseUrl: '', enabled: true, models: [] },
        model: { id: 'gemini-2.5-flash', label: 'Gemini', providerId: 'google-gemini', enabled: true, supportsImages: true, webSearchEnabled: true },
        apiKey: 'AIza-key',
      }),
      {
        onChunk: (c) => chunks.push(c),
        onComplete: () => {
          completed = true;
        },
        onError: mock(() => undefined),
      },
    );

    expect(generateContentStream).toHaveBeenCalledTimes(1);
    expect(capturedApiKey).toBe('AIza-key');
    expect(capturedRequest.config?.tools).toEqual([{ googleSearch: {} }]);
    expect(chunks).toEqual(['gem']);
    expect(completed).toBe(true);
  });
});
