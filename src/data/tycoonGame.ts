// เกมเศรษฐีวิทยาการคำนวณ (Computing Tycoon)
// บอร์ดเกมกระดานสี่เหลี่ยม 28 ช่อง เล่น 2-4 คนบนจอเดียว
// ผสมกลไกเกมเศรษฐี (ซื้อที่ดิน เก็บค่าเช่า บัตรเสี่ยงดวง ล้มละลาย)
// เข้ากับเนื้อหาวิทยาการคำนวณ — ต้องตอบคำถามให้ถูกจึงจะมีสิทธิ์ซื้อที่ดิน

/** เงินเริ่มต้นตามกติกา: 1000×4 + 500×4 + 100×6 + 50×6 + 20×5 = 7,000 บาท */
export const START_MONEY = 7000;
/** เดินครบ 1 รอบผ่านช่องเริ่มต้น รับเงินเดือน */
export const SALARY = 1000;
/** ค่าปรับเมื่อตกช่องหยุดพัก */
export const REST_FINE = 500;

export type TileKind =
  | 'start' | 'property' | 'chance' | 'question' | 'rest' | 'gotoRest' | 'learn';

export interface PropertyInfo {
  name: string;
  emoji: string;
  group: string;
  groupColor: string;
  price: number;
  rent: number;
}

export interface TycoonTile {
  kind: TileKind;
  property?: PropertyInfo;
}

const prop = (
  name: string, emoji: string, group: string, groupColor: string, price: number,
): TycoonTile => ({
  kind: 'property',
  property: { name, emoji, group, groupColor, price, rent: Math.round(price / 5) },
});

/** กระดาน 28 ช่อง เรียงเป็นวงรอบสี่เหลี่ยม (มุมละ 1 ช่องพิเศษ) */
export const TYCOON_BOARD: TycoonTile[] = [
  { kind: 'start' },                                                   // 0 มุม
  prop('เมาส์', '🖱️', 'ฮาร์ดแวร์', '#a16207', 600),
  { kind: 'chance' },
  prop('คีย์บอร์ด', '⌨️', 'ฮาร์ดแวร์', '#a16207', 700),
  { kind: 'question' },
  prop('ไฟล์ข้อมูล', '📁', 'ข้อมูล', '#0891b2', 1000),
  prop('ฐานข้อมูล', '🗄️', 'ข้อมูล', '#0891b2', 1200),
  { kind: 'rest' },                                                    // 7 มุม
  prop('สัญญาณ Wi-Fi', '📶', 'เครือข่าย', '#db2777', 1400),
  { kind: 'chance' },
  prop('อินเทอร์เน็ต', '🌐', 'เครือข่าย', '#db2777', 1600),
  { kind: 'question' },
  prop('ผังงาน', '📋', 'อัลกอริทึม', '#f97316', 1800),
  prop('การวนซ้ำ', '🔁', 'อัลกอริทึม', '#f97316', 2000),
  { kind: 'learn' },                                                   // 14 มุม
  prop('Scratch', '🐱', 'เขียนโปรแกรม', '#dc2626', 2200),
  { kind: 'chance' },
  prop('Python', '🐍', 'เขียนโปรแกรม', '#dc2626', 2400),
  { kind: 'question' },
  prop('แชตบอต AI', '🤖', 'ปัญญาประดิษฐ์', '#ca8a04', 2600),
  prop('หุ่นยนต์', '🦾', 'ปัญญาประดิษฐ์', '#ca8a04', 2800),
  { kind: 'gotoRest' },                                                // 21 มุม
  prop('รหัสผ่านแข็งแรง', '🔑', 'ความปลอดภัย', '#16a34a', 3000),
  { kind: 'chance' },
  prop('ไฟร์วอลล์', '🛡️', 'ความปลอดภัย', '#16a34a', 3200),
  { kind: 'question' },
  prop('เซิร์ฟเวอร์', '🖧', 'คลาวด์', '#2563eb', 3500),
  prop('คลาวด์', '☁️', 'คลาวด์', '#2563eb', 4000),
];

export const propertyUpgradeCost = (tileIndex: number, currentLevel: number): number => {
  const property = TYCOON_BOARD[tileIndex]?.property;
  if (!property || currentLevel < 0 || currentLevel >= 3) return 0;
  return Math.round(property.price * (0.35 + (currentLevel * 0.15)));
};

export const propertyUpgradeInvestment = (tileIndex: number, level: number): number => (
  Array.from({ length: Math.max(0, Math.min(3, level)) }, (_, currentLevel) => (
    propertyUpgradeCost(tileIndex, currentLevel)
  )).reduce((sum, cost) => sum + cost, 0)
);

