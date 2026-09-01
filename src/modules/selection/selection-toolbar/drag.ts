import { selectionState } from '../selection-state.svelte';

export interface DragHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
}

export function createDragHandlers(): DragHandlers {
  let isDragging = false;
  let startPointerPos = { x: 0, y: 0 };
  let startDragOffset = { x: 0, y: 0 };

  function onPointerDown(e: PointerEvent): void {
    isDragging = true;
    startPointerPos = { x: e.clientX, y: e.clientY };
    startDragOffset = { ...selectionState.dragOffset };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: PointerEvent): void {
    if (!isDragging) return;
    const dx = e.clientX - startPointerPos.x;
    const dy = e.clientY - startPointerPos.y;
    selectionState.dragOffset = {
      x: startDragOffset.x + dx,
      y: startDragOffset.y + dy,
    };
  }

  function onPointerUp(e: PointerEvent): void {
    isDragging = false;
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }

  return { onPointerDown, onPointerMove, onPointerUp };
}
