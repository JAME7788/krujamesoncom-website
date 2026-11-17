import type { CircuitTopologyMode } from './electronics101Data';

export type BreadboardRow =
  | '+T'
  | '-T'
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | '+B'
  | '-B';

export interface BreadboardHole {
  col: number; // 1..24
  row: BreadboardRow;
}

export type CurrentBranch = 'main' | 'branch1' | 'branch2' | 'base' | 'cap' | 'none';

export type SelectablePartId =
  | 'supply'
  | 'sw1'
  | 'sw2'
  | 'r1'
  | 'r2'
  | 'led1'
  | 'led2'
  | 'cap1'
  | 'bjt1'
  | 'ldr'
  | 'lamp'
  | 'fuse1'
  | 'dmm';

export interface LabBlockPart {
  id: SelectablePartId;
  kind:
    | 'battery'
    | 'switch'
    | 'resistor'
    | 'led_red'
    | 'led_green'
    | 'capacitor'
    | 'bjt'
    | 'ldr'
    | 'lamp'
    | 'fuse'
    | 'breaker'
    | 'earth_rod';
  label: string;
  x: number;
  z: number;
  rotY?: number;
}

export interface LabWireSegment {
  points: [number, number, number][];
  color: string;
  branch: CurrentBranch;
}

export interface BreadboardComponentPlacement {
  id: SelectablePartId;
  kind:
    | 'switch'
    | 'resistor'
    | 'led_red'
    | 'led_green'
    | 'capacitor'
    | 'bjt'
    | 'ldr'
    | 'fuse';
  label: string;
  pins: BreadboardHole[];
}

export interface BreadboardJumper {
  from: BreadboardHole;
  to: BreadboardHole;
  color: string;
  branch: CurrentBranch;
}

export interface TopologyDefinition {
  mode: CircuitTopologyMode;
  titleTh: string;
  parts: LabBlockPart[];
  wires: LabWireSegment[];
  bbParts: BreadboardComponentPlacement[];
  bbJumpers: BreadboardJumper[];
  dmmProbes: {
    red: BreadboardHole;
    black: BreadboardHole;
  };
}

export const BREADBOARD_COLS = 24;
export const BREADBOARD_WIDTH = 7.35;
export const BREADBOARD_DEPTH = 4.75;

export const ROW_Z_MAP: Record<BreadboardRow, number> = {
  '+T': -2.05,
  '-T': -1.77,
  a: -1.28,
  b: -1.02,
  c: -0.76,
  d: -0.5,
  e: -0.24,
  f: 0.24,
  g: 0.5,
  h: 0.76,
  i: 1.02,
  j: 1.28,
  '+B': 1.77,
  '-B': 2.05,
};

export function holeToWorld(hole: BreadboardHole): [number, number, number] {
  const x = (hole.col - 12.5) * 0.28;
  const z = ROW_Z_MAP[hole.row] ?? 0;
  return [x, 0.28, z];
}

export function getLabPartTerminals(part: LabBlockPart): {
  p1: [number, number, number];
  p2: [number, number, number];
  p3?: [number, number, number];
} {
  const y = 0.34;
  const rot = part.rotY ?? 0;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);

  const offset = (dx: number, dz: number): [number, number, number] => [
    part.x + dx * cos - dz * sin,
    y,
    part.z + dx * sin + dz * cos,
  ];

  switch (part.kind) {
    case 'battery':
      return {
        p1: offset(0, -1.18),
        p2: offset(0, 1.18),
      };
    case 'switch':
      return {
        p1: offset(-0.66, 0),
        p2: offset(0.66, 0),
      };
    case 'resistor':
      return {
        p1: offset(-0.68, 0),
        p2: offset(0.68, 0),
      };
    case 'led_red':
    case 'led_green':
      return {
        p1: offset(-0.46, 0),
        p2: offset(0.46, 0),
      };
    case 'capacitor':
      return {
        p1: offset(-0.46, 0),
        p2: offset(0.46, 0),
      };
    case 'ldr':
      return {
        p1: offset(-0.48, 0),
        p2: offset(0.48, 0),
      };
    case 'bjt':
      return {
        p1: offset(0, -0.45),
        p2: offset(-0.48, 0),
        p3: offset(0, 0.45),
      };
    case 'fuse':
    case 'breaker':
    case 'earth_rod':
      return {
        p1: offset(-0.62, 0),
        p2: offset(0.62, 0),
      };
    default:
      return {
        p1: [part.x, y, part.z],
        p2: [part.x, y, part.z],
      };
  }
}

const WIRE_RED = '#d9483b';
const WIRE_GREEN = '#1f7a4c';
const WIRE_BLUE = '#2563eb';
const WIRE_AMBER = '#d97706';

