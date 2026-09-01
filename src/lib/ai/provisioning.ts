import {
  createOpenAICompatible,
  type OpenAICompatibleProvider,
} from "@ai-sdk/openai-compatible";
import { streamText, type ModelMessage } from "ai";
import type { ChatStreamInput, StreamHandlers } from "./provider-adapter";
import {
  isOpenRouterBaseUrl,
  normalizeProviderApiKey,
} from "./openai-compatible-url";
import { getI18n } from "../i18n";
import { writeDebugLog } from "../../background/services/debug-log-service";
import type {
  ProviderContentPart,
  ProviderMessage,
  WebSearchSource,
} from "../shared/types";
import { streamGoogleGeminiChat } from "./providers/google-gemini/google-gemini-client";
import { buildGoogleGeminiRequestPayload } from "./providers/google-gemini/google-gemini-request";

function truncate(text: string, length = 160): string {
  return text.length > length ? `${text.slice(0, length)}…` : text;
}

type SdkContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string };

function toSdkContentPart(part: ProviderContentPart): SdkContentPart {
  if (part.type === "text") {
    return { type: "text", text: part.text };
  }
  return { type: "image", image: part.image_url.url };
}

/**
 * Collects system-message content into a single `instructions` string.
 * The Vercel AI SDK (v7) rejects system messages inside `messages`; they must be
 * passed via the top-level `instructions` option instead.
 */
function extractSystemInstructions(messages: ProviderMessage[]): string {
  return messages
    .filter((message) => message.role === "system")
    .map((message) => {
      if (typeof message.content === "string") return message.content;
      return message.content
        .map((part) => (part.type === "text" ? part.text : ""))
        .filter(Boolean)
        .join("\n");
    })
    .filter(Boolean)
    .join("\n\n");
}

function toSdkMessages(messages: ProviderMessage[]): ModelMessage[] {
  const sdk: ModelMessage[] = [];

  for (const message of messages) {
    // System messages are not allowed in the messages array by the AI SDK.
    if (message.role === "system") continue;

    if (typeof message.content === "string") {
      sdk.push({ role: message.role, content: message.content });
      continue;
    }

    // Multimodal content is only produced for user messages.
    sdk.push({
      role: "user",
      content: message.content.map((part) => toSdkContentPart(part)),
    });
  }

  return sdk;
}

function buildOpenAiCompatibleModel(
  provider: ChatStreamInput["provider"],
  apiKey: string,
): OpenAICompatibleProvider {
  return createOpenAICompatible({
    name: provider.id,
    baseURL: provider.baseUrl || "https://openrouter.ai/api/v1",
    apiKey,
    ...(isOpenRouterBaseUrl(provider.baseUrl)
      ? {
          headers: {
            "HTTP-Referer": "https://siderfor.me",
            "X-Title": "Sider for Me",
          },
        }
      : {}),
  });
}

function summarizeMessages(
  messages: ProviderMessage[],
): Array<Record<string, unknown>> {
  return messages.map((message) => {
    if (typeof message.content === "string") {
      return {
        role: message.role,
        textLength: message.content.length,
        preview: truncate(message.content),
      };
    }
    return {
      role: message.role,
      hasImage: message.content.some((part) => part.type === "image_url"),
      parts: message.content.map((part) =>
        part.type === "text"
          ? { type: "text", textLength: part.text.length }
          : { type: "image", imageDataUrlLength: part.image_url.url.length },
      ),
    };
  });
}

