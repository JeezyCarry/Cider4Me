import { afterEach, describe, expect, spyOn, test } from "bun:test";
import {
  setSiderDebugModeEnabled,
  setSiderHidden,
  siderLogError,
  siderLogInfo,
  siderLogWarn,
} from "../src/lib/browser/sider-log";

const infoSpy = spyOn(console, "info");
const warnSpy = spyOn(console, "warn");
const errorSpy = spyOn(console, "error");

afterEach(() => {
  infoSpy.mockClear();
  warnSpy.mockClear();
  errorSpy.mockClear();
  setSiderHidden(false);
  setSiderDebugModeEnabled(false);
});

describe("sider log suppression while hidden", () => {
  test("emits nothing at any level while hidden, even in debug mode", () => {
    setSiderDebugModeEnabled(true);
    setSiderHidden(true);

    siderLogInfo("content", "info while hidden");
    siderLogWarn("content", "warn while hidden");
    siderLogError("content", "error while hidden");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  test("emits normally when visible and debug mode is on", () => {
    setSiderDebugModeEnabled(true);
    setSiderHidden(false);

    siderLogInfo("content", "info while visible");

    expect(infoSpy).toHaveBeenCalled();
    expect(infoSpy.mock.calls[0]?.[0]).toContain("info while visible");
  });

  test("emits nothing when debug mode is off", () => {
    setSiderDebugModeEnabled(false);
    setSiderHidden(false);

    siderLogInfo("content", "info in normal mode");

    expect(infoSpy).not.toHaveBeenCalled();
  });
});
