// เดิมแผน ป.2-ป.6 ทั้ง 200 แผนใช้เทมเพลตเดียวกัน ต่างแค่ชื่อเรื่องที่เสียบเข้าไป
// เทสต์ชุดนี้กันไม่ให้ย้อนกลับไปเป็นแบบนั้นอีก
import { describe, expect, it } from 'vitest';
import {
  getAllTechnologyLessonPlans,
  getTechnologyLessonPlans,
} from '../src/data/technologyLessonPlans';
import {
  ageBandOf,
  classifyLesson,
  LESSON_PROFILES,
  type LessonCategory,
} from '../src/data/lessonContentProfiles';

const GENERATED_GRADES = ['p2', 'p3', 'p4', 'p5', 'p6'] as const;
const stepSignature = (plan: { steps: Array<{ teacher: string; students: string }> }) =>
  plan.steps.map((s) => `${s.teacher}|${s.students}`).join('~');

describe('จัดประเภทบทเรียน', () => {
  it.each<[string, LessonCategory]>([
    ['การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัยและปฏิบัติตามข้อตกลง', 'safety'],
    ['เขียนโปรแกรมอย่างง่ายและตรวจหาข้อผิดพลาดของโปรแกรม', 'programming'],
    ['ใช้อินเทอร์เน็ตค้นหาความรู้และประเมินความน่าเชื่อถือ', 'internet'],
    ['รวบรวม ประมวลผล และนำเสนอข้อมูลโดยใช้ซอฟต์แวร์', 'data'],
    ['แสดงอัลกอริทึมในการแก้ปัญหาอย่างง่าย', 'algorithm'],
    ['การใช้งานคีย์บอร์ดและเมาส์เบื้องต้น', 'hardware'],
  ])('“%s” ต้องเข้ากลุ่ม %s', (title, expected) => {
    expect(classifyLesson(title)).toBe(expected);
  });

  it('ความปลอดภัยต้องมาก่อนข้อมูล เพราะ "ข้อมูลส่วนตัว" เป็นเรื่องความปลอดภัย', () => {
    expect(classifyLesson('การปกป้องข้อมูลส่วนตัวบนอินเทอร์เน็ต')).toBe('safety');
  });

  // เคยจัดผิดจริง: ชื่อเรื่องบอกว่าเป็นอัลกอริทึม แต่คำว่า "ข้อมูล" ในคำอธิบายกิจกรรม
  // ไปชนะเพราะเดิมใช้วิธีเจอคำแรกแล้วจบ ตอนนี้ให้น้ำหนักชื่อเรื่องมากกว่ากิจกรรม
  it('ชื่อเรื่องต้องมีน้ำหนักมากกว่าคำที่บังเอิญโผล่ในคำอธิบายกิจกรรม', () => {
    expect(classifyLesson({
      title: 'การหารูปแบบของปัญหา และแยกย่อยเป็นส่วน ๆ',
      unit: 'เหตุผลเชิงตรรกะกับการแก้ปัญหา',
      activity: 'วิเคราะห์โจทย์ แล้วแยกข้อมูล เงื่อนไข และผลลัพธ์ที่ต้องการ',
    })).toBe('algorithm');
  });

  it('ช่วงวัยต้องแบ่ง ป.1-2 / ป.3-4 / ป.5-6', () => {
    expect([1, 2].map(ageBandOf)).toEqual(['early', 'early']);
    expect([3, 4].map(ageBandOf)).toEqual(['middle', 'middle']);
    expect([5, 6].map(ageBandOf)).toEqual(['upper', 'upper']);
  });
});

