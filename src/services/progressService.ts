// ===================================================================
// Progress Tracking Service — Firebase-only (online-only mode)
// ระบบติดตามความก้าวหน้านักเรียน
//
// Storage Strategy (เปลี่ยนเป็น online-only เมื่อ 2026):
//   - Firestore เป็น source of truth เพียงอย่างเดียว
//   - ไม่มี localStorage cache → ไม่มีปัญหา "ข้อมูลไม่ตรงข้ามเครื่อง"
//   - ใช้ in-memory Map cache สำหรับ session ปัจจุบัน (ลด round-trip)
//     cache หายเมื่อ refresh หน้า — ครั้งถัดไปดึงสด
//   - ถ้าเน็ตขาด → write fail (error log), read fail → คืน empty
// ===================================================================

import { db } from './firebase';
import {
  doc, setDoc, getDoc, getDocs, collection, serverTimestamp,
} from 'firebase/firestore';
import { loadSchedule, isInClassTime } from '../data/schedule';

// ---------- Types ----------

export type ActivityType = 'slide' | 'video' | 'fun' | 'article' | 'quiz';

export interface QuizAttempt {
  gradeId: string;
  unitNo: number;
  score: number;
  maxScore: number;
  percentage: number;
  answers: Record<number, number>;
  timestamp: number;
}

export interface ActivityLog {
  type: ActivityType;
  gradeId: string;
  unitNo: number;
  detail?: string;
  index?: number;
  timestamp: number;
}

export interface UnitProgress {
  slidesViewed: number[];
  totalSlides: number;
  videosClicked: string[];
  funClicked: string[];
  articlesClicked: string[];
  bestQuizScore: number;
  bestQuizMax: number;
  quizAttempts: number;
  lastAttempt?: QuizAttempt;
  completionPct: number;
  /** วันที่ (YYYY-M-D) ที่นักเรียนทำกิจกรรมในเวลาเรียน — เก็บถาวร ใช้คิด A */
  inClassDays?: string[];
  updatedAt: number;
}

export interface StudentProgressData {
  studentId: string;
  units: Record<string, UnitProgress>;
  attempts: QuizAttempt[];
  activities: ActivityLog[];
  totalPoints: number;
  totalSlidesViewed: number;
  totalActivities: number;
  unitsCompleted: number;
  lastActive: number;
}

// ---------- Constants ----------

const ATTEMPT_LIMIT = 50;
const ACTIVITY_LIMIT = 100;

// ---------- Helpers ----------

const unitKey = (gradeId: string, unitNo: number) => `${gradeId}_${unitNo}`;

const emptyUnit = (): UnitProgress => ({
  slidesViewed: [],
  totalSlides: 0,
  videosClicked: [],
  funClicked: [],
  articlesClicked: [],
  bestQuizScore: 0,
  bestQuizMax: 0,
  quizAttempts: 0,
  completionPct: 0,
  inClassDays: [],
  updatedAt: Date.now(),
});

const emptyData = (studentId: string): StudentProgressData => ({
  studentId,
  units: {},
  attempts: [],
  activities: [],
  totalPoints: 0,
  totalSlidesViewed: 0,
  totalActivities: 0,
  unitsCompleted: 0,
  lastActive: 0,
});

const fbAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

// ---------- In-memory cache (per session) ----------

const cache = new Map<string, StudentProgressData>();

/** เคลียร์ cache (ใช้เวลา logout) */
export const clearProgressCache = () => cache.clear();

/** ดึงข้อมูลทุกคนจาก cache (สำหรับ leaderboard / fuzzy match) */
export const getAllCachedProgress = (): StudentProgressData[] => {
  return Array.from(cache.values()).map((d) => structuredClone(d));
};

const getCached = (studentId: string): StudentProgressData =>
  cache.get(studentId) ? structuredClone(cache.get(studentId)!) : emptyData(studentId);

const setCached = (data: StudentProgressData) => {
  cache.set(data.studentId, structuredClone(data));
};

// ---------- Firebase ----------

const docRef = (studentId: string) => doc(db, 'progress', studentId);

