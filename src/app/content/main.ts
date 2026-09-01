import { mount } from "svelte";
import browser from "webextension-polyfill";
import ContentHostApp from "../../modules/overlay/ContentHostApp.svelte";
import { canInjectOnUrl } from "../../lib/browser/site-access";
import { getPublicSettings } from "../../lib/browser/storage";
import {
  initSiderDebugModeSync,
  setSiderHidden,
  siderLogError,
  siderLogInfo,
} from "../../lib/browser/sider-log";
import { EXTENSION_ROOT_ID } from "../../lib/shared/constants";

initSiderDebugModeSync();

function createMountTarget(): HTMLElement | null {
  if (!document.body) {
    siderLogInfo("content", "no document.body available yet");
    return null;
  }

  if (document.getElementById(EXTENSION_ROOT_ID)) {
    siderLogInfo("content", "mount target already exists");
    return null;
  }

  const host = document.createElement("div");
  host.id = EXTENSION_ROOT_ID;
  host.style.position = "relative";
  host.style.zIndex = "2147483647";
  const shadowRoot = host.attachShadow({ mode: "open" });
  const appTarget = document.createElement("div");
  const style = document.createElement("style");
  style.textContent = ":host{all:initial}*{box-sizing:border-box}";
  shadowRoot.append(style, appTarget);
  document.body.append(host);
  siderLogInfo("content", "mount target created");
  return appTarget;
}

async function bootstrap(): Promise<void> {
  try {
    const settings = await getPublicSettings();
    siderLogInfo("content", "bootstrap start", {
      href: window.location.href,
      optionsUrl: browser.runtime.getURL("options.html"),
    });
    const canInject = canInjectOnUrl(
      window.location.href,
      settings.siteAccessPolicy,
    );
    setSiderHidden(!canInject);
    siderLogInfo("content", "settings loaded", {
      canInject,
      blockedDomains: settings.siteAccessPolicy.domains,
      autoReadPage: settings.autoReadPage,
    });

    if (!canInject) {
      siderLogInfo("content", "skipping injection for current URL");
      return;
    }

    const target = createMountTarget();
    if (!target) {
      siderLogInfo("content", "no mount target created");
      return;
    }

    mount(ContentHostApp, { target });
    siderLogInfo("content", "app mounted");
  } catch (error) {
    siderLogError("content", "bootstrap failed", { error: String(error) });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => void bootstrap(), {
    once: true,
  });
} else {
  void bootstrap();
}
