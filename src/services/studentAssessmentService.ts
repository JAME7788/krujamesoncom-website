import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { StudentAssessmentKind } from '../data/studentAssessmentTemplates';
import { calculateAssessmentResult } from '../data/studentAssessmentTemplates';
import { requireTeacherGradeAccess } from './teacherGradeAccess';

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
  provisional?: boolean;
  confirmedByTeacher?: boolean;
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

/** Only complete, teacher-confirmed results from the selected period may enter reports. */
export const getConfirmedAssessmentScore = (
  classroom: string, academicYear: string, term: string, kind: StudentAssessmentKind, studentCode: string,
): 0 | 1 | 2 | 3 | null => {
  const assessment = readLocalAssessment(makeClassroomAssessmentId(classroom, academicYear, term, kind));
  if (!assessment || assessment.archived || assessment.provisional || !assessment.confirmedByTeacher || assessment.meta.status !== 'complete') return null;
  if (assessment.classroom !== classroom || assessment.academicYear !== academicYear || assessment.term !== term || assessment.kind !== kind) return null;
  const entry = assessment.entries[studentCode];
  if (!entry || entry.studentCode !== studentCode) return null;
  const result = calculateAssessmentResult(kind, entry.scores);
  if (result.completed !== result.categoryCount) return null;
  if (Object.values(entry.scores).some(value => !Number.isFinite(value) || value < 0 || value > 3)) return null;
  return result.level === 'ดีเยี่ยม' ? 3 : result.level === 'ดี' ? 2 : result.level === 'ผ่าน' ? 1 : 0;
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
  // Local-first keeps the form usable when Firestore is offline or over quota.
  // The teacher can explicitly request the latest cloud copy from the UI.
  return readLocalAssessment(id);
};

export const fetchClassroomAssessmentFromFirebase = async (
  classroom: string,
  academicYear: string,
  term: string,
  kind: StudentAssessmentKind,
  contextKey = 'main',
): Promise<ClassroomAssessment | null> => {
  if (!firebaseAvailable()) return null;
  const id = makeClassroomAssessmentId(classroom, academicYear, term, kind, contextKey);
  const snapshot = await getDoc(doc(db, COLLECTION, id));
  if (!snapshot.exists()) return null;
  const assessment = snapshot.data() as ClassroomAssessment;
  writeLocalAssessment(assessment);
  return assessment;
};

export const saveClassroomAssessment = async (
  assessment: ClassroomAssessment,
): Promise<ClassroomAssessment> => {
  const next: ClassroomAssessment = {
    ...assessment,
    updatedAt: Date.now(),
  };
  // A failed cloud write must not create a confirmed result for official export.
  writeLocalAssessment({ ...next, confirmedByTeacher: false });

  if (!firebaseAvailable()) {
    throw new Error('ยังไม่ได้ตั้งค่า Firebase ระบบเก็บสำรองไว้ในเครื่องนี้แล้ว');
  }

  if (next.confirmedByTeacher) await requireTeacherGradeAccess();
  await setDoc(doc(db, COLLECTION, next.id), {
    ...next,
    syncedAt: serverTimestamp(),
  }, { merge: true });
  writeLocalAssessment(next);
  return next;
};
