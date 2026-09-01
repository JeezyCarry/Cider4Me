<script lang="ts">
  import { overlayState, persistSidebarWidth, setSidebarWidth } from './overlay-state.svelte';
  import { getI18n, localeStore } from '../../lib/i18n';
  import { DEFAULT_SIDEBAR_WIDTH } from '../../lib/shared/constants';

  const copy = $derived(getI18n($localeStore));

  function startResize(event: PointerEvent): void {
    event.preventDefault();
    overlayState.isResizing = true;
    const startX = event.clientX;
    const initialWidth = overlayState.sidebarWidth;
    const minWidth = DEFAULT_SIDEBAR_WIDTH;

    const onMove = (moveEvent: PointerEvent): void => {
      setSidebarWidth(Math.max(minWidth, initialWidth + (startX - moveEvent.clientX)));
    };

    const onUp = (): void => {
      overlayState.isResizing = false;
      persistSidebarWidth();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp, { once: true });
  }
</script>

<button class="resize-handle" onpointerdown={startResize} aria-label={copy.content.resizeHandleAria}></button>

<style>
  .resize-handle {
    position:absolute;
    top:0;
    left:-8px;
    width:16px;
    height:100%;
    cursor:ew-resize;
    background:transparent;
    border:none;
    touch-action:none;
  }
</style>
