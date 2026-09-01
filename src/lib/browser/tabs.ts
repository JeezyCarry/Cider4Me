import browser from 'webextension-polyfill';
import { matchesDomainList } from './site-access';

export function openUrl(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Opens the given text fragments in a new browser tab as a clean, white page.
 * Uses a Blob URL because data: URLs are blocked for top-level navigation in
 * Firefox and about:blank + document.write is unreliable from extension context.
 */
export function openTextInNewTab(title: string, fragments: string[]): void {
  const sections = fragments
    .map((fragment) => `<section><p>${escapeHtml(fragment)}</p></section>`)
    .join('\n<hr>\n');
  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { margin: 0; padding: 40px 16px; background: #ffffff; color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
  main { max-width: 720px; margin: 0 auto; }
  h1 { font-size: 20px; line-height: 1.3; word-break: break-word; }
  section p { margin: 0; white-space: pre-wrap; word-break: break-word; line-height: 1.6; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
</style>
</head>
<body>
<main>
<h1>${escapeHtml(title)}</h1>
${sections}
</main>
</body>
</html>`;
  const blobUrl = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  openUrl(blobUrl);
  window.setTimeout(() => URL.revokeObjectURL(blobUrl), 10_000);
}

export async function reloadTabsMatchingDomains(domains: string[]): Promise<void> {
  const normalizedDomains = domains.filter(Boolean);
  if (normalizedDomains.length === 0) return;

  const tabs = await browser.tabs.query({});
  await Promise.all(
    tabs
      .filter((tab) => {
        if (!tab.id || !tab.url) return false;

        try {
          const url = new URL(tab.url);
          return matchesDomainList(url.hostname, normalizedDomains);
        } catch {
          return false;
        }
      })
      .map((tab) => browser.tabs.reload(tab.id!)),
  );
}
