import { describe, expect, test } from "bun:test";
import { buildChatRequest } from "../src/modules/chat/prompt-builder";

describe("prompt builder", () => {
  test("builds system + user messages", () => {
    const request = buildChatRequest({
      userPrompt: "Summarize this page",
      conversationMessages: [],
      explicitContext: [],
      selectionContext: null,
    });

    expect(request.messages[0]?.role).toBe("system");
    expect(request.messages.at(-1)?.content).toBe(
      "[User message]\nSummarize this page",
    );
  });

  test("uses the passed model ref instead of the default", () => {
    const request = buildChatRequest({
      userPrompt: "Summarize this page",
      conversationMessages: [],
      explicitContext: [],
      selectionContext: null,
      model: "cortecs:mistral-small-2503",
    });

    expect(request.model).toBe("cortecs:mistral-small-2503");
  });

  test("falls back to the default model ref when none is passed", () => {
    const request = buildChatRequest({
      userPrompt: "Summarize this page",
      conversationMessages: [],
      explicitContext: [],
      selectionContext: null,
    });

    expect(typeof request.model).toBe("string");
    expect(request.model.length).toBeGreaterThan(0);
  });

  test("builds multimodal user content with text first and image second", () => {
    const request = buildChatRequest({
      userPrompt: "Describe this screenshot",
      conversationMessages: [],
      explicitContext: [],
      selectionContext: null,
      userImageUrl: "data:image/png;base64,abc123",
    });

    const userMessage = request.messages.at(-1);

    expect(userMessage?.role).toBe("user");
    expect(userMessage?.content).toEqual([
      { type: "text", text: "[User message]\nDescribe this screenshot" },
      { type: "image_url", image_url: { url: "data:image/png;base64,abc123" } },
    ]);
  });

  test("builds next-message context blocks before the user message", () => {
    const request = buildChatRequest({
      userPrompt: "Answer my question",
      conversationMessages: [],
      explicitContext: [
        {
          id: "b",
          label: "Second pin",
          text: "Pinned B",
          createdAt: "2026-03-13T10:00:02.000Z",
          priority: 1,
        },
        {
          id: "a",
          label: "First pin",
          text: "Pinned A",
          createdAt: "2026-03-13T10:00:01.000Z",
          priority: 0,
        },
      ],
      selectionContext: { text: "Current temporary selection" },
    });

    const userContent = request.messages.at(-1)?.content;
    expect(typeof userContent).toBe("string");
    const userMessage = typeof userContent === "string" ? userContent : "";

    expect(userMessage).toContain(
      "Next-message context for this request only:",
    );
    expect(userMessage).toContain(
      "[Live selection]\nCurrent temporary selection",
    );
    expect(userMessage).toContain("[Pinned snippet 1: First pin]\nPinned A");
    expect(userMessage).toContain("[Pinned snippet 2: Second pin]\nPinned B");
    expect(userMessage).toContain("[User message]\nAnswer my question");
  });

  test("keeps page context as a prior conversation message instead of a system envelope", () => {
    const request = buildChatRequest({
      userPrompt: "Summarize this page",
      conversationMessages: [
        { role: "user", content: "[Page context]\nTitle: Doc" },
      ],
      explicitContext: [],
      selectionContext: { text: "Selection" },
    });

    expect(request.messages[1]).toEqual({
      role: "user",
      content: "[Page context]\nTitle: Doc",
    });
    expect(request.messages.at(-1)?.content).not.toBe(
      "[Page context]\nTitle: Doc",
    );
  });

  test("combines default system prompt with user custom system prompt", () => {
    const request = buildChatRequest({
      userPrompt: "Hello",
      conversationMessages: [],
      explicitContext: [],
      systemPrompt: "Respond like a pirate.",
    });

    const systemMessage = request.messages[0];
    expect(systemMessage?.role).toBe("system");
    expect(systemMessage?.content).toContain(
      "You are a browser-based AI assistant",
    );
    expect(systemMessage?.content).toContain("Respond like a pirate.");
  });
});
