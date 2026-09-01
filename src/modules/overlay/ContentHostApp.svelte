<script lang="ts">
  import { onMount } from 'svelte';
  import FloatingLauncher from './FloatingLauncher.svelte';
  import SidebarShell from './SidebarShell.svelte';
  import SelectionToolbar from '../selection/selection-toolbar/SelectionToolbar.svelte';
  import CustomPromptDialog from './CustomPromptDialog.svelte';
  import { shouldShowLauncherOnPage } from './launcher-visibility';
  import { canInjectOnUrl } from '../../lib/browser/site-access';
  import { closeOverlayMenus, hideLauncherForCurrentPageLoad, overlayState, toggleSidebar } from './overlay-state.svelte';
  import { clearSelection } from '../selection/selection-visibility';
  import { ensureFreshPageContext } from '../context/context-actions';
  import { contentSettingsState } from '../settings/content/settings-state.svelte';
  import { hideLauncherForeverForCurrentSite, loadContentSettings } from '../settings/content/settings-actions';
  import { startHostSetup } from './host-content-setup';
  import { startPageContextTracking } from '../context/page-context-tracking';

  let wasSidebarOpen = false;
  let systemDark = $state(false);

  const activeTheme = $derived.by(() => {
    const configTheme = contentSettingsState.settings.theme;
    if (configTheme === 'system') {
      return systemDark ? 'dark' : 'light';
    }
    return configTheme || 'light';
  });

  function registerThemeListener(): () => void {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    systemDark = mediaQuery.matches;
    const handleMediaQueryChange = (e: MediaQueryListEvent) => {
      systemDark = e.matches;
    };
    mediaQuery.addEventListener('change', handleMediaQueryChange);
    return () => {
      mediaQuery.removeEventListener('change', handleMediaQueryChange);
    };
  }

  onMount(() => {
    const disposers = [startHostSetup(), startPageContextTracking(), registerThemeListener()];
    return () => {
      for (const dispose of disposers) dispose();
    };
  });

  $effect(() => {
    if (overlayState.isSidebarOpen && !wasSidebarOpen) {
      wasSidebarOpen = true;
      void loadContentSettings();
    }

    if (!overlayState.isSidebarOpen) {
      wasSidebarOpen = false;
      return;
    }

    if (contentSettingsState.settings.autoReadPage) {
      void ensureFreshPageContext();
    }
  });

  const isSiteAllowed = $derived(
    contentSettingsState.isLoaded && canInjectOnUrl(window.location.href, contentSettingsState.settings.siteAccessPolicy),
  );

  const isLauncherVisible = $derived(
    contentSettingsState.isLoaded &&
      shouldShowLauncherOnPage(
        window.location.href,
        contentSettingsState.settings.siteAccessPolicy,
        overlayState.isLauncherTemporarilyHidden,
      ),
  );

  $effect(() => {
    if (contentSettingsState.isLoaded && (!isSiteAllowed || overlayState.isLauncherTemporarilyHidden)) {
      clearSelection();
      closeOverlayMenus();
    }
  });
</script>

<div class="host-shell" class:theme-dark={activeTheme === 'dark'}>
  <SidebarShell open={overlayState.isSidebarOpen} width={overlayState.sidebarWidth} />
  {#if isSiteAllowed}
    <SelectionToolbar />
  {/if}
  <CustomPromptDialog />
  {#if isLauncherVisible}
    <FloatingLauncher
      open={overlayState.isSidebarOpen}
      sidebarWidth={overlayState.sidebarWidth}
      onToggle={toggleSidebar}
      onHideNow={hideLauncherForCurrentPageLoad}
      onHideForever={async () => {
        closeOverlayMenus();
        await hideLauncherForeverForCurrentSite();
      }}
    />
  {/if}
</div>

<style>
  .host-shell { position:relative; all:initial; font-family:Inter, ui-sans-serif, system-ui, sans-serif; }
</style>
