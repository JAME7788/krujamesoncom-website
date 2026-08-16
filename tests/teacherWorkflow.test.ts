import { describe, expect, it } from 'vitest';
import {
  getTechnologyLessonPlans,
} from '../src/data/technologyLessonPlans';
import {
  PRIMARY_TECHNOLOGY_GRADE_IDS,
} from '../src/data/technologyTeachingSchedule';
import {
  buildDefaultTeachingSessions,
  TERM_1_START_DATE,
} from '../src/services/teachingSessionService';
import {
  drawQuestionSet,
  type QuestionBankItem,
  type QuestionDifficulty,
} from '../src/services/questionBankService';
import { makeLessonRecordId } from '../src/services/lessonRecordService';

describe('teacher hourly workflow', () => {
  it.each(PRIMARY_TECHNOLOGY_GRADE_IDS)('%s has 40 complete one-hour plans', (gradeId) => {
    const plans = getTechnologyLessonPlans(gradeId);
    expect(plans).toHaveLength(40);
    plans.forEach((plan, index) => {
      expect(plan.no).toBe(index + 1);
      expect(plan.hours).toBe(1);
      expect(plan.steps.reduce((sum, step) => sum + step.minutes, 0)).toBe(50);
      expect(new Set(plan.objectives.map((item) => item.domain))).toEqual(new Set(['K', 'P', 'A']));
      expect(plan.checkQuestions.length).toBeGreaterThanOrEqual(5);
      expect(plan.indicators.length).toBeGreaterThan(0);
    });
  });

  it.each(PRIMARY_TECHNOLOGY_GRADE_IDS)('%s has 40 dated teaching sessions', (gradeId) => {
    const sessions = buildDefaultTeachingSessions(gradeId);
    expect(sessions).toHaveLength(40);
    expect(new Set(sessions.map((item) => item.id)).size).toBe(40);
    expect(sessions.every((item) => /^\d{4}-\d{2}-\d{2}$/.test(item.plannedDate))).toBe(true);
    expect(sessions.slice(0, 20).every((item) => item.semester === 1)).toBe(true);
    expect(sessions.slice(20).every((item) => item.semester === 2)).toBe(true);
  });

  it('starts the 2569 teaching schedule from the school opening date', () => {
    expect(TERM_1_START_DATE).toBe('2026-05-05');
    // ป.1 เรียนเทคโนโลยีวันพุธตามตารางสอนจริง — วันพุธแรกหลังเปิดเทอมคือ 6 พ.ค.
    // (ค่าเดิม 2026-05-07 มาจากช่วงที่ตารางลง ป.1 ผิดเป็นวันพฤหัสบดี)
    expect(buildDefaultTeachingSessions('p1')[0].plannedDate).toBe('2026-05-06');
    expect(buildDefaultTeachingSessions('p2')[0].plannedDate).toBe('2026-05-11');
    expect(buildDefaultTeachingSessions('p3')[0].plannedDate).toBe('2026-05-08');
    expect(buildDefaultTeachingSessions('p4')[0].plannedDate).toBe('2026-05-06');
    expect(buildDefaultTeachingSessions('p5')[0].plannedDate).toBe('2026-05-06');
    expect(buildDefaultTeachingSessions('p6')[0].plannedDate).toBe('2026-05-07');
  });

  it('keeps lesson record ids unique by classroom and subject', () => {
    const date = '2026-06-01';
    expect(makeLessonRecordId(1, 1, date, 'ป.1', 'main'))
      .not.toBe(makeLessonRecordId(1, 1, date, 'ป.2', 'main'));
    expect(makeLessonRecordId(1, 1, date, 'ม.1', 'cs'))
      .not.toBe(makeLessonRecordId(1, 1, date, 'ม.1', 'dt'));
  });
});

const makeQuestions = (
  difficulty: QuestionDifficulty,
  count: number,
): QuestionBankItem[] => Array.from({ length: count }, (_, index) => ({
  id: `${difficulty}_${index}`,
  classroom: 'ป.1',
  subject: 'main',
  indicatorId: 'cs_p1_1',
  indicatorCode: 'ว 4.2 ป.1/1',
  difficulty,
  question: `${difficulty} ${index}`,
  options: ['ก', 'ข', 'ค', 'ง'],
  answer: 0,
  explanation: '',
  attempts: 0,
  correct: 0,
  status: 'published',
  createdAt: 1,
  updatedAt: 1,
}));

describe('question bank draw', () => {
  it('draws 10 unique published questions with a balanced difficulty mix', () => {
    const source = [
      ...makeQuestions('easy', 10),
      ...makeQuestions('medium', 10),
      ...makeQuestions('hard', 10),
    ];
    const result = drawQuestionSet(source, 10);
    expect(result).toHaveLength(10);
    expect(new Set(result.map((item) => item.id)).size).toBe(10);
    expect(result.filter((item) => item.difficulty === 'easy')).toHaveLength(4);
    expect(result.filter((item) => item.difficulty === 'medium')).toHaveLength(4);
    expect(result.filter((item) => item.difficulty === 'hard')).toHaveLength(2);
  });
});
