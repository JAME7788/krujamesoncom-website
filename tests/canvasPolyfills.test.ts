import { describe, expect, it } from 'vitest';
import { installRoundRectPolyfill } from '../src/utils/canvasPolyfills';

const makeTarget = () => {
  const calls: string[] = [];
  const target = {
    moveTo: (x: number, y: number) => calls.push(`M${x},${y}`),
    arcTo: (_x1: number, _y1: number, _x2: number, _y2: number, r: number) => calls.push(`A${r}`),
    closePath: () => calls.push('Z'),
  } as {
    moveTo(x: number, y: number): void;
    arcTo(x1: number, y1: number, x2: number, y2: number, r: number): void;
    closePath(): void;
    roundRect?: (x: number, y: number, w: number, h: number, r?: number | number[]) => void;
  };
  return { target, calls };
};

describe('installRoundRectPolyfill', () => {
  it('adds roundRect when the browser lacks it (old Safari)', () => {
    const { target, calls } = makeTarget();
    expect(installRoundRectPolyfill(target)).toBe(true);
    target.roundRect!(10, 20, 100, 40, 12);
    expect(calls).toEqual(['M22,20', 'A12', 'A12', 'A12', 'A12', 'Z']);
  });

  it('clamps the radius to half of the smaller side and accepts radius arrays', () => {
    const { target, calls } = makeTarget();
    installRoundRectPolyfill(target);
    target.roundRect!(0, 0, 30, 10, [50]);
    expect(calls[1]).toBe('A5');
  });

  it('keeps the native implementation when it exists', () => {
    const native = () => undefined;
    const { target } = makeTarget();
    target.roundRect = native;
    expect(installRoundRectPolyfill(target)).toBe(false);
    expect(target.roundRect).toBe(native);
  });
});
