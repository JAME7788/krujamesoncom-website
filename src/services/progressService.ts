// ===================================================================
// Progress Tracking Service
// ระบบติดตามความก้าวหน้านักเรียน — บันทึกทุกการเรียนรู้แบบเรียลไทม์
//
// Storage Strategy:
//   - localStorage: primary (always works, ทำงานได้แม้ไม่มี internet)
//   - Firebase Firestore: sync layer (ถ้า config ไว้จะ sync auto)
//
// ติดตามอะไรบ้าง:
//   1. การอ่านสไลด์ (slide views per unit)
//   2. การกดเล่นสื่อ (video/fun/article clicks)
//   3. การทำแบบทดสอบ (quiz attempts with full history)
//   4. คะแนนรวม + เปอร์เซ็นต์ความก้าวหน้า
// ===================================================================

import { db } from './firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

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
  detail?: string;       // ชื่อวิดีโอ/เกม/บทความ
  index?: number;        // index ของสไลด์
  timestamp: number;
}

export interface UnitProgress {
  slidesViewed: number[];       // index สไลด์ที่ดูแล้ว
  totalSlides: number;          // จำนวนสไลด์ทั้งหมด
  videosClicked: string[];      // ชื่อวิดีโอที่กด
  funClicked: string[];         // ชื่อเกม/กิจกรรมที่กด
  articlesClicked: string[];    // ชื่อบทความที่อ่าน
  bestQuizScore: number;
  bestQuizMax: number;
  quizAttempts: number;
  lastAttempt?: QuizAttempt;
  completionPct: number;        // 0-100
  updatedAt: number;
}

export interface StudentProgressData {
  studentId: string;
  units: Record<string, UnitProgress>;     // key = `${gradeId}_${unitNo}`
  attempts: QuizAttempt[];                  // history สูงสุด 50 ครั้งล่าสุด
  activities: ActivityLog[];                // history สูงสุด 100 events
  totalPoints: number;
  totalSlidesViewed: number;
  totalActivities: number;
  unitsCompleted: number;
  lastActive: number;
}

// ---------- Storage Helpers ----------

const KEY_PREFIX = 'krujames_progress_';
const ATTEMPT_LIMIT = 50;
const ACTIVITY_LIMIT = 100;

const storageKey = (studentId: string) => `${KEY_PREFIX}${studentId}`;

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

const unitKey = (gradeId: string, unitNo: number) => `${gradeId}_${unitNo}`;

const loadLocal = (studentId: string): StudentProgressData => {
  if (!studentId) return emptyData(studentId);
  try {
    const raw = localStorage.getItem(storageKey(studentId));
    if (!raw) return emptyData(studentId);
    return { ...emptyData(studentId), ...JSON.parse(raw) };
  } catch {
    return emptyData(studentId);
  }
};

const saveLocal = (data: StudentProgressData) => {
  try {
    localStorage.setItem(storageKey(data.studentId), JSON.stringify(data));
  } catch (e) {
    console.warn('[progress] localStorage write failed', e);
  }
};

// ---------- Firebase Sync (best-effort) ----------

const firebaseAvailable = (): boolean => {
  try {
    return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  } catch {
    return false;
  }
};

