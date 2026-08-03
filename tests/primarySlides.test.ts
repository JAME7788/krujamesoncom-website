// กันปัญหาที่เจอจริงตอนทำสไลด์ ป.1-ป.6
//
//  1. หน่วยส่วนใหญ่ไม่มีสไลด์ที่คนเขียนเอง เลยตกไปใช้ตัวสร้างอัตโนมัติ
//     ซึ่งบูลเล็ตแรกลอกชื่อหัวข้อมาทั้งดุ้น เด็กอ่านแล้วไม่ได้ความรู้เพิ่ม
//  2. อีโมจิ Unicode 13 (🪜 🪥) ขึ้นเป็นกล่องว่างบนเครื่องเก่าของโรงเรียน
//     ตรวจเจอตอนดูภาพจริงเท่านั้น เทสต์กับ typecheck เขียวหมดแต่จอเสีย
import { describe, expect, it } from 'vitest';
import { grades } from '../src/data/curriculum';
import { richSlides } from '../src/data/richSlides';
import { primaryRichSlides } from '../src/data/richSlidesPrimary';
import { secondaryRichSlides } from '../src/data/richSlidesSecondary';
import { electiveRichSlides } from '../src/data/richSlidesElective';

const PRIMARY = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'] as const;
const SECONDARY = ['m1-cs', 'm1-design', 'm2-cs', 'm2-design', 'm3-cs', 'm3-design'] as const;
const ELECTIVE = ['arduino-basic', 'electronics-basic'] as const;

const keysOf = (ids: readonly string[]) => ids.flatMap((gid) => {
  const g = grades.find((x) => x.id === gid);
  return (g?.units || []).map((u) => `${gid}_${u.no}`);
});

const primaryUnitKeys = keysOf(PRIMARY);
const secondaryUnitKeys = keysOf(SECONDARY);
const electiveUnitKeys = keysOf(ELECTIVE);
const allUnitKeys = [...primaryUnitKeys, ...secondaryUnitKeys, ...electiveUnitKeys];

/**
 * อีโมจิช่วง U+1FA70–U+1FAFF เพิ่มเข้ามาใน Unicode 12-14 ฟอนต์บน Windows รุ่นเก่า
 * ยังไม่มี glyph จึงขึ้นเป็นสี่เหลี่ยมว่าง — โรงเรียนใช้เครื่องเก่า จึงห้ามใช้ช่วงนี้
 */
const RISKY_EMOJI = /[\u{1FA70}-\u{1FAFF}]/u;

const allSlideText = (key: string) => JSON.stringify(richSlides[key] || []);

describe('ความครอบคลุมของสไลด์ ป.1-ป.6', () => {
  it('ทุกหน่วยของหลักสูตรหลักต้องมีสไลด์ที่เขียนเอง', () => {
    const missing = primaryUnitKeys.filter((key) => !richSlides[key]);
    expect(missing, `หน่วยที่ยังไม่มีสไลด์: ${missing.join(', ')}`).toEqual([]);
  });

  it('ทุกหน่วยของ ม.1-ม.3 ต้องมีสไลด์ที่เขียนเอง', () => {
    const missing = secondaryUnitKeys.filter((key) => !richSlides[key]);
    expect(missing, `หน่วยที่ยังไม่มีสไลด์: ${missing.join(', ')}`).toEqual([]);
  });

  it('ทุกหน่วยของ Arduino และอิเล็กทรอนิกส์ต้องมีสไลด์ที่เขียนเอง', () => {
    const missing = electiveUnitKeys.filter((key) => !richSlides[key]);
    expect(missing, `หน่วยที่ยังไม่มีสไลด์: ${missing.join(', ')}`).toEqual([]);
  });

  it('ต้องครบ 26 ประถม 21 มัธยม และ 14 วิชาเลือก', () => {
    expect(primaryUnitKeys.length).toBe(26);
    expect(secondaryUnitKeys.length).toBe(21);
    expect(electiveUnitKeys.length).toBe(14);
  });

  // ตัวนี้คือคำตอบของคำถาม "ครบทุกบทในเว็บหรือยัง" — ไม่ต้องมานับมือเอง
  // ถ้ามีคนเพิ่มหน่วยใหม่ในหลักสูตรแล้วลืมทำสไลด์ เทสต์นี้จะฟ้องทันทีพร้อมบอกว่าขาดหน่วยไหน
  it('ทุกหน่วยของทุกวิชาในเว็บต้องมีสไลด์ ไม่มีหน่วยไหนตกหล่น', () => {
    const everyUnitKey = grades.flatMap((g) => (g.units || []).map((u) => `${g.id}_${u.no}`));
    const missing = everyUnitKey.filter((key) => !richSlides[key]);
    expect(
      missing,
      `ยังขาดสไลด์ ${missing.length} หน่วย: ${missing.join(', ')}`,
    ).toEqual([]);
    expect(everyUnitKey.length, 'จำนวนหน่วยรวมทั้งเว็บเปลี่ยนไป').toBe(73);
  });

  it('สไลด์ที่เพิ่มใหม่ต้องไม่ทับ key ที่มีอยู่เดิม', () => {
    // p1_1 กับ p5_2 เขียนไว้ก่อนแล้วใน richSlides.ts ห้าม primaryRichSlides เขียนทับ
    expect(Object.keys(primaryRichSlides)).not.toContain('p1_1');
    expect(Object.keys(primaryRichSlides)).not.toContain('p5_2');
    expect(Object.keys(primaryRichSlides)).not.toContain('p3_1');
  });
});

