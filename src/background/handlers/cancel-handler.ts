const abortControllers = new Map<string, AbortController>();

export function setAbortController(requestId: string, controller: AbortController): void {
  abortControllers.set(requestId, controller);
}

export function clearAbortController(requestId: string): void {
  abortControllers.delete(requestId);
}

export function cancelRequest(requestId: string): boolean {
  const controller = abortControllers.get(requestId);
  if (!controller) return false;
  controller.abort(new DOMException('Chat request cancelled', 'AbortError'));
  abortControllers.delete(requestId);
  return true;
}
