// เทสต์กันบั๊กที่เคยเกิดจริง ไม่ใช่เทสต์ทฤษฎี
//
// เหตุการณ์: ตารางสอน ป.1 ถูกลงไว้เป็น "พุธ 08:30" ทั้งที่เรียนจริงพฤหัสบดีบ่าย
// ผลคือกิจกรรมทั้งห้องถูกนับเป็น "นอกคาบ" 100% → P เหลือ 40% และ A ขาด 4 คะแนน
// ซ้ำร้ายตารางถูกเก็บไว้ 2 ที่ที่ไม่รู้จักกัน แก้ที่เดียวอีกที่จึงเพี้ยนเงียบ ๆ
import { describe, expect, it } from 'vitest';
import { defaultSchedule, gradedSlotOf, minutesOf } from '../src/data/schedule';
import {
  PRIMARY_TECHNOLOGY_GRADE_IDS,
  primaryTechnologyTeachingSchedules,
} from '../src/data/technologyTeachingSchedule';
import { normalizeStudentNumber, buildStudentLoginId } from '../src/context/AuthContext';
import { buildDefaultTeachingSessions } from '../src/services/teachingSessionService';

const THAI_DAYS = [
  'วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ',
  'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์',
];

/** แปลง 'วันพฤหัสบดี 13:00-14:00 น.' เป็น { day, start, end } */
const parseWeeklySlot = (slot: string) => {
  const dayIndex = THAI_DAYS.findIndex((d) => slot.startsWith(d));
  const times = slot.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/);
  return { day: dayIndex, start: times?.[1] ?? '', end: times?.[2] ?? '' };
};

const classroomOf = (gradeId: string) => `ป.${gradeId.slice(1)}`;

