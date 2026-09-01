import { describe, expect, test, beforeEach, mock } from "bun:test";
import {
  clampSidebarWidth,
  DEFAULT_SETTINGS,
  DEFAULT_SIDEBAR_WIDTH,
  MAX_SIDEBAR_WIDTH,
  MIN_SIDEBAR_WIDTH,
} from "../src/lib/shared/constants";
import { contentSettingsState } from "../src/modules/settings/content/settings-state.svelte";
import {
  overlayState,
  persistSidebarWidth,
  setSidebarWidth,
} from "../src/modules/overlay/overlay-state.svelte";

const saveCalls: Array<{ sidebarWidth?: number }> = [];

mock.module("../src/lib/browser/storage", () => ({
  getPublicSettings: async () => structuredClone(DEFAULT_SETTINGS),
  savePublicSettings: (settings: { sidebarWidth?: number }) => {
    saveCalls.push(settings);
  },
}));

describe("sidebar width clamp", () => {
  test("lower bound equals the real default width", () => {
    expect(DEFAULT_SIDEBAR_WIDTH).toBe(DEFAULT_SETTINGS.sidebarWidth);
    expect(clampSidebarWidth(0)).toBe(DEFAULT_SIDEBAR_WIDTH);
    expect(clampSidebarWidth(MIN_SIDEBAR_WIDTH)).toBe(DEFAULT_SIDEBAR_WIDTH);
    expect(clampSidebarWidth(DEFAULT_SIDEBAR_WIDTH - 100)).toBe(
      DEFAULT_SIDEBAR_WIDTH,
    );
  });

  test("allows resizing back down to the default width", () => {
    const widened = clampSidebarWidth(700);
    expect(widened).toBe(700);
    expect(clampSidebarWidth(widened - 100)).toBe(600);
    expect(clampSidebarWidth(DEFAULT_SIDEBAR_WIDTH)).toBe(
      DEFAULT_SIDEBAR_WIDTH,
    );
  });

  test("keeps the upper clamp behavior unchanged", () => {
    expect(clampSidebarWidth(MAX_SIDEBAR_WIDTH)).toBe(MAX_SIDEBAR_WIDTH);
    expect(clampSidebarWidth(MAX_SIDEBAR_WIDTH + 500)).toBe(MAX_SIDEBAR_WIDTH);
  });
});

describe("persistSidebarWidth", () => {
  beforeEach(() => {
    saveCalls.length = 0;
    contentSettingsState.settings = structuredClone(DEFAULT_SETTINGS);
    contentSettingsState.isLoaded = true;
    overlayState.sidebarWidth = DEFAULT_SIDEBAR_WIDTH;
  });

  test("saves the clamped width exactly once on resize end", () => {
    setSidebarWidth(700);
    persistSidebarWidth();
    expect(saveCalls).toHaveLength(1);
    expect(saveCalls[0]?.sidebarWidth).toBe(700);
  });

  test("does not save while settings are not yet loaded", () => {
    contentSettingsState.isLoaded = false;
    setSidebarWidth(700);
    persistSidebarWidth();
    expect(saveCalls).toHaveLength(0);
  });
});
