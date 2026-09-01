import type { SelectionRect } from '../selection-types';

export interface ViewportMetrics {
  scrollX: number;
  scrollY: number;
  innerWidth: number;
  innerHeight: number;
}

export function computeToolbarStyle(
  rect: SelectionRect,
  dragOffset: { x: number; y: number },
  viewport: ViewportMetrics,
): string {
  // We use position: fixed, so we need the raw rect coordinates relative to the
  // viewport. selectionState.selectionRect holds absolute coordinates (shifted by
  // scrollX/scrollY in the visibility layer), so we subtract them here.
  const viewportTop = rect.top - viewport.scrollY;
  const viewportLeft = rect.left - viewport.scrollX;

  const top = viewportTop - 74 + dragOffset.y;
  const left = viewportLeft + dragOffset.x;

  // Prevent being dragged completely out of view (boundary check)
  const boundedTop = Math.max(4, Math.min(top, viewport.innerHeight - 40));
  const boundedLeft = Math.max(-200, Math.min(left, viewport.innerWidth - 100));

  return `top:${boundedTop}px;left:${boundedLeft}px;`;
}
