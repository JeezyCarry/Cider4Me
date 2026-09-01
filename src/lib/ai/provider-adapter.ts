import type { AppLocale, ModelConfig, ProviderInstance, ProviderMessage, TokenUsage, WebSearchSource } from '../shared/types';

export interface StreamHandlers {
  onChunk: (chunk: string) => void;
  onComplete: (result: { content: string; usage?: TokenUsage; sources?: WebSearchSource[] }) => void;
  onError: (error: unknown) => void;
}

export interface ChatStreamInput {
  provider: ProviderInstance;
  model: ModelConfig;
  apiKey: string;
  messages: ProviderMessage[];
  locale: AppLocale;
  signal: AbortSignal;
}
