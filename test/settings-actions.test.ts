import { describe, expect, it, beforeEach, mock } from "bun:test";
import { DEFAULT_SETTINGS } from "../src/lib/shared/constants";
import {
  buildModelConfigs,
  formatModelLabel,
  normalizeModelLabels,
} from "../src/modules/settings/model-config";
import {
  createModelDraft,
  upsertModel,
  validateModelDraft,
} from "../src/modules/settings/model-editor";
import {
  addProvider,
  cancelModelEdit,
  removeProvider,
  startEditModel,
  updateModelDraft,
} from "../src/modules/settings/settings-actions";
import { settingsState } from "../src/modules/settings/settings-state.svelte";

mock.module("../src/lib/browser/storage", () => ({
  getSettingsWithSecrets: async () => ({
    settings: settingsState.settings,
    secrets: settingsState.secrets,
  }),
  saveSettings: mock(async () => {}),
}));

function resetState() {
  settingsState.settings = structuredClone(DEFAULT_SETTINGS);
  settingsState.secrets = {};
  cancelModelEdit("openrouter");
}

describe("updateModelDraft label mirroring", () => {
  beforeEach(resetState);

  it("mirrors model id into display label until the label is edited", () => {
    updateModelDraft("openrouter", "id", "gpt-4o");
    expect(settingsState.form.modelDraft.label).toBe("gpt-4o");
    expect(settingsState.form.modelDraftLabelMirrorsId).toBe(true);

    updateModelDraft("openrouter", "id", "gpt-4o-mini");
    expect(settingsState.form.modelDraft.label).toBe("gpt-4o-mini");
  });

  it("stops mirroring after the display label is changed or cleared", () => {
    updateModelDraft("openrouter", "id", "gpt-4o");
    updateModelDraft("openrouter", "label", "");
    expect(settingsState.form.modelDraftLabelMirrorsId).toBe(false);

    updateModelDraft("openrouter", "id", "gpt-4o-mini");
    expect(settingsState.form.modelDraft.label).toBe("");
    expect(settingsState.form.modelDraft.id).toBe("gpt-4o-mini");
  });

  it("does not mirror when editing an existing model", () => {
    settingsState.settings.providers = settingsState.settings.providers.map(
      (provider) =>
        provider.id === "openrouter"
          ? {
              ...provider,
              models: [
                {
                  id: "gpt-4o",
                  label: "GPT-4o",
                  providerId: "openrouter",
                  enabled: true,
                  supportsImages: false,
                  webSearchEnabled: false,
                },
              ],
            }
          : provider,
    );
    startEditModel("openrouter", "gpt-4o");
    updateModelDraft("openrouter", "id", "gpt-4o-mini");
    expect(settingsState.form.modelDraft.label).toBe("GPT-4o");
  });
});

