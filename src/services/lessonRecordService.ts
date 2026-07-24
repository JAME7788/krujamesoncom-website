import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { COURSE_TEACHER_NAME } from './gradeService';

export interface LessonRecordSnapshot {
  present: number;
  absent: number;
  totalStudents: number;
  passed: number;
  averageK: number;
  averageP: number;
  attitudePassed: number;
}

export interface LessonRecord {
  id: string;
  classroom: 'ป.1';
  subject: 'main';
  courseName: 'เทคโนโลยี (วิทยาการคำนวณ)';
  planNo: number;
  hourNo: number;
  teachingDate: string;
  indicatorCodes: string[];
  snapshot: LessonRecordSnapshot;
  strengths: string;
  problems: string;
  causes: string;
  improvements: string;
  nextAction: string;
  teacherName: string;
  status: 'draft' | 'complete';
  createdAt: number;
  updatedAt: number;
}

const COLLECTION = 'lessonRecords';
const LOCAL_KEY = 'krujames_lesson_records_p1_v1';

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const cacheRecords = (records: LessonRecord[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(records)); } catch { /* cache is optional */ }
};

export const loadLessonRecords = (): LessonRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as LessonRecord[] : [];
  } catch {
    return [];
  }
};

export const makeLessonRecordId = (planNo: number, hourNo: number, teachingDate: string) => (
  `p1-plan-${planNo}-hour-${hourNo}-${teachingDate}`
);

export const fetchLessonRecords = async (): Promise<LessonRecord[]> => {
  if (!firebaseAvailable()) return loadLessonRecords();
  const snapshot = await getDocs(collection(db, COLLECTION));
  const records = snapshot.docs
    .map((item) => item.data() as LessonRecord)
    .filter((item) => item.classroom === 'ป.1' && item.subject === 'main')
    .sort((a, b) => b.updatedAt - a.updatedAt);
  cacheRecords(records);
  return records;
};

export const saveLessonRecord = async (
  input: Omit<LessonRecord, 'id' | 'courseName' | 'teacherName' | 'createdAt' | 'updatedAt'>,
): Promise<LessonRecord> => {
  if (!firebaseAvailable()) throw new Error('Firebase ยังไม่ได้ตั้งค่า');
  const id = makeLessonRecordId(input.planNo, input.hourNo, input.teachingDate);
  const current = loadLessonRecords().find((item) => item.id === id);
  const record: LessonRecord = {
    ...input,
    id,
    courseName: 'เทคโนโลยี (วิทยาการคำนวณ)',
    teacherName: COURSE_TEACHER_NAME,
    createdAt: current?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTION, id), record, { merge: true });
  const records = [record, ...loadLessonRecords().filter((item) => item.id !== id)]
    .sort((a, b) => b.updatedAt - a.updatedAt);
  cacheRecords(records);
  return record;
};
