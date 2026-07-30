import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { COURSE_TEACHER_NAME, type Subject } from './gradeService';
import { writeAuditLog } from './auditLogService';

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
  classroom: string;
  subject: Subject;
  courseName: string;
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
const LOCAL_KEY = 'krujames_lesson_records_v2';
const LEGACY_LOCAL_KEY = 'krujames_lesson_records_p1_v1';

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const cacheRecords = (records: LessonRecord[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(records)); } catch { /* cache is optional */ }
};

export const loadLessonRecords = (): LessonRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY) || localStorage.getItem(LEGACY_LOCAL_KEY);
    return raw ? JSON.parse(raw) as LessonRecord[] : [];
  } catch {
    return [];
  }
};

const classroomKey = (classroom: string) => classroom
  .replace('ป.', 'p')
  .replace('ม.', 'm')
  .replace(/[^a-zA-Z0-9_-]/g, '');

export const makeLessonRecordId = (
  planNo: number,
  hourNo: number,
  teachingDate: string,
  classroom = 'ป.1',
  subject: Subject = 'main',
) => {
  if (classroom === 'ป.1' && subject === 'main') {
    return `p1-plan-${planNo}-hour-${hourNo}-${teachingDate}`;
  }
  return `${classroomKey(classroom)}-${subject}-plan-${planNo}-hour-${hourNo}-${teachingDate}`;
};

export const fetchLessonRecords = async (
  classroom = 'ป.1',
  subject: Subject = 'main',
): Promise<LessonRecord[]> => {
  if (!firebaseAvailable()) {
    return loadLessonRecords().filter((item) => (
      item.classroom === classroom && item.subject === subject
    ));
  }
  const snapshot = await getDocs(collection(db, COLLECTION));
  const records = snapshot.docs
    .map((item) => item.data() as LessonRecord)
    .filter((item) => item.classroom === classroom && item.subject === subject)
    .sort((a, b) => b.updatedAt - a.updatedAt);
  const otherRecords = loadLessonRecords().filter((item) => (
    item.classroom !== classroom || item.subject !== subject
  ));
  cacheRecords([...records, ...otherRecords]);
  return records;
};

export const saveLessonRecord = async (
  input: Omit<LessonRecord, 'id' | 'courseName' | 'teacherName' | 'createdAt' | 'updatedAt'> & {
    courseName?: string;
  },
): Promise<LessonRecord> => {
  if (!firebaseAvailable()) throw new Error('Firebase ยังไม่ได้ตั้งค่า');
  const id = makeLessonRecordId(
    input.planNo,
    input.hourNo,
    input.teachingDate,
    input.classroom,
    input.subject,
  );
  const current = loadLessonRecords().find((item) => item.id === id);
  const record: LessonRecord = {
    ...input,
    id,
    courseName: input.courseName || 'เทคโนโลยี (วิทยาการคำนวณ)',
    teacherName: COURSE_TEACHER_NAME,
    createdAt: current?.createdAt || Date.now(),
    updatedAt: Date.now(),
  };
  await setDoc(doc(db, COLLECTION, id), record, { merge: true });
  const records = [record, ...loadLessonRecords().filter((item) => item.id !== id)]
    .sort((a, b) => b.updatedAt - a.updatedAt);
  cacheRecords(records);
  await writeAuditLog({
    action: current ? 'update' : 'create',
    entityType: 'lessonRecord',
    entityId: record.id,
    classroom: record.classroom,
    subject: record.subject,
    summary: `บันทึกหลังสอนแผนที่ ${record.planNo} วันที่ ${record.teachingDate}`,
    before: current,
    after: record,
  });
  return record;
};
