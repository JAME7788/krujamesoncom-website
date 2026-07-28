import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { CHANCE_CARDS } from '../src/data/tycoonGame';
import type { ChanceEffect } from '../src/data/tycoonGame';

const source = readFileSync('src/pages/games/TycoonGame.tsx', 'utf8');

describe('บัตรเสี่ยงดวงเกมเศรษฐี', () => {
  it('มีบัตรที่กระทบผู้เล่นคนอื่น — บอร์ดเกมต้องมีปฏิสัมพันธ์ ไม่ใช่ต่างคนต่างเล่น', () => {
    const interactive = CHANCE_CARDS.filter((c) => c.effect);
    expect(interactive.length).toBeGreaterThanOrEqual(4);
  });

  it('ทุกบัตรมีข้อความและอีโมจิครบ', () => {
    const broken = CHANCE_CARDS.filter((c) => !c.text?.trim() || !c.emoji?.trim());
    expect(broken).toEqual([]);
  });

  it('บัตรที่ต้องใช้จำนวนเงินต้องระบุ amount ที่เป็นบวก', () => {
    const needsAmount: ChanceEffect[] = ['takeFromRichest', 'everyonePays', 'payEveryone'];
    const bad = CHANCE_CARDS
      .filter((c) => c.effect && needsAmount.includes(c.effect))
      .filter((c) => !c.amount || c.amount <= 0);
    expect(bad.map((c) => c.text)).toEqual([]);
  });

  it('เกมต้องรองรับทุก effect ที่มีในคลังบัตร — กันบัตรที่จับแล้วไม่เกิดอะไรขึ้น', () => {
    const used = [...new Set(CHANCE_CARDS.map((c) => c.effect).filter(Boolean))] as ChanceEffect[];
    const unhandled = used.filter((effect) => !source.includes(`'${effect}'`));
    expect(unhandled).toEqual([]);
  });

  it('บัตรจ่ายเงินต้องไม่ทำให้เงินรวมในเกมงอกเอง (เป็นการโอนระหว่างผู้เล่น)', () => {
    // ตรวจจากโค้ด: everyonePays/payEveryone ต้องมีทั้งฝั่งบวกและฝั่งลบ
    const everyonePays = source.slice(source.indexOf("c.effect === 'everyonePays'"), source.indexOf("c.effect === 'payEveryone'"));
    expect(everyonePays).toContain('money: p.money + total');
    expect(everyonePays).toContain('money: p.money - amount');
  });

  it('เก็บเงินจากคนรวยที่สุดต้องไม่เก็บเกินเงินที่เขามี', () => {
    expect(source).toContain('Math.min(amount, Math.max(0, richest.money))');
  });
});