const syncToFirebase = async (data: StudentProgressData) => {
  if (!firebaseAvailable()) return;
  try {
    const ref = doc(db, 'progress', data.studentId);
    // ใช้ setDoc + merge ไม่ต้องเช็ค exists ก่อน
    await setDoc(
      ref,
      {
        ...data,
        // เก็บแค่ snapshot ล่าสุด (ไม่ส่ง array ยาวๆ ทุกครั้ง)
        attempts: data.attempts.slice(0, 20),
        activities: data.activities.slice(0, 30),
        syncedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (e) {
    // เงียบไว้ — เน็ตอาจขาด หรือยังไม่ได้ config
    console.debug('[progress] firebase sync skipped', e);
  }
};

// ---------- Computation ----------

const recomputeUnit = (u: UnitProgress) => {
  // คำนวณเปอร์เซ็นต์ความก้าวหน้าของหน่วย
  // น้ำหนัก: สไลด์ 40% + กิจกรรม 20% + ควิซ 40%
  const slidePct = u.totalSlides > 0 ? (u.slidesViewed.length / u.totalSlides) * 100 : 0;
  const hasMedia = u.videosClicked.length + u.funClicked.length + u.articlesClicked.length;
  const mediaPct = hasMedia > 0 ? Math.min(100, hasMedia * 25) : 0;
  const quizPct = u.bestQuizMax > 0 ? (u.bestQuizScore / u.bestQuizMax) * 100 : 0;

  let pct = slidePct * 0.4 + mediaPct * 0.2 + quizPct * 0.4;
  // ถ้าหน่วยนี้ไม่มีสไลด์เลย กระจายน้ำหนักไปที่อื่น
  if (u.totalSlides === 0) {
    pct = mediaPct * 0.4 + quizPct * 0.6;
  }
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

const persist = async (data: StudentProgressData) => {
  recomputeTotals(data);
  saveLocal(data);
  // sync ใน background ไม่ block UI
  syncToFirebase(data);
};

// ---------- Public API ----------

/** ดึงข้อมูลความก้าวหน้านักเรียนทั้งหมด */
export const getProgress = (studentId: string): StudentProgressData => {
  return loadLocal(studentId);
};

/** บันทึกการดูสไลด์ */
export const trackSlideView = async (
  studentId: string,
  gradeId: string,
  unitNo: number,
  slideIdx: number,
  totalSlides: number
) => {
  if (!studentId) return;
  const data = loadLocal(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  u.totalSlides = Math.max(u.totalSlides, totalSlides);
  if (!u.slidesViewed.includes(slideIdx)) {
    u.slidesViewed.push(slideIdx);
  }
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.activities.unshift({
    type: 'slide',
    gradeId,
    unitNo,
    index: slideIdx,
    timestamp: Date.now(),
  });
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
  const data = loadLocal(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  const list = type === 'video' ? u.videosClicked : type === 'fun' ? u.funClicked : u.articlesClicked;
  if (!list.includes(detail)) {
    list.push(detail);
  }
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
    gradeId,
    unitNo,
    score,
    maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    answers,
    timestamp: Date.now(),
  };
  if (!studentId) return attempt;

  const data = loadLocal(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  u.quizAttempts += 1;
  if (score > u.bestQuizScore) {
    u.bestQuizScore = score;
    u.bestQuizMax = maxScore;
  } else if (u.bestQuizMax === 0) {
    u.bestQuizMax = maxScore;
  }
  u.lastAttempt = attempt;
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.attempts.unshift(attempt);
  data.attempts = data.attempts.slice(0, ATTEMPT_LIMIT);
  data.activities.unshift({
    type: 'quiz',
    gradeId,
    unitNo,
    detail: `${score}/${maxScore}`,
    timestamp: Date.now(),
  });
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
  const data = loadLocal(studentId);
  return data.units[unitKey(gradeId, unitNo)] || emptyUnit();
};

/** ลบข้อมูลทั้งหมด (เช่นกดออกจากระบบ + clear) */
export const clearProgress = (studentId: string) => {
  try {
    localStorage.removeItem(storageKey(studentId));
  } catch {
    // ignore
  }
};

/** ดึงคะแนนรวม + สถิติย่อ สำหรับ Dashboard */
export const getSummary = (studentId: string) => {
  const data = loadLocal(studentId);
  const unitArr = Object.entries(data.units).map(([k, u]) => ({
    key: k,
    ...u,
  }));
  const avgScore =
    unitArr.length > 0
      ? Math.round(
          unitArr.reduce(
            (acc, u) => acc + (u.bestQuizMax > 0 ? (u.bestQuizScore / u.bestQuizMax) * 100 : 0),
            0
          ) / Math.max(1, unitArr.filter((u) => u.bestQuizMax > 0).length)
        )
      : 0;
  return {
    totalPoints: data.totalPoints,
    totalSlidesViewed: data.totalSlidesViewed,
    totalActivities: data.totalActivities,
    unitsCompleted: data.unitsCompleted,
    unitsStarted: unitArr.length,
    averageScore: avgScore,
    recentAttempts: data.attempts.slice(0, 10),
    recentActivities: data.activities.slice(0, 15),
    units: unitArr,
    lastActive: data.lastActive,
  };
};

/** สำหรับครู: ดึงข้อมูลนักเรียนรายคน (จะ async ดึงจาก Firebase ถ้ามี) */
export const fetchStudentProgress = async (
  studentId: string
): Promise<StudentProgressData> => {
  // local first
  const local = loadLocal(studentId);
  if (!firebaseAvailable()) return local;
  try {
    const ref = doc(db, 'progress', studentId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const remote = snap.data() as StudentProgressData;
      // เลือกอันที่ใหม่กว่า
      if ((remote.lastActive || 0) > (local.lastActive || 0)) {
        saveLocal(remote);
        return remote;
      }
    }
  } catch (e) {
    console.debug('[progress] fetch failed, using local', e);
  }
  return local;
};
