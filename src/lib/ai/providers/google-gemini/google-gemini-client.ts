import { GoogleGenAI } from '@google/genai';
import type { StreamHandlers } from '../../provider-adapter';
import type { GeminiGenerateContentRequest } from './google-gemini-request';

export function createGoogleGenAI(apiKey: string): GoogleGenAI {
  return new GoogleGenAI({ apiKey });
}

export async function streamGoogleGeminiChat(
  request: GeminiGenerateContentRequest,
  apiKey: string,
  signal: AbortSignal,
  handlers: StreamHandlers,
): Promise<void> {
  const ai = createGoogleGenAI(apiKey);

  const requestWithAbort: GeminiGenerateContentRequest = {
    ...request,
    config: {
      ...(request.config ?? {}),
      abortSignal: signal,
    },
  };

  let aggregated = '';

  try {
    const response = await ai.models.generateContentStream(requestWithAbort);

    for await (const chunk of response) {
      if (signal.aborted) {
        return;
      }
      const text = chunk.text ?? '';
      if (!text) continue;
      aggregated += text;
      handlers.onChunk(text);
    }
  } catch (error) {
    // User-triggered cancellation is not a failure: it must not surface as an
    // error or a (partial) completion upstream.
    if (signal.aborted || (error instanceof Error && error.name === 'AbortError')) {
      return;
    }
    throw error;
  }

  if (!signal.aborted) {
    await handlers.onComplete({ content: aggregated });
  }
}
