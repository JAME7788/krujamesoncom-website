/**
 * Canvas 2D roundRect() exists only in Safari 16+ / Chrome 99+.
 * On older school iPads the call throws every frame and freezes canvas games,
 * so add a path-based fallback once at startup.
 */
type RoundRectRadii = number | DOMPointInit | Iterable<number | DOMPointInit>;

interface PathTarget {
  moveTo(x: number, y: number): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
  closePath(): void;
  roundRect?: (x: number, y: number, w: number, h: number, radii?: RoundRectRadii) => void;
}

const firstRadius = (radii: RoundRectRadii | undefined): number => {
  if (radii === undefined) return 0;
  if (typeof radii === 'number') return radii;
  const first = Symbol.iterator in Object(radii)
    ? (radii as Iterable<number | DOMPointInit>)[Symbol.iterator]().next().value
    : radii;
  if (typeof first === 'number') return first;
  return (first as DOMPointInit | undefined)?.x ?? 0;
};

export function installRoundRectPolyfill(proto: PathTarget | undefined): boolean {
  if (!proto || typeof proto.roundRect === 'function') return false;
  proto.roundRect = function roundRect(this: PathTarget, x, y, w, h, radii) {
    const r = Math.max(0, Math.min(firstRadius(radii), Math.abs(w) / 2, Math.abs(h) / 2));
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
  };
  return true;
}

export function installCanvasPolyfills(): void {
  if (typeof window === 'undefined') return;
  installRoundRectPolyfill(window.CanvasRenderingContext2D?.prototype as unknown as PathTarget | undefined);
}