const writeToFirebase = async (data: StudentProgressData): Promise<void> => {
  if (!fbAvailable()) throw new Error('Firebase not configured');
  await setDoc(
    docRef(data.studentId),
    {
      ...data,
      attempts: data.attempts.slice(0, 20),
      activities: data.activities.slice(0, 30),
      syncedAt: serverTimestamp(),
    },
    { merge: true }
  );
};

const readFromFirebase = async (studentId: string): Promise<StudentProgressData> => {
  if (!fbAvailable()) return emptyData(studentId);
  try {
    const snap = await getDoc(docRef(studentId));
    if (snap.exists()) {
      return { ...emptyData(studentId), ...snap.data(), studentId };
    }
  } catch (e) {
    console.warn('[progress] firebase read failed', e);
  }
  return emptyData(studentId);
};

/** ดึง progress ของนักเรียนจาก Firebase ลง cache (เรียกตอน Dashboard/หน้าใดๆ mount) */
export const fetchStudentProgress = async (studentId: string): Promise<StudentProgressData> => {
  if (!studentId) return emptyData('');
  const data = await readFromFirebase(studentId);
  setCached(data);
  return data;
};

/** ดึง progress ของทุกคนจาก Firebase — สำหรับ leaderboard / admin */
export const fetchAllProgressFromFirebase = async (): Promise<StudentProgressData[]> => {
  if (!fbAvailable()) return [];
  try {
    const snap = await getDocs(collection(db, 'progress'));
    const result: StudentProgressData[] = [];
    snap.forEach((d) => {
      const data = d.data() as StudentProgressData;
      if (data?.studentId) {
        const full = { ...emptyData(data.studentId), ...data };
        result.push(full);
        setCached(full);
      }
    });
    return result;
  } catch (e) {
    console.debug('[progress] fetch all skipped', e);
    return [];
  }
};

// ---------- Day-key recording (สำหรับ A score) ----------

const parseClassroomFromStudentId = (studentId: string): string | null => {
  const m = studentId.match(/^(ป\.\d+|ม\.\d+)_/);
  return m ? m[1] : null;
};

const recordInClassDayIfApplicable = (studentId: string, u: UnitProgress) => {
  const classroom = parseClassroomFromStudentId(studentId);
  if (!classroom) return;
  const now = Date.now();
  if (!isInClassTime(now, classroom, loadSchedule())) return;
  const d = new Date(now);
  const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!u.inClassDays) u.inClassDays = [];
  if (!u.inClassDays.includes(dayKey)) u.inClassDays.push(dayKey);
};

// ---------- Computation ----------

const recomputeUnit = (u: UnitProgress) => {
  const slidePct = u.totalSlides > 0 ? (u.slidesViewed.length / u.totalSlides) * 100 : 0;
  const hasMedia = u.videosClicked.length + u.funClicked.length + u.articlesClicked.length;
  const mediaPct = hasMedia > 0 ? Math.min(100, hasMedia * 25) : 0;
  const quizPct = u.bestQuizMax > 0 ? (u.bestQuizScore / u.bestQuizMax) * 100 : 0;
  let pct = slidePct * 0.4 + mediaPct * 0.2 + quizPct * 0.4;
  if (u.totalSlides === 0) pct = mediaPct * 0.4 + quizPct * 0.6;
  u.completionPct = Math.round(Math.min(100, pct));
};

const recomputeTotals = (data: StudentProgressData) => {
  let slides = 0;
  let acts = 0;
  let points = 0;
  let completed = 0;
  for (const k of Object.keys(data.units)) {
    const u = data.units[k];
    slides += u.slidesViewed.length;
    acts += u.videosClicked.length + u.funClicked.length + u.articlesClicked.length;
    points += u.bestQuizScore;
    if (u.completionPct >= 80) completed += 1;
  }
  data.totalSlidesViewed = slides;
  data.totalActivities = acts;
  data.totalPoints = points;
  data.unitsCompleted = completed;
  data.lastActive = Date.now();
};

/** เขียนลง Firebase + อัปเดต in-memory cache (await ให้ครบ — Firebase เป็น source of truth) */
const persist = async (data: StudentProgressData) => {
  recomputeTotals(data);
  setCached(data);
  try {
    await writeToFirebase(data);
  } catch (e) {
    console.warn('[progress] write failed — data ยังอยู่ใน cache ของ session แต่ไม่ขึ้น cloud', e);
  }
};

