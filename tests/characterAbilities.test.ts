import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { TYCOON_CHARACTERS, ABILITY_VALUES } from '../src/data/tycoonGame';
import { SHOP_CHARACTERS, FREE_CHARACTER_IDS, isCharacterUnlocked } from '../src/data/characterShop';
import { coinsForGameScore } from '../src/services/coinService';

const game = readFileSync('src/pages/games/TycoonGame.tsx', 'utf8');

describe('ตัวละครและพลังพิเศษ', () => {
  it('ทุกตัวละครมีพลัง ชื่อพลัง และคำอธิบายครบ', () => {
    const broken = TYCOON_CHARACTERS.filter(
      (c) => !c.ability || !c.abilityName?.trim() || !c.abilityDesc?.trim(),
    );
    expect(broken.map((c) => c.id)).toEqual([]);
  });

  it('พลังต้องไม่ซ้ำกัน — ตัวละครแต่ละตัวต้องเล่นต่างกันจริง', () => {
    const abilities = TYCOON_CHARACTERS.map((c) => c.ability);
    expect(new Set(abilities).size).toBe(abilities.length);
  });

  it('ทุกพลังต้องมีโค้ดรองรับในเกม — กันตัวละครที่ซื้อแล้วไม่มีผลอะไร', () => {
    const unhandled = TYCOON_CHARACTERS
      .map((c) => c.ability)
      .filter((ability) => !game.includes(`'${ability}'`));
    expect(unhandled).toEqual([]);
  });

  it('มีตัวละครฟรีอย่างน้อย 1 ตัว — เด็กที่ยังไม่มีเหรียญต้องเล่นได้', () => {
    expect(FREE_CHARACTER_IDS.length).toBeGreaterThanOrEqual(1);
    expect(isCharacterUnlocked(FREE_CHARACTER_IDS[0], [])).toBe(true);
  });

  it('ตัวละครที่ยังไม่ซื้อต้องถูกล็อกไว้', () => {
    const paid = TYCOON_CHARACTERS.find((c) => c.price > 0)!;
    expect(isCharacterUnlocked(paid.id, [])).toBe(false);
    expect(isCharacterUnlocked(paid.id, [paid.id])).toBe(true);
  });

  it('ร้านค้าเรียงจากถูกไปแพง และราคาไม่ติดลบ', () => {
    const prices = SHOP_CHARACTERS.map((c) => c.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices.every((p) => p >= 0)).toBe(true);
  });

  it('ค่าพลังต้องอยู่ในช่วงที่สมเหตุสมผล — ไม่ทำให้เกมพัง', () => {
    expect(ABILITY_VALUES.discountRate).toBeGreaterThan(0);
    expect(ABILITY_VALUES.discountRate).toBeLessThan(1);
    expect(ABILITY_VALUES.shieldRate).toBeGreaterThan(0);
    expect(ABILITY_VALUES.shieldRate).toBeLessThan(1);
    expect(ABILITY_VALUES.luckyRate).toBeGreaterThan(0);
    expect(ABILITY_VALUES.luckyRate).toBeLessThanOrEqual(1);
    expect(ABILITY_VALUES.magnetRange).toBeGreaterThanOrEqual(1);
  });
});

describe('ระบบเหรียญ', () => {
  it('เล่นจบต้องได้เหรียญเสมอ แม้ทำคะแนนไม่ได้เลย', () => {
    expect(coinsForGameScore(0)).toBeGreaterThan(0);
    expect(coinsForGameScore(undefined)).toBeGreaterThan(0);
  });

  it('ทำคะแนนมากได้เหรียญมากขึ้น', () => {
    expect(coinsForGameScore(200)).toBeGreaterThan(coinsForGameScore(10));
  });

  it('มีเพดานกันการปั๊มเหรียญจากคะแนนสูงผิดปกติ', () => {
    expect(coinsForGameScore(1_000_000)).toBeLessThanOrEqual(30);
  });
});
