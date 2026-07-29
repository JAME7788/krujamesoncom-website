import { describe, expect, it } from 'vitest';
import {
  calculateAssessmentResult,
  getStudentAssessmentTemplate,
  studentAssessmentTemplates,
} from '../src/data/studentAssessmentTemplates';

describe('student assessment templates', () => {
  it('provides all six requested form types with unique categories', () => {
    expect(studentAssessmentTemplates).toHaveLength(6);
    studentAssessmentTemplates.forEach((template) => {
      const ids = template.categories.map((category) => category.id);
      expect(template.categories.length).toBeGreaterThan(0);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  it('calculates standard assessment levels from the reference thresholds', () => {
    const template = getStudentAssessmentTemplate('competencies');
    const excellent = Object.fromEntries(template.categories.map((category) => [category.id, 3]));
    const pass = Object.fromEntries(template.categories.map((category) => [category.id, 2]));
    const fail = Object.fromEntries(template.categories.map((category) => [category.id, 0]));

    expect(calculateAssessmentResult('competencies', excellent)).toMatchObject({
      percent: 100,
      level: 'ดีเยี่ยม',
      passed: true,
    });
    expect(calculateAssessmentResult('competencies', pass)).toMatchObject({
      percent: 67,
      level: 'ดี',
      passed: true,
    });
    expect(calculateAssessmentResult('competencies', fail)).toMatchObject({
      percent: 0,
      level: 'ไม่ผ่าน',
      passed: false,
    });
  });

  it('uses readiness thresholds for individual learner analysis', () => {
    const template = getStudentAssessmentTemplate('learner-analysis');
    const ready = Object.fromEntries(template.categories.map((category) => [category.id, 3]));
    const support = Object.fromEntries(template.categories.map((category) => [category.id, 1]));

    expect(calculateAssessmentResult('learner-analysis', ready).level).toBe('พร้อมดี');
    expect(calculateAssessmentResult('learner-analysis', support)).toMatchObject({
      level: 'ต้องวางแผนช่วยเหลือ',
      passed: false,
    });
  });

  it('uses the K/P/A post-lesson thresholds', () => {
    expect(calculateAssessmentResult('post-lesson', { k: 3, p: 3, a: 3 })).toMatchObject({
      level: 'ดี',
      percent: 100,
    });
    expect(calculateAssessmentResult('post-lesson', { k: 1, p: 1, a: 1 })).toMatchObject({
      level: 'ต้องซ่อมเสริม',
      percent: 33,
    });
  });
});
