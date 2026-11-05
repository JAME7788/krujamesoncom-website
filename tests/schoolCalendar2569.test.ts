import { describe, expect, it } from 'vitest';
import { isSchoolTeachingDate } from '../src/data/schoolCalendar2569';
import { buildDefaultTeachingSessions } from '../src/services/teachingSessionService';

describe('ปฏิทินการสอนปีการศึกษา 2569', () => {
  it('ไม่นับวันหยุดราชการเป็นคาบเรียน', () => {
    expect(isSchoolTeachingDate('2026-06-01')).toBe(false);
    expect(isSchoolTeachingDate('2026-07-31')).toBe(false);
    expect(isSchoolTeachingDate('2026-08-03')).toBe(true);
  });

  it('ป.1 วันที่ 3 สิงหาคมเป็นแผน 12 หลังข้ามวันหยุด 1 มิถุนายน', () => {
    const sessions = buildDefaultTeachingSessions('p1');
    expect(sessions.find((item) => item.plannedDate === '2026-08-03')?.period).toBe(12);
    expect(sessions.find((item) => item.period === 4)?.plannedDate).toBe('2026-06-08');
  });

  it.each([
    ['p1', 12, '2026-08-03'],
    ['p2', 13, '2026-08-07'],
    ['p3', 13, '2026-08-06'],
    ['p4', 13, '2026-08-06'],
    ['p5', 11, '2026-08-05'],
    ['p6', 13, '2026-08-07'],
    ['m1', 13, '2026-08-06'],
  ] as const)('%s เลื่อนลำดับแผนตามวันงดเรียนจริง', (gradeId, period, date) => {
    expect(buildDefaultTeachingSessions(gradeId).find((item) => item.period === period)?.plannedDate)
      .toBe(date);
  });
});
