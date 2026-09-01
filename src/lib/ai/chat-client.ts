import { connectRuntimePort, sendRuntimeMessage } from '../browser/runtime';
import type { ChatCancelMessage, ChatChunkMessage, ChatErrorMessage, ChatRequestMessage, ChatSuccessMessage, RuntimeMessage } from '../shared/messages';
import type { ProviderMessage, WebSearchSource } from '../shared/types';
import { toPlainData } from '../shared/clone';

export interface StreamCallbacks {
  onChunk: (chunk: string) => void;
  onSuccess: (content: string, sources: WebSearchSource[] | undefined) => void;
  onError: (message: ChatErrorMessage['payload']) => void;
}

export function startChatStream(requestId: string, model: string, messages: ProviderMessage[], callbacks: StreamCallbacks): () => void {
  const port = connectRuntimePort('chat');

  port.onMessage.addListener((rawMessage) => {
    const message = rawMessage as RuntimeMessage;
    if ('requestId' in message && message.requestId !== requestId) return;

    if (message.type === 'chat.chunk') callbacks.onChunk((message as ChatChunkMessage).payload.content);
    if (message.type === 'chat.success') callbacks.onSuccess((message as ChatSuccessMessage).payload.content, (message as ChatSuccessMessage).payload.sources);
    if (message.type === 'chat.error') callbacks.onError((message as ChatErrorMessage).payload);
  });

  const payload: ChatRequestMessage = {
    type: 'chat.request',
    requestId,
    payload: { model, messages },
  };

  port.postMessage(toPlainData(payload));

  return () => {
    const cancelMessage: ChatCancelMessage = { type: 'chat.cancel', requestId };
    void sendRuntimeMessage(cancelMessage);
    port.disconnect();
  };
}
