import { describe, expect, test } from 'bun:test';
import { buildGoogleGeminiRequestPayload } from '../src/lib/ai/providers/google-gemini/google-gemini-request';
import type { ModelConfig } from '../src/lib/shared/types';

const baseModel: ModelConfig = {
  id: 'gemini-2.5-flash',
  label: 'Gemini 2.5 Flash',
  providerId: 'google-gemini',
  enabled: true,
  supportsImages: true,
  webSearchEnabled: true,
};

describe('buildGoogleGeminiRequestPayload', () => {
  test('maps text and inline image data for Gemini requests', () => {
    const payload = buildGoogleGeminiRequestPayload(baseModel, {
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: 'Use concise answers.' },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Describe this image' },
            { type: 'image_url', image_url: { url: 'data:image/png;base64,abc123' } },
          ],
        },
      ],
    });

    expect(payload.system_instruction).toEqual({
      parts: [{ text: 'Use concise answers.' }],
    });

    expect(payload.contents).toEqual([
      {
        role: 'user',
        parts: [{ text: 'Describe this image' }, { inlineData: { mimeType: 'image/png', data: 'abc123' } }],
      },
    ]);
  });

  test('adds Google Search tooling when web search is enabled', () => {
    const payload = buildGoogleGeminiRequestPayload(baseModel, {
      model: 'gemini-2.5-flash',
      messages: [{ role: 'user', content: 'What happened today?' }],
    });

    expect(payload.config?.tools).toEqual([{ googleSearch: {} }]);
  });

  test('omits Google Search tooling when disabled', () => {
    const payload = buildGoogleGeminiRequestPayload({ ...baseModel, webSearchEnabled: false }, {
      model: 'gemini-2.5-flash',
      messages: [{ role: 'assistant', content: 'Previous answer' }],
    });

    expect(payload.contents[0]).toEqual({ role: 'model', parts: [{ text: 'Previous answer' }] });
    expect(payload.config).toBeUndefined();
  });
});
