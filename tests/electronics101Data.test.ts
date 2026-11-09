import { describe, expect, it } from 'vitest';
import {
  ELECTRONICS_101_CATEGORIES,
  ELECTRONICS_101_CURRICULUM,
  getResistorBandColors,
  solveElectronicsPhysicsStep,
  type PhysicsSimulationState,
} from '../src/pages/games/electronics101Data';

const baseState = (over: Partial<PhysicsSimulationState> = {}): PhysicsSimulationState => ({
  switchClosed: true,
  sw2Closed: true,
  Vs: 5,
  R: 220,
  C: 100,
  Vf: 2,
  mode: 'DC',
  Vc: 0,
  Vload: 0,
  I_mA: 0,
  I2_mA: 0,
  P_mW: 0,
  Rb: 10000,
  hFE: 200,
  Ib_uA: 0,
  Vb: 0,
  lightLevel: 50,
  R_ldr: 0,
  timeScale: 1,
  simTime: 0,
  ...over,
});

describe('Electronics 101 curriculum data', () => {
  it('has a lesson list for every category, with unique lesson ids', () => {
    const ids = new Set<string>();
    for (const { key } of ELECTRONICS_101_CATEGORIES) {
      const lessons = ELECTRONICS_101_CURRICULUM[key];
      expect(lessons.length).toBeGreaterThan(0);
      for (const lesson of lessons) {
        expect(ids.has(lesson.id)).toBe(false);
        ids.add(lesson.id);
      }
    }
    expect(ids.size).toBe(48);
  });
});

describe('resistor colour code', () => {
  it('reads common resistor values (digit, digit, multiplier)', () => {
    // 220 Ω = red red brown, 470 Ω = yellow violet brown, 10 kΩ = brown black orange
    expect(getResistorBandColors(220)).toEqual(['#ef4444', '#ef4444', '#7c2d12']);
    expect(getResistorBandColors(470)).toEqual(['#eab308', '#a855f7', '#7c2d12']);
    expect(getResistorBandColors(10000)).toEqual(['#7c2d12', '#111111', '#f97316']);
  });
});

describe('circuit physics step', () => {
  it("DC: follows Ohm's law across the LED drop, and no current when the switch is open", () => {
    const s = baseState();
    solveElectronicsPhysicsStep(s, 0.016);
    expect(s.I_mA).toBeCloseTo(((5 - 2) / 220) * 1000, 5);
    expect(s.P_mW).toBeCloseTo(Math.pow(s.I_mA / 1000, 2) * 220 * 1000, 5);

    const open = baseState({ switchClosed: false });
    solveElectronicsPhysicsStep(open, 0.016);
    expect(open.I_mA).toBe(0);
    expect(open.Vload).toBe(0);
  });

  it('series: two resistors and two LED drops share one current', () => {
    const s = baseState({ mode: 'SERIES', Vs: 9 });
    solveElectronicsPhysicsStep(s, 0.016);
    expect(s.I_mA).toBeCloseTo(((9 - 4) / 440) * 1000, 5);
    expect(s.I2_mA).toBe(s.I_mA);
  });

  it('AND gate lights only when both switches are closed', () => {
    const both = baseState({ mode: 'AND' });
    solveElectronicsPhysicsStep(both, 0.016);
    expect(both.I_mA).toBeGreaterThan(0);
    const one = baseState({ mode: 'AND', sw2Closed: false });
    solveElectronicsPhysicsStep(one, 0.016);
    expect(one.I_mA).toBe(0);
  });

  it('LDR resistance falls as light rises', () => {
    const dark = baseState({ mode: 'LDR_DIRECT', lightLevel: 10 });
    const bright = baseState({ mode: 'LDR_DIRECT', lightLevel: 90 });
    solveElectronicsPhysicsStep(dark, 0.016);
    solveElectronicsPhysicsStep(bright, 0.016);
    expect(bright.R_ldr).toBeLessThan(dark.R_ldr);
  });

  it('RC: capacitor voltage rises toward the supply and never exceeds it', () => {
    const s = baseState({ mode: 'RC', Vs: 6, C: 470 });
    let last = 0;
    for (let i = 0; i < 400; i++) {
      solveElectronicsPhysicsStep(s, 0.05);
      expect(s.Vc).toBeGreaterThanOrEqual(last - 1e-9);
      expect(s.Vc).toBeLessThanOrEqual(6);
      last = s.Vc;
    }
    expect(s.Vc).toBeGreaterThan(0);
  });
});
