import type { ChatRequestMessage } from '../../../shared/messages';
import type { ModelConfig, ProviderContentPart, ProviderMessage } from '../../../shared/types';

interface GeminiInlineDataPart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

interface GeminiTextPart {
  text: string;
}

type GeminiPart = GeminiTextPart | GeminiInlineDataPart;

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiGenerateContentRequest {
  model: string;
  contents: GeminiContent[];
  system_instruction?: {
    parts: GeminiPart[];
  };
  config?: {
    tools?: Array<{
      googleSearch: Record<string, never>;
    }>;
    abortSignal?: AbortSignal;
  };
}

function parseDataUrl(url: string): { mimeType: string; data: string } {
  const match = url.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Gemini image input must be a base64 data URL.');
  }

  return {
    mimeType: match[1],
    data: match[2],
  };
}

function mapContentPart(part: ProviderContentPart): GeminiPart {
  if (part.type === 'text') {
    return { text: part.text };
  }

  const { mimeType, data } = parseDataUrl(part.image_url.url);
  return {
    inlineData: {
      mimeType,
      data,
    },
  };
}

function mapMessage(message: ProviderMessage): GeminiContent {
  if (typeof message.content === 'string') {
    return {
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.content }],
    };
  }

  return {
    role: message.role === 'assistant' ? 'model' : 'user',
    parts: message.content.map(mapContentPart),
  };
}

export function buildGoogleGeminiRequestPayload(
  model: ModelConfig,
  message: ChatRequestMessage['payload'],
): GeminiGenerateContentRequest {
  const systemMessages = message.messages.filter((m) => m.role === 'system');
  const chatMessages = message.messages.filter((m) => m.role !== 'system');

  const systemInstruction = systemMessages.length > 0
    ? {
        parts: systemMessages.map((m) => ({
          text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
        })),
      }
    : undefined;

  return {
    model: message.model || model.id,
    contents: chatMessages.map(mapMessage),
    system_instruction: systemInstruction,
    ...(model.webSearchEnabled
      ? {
          config: {
            tools: [{ googleSearch: {} }],
          },
        }
      : {}),
  };
}
