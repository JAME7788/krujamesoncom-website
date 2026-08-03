import { describe, expect, it } from 'vitest';
import { p1LessonPlans } from '../src/data/p1TechnologyPlan';
import {
  findLessonRecordForPlan,
  type LessonRecord,
} from '../src/services/lessonRecordService';
import {
  buildP1PostTeachingDraft,
  isPostTeachingReady,
} from '../src/utils/p1PostTeachingDraft';

const record = (teachingDate: string, updatedAt: number): LessonRecord => ({
  id: `p1-plan-1-hour-1-${teachingDate}`,
  classroom: 'ป.1',
  subject: 'main',
  courseName: 'เทคโนโลยี (วิทยาการคำนวณ)',
  planNo: 1,
  hourNo: 1,
  teachingDate,
  indicatorCodes: ['ว 4.2 ป.1/5'],
  snapshot: {
    present: 10,
    absent: 1,
    totalStudents: 11,
    passed: 9,
    averageK: 12,
    averageP: 24,
    attitudePassed: 10,
  },
  strengths: 'ทำได้ดี',
  problems: 'ยังอ่านช้า',
  causes: 'ประสบการณ์ต่างกัน',
  improvements: 'ฝึกเพิ่ม',
  nextAction: 'ทบทวน',
  teacherName: 'นายอนันตชัย เพ็ชรรี่',
  status: 'draft',
  createdAt: updatedAt,
  updatedAt,
});

describe('P.1 post-teaching draft', () => {
  it('keeps unused and future plans blank until teaching starts', () => {
    expect(isPostTeachingReady({ sessionStatus: 'planned' })).toBe(false);
    expect(isPostTeachingReady({ sessionStatus: 'postponed' })).toBe(false);
    expect(isPostTeachingReady({
      sessionStatus: 'planned',
      recordStatus: 'draft',
      teachingDate: '2026-08-10',
      hasResult: true,
    })).toBe(false);
  });

  it('opens post-teaching notes only for a used lesson or a completed record', () => {
    expect(isPostTeachingReady({ sessionStatus: 'in_progress' })).toBe(true);
    expect(isPostTeachingReady({ sessionStatus: 'completed' })).toBe(true);
    expect(isPostTeachingReady({ sessionStatus: 'makeup' })).toBe(true);
    expect(isPostTeachingReady({
      sessionStatus: 'planned',
      recordStatus: 'complete',
      teachingDate: '2026-08-03',
      hasResult: true,
    })).toBe(true);
    expect(isPostTeachingReady({
      sessionStatus: 'planned',
      recordStatus: 'draft',
      teachingDate: '2026-08-03',
      hasResult: true,
    })).toBe(false);
  });

  it.each(p1LessonPlans)('creates a useful plan-specific draft for plan $no', (plan) => {
    const draft = buildP1PostTeachingDraft(plan);
    expect(draft.summary).toContain(plan.title);
    expect(draft.summary).toContain('ยังไม่มีผล K/P/A');
    expect(draft.strengths.length).toBeGreaterThan(30);
    expect(draft.problems).not.toContain('20-30');
    expect(draft.improvements.length).toBeGreaterThan(30);
    expect(draft.nextAction.length).toBeGreaterThan(30);
  });

  it('writes a positive official narrative from the recorded K/P/A result', () => {
    const draft = buildP1PostTeachingDraft(p1LessonPlans[0], {
      totalStudents: 11,
      passed: 11,
      averageK: 13.2,
      averageP: 26.3,
      attitudePassed: 11,
    });

    expect(draft.summary).toContain('ผ่านจุดประสงค์ 11 คน จากทั้งหมด 11 คน');
    expect(draft.summary).toContain('ร้อยละ 100');
    expect(draft.summary).toContain('13.2/15');
    expect(draft.summary).toContain('26.3/30');
    expect(draft.summary).toContain('ด้านคุณลักษณะ (A) 11 คน');
    expect(draft.problems).toContain('ผู้เรียนทุกคนผ่านจุดประสงค์');
    expect(draft.problems).not.toContain('อาจ');
  });

  it('selects the record for the planned date before a newer unrelated date', () => {
    const planned = record('2026-05-07', 1);
    const newer = record('2026-08-03', 2);
    expect(findLessonRecordForPlan([planned, newer], 'ป.1', 'main', 1, '2026-05-07'))
      .toBe(planned);
  });

  it('falls back to the latest record when the planned date has no record', () => {
    const older = record('2026-05-07', 1);
    const latest = record('2026-05-14', 3);
    expect(findLessonRecordForPlan([older, latest], 'ป.1', 'main', 1, '2026-05-01'))
      .toBe(latest);
  });
});
