import { beforeEach, describe, expect, it } from 'vitest';
import { cacheGradesLocally, initClassroom, loadGrades } from '../src/services/gradeService';
import { DEFAULT_GRADING_PERIOD, getActiveGradingPeriod, setActiveGradingPeriod } from '../src/services/gradingPeriodService';
import { finalizeGradebook, loadGradebookWorkflow, markGradebookForReview, reopenGradebook } from '../src/services/gradebookWorkflowService';

beforeEach(() => {
  const data = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
    removeItem: (key: string) => data.delete(key),
    clear: () => data.clear(),
  } });
});

describe('grading periods and gradebook workflow', () => {
  it('keeps term 1 and term 2 grade rows isolated', () => {
    setActiveGradingPeriod({ academicYear: '2569', term: '1' });
    initClassroom('ม.1');
    const term1 = loadGrades('ม.1');
    term1[0].finalExam = 27;
    cacheGradesLocally('ม.1', term1);

    setActiveGradingPeriod({ academicYear: '2569', term: '2' });
    expect(loadGrades('ม.1')).toEqual([]);
    initClassroom('ม.1');
    const term2 = loadGrades('ม.1');
    term2[0].finalExam = 11;
    cacheGradesLocally('ม.1', term2);

    setActiveGradingPeriod({ academicYear: '2569', term: '1' });
    expect(loadGrades('ม.1')[0].finalExam).toBe(27);
    setActiveGradingPeriod({ academicYear: '2569', term: '2' });
    expect(loadGrades('ม.1')[0].finalExam).toBe(11);
  });

  it('reads legacy scores only as the default 2569 term 1 period', () => {
    localStorage.setItem('krujames_grades_v1_ป.1', JSON.stringify([{ studentCode: 'legacy', classroom: 'ป.1', studentNo: 1, name: 'เดิม', emoji: '', indicators: {}, updatedAt: 1 }]));
    expect(getActiveGradingPeriod()).toEqual(DEFAULT_GRADING_PERIOD);
    expect(loadGrades('ป.1').some((row) => row.studentCode === 'legacy')).toBe(true);
    setActiveGradingPeriod({ academicYear: '2569', term: '2' });
    expect(loadGrades('ป.1').some((row) => row.studentCode === 'legacy')).toBe(false);
  });

  it('keeps a finalized snapshot and records the reason when reopened', () => {
    markGradebookForReview('ม.1', 'cs');
    expect(loadGradebookWorkflow('ม.1', 'cs').state).toBe('review');
    finalizeGradebook('ม.1', 'cs', { students: 12 }, 'school-2569-v1');
    expect(loadGradebookWorkflow('ม.1', 'cs')).toMatchObject({
      state: 'finalized',
      snapshot: { students: 12 },
      history: [{ state: 'finalized', policyVersion: 'school-2569-v1', snapshot: { students: 12 } }],
    });
    reopenGradebook('ม.1', 'cs', 'แก้คะแนนสอบตามหลักฐาน');
    expect(loadGradebookWorkflow('ม.1', 'cs')).toMatchObject({
      state: 'draft',
      reopenReason: 'แก้คะแนนสอบตามหลักฐาน',
      snapshot: { students: 12 },
      history: [{ state: 'finalized' }, { state: 'reopened', reason: 'แก้คะแนนสอบตามหลักฐาน' }],
    });
  });
});