export const TOPOLOGY_DEFINITIONS: Record<CircuitTopologyMode, TopologyDefinition> = {
  DC: {
    mode: 'DC',
    titleTh: 'วงจรไฟตรงพื้นฐาน (Simple DC Loop)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'BATTERY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.4, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'RESISTOR', x: 1.1, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LED', x: 3.1, z: 0, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.06, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-0.74, 0.34, -1.55],
          [0.42, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.78, 0.34, -1.55],
          [3.1, 0.34, -1.55],
          [3.1, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.1, 0.34, 0.46],
          [3.1, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SWITCH', pins: [{ col: 6, row: 'e' }, { col: 8, row: 'e' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 8, row: 'c' }, { col: 12, row: 'c' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 12, row: 'b' }, { col: 13, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 6, row: '+B' }, to: { col: 6, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 13, row: 'e' }, to: { col: 13, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 12, row: 'a' }, black: { col: 13, row: 'a' } },
  },

  AC: {
    mode: 'AC',
    titleTh: 'วงจรไฟสลับและการกรองคลื่น (AC / Smoothing)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'AC SOURCE', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.5, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1', x: 0.7, z: -1.55, rotY: 0 },
      { id: 'cap1', kind: 'capacitor', label: 'C1 SMOOTH', x: 1.8, z: 0, rotY: Math.PI / 2 },
      { id: 'led1', kind: 'led_red', label: 'LED LOAD', x: 3.3, z: 0, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.16, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-0.84, 0.34, -1.55],
          [0.02, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.38, 0.34, -1.55],
          [3.3, 0.34, -1.55],
          [3.3, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'cap',
        points: [
          [1.8, 0.34, -1.55],
          [1.8, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'cap',
        points: [
          [1.8, 0.34, 0.46],
          [1.8, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.3, 0.34, 0.46],
          [3.3, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SWITCH', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 7, row: 'c' }, { col: 11, row: 'c' }] },
      { id: 'cap1', kind: 'capacitor', label: 'C1', pins: [{ col: 11, row: 'e' }, { col: 11, row: 'f' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 11, row: 'b' }, { col: 12, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 11, row: 'j' }, to: { col: 11, row: '-B' }, color: WIRE_BLUE, branch: 'cap' },
      { from: { col: 12, row: 'e' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 11, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  SERIES: {
    mode: 'SERIES',
    titleTh: 'วงจรอนุกรม (Series Circuit)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'BATTERY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.7, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1', x: 0.3, z: -1.55, rotY: 0 },
      { id: 'r2', kind: 'resistor', label: 'R2', x: 2.25, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LED 1', x: 3.35, z: -0.45, rotY: Math.PI / 2 },
      { id: 'led2', kind: 'led_green', label: 'LED 2', x: 3.35, z: 0.85, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.36, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-1.04, 0.34, -1.55],
          [-0.38, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [0.98, 0.34, -1.55],
          [1.57, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.93, 0.34, -1.55],
          [3.35, 0.34, -1.55],
          [3.35, 0.34, -0.91],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [3.35, 0.34, 0.01],
          [3.35, 0.34, 0.39],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.35, 0.34, 1.31],
          [3.35, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SWITCH', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 7, row: 'c' }, { col: 11, row: 'c' }] },
      { id: 'r2', kind: 'resistor', label: 'R2', pins: [{ col: 11, row: 'd' }, { col: 15, row: 'd' }] },
      { id: 'led1', kind: 'led_red', label: 'LED 1', pins: [{ col: 15, row: 'b' }, { col: 16, row: 'b' }] },
      { id: 'led2', kind: 'led_green', label: 'LED 2', pins: [{ col: 16, row: 'c' }, { col: 17, row: 'c' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 17, row: 'e' }, to: { col: 17, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 15, row: 'a' }, black: { col: 17, row: 'a' } },
  },

  PARALLEL: {
    mode: 'PARALLEL',
    titleTh: 'วงจรขนาน 2 กิ่ง (Parallel Branches)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'BATTERY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.6, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 (BRANCH 1)', x: 0.85, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LED 1', x: 3.1, z: -0.45, rotY: Math.PI / 2 },
      { id: 'r2', kind: 'resistor', label: 'R2 (BRANCH 2)', x: 0.85, z: 0.15, rotY: 0 },
      { id: 'led2', kind: 'led_green', label: 'LED 2', x: 2.35, z: 0.85, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.26, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-0.94, 0.34, -1.55],
          [0.17, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'branch2',
        points: [
          [-0.35, 0.34, -1.55],
          [-0.35, 0.34, 0.15],
          [0.17, 0.34, 0.15],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'branch1',
        points: [
          [1.53, 0.34, -1.55],
          [3.1, 0.34, -1.55],
          [3.1, 0.34, -0.91],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'branch2',
        points: [
          [1.53, 0.34, 0.15],
          [2.35, 0.34, 0.15],
          [2.35, 0.34, 0.39],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'branch1',
        points: [
          [3.1, 0.34, 0.01],
          [3.1, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'branch2',
        points: [
          [2.35, 0.34, 1.31],
          [2.35, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.1, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SWITCH', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'r1', kind: 'resistor', label: 'R1 (TOP)', pins: [{ col: 7, row: 'b' }, { col: 11, row: 'b' }] },
      { id: 'led1', kind: 'led_red', label: 'LED 1', pins: [{ col: 11, row: 'c' }, { col: 12, row: 'c' }] },
      { id: 'r2', kind: 'resistor', label: 'R2 (BOTTOM)', pins: [{ col: 7, row: 'g' }, { col: 11, row: 'g' }] },
      { id: 'led2', kind: 'led_green', label: 'LED 2', pins: [{ col: 11, row: 'h' }, { col: 12, row: 'h' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 7, row: 'e' }, to: { col: 7, row: 'f' }, color: WIRE_RED, branch: 'branch2' },
      { from: { col: 12, row: 'e' }, to: { col: 12, row: 'f' }, color: WIRE_GREEN, branch: 'branch1' },
      { from: { col: 12, row: 'j' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 11, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  VDIV: {
    mode: 'VDIV',
    titleTh: 'วงจรแบ่งแรงดัน (Voltage Divider)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.5, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 (TOP)', x: 0.9, z: -1.55, rotY: 0 },
      { id: 'r2', kind: 'resistor', label: 'R2 (BOTTOM)', x: 1.9, z: 0, rotY: Math.PI / 2 },
      { id: 'led1', kind: 'led_red', label: 'V_OUT LOAD', x: 3.3, z: 0, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.16, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-0.84, 0.34, -1.55],
          [0.22, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.58, 0.34, -1.55],
          [1.9, 0.34, -1.55],
          [1.9, 0.34, -0.68],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'branch1',
        points: [
          [1.9, 0.34, -1.1],
          [3.3, 0.34, -1.1],
          [3.3, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [1.9, 0.34, 0.68],
          [1.9, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.3, 0.34, 0.46],
          [3.3, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'r1', kind: 'resistor', label: 'R1 (TOP)', pins: [{ col: 7, row: 'c' }, { col: 11, row: 'c' }] },
      { id: 'r2', kind: 'resistor', label: 'R2 (BOTTOM)', pins: [{ col: 11, row: 'd' }, { col: 15, row: 'd' }] },
      { id: 'led1', kind: 'led_red', label: 'LED LOAD', pins: [{ col: 11, row: 'g' }, { col: 12, row: 'g' }] },
    ],
    bbJumpers: [
      { from: { col: 7, row: '+B' }, to: { col: 7, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 11, row: 'e' }, to: { col: 11, row: 'f' }, color: WIRE_AMBER, branch: 'branch1' },
      { from: { col: 15, row: 'e' }, to: { col: 15, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
      { from: { col: 12, row: 'j' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'branch1' },
    ],
    dmmProbes: { red: { col: 11, row: 'a' }, black: { col: 15, row: 'a' } },
  },

  RC: {
    mode: 'RC',
    titleTh: 'วงจรชาร์จและคายประจุ (RC Charge & Timing)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.5, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 CHARGE', x: 0.7, z: -1.55, rotY: 0 },
      { id: 'cap1', kind: 'capacitor', label: 'C1 TANK', x: 1.85, z: 0, rotY: Math.PI / 2 },
      { id: 'led1', kind: 'led_red', label: 'LED', x: 3.25, z: 0, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.16, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-0.84, 0.34, -1.55],
          [0.02, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.38, 0.34, -1.55],
          [3.25, 0.34, -1.55],
          [3.25, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'cap',
        points: [
          [1.85, 0.34, -1.55],
          [1.85, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'cap',
        points: [
          [1.85, 0.34, 0.46],
          [1.85, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.25, 0.34, 0.46],
          [3.25, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SWITCH', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 7, row: 'c' }, { col: 11, row: 'c' }] },
      { id: 'cap1', kind: 'capacitor', label: 'C1', pins: [{ col: 11, row: 'e' }, { col: 11, row: 'f' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 11, row: 'b' }, { col: 12, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 11, row: 'j' }, to: { col: 11, row: '-B' }, color: WIRE_BLUE, branch: 'cap' },
      { from: { col: 12, row: 'e' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 11, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  ASTABLE: {
    mode: 'ASTABLE',
    titleTh: 'วงจรไฟกะพริบสลับ 2 ดวง (Astable Multivibrator)',
    parts: [
      { id: 'supply', kind: 'battery', label: '3V SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 (220Ω)', x: -1.1, z: -1.55, rotY: 0 },
      { id: 'r2', kind: 'resistor', label: 'R2 (47kΩ)', x: 1.15, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LED 1 (Q1)', x: -0.3, z: -0.35, rotY: Math.PI / 2 },
      { id: 'cap1', kind: 'capacitor', label: 'C1 TIMING', x: 0.9, z: -0.25, rotY: 0 },
      { id: 'bjt1', kind: 'bjt', label: 'Q1 BC547', x: 0.9, z: 0.85, rotY: 0 },
      { id: 'led2', kind: 'led_green', label: 'LED 2 (Q2)', x: 2.95, z: 0.05, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-1.78, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'branch1',
        points: [
          [-0.42, 0.34, -1.55],
          [-0.3, 0.34, -1.55],
          [-0.3, 0.34, -0.81],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'branch2',
        points: [
          [-0.3, 0.34, -1.55],
          [0.47, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'branch2',
        points: [
          [1.83, 0.34, -1.55],
          [2.95, 0.34, -1.55],
          [2.95, 0.34, -0.41],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'cap',
        points: [
          [-0.3, 0.34, 0.11],
          [0.44, 0.34, -0.25],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'base',
        points: [
          [1.36, 0.34, -0.25],
          [0.42, 0.34, 0.85],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'branch1',
        points: [
          [-0.3, 0.34, 0.11],
          [0.9, 0.34, 0.4],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [0.9, 0.34, 1.3],
          [0.9, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [2.95, 0.34, 0.51],
          [2.95, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 5, row: 'h' }, { col: 9, row: 'h' }] },
      { id: 'led1', kind: 'led_red', label: 'LED 1', pins: [{ col: 9, row: 'f' }, { col: 9, row: 'e' }] },
      { id: 'bjt1', kind: 'bjt', label: 'Q1 BC547', pins: [{ col: 9, row: 'c' }, { col: 10, row: 'c' }, { col: 11, row: 'c' }] },
      { id: 'cap1', kind: 'capacitor', label: 'C1', pins: [{ col: 10, row: 'b' }, { col: 11, row: 'b' }] },
      { id: 'r2', kind: 'resistor', label: 'R2', pins: [{ col: 13, row: 'h' }, { col: 17, row: 'h' }] },
      { id: 'led2', kind: 'led_green', label: 'LED 2', pins: [{ col: 13, row: 'f' }, { col: 13, row: 'e' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'j' }, color: WIRE_RED, branch: 'branch1' },
      { from: { col: 17, row: '+B' }, to: { col: 17, row: 'j' }, color: WIRE_RED, branch: 'branch2' },
      { from: { col: 11, row: 'e' }, to: { col: 11, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
      { from: { col: 13, row: 'd' }, to: { col: 13, row: '-B' }, color: WIRE_GREEN, branch: 'branch2' },
    ],
    dmmProbes: { red: { col: 10, row: 'a' }, black: { col: 11, row: 'a' } },
  },

  AND: {
    mode: 'AND',
    titleTh: 'ลอจิกสวิตช์อนุกรม (AND Logic Gate)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH A', x: -1.75, z: -1.55, rotY: 0 },
      { id: 'sw2', kind: 'switch', label: 'SWITCH B', x: 0.15, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1', x: 2.0, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'OUTPUT LED', x: 3.25, z: 0.1, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.41, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [-1.09, 0.34, -1.55],
          [-0.51, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [0.81, 0.34, -1.55],
          [1.32, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.68, 0.34, -1.55],
          [3.25, 0.34, -1.55],
          [3.25, 0.34, -0.36],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.25, 0.34, 0.56],
          [3.25, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SW 1', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'sw2', kind: 'switch', label: 'SW 2', pins: [{ col: 7, row: 'd' }, { col: 9, row: 'd' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 9, row: 'c' }, { col: 13, row: 'c' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 13, row: 'b' }, { col: 14, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 14, row: 'e' }, to: { col: 14, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 13, row: 'a' }, black: { col: 14, row: 'a' } },
  },

  SPDT: {
    mode: 'SPDT',
    titleTh: 'สวิตช์สองทาง / บันได (Two-Way SPDT)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'STAIR SW 1', x: -1.75, z: -1.55, rotY: 0 },
      { id: 'sw2', kind: 'switch', label: 'STAIR SW 2', x: 0.15, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1', x: 2.0, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LAMP LED', x: 3.25, z: 0.1, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.41, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [-1.09, 0.34, -1.55],
          [-0.51, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'branch2',
        points: [
          [-1.09, 0.34, -1.55],
          [-1.09, 0.34, -0.75],
          [-0.51, 0.34, -0.75],
          [-0.51, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [0.81, 0.34, -1.55],
          [1.32, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.68, 0.34, -1.55],
          [3.25, 0.34, -1.55],
          [3.25, 0.34, -0.36],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.25, 0.34, 0.56],
          [3.25, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SW 1', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'sw2', kind: 'switch', label: 'SW 2', pins: [{ col: 7, row: 'd' }, { col: 9, row: 'd' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 9, row: 'c' }, { col: 13, row: 'c' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 13, row: 'b' }, { col: 14, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 14, row: 'e' }, to: { col: 14, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 13, row: 'a' }, black: { col: 14, row: 'a' } },
  },

  BJT: {
    mode: 'BJT',
    titleTh: 'ทรานซิสเตอร์ขยายกระแสและสวิตช์ (NPN Transistor Control)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'BASE SWITCH', x: -1.65, z: 0.2, rotY: 0 },
      { id: 'r2', kind: 'resistor', label: 'RB (BASE)', x: 0.15, z: 0.2, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'RC (220Ω)', x: 0.65, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'COLLECTOR LED', x: 2.35, z: -0.75, rotY: Math.PI / 2 },
      { id: 'bjt1', kind: 'bjt', label: 'BC547 (NPN)', x: 2.35, z: 0.45, rotY: 0 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-0.03, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'base',
        points: [
          [-2.8, 0.34, -1.55],
          [-2.8, 0.34, 0.2],
          [-2.31, 0.34, 0.2],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'base',
        points: [
          [-0.99, 0.34, 0.2],
          [-0.53, 0.34, 0.2],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'base',
        points: [
          [0.83, 0.34, 0.2],
          [1.5, 0.34, 0.2],
          [1.5, 0.34, 0.45],
          [1.87, 0.34, 0.45],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.33, 0.34, -1.55],
          [2.35, 0.34, -1.55],
          [2.35, 0.34, -1.21],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.35, 0.34, -0.29],
          [2.35, 0.34, 0.0],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [2.35, 0.34, 0.9],
          [2.35, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'BASE SW', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'r2', kind: 'resistor', label: 'RB (BASE)', pins: [{ col: 7, row: 'd' }, { col: 11, row: 'd' }] },
      { id: 'bjt1', kind: 'bjt', label: 'BC547', pins: [{ col: 10, row: 'c' }, { col: 11, row: 'c' }, { col: 12, row: 'c' }] },
      { id: 'r1', kind: 'resistor', label: 'RC (220Ω)', pins: [{ col: 6, row: 'h' }, { col: 10, row: 'h' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 10, row: 'f' }, { col: 10, row: 'e' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'base' },
      { from: { col: 6, row: '+B' }, to: { col: 6, row: 'j' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 12, row: 'e' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 10, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  NOT: {
    mode: 'NOT',
    titleTh: 'วงจรอินเวอร์เตอร์ด้วยทรานซิสเตอร์ (NOT Logic Gate)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'INPUT SW', x: -1.65, z: 0.35, rotY: 0 },
      { id: 'r2', kind: 'resistor', label: 'RB (BASE)', x: 0.15, z: 0.35, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 PULL-UP', x: 0.55, z: -1.55, rotY: 0 },
      { id: 'bjt1', kind: 'bjt', label: 'BC547', x: 1.95, z: 0.35, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'OUT LED', x: 3.25, z: 0.15, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-0.13, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'base',
        points: [
          [-2.8, 0.34, -1.55],
          [-2.8, 0.34, 0.35],
          [-2.31, 0.34, 0.35],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'base',
        points: [
          [-0.99, 0.34, 0.35],
          [-0.53, 0.34, 0.35],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'base',
        points: [
          [0.83, 0.34, 0.35],
          [1.47, 0.34, 0.35],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.23, 0.34, -1.55],
          [3.25, 0.34, -1.55],
          [3.25, 0.34, -0.31],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'branch2',
        points: [
          [1.95, 0.34, -1.55],
          [1.95, 0.34, -0.1],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'branch2',
        points: [
          [1.95, 0.34, 0.8],
          [1.95, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.25, 0.34, 0.61],
          [3.25, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'INPUT SW', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'r2', kind: 'resistor', label: 'RB', pins: [{ col: 7, row: 'd' }, { col: 11, row: 'd' }] },
      { id: 'bjt1', kind: 'bjt', label: 'BC547', pins: [{ col: 10, row: 'c' }, { col: 11, row: 'c' }, { col: 12, row: 'c' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 6, row: 'h' }, { col: 10, row: 'h' }] },
      { id: 'led1', kind: 'led_red', label: 'OUT LED', pins: [{ col: 10, row: 'g' }, { col: 11, row: 'g' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'base' },
      { from: { col: 6, row: '+B' }, to: { col: 6, row: 'j' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 10, row: 'e' }, to: { col: 10, row: 'f' }, color: WIRE_AMBER, branch: 'main' },
      { from: { col: 12, row: 'e' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'branch2' },
      { from: { col: 11, row: 'j' }, to: { col: 11, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 10, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  LDR_DIRECT: {
    mode: 'LDR_DIRECT',
    titleTh: 'วงจรเซนเซอร์แสงโดยตรง (Direct Sensor Loop)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.5, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 PROTECT', x: 0.75, z: -1.55, rotY: 0 },
      { id: 'ldr', kind: 'ldr', label: 'LIGHT SENSOR', x: 1.9, z: 0.15, rotY: 0 },
      { id: 'lamp', kind: 'lamp', label: 'DESK LAMP', x: 1.9, z: -0.75, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LED', x: 3.3, z: 0.25, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.16, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-0.84, 0.34, -1.55],
          [0.07, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.43, 0.34, -1.55],
          [1.43, 0.34, 0.15],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.38, 0.34, 0.15],
          [3.3, 0.34, 0.15],
          [3.3, 0.34, -0.21],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.3, 0.34, 0.71],
          [3.3, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 6, row: 'c' }, { col: 10, row: 'c' }] },
      { id: 'ldr', kind: 'ldr', label: 'LIGHT SENSOR', pins: [{ col: 10, row: 'd' }, { col: 12, row: 'd' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 12, row: 'b' }, { col: 13, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 6, row: '+B' }, to: { col: 6, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 13, row: 'e' }, to: { col: 13, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 10, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  LDR_NIGHT: {
    mode: 'LDR_NIGHT',
    titleTh: 'วงจรไฟเปิดอัตโนมัติเมื่อมืด (Automatic Night Light)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'POWER SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'r2', kind: 'resistor', label: 'RB (100kΩ)', x: -1.25, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 (220Ω)', x: 1.15, z: -1.55, rotY: 0 },
      { id: 'ldr', kind: 'ldr', label: 'LIGHT SENSOR', x: -0.25, z: 0.55, rotY: Math.PI / 2 },
      { id: 'lamp', kind: 'lamp', label: 'DESK LAMP', x: 1.05, z: 0.75, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'NIGHT LIGHT', x: 2.85, z: -0.65, rotY: Math.PI / 2 },
      { id: 'bjt1', kind: 'bjt', label: 'BC547', x: 2.85, z: 0.55, rotY: 0 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-1.93, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-0.57, 0.34, -1.55],
          [0.47, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'base',
        points: [
          [-0.25, 0.34, -1.55],
          [-0.25, 0.34, 0.07],
        ],
      },
      {
        color: WIRE_BLUE,
        branch: 'base',
        points: [
          [-0.25, 0.34, -0.35],
          [1.8, 0.34, -0.35],
          [1.8, 0.34, 0.55],
          [2.37, 0.34, 0.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'base',
        points: [
          [-0.25, 0.34, 1.03],
          [-0.25, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.83, 0.34, -1.55],
          [2.85, 0.34, -1.55],
          [2.85, 0.34, -1.11],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.85, 0.34, -0.19],
          [2.85, 0.34, 0.1],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [2.85, 0.34, 1.0],
          [2.85, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'r2', kind: 'resistor', label: 'RB (100kΩ)', pins: [{ col: 6, row: 'd' }, { col: 10, row: 'd' }] },
      { id: 'ldr', kind: 'ldr', label: 'LIGHT SENSOR', pins: [{ col: 10, row: 'b' }, { col: 12, row: 'b' }] },
      { id: 'bjt1', kind: 'bjt', label: 'BC547', pins: [{ col: 9, row: 'g' }, { col: 10, row: 'g' }, { col: 11, row: 'g' }] },
      { id: 'r1', kind: 'resistor', label: 'R1 (220Ω)', pins: [{ col: 5, row: 'h' }, { col: 9, row: 'h' }] },
      { id: 'led1', kind: 'led_red', label: 'NIGHT LIGHT', pins: [{ col: 8, row: 'f' }, { col: 9, row: 'f' }] },
    ],
    bbJumpers: [
      { from: { col: 6, row: '+B' }, to: { col: 6, row: 'a' }, color: WIRE_RED, branch: 'base' },
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'j' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 10, row: 'e' }, to: { col: 10, row: 'f' }, color: WIRE_BLUE, branch: 'base' },
      { from: { col: 12, row: 'e' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'base' },
      { from: { col: 11, row: 'j' }, to: { col: 11, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 10, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  FUSE_TRIP: {
    mode: 'FUSE_TRIP',
    titleTh: 'วงจรฟิวส์ป้องกันกระแสเกินและลัดวงจร (Fuse & Short Protection)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'MAIN SW', x: -1.75, z: -1.55, rotY: 0 },
      { id: 'fuse1', kind: 'fuse', label: 'FUSE 35mA', x: 0.15, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 LOAD', x: 2.05, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LED LOAD', x: 3.3, z: 0, rotY: Math.PI / 2 },
      { id: 'sw2', kind: 'switch', label: 'SHORT TEST (SW2)', x: 1.5, z: 0.25, rotY: 0 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.41, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-1.09, 0.34, -1.55],
          [-0.47, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [0.77, 0.34, -1.55],
          [1.37, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.73, 0.34, -1.55],
          [3.3, 0.34, -1.55],
          [3.3, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'branch2',
        points: [
          [0.84, 0.34, -1.55],
          [0.84, 0.34, 0.25],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'branch2',
        points: [
          [2.16, 0.34, 0.25],
          [2.16, 0.34, 1.55],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.3, 0.34, 0.46],
          [3.3, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'MAIN SW', pins: [{ col: 4, row: 'e' }, { col: 6, row: 'e' }] },
      { id: 'fuse1', kind: 'fuse', label: 'FUSE', pins: [{ col: 6, row: 'c' }, { col: 10, row: 'c' }] },
      { id: 'r1', kind: 'resistor', label: 'R1', pins: [{ col: 10, row: 'd' }, { col: 14, row: 'd' }] },
      { id: 'led1', kind: 'led_red', label: 'LED', pins: [{ col: 14, row: 'b' }, { col: 15, row: 'b' }] },
      { id: 'sw2', kind: 'switch', label: 'SHORT SW2', pins: [{ col: 10, row: 'g' }, { col: 12, row: 'g' }] },
    ],
    bbJumpers: [
      { from: { col: 4, row: '+B' }, to: { col: 4, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 10, row: 'e' }, to: { col: 10, row: 'f' }, color: WIRE_AMBER, branch: 'branch2' },
      { from: { col: 12, row: 'j' }, to: { col: 12, row: '-B' }, color: WIRE_GREEN, branch: 'branch2' },
      { from: { col: 15, row: 'e' }, to: { col: 15, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 14, row: 'a' }, black: { col: 15, row: 'a' } },
  },

  BREAKER: {
    mode: 'BREAKER',
    titleTh: 'เซอร์กิตเบรกเกอร์และขนาดสายไฟ มอก.11-2553 (CB & Wire Sizing)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'MAIN SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'breaker', label: 'CIRCUIT BREAKER', x: -1.3, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'MOTOR / LOAD', x: 1.25, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'STATUS LAMP', x: 3.15, z: 0, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: '#7c2d12', // Brown Line (L) per TIS 11-2553
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-1.92, 0.34, -1.55],
        ],
      },
      {
        color: '#7c2d12',
        branch: 'main',
        points: [
          [-0.68, 0.34, -1.55],
          [0.57, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.93, 0.34, -1.55],
          [3.15, 0.34, -1.55],
          [3.15, 0.34, -0.46],
        ],
      },
      {
        color: '#2563eb', // Blue Neutral (N) per TIS 11-2553
        branch: 'main',
        points: [
          [3.15, 0.34, 0.46],
          [3.15, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'CB BREAKER', pins: [{ col: 6, row: 'e' }, { col: 8, row: 'e' }] },
      { id: 'r1', kind: 'resistor', label: 'LOAD R1', pins: [{ col: 8, row: 'c' }, { col: 12, row: 'c' }] },
      { id: 'led1', kind: 'led_red', label: 'LOAD LED', pins: [{ col: 12, row: 'b' }, { col: 13, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 6, row: '+B' }, to: { col: 6, row: 'a' }, color: '#7c2d12', branch: 'main' },
      { from: { col: 13, row: 'e' }, to: { col: 13, row: '-B' }, color: '#2563eb', branch: 'main' },
    ],
    dmmProbes: { red: { col: 12, row: 'a' }, black: { col: 13, row: 'a' } },
  },

  SAFETY_GROUND: {
    mode: 'SAFETY_GROUND',
    titleTh: 'ระบบสายดิน L-N-G และป้องกันไฟรั่ว (Grounding & Shock Protection)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'AC 220V SIM', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'BREAKER (L)', x: -1.45, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'APPLIANCE R', x: 1.0, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'METAL CHASSIS', x: 2.95, z: -0.35, rotY: Math.PI / 2 },
      { id: 'sw2', kind: 'earth_rod', label: 'EARTH GROUND (G)', x: 1.25, z: 0.75, rotY: 0 },
      { id: 'led2', kind: 'led_green', label: 'GROUND SAFE', x: 2.95, z: 0.9, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: '#7c2d12', // Brown Line (L)
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.11, 0.34, -1.55],
        ],
      },
      {
        color: '#7c2d12',
        branch: 'main',
        points: [
          [-0.79, 0.34, -1.55],
          [0.32, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [1.68, 0.34, -1.55],
          [2.95, 0.34, -1.55],
          [2.95, 0.34, -0.81],
        ],
      },
      {
        color: '#2563eb', // Blue Neutral (N)
        branch: 'main',
        points: [
          [2.95, 0.34, 0.11],
          [2.95, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
      {
        color: '#22c55e', // Green-Yellow Earth Ground (G)
        branch: 'branch2',
        points: [
          [2.95, 0.34, 0.11],
          [2.95, 0.34, 0.44],
        ],
      },
      {
        color: '#22c55e',
        branch: 'branch2',
        points: [
          [1.87, 0.34, 0.75],
          [2.95, 0.34, 0.75],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'MAIN SW', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'r1', kind: 'resistor', label: 'LOAD R1', pins: [{ col: 7, row: 'c' }, { col: 11, row: 'c' }] },
      { id: 'led1', kind: 'led_red', label: 'CHASSIS', pins: [{ col: 11, row: 'b' }, { col: 12, row: 'b' }] },
      { id: 'sw2', kind: 'switch', label: 'GROUND SW (G)', pins: [{ col: 11, row: 'g' }, { col: 13, row: 'g' }] },
      { id: 'led2', kind: 'led_green', label: 'EARTH ROD', pins: [{ col: 13, row: 'i' }, { col: 14, row: 'i' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: '#7c2d12', branch: 'main' },
      { from: { col: 11, row: 'e' }, to: { col: 11, row: 'f' }, color: '#22c55e', branch: 'branch2' },
      { from: { col: 12, row: 'e' }, to: { col: 12, row: '-B' }, color: '#2563eb', branch: 'main' },
      { from: { col: 14, row: 'j' }, to: { col: 14, row: '-B' }, color: '#22c55e', branch: 'branch2' },
    ],
    dmmProbes: { red: { col: 11, row: 'a' }, black: { col: 12, row: 'a' } },
  },

  TROUBLESHOOT: {
    mode: 'TROUBLESHOOT',
    titleTh: 'นักสืบตรวจซ่อมวงจรไฟฟ้า (Circuit Troubleshooting)',
    parts: [
      { id: 'supply', kind: 'battery', label: 'SUPPLY', x: -3.5, z: 0, rotY: 0 },
      { id: 'sw1', kind: 'switch', label: 'SWITCH', x: -1.75, z: -1.55, rotY: 0 },
      { id: 'fuse1', kind: 'fuse', label: 'FUSE (CHECK)', x: 0.15, z: -1.55, rotY: 0 },
      { id: 'r1', kind: 'resistor', label: 'R1 / JOINT', x: 2.05, z: -1.55, rotY: 0 },
      { id: 'led1', kind: 'led_red', label: 'LAMP', x: 3.3, z: 0, rotY: Math.PI / 2 },
    ],
    wires: [
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-3.5, 0.34, -1.18],
          [-3.5, 0.34, -1.55],
          [-2.41, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_RED,
        branch: 'main',
        points: [
          [-1.09, 0.34, -1.55],
          [-0.47, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [0.77, 0.34, -1.55],
          [1.37, 0.34, -1.55],
        ],
      },
      {
        color: WIRE_AMBER,
        branch: 'main',
        points: [
          [2.73, 0.34, -1.55],
          [3.3, 0.34, -1.55],
          [3.3, 0.34, -0.46],
        ],
      },
      {
        color: WIRE_GREEN,
        branch: 'main',
        points: [
          [3.3, 0.34, 0.46],
          [3.3, 0.34, 1.55],
          [-3.5, 0.34, 1.55],
          [-3.5, 0.34, 1.18],
        ],
      },
    ],
    bbParts: [
      { id: 'sw1', kind: 'switch', label: 'SWITCH', pins: [{ col: 5, row: 'e' }, { col: 7, row: 'e' }] },
      { id: 'fuse1', kind: 'fuse', label: 'FUSE', pins: [{ col: 7, row: 'c' }, { col: 11, row: 'c' }] },
      { id: 'r1', kind: 'resistor', label: 'R1 / JOINT', pins: [{ col: 11, row: 'd' }, { col: 15, row: 'd' }] },
      { id: 'led1', kind: 'led_red', label: 'LAMP', pins: [{ col: 15, row: 'b' }, { col: 16, row: 'b' }] },
    ],
    bbJumpers: [
      { from: { col: 5, row: '+B' }, to: { col: 5, row: 'a' }, color: WIRE_RED, branch: 'main' },
      { from: { col: 16, row: 'e' }, to: { col: 16, row: '-B' }, color: WIRE_GREEN, branch: 'main' },
    ],
    dmmProbes: { red: { col: 11, row: 'a' }, black: { col: 16, row: 'a' } },
  },
};

export function getActiveBreadboardStrips(topo: TopologyDefinition): {
  upperCols: Set<number>;
  lowerCols: Set<number>;
  rails: Set<BreadboardRow>;
} {
  const upperCols = new Set<number>();
  const lowerCols = new Set<number>();
  const rails = new Set<BreadboardRow>(['+B', '-B']);

  const markHole = (h: BreadboardHole) => {
    if (h.row === '+T' || h.row === '-T' || h.row === '+B' || h.row === '-B') {
      rails.add(h.row);
    } else if (['a', 'b', 'c', 'd', 'e'].includes(h.row)) {
      upperCols.add(h.col);
    } else {
      lowerCols.add(h.col);
    }
  };

  topo.bbParts.forEach((p) => p.pins.forEach(markHole));
  topo.bbJumpers.forEach((j) => {
    markHole(j.from);
    markHole(j.to);
  });

  return { upperCols, lowerCols, rails };
}

export function getBreadboardStripId(h: BreadboardHole): string {
  if (h.row === '+T' || h.row === '-T' || h.row === '+B' || h.row === '-B') {
    return `RAIL_${h.row}`;
  }
  const bank = ['a', 'b', 'c', 'd', 'e'].includes(h.row) ? 'UPPER' : 'LOWER';
  return `COL_${h.col}_${bank}`;
}

export function areHolesOnSameStrip(a: BreadboardHole, b: BreadboardHole): boolean {
  return getBreadboardStripId(a) === getBreadboardStripId(b);
}

export interface WiringValidationResult {
  status: 'incomplete' | 'short' | 'complete';
  matchedCount: number;
  requiredCount: number;
  message: string;
}

export function validateBreadboardWiring(
  topo: TopologyDefinition,
  userJumpers: BreadboardJumper[],
): WiringValidationResult {
  const required = topo.bbJumpers;
  const requiredCount = required.length;

  const adj = new Map<string, Set<string>>();
  const addEdge = (s1: string, s2: string) => {
    if (!adj.has(s1)) adj.set(s1, new Set());
    if (!adj.has(s2)) adj.set(s2, new Set());
    adj.get(s1)!.add(s2);
    adj.get(s2)!.add(s1);
  };

  for (const j of userJumpers) {
    const s1 = getBreadboardStripId(j.from);
    const s2 = getBreadboardStripId(j.to);
    if (s1 === s2) {
      return {
        status: 'incomplete',
        matchedCount: 0,
        requiredCount,
        message: '⚠️ สายจัมเปอร์เส้นนี้เสียบอยู่ในแถบโลหะ 5 รูชุดเดียวกัน (ไม่เกิดการข้ามแถว)',
      };
    }
    addEdge(s1, s2);
  }

  const areStripsConnected = (start: string, goal: string): boolean => {
    if (start === goal) return true;
    const visited = new Set<string>([start]);
    const queue = [start];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      for (const next of adj.get(curr) || []) {
        if (next === goal) return true;
        if (!visited.has(next)) {
          visited.add(next);
          queue.push(next);
        }
      }
    }
    return false;
  };

  if (
    areStripsConnected('RAIL_+B', 'RAIL_-B') ||
    areStripsConnected('RAIL_+T', 'RAIL_-T')
  ) {
    return {
      status: 'short',
      matchedCount: 0,
      requiredCount,
      message: '💥 ลัดวงจร (Short Circuit)! สายจัมเปอร์เชื่อมรางไฟ + เข้ากับรางกราวด์ − โดยตรง',
    };
  }

  let matchedCount = 0;
  for (const req of required) {
    const reqA = getBreadboardStripId(req.from);
    const reqB = getBreadboardStripId(req.to);
    if (areStripsConnected(reqA, reqB)) {
      matchedCount++;
    }
  }

  if (matchedCount >= requiredCount) {
    return {
      status: 'complete',
      matchedCount,
      requiredCount,
      message: '🎉 ต่อสายจัมเปอร์ครบสมบูรณ์! กระแสไหลครบวงจรเรียบร้อย',
    };
  }

  return {
    status: 'incomplete',
    matchedCount,
    requiredCount,
    message: `โยงสายจัมเปอร์ถูกแล้ว ${matchedCount}/${requiredCount} จุด — คลิกเลือก 2 รูเพื่อต่อสายเพิ่ม`,
  };
}
