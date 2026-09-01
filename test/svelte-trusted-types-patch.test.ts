import { describe, expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';

const RECONCILER = new URL('../node_modules/svelte/src/internal/client/dom/reconciler.js', import.meta.url);

describe('svelte trusted-types patch (sider:tt-safe)', () => {
  it('wraps policy creation in a try/catch so a restrictive CSP allowlist cannot crash module eval', () => {
    const source = readFileSync(RECONCILER, 'utf8');

    expect(source).toContain('sider:tt-safe start');
    expect(source).toContain('sider:tt-safe end');
    expect(source).toContain("trustedTypes.createPolicy('svelte-trusted-html'");
    expect(source).toMatch(/try\s*{[\s\S]*createPolicy\('svelte-trusted-html'[\s\S]*}\s*catch\s*{/);
  });

  it('keeps the raw-string fallback in create_trusted_html', () => {
    const source = readFileSync(RECONCILER, 'utf8');
    expect(source).toMatch(/policy\?\.createHTML\(html\) \?\? html/);
  });
});
