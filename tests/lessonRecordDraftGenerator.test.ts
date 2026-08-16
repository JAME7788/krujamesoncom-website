// ตัวเติมร่างบันทึกหลังสอน — ถ้าเขียนข้อความเดียวใช้ได้กับทุกคาบ ครูก็ไม่ได้ประโยชน์อะไร
// เทสต์ชุดนี้จึงคุมว่าร่างต้องอ้างอิงหัวข้อจริงของคาบ และต่างกันตามประเภทบทเรียนกับช่วงวัย
import { describe, expect, it } from 'vitest';
import {
  buildLessonRecordDraft,
  isTaughtAlready,
} from '../src/services/lessonRecordDraftGenerator';

const base = {
  gradeId: 'p1',
  unitTitle: 'การใช้งานเทคโนโลยีเบื้องต้น',
  lessonTitle: 'คลิกหนึ่งครั้งและดับเบิลคลิก',
  teachingDate: '2026-06-11',
  planNo: 6,
  week: 6,
  totalStudents: 12,
};

describe('เติมร่างบันทึกหลังสอน', () => {
  it('ต้องเป็นฉบับร่างเสมอ เพราะระบบไม่รู้ว่าในห้องเกิดอะไรขึ้นจริง', () => {
    expect(buildLessonRecordDraft(base).status).toBe('draft');
  });

  it('ต้องอ้างอิงชื่อเรื่องจริงของคาบ ไม่ใช่ข้อความกลาง', () => {
    const draft = buildLessonRecordDraft(base);
    expect(draft.strengths).toContain('คลิกหนึ่งครั้งและดับเบิลคลิก');
    expect(draft.lessonTitle).toBe('คลิกหนึ่งครั้งและดับเบิลคลิก');
    expect(draft.unitName).toBe('การใช้งานเทคโนโลยีเบื้องต้น');
    expect(draft.planNo).toBe('6');
    expect(draft.teachingDate).toBe('2026-06-11');
  });

  it('ระบุจำนวนนักเรียนของห้องนั้นจริง', () => {
    expect(buildLessonRecordDraft(base).strengths).toContain('12 คน');
    // ไม่ส่งจำนวนมา ต้องไม่ขึ้นคำว่า undefined
    const noCount = buildLessonRecordDraft({ ...base, totalStudents: undefined });
    expect(noCount.strengths).not.toContain('undefined');
  });

  it('บทเรียนคนละประเภทต้องได้ปัญหาและสาเหตุคนละแบบ', () => {
    const coding = buildLessonRecordDraft(base);
    const safety = buildLessonRecordDraft({
      ...base,
      lessonTitle: 'ใช้เทคโนโลยีอย่างปลอดภัยและรักษาข้อมูลส่วนตัว',
      unitTitle: 'การใช้เทคโนโลยีสารสนเทศ',
    });
    const data = buildLessonRecordDraft({
      ...base,
      lessonTitle: 'รวบรวมและนำเสนอข้อมูลด้วยแผนภูมิ',
      unitTitle: 'การรวบรวม ประมวลผล และนำเสนอข้อมูล',
    });
    expect(coding.problems).not.toBe(safety.problems);
    expect(coding.causes).not.toBe(safety.causes);
    expect(data.problems).not.toBe(coding.problems);
  });

  it('ชั้นต่างกันต้องได้แนวทางที่ยากง่ายต่างกัน', () => {
    const p1 = buildLessonRecordDraft(base);
    const m3 = buildLessonRecordDraft({ ...base, gradeId: 'm3' });
    expect(p1.strengths).not.toBe(m3.strengths);
    expect(p1.improvements).not.toBe(m3.improvements);
  });

  it('ม.1 ต้องนับเป็นช่วงวัยโต ไม่ใช่ประถมต้น', () => {
    const m1 = buildLessonRecordDraft({ ...base, gradeId: 'm1' });
    const p6 = buildLessonRecordDraft({ ...base, gradeId: 'p6' });
    expect(m1.suggestion).toContain('ระดับโต');
    expect(p6.suggestion).toContain('ระดับโต');
    expect(buildLessonRecordDraft({ ...base, gradeId: 'p2' }).suggestion).toContain('ประถมต้น');
  });

  it('ทุกช่องต้องมีเนื้อหา ไม่ปล่อยว่างให้ครูงง', () => {
    const draft = buildLessonRecordDraft(base);
    (['strengths', 'problems', 'causes', 'improvements', 'nextAction', 'suggestion'] as const)
      .forEach((field) => {
        expect(draft[field]?.trim().length, `${field} ว่างหรือสั้นเกินไป`).toBeGreaterThan(25);
        expect(draft[field]).not.toContain('undefined');
      });
  });

  it('ข้อเสนอแนะต้องเตือนว่าเป็นร่าง ครูต้องแก้ก่อน', () => {
    expect(buildLessonRecordDraft(base).suggestion).toContain('ครูต้องแก้');
  });
});

describe('ตรวจว่าคาบถึงกำหนดสอนแล้วหรือยัง', () => {
  const today = new Date(2026, 7, 3); // 3 ส.ค. 2569

  it.each([
    ['2026-07-23', true],
    ['2026-08-03', true],   // วันนี้ต้องนับว่าสอนแล้ว
    ['2026-08-04', false],
    ['2026-12-01', false],
  ])('%s -> %s', (date, expected) => {
    expect(isTaughtAlready(date, today)).toBe(expected);
  });

  it('วันที่ผิดรูปแบบต้องไม่พัง', () => {
    expect(isTaughtAlready('', today)).toBe(false);
    expect(isTaughtAlready('ไม่ใช่วันที่', today)).toBe(false);
  });
});
