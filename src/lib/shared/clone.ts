export function toPlainData<T>(value: T): T {
  if (value === null || value === undefined) return value;

  if (Array.isArray(value)) {
    return value.map((item) => toPlainData(item)) as T;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toPlainData(item)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}
