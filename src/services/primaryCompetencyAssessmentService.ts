import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { StudentInfo } from '../data/students2569';
import type { PrimaryGrade, PrimaryTechnologyCompetencyPlan } from '../data/primaryTechnologyCompetencyPlans';
import { db } from './firebase';
import {
  ACADEMIC_YEAR,
  ensureStudentGrade,
  updateStudentScore,
} from './gradeService';

const STORAGE_KEY = 'krujames_primary_outcome5_assessments_v1';

export interface PrimaryCompetencyAssessment {
  id: string;
  academicYear: string;
  planId: string;
  grade: PrimaryGrade;
  classroom: string;
  studentCode: string;
  studentNo: number;
  studentName: string;
  kCorrect: number;
  competencyScores: number[];
  characteristicScores: number[];
  note: string;
  kScore: number;
  pLevel: 'พอใช้' | 'ปานกลาง' | 'ดี';
  aPassed: boolean;
  linkedIndicatorIds: string[];
  updatedAt: number;
}

export interface AssessmentInput {
  kCorrect: number;
  competencyScores: number[];
  characteristicScores: number[];
  note: string;
}

const safeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '_');

const recordId = (planId: string, classroom: string, studentCode: string) => (
  safeId(`${ACADEMIC_YEAR}_${planId}_${classroom}_${studentCode}`)
);

const readLocal = (): Record<string, PrimaryCompetencyAssessment> => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, PrimaryCompetencyAssessment>;
  } catch {
    return {};
  }
};

const writeLocal = (records: Record<string, PrimaryCompetencyAssessment>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
};

const normalizedScores = (scores: number[], size: number) => (
  Array.from({ length: size }, (_, index) => Math.max(0, Math.min(3, Number(scores[index]) || 0)))
);

const average = (scores: number[]) => (
  scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0
);

export const calculateAssessmentResult = (input: AssessmentInput) => {
  const kCorrect = Math.max(0, Math.min(10, Number(input.kCorrect) || 0));
  const competencyScores = normalizedScores(input.competencyScores, 5);
  const characteristicScores = normalizedScores(input.characteristicScores, 5);
  const competencyAverage = average(competencyScores);
  const characteristicAverage = average(characteristicScores);

  return {
    kCorrect,
    competencyScores,
    characteristicScores,
    kScore: Math.round((kCorrect / 10) * 15),
    pLevel: (competencyAverage >= 2.5 ? 'ดี' : competencyAverage >= 1.5 ? 'ปานกลาง' : 'พอใช้') as PrimaryCompetencyAssessment['pLevel'],
    aPassed: characteristicAverage >= 2,
    competencyAverage,
    characteristicAverage,
  };
};

export const loadPrimaryCompetencyAssessment = async (
  plan: PrimaryTechnologyCompetencyPlan,
  studentCode: string,
): Promise<PrimaryCompetencyAssessment | null> => {
  const id = recordId(plan.id, plan.grade, studentCode);
  try {
    const snapshot = await getDoc(doc(db, 'primaryCompetencyAssessments', id));
    if (snapshot.exists()) {
      const remote = snapshot.data() as PrimaryCompetencyAssessment;
      const records = readLocal();
      records[id] = remote;
      writeLocal(records);
      return remote;
    }
  } catch (error) {
    console.warn('load primary competency assessment from Firebase failed', error);
  }
  return readLocal()[id] || null;
};

export const savePrimaryCompetencyAssessment = async (
  plan: PrimaryTechnologyCompetencyPlan,
  student: StudentInfo,
  input: AssessmentInput,
): Promise<PrimaryCompetencyAssessment> => {
  const result = calculateAssessmentResult(input);
  const id = recordId(plan.id, plan.grade, student.studentCode);
  const linkedIndicatorIds = plan.subIndicators.map((indicator) => indicator.id);
  const record: PrimaryCompetencyAssessment = {
    id,
    academicYear: ACADEMIC_YEAR,
    planId: plan.id,
    grade: plan.grade,
    classroom: plan.grade,
    studentCode: student.studentCode,
    studentNo: student.no,
    studentName: student.name,
    kCorrect: result.kCorrect,
    competencyScores: result.competencyScores,
    characteristicScores: result.characteristicScores,
    note: input.note.trim(),
    kScore: result.kScore,
    pLevel: result.pLevel,
    aPassed: result.aPassed,
    linkedIndicatorIds,
    updatedAt: Date.now(),
  };

  const records = readLocal();
  records[id] = record;
  writeLocal(records);

  ensureStudentGrade(plan.grade, {
    studentCode: student.studentCode,
    studentNo: student.no,
    name: student.name,
    emoji: student.emoji,
  });

  const scoreNote = `ผลลัพธ์การเรียนรู้ข้อ 5: ${plan.title}${record.note ? ` | ${record.note}` : ''}`;
  linkedIndicatorIds.forEach((indicatorId) => {
    updateStudentScore(plan.grade, student.studentCode, indicatorId, {
      k: result.kScore,
      p: result.pLevel,
      a: result.aPassed,
      note: scoreNote,
    });
  });

  await setDoc(doc(db, 'primaryCompetencyAssessments', id), record, { merge: true });
  return record;
};