describe('คุณภาพของสไลด์แต่ละหน่วย', () => {
  it.each(allUnitKeys)('%s ต้องมีโครงครบและเนื้อหาใช้ได้', (key) => {
    const deck = richSlides[key];
    expect(deck.length, `${key} มีสไลด์น้อยเกินไป`).toBeGreaterThanOrEqual(5);

    // แผ่นแรกต้องเป็นหน้าปก ให้เด็กรู้ว่ากำลังจะเรียนอะไร
    expect(deck[0].layout, `${key} แผ่นแรกไม่ใช่หน้าปก`).toBe('cover');
    expect(deck[0].body, `${key} หน้าปกไม่มีคำอธิบาย`).toBeTruthy();

    deck.forEach((slide, i) => {
      expect(slide.title.trim().length, `${key} แผ่น ${i + 1} ไม่มีหัวข้อ`).toBeGreaterThan(3);

      // บูลเล็ตห้ามลอกหัวข้อมาทั้งดุ้น — เป็นบั๊กเดิมของสไลด์อัตโนมัติ
      (slide.bullets || []).forEach((b) => {
        expect(
          b.text.trim(),
          `${key} แผ่น ${i + 1} บูลเล็ตซ้ำกับหัวข้อ`,
        ).not.toBe(slide.title.trim());
        expect(b.text.trim().length).toBeGreaterThan(2);
      });

      // เลย์เอาต์เปรียบเทียบต้องมีข้อมูลครบทั้งสองฝั่ง ไม่งั้นจะไม่แสดงผลเลย
      if (slide.layout === 'comparison') {
        expect(slide.compareLeft, `${key} แผ่น ${i + 1} ขาดฝั่งซ้าย`).toBeTruthy();
        expect(slide.compareRight, `${key} แผ่น ${i + 1} ขาดฝั่งขวา`).toBeTruthy();
        expect(slide.compareLeft!.items.length).toBeGreaterThan(1);
        expect(slide.compareRight!.items.length).toBeGreaterThan(1);
      }
    });
  });

  it.each(allUnitKeys)('%s ต้องไม่ใช้อีโมจิที่เครื่องเก่าแสดงไม่ได้', (key) => {
    const text = allSlideText(key);
    const found = text.match(RISKY_EMOJI);
    expect(
      found,
      `${key} ใช้อีโมจิ ${found?.[0]} ซึ่งขึ้นเป็นกล่องว่างบนเครื่องเก่า`,
    ).toBeNull();
  });

  // บังคับเฉพาะชุดที่เขียนใหม่ในไฟล์ richSlidesPrimary กับ p3_1
  // ส่วน p1_1 และ p5_2 เขียนไว้ก่อนหน้าด้วยโครงคนละแบบ ไม่ไปแก้ของเดิม
  it('ชุดที่เขียนใหม่ต้องปิดท้ายด้วยแผ่นตรวจความเข้าใจ', () => {
    [
      ...Object.keys(primaryRichSlides),
      ...Object.keys(secondaryRichSlides),
      ...Object.keys(electiveRichSlides),
      'p3_1',
    ].forEach((key) => {
      const deck = richSlides[key];
      const last = deck[deck.length - 1];
      expect(last.title, `${key} แผ่นสุดท้ายไม่ใช่การตรวจความเข้าใจ`).toMatch(/ตรวจ|สรุป|ทบทวน/);
    });
  });
});
