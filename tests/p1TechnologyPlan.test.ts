import { describe, expect, it } from 'vitest';
import {
  getP1HourlySessions,
  p1AnnualUnits,
  p1LessonPlans,
  p1TechnologyCourse,
} from '../src/data/p1TechnologyPlan';

describe('P.1 hourly technology lesson plans', () => {
  it('contains 40 unique plans for 40 teaching periods', () => {
    expect(p1LessonPlans).toHaveLength(p1TechnologyCourse.totalPeriods);
    expect(new Set(p1LessonPlans.map((plan) => plan.title)).size).toBe(40);
    expect(p1LessonPlans.map((plan) => plan.no)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1),
    );
  });

  it.each(p1LessonPlans)('plan $no is a complete 50-minute plan', (plan) => {
    expect(plan.hours).toBe(1);
    expect(plan.weeks).toBe(String(plan.no));
    expect(plan.steps).toHaveLength(5);
    expect(plan.steps.reduce((sum, step) => sum + step.minutes, 0)).toBe(
      p1TechnologyCourse.periodMinutes,
    );
    expect(plan.objectives.map((objective) => objective.domain)).toEqual(['K', 'P', 'A']);
    expect(plan.assessments.map((assessment) => assessment.domain)).toEqual(['K', 'P', 'A']);
    expect(plan.checkQuestions).toHaveLength(3);
    expect(plan.worksheet.length).toBeGreaterThan(10);
    expect(plan.product.length).toBeGreaterThan(10);

    const sessions = getP1HourlySessions(plan);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].minutes).toBe(p1TechnologyCourse.periodMinutes);
  });

  it('maps annual units to all 40 lesson plans without gaps', () => {
    expect(p1AnnualUnits.map((unit) => unit.plans)).toEqual([
      '1-12',
      '13-24',
      '25-36',
      '37-40',
    ]);
    expect(p1AnnualUnits.reduce((sum, unit) => sum + unit.hours, 0)).toBe(40);
  });
});
