import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import {
  buildTechnologyTeachingSchedule,
  type PrimaryTechnologyGradeId,
  type TechnologyTeachingScheduleRow,
} from '../data/technologyTeachingSchedule';
import type { Subject } from './gradeService';
import { writeAuditLog } from './auditLogService';

export type TeachingSessionStatus =
  | 'planned'
  | 'in_progress'
  | 'completed'
  | 'postponed'
  | 'makeup';

export interface TeachingSession {
  id: string;
  academicYear: string;
  gradeId: PrimaryTechnologyGradeId;
  classroom: string;
  subject: Subject;
  period: number;
  week: number;
  semester: 1 | 2;
  unitNo: number;
  unitTitle: string;
  lessonTitle: string;
  indicatorCodes: string[];
  plannedDate: string;
  teachingDate?: string;
  status: TeachingSessionStatus;
  note?: string;
  startedAt?: number;
  completedAt?: number;
  updatedAt: number;
  updatedBy: string;
}

const COLLECTION = 'teachingSessions';
const ACADEMIC_YEAR = '2569';
const LOCAL_KEY = 'krujames_teaching_sessions_v1';
export const TERM_1_START_DATE = '2026-05-05';
export const TERM_2_START_DATE = '2026-11-02';

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const toIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ต้องตรงกับ defaultSchedule ใน src/data/schedule.ts เสมอ — มีเทสต์กันไว้ใน scheduleConsistency.test.ts
// ป.1 เคยลงเป็น 3 (พุธ) ทำให้วันที่ "ตามแผน" ของทั้ง 40 คาบเลื่อนผิดวันทั้งหมด
// นี่คือสำเนาตารางสอนชุดที่ 3 ของระบบ (อีกสองชุดคือ schedule.ts และ WEEKLY_SLOTS)
const weekdayByGrade: Record<PrimaryTechnologyGradeId, number> = {
  p1: 4,
  p2: 1,
  p3: 5,
  p4: 3,
  p5: 3,
  p6: 4,
};

const firstWeekdayOnOrAfter = (start: Date, weekday: number) => {
  const date = new Date(start);
  const offset = (weekday - date.getDay() + 7) % 7;
  date.setDate(date.getDate() + offset);
  return date;
};

const dateForRow = (
  gradeId: PrimaryTechnologyGradeId,
  row: TechnologyTeachingScheduleRow,
): string => {
  const [year, month, day] = (row.semester === 1
    ? TERM_1_START_DATE
    : TERM_2_START_DATE).split('-').map(Number);
  const termStart = new Date(year, month - 1, day);
  const first = firstWeekdayOnOrAfter(termStart, weekdayByGrade[gradeId]);
  const weekInTerm = row.semester === 1 ? row.week - 1 : row.week - 21;
  first.setDate(first.getDate() + Math.max(0, weekInTerm) * 7);
  return toIsoDate(first);
};

const sessionId = (
  gradeId: PrimaryTechnologyGradeId,
  subject: Subject,
  period: number,
) => `${ACADEMIC_YEAR}_${gradeId}_${subject}_${String(period).padStart(2, '0')}`;

const cacheSessions = (sessions: TeachingSession[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(sessions)); } catch { /* optional */ }
};

export const loadTeachingSessions = (): TeachingSession[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as TeachingSession[] : [];
  } catch {
    return [];
  }
};

export const buildDefaultTeachingSessions = (
  gradeId: PrimaryTechnologyGradeId,
): TeachingSession[] => {
  const schedule = buildTechnologyTeachingSchedule(gradeId);
  return schedule.rows.map((row) => ({
    id: sessionId(gradeId, 'main', row.period),
    academicYear: ACADEMIC_YEAR,
    gradeId,
    classroom: schedule.gradeLabel,
    subject: 'main',
    period: row.period,
    week: row.week,
    semester: row.semester,
    unitNo: row.unitNo,
    unitTitle: row.unitTitle,
    lessonTitle: row.lessonTitle,
    indicatorCodes: row.indicators,
    plannedDate: dateForRow(gradeId, row),
    status: 'planned',
    updatedAt: 0,
    updatedBy: 'system',
  }));
};

const mergeDefaults = (
  gradeId: PrimaryTechnologyGradeId,
  saved: TeachingSession[],
): TeachingSession[] => {
  const byId = new Map(saved.map((item) => [item.id, item]));
  return buildDefaultTeachingSessions(gradeId).map((item) => ({
    ...item,
    ...(byId.get(item.id) || {}),
  }));
};

export const fetchTeachingSessions = async (
  gradeId: PrimaryTechnologyGradeId,
): Promise<TeachingSession[]> => {
  const localForGrade = loadTeachingSessions().filter((item) => item.gradeId === gradeId);
  if (!firebaseAvailable()) return mergeDefaults(gradeId, localForGrade);
  try {
    const snapshot = await getDocs(query(
      collection(db, COLLECTION),
      where('gradeId', '==', gradeId),
    ));
    const remote = snapshot.docs.map((item) => item.data() as TeachingSession);
    const merged = mergeDefaults(gradeId, remote.length ? remote : localForGrade);
    const otherGrades = loadTeachingSessions().filter((item) => item.gradeId !== gradeId);
    cacheSessions([...otherGrades, ...merged]);
    return merged;
  } catch (error) {
    console.warn('fetch teaching sessions failed, using local cache', error);
    return mergeDefaults(gradeId, localForGrade);
  }
};

export const saveTeachingSession = async (
  session: TeachingSession,
  patch: Partial<TeachingSession>,
  actor = 'teacher',
): Promise<TeachingSession> => {
  const updated: TeachingSession = {
    ...session,
    ...patch,
    updatedAt: Date.now(),
    updatedBy: actor,
  };
  const local = loadTeachingSessions();
  cacheSessions([updated, ...local.filter((item) => item.id !== updated.id)]);
  if (firebaseAvailable()) {
    await setDoc(doc(db, COLLECTION, updated.id), updated, { merge: true });
  }
  await writeAuditLog({
    action: 'session',
    entityType: 'teachingSession',
    entityId: updated.id,
    classroom: updated.classroom,
    subject: updated.subject,
    summary: `${updated.lessonTitle}: ${updated.status}`,
    before: session,
    after: updated,
  });
  return updated;
};
