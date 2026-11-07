import { describe, expect, it } from 'vitest';
import {
  closeDialog,
  deepCloneFallback,
  installRandomUUIDPolyfill,
  installStructuredClonePolyfill,
  isDialogOpen,
  openDialog,
  randomUUIDFallback,
} from '../src/utils/browserPolyfills';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('randomUUID fallback (Safari < 15.4, Chrome < 92)', () => {
  const getRandomValues = <T extends ArrayBufferView | null>(arr: T): T => {
    const bytes = arr as unknown as Uint8Array;
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
    return arr;
  };

  it('produces RFC 4122 version-4 UUIDs that do not repeat', () => {
    const ids = new Set(Array.from({ length: 500 }, () => randomUUIDFallback(getRandomValues)));
    expect(ids.size).toBe(500);
    for (const id of ids) expect(id).toMatch(UUID_V4);
  });

  it('installs onto a crypto object that lacks randomUUID', () => {
    const fakeCrypto: { getRandomValues: typeof getRandomValues; randomUUID?: () => string } = { getRandomValues };
    expect(installRandomUUIDPolyfill(fakeCrypto)).toBe(true);
    expect(fakeCrypto.randomUUID!()).toMatch(UUID_V4);
  });

  it('leaves a native randomUUID untouched', () => {
    const native = () => 'native';
    const fakeCrypto = { getRandomValues, randomUUID: native };
    expect(installRandomUUIDPolyfill(fakeCrypto)).toBe(false);
    expect(fakeCrypto.randomUUID).toBe(native);
  });
});

describe('structuredClone fallback (Safari < 15.4, Chrome < 98)', () => {
  it('deep-copies nested progress-like data so edits do not leak back', () => {
    const original = {
      studentId: 's1',
      scores: [{ game: 'snake', points: 10 }],
      meta: { updatedAt: new Date('2026-11-07T00:00:00Z'), tags: new Set(['p1']), byGame: new Map([['snake', 3]]) },
    };
    const copy = deepCloneFallback(original);
    copy.scores[0].points = 99;
    copy.meta.tags.add('changed');
    copy.meta.byGame.set('snake', 7);
    expect(original.scores[0].points).toBe(10);
    expect(original.meta.tags.has('changed')).toBe(false);
    expect(original.meta.byGame.get('snake')).toBe(3);
    expect(copy.meta.updatedAt).toBeInstanceOf(Date);
    expect(copy.meta.updatedAt.getTime()).toBe(original.meta.updatedAt.getTime());
    expect(copy.meta.updatedAt).not.toBe(original.meta.updatedAt);
  });

  it('handles circular references like the native API', () => {
    const a: { self?: unknown; n: number } = { n: 1 };
    a.self = a;
    const copy = deepCloneFallback(a);
    expect(copy.self).toBe(copy);
    expect(copy).not.toBe(a);
  });

  it('installs only when the global is missing', () => {
    const target: { structuredClone?: unknown } = {};
    expect(installStructuredClonePolyfill(target)).toBe(true);
    expect(typeof target.structuredClone).toBe('function');
    const native = () => 'native';
    const withNative = { structuredClone: native };
    expect(installStructuredClonePolyfill(withNative)).toBe(false);
    expect(withNative.structuredClone).toBe(native);
  });
});

describe('dialog helpers (Safari < 15.4 has no <dialog>.showModal)', () => {
  const makeEl = (native: boolean) => {
    const attrs = new Set<string>();
    const events: string[] = [];
    const el = {
      setAttribute: (k: string) => { attrs.add(k); },
      removeAttribute: (k: string) => { attrs.delete(k); },
      hasAttribute: (k: string) => attrs.has(k),
      dispatchEvent: (e: Event) => { events.push(e.type); return true; },
      showModal: native ? () => { attrs.add('open'); } : undefined,
      close: native ? () => { attrs.delete('open'); } : undefined,
    };
    return { el: el as unknown as HTMLDialogElement, attrs, events };
  };

  it('uses the native API when present', () => {
    const { el, attrs } = makeEl(true);
    openDialog(el);
    expect(attrs.has('open')).toBe(true);
    expect(isDialogOpen(el)).toBe(true);
    closeDialog(el);
    expect(isDialogOpen(el)).toBe(false);
  });

  it('falls back to the open attribute and fires close for listeners', () => {
    const { el, attrs, events } = makeEl(false);
    expect(() => openDialog(el)).not.toThrow();
    expect(attrs.has('open')).toBe(true);
    expect(attrs.has('data-modal-fallback')).toBe(true);
    expect(isDialogOpen(el)).toBe(true);
    closeDialog(el);
    expect(isDialogOpen(el)).toBe(false);
    expect(events).toContain('close');
  });

  it('ignores a missing element', () => {
    expect(() => openDialog(null)).not.toThrow();
    expect(() => closeDialog(undefined)).not.toThrow();
    expect(isDialogOpen(null)).toBe(false);
  });
});
