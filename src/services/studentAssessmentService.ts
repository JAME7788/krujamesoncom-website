import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { StudentAssessmentKind } from '../data/studentAssessmentTemplates';

export interface StudentAssessmentEntry {
  studentCode: string;
  studentNo: number;
  studentName: string;
  scores: Record<string, number>;
  note: string;
  supportPlan: string;
  evidence: string;
}

export interface StudentAssessmentMeta {
  subjectName?: string;
  unitName?: string;
  lessonTitle?: string;
  planNo?: string;
  teachingDate?: string;
  strengths?: string;
  problems?: string;
  causes?: string;
  improvements?: string;
  nextAction?: string;
  suggestion?: string;
  status?: 'draft' | 'complete';
}

export interface ClassroomAssessment {
  id: string;
  /** รหัสคาบกลางสำหรับเชื่อมกับตารางสอน เช็กชื่อ และบันทึกหลังสอน */
  sessionId?: string;
  archived?: boolean;
  kind: StudentAssessmentKind;
  classroom: string;
  academicYear: string;
  term: string;
  contextKey: string;
  entries: Record<string, StudentAssessmentEntry>;
  meta: StudentAssessmentMeta;
  updatedAt: number;
  updatedBy: string;
}

const COLLECTION = 'studentAssessments';
const LOCAL_PREFIX = 'krujames_student_assessment_v1:';

const sanitizeIdPart = (value: string) => (
  value
    .trim()
    .replace(/[/.#$[\]]/g, '-')
    .replace(/\s+/g, '-')
    .slice(0, 80) || 'default'
);

export const makeClassroomAssessmentId = (
  classroom: string,
  academicYear: string,
  term: string,
  kind: StudentAssessmentKind,
  contextKey = 'main',
): string => (
  [
    sanitizeIdPart(academicYear),
    sanitizeIdPart(term),
    sanitizeIdPart(classroom),
    sanitizeIdPart(kind),
    sanitizeIdPart(contextKey),
  ].join('__')
);

const getLocalKey = (id: string) => `${LOCAL_PREFIX}${id}`;

const firebaseAvailable = (): boolean => {
  try {
    return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID);
  } catch {
    return false;
  }
};

const readLocalAssessment = (id: string): ClassroomAssessment | null => {
  try {
    const raw = localStorage.getItem(getLocalKey(id));
    return raw ? JSON.parse(raw) as ClassroomAssessment : null;
  } catch {
    return null;
  }
};

const writeLocalAssessment = (assessment: ClassroomAssessment): void => {
  try {
    localStorage.setItem(getLocalKey(assessment.id), JSON.stringify(assessment));
  } catch {
    // Firebase remains the source of truth when local storage is unavailable.
  }
};

export const loadClassroomAssessment = async (
  classroom: string,
  academicYear: string,
  term: string,
  kind: StudentAssessmentKind,
  contextKey = 'main',
): Promise<ClassroomAssessment | null> => {
  const id = makeClassroomAssessmentId(classroom, academicYear, term, kind, contextKey);
  if (firebaseAvailable()) {
    try {
      const snapshot = await getDoc(doc(db, COLLECTION, id));
      if (snapshot.exists()) {
        const assessment = snapshot.data() as ClassroomAssessment;
        writeLocalAssessment(assessment);
        return assessment;
      }
    } catch (error) {
      console.warn('load student assessment from Firebase failed', error);
    }
  }
  return readLocalAssessment(id);
};

export const saveClassroomAssessment = async (
  assessment: ClassroomAssessment,
): Promise<ClassroomAssessment> => {
  const next: ClassroomAssessment = {
    ...assessment,
    updatedAt: Date.now(),
  };
  writeLocalAssessment(next);

  if (!firebaseAvailable()) {
    throw new Error('ยังไม่ได้ตั้งค่า Firebase ระบบเก็บสำรองไว้ในเครื่องนี้แล้ว');
  }

  await setDoc(doc(db, COLLECTION, next.id), {
    ...next,
    syncedAt: serverTimestamp(),
  }, { merge: true });
  return next;
};
