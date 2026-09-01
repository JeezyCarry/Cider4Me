import { describe, expect, test } from "bun:test";
import { buildChatExport } from "../src/modules/chat/chat-export";
import type { ChatMessage } from "../src/lib/shared/types";

const userMessage: ChatMessage = {
  id: "u1",
  role: "user",
  kind: "plain",
  content: "Explain this diff",
  createdAt: "2026-03-13T10:00:00.000Z",
  status: "done",
};

const assistantMessage: ChatMessage = {
  id: "a1",
  role: "assistant",
  kind: "plain",
  content: "Here is the explanation.",
  createdAt: "2026-03-13T10:00:05.000Z",
  status: "done",
};

describe("chat export assembly", () => {
  test("includes all messages", () => {
    const payload = buildChatExport({
      messages: [userMessage, assistantMessage],
      baseSystemPrompt: "You are a helpful assistant.",
      activeMode: null,
      explicitContext: [],
    });

    expect(payload.messages).toEqual([userMessage, assistantMessage]);
  });

  test("combines base system prompt with active mode prompt", () => {
    const payload = buildChatExport({
      messages: [],
      baseSystemPrompt: "You are a helpful assistant.",
      activeMode: {
        id: "mentor",
        label: "Mentor",
        systemPrompt: "Teach step by step.",
        isCustom: true,
      },
      explicitContext: [],
    });

    expect(payload.systemPrompt.combined).toBe(
      "You are a helpful assistant.\n\nTeach step by step.",
    );
    expect(payload.systemPrompt.activeMode?.id).toBe("mentor");
  });

  test("exported request payload mirrors what is actually sent", () => {
    const payload = buildChatExport({
      messages: [userMessage],
      baseSystemPrompt: "You are a helpful assistant.",
      activeMode: null,
      explicitContext: [],
      selectionContext: { text: "selected words" },
    });

    const request = payload.request;
    expect(request.messages[0]?.role).toBe("system");
    expect(request.messages[0]?.content).toContain(
      "You are a helpful assistant.",
    );
    expect(request.messages[0]?.content).toContain(
      "You are a browser-based AI assistant",
    );
    expect(request.messages.at(-1)?.content).toContain("Explain this diff");
    expect(request.messages.at(-1)?.content).toContain(
      "[Live selection]\nselected words",
    );
  });

  test("includes context fields", () => {
    const payload = buildChatExport({
      messages: [],
      baseSystemPrompt: "",
      activeMode: null,
      explicitContext: [
        {
          id: "p1",
          label: "Doc",
          text: "Pinned text",
          createdAt: "2026-03-13T09:00:00.000Z",
          priority: 0,
        },
      ],
      selectionContext: { text: "selection" },
      pageContext: {
        hash: "abc",
        title: "Title",
        url: "https://example.com",
        capturedAt: "2026-03-13T08:00:00.000Z",
        content: "",
        blocks: [],
      },
    });

    expect(payload.context.explicitContext[0]?.label).toBe("Doc");
    expect(payload.context.selectionContext?.text).toBe("selection");
    expect(payload.context.pageContext?.hash).toBe("abc");
  });

  test("keeps per-message model refs across a mid-conversation model switch", () => {
    const switchedAssistant: ChatMessage = {
      ...assistantMessage,
      id: "a2",
      modelRef: "openrouter:google/gemini-3-flash-preview",
    };
    const payload = buildChatExport({
      messages: [
        {
          ...assistantMessage,
          modelRef: "openrouter:anthropic/claude-sonnet-4",
        },
        switchedAssistant,
      ],
      baseSystemPrompt: "",
      activeMode: null,
      model: "openrouter:google/gemini-3-flash-preview",
      explicitContext: [],
    });

    expect(payload.messages[0]?.modelRef).toBe(
      "openrouter:anthropic/claude-sonnet-4",
    );
    expect(payload.messages[1]?.modelRef).toBe(
      "openrouter:google/gemini-3-flash-preview",
    );
    expect(payload.request.model).toBe(
      "openrouter:google/gemini-3-flash-preview",
    );
  });
});
