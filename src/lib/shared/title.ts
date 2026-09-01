const TRAILING_COPY_SUFFIX = / \((\d+)\)$/;

export function stripTrailingCopySuffix(title: string): string {
  return title.replace(TRAILING_COPY_SUFFIX, "");
}
