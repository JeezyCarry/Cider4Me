import { describe, expect, test } from 'bun:test';
import { normalizeBlockedDomains, validateSearchEngines } from '../src/modules/settings/search-provider-editor';

describe('search provider editor helpers', () => {
  test('normalizes blocked domains into a unique sorted list', () => {
    expect(normalizeBlockedDomains([' WWW.Example.com ', 'blog.example.com', 'example.org'])).toEqual([
      'blog.example.com',
      'example.com',
      'example.org',
    ]);
  });

  test('validates and normalizes search providers', () => {
    expect(
      validateSearchEngines([
        {
          id: '',
          label: ' Google ',
          enabled: true,
          template: ' https://www.google.com/search?q={query} ',
        },
      ]),
    ).toEqual([
      {
        id: 'google',
        label: 'Google',
        enabled: true,
        template: 'https://www.google.com/search?q={query}',
      },
    ]);
  });

  test('throws when a search provider is incomplete', () => {
    expect(() =>
      validateSearchEngines([
        {
          id: 'broken',
          label: '',
          enabled: true,
          template: '',
        },
      ]),
    ).toThrow('Every search provider needs both a name and a URL.');
  });
});