describe('ตารางสอนต้องตรงกันทุกที่ที่เก็บไว้', () => {
  it.each(PRIMARY_TECHNOLOGY_GRADE_IDS)(
    'ตารางในแผนที่พิมพ์ของ %s ต้องตรงกับตารางที่ใช้คิดคะแนน',
    (gradeId) => {
      const classroom = classroomOf(gradeId);
      const printed = primaryTechnologyTeachingSchedules
        .find((item) => item.gradeId === gradeId);
      expect(printed, `ไม่พบตารางของ ${classroom}`).toBeTruthy();

      const parsed = parseWeeklySlot(printed!.weeklySlot);
      expect(parsed.day, `อ่านชื่อวันจาก "${printed!.weeklySlot}" ไม่ออก`)
        .toBeGreaterThanOrEqual(0);

      // ต้องเทียบกับคาบที่นับคะแนนเท่านั้น เพราะห้องหนึ่งมีทั้งคาบเทคโนโลยีและกิจกรรมตามความสนใจ
      const scoringSlot = gradedSlotOf(classroom);
      expect(scoringSlot, `defaultSchedule ไม่มี ${classroom}`).toBeTruthy();

      // วันต้องตรงกัน ไม่งั้นคะแนนกับเอกสารจะเล่าคนละเรื่อง
      expect(
        parsed.day,
        `${classroom}: แผนพิมพ์ว่า "${printed!.weeklySlot}" แต่ระบบคิดคะแนนใช้ `
        + `${THAI_DAYS[scoringSlot!.day]} ${scoringSlot!.start}-${scoringSlot!.end}`,
      ).toBe(scoringSlot!.day);

      // ช่วงเวลาต้องคาบเกี่ยวกันจริง ไม่ใช่แค่วันตรง
      expect(minutesOf(parsed.start)).toBeLessThan(minutesOf(scoringSlot!.end));
      expect(minutesOf(parsed.end)).toBeGreaterThan(minutesOf(scoringSlot!.start));
    },
  );

  // สำเนาตารางชุดที่ 3: weekdayByGrade ใน teachingSessionService ใช้คำนวณ "วันที่ตามแผน"
  // เคยลง ป.1 เป็นวันพุธทั้งที่เรียนพฤหัสบดี ทำให้วันที่ตามแผนของทั้ง 40 คาบผิดวันหมด
  it.each(PRIMARY_TECHNOLOGY_GRADE_IDS)(
    'วันที่ตามแผนของ %s ต้องตรงกับวันเรียนในตารางคิดคะแนน',
    (gradeId) => {
      const classroom = classroomOf(gradeId);
      // ต้องเทียบกับคาบที่นับคะแนนเท่านั้น เพราะห้องหนึ่งมีทั้งคาบเทคโนโลยีและกิจกรรมตามความสนใจ
      const scoringSlot = gradedSlotOf(classroom);
      expect(scoringSlot, `defaultSchedule ไม่มี ${classroom}`).toBeTruthy();

      const sessions = buildDefaultTeachingSessions(gradeId);
      expect(sessions.length).toBeGreaterThan(0);

      sessions.forEach((session) => {
        // plannedDate เป็น YYYY-MM-DD ตีความเป็นเวลาท้องถิ่นเพื่อไม่ให้เขตเวลาทำให้วันเลื่อน
        const [y, m, d] = session.plannedDate.split('-').map(Number);
        const weekday = new Date(y, m - 1, d).getDay();
        expect(
          weekday,
          `${classroom} คาบ ${session.period}: วันที่ตามแผน ${session.plannedDate} `
          + `ตรงกับ ${THAI_DAYS[weekday]} แต่ตารางคิดคะแนนใช้ ${THAI_DAYS[scoringSlot!.day]}`,
        ).toBe(scoringSlot!.day);
      });
    },
  );

  it('ทุกห้องในตารางคิดคะแนนต้องมีเวลาเริ่มก่อนเวลาจบ', () => {
    defaultSchedule.forEach((slot) => {
      expect(
        minutesOf(slot.start),
        `${slot.classroom} ${slot.start}-${slot.end} เวลากลับหัว`,
      ).toBeLessThan(minutesOf(slot.end));
    });
  });

  it('ห้ามมีคาบซ้อนกันในห้องเดียวกัน', () => {
    const byRoom = new Map<string, typeof defaultSchedule>();
    defaultSchedule.forEach((slot) => {
      byRoom.set(slot.classroom, [...(byRoom.get(slot.classroom) || []), slot]);
    });
    byRoom.forEach((slots, classroom) => {
      slots.forEach((a, i) => slots.slice(i + 1).forEach((b) => {
        if (a.day !== b.day) return;
        const overlap = minutesOf(a.start) < minutesOf(b.end)
          && minutesOf(b.start) < minutesOf(a.end);
        expect(overlap, `${classroom} มีคาบซ้อนกัน: ${a.id} กับ ${b.id}`).toBe(false);
      }));
    });
  });
});

describe('รหัสนักเรียนต้องไม่กลายเป็นขยะ', () => {
  // เคยเกิดจริง: String(undefined) = "undefined" ทำให้ได้เอกสาร progress ใบใหม่
  // ชื่อ "ป.1_undefined_ชื่อ" ซึ่งใบเกรดจับคู่ไม่ติด กิจกรรมของเด็กจึงหายเงียบ
  it.each([
    undefined as unknown as string,
    null as unknown as string,
    '', '   ', 'undefined', 'null', 'NaN',
  ])('เลขที่ที่ใช้ไม่ได้ (%s) ต้องไม่หลุดเข้าไปใน id', (bad) => {
    expect(normalizeStudentNumber(bad)).toBe('na');
    const id = buildStudentLoginId('เด็กชายทดสอบ ระบบ', 'ป.1', bad);
    expect(id).toBe('ป.1_na_เด็กชายทดสอบระบบ');
    expect(id).not.toContain('undefined');
    expect(id).not.toContain('null');
    expect(id).not.toContain('NaN');
  });

  it('เลขที่ปกติต้องไม่ถูกแตะ และ id ต้องแยกเป็น 3 ส่วนตามที่ตัวจับคู่คาดไว้', () => {
    const id = buildStudentLoginId('เด็กหญิงสมใจ ใจดี', 'ป.2', '7');
    expect(id).toBe('ป.2_7_เด็กหญิงสมใจใจดี');
    const [room, no] = id.split('_');
    expect(room).toBe('ป.2');
    expect(Number.parseInt(no, 10)).toBe(7);
  });
});
