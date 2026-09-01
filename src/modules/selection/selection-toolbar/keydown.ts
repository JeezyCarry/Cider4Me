import { tick } from 'svelte';
import { EXTENSION_ROOT_ID } from '../../../lib/shared/constants';
import { selectionState } from '../selection-state.svelte';
import { resolveToolbarEnterAction } from '../toolbar-keyboard';

export interface ToolbarKeydownDeps {
  getInputElement: () => HTMLInputElement | null;
  onSubmitPopup: () => void;
  onSearch: () => void;
}

export function createToolbarKeydownHandler(
  deps: ToolbarKeydownDeps,
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    if (!selectionState.isSelectionVisible) return;

    if (event.key === 'Tab') {
      event.preventDefault();
      event.stopPropagation();

      const inputElement = deps.getInputElement();
      if (inputElement) {
        if (!selectionState.popupText.startsWith(': ')) {
          selectionState.popupText = `: ${selectionState.popupText}`;
        }

        void tick().then(() => {
          const input = deps.getInputElement();
          if (!input) return;
          input.focus();
          // Cursor naar het begin
          input.setSelectionRange(0, 0);
          // Dwing scroll naar links zodat cursor zichtbaar is
          input.scrollLeft = 0;
        });
      }
      return;
    }

    if (event.key === 'Enter') {
      const extensionHost = document.getElementById(EXTENSION_ROOT_ID);
      const action = resolveToolbarEnterAction(
        event,
        deps.getInputElement(),
        extensionHost,
      );

      if (action === 'ignore') return;

      event.preventDefault();
      event.stopPropagation();

      if (action === 'submit-popup') {
        deps.onSubmitPopup();
      } else {
        deps.onSearch();
      }
    }
  };
}
