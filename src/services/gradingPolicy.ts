import { getActiveGradingPeriod } from './gradingPeriodService';

/** School templates confirmed by the teacher on 2026-09-22. */
export const GRADING_POLICY_VERSION = 'school-2569-v1';
export const getGradingPolicy = (classroom: string) => {
  const primary = classroom.startsWith('ป.');
  const period = getActiveGradingPeriod();
  return {
    version: GRADING_POLICY_VERSION,
    academicYear: period.academicYear, term: period.term,
    COLLECTED: primary ? 35 : 55,
    MIDTERM: primary ? 0 : 15,
    FINAL: primary ? 15 : 30,
    EXAM: primary ? 15 : 45,
    TOTAL: primary ? 50 : 100,
    K_RATIO: 0.6, P_RATIO: 0.25, A_RATIO: 0.15,
    annualGrade: primary,
  };
};
