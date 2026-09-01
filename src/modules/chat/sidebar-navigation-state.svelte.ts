export type SidebarScreen = 'chat' | 'history';

export const sidebarNavigationState = $state({
  currentScreen: 'chat' as SidebarScreen,
  previousScreen: 'chat' as SidebarScreen,
});

export function openSidebarScreen(screen: SidebarScreen): void {
  if (sidebarNavigationState.currentScreen === screen) return;
  sidebarNavigationState.previousScreen = sidebarNavigationState.currentScreen;
  sidebarNavigationState.currentScreen = screen;
}

export function returnToPreviousSidebarScreen(): void {
  const target = sidebarNavigationState.previousScreen;
  sidebarNavigationState.previousScreen = sidebarNavigationState.currentScreen;
  sidebarNavigationState.currentScreen = target;
}

export function resetSidebarScreen(): void {
  sidebarNavigationState.currentScreen = 'chat';
  sidebarNavigationState.previousScreen = 'chat';
}
