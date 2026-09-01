import type { SiteAccessPolicy } from '../shared/types';

const UNSUPPORTED_PROTOCOLS = new Set(['about:', 'moz-extension:', 'chrome:', 'chrome-extension:', 'file:']);

export function isSupportedPage(url: URL): boolean {
  return !UNSUPPORTED_PROTOCOLS.has(url.protocol);
}

export function normalizeSiteDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/^www\./, '');
}

export function matchesDomainList(hostname: string, domains: string[]): boolean {
  const normalizedHostname = normalizeSiteDomain(hostname);
  const normalizedDomains = domains.map(normalizeSiteDomain).filter(Boolean);
  return normalizedDomains.some((domain) => normalizedHostname === domain || normalizedHostname.endsWith(`.${domain}`));
}

export function matchesSiteAccessPolicy(url: URL, policy: SiteAccessPolicy): boolean {
  if (!isSupportedPage(url)) return false;

  return !matchesDomainList(url.hostname, policy.domains);
}

export function canInjectOnUrl(rawUrl: string, policy: SiteAccessPolicy = { domains: [] }): boolean {
  try {
    return matchesSiteAccessPolicy(new URL(rawUrl), policy);
  } catch {
    return false;
  }
}

export function getSiteDomainForUrl(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    if (!isSupportedPage(url)) return null;
    return normalizeSiteDomain(url.hostname);
  } catch {
    return null;
  }
}

export function isLauncherHiddenOnUrl(rawUrl: string, hiddenDomains: string[] = []): boolean {
  try {
    const url = new URL(rawUrl);
    if (!isSupportedPage(url)) return true;
    return matchesDomainList(url.hostname, hiddenDomains);
  } catch {
    return true;
  }
}
