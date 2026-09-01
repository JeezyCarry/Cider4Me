import type { SelectionRect } from './selection-types';

export const selectionState = $state({
  selectedText: '',
  popupText: '',
  selectionRect: null as SelectionRect | null,
  isSelectionVisible: false,
  capturedSelection: '',
  dismissedSelectionText: null as string | null,
  dragOffset: { x: 0, y: 0 },
});
