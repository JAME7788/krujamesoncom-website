// ระบบเหรียญ — สกุลเงินในเว็บที่ได้จากการเรียนรู้ ใช้ซื้อตัวละครในร้านค้า
//
// หลักคิด: เด็กได้เหรียญจาก "การทำกิจกรรมที่มีคะแนน" เท่านั้น (เล่นเกมจบ ทำภารกิจ)
// จึงเป็นแรงจูงใจภายนอกที่ผูกกับการเรียนรู้จริง ไม่ใช่การกดรัว ๆ
//
// เก็บแยกรายคน (ต่อ studentId) — ผู้ที่ยังไม่ล็อกอินใช้กระเป๋ารวมของเครื่อง

const walletKey = (studentId?: string) => `kj_coins_${studentId || 'guest'}`;
const ownedKey = (studentId?: string) => `kj_characters_${studentId || 'guest'}`;

const readNumber = (key: string): number => {
  try {
    const raw = localStorage.getItem(key);
    const n = raw ? Number(raw) : 0;
    return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
  } catch {
    return 0;
  }
};

const write = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* โหมดส่วนตัวเขียนไม่ได้ ไม่ต้องพัง */ }
};

/** ยอดเหรียญคงเหลือ */
export const getCoins = (studentId?: string): number => readNumber(walletKey(studentId));

/**
 * เพิ่มเหรียญ — คืนยอดใหม่
 * ใช้ตอนเล่นเกมจบหรือทำกิจกรรมที่ได้คะแนน
 */
export const addCoins = (amount: number, studentId?: string): number => {
  if (!Number.isFinite(amount) || amount <= 0) return getCoins(studentId);
  const next = getCoins(studentId) + Math.floor(amount);
  write(walletKey(studentId), String(next));
  return next;
};

/** หักเหรียญ — คืน true ถ้าจ่ายสำเร็จ (เงินพอ) */
export const spendCoins = (amount: number, studentId?: string): boolean => {
  const balance = getCoins(studentId);
  if (!Number.isFinite(amount) || amount <= 0 || balance < amount) return false;
  write(walletKey(studentId), String(balance - Math.floor(amount)));
  return true;
};

/**
 * คำนวณเหรียญที่ได้จากการเล่นเกม 1 ครั้ง
 * ให้รางวัลพื้นฐานเสมอ (เด็กที่ยังทำได้ไม่ดีก็ยังได้กำลังใจ)
 * แล้วบวกตามคะแนนที่ทำได้ โดยมีเพดานกันการปั๊ม
 */
export const coinsForGameScore = (score?: number): number => {
  const base = 5;
  const bonus = typeof score === 'number' && score > 0 ? Math.min(20, Math.floor(score / 10)) : 0;
  return base + bonus;
};

/** รายชื่อตัวละครที่ซื้อแล้ว */
export const getOwnedCharacters = (studentId?: string): string[] => {
  try {
    const raw = localStorage.getItem(ownedKey(studentId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
};

export const ownsCharacter = (characterId: string, studentId?: string): boolean => (
  getOwnedCharacters(studentId).includes(characterId)
);

/** บันทึกว่าซื้อตัวละครแล้ว */
export const grantCharacter = (characterId: string, studentId?: string): string[] => {
  const owned = getOwnedCharacters(studentId);
  if (owned.includes(characterId)) return owned;
  const next = [...owned, characterId];
  write(ownedKey(studentId), JSON.stringify(next));
  return next;
};

/**
 * ซื้อตัวละคร — หักเหรียญแล้วบันทึกสิทธิ์
 * คืนผลลัพธ์ให้ UI แสดงข้อความได้ถูกต้อง
 */
export const buyCharacter = (
  characterId: string,
  price: number,
  studentId?: string,
): { ok: boolean; reason?: 'owned' | 'not_enough'; coins: number } => {
  if (ownsCharacter(characterId, studentId)) {
    return { ok: false, reason: 'owned', coins: getCoins(studentId) };
  }
  if (!spendCoins(price, studentId)) {
    return { ok: false, reason: 'not_enough', coins: getCoins(studentId) };
  }
  grantCharacter(characterId, studentId);
  return { ok: true, coins: getCoins(studentId) };
};
