export const ROBOT_PART_TYPES = [
  'body',
  'head',
  'arm',
  'leg',
  'eye',
  'cap-red',
  'cap-blue',
  'cap-green',
  'meter',
  'heart',
  'antenna',
  'bulb',
  'claw',
  'wheel',
] as const;

export type RobotPartType = (typeof ROBOT_PART_TYPES)[number];

export type RobotPartDefinition = {
  type: RobotPartType;
  label: string;
  shortLabel: string;
  group: 'โครงสร้าง' | 'การเคลื่อนที่' | 'เซนเซอร์และเอาต์พุต' | 'ตกแต่ง';
};

export type RobotPlacement = {
  type: RobotPartType;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
};

export type RobotLevel = {
  id: number;
  title: string;
  objective: string;
  focus: string;
  placements: RobotPlacement[];
};

export type PlacedRobotPart = RobotPlacement & {
  id: string;
};

export type RobotBuildAnalysis = {
  passed: boolean;
  score: number;
  stars: 0 | 1 | 2 | 3;
  aligned: number;
  totalRequired: number;
  missing: Array<{ type: RobotPartType; count: number }>;
  extra: Array<{ type: RobotPartType; count: number }>;
};

export const ROBOT_PARTS: RobotPartDefinition[] = [
  { type: 'body', label: 'กล่องลำตัว', shortLabel: 'ลำตัว', group: 'โครงสร้าง' },
  { type: 'head', label: 'กล่องศีรษะ', shortLabel: 'ศีรษะ', group: 'โครงสร้าง' },
  { type: 'arm', label: 'แขนกระดาษพับ', shortLabel: 'แขน', group: 'การเคลื่อนที่' },
  { type: 'leg', label: 'ขากระดาษพับ', shortLabel: 'ขา', group: 'การเคลื่อนที่' },
  { type: 'wheel', label: 'ล้อหุ่นยนต์', shortLabel: 'ล้อ', group: 'การเคลื่อนที่' },
  { type: 'claw', label: 'มือคีบ', shortLabel: 'มือคีบ', group: 'การเคลื่อนที่' },
  { type: 'eye', label: 'ดวงตาเซนเซอร์', shortLabel: 'ตา', group: 'เซนเซอร์และเอาต์พุต' },
  { type: 'meter', label: 'มาตรวัด', shortLabel: 'มาตรวัด', group: 'เซนเซอร์และเอาต์พุต' },
  { type: 'antenna', label: 'เสาอากาศ', shortLabel: 'เสาอากาศ', group: 'เซนเซอร์และเอาต์พุต' },
  { type: 'bulb', label: 'หลอดไฟ', shortLabel: 'หลอดไฟ', group: 'เซนเซอร์และเอาต์พุต' },
  { type: 'cap-red', label: 'ปุ่มสีแดง', shortLabel: 'ปุ่มแดง', group: 'ตกแต่ง' },
  { type: 'cap-blue', label: 'ปุ่มสีน้ำเงิน', shortLabel: 'ปุ่มน้ำเงิน', group: 'ตกแต่ง' },
  { type: 'cap-green', label: 'ปุ่มสีเขียว', shortLabel: 'ปุ่มเขียว', group: 'ตกแต่ง' },
  { type: 'heart', label: 'ปุ่มหัวใจ', shortLabel: 'หัวใจ', group: 'ตกแต่ง' },
];

const p = (
  type: RobotPartType,
  x: number,
  y: number,
  rotation = 0,
  scale = 1,
): RobotPlacement => ({ type, x, y, rotation, scale });