async function streamOpenAiCompatible(
  input: ChatStreamInput,
  handlers: StreamHandlers,
): Promise<void> {
  if (!input.provider.baseUrl?.trim()) {
    throw new Error(getI18n(input.locale).errors.missingApiBaseUrl);
  }

  const apiKey = normalizeProviderApiKey(input.apiKey);
  if (!apiKey) {
    throw new Error(getI18n(input.locale).errors.missingApiKey);
  }

  const provider = buildOpenAiCompatibleModel(input.provider, apiKey);
  const model = provider.languageModel(input.model.id);

  await writeDebugLog("debug", "provisioning", "Chat request payload summary", {
    provider: input.provider.id,
    model: input.model.id,
    webSearchEnabled: input.model.webSearchEnabled,
    messageCount: input.messages.length,
    messageSummaries: summarizeMessages(input.messages),
  });

  const systemInstructions = extractSystemInstructions(input.messages);

  // OpenRouter takes a nested reasoning object; other OpenAI-compatible
  // endpoints (Cortecs et al.) take a top-level reasoning_effort string.
  const reasoningOptions =
    input.model.thinkingLevel === undefined
      ? {}
      : isOpenRouterBaseUrl(input.provider.baseUrl)
        ? { reasoning: { effort: input.model.thinkingLevel } }
        : { reasoning_effort: input.model.thinkingLevel };

  let streamError: unknown;
  const result = streamText({
    model,
    messages: toSdkMessages(input.messages),
    ...(systemInstructions ? { instructions: systemInstructions } : {}),
    abortSignal: input.signal,
    ...(input.model.webSearchEnabled || input.model.thinkingLevel !== undefined
      ? {
          providerOptions: {
            openaiCompatible: {
              ...(input.model.webSearchEnabled
                ? { plugins: [{ id: "web" }] }
                : {}),
              ...reasoningOptions,
            },
          },
        }
      : {}),
    // Mute the SDK default (console.error) and only record the error so a
    // silent zero-output upstream failure can be surfaced as a real error.
    onError: ({ error }) => {
      streamError = error;
    },
  });

  let aggregated = "";
  try {
    for await (const delta of result.textStream) {
      if (input.signal.aborted) break;
      if (delta) {
        aggregated += delta;
        handlers.onChunk(delta);
      }
    }
  } catch (error) {
    if (input.signal.aborted) return;
    await writeDebugLog("error", "provisioning", "Chat request failed", {
      provider: input.provider.id,
      error: error instanceof Error ? error.message : String(error),
    });
    handlers.onError(error);
    return;
  }

  if (input.signal.aborted) return;

  // The SDK can swallow upstream errors (e.g. 404) into a silent zero-output
  // stream. If that happened, surface it as an error instead of an empty success.
  if (streamError && aggregated === "") {
    await writeDebugLog("error", "provisioning", "Chat request failed", {
      provider: input.provider.id,
      error:
        streamError instanceof Error
          ? streamError.message
          : String(streamError),
    });
    handlers.onError(streamError);
    return;
  }

  let sources: WebSearchSource[] = [];
  try {
    const finalResult = await result;
    const providerSources = await finalResult.sources;
    sources = (providerSources ?? [])
      .filter((source) => source.sourceType === "url")
      .map((source) => ({ url: source.url, title: source.title }));
  } catch {
    // Sources are best-effort; a failed resolution must not fail the request.
  }

  const usage = await Promise.resolve(result.usage).catch(() => undefined);
  await writeDebugLog("debug", "provisioning", "Chat response summary", {
    provider: input.provider.id,
    contentLength: aggregated.length,
    preview: truncate(aggregated),
    usage,
    sourceCount: sources.length,
  });
  handlers.onComplete({ content: aggregated, usage, sources });
}

async function streamGoogleGemini(
  input: ChatStreamInput,
  handlers: StreamHandlers,
): Promise<void> {
  if (!input.apiKey.trim()) {
    throw new Error(getI18n(input.locale).errors.missingGoogleGeminiApiKey);
  }

  const requestPayload = buildGoogleGeminiRequestPayload(input.model, {
    model: input.model.id,
    messages: input.messages,
  });

  await writeDebugLog(
    "debug",
    "provisioning",
    "Google Gemini request payload summary",
    {
      provider: input.provider.id,
      model: requestPayload.model,
      googleSearchEnabled: Boolean(
        requestPayload.config?.tools?.some((tool) => "googleSearch" in tool),
      ),
      messageCount: requestPayload.contents.length,
      hasImage: requestPayload.contents.some((entry) =>
        entry.parts.some((part) => "inlineData" in part),
      ),
    },
  );

  await streamGoogleGeminiChat(requestPayload, input.apiKey, input.signal, {
    onChunk: handlers.onChunk,
    onComplete: async ({ content, usage }) => {
      await writeDebugLog(
        "debug",
        "provisioning",
        "Google Gemini response summary",
        {
          provider: input.provider.id,
          contentLength: content.length,
          preview: truncate(content),
          usage,
        },
      );
      handlers.onComplete({ content, usage });
    },
    onError: async (error) => {
      await writeDebugLog(
        "error",
        "provisioning",
        "Google Gemini request failed",
        {
          provider: input.provider.id,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      handlers.onError(error);
    },
  });
}

/**
 * Streams a chat completion for any supported provider type.
 */
export async function streamChat(
  input: ChatStreamInput,
  handlers: StreamHandlers,
): Promise<void> {
  if (input.provider.type === "google-gemini") {
    await streamGoogleGemini(input, handlers);
    return;
  }

  // openrouter and openai-compatible both speak the OpenAI chat completions API.
  await streamOpenAiCompatible(input, handlers);
}
