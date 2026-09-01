import { DEFAULT_OPENROUTER_MODEL_ID } from "../../lib/shared/constants";
import type {
  ExplicitContextItem,
  ProviderContentPart,
  ProviderMessage,
  ProviderMessageContent,
  SelectionContext,
} from "../../lib/shared/types";

export interface PromptBuilderInput {
  userPrompt: string;
  conversationMessages: ProviderMessage[];
  explicitContext: ExplicitContextItem[];
  selectionContext?: SelectionContext | null;
  userImageUrl?: string | null;
  systemPrompt?: string | null;
  /** Composite model ref to report in the request payload; defaults when absent. */
  model?: string | null;
}

const DEFAULT_SYSTEM_PROMPT = [
  "You are a browser-based AI assistant embedded in a Firefox extension.",
  "Use provided runtime context when relevant.",
  "Be concise, accurate, and explicit when context is incomplete.",
].join(" ");

function buildNextMessageContextBlock(
  input: Pick<PromptBuilderInput, "explicitContext" | "selectionContext">,
): string {
  const sections: string[] = [];

  if (input.selectionContext?.text?.trim()) {
    sections.push(
      ["[Live selection]", input.selectionContext.text.trim()].join("\n"),
    );
  }

  const pinnedSections = input.explicitContext
    .slice()
    .sort(
      (a, b) =>
        a.priority - b.priority || a.createdAt.localeCompare(b.createdAt),
    )
    .filter((item) => item.text.trim())
    .map((item, index) =>
      [`[Pinned snippet ${index + 1}: ${item.label}]`, item.text.trim()].join(
        "\n",
      ),
    );

  sections.push(...pinnedSections);

  if (sections.length === 0) return "";

  return ["Next-message context for this request only:", ...sections].join(
    "\n\n",
  );
}

function buildUserMessage(
  input: Pick<
    PromptBuilderInput,
    "userPrompt" | "explicitContext" | "selectionContext"
  >,
): string {
  const userMessageBlock = ["[User message]", input.userPrompt.trim()].join(
    "\n",
  );
  const nextMessageContextBlock = buildNextMessageContextBlock(input);

  return nextMessageContextBlock
    ? [nextMessageContextBlock, userMessageBlock].join("\n\n")
    : userMessageBlock;
}

function buildUserContent(
  input: Pick<
    PromptBuilderInput,
    "userPrompt" | "explicitContext" | "selectionContext" | "userImageUrl"
  >,
): ProviderMessageContent {
  const text = buildUserMessage(input);

  if (!input.userImageUrl) return text;

  const content: ProviderContentPart[] = [
    { type: "text", text },
    { type: "image_url", image_url: { url: input.userImageUrl } },
  ];
  return content;
}

export function buildChatRequest(input: PromptBuilderInput): {
  model: string;
  messages: ProviderMessage[];
} {
  const combinedSystemPrompt = [
    DEFAULT_SYSTEM_PROMPT,
    input.systemPrompt?.trim(),
  ]
    .filter(Boolean)
    .join("\n\n");

  const messages: ProviderMessage[] = [
    { role: "system", content: combinedSystemPrompt },
  ];

  messages.push(...input.conversationMessages);
  messages.push({ role: "user", content: buildUserContent(input) });

  return {
    model: input.model || DEFAULT_OPENROUTER_MODEL_ID,
    messages,
  };
}