export const ROBOT_LEVELS: RobotLevel[] = [
  {
    id: 1,
    title: 'หุ่นยนต์เพื่อนใหม่',
    objective: 'สร้างหุ่นยนต์ล้อที่มองเห็นและเคลื่อนที่ได้',
    focus: 'รู้จักส่วนโครงสร้าง เซนเซอร์ และส่วนเคลื่อนที่',
    placements: [
      p('head', 50, 30), p('eye', 45, 28), p('eye', 55, 28),
      p('body', 50, 57), p('cap-green', 50, 58),
      p('wheel', 42, 80), p('wheel', 58, 80),
    ],
  },
  {
    id: 2,
    title: 'นักสำรวจสองขา',
    objective: 'ต่อขาและล้อให้หุ่นยนต์เดินทางสำรวจได้',
    focus: 'เลือกชิ้นส่วนให้เหมาะกับหน้าที่ของหุ่นยนต์',
    placements: [
      p('head', 50, 25), p('eye', 45, 24), p('eye', 55, 24),
      p('body', 50, 50), p('leg', 43, 72), p('leg', 57, 72),
      p('wheel', 42, 88), p('wheel', 58, 88), p('antenna', 50, 10),
    ],
  },
  {
    id: 3,
    title: 'ผู้ช่วยประจำห้องเรียน',
    objective: 'สร้างหุ่นยนต์พื้นฐานครบส่วนตามพิมพ์เขียว',
    focus: 'ประกอบชิ้นส่วนตามลำดับและตรวจสอบความครบถ้วน',
    placements: [
      p('head', 50, 23), p('eye', 45, 22), p('eye', 55, 22),
      p('cap-red', 50, 29), p('antenna', 50, 7),
      p('body', 50, 50), p('meter', 50, 47),
      p('cap-green', 44, 58), p('cap-blue', 50, 58), p('cap-red', 56, 58),
      p('arm', 28, 48), p('arm', 72, 48),
      p('leg', 43, 72), p('leg', 57, 72),
      p('wheel', 42, 88), p('wheel', 58, 88),
    ],
  },
  {
    id: 4,
    title: 'ช่างซ่อมตัวจิ๋ว',
    objective: 'เพิ่มแขนและมือคีบสำหรับหยิบจับอุปกรณ์',
    focus: 'ออกแบบอวัยวะกลไกให้สัมพันธ์กับงานที่ต้องทำ',
    placements: [
      p('head', 50, 24), p('eye', 45, 23), p('eye', 55, 23),
      p('body', 50, 51), p('meter', 50, 50),
      p('arm', 28, 47), p('arm', 72, 47),
      p('claw', 13, 47), p('claw', 87, 47, 180),
      p('leg', 43, 72), p('leg', 57, 72),
      p('wheel', 42, 88), p('wheel', 58, 88),
    ],
  },
  {
    id: 5,
    title: 'รถสำรวจกลางคืน',
    objective: 'ติดไฟและเสาอากาศให้รถหุ่นยนต์สำรวจในที่มืด',
    focus: 'เชื่อมโยงอุปกรณ์รับข้อมูลและแสดงผล',
    placements: [
      p('head', 50, 27), p('eye', 45, 26), p('eye', 55, 26),
      p('antenna', 50, 10), p('bulb', 33, 28), p('bulb', 67, 28),
      p('body', 50, 57), p('cap-blue', 50, 58),
      p('wheel', 34, 80), p('wheel', 50, 82), p('wheel', 66, 80),
    ],
  },
  {
    id: 6,
    title: 'ผู้ช่วยแยกขยะ',
    objective: 'สร้างผู้ช่วยที่มีมือคีบสองข้างและสัญลักษณ์หัวใจ',
    focus: 'ออกแบบเทคโนโลยีเพื่อแก้ปัญหาในชีวิตประจำวัน',
    placements: [
      p('head', 50, 22), p('eye', 45, 21), p('eye', 55, 21),
      p('body', 50, 50), p('heart', 50, 51),
      p('arm', 28, 47), p('arm', 72, 47),
      p('claw', 13, 47), p('claw', 87, 47, 180),
      p('leg', 43, 72), p('leg', 57, 72),
      p('wheel', 42, 88), p('wheel', 58, 88),
    ],
  },
  {
    id: 7,
    title: 'หุ่นยนต์ขนส่ง',
    objective: 'เพิ่มพื้นที่บรรทุกและล้อสี่ล้อให้รับน้ำหนักได้ดี',
    focus: 'พิจารณาความแข็งแรงและความมั่นคงของโครงสร้าง',
    placements: [
      p('head', 35, 30), p('eye', 31, 29), p('eye', 39, 29),
      p('body', 35, 56), p('body', 65, 56), p('meter', 63, 55),
      p('wheel', 22, 79), p('wheel', 42, 79), p('wheel', 60, 79), p('wheel', 78, 79),
      p('cap-red', 29, 59), p('cap-green', 36, 59),
    ],
  },
  {
    id: 8,
    title: 'สถานีตรวจอากาศ',
    objective: 'ประกอบหุ่นยนต์ตรวจอากาศที่มีมาตรวัด ไฟ และเสาอากาศ',
    focus: 'วางระบบรับข้อมูล ประมวลผล และแสดงผล',
    placements: [
      p('head', 50, 24), p('eye', 45, 23), p('eye', 55, 23),
      p('antenna', 50, 8), p('bulb', 68, 25),
      p('body', 50, 52), p('meter', 50, 49),
      p('cap-red', 43, 60), p('cap-blue', 50, 60), p('cap-green', 57, 60),
      p('arm', 29, 49), p('arm', 71, 49),
      p('leg', 43, 74), p('leg', 57, 74),
      p('wheel', 42, 90), p('wheel', 58, 90),
    ],
  },
  {
    id: 9,
    title: 'หน่วยกู้ภัย',
    objective: 'สร้างหุ่นยนต์ที่เคลื่อนที่ ส่องสว่าง และหยิบจับสิ่งของได้',
    focus: 'รวมหลายระบบย่อยให้ทำงานตอบโจทย์เดียวกัน',
    placements: [
      p('head', 50, 21), p('eye', 45, 20), p('eye', 55, 20),
      p('antenna', 50, 6), p('bulb', 67, 21),
      p('body', 50, 47), p('body', 50, 66, 0, 0.82), p('heart', 50, 47),
      p('arm', 27, 45), p('arm', 73, 45),
      p('claw', 12, 45), p('claw', 88, 45, 180),
      p('wheel', 39, 86), p('wheel', 61, 86),
      p('cap-red', 45, 66), p('cap-blue', 55, 66),
    ],
  },
  {
    id: 10,
    title: 'สุดยอดนักประดิษฐ์',
    objective: 'ประกอบหุ่นยนต์อเนกประสงค์จากชิ้นส่วนทุกระบบ',
    focus: 'ทดสอบ ปรับปรุง และอธิบายเหตุผลในการออกแบบ',
    placements: [
      p('head', 50, 20), p('eye', 45, 19), p('eye', 55, 19),
      p('cap-red', 50, 26), p('antenna', 50, 5),
      p('bulb', 36, 20), p('bulb', 64, 20),
      p('body', 50, 47), p('meter', 50, 44), p('heart', 50, 56),
      p('cap-green', 43, 62), p('cap-blue', 50, 62), p('cap-red', 57, 62),
      p('arm', 27, 45), p('arm', 73, 45),
      p('claw', 12, 45), p('claw', 88, 45, 180),
      p('leg', 42, 72), p('leg', 58, 72),
      p('wheel', 40, 89), p('wheel', 60, 89),
    ],
  },
];

