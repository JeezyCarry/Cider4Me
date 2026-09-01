export function canOpenSelectionAsUrl(text: string): boolean {
  try {
    return Boolean(text.trim()) && ['http:', 'https:'].includes(new URL(text.trim()).protocol);
  } catch {
    return false;
  }
}