export const propertyRent = (
  tileIndex: number,
  level: number,
  ownsFullGroup: boolean,
): number => {
  const property = TYCOON_BOARD[tileIndex]?.property;
  if (!property) return 0;
  return Math.round(
    property.rent
    * (ownsFullGroup ? 2 : 1)
    * (1 + (Math.max(0, Math.min(3, level)) * 0.6)),
  );
};

export const countCompletedPropertyGroups = (owned: number[]): number => {
  const ownedSet = new Set(owned);
  const groups = new Set(
    owned.map((tileIndex) => TYCOON_BOARD[tileIndex]?.property?.group).filter(Boolean),
  );
  return [...groups].filter((group) => {
    const groupTiles = TYCOON_BOARD.map((tile, index) => ({ tile, index }))
      .filter((entry) => entry.tile.property?.group === group);
    return groupTiles.length > 0 && groupTiles.every((entry) => ownedSet.has(entry.index));
  }).length;
};

/**
 * ผลของบัตรที่กระทบผู้เล่นคนอื่นด้วย — หัวใจของบอร์ดเกมคือปฏิสัมพันธ์ระหว่างผู้เล่น
 * ไม่ใช่ต่างคนต่างเล่น
 */
export type ChanceEffect =
  /** เก็บเงินจากผู้เล่นที่รวยที่สุด (นอกจากตัวเอง) */
  | 'takeFromRichest'
  /** ทุกคนจ่ายเงินให้ผู้จับบัตร */
  | 'everyonePays'
  /** ผู้จับบัตรจ่ายให้ทุกคน */
  | 'payEveryone'
  /** สลับเงินสดกับผู้เล่นที่รวยที่สุด */
  | 'swapWithRichest';

export interface ChanceCard {
  emoji: string;
  text: string;
  money?: number;
  move?: number;
  bankrupt?: boolean;
  /** ผลที่กระทบผู้เล่นคนอื่น */
  effect?: ChanceEffect;
  /** จำนวนเงินที่ใช้กับ effect (ต่อคน) */
  amount?: number;
}

/** บัตรเสี่ยงดวง/ดวงตก — ผูกกับเหตุการณ์จริงในโลกดิจิทัล */
export const CHANCE_CARDS: ChanceCard[] = [
  { emoji: '💾', text: 'สำรองข้อมูลไว้ก่อนเครื่องพัง! รับรางวัลความรอบคอบ 800 บาท', money: 800 },
  { emoji: '🎣', text: 'หลงกลอีเมลฟิชชิง เสียเงิน 700 บาท', money: -700 },
  { emoji: '🏆', text: 'ชนะการแข่งขันเขียนโปรแกรม รับเงินรางวัล 1,200 บาท', money: 1200 },
  { emoji: '🦠', text: 'ติดไวรัสคอมพิวเตอร์ จ่ายค่าซ่อม 900 บาท', money: -900 },
  { emoji: '🔑', text: 'ตั้งรหัสผ่านแข็งแรง ประหยัดค่าเสียหาย รับ 500 บาท', money: 500 },
  { emoji: '📱', text: 'ติดเกมจนลืมทำการบ้าน ถอยหลัง 3 ช่อง', move: -3 },
  { emoji: '🚀', text: 'เรียนรู้ทักษะใหม่ เดินหน้า 3 ช่อง', move: 3 },
  { emoji: '📰', text: 'แชร์ข่าวปลอมโดยไม่ตรวจสอบ จ่ายค่าปรับ 600 บาท', money: -600 },
  { emoji: '💡', text: 'ขายไอเดียแอปให้รุ่นพี่ รับ 1,000 บาท', money: 1000 },
  { emoji: '🔌', text: 'ลืมปิดเครื่อง ค่าไฟบาน จ่าย 400 บาท', money: -400 },
  { emoji: '🎓', text: 'สอบผ่านวิชาวิทยาการคำนวณ รับทุน 1,500 บาท', money: 1500 },
  { emoji: '💥', text: 'ข้อมูลหายเพราะไม่ได้สำรอง — ล้มละลายทันที!', bankrupt: true },

  // ---- บัตรที่กระทบผู้เล่นคนอื่น (เล่นแล้วมีปฏิสัมพันธ์ ลุ้นกันทั้งวง) ----
  { emoji: '🕵️', text: 'จับได้ว่าเพื่อนที่รวยที่สุดลอกโค้ด! เรียกค่าปรับ 800 บาท', effect: 'takeFromRichest', amount: 800 },
  { emoji: '🎤', text: 'คุณสอนเพื่อนแก้บั๊กได้สำเร็จ — ทุกคนจ่ายค่าติวให้คุณคนละ 300 บาท', effect: 'everyonePays', amount: 300 },
  { emoji: '🍕', text: 'ฉลองส่งงานทัน! เลี้ยงพิซซ่าเพื่อนทุกคน คนละ 250 บาท', effect: 'payEveryone', amount: 250 },
  { emoji: '🔁', text: 'ระบบสลับบัญชีผิดพลาด! สลับเงินสดกับเพื่อนที่รวยที่สุด', effect: 'swapWithRichest' },
  { emoji: '🏅', text: 'ชนะประกวดโครงงาน — ทุกคนจ่ายค่ายินดีคนละ 200 บาท', effect: 'everyonePays', amount: 200 },
  { emoji: '📢', text: 'ลืมปิดไมค์ตอนประชุมออนไลน์ ขายหน้าทั้งห้อง! จ่ายเพื่อนคนละ 150 บาท', effect: 'payEveryone', amount: 150 },
];

