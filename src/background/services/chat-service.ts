import type { ChatRequestMessage } from '../../lib/shared/messages';
import { findModelByRef } from '../../lib/shared/model-registry';
import { streamChat } from '../../lib/ai/provisioning';
import { getSettingsWithSecrets } from '../../lib/browser/storage';
import type { WebSearchSource } from '../../lib/shared/types';

export async function handleChatRequest(
  message: ChatRequestMessage,
  signal: AbortSignal,
  handlers: {
    onChunk: (chunk: string) => void;
    onSuccess: (content: string, sources: WebSearchSource[] | undefined) => void;
    onError: (error: unknown) => void;
  },
): Promise<void> {
  const { settings, secrets } = await getSettingsWithSecrets();
  const resolvedModelRef = message.payload.model || settings.defaultModelId;
  const resolved = findModelByRef(settings, resolvedModelRef);

  if (!resolved) {
    throw new Error(`Configured model not found: ${resolvedModelRef}`);
  }

  const { provider, model } = resolved;
  const apiKey = secrets[provider.id] ?? '';

  await streamChat(
    {
      provider,
      model,
      apiKey,
      messages: message.payload.messages,
      locale: settings.locale,
      signal,
    },
    {
      onChunk: handlers.onChunk,
      onComplete: ({ content, sources }) => handlers.onSuccess(content, sources),
      onError: handlers.onError,
    },
  );
}