// ---------- Public API ----------

/** ดึงข้อมูล (sync from cache) — caller ควรเรียก fetchStudentProgress ก่อน */
export const getProgress = (studentId: string): StudentProgressData => getCached(studentId);

/**
 * บันทึกการดูสไลด์
 * Firebase เป็น source of truth — รอ Firebase write จบก่อน return
 */
export const trackSlideView = async (
  studentId: string,
  gradeId: string,
  unitNo: number,
  slideIdx: number,
  totalSlides: number
) => {
  if (!studentId) return;
  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  u.totalSlides = Math.max(u.totalSlides, totalSlides);
  if (!u.slidesViewed.includes(slideIdx)) u.slidesViewed.push(slideIdx);
  recordInClassDayIfApplicable(studentId, u);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.activities.unshift({ type: 'slide', gradeId, unitNo, index: slideIdx, timestamp: Date.now() });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  await persist(data);
};

/** บันทึกการกดสื่อ (video/fun/article) */
export const trackMediaClick = async (
  studentId: string,
  gradeId: string,
  unitNo: number,
  type: 'video' | 'fun' | 'article',
  detail: string
) => {
  if (!studentId) return;
  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  const list = type === 'video' ? u.videosClicked : type === 'fun' ? u.funClicked : u.articlesClicked;
  if (!list.includes(detail)) list.push(detail);
  recordInClassDayIfApplicable(studentId, u);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.activities.unshift({ type, gradeId, unitNo, detail, timestamp: Date.now() });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  await persist(data);
};

/** บันทึกการทำแบบทดสอบ */
export const saveQuizAttempt = async (
  studentId: string,
  gradeId: string,
  unitNo: number,
  score: number,
  maxScore: number,
  answers: Record<number, number>
): Promise<QuizAttempt> => {
  const attempt: QuizAttempt = {
    gradeId, unitNo, score, maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    answers,
    timestamp: Date.now(),
  };
  if (!studentId) return attempt;
  if (maxScore <= 0) return attempt;

  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  u.quizAttempts += 1;
  const newPct = score / maxScore;
  const bestPct = u.bestQuizMax > 0 ? u.bestQuizScore / u.bestQuizMax : 0;
  if (newPct > bestPct || u.bestQuizMax === 0) {
    u.bestQuizScore = score;
    u.bestQuizMax = maxScore;
  }
  u.lastAttempt = attempt;
  recordInClassDayIfApplicable(studentId, u);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.attempts.unshift(attempt);
  data.attempts = data.attempts.slice(0, ATTEMPT_LIMIT);
  data.activities.unshift({ type: 'quiz', gradeId, unitNo, detail: `${score}/${maxScore}`, timestamp: Date.now() });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  await persist(data);
  return attempt;
};

/** ดึงข้อมูลของหน่วยเดียว */
export const getUnitProgress = (
  studentId: string,
  gradeId: string,
  unitNo: number
): UnitProgress => {
  const data = getCached(studentId);
  return data.units[unitKey(gradeId, unitNo)] || emptyUnit();
};

/** สรุปข้อมูลสำหรับ Dashboard */
export const getSummary = (studentId: string) => {
  const data = getCached(studentId);
  const unitsStarted = Object.keys(data.units).length;
  const unitsCompleted = Object.values(data.units).filter((u) => u.completionPct >= 80).length;
  const recentAttempts = data.attempts.slice(0, 10);
  const recentActivities = data.activities.slice(0, 10);
  const averageScore =
    data.attempts.length > 0
      ? Math.round(data.attempts.reduce((sum, a) => sum + a.percentage, 0) / data.attempts.length)
      : 0;
  return {
    units: Object.entries(data.units).map(([k, u]) => ({
      key: k,
      gradeId: k.split('_')[0],
      unitNo: parseInt(k.split('_')[1], 10),
      ...u,
    })),
    totalSlidesViewed: data.totalSlidesViewed,
    totalActivities: data.totalActivities,
    totalPoints: data.totalPoints,
    unitsStarted,
    unitsCompleted,
    recentAttempts,
    recentActivities,
    averageScore,
    lastActive: data.lastActive,
  };
};
