import { describe, it, expect } from 'vitest';
import { gameLessons, ageTierFromClassroom, ageTierLabel } from '../src/data/gameLessons';
import type { AgeTier, LessonBody } from '../src/data/gameLessons';

const TIERS: AgeTier[] = ['lower', 'upper', 'middle'];

describe('บทเรียนก่อนเล่นเกม — การเลือกเนื้อหาตามวัย', () => {
  it('ป.1-3 ได้เนื้อหาระดับเด็กเล็ก', () => {
    ['ป.1', 'ป.2', 'ป.3'].forEach((c) => expect(ageTierFromClassroom(c)).toBe('lower'));
  });

  it('ป.4-6 ได้เนื้อหาระดับประถมปลาย', () => {
    ['ป.4', 'ป.5', 'ป.6'].forEach((c) => expect(ageTierFromClassroom(c)).toBe('upper'));
  });

  it('ม.1-3 ได้เนื้อหาระดับมัธยม', () => {
    ['ม.1', 'ม.2', 'ม.3'].forEach((c) => expect(ageTierFromClassroom(c)).toBe('middle'));
  });

  it('ผู้ที่ยังไม่ล็อกอินได้เนื้อหาระดับกลาง (ไม่พัง)', () => {
    expect(ageTierFromClassroom(undefined)).toBe('upper');
    expect(ageTierFromClassroom('')).toBe('upper');
  });

  it('มีป้ายกำกับระดับครบทุกช่วงวัย', () => {
    TIERS.forEach((t) => expect(ageTierLabel[t]).toBeTruthy());
  });
});

describe('บทเรียนก่อนเล่นเกม — ความสมบูรณ์ของเนื้อหา', () => {
  const entries = Object.entries(gameLessons);

  it('มีบทเรียนอย่างน้อย 7 เกม', () => {
    expect(entries.length).toBeGreaterThanOrEqual(7);
  });

  it('ทุกบทเรียนมีหัวเรื่อง อีโมจิ และสีครบ', () => {
    const bad = entries.filter(([, l]) => !l.title?.trim() || !l.emoji?.trim() || !l.subject?.trim() || !/^#[0-9a-f]{3,6}$/i.test(l.color));
    expect(bad.map(([k]) => k)).toEqual([]);
  });

  it('ทุกเกมมีเนื้อหาครบทั้ง 3 ช่วงวัย และแต่ละช่วงมีส่วนประกอบครบ', () => {
    const problems: string[] = [];
    for (const [key, lesson] of entries) {
      for (const tier of TIERS) {
        const body = lesson[tier] as LessonBody | undefined;
        if (!body) { problems.push(`${key}/${tier}: ไม่มีเนื้อหา`); continue; }
        if (!body.concept?.trim()) problems.push(`${key}/${tier}: ไม่มีแนวคิดหลัก`);
        if (!body.example?.trim()) problems.push(`${key}/${tier}: ไม่มีตัวอย่าง`);
        if ((body.points?.length || 0) < 2) problems.push(`${key}/${tier}: ประเด็นหลักน้อยกว่า 2 ข้อ`);
        if ((body.howTo?.length || 0) < 2) problems.push(`${key}/${tier}: วิธีเล่นน้อยกว่า 2 ข้อ`);
        (body.points || []).forEach((pt, i) => {
          if (!pt.icon?.trim() || !pt.text?.trim()) problems.push(`${key}/${tier}: ประเด็นข้อ ${i + 1} ไม่ครบ`);
        });
      }
    }
    expect(problems).toEqual([]);
  });

  it('เนื้อหาแต่ละช่วงวัยต้องต่างกันจริง — กันการคัดลอกข้อความซ้ำ', () => {
    const duplicated: string[] = [];
    for (const [key, lesson] of entries) {
      const concepts = TIERS.map((t) => lesson[t].concept.trim());
      if (new Set(concepts).size !== concepts.length) duplicated.push(key);
    }
    expect(duplicated).toEqual([]);
  });

  it('เนื้อหาของเด็กเล็กต้องสั้นกว่าของมัธยม (อ่านง่ายตามวัย)', () => {
    const tooLong: string[] = [];
    for (const [key, lesson] of entries) {
      if (lesson.lower.concept.length > lesson.middle.concept.length) tooLong.push(key);
    }
    expect(tooLong).toEqual([]);
  });
});
