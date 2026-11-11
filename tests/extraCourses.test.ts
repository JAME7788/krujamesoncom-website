// วิชาเลือกที่เรียบเรียงจากเอกสารคลังโรงเรียน (IoT, ฐานข้อมูล, เล่าเรื่องดิจิทัล)
// และบทเรียน พ.ร.บ.คอมพิวเตอร์ที่เติมลงหน่วยความปลอดภัย ป.4–6 และ ม.1–3
import { describe, expect, it } from 'vitest';
import { grades } from '../src/data/curriculum';
import { unitExtras } from '../src/data/unitExtras';
import { extraCourses } from '../src/data/extraCourses';
import { computerLawQuestionTexts, computerLawUnitKeys } from '../src/data/computerLawContent';
import { defaultCourseAccessSettings } from '../src/services/courseAccessService';

const EXTRA_IDS = ['iot-smart', 'database-basic', 'digital-story'];

describe('วิชาเลือกจากเอกสารคลังโรงเรียน', () => {
  it('ลงทะเบียนครบทั้ง 3 วิชาและไม่ซ้ำ', () => {
    expect(extraCourses.map((c) => c.id)).toEqual(EXTRA_IDS);
    for (const id of EXTRA_IDS) {
      expect(grades.filter((g) => g.id === id)).toHaveLength(1);
    }
  });

  it.each(EXTRA_IDS)('%s ทุกหน่วยมีกิจกรรมอย่างน้อย 3 ข้อ ตัวชี้วัดถูกต้อง และมีแบบทดสอบ', (id) => {
    const course = grades.find((g) => g.id === id)!;
    course.units.forEach((unit) => {
      expect(unit.activities?.length ?? 0, `${id} หน่วย ${unit.no}`).toBeGreaterThanOrEqual(3);
      unit.indicators.forEach((idx) => expect(course.indicators[idx], `${id} หน่วย ${unit.no}`).toBeTruthy());
      const quiz = unitExtras[id]?.[unit.no]?.quiz ?? [];
      expect(quiz.length, `${id} หน่วย ${unit.no} ไม่มีแบบทดสอบ`).toBeGreaterThanOrEqual(3);
    });
  });

  it('คำตอบที่ถูกไม่อยู่ตำแหน่งเดียวกันทุกข้อ (เด็กเดาไม่ได้)', () => {
    const answers = EXTRA_IDS.flatMap((id) =>
      Object.values(unitExtras[id] ?? {}).flatMap((u) => (u.quiz ?? []).map((q) => q.answer)),
    );
    expect(new Set(answers).size).toBeGreaterThan(1);
    EXTRA_IDS.forEach((id) =>
      Object.values(unitExtras[id] ?? {}).forEach((u) =>
        (u.quiz ?? []).forEach((q) => {
          expect(q.answer).toBeGreaterThanOrEqual(0);
          expect(q.answer).toBeLessThan(q.options.length);
        }),
      ),
    );
  });

  it('เปิดให้ห้อง ม.1–ม.3 เข้าเรียนได้ตั้งแต่ต้น', () => {
    const settings = defaultCourseAccessSettings();
    const secondaryLists = Object.entries(settings.openCourseIdsByClassroom ?? {})
      .filter(([room]) => /^m/i.test(room) || room.includes('ม.'));
    expect(secondaryLists.length).toBeGreaterThan(0);
    secondaryLists.forEach(([, ids]) => EXTRA_IDS.forEach((id) => expect(ids).toContain(id)));
  });
});

describe('บทเรียน พ.ร.บ.คอมพิวเตอร์', () => {
  it('เติมลงหน่วยความปลอดภัยทั้ง 6 ชั้น โดยไม่ทับแบบทดสอบเดิม', () => {
    expect(computerLawUnitKeys).toEqual(['p4_5', 'p5_4', 'p6_4', 'm1-cs_2', 'm2-cs_4', 'm3-cs_4']);
    for (const key of computerLawUnitKeys) {
      const cut = key.lastIndexOf('_');
      const unit = unitExtras[key.slice(0, cut)][Number(key.slice(cut + 1))];
      const texts = (unit.quiz ?? []).map((q) => q.q);
      const lawTexts = computerLawQuestionTexts(key);
      expect(lawTexts).toHaveLength(3);
      lawTexts.forEach((t) => expect(texts, `${key} ไม่มีคำถาม พ.ร.บ.`).toContain(t));
      // ของเดิมยังอยู่ครบ: คำถาม พ.ร.บ. ต่อท้าย ไม่ได้แทนที่
      expect(texts.slice(-3)).toEqual(lawTexts);
      expect(unit.articles?.some((a) => a.source === 'ราชกิจจานุเบกษา'), `${key} ไม่มีลิงก์ตัวบท`).toBe(true);
      expect(unit.lessonNotes?.summary?.length ?? 0).toBeGreaterThanOrEqual(5);
      (unit.quiz ?? []).forEach((q) => expect(q.answer).toBeLessThan(q.options.length));
    }
  });

  it('ระบุโทษตรงตัวบท (มาตรา 16: จำคุกไม่เกิน 3 ปี และปรับไม่เกิน 200,000 บาท)', () => {
    const summary = unitExtras['m3-cs'][4].lessonNotes?.summary ?? [];
    expect(summary.join('\n')).toContain('มาตรา 16: เผยแพร่ภาพผู้อื่นที่ตัดต่อจนเสียชื่อเสียงหรืออับอาย จำคุกไม่เกิน 3 ปี และปรับไม่เกิน 200,000 บาท');
  });
});
