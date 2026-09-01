import { describe, expect, test } from 'bun:test';
import type { ChatRequestMessage } from '../src/lib/shared/messages';

describe('message contracts', () => {
  test('chat request shape is typed and stable', () => {
    const message: ChatRequestMessage = {
      type: 'chat.request',
      requestId: 'req_1',
      payload: {
        model: 'x-ai/grok-4-fast',
        messages: [{ role: 'user', content: 'Hello' }],
      },
    };

    expect(message.type).toBe('chat.request');
    expect(message.payload.messages[0]?.role).toBe('user');
  });

  test('chat request supports multimodal user content', () => {
    const message: ChatRequestMessage = {
      type: 'chat.request',
      requestId: 'req_2',
      payload: {
        model: 'openai/gpt-4.1-mini',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe this image' },
              { type: 'image_url', image_url: { url: 'data:image/png;base64,abc123' } },
            ],
          },
        ],
      },
    };

    expect(Array.isArray(message.payload.messages[0]?.content)).toBe(true);
  });
});
