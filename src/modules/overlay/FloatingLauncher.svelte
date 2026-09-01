<script lang="ts">
  import { onMount } from 'svelte';
  import { closeOverlayMenus, overlayState } from './overlay-state.svelte';
  import { sendRuntimeMessage, getAssetUrl } from '../../lib/browser/runtime';
  import { getI18n, localeStore } from '../../lib/i18n';

  interface Props {
    open: boolean;
    sidebarWidth: number;
    onToggle: () => void;
    onHideNow: () => void;
    onHideForever: () => void | Promise<void>;
  }

  let { open, sidebarWidth, onToggle, onHideNow, onHideForever }: Props = $props();
  let containerElement = $state<HTMLDivElement | null>(null);
  const copy = $derived(getI18n($localeStore));

  const stackStyle = $derived(open ? `right:${sidebarWidth + 32}px;` : 'right:16px;');

  function toggleHideMenu(event: MouseEvent): void {
    event.stopPropagation();
    overlayState.showLauncherHideMenu = !overlayState.showLauncherHideMenu;
  }

  function handleToggleClick(event: MouseEvent): void {
    if ((event.target as HTMLElement | null)?.closest('.hide-trigger, .hide-menu')) return;
    onToggle();
  }

  onMount(() => {
    const handlePointerDown = (event: PointerEvent): void => {
      const path = event.composedPath();
      if (containerElement && path.includes(containerElement)) return;
      if (
        path.some(
          (entry) =>
            entry instanceof HTMLElement && entry.classList.contains('hide-menu'),
        )
      ) {
        return;
      }
      closeOverlayMenus();
    };

    const handleKeydown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        closeOverlayMenus();
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeydown);
    };
  });

  async function handleOpenSettings(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    closeOverlayMenus();
    await sendRuntimeMessage({ type: 'settings.open' });
  }

  async function handleHideForever(event: MouseEvent): Promise<void> {
    event.stopPropagation();
    closeOverlayMenus();
    await onHideForever();
  }

  function handleHideNow(event: MouseEvent): void {
    event.stopPropagation();
    closeOverlayMenus();
    onHideNow();
  }
</script>

<div class="launcher-stack" style={stackStyle} bind:this={containerElement}>
  <div class="launcher-shell">
    <button
      class="hide-trigger"
      type="button"
      aria-label={copy.content.launcher.hideOptionsAria}
      aria-haspopup="menu"
      aria-expanded={overlayState.showLauncherHideMenu}
      onclick={toggleHideMenu}
    >
    ⋯
    </button>

    <button class="launcher" onclick={handleToggleClick} aria-pressed={open} aria-label={open ? copy.content.launcher.closeSidebarAria : copy.content.launcher.openSidebarAria}>
      {#if open}
        ×
      {:else}
        <img src={getAssetUrl('assets/logo.png')} alt="AI" class="logo" />
      {/if}
    </button>

    {#if overlayState.showLauncherHideMenu}
      <div class="hide-menu" role="menu" aria-label={copy.content.launcher.hideMenuAria}>
        <button class="hide-menu-item" type="button" role="menuitem" onclick={handleHideNow}>{copy.content.launcher.hideForNow}</button>
        <button class="hide-menu-item" type="button" role="menuitem" onclick={handleHideForever}>{copy.content.launcher.hideForever}</button>
        <button class="hide-menu-item" type="button" role="menuitem" onclick={handleOpenSettings}>{copy.content.launcher.openSettings}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .launcher-stack {
    position: fixed;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    z-index: 3;
    transition: right 180ms ease;
  }

  .launcher {
    border: none;
    border-radius: 9999px;
    cursor: pointer;
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.35);
  }

  .launcher {
    width: 56px;
    height: 56px;
    background: #ffffff;
    color: #1e293b;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    overflow: hidden;
    border: 1px solid rgba(132, 204, 22, 0.3);
  }

  :global(.theme-dark) .launcher {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
  }

  .logo {
    width: 32px;
    height: 32px;
    object-fit: contain;
  }


  .launcher-shell {
    position: relative;
    display: grid;
    place-items: center;
  }

  .hide-trigger {
    position: absolute;
    top: -4px;
    left: -4px;
    z-index: 2;
    width: 22px;
    height: 22px;
    border: none;
    border-radius: 9999px;
    background: rgba(148, 163, 184, 0.92);
    color: #0f172a;
    font-size: 13px;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(15, 23, 42, 0.32);
    opacity: 0;
    transform: scale(0.9);
    pointer-events: none;
    transition:
      opacity 140ms ease,
      transform 140ms ease,
      background-color 140ms ease;
  }

  .launcher-shell:hover .hide-trigger,
  .launcher-shell:focus-within .hide-trigger,
  .hide-trigger[aria-expanded='true'] {
    opacity: 1;
    transform: scale(1);
    pointer-events: auto;
  }

  .hide-trigger:hover {
    background: #cbd5e1;
  }

  .hide-menu {
    position: absolute;
    right: 0;
    bottom: 68px;
    min-width: 160px;
    display: grid;
    gap: 6px;
    padding: 8px;
    border-radius: 16px;
    background: #ffffff;
    border: 1px solid rgba(132, 204, 22, 0.2);
    box-shadow: 0 16px 36px rgba(15, 23, 42, 0.12);
  }

  :global(.theme-dark) .hide-menu {
    background: #1e293b;
    border-color: rgba(148, 163, 184, 0.15);
    box-shadow: 0 16px 36px rgba(0, 0, 0, 0.4);
  }

  .hide-menu-item {
    border: none;
    border-radius: 10px;
    background: #f1f5f9;
    color: #475569;
    text-align: left;
    padding: 10px 12px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    transition: all 140ms ease;
  }

  .hide-menu-item:hover {
    background: #e2e8f0;
    color: #1e293b;
  }

  :global(.theme-dark) .hide-menu-item {
    background: rgba(148, 163, 184, 0.1);
    color: #cbd5e1;
  }

  :global(.theme-dark) .hide-menu-item:hover {
    background: rgba(148, 163, 184, 0.2);
    color: #f8fafc;
  }
</style>
