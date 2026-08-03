import { describe, expect, it } from 'vitest';
import { currentOrNextTeachingSlot, defaultSchedule } from '../src/data/schedule';
import { buildTechnologyTeachingSchedule } from '../src/data/technologyTeachingSchedule';
import { buildDefaultTeachingSessions } from '../src/services/teachingSessionService';
import { attendanceSubjectForClassroom } from '../src/services/manualAttendanceService';

describe('ศูนย์คาบเรียนวันนี้', () => {
  it('วันจันทร์ 09:00 ต้องเลือก ม.1 ตามตารางจริง', () => {
    const mondayAtNine = new Date(2026, 7, 3, 9, 0);
    expect(currentOrNextTeachingSlot(defaultSchedule, mondayAtNine)?.classroom).toBe('ม.1');
  });

  it('ม.1 ต้องมีแผนวิทยาการคำนวณ 40 ชั่วโมงและเก็บในวิชา cs', () => {
    const schedule = buildTechnologyTeachingSchedule('m1');
    const sessions = buildDefaultTeachingSessions('m1');
    expect(schedule.gradeLabel).toBe('ม.1');
    expect(schedule.courseName).toBe('วิทยาการคำนวณ');
    expect(schedule.rows).toHaveLength(40);
    expect(sessions).toHaveLength(40);
    expect(sessions.every((session) => session.classroom === 'ม.1' && session.subject === 'cs')).toBe(true);
    expect(sessions.find((session) => session.plannedDate === '2026-08-03')?.period).toBe(13);
    expect(attendanceSubjectForClassroom('ม.1')).toBe('cs');
    expect(attendanceSubjectForClassroom('ป.1')).toBe('main');
  });

  it('คาบทักษะอาชีพที่แยกจากคะแนนต้องไม่ถูกเปิดเป็นคาบวิทยาการคำนวณ', () => {
    const tuesdayAtTwo = new Date(2026, 7, 4, 14, 0);
    expect(currentOrNextTeachingSlot(defaultSchedule, tuesdayAtTwo)).toBeUndefined();
  });
});
