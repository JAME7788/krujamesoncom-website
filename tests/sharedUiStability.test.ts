import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(new URL(`../src/${path}`, import.meta.url), 'utf8');

describe('shared UI regression contracts', () => {
  it('opens search in the native modal layer without delayed focus callbacks', () => {
    const code = source('components/SearchBar.tsx');
    expect(code).toContain('dialog.showModal()');
    expect(code).toContain('onCancel=');
    expect(code).toContain('onClose=');
    expect(code).not.toContain('setTimeout');
    expect(code).toContain('e.nativeEvent.isComposing');
  });
  it('keeps a page error boundary within the application layout', () => {
    const code = source('App.tsx');
    expect(code).toMatch(/<Layout>\s*<PageBoundary>/);
    expect(code).toContain('key={location.pathname}');
  });
  it('limits internal error details to local development', () => {
    expect(source('components/ErrorBoundary.tsx')).toContain('import.meta.env.DEV && this.state.error');
  });
});
