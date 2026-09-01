export type ToolbarEnterAction = 'submit-popup' | 'search' | 'ignore';

export function resolveToolbarEnterAction(
  event: KeyboardEvent,
  popupInput: HTMLInputElement | null,
  extensionHost: HTMLElement | null,
): ToolbarEnterAction {
  const path = event.composedPath();

  if (popupInput && path.includes(popupInput)) return 'submit-popup';

  if (extensionHost && path.includes(extensionHost)) return 'ignore';

  const first = path[0];
  if (
    first instanceof HTMLInputElement ||
    first instanceof HTMLTextAreaElement ||
    (first instanceof HTMLElement && first.isContentEditable)
  ) {
    return 'ignore';
  }

  return 'search';
}
