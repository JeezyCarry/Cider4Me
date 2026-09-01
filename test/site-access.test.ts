import { describe, expect, test } from 'bun:test';
import { canInjectOnUrl, getSiteDomainForUrl, isLauncherHiddenOnUrl, matchesSiteAccessPolicy, normalizeSiteDomain } from '../src/lib/browser/site-access';

describe('site access policy', () => {
  test('allows standard web pages by default', () => {
    expect(canInjectOnUrl('https://example.com/article')).toBe(true);
  });

  test('blocks unsupported extension pages', () => {
    expect(canInjectOnUrl('about:config')).toBe(false);
  });

  test('supports allowlist and blocklist logic', () => {
    const url = new URL('https://sub.example.com/path');

    expect(matchesSiteAccessPolicy(url, { domains: [] })).toBe(true);
    expect(matchesSiteAccessPolicy(url, { domains: ['example.com'] })).toBe(false);
  });

  test('normalizes a site domain for launcher blacklisting', () => {
    expect(normalizeSiteDomain('WWW.Example.com')).toBe('example.com');
    expect(getSiteDomainForUrl('https://www.example.com/article')).toBe('example.com');
  });

  test('hides the launcher for matching blacklisted domains', () => {
    expect(isLauncherHiddenOnUrl('https://blog.example.com/article', ['example.com'])).toBe(true);
    expect(isLauncherHiddenOnUrl('https://example.org/article', ['example.com'])).toBe(false);
  });
});
