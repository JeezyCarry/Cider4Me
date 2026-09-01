import {
  clampSidebarWidth,
  DEFAULT_SIDEBAR_WIDTH,
} from "../../lib/shared/constants";
import { setSiderHidden } from "../../lib/browser/sider-log";
import { savePublicSettings } from "../../lib/browser/storage";
import { contentSettingsState } from "../settings/content/settings-state.svelte";

export const overlayState = $state({
  isSidebarOpen: false,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  isResizing: false,
  showLauncherHideMenu: false,
  isLauncherTemporarilyHidden: false,
  isCustomPromptOpen: false,
});

export function openSidebar(): void {
  overlayState.isSidebarOpen = true;
}

export function closeSidebar(): void {
  overlayState.isSidebarOpen = false;
}

export function toggleSidebar(): void {
  overlayState.isSidebarOpen = !overlayState.isSidebarOpen;
}

export function setSidebarWidth(width: number): void {
  overlayState.sidebarWidth = clampSidebarWidth(width);
  if (contentSettingsState.isLoaded) {
    contentSettingsState.settings.sidebarWidth = overlayState.sidebarWidth;
  }
}

export function persistSidebarWidth(): void {
  if (!contentSettingsState.isLoaded) return;
  void savePublicSettings(contentSettingsState.settings);
}

export function closeOverlayMenus(): void {
  overlayState.showLauncherHideMenu = false;
}

export function hideLauncherForCurrentPageLoad(): void {
  overlayState.isLauncherTemporarilyHidden = true;
  overlayState.showLauncherHideMenu = false;
  setSiderHidden(true);
}
