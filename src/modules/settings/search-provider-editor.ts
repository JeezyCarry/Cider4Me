import type { SearchEngine } from '../../lib/shared/types';
import { normalizeSiteDomain } from '../../lib/browser/site-access';
import { getI18n, localeState } from '../../lib/i18n';

function createSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);
}

export function createSearchEngineDraft(): SearchEngine {
  return {
    id: `search-${Math.random().toString(36).slice(2, 10)}`,
    label: '',
    enabled: true,
    template: '',
  };
}

export function normalizeBlockedDomains(domains: string[]): string[] {
  return Array.from(new Set(domains.map((domain) => normalizeSiteDomain(domain)).filter(Boolean))).sort();
}

export function validateSearchEngines(searchEngines: SearchEngine[]): SearchEngine[] {
  const seenIds = new Set<string>();

  return searchEngines.map((engine, index) => {
    const label = engine.label.trim();
    const template = engine.template.trim();

    if (!label || !template) {
      throw new Error(getI18n(localeState.locale).errors.invalidSearchProvider);
    }

    let id = engine.id?.trim() || createSlug(label) || `search-${index + 1}`;
    while (seenIds.has(id)) {
      id = `${id}-${index + 1}`;
    }
    seenIds.add(id);

    return {
      id,
      label,
      template,
      enabled: Boolean(engine.enabled),
    };
  });
}
