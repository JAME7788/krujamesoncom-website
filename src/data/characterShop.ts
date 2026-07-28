// ร้านตัวละคร — ซื้อด้วยเหรียญที่ได้จากการเล่นเกม/ทำกิจกรรมในเว็บ
// ตัวละครแต่ละตัวมี "พลังพิเศษ" ที่เปลี่ยนวิธีเล่นเกมเศรษฐี
// ออกแบบให้พลังทุกตัวเป็นการ "วางแผน" ไม่ใช่ "ชนะฟรี" — ยังต้องตอบคำถามให้ถูกอยู่ดี

export type AbilityId =
  /** ตกช่องที่ดินของตัวเอง ดึงผู้เล่นที่อยู่ใกล้ไม่เกิน 2 ช่องมาติดกับดัก */
  | 'magnet'
  /** ซื้อที่ดินถูกลง */
  | 'discount'
  /** จ่ายค่าเช่าน้อยลง */
  | 'shield'
  /** ผ่านช่องเริ่มต้นได้เงินเดือนมากขึ้น */
  | 'salary'
  /** มีเวลาคิดคำตอบนานขึ้น */
  | 'brain'
  /** บัตรเสี่ยงดวงที่เสียเงิน เสียน้อยลงครึ่งหนึ่ง */
  | 'lucky'
  /** ทอยได้ 1-2 ทอยใหม่ได้อีกครั้ง */
  | 'dice';

export interface ShopCharacter {
  id: string;
  name: string;
  emoji: string;
  /** รูปตัวละคร (ชุดเดียวกับที่เกมใช้อยู่) */
  image?: string;
  role: string;
  price: number;
  ability: AbilityId;
  abilityName: string;
  abilityDesc: string;
  color: string;
}

/** ค่าคงที่ของพลัง — รวมไว้ที่เดียวเพื่อปรับสมดุลง่าย */
export const ABILITY_VALUES = {
  magnetRange: 2,
  discountRate: 0.15,
  shieldRate: 0.3,
  salaryBonus: 0.5,
  brainExtraSeconds: 10,
  luckyRate: 0.5,
  diceRerollUnder: 3,
} as const;

export const SHOP_CHARACTERS: ShopCharacter[] = [
  {
    id: 'starter-lion',
    name: 'สิงโตน้อย',
    emoji: '🦁',
    role: 'นักผจญภัยมือใหม่',
    price: 0,
    ability: 'salary',
    abilityName: 'ขยันเก็บออม',
    abilityDesc: `ผ่านช่องเริ่มต้นรับเงินเดือนเพิ่ม ${ABILITY_VALUES.salaryBonus * 100}%`,
    color: '#f59e0b',
  },
  {
    id: 'magnet-max',
    name: 'แม็กซ์แม่เหล็ก',
    emoji: '🧲',
    image: '/media/games/tycoon-characters/character-08.webp',
    role: 'วิศวกรเครือข่าย',
    price: 120,
    ability: 'magnet',
    abilityName: 'สนามแม่เหล็ก',
    abilityDesc: `เมื่อหยุดที่ที่ดินของตัวเอง ดึงเพื่อนที่อยู่ห่างไม่เกิน ${ABILITY_VALUES.magnetRange} ช่อง เข้ามาติดกับดักและต้องจ่ายค่าเช่า`,
    color: '#0ea5e9',
  },
  {
    id: 'saver-mira',
    name: 'มิร่านักช้อป',
    emoji: '🛍️',
    image: '/media/games/tycoon-characters/character-02.webp',
    role: 'นักออกแบบเกม',
    price: 100,
    ability: 'discount',
    abilityName: 'ต่อราคาเก่ง',
    abilityDesc: `ซื้อที่ดินถูกลง ${ABILITY_VALUES.discountRate * 100}% ทุกแปลง`,
    color: '#7c3aed',
  },
  {
    id: 'guard-byte',
    name: 'ไบต์การ์ด',
    emoji: '🛡️',
    image: '/media/games/tycoon-characters/character-03.webp',
    role: 'นักสร้างหุ่นยนต์',
    price: 150,
    ability: 'shield',
    abilityName: 'เกราะไฟร์วอลล์',
    abilityDesc: `จ่ายค่าเช่าให้เพื่อนน้อยลง ${ABILITY_VALUES.shieldRate * 100}%`,
    color: '#dc2626',
  },
  {
    id: 'brain-luna',
    name: 'ลูน่านักคิด',
    emoji: '🧠',
    image: '/media/games/tycoon-characters/character-04.webp',
    role: 'นักสืบไซเบอร์',
    price: 90,
    ability: 'brain',
    abilityName: 'สมาธิเฉียบ',
    abilityDesc: `มีเวลาคิดคำตอบเพิ่มอีก ${ABILITY_VALUES.brainExtraSeconds} วินาที`,
    color: '#db2777',
  },
  {
    id: 'lucky-iris',
    name: 'ไอริสดวงดี',
    emoji: '🍀',
    image: '/media/games/tycoon-characters/character-06.webp',
    role: 'นักพัฒนาแอป',
    price: 130,
    ability: 'lucky',
    abilityName: 'ดวงเฮง',
    abilityDesc: `บัตรเสี่ยงดวงที่ทำให้เสียเงิน เสียน้อยลงครึ่งหนึ่ง`,
    color: '#ca8a04',
  },
  {
    id: 'dice-jet',
    name: 'เจ็ตนักทอย',
    emoji: '🎲',
    image: '/media/games/tycoon-characters/character-05.webp',
    role: 'นักแก้อัลกอริทึม',
    price: 160,
    ability: 'dice',
    abilityName: 'ทอยซ้ำได้',
    abilityDesc: `ถ้าทอยได้น้อยกว่า ${ABILITY_VALUES.diceRerollUnder} ระบบจะทอยให้ใหม่อัตโนมัติ 1 ครั้ง`,
    color: '#0f766e',
  },
];

export const getShopCharacter = (id: string): ShopCharacter => (
  SHOP_CHARACTERS.find((c) => c.id === id) || SHOP_CHARACTERS[0]
);

/** ตัวละครเริ่มต้นที่ทุกคนมีตั้งแต่แรก (ไม่ต้องซื้อ) */
export const FREE_CHARACTER_ID = 'starter-lion';
