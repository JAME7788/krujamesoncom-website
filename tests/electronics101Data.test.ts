import { describe, expect, it } from 'vitest';
import {
  ELECTRONICS_101_CATEGORIES,
  ELECTRONICS_101_CURRICULUM,
  STUDENT_LAB_MISSIONS,
  TIS_WIRE_SIZES,
  decodeResistorBands,
  getResistorBandColors,
  getShockSeverity,
  solveElectronicsPhysicsStep,
  type PhysicsSimulationState,
} from '../src/pages/games/electronics101Data';
import {
  BREADBOARD_COLS,
  TOPOLOGY_DEFINITIONS,
  areHolesOnSameStrip,
  getActiveBreadboardStrips,
  getLabPartTerminals,
  holeToWorld,
  validateBreadboardWiring,
} from '../src/pages/games/electronics101Topologies';

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
  it('has a lesson list for every category (9 categories, 60 lessons), with unique lesson ids', () => {
    expect(ELECTRONICS_101_CATEGORIES.length).toBe(9);
    const ids = new Set<string>();
    for (const { key } of ELECTRONICS_101_CATEGORIES) {
      const lessons = ELECTRONICS_101_CURRICULUM[key];
      expect(lessons.length).toBeGreaterThan(0);
      for (const lesson of lessons) {
        expect(ids.has(lesson.id)).toBe(false);
        ids.add(lesson.id);
      }
    }
    expect(ids.size).toBe(60);
    expect(STUDENT_LAB_MISSIONS.length).toBe(8);
    expect(TIS_WIRE_SIZES.length).toBeGreaterThanOrEqual(5);
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

  it('series: two resistors and two LED drops share one current, supports independent R1/R2 and unplugging', () => {
    const s = baseState({ mode: 'SERIES', Vs: 9 });
    solveElectronicsPhysicsStep(s, 0.016);
    expect(s.I_mA).toBeCloseTo(((9 - 4) / 440) * 1000, 5);
    expect(s.I2_mA).toBe(s.I_mA);

    const unequal = baseState({ mode: 'SERIES', Vs: 9, R: 200, R2: 300 });
    solveElectronicsPhysicsStep(unequal, 0.016);
    expect(unequal.I_mA).toBeCloseTo(((9 - 4) / 500) * 1000, 5);
    expect(unequal.VR1).toBeCloseTo(2.0, 4);
    expect(unequal.VR2).toBeCloseTo(3.0, 4);

    // Unplugging 1 LED in series breaks the entire loop
    const unplugged = baseState({ mode: 'SERIES', Vs: 9, led1Inserted: false });
    solveElectronicsPhysicsStep(unplugged, 0.016);
    expect(unplugged.I_mA).toBe(0);
    expect(unplugged.I2_mA).toBe(0);
  });

  it('parallel: independent R1/R2 split current into two branches, and unplugging LED1 leaves LED2 lit', () => {
    const p = baseState({ mode: 'PARALLEL', Vs: 6, R: 200, R2: 400 });
    solveElectronicsPhysicsStep(p, 0.016);
    expect(p.I_mA).toBeCloseTo(20, 4);
    expect(p.I2_mA).toBeCloseTo(10, 4);

    const pUnplug1 = baseState({ mode: 'PARALLEL', Vs: 6, R: 200, R2: 400, led1Inserted: false });
    solveElectronicsPhysicsStep(pUnplug1, 0.016);
    expect(pUnplug1.I_mA).toBe(0);
    expect(pUnplug1.I2_mA).toBeCloseTo(10, 4);
  });

  it('protection & safety: simulates fuse blow, grounding protection, and troubleshooting repair', () => {
    const blown = baseState({ mode: 'FUSE_TRIP', fuseBlown: true });
    solveElectronicsPhysicsStep(blown, 0.016);
    expect(blown.I_mA).toBe(0);

    const grounded = baseState({ mode: 'SAFETY_GROUND', sw2Closed: true, lightLevel: 80 });
    const ungrounded = baseState({ mode: 'SAFETY_GROUND', sw2Closed: false, lightLevel: 80 });
    solveElectronicsPhysicsStep(grounded, 0.016);
    solveElectronicsPhysicsStep(ungrounded, 0.016);
    expect(grounded.touchVoltage!).toBeLessThan(5);
    expect(ungrounded.touchVoltage!).toBeGreaterThan(100);
    expect(getShockSeverity(ungrounded.bodyCurrentMa!).maxMa).toBeGreaterThan(1);

    const faulted = baseState({ mode: 'TROUBLESHOOT', faultKind: 'blown_fuse', faultRepaired: false });
    solveElectronicsPhysicsStep(faulted, 0.016);
    expect(faulted.I_mA).toBe(0);

    const repaired = baseState({ mode: 'TROUBLESHOOT', faultKind: 'blown_fuse', faultRepaired: true });
    solveElectronicsPhysicsStep(repaired, 0.016);
    expect(repaired.I_mA).toBeGreaterThan(10);
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

describe('3D circuit topologies & breadboard layouts', () => {
  it('defines a complete 3D lab & breadboard topology for every lesson mode', () => {
    for (const { key } of ELECTRONICS_101_CATEGORIES) {
      for (const lesson of ELECTRONICS_101_CURRICULUM[key]) {
        const topo = TOPOLOGY_DEFINITIONS[lesson.mode];
        expect(topo).toBeDefined();
        expect(topo.parts.length).toBeGreaterThanOrEqual(4);
        expect(topo.wires.length).toBeGreaterThanOrEqual(3);
        expect(topo.bbParts.length).toBeGreaterThanOrEqual(3);
        expect(topo.bbJumpers.length).toBeGreaterThanOrEqual(2);

        for (const wire of topo.wires) {
          expect(wire.points.length).toBeGreaterThanOrEqual(2);
        }

        for (const bp of topo.bbParts) {
          for (const pin of bp.pins) {
            expect(pin.col).toBeGreaterThanOrEqual(1);
            expect(pin.col).toBeLessThanOrEqual(BREADBOARD_COLS);
            const [wx, wy, wz] = holeToWorld(pin);
            expect(Number.isFinite(wx)).toBe(true);
            expect(wy).toBeCloseTo(0.28, 2);
            expect(Number.isFinite(wz)).toBe(true);
          }
        }

        const strips = getActiveBreadboardStrips(topo);
        expect(strips.upperCols.size + strips.lowerCols.size).toBeGreaterThan(0);
      }
    }
  });

  it('computes exact brass binding-post terminal coordinates for lab block parts', () => {
    const dc = TOPOLOGY_DEFINITIONS.DC;
    const supply = dc.parts.find((p) => p.id === 'supply')!;
    const terms = getLabPartTerminals(supply);
    expect(terms.p1).toEqual([-3.5, 0.34, -1.18]);
    expect(terms.p2).toEqual([-3.5, 0.34, 1.18]);
    // First wire starts at exact supply + terminal
    expect(dc.wires[0].points[0]).toEqual(terms.p1);
  });

  it('decodes 4-band resistor colour names and multipliers in Thai', () => {
    const info220 = decodeResistorBands(220);
    expect(info220.band1.nameTh).toBe('แดง');
    expect(info220.band1.digit).toBe(2);
    expect(info220.band2.nameTh).toBe('แดง');
    expect(info220.multiplier.nameTh).toBe('น้ำตาล');
    expect(info220.multiplier.label).toBe('×10');
    expect(info220.tolerance.label).toBe('±5%');
  });

  it('validates interactive breadboard wiring challenge (incomplete, short-circuit, and complete)', () => {
    const dc = TOPOLOGY_DEFINITIONS.DC;
    expect(areHolesOnSameStrip({ col: 5, row: 'a' }, { col: 5, row: 'e' })).toBe(true);
    expect(areHolesOnSameStrip({ col: 5, row: 'e' }, { col: 5, row: 'f' })).toBe(false);

    const emptyRes = validateBreadboardWiring(dc, []);
    expect(emptyRes.status).toBe('incomplete');

    const shortRes = validateBreadboardWiring(dc, [
      { from: { col: 3, row: '+B' }, to: { col: 3, row: '-B' }, color: '#f00', branch: 'main' },
    ]);
    expect(shortRes.status).toBe('short');

    // Equivalent holes on the same 5-hole strips should also pass as complete!
    const solvedRes = validateBreadboardWiring(dc, [
      { from: { col: 10, row: '+B' }, to: { col: 6, row: 'b' }, color: '#f00', branch: 'main' },
      { from: { col: 13, row: 'd' }, to: { col: 12, row: '-B' }, color: '#0a0', branch: 'main' },
    ]);
    expect(solvedRes.status).toBe('complete');
    expect(solvedRes.matchedCount).toBe(dc.bbJumpers.length);
  });
});

