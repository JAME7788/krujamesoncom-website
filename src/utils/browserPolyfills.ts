/**
 * Fallbacks for browser APIs newer than the build target (Vite transpiles syntax
 * down to Safari 14 but does not add missing APIs).
 *
 * Without these, older school iPads / Chromebooks crash:
 * - crypto.randomUUID (Safari 15.4, Chrome 92): 3D classroom fails on load,
 *   Tycoon and Digital City Quest freeze on start.
 * - structuredClone (Safari 15.4, Chrome 98): saving student progress throws.
 * - <dialog>.showModal (Safari 15.4): the lesson card in every game and search throw.
 */

type GetRandomValues = <T extends ArrayBufferView | null>(array: T) => T;

/** RFC 4122 v4 UUID built from crypto.getRandomValues (Safari 11+, Chrome 11+). */
export function randomUUIDFallback(getRandomValues: GetRandomValues): string {
  const bytes = getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant 10xx
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export function installRandomUUIDPolyfill(
  cryptoObj: { getRandomValues?: GetRandomValues; randomUUID?: () => string } | undefined,
): boolean {
  if (!cryptoObj || typeof cryptoObj.randomUUID === 'function' || typeof cryptoObj.getRandomValues !== 'function') {
    return false;
  }
  const getRandomValues = cryptoObj.getRandomValues.bind(cryptoObj) as GetRandomValues;
  cryptoObj.randomUUID = () => randomUUIDFallback(getRandomValues);
  return true;
}

/** Deep clone covering what structuredClone handles for app data (objects, arrays, Date, Map, Set, RegExp, cycles). */
export function deepCloneFallback<T>(value: T, seen = new WeakMap<object, unknown>()): T {
  if (value === null || typeof value !== 'object') return value;
  const source = value as unknown as object;
  if (seen.has(source)) return seen.get(source) as T;

  if (source instanceof Date) return new Date(source.getTime()) as T;
  if (source instanceof RegExp) return new RegExp(source.source, source.flags) as T;
  if (source instanceof Map) {
    const out = new Map();
    seen.set(source, out);
    source.forEach((v, k) => out.set(deepCloneFallback(k, seen), deepCloneFallback(v, seen)));
    return out as T;
  }
  if (source instanceof Set) {
    const out = new Set();
    seen.set(source, out);
    source.forEach((v) => out.add(deepCloneFallback(v, seen)));
    return out as T;
  }
  if (Array.isArray(source)) {
    const out: unknown[] = [];
    seen.set(source, out);
    source.forEach((v, i) => { out[i] = deepCloneFallback(v, seen); });
    return out as T;
  }
  const out: Record<string, unknown> = {};
  seen.set(source, out);
  for (const key of Object.keys(source)) {
    out[key] = deepCloneFallback((source as Record<string, unknown>)[key], seen);
  }
  return out as T;
}

export function installStructuredClonePolyfill(target: { structuredClone?: unknown } | undefined): boolean {
  if (!target || typeof target.structuredClone === 'function') return false;
  target.structuredClone = <T>(value: T) => deepCloneFallback(value);
  return true;
}

/* ---------- <dialog> helpers: use native showModal when available ---------- */

type DialogLike = Pick<HTMLDialogElement, 'setAttribute' | 'removeAttribute' | 'hasAttribute' | 'dispatchEvent'> & {
  showModal?: () => void;
  close?: () => void;
};

export function openDialog(dialog: DialogLike | null | undefined): void {
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') {
    if (!dialog.hasAttribute('open')) dialog.showModal();
    return;
  }
  dialog.setAttribute('data-modal-fallback', '');
  dialog.setAttribute('open', '');
}

export function closeDialog(dialog: DialogLike | null | undefined): void {
  if (!dialog || !dialog.hasAttribute('open')) return;
  if (typeof dialog.close === 'function') {
    dialog.close();
    return;
  }
  dialog.removeAttribute('open');
  dialog.removeAttribute('data-modal-fallback');
  dialog.dispatchEvent(new Event('close'));
}

export function isDialogOpen(dialog: DialogLike | null | undefined): boolean {
  return !!dialog && dialog.hasAttribute('open');
}
