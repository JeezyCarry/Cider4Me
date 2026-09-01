import type { ChatMessage, DebugLogRecord, PageContext, ProviderMessage, TokenUsage, WebSearchSource } from './types';

export interface ChatRequestMessage {
  type: 'chat.request';
  requestId: string;
  payload: {
    model: string;
    messages: ProviderMessage[];
    metadata?: {
      conversationId?: string;
      pageContext?: PageContext;
    };
  };
}

export interface ChatChunkMessage {
  type: 'chat.chunk';
  requestId: string;
  payload: {
    content: string;
  };
}

export interface ChatSuccessMessage {
  type: 'chat.success';
  requestId: string;
  payload: {
    content: string;
    usage?: TokenUsage;
    sources?: WebSearchSource[];
  };
}

export interface ChatErrorMessage {
  type: 'chat.error';
  requestId: string;
  payload: {
    code: string;
    message: string;
    retryable: boolean;
    source: string;
  };
}

export interface ChatCancelMessage {
  type: 'chat.cancel';
  requestId: string;
}

export interface SettingsOpenMessage {
  type: 'settings.open';
}

export interface DebugLogsGetMessage {
  type: 'debug.logs.get';
}

export interface DebugLogsResultMessage {
  type: 'debug.logs.result';
  payload: {
    logs: DebugLogRecord[];
  };
}

export interface OptionsStateMessage {
  type: 'options.state';
  payload: {
    settingsSummary: {
      hasApiKey: boolean;
      defaultModelId: string;
    };
  };
}

export interface ConversationHydrateMessage {
  type: 'conversation.hydrate';
  payload: {
    messages: ChatMessage[];
  };
}

export type RuntimeMessage =
  | ChatRequestMessage
  | ChatChunkMessage
  | ChatSuccessMessage
  | ChatErrorMessage
  | ChatCancelMessage
  | SettingsOpenMessage
  | DebugLogsGetMessage
  | DebugLogsResultMessage
  | OptionsStateMessage
  | ConversationHydrateMessage;
