import { describe, expect, it } from 'vitest';
import { p1LessonPlans } from '../src/data/p1TechnologyPlan';
import {
  PRIMARY_TECHNOLOGY_GRADE_IDS,
  buildTechnologyTeachingSchedule,
} from '../src/data/technologyTeachingSchedule';

describe('primary technology teaching schedules', () => {
  it('creates 40 one-hour plans for every primary grade', () => {
    PRIMARY_TECHNOLOGY_GRADE_IDS.forEach((gradeId) => {
      const schedule = buildTechnologyTeachingSchedule(gradeId);
      expect(schedule.rows).toHaveLength(40);
      expect(schedule.totalHours).toBe(40);
      expect(schedule.units.reduce((sum, unit) => sum + unit.hours, 0)).toBe(40);
      expect(schedule.rows.map((row) => row.period)).toEqual(
        Array.from({ length: 40 }, (_, index) => index + 1),
      );
    });
  });

  it('divides the year into two semesters and keeps primary exam policy correct', () => {
    PRIMARY_TECHNOLOGY_GRADE_IDS.forEach((gradeId) => {
      const rows = buildTechnologyTeachingSchedule(gradeId).rows;
      expect(rows.filter((row) => row.semester === 1)).toHaveLength(20);
      expect(rows.filter((row) => row.semester === 2)).toHaveLength(20);
      expect(rows[19].assessment).toContain('ประเมินระหว่างเรียน');
      expect(rows[19].assessment).toContain('ไม่แยกเป็นคะแนนสอบกลางภาค');
      expect(rows[39].assessment).toContain('สอบปลายภาคของเทอม 30 คะแนน');
    });
  });

  it('connects every period to indicators, activities, evidence, and KPA assessment', () => {
    PRIMARY_TECHNOLOGY_GRADE_IDS.forEach((gradeId) => {
      buildTechnologyTeachingSchedule(gradeId).rows.forEach((row) => {
        expect(row.indicators.length).toBeGreaterThan(0);
        expect(row.learningActivity.length).toBeGreaterThan(10);
        expect(row.evidence.length).toBeGreaterThan(5);
        expect(row.assessment).toMatch(/[KPA]/);
      });
    });
  });

  it('keeps the detailed P1 hourly plan titles in the schedule', () => {
    const schedule = buildTechnologyTeachingSchedule('p1');
    expect(schedule.rows[0].lessonTitle).toContain(p1LessonPlans[0].title);
    expect(schedule.rows[18].lessonTitle).toContain(p1LessonPlans[18].title);
    expect(schedule.rows[38].lessonTitle).toContain(p1LessonPlans[38].title);
  });
});