/** ธีมผู้เล่น */
export const TYCOON_TOKENS = [
  { emoji: '🦁', color: '#f59e0b', name: 'ทีมสิงโต' },
  { emoji: '🐬', color: '#0891b2', name: 'ทีมโลมา' },
  { emoji: '🦊', color: '#e11d48', name: 'ทีมจิ้งจอก' },
  { emoji: '🐢', color: '#16a34a', name: 'ทีมเต่า' },
];

export interface TycoonCharacter {
  id: string;
  name: string;
  role: string;
  image: string;
  accent: string;
}

/** Pixel characters adapted from the Apache-2.0 licensed Claw-Empire sprite set. */
export const TYCOON_CHARACTERS: TycoonCharacter[] = [
  {
    id: 'neo',
    name: 'นีโอ',
    role: 'นักสำรวจข้อมูล',
    image: '/media/games/tycoon-characters/character-01.webp',
    accent: '#0284c7',
  },
  {
    id: 'mira',
    name: 'มิร่า',
    role: 'นักออกแบบเกม',
    image: '/media/games/tycoon-characters/character-02.webp',
    accent: '#7c3aed',
  },
  {
    id: 'byte',
    name: 'ไบต์',
    role: 'นักสร้างหุ่นยนต์',
    image: '/media/games/tycoon-characters/character-03.webp',
    accent: '#dc2626',
  },
  {
    id: 'luna',
    name: 'ลูน่า',
    role: 'นักสืบไซเบอร์',
    image: '/media/games/tycoon-characters/character-04.webp',
    accent: '#db2777',
  },
  {
    id: 'jet',
    name: 'เจ็ต',
    role: 'นักแก้อัลกอริทึม',
    image: '/media/games/tycoon-characters/character-05.webp',
    accent: '#0f766e',
  },
  {
    id: 'iris',
    name: 'ไอริส',
    role: 'นักพัฒนาแอป',
    image: '/media/games/tycoon-characters/character-06.webp',
    accent: '#ca8a04',
  },
  {
    id: 'pixel',
    name: 'พิกเซล',
    role: 'ศิลปินดิจิทัล',
    image: '/media/games/tycoon-characters/character-07.webp',
    accent: '#ea580c',
  },
  {
    id: 'max',
    name: 'แม็กซ์',
    role: 'วิศวกรเครือข่าย',
    image: '/media/games/tycoon-characters/character-08.webp',
    accent: '#16a34a',
  },
];

export const getTycoonCharacter = (characterId: string) => (
  TYCOON_CHARACTERS.find((character) => character.id === characterId)
  || TYCOON_CHARACTERS[0]
);

/**
 * ตำแหน่งบนตาราง 8×8 สำหรับวาดกระดานเป็นวงสี่เหลี่ยม
 * คืนค่า [row, col] เริ่มที่ 1 (ใช้กับ CSS grid)
 */
export const tileGridPos = (i: number): [number, number] => {
  const N = 8;
  if (i <= 7) return [1, i + 1];                 // แถวบน ซ้าย→ขวา (0-7)
  if (i <= 13) return [i - 6, N];                // ขอบขวา บน→ล่าง (8-13)
  if (i <= 21) return [N, N - (i - 14)];         // แถวล่าง ขวา→ซ้าย (14-21)
  return [N - (i - 21), 1];                      // ขอบซ้าย ล่าง→บน (22-27)
};
