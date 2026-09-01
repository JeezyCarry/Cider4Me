import browser from 'webextension-polyfill';
import type { ChatCancelMessage, ChatErrorMessage, ChatRequestMessage, ChatSuccessMessage, RuntimeMessage } from '../../lib/shared/messages';
import { cancelRequest, clearAbortController, setAbortController } from './cancel-handler';
import { handleChatRequest } from '../services/chat-service';
import { writeDebugLog } from '../services/debug-log-service';

function safePost(port: { postMessage: (message: unknown) => void }, message: unknown): void {
  try {
    port.postMessage(message);
  } catch {
    // Port is disconnected (client cancelled); nothing to report.
  }
}

function toErrorMessage(requestId: string, error: unknown): ChatErrorMessage {
  return {
    type: 'chat.error',
    requestId,
    payload: {
      code: 'chat_failed',
      message: error instanceof Error ? error.message : 'Unknown chat error',
      retryable: true,
      source: 'background',
    },
  };
}

export function registerChatHandler(): void {
  browser.runtime.onConnect.addListener((port) => {
    if (port.name !== 'chat') return;

    port.onMessage.addListener(async (rawMessage: unknown) => {
      const message = rawMessage as RuntimeMessage;
      if (message.type !== 'chat.request') return;
      const request = message as ChatRequestMessage;
      const controller = new AbortController();
      setAbortController(request.requestId, controller);
      await writeDebugLog('info', 'chat-handler', 'Chat request started', {
        requestId: request.requestId,
        model: request.payload.model,
        messageCount: request.payload.messages.length,
      });

      try {
        await handleChatRequest(request, controller.signal, {
          onChunk(chunk) {
            safePost(port, { type: 'chat.chunk', requestId: request.requestId, payload: { content: chunk } });
          },
          onSuccess(content, sources) {
            const success: ChatSuccessMessage = { type: 'chat.success', requestId: request.requestId, payload: { content, sources } };
            safePost(port, success);
          },
          onError(error) {
            if (controller.signal.aborted) return;
            safePost(port, toErrorMessage(request.requestId, error));
          },
        });
      } catch (error) {
        if (!controller.signal.aborted) {
          await writeDebugLog('error', 'chat-handler', 'Chat request failed', {
            requestId: request.requestId,
            error: error instanceof Error ? error.message : String(error),
          });
          safePost(port, toErrorMessage(request.requestId, error));
        }
      } finally {
        clearAbortController(request.requestId);
        await writeDebugLog('info', 'chat-handler', 'Chat request finished', { requestId: request.requestId });
      }
    });
  });

  browser.runtime.onMessage.addListener((rawMessage: unknown) => {
    const message = rawMessage as RuntimeMessage;
    if (message?.type !== 'chat.cancel') return undefined;

    return (async () => {
      const cancel = message as ChatCancelMessage;
      return { cancelled: cancelRequest(cancel.requestId) };
    })();
  });
}