export const countRobotParts = (
  parts: Array<Pick<PlacedRobotPart, 'type'>>,
): Record<RobotPartType, number> => {
  const counts = Object.fromEntries(ROBOT_PART_TYPES.map((type) => [type, 0])) as Record<RobotPartType, number>;
  parts.forEach((part) => {
    counts[part.type] += 1;
  });
  return counts;
};

export const analyzeRobotBuild = (
  parts: PlacedRobotPart[],
  level: RobotLevel,
): RobotBuildAnalysis => {
  const expected = countRobotParts(level.placements);
  const actual = countRobotParts(parts);
  const missing: RobotBuildAnalysis['missing'] = [];
  const extra: RobotBuildAnalysis['extra'] = [];

  ROBOT_PART_TYPES.forEach((type) => {
    if (actual[type] < expected[type]) missing.push({ type, count: expected[type] - actual[type] });
    if (actual[type] > expected[type]) extra.push({ type, count: actual[type] - expected[type] });
  });

  const used = new Set<string>();
  let aligned = 0;
  level.placements.forEach((target) => {
    const candidate = parts
      .filter((part) => part.type === target.type && !used.has(part.id))
      .map((part) => ({
        part,
        distance: Math.hypot(part.x - target.x, part.y - target.y),
      }))
      .sort((a, b) => a.distance - b.distance)[0];
    if (!candidate) return;
    used.add(candidate.part.id);
    if (candidate.distance <= 16) aligned += 1;
  });

  const passed = missing.length === 0 && extra.length === 0;
  if (!passed) {
    return {
      passed,
      score: 0,
      stars: 0,
      aligned,
      totalRequired: level.placements.length,
      missing,
      extra,
    };
  }

  const alignmentRatio = level.placements.length === 0 ? 1 : aligned / level.placements.length;
  const score = Math.min(100, 60 + Math.round(alignmentRatio * 40));
  const stars: 1 | 2 | 3 = score >= 90 ? 3 : score >= 75 ? 2 : 1;
  return {
    passed,
    score,
    stars,
    aligned,
    totalRequired: level.placements.length,
    missing,
    extra,
  };
};

export const partLabel = (type: RobotPartType): string => (
  ROBOT_PARTS.find((part) => part.type === type)?.shortLabel || type
);
