import { describe, expect, it } from 'vitest';
import {
  applyPostLessonAssessmentsToGradeRows,
  indicatorIdFromCode,
} from '../src/services/postLessonGradeSync';

const P1 = '\u0e1b.1';
const GOOD = '\u0e14\u0e35';

const makeGrade = () => ({
  studentCode: 's1',
  studentNo: 1,
  name: 'Student One',
  classroom: P1,
  indicators: {
    cs_p1_1: {
      k: 0,
      maxK: 15,
      p: '\u0e1e\u0e2d\u0e43\u0e0a\u0e49' as const,
      a: false,
      pAssessed: false,
      aAssessed: false,
      updatedAt: 1,
    },
  },
  updatedAt: 1,
});

const session = {
  id: 'session-1',
  classroom: P1,
  subject: 'main' as const,
  period: 1,
  plannedDate: '2026-05-06',
  indicatorCodes: ['\u0e27 4.2 \u0e1b.1/1'],
};

const draftAssessment = {
  id: 'assessment-1',
  kind: 'post-lesson',
  classroom: P1,
  sessionId: 'session-1',
  provisional: true,
  confirmedByTeacher: false,
  meta: { status: 'draft' },
  entries: {
    s1: {
      studentCode: 's1',
      studentNo: 1,
      studentName: 'Student One',
      scores: { k: 3, p: 3, a: 3 },
    },
  },
};

describe('post-lesson assessment grade sync', () => {
  it('maps Thai indicator codes to grade indicator ids', () => {
    expect(indicatorIdFromCode('\u0e27 4.2 \u0e1b.1/1')).toBe('cs_p1_1');
    expect(indicatorIdFromCode('\u0e27 4.1 \u0e21.2/5')).toBe('dt_m2_5');
  });

  it('does not use provisional drafts unless explicitly allowed', () => {
    const result = applyPostLessonAssessmentsToGradeRows({
      grades: [makeGrade()],
      indicators: [{ id: 'cs_p1_1', code: '\u0e27 4.2 \u0e1b.1/1', maxScore: 15 }],
      sessions: [session],
      assessments: [draftAssessment],
      options: { now: 100 },
    });

    expect(result.summary.assessmentsUsed).toBe(0);
    expect(result.summary.skippedDrafts).toBe(1);
    expect(result.summary.studentsUpdated).toBe(0);
    expect(result.grades[0].indicators.cs_p1_1.k).toBe(0);
  });

  it('adds confirmed post-lesson K/P/A scores without lowering existing scores', () => {
    const grade = makeGrade();
    grade.indicators.cs_p1_1.k = 14;
    grade.indicators.cs_p1_1.pScore = 30;
    grade.indicators.cs_p1_1.p = GOOD;
    grade.indicators.cs_p1_1.pAssessed = true;

    const result = applyPostLessonAssessmentsToGradeRows({
      grades: [grade],
      indicators: [{ id: 'cs_p1_1', code: '\u0e27 4.2 \u0e1b.1/1', maxScore: 15 }],
      sessions: [session],
      assessments: [{
        ...draftAssessment,
        provisional: false,
        confirmedByTeacher: true,
        meta: { status: 'complete' },
        entries: {
          s1: {
            ...draftAssessment.entries.s1,
            scores: { k: 2, p: 2, a: 3 },
          },
        },
      }],
      options: { now: 200 },
    });

    const score = result.grades[0].indicators.cs_p1_1;
    expect(result.summary.assessmentsUsed).toBe(1);
    expect(result.summary.studentsUpdated).toBe(1);
    expect(score.k).toBe(14);
    expect(score.manualK).toBe(10);
    expect(score.pScore).toBe(30);
    expect(score.manualPScore).toBe(20);
    expect(score.a).toBe(true);
    expect(score.webAScore).toBe(10);
    expect(score.postLessonEvidence?.assessments).toEqual(['assessment-1']);
  });

  it('can include drafts only when the caller makes that explicit', () => {
    const result = applyPostLessonAssessmentsToGradeRows({
      grades: [makeGrade()],
      indicators: [{ id: 'cs_p1_1', code: '\u0e27 4.2 \u0e1b.1/1', maxScore: 15 }],
      sessions: [session],
      assessments: [draftAssessment],
      options: { includeDrafts: true, now: 300 },
    });

    const score = result.grades[0].indicators.cs_p1_1;
    expect(result.summary.assessmentsUsed).toBe(1);
    expect(score.k).toBe(15);
    expect(score.pScore).toBe(30);
    expect(score.a).toBe(true);
    expect(score.postLessonEvidence?.includedDrafts).toBe(true);
  });
});