describe('เนื้อหาแต่ละแผนต้องไม่เหมือนกันไปหมด', () => {
  it('บทเรียนคนละประเภทในชั้นเดียวกันต้องมีขั้นสอนต่างกัน', () => {
    const p4 = getTechnologyLessonPlans('p4');
    const signatures = new Set(p4.map(stepSignature));
    expect(
      signatures.size,
      'ป.4 ทุกแผนมีขั้นสอนเหมือนกันหมด แปลว่ากลับไปใช้เทมเพลตเดียวแล้ว',
    ).toBeGreaterThan(1);
  });

  it('ประเภทเดียวกันแต่คนละช่วงวัยต้องยากไม่เท่ากัน', () => {
    const early = LESSON_PROFILES.programming.bands.early;
    const upper = LESSON_PROFILES.programming.bands.upper;
    expect(early.independent).not.toBe(upper.independent);
    expect(early.kCriteria).not.toBe(upper.kCriteria);
    // ระดับปลายต้องมีคำถามตรวจสอบมากกว่าระดับต้น
    expect(upper.questions.length).toBeGreaterThan(early.questions.length);
  });

  it('ทุกโปรไฟล์ต้องมีเนื้อหาครบทุกช่อง ไม่มีช่องว่าง', () => {
    Object.entries(LESSON_PROFILES).forEach(([category, profile]) => {
      (['early', 'middle', 'upper'] as const).forEach((band) => {
        const c = profile.bands[band];
        ([
          'hook', 'concept', 'guided', 'independent', 'reflect',
          'kCriteria', 'pCriteria', 'aCriteria', 'product',
        ] as const).forEach((field) => {
          expect(c[field].trim().length, `${category}.${band}.${field} ว่าง`).toBeGreaterThan(15);
        });
        expect(c.questions.length, `${category}.${band}.questions น้อยไป`).toBeGreaterThanOrEqual(3);
        expect(c.support.length, `${category}.${band}.support น้อยไป`).toBeGreaterThanOrEqual(3);
      });
    });
  });

  it('แผนที่สร้างทั้งหมดต้องมีขั้นสอนหลากหลายพอ ไม่ใช่แบบเดียว', () => {
    const all = getAllTechnologyLessonPlans();
    const signatures = new Set<string>();
    GENERATED_GRADES.forEach((g) => all[g].forEach((p) => signatures.add(stepSignature(p))));
    // อย่างน้อยต้องแตกต่างตามจำนวนกลุ่มเนื้อหาที่ใช้จริง
    expect(
      signatures.size,
      'แผนที่สร้างขึ้นมีขั้นสอนแบบเดียวหรือน้อยเกินไป',
    ).toBeGreaterThanOrEqual(4);
  });
});

describe('ทุกแผนต้องพร้อมใช้จริง', () => {
  it.each(GENERATED_GRADES)('แผนของ %s ต้องมีข้อมูลครบทุกแผน', (gradeId) => {
    const plans = getTechnologyLessonPlans(gradeId);
    expect(plans.length).toBeGreaterThan(0);
    plans.forEach((plan) => {
      expect(plan.steps).toHaveLength(5);
      // เวลารวมต้องพอดี 1 คาบ 50 นาที
      expect(
        plan.steps.reduce((sum, s) => sum + s.minutes, 0),
        `แผนที่ ${plan.no} เวลารวมไม่ครบ 50 นาที`,
      ).toBe(50);
      expect(plan.assessments).toHaveLength(3);
      expect(plan.assessments.map((a) => a.domain)).toEqual(['K', 'P', 'A']);
      plan.assessments.forEach((a) => {
        expect(a.criteria.length, `แผนที่ ${plan.no} เกณฑ์ ${a.domain} สั้นเกินไป`)
          .toBeGreaterThan(15);
      });
      // teacherWorkflow.test.ts กำหนดขั้นต่ำไว้ 5 ข้อ — ยึดตัวเลขเดียวกันไม่ให้หลวมกว่า
      expect(plan.checkQuestions.length).toBeGreaterThanOrEqual(5);
      expect(plan.support.length).toBeGreaterThanOrEqual(3);
      expect(plan.product.trim().length).toBeGreaterThan(10);
      // ห้ามมีข้อความค้างที่ยังไม่ได้เติมค่า
      const blob = JSON.stringify(plan);
      expect(blob).not.toContain('undefined');
      expect(blob).not.toContain('${');
    });
  });
});