describe("buildModelConfigs", () => {
  it("preserves existing model labels instead of replacing them with generic names", () => {
    const result = buildModelConfigs(
      ["x-ai/grok-4-fast", "openai/gpt-5-mini"],
      [
        {
          id: "x-ai/grok-4-fast",
          label: "Grok 4 Fast",
          providerId: "openrouter",
          enabled: true,
          supportsImages: true,
          webSearchEnabled: true,
          contextWindow: 1048576,
        },
      ],
    );

    expect(result[0]?.label).toBe("Grok 4 Fast");
    expect(result[0]?.supportsImages).toBe(true);
    expect(result[0]?.webSearchEnabled).toBe(true);
    expect(result[1]?.supportsImages).toBe(false);
    expect(result[1]?.webSearchEnabled).toBe(false);
    expect(result[1]?.label).toBe("Gpt 5 Mini");
  });

  it("formats provider ids into cleaner labels", () => {
    expect(formatModelLabel("x-ai/grok-4-fast")).toBe("Grok 4 Fast");
    expect(formatModelLabel("x-ai/grok-4.20-beta")).toBe("Grok 4.20 Beta");
  });

  it("validates model drafts before saving", () => {
    expect(validateModelDraft(createModelDraft("openrouter"), "en")).toBe(
      "A model ID is required.",
    );
  });

  it("adds models with the owning provider id", () => {
    const added = upsertModel(
      [],
      {
        id: "openai/gpt-4.1-mini",
        label: "GPT-4.1 Mini",
        providerId: "openrouter",
        enabled: true,
        supportsImages: true,
        webSearchEnabled: true,
        thinkingLevel: "",
      },
      null,
      "openrouter",
    );

    expect(added[0]?.providerId).toBe("openrouter");
    expect(added[0]?.supportsImages).toBe(true);
    expect(added[0]?.webSearchEnabled).toBe(true);
    expect(added[0]?.thinkingLevel).toBeUndefined();
  });

  it("round-trips a thinking level through draft and upsert", () => {
    const draft = {
      ...createModelDraft("openrouter"),
      id: "openai/gpt-5.2",
      thinkingLevel: "high" as const,
    };
    const added = upsertModel([], draft, null, "openrouter");

    expect(added[0]?.thinkingLevel).toBe("high");

    const roundTripped = createModelDraft("openrouter", added[0]);
    expect(roundTripped.thinkingLevel).toBe("high");
  });

  it("drops a cleared thinking level back to provider default", () => {
    const draft = {
      ...createModelDraft("openrouter"),
      id: "openai/gpt-5.2",
      thinkingLevel: "" as const,
    };
    const added = upsertModel([], draft, null, "openrouter");

    expect(added[0]?.thinkingLevel).toBeUndefined();
  });

  it("supports provider-aware Gemini model drafts", () => {
    const draft = createModelDraft("google-gemini");
    const added = upsertModel(
      [],
      {
        ...draft,
        id: "gemini-2.5-flash",
        label: "",
        enabled: true,
        supportsImages: true,
        webSearchEnabled: true,
      },
      null,
      "google-gemini",
    );

    expect(added[0]?.providerId).toBe("google-gemini");
    expect(added[0]?.label).toBe("Gemini 2.5 Flash");
  });

  it("normalizes model labels across all provider instances", () => {
    const settings = normalizeModelLabels({
      ...DEFAULT_SETTINGS,
      providers: [
        {
          id: "openrouter",
          type: "openrouter",
          label: "OpenRouter",
          baseUrl: "https://openrouter.ai/api/v1",
          enabled: true,
          models: [
            {
              id: "x-ai/grok-4-fast",
              label: "Primary model",
              providerId: "openrouter",
              enabled: true,
              supportsImages: false,
              webSearchEnabled: false,
              contextWindow: 1048576,
            },
          ],
        },
      ],
    });

    expect(settings.providers[0]?.models[0]?.label).toBe("Grok 4 Fast");
  });
});

describe("provider add/remove", () => {
  beforeEach(resetState);

  it("adds a provider instance with a stable builtin id for openrouter", () => {
    addProvider("openrouter");
    const openrouter = settingsState.settings.providers.find(
      (p) => p.type === "openrouter",
    );
    expect(openrouter?.id).toBe("openrouter");
    expect(openrouter?.enabled).toBe(true);
  });

  it("adds multiple openai-compatible providers with unique ids", () => {
    const before = settingsState.settings.providers.filter(
      (p) => p.type === "openai-compatible",
    ).length;
    const first = addProvider("openai-compatible");
    const second = addProvider("openai-compatible");
    expect(first).not.toBe(second);
    expect(
      settingsState.settings.providers.filter(
        (p) => p.type === "openai-compatible",
      ),
    ).toHaveLength(before + 2);
  });

  it("removes a provider and its stored key", () => {
    const id = addProvider("openai-compatible");
    settingsState.secrets[id] = "sk-x";
    const before = settingsState.settings.providers.length;
    removeProvider(id);
    expect(settingsState.settings.providers).toHaveLength(before - 1);
    expect(settingsState.secrets[id]).toBeUndefined();
  });
});
