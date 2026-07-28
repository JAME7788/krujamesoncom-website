// ร้านตัวละคร — ใช้ "ตัวละครชุดเดียวกับเกมเศรษฐี" เพื่อไม่ให้มีตัวละครสองระบบซ้อนกัน
// ไฟล์นี้เป็นชั้นบาง ๆ ที่บอกว่าตัวไหนซื้อได้ ราคาเท่าไร
// ข้อมูลจริง (ชื่อ รูป พลัง) อยู่ที่ src/data/tycoonGame.ts ที่เดียว

import { TYCOON_CHARACTERS } from './tycoonGame';
import type { TycoonCharacter } from './tycoonGame';

export type { AbilityId } from './tycoonGame';
export { ABILITY_VALUES } from './tycoonGame';

export type ShopCharacter = TycoonCharacter;

/** ตัวละครทั้งหมดในร้าน เรียงจากฟรีไปแพง */
export const SHOP_CHARACTERS: ShopCharacter[] = [...TYCOON_CHARACTERS]
  .sort((a, b) => a.price - b.price);

/** ตัวละครที่ทุกคนมีตั้งแต่แรก (ราคา 0) */
export const FREE_CHARACTER_IDS = TYCOON_CHARACTERS
  .filter((c) => c.price === 0)
  .map((c) => c.id);

export const FREE_CHARACTER_ID = FREE_CHARACTER_IDS[0] || TYCOON_CHARACTERS[0].id;

export const getShopCharacter = (id: string): ShopCharacter => (
  TYCOON_CHARACTERS.find((c) => c.id === id) || TYCOON_CHARACTERS[0]
);

/** ปลดล็อกแล้วหรือยัง — ตัวฟรีถือว่ามีเสมอ */
export const isCharacterUnlocked = (id: string, owned: string[]): boolean => (
  FREE_CHARACTER_IDS.includes(id) || owned.includes(id)
);
