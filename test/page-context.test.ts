import { describe, expect, test } from 'bun:test';
import { buildContextEnvelope, buildPageContextMessage, normalizeExplicitContext, shouldInjectPageContext, shouldRefreshPageContext, truncateText } from '../src/lib/context/page-context';

describe('page context helpers', () => {
  test('truncateText adds ellipsis', () => {
    expect(truncateText('abcdef', 4)).toBe('abc…');
  });

  test('normalizeExplicitContext limits items', () => {
    const items = Array.from({ length: 8 }, (_, index) => ({
      id: String(index),
      label: `Item ${index}`,
      text: `Text ${index}`,
      createdAt: `2026-03-12T00:00:0${index}.000Z`,
      priority: index,
    }));

    expect(normalizeExplicitContext(items)).toHaveLength(5);
  });

  test('builds a combined explicit-only context envelope', () => {
    const envelope = buildContextEnvelope({
      explicitContext: [],
      selectionContext: { text: 'Selected text' },
    });

    expect(envelope).toContain('Current selection');
    expect(envelope).not.toContain('Page context');
  });

  test('formats page context as a standalone synthetic message', () => {
    const message = buildPageContextMessage({
      title: 'Doc',
      url: 'https://example.com',
      content: 'Page body',
      blocks: [],
      hash: 'x',
      capturedAt: '2026-04-03T10:00:00.000Z',
    });

    expect(message).toContain('[Page context]');
    expect(message).toContain('Title: Doc');
    expect(message).toContain('URL: https://example.com');
  });

  test('refreshes stale or missing snapshots and injects only on hash change', () => {
    const pageContext = {
      title: 'Doc',
      url: 'https://example.com',
      content: 'Page body',
      blocks: [],
      hash: 'ctx_1',
      capturedAt: '2026-04-03T10:00:00.000Z',
    };

    expect(shouldRefreshPageContext(null, 'idle')).toBe(true);
    expect(shouldRefreshPageContext(pageContext, 'fresh')).toBe(false);
    expect(shouldRefreshPageContext(pageContext, 'stale')).toBe(true);
    expect(shouldInjectPageContext(pageContext, 'ctx_0')).toBe(true);
    expect(shouldInjectPageContext(pageContext, 'ctx_1')).toBe(false);
  });
});
