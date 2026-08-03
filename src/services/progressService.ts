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
import { isNonScoringUserId } from './userAccessService';

// ---------- Types ----------

export type ActivityType = 'slide' | 'video' | 'fun' | 'article' | 'practice' | 'quiz';
export type MissionEvidenceKind = 'slide' | 'question' | 'game' | 'artifact';

export interface MissionEvidence {
  id: string;
  kind: MissionEvidenceKind;
  detail: string;
  timestamp: number;
}

export interface QuizAttempt {
  gradeId: string;
  unitNo: number;
  score: number;
  maxScore: number;
  percentage: number;
  answers: Record<number, number>;
  timestamp: number;
  saved?: boolean;
}

export interface ActivityLog {
  type: ActivityType;
  gradeId: string;
  unitNo: number;
  detail?: string;
  index?: number;
  timestamp: number;
}

export interface ScoredActivityEvidence {
  id: string;
  type: 'slide' | 'video' | 'fun' | 'article' | 'practice';
  timestamp: number;
  inClass: boolean;
  basePoints: number;
}

export interface UnitProgress {
  slidesViewed: number[];
  totalSlides: number;
  videosClicked: string[];
  funClicked: string[];
  articlesClicked: string[];
  /** กิจกรรมลงมือปฏิบัติตามตัวชี้วัดที่นักเรียนยืนยันว่าทำเสร็จ */
  practiceCompleted: string[];
  bestQuizScore: number;
  bestQuizMax: number;
  quizAttempts: number;
  lastAttempt?: QuizAttempt;
  completionPct: number;
  /** วันที่ (YYYY-M-D) ที่นักเรียนทำกิจกรรมในเวลาเรียน — เก็บถาวร ใช้คิด A */
  inClassDays?: string[];
  /** หลักฐานคิดคะแนน P แบบไม่ซ้ำ พร้อมสถานะว่าเกิดในหรือนอกคาบ */
  scoreEvidence?: ScoredActivityEvidence[];
  /** หลักฐานภารกิจในห้อง 3D ใช้ id คงที่เพื่อกันการปั๊มคะแนนจากการทำซ้ำ */
  worldEvidence: MissionEvidence[];
  /** คะแนนตรวจความเข้าใจย่อยในห้อง 3D (เต็มอย่างน้อย 2 เพื่อไม่ให้คำถามเดียวได้ K เต็ม) */
  worldKnowledgeCorrect: number;
  worldKnowledgeMax: number;
  updatedAt: number;
}

export interface BonusEntry {
  emoji: string;
  reason: string;
  xp: number;
  awardedAt: number;
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
  /** วันที่นักเรียนเข้าใช้งาน (YYYY-M-D) — สำหรับคิด streak */
  daysActive?: string[];
  /** วันที่เข้าสู่ระบบหรือทำกิจกรรมตรงตามตารางเรียน ใช้เช็คชื่อและคิด A */
  inClassDays?: string[];
  /** XP โบนัสจากครู (รวม) */
  bonusXp?: number;
  /** ประวัติรางวัล/โบนัส ที่ครูแจก (เก็บ 50 ล่าสุด) */
  bonuses?: BonusEntry[];
}

// ---------- Gamification ----------

export interface Title {
  name: string;
  emoji: string;
}

export interface GamificationStats {
  xp: number;
  level: number;
  levelXp: number;        // XP สะสมภายในเลเวลนี้
  xpInLevel: number;      // XP ทั้งหมดของเลเวลนี้
  progressPct: number;    // 0-100
  title: Title;
  streakDays: number;     // วันต่อเนื่อง
  isActiveToday: boolean;
}

const XP_PER_QUIZ_POINT = 10;   // จากผลรวม bestQuizScore
const XP_PER_ACTIVITY = 5;      // จาก totalActivities
const XP_PER_SLIDE = 1;         // จาก totalSlidesViewed

/** XP ที่ต้องสะสมเพื่อขึ้นเลเวล n (เลเวล 1 = 0 XP, เลเวล 2 = 50 XP, เลเวล 3 = 200 XP, …) */
const xpForLevel = (n: number): number => Math.max(0, (n - 1) * (n - 1) * 50);

const TITLES: { min: number; title: Title }[] = [
  { min: 1,   title: { name: 'ผู้เริ่มต้น',    emoji: '🐣' } },
  { min: 3,   title: { name: 'นักเรียนรู้',    emoji: '📖' } },
  { min: 6,   title: { name: 'นักสำรวจ',       emoji: '🧭' } },
  { min: 10,  title: { name: 'นักผจญภัย',      emoji: '⚔️' } },
  { min: 15,  title: { name: 'นักรบ',          emoji: '🛡️' } },
  { min: 22,  title: { name: 'จอมยุทธ์',       emoji: '🥷' } },
  { min: 30,  title: { name: 'ปรมาจารย์',      emoji: '👑' } },
  { min: 50,  title: { name: 'ตำนาน',          emoji: '🌟' } },
];

const todayKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** เพิ่ม dayKey ของวันนี้ ใน data.daysActive (deduplicated, เก็บไว้ 365 วันล่าสุด) */
const recordDailyActivity = (data: StudentProgressData) => {
  if (!data.daysActive) data.daysActive = [];
  const today = todayKey();
  if (!data.daysActive.includes(today)) data.daysActive.push(today);
  if (data.daysActive.length > 400) {
    data.daysActive = data.daysActive.slice(-365);
  }
};

const computeStreak = (daysActive: string[]): number => {
  if (!daysActive || daysActive.length === 0) return 0;
  const parseDay = (k: string) => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d, 12).getTime();   // noon เพื่อเลี่ยง DST
  };
  const sorted = [...new Set(daysActive)].sort((a, b) => parseDay(a) - parseDay(b));
  const today = parseDay(todayKey());
  const lastTs = parseDay(sorted[sorted.length - 1]);
  // ต้องมี activity วันนี้ หรือเมื่อวาน ถึงนับเป็น streak ปัจจุบัน
  const diffDays = (today - lastTs) / 86400000;
  if (diffDays > 1.5) return 0;
  let streak = 1;
  for (let i = sorted.length - 2; i >= 0; i--) {
    const cur = parseDay(sorted[i + 1]);
    const prev = parseDay(sorted[i]);
    if (Math.abs((cur - prev) / 86400000 - 1) < 0.5) streak += 1;
    else break;
  }
  return streak;
};

export const computeGamification = (studentId: string): GamificationStats => {
  const data = getCached(studentId);
  const xp = (data.totalPoints || 0) * XP_PER_QUIZ_POINT
    + (data.totalActivities || 0) * XP_PER_ACTIVITY
    + (data.totalSlidesViewed || 0) * XP_PER_SLIDE
    + (data.bonusXp || 0);
  // หา level — n สูงสุดที่ xpForLevel(n) ≤ xp
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level += 1;
  const levelStart = xpForLevel(level);
  const levelEnd = xpForLevel(level + 1);
  const xpInLevel = levelEnd - levelStart;
  const levelXp = xp - levelStart;
  const progressPct = xpInLevel > 0 ? Math.round((levelXp / xpInLevel) * 100) : 100;
  const title = ([...TITLES].reverse().find((t) => level >= t.min) || TITLES[0]).title;
  const days = data.daysActive || [];
  const streakDays = computeStreak(days);
  return {
    xp, level, levelXp, xpInLevel, progressPct, title,
    streakDays, isActiveToday: days.includes(todayKey()),
  };
};

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
  practiceCompleted: [],
  bestQuizScore: 0,
  bestQuizMax: 0,
  quizAttempts: 0,
  completionPct: 0,
  inClassDays: [],
  scoreEvidence: [],
  worldEvidence: [],
  worldKnowledgeCorrect: 0,
  worldKnowledgeMax: 0,
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

const normalizeStringList = (value: unknown): string[] => (
  Array.isArray(value)
    ? Array.from(new Set(value.map(String).map((item) => item.trim()).filter(Boolean)))
    : []
);

/** เติม field รุ่นใหม่ให้ progress เก่าก่อนนำไปคำนวณ ป้องกัน undefined จาก Firebase */
const normalizeUnitProgress = (raw: unknown): UnitProgress => {
  const base = emptyUnit();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return base;
  const data = raw as Partial<UnitProgress>;
  return {
    ...base,
    ...data,
    slidesViewed: Array.isArray(data.slidesViewed)
      ? Array.from(new Set(data.slidesViewed.map(Number).filter(Number.isFinite)))
      : [],
    videosClicked: normalizeStringList(data.videosClicked),
    funClicked: normalizeStringList(data.funClicked),
    articlesClicked: normalizeStringList(data.articlesClicked),
    practiceCompleted: normalizeStringList(data.practiceCompleted),
    inClassDays: normalizeStringList(data.inClassDays),
    scoreEvidence: Array.isArray(data.scoreEvidence)
      ? data.scoreEvidence
        .filter((item): item is ScoredActivityEvidence => Boolean(
          item
          && typeof item.id === 'string'
          && typeof item.type === 'string'
          && Number.isFinite(item.timestamp)
          && Number.isFinite(item.basePoints),
        ))
        .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)
        .slice(-240)
      : [],
    worldEvidence: Array.isArray(data.worldEvidence)
      ? data.worldEvidence
        .filter((item): item is MissionEvidence => Boolean(
          item && typeof item.id === 'string' && typeof item.kind === 'string',
        ))
        .filter((item, index, all) => all.findIndex((other) => other.id === item.id) === index)
        .slice(-80)
      : [],
    worldKnowledgeCorrect: Math.max(0, Number(data.worldKnowledgeCorrect) || 0),
    worldKnowledgeMax: Math.max(0, Number(data.worldKnowledgeMax) || 0),
  };
};

const normalizeProgressData = (studentId: string, raw: unknown): StudentProgressData => {
  const source = raw && typeof raw === 'object' && !Array.isArray(raw)
    ? raw as Partial<StudentProgressData>
    : {};
  const rawUnits = source.units && typeof source.units === 'object' && !Array.isArray(source.units)
    ? source.units
    : {};
  const units = Object.fromEntries(
    Object.entries(rawUnits).map(([key, value]) => [key, normalizeUnitProgress(value)]),
  );
  return {
    ...emptyData(studentId),
    ...source,
    studentId,
    units,
    attempts: Array.isArray(source.attempts) ? source.attempts : [],
    activities: Array.isArray(source.activities) ? source.activities : [],
    daysActive: normalizeStringList(source.daysActive),
    inClassDays: normalizeStringList(source.inClassDays),
    bonuses: Array.isArray(source.bonuses) ? source.bonuses : [],
  };
};

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
  cache.set(data.studentId, structuredClone(normalizeProgressData(data.studentId, data)));
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
      return normalizeProgressData(studentId, snap.data());
    }
  } catch (e) {
    console.warn('[progress] firebase read failed', e);
  }
  return emptyData(studentId);
};

/** ดึง progress ของนักเรียนจาก Firebase ลง cache (เรียกตอน Dashboard/หน้าใดๆ mount) */
export const fetchStudentProgress = async (studentId: string): Promise<StudentProgressData> => {
  if (!studentId) return emptyData('');
  if (isNonScoringUserId(studentId)) return emptyData(studentId);
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
      if (data?.studentId && !isNonScoringUserId(data.studentId)) {
        const full = normalizeProgressData(data.studentId, data);
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

const recordGlobalInClassDayIfApplicable = (data: StudentProgressData) => {
  const classroom = parseClassroomFromStudentId(data.studentId);
  if (!classroom) return;
  const now = Date.now();
  if (!isInClassTime(now, classroom, loadSchedule())) return;
  const d = new Date(now);
  const dayKey = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!data.inClassDays) data.inClassDays = [];
  if (!data.inClassDays.includes(dayKey)) data.inClassDays.push(dayKey);
  if (data.inClassDays.length > 400) data.inClassDays = data.inClassDays.slice(-365);
};

const activityBasePoints: Record<ScoredActivityEvidence['type'], number> = {
  slide: 1,
  video: 2,
  fun: 3,
  article: 1,
  practice: 5,
};

const recordScoreEvidence = (
  studentId: string,
  u: UnitProgress,
  type: ScoredActivityEvidence['type'],
  id: string,
) => {
  const normalizedId = `${type}:${id}`.replace(/\s+/g, ' ').trim().slice(0, 180);
  if (!normalizedId) return;
  if (!u.scoreEvidence) u.scoreEvidence = [];
  if (u.scoreEvidence.some((item) => item.id === normalizedId)) return;
  const classroom = parseClassroomFromStudentId(studentId);
  const timestamp = Date.now();
  u.scoreEvidence.push({
    id: normalizedId,
    type,
    timestamp,
    inClass: Boolean(classroom && isInClassTime(timestamp, classroom, loadSchedule())),
    basePoints: activityBasePoints[type],
  });
  u.scoreEvidence = u.scoreEvidence.slice(-240);
};

// ---------- Computation ----------

const recomputeUnit = (u: UnitProgress) => {
  const slidePct = u.totalSlides > 0 ? (u.slidesViewed.length / u.totalSlides) * 100 : 0;
  const hasMedia = u.videosClicked.length + u.funClicked.length + u.articlesClicked.length
    + u.practiceCompleted.length;
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
    acts += u.videosClicked.length + u.funClicked.length + u.articlesClicked.length
      + u.practiceCompleted.length;
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
const persist = async (data: StudentProgressData): Promise<boolean> => {
  if (isNonScoringUserId(data.studentId)) return false;
  recordGlobalInClassDayIfApplicable(data);
  recomputeTotals(data);
  setCached(data);
  try {
    await writeToFirebase(data);
    return true;
  } catch (e) {
    console.warn('[progress] write failed — data ยังอยู่ใน cache ของ session แต่ไม่ขึ้น cloud', e);
    return false;
  }
};

// ---------- Public API ----------

/** ดึงข้อมูล (sync from cache) — caller ควรเรียก fetchStudentProgress ก่อน */
export const getProgress = (studentId: string): StudentProgressData => getCached(studentId);

/**
 * บันทึก "เข้าสู่ระบบ" เป็น activity — เพื่อให้เช็คชื่อตามตารางเห็นเวลา login จริง
 * (เด็ก login ตรงเวลาแต่ยังไม่เปิดสไลด์ = ก่อนหน้านี้ระบบตีเป็นขาด/สาย)
 * ไม่แตะ unit lists → ไม่เพิ่ม XP / P — แค่ log เวลา + streak day
 */
export const trackLogin = async (studentId: string): Promise<void> => {
  if (!studentId) return;
  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  data.activities.unshift({
    type: 'fun',
    gradeId: 'login',
    unitNo: 0,
    detail: 'เข้าสู่ระบบ',
    timestamp: Date.now(),
  });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  recordDailyActivity(data);
  await persist(data);
};

/**
 * ครูแจกรางวัล/โบนัสให้นักเรียน — บันทึก XP โบนัส + ประวัติรางวัล
 * ต้อง fetchStudentProgress ก่อนเพื่อ populate cache (จะ auto-fetch ถ้า miss)
 */
export const awardBonus = async (
  studentId: string,
  bonus: { emoji: string; reason: string; xp: number },
): Promise<boolean> => {
  if (!studentId) return false;
  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  const entry: BonusEntry = {
    emoji: bonus.emoji,
    reason: bonus.reason.trim() || 'รางวัลจากครู',
    xp: Math.max(0, Math.floor(bonus.xp)),
    awardedAt: Date.now(),
  };
  data.bonusXp = (data.bonusXp || 0) + entry.xp;
  data.bonuses = [entry, ...(data.bonuses || [])].slice(0, 50);
  return persist(data);
};

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
): Promise<boolean> => {
  if (!studentId) return false;
  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  u.totalSlides = Math.max(u.totalSlides, totalSlides);
  if (!u.slidesViewed.includes(slideIdx)) u.slidesViewed.push(slideIdx);
  recordScoreEvidence(studentId, u, 'slide', String(slideIdx));
  recordInClassDayIfApplicable(studentId, u);
  recordDailyActivity(data);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.activities.unshift({ type: 'slide', gradeId, unitNo, index: slideIdx, timestamp: Date.now() });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  return persist(data);
};

/** บันทึกการกดสื่อ (video/fun/article) */
export const trackMediaClick = async (
  studentId: string,
  gradeId: string,
  unitNo: number,
  type: 'video' | 'fun' | 'article',
  detail: string,
  /**
   * คีย์กันซ้ำ — ต้อง "คงที่ต่อกิจกรรม" (ห้ามมีคะแนน/เวลา/ค่าที่เปลี่ยนทุกครั้ง)
   * ไม่ส่งมา = ใช้ detail เหมือนเดิม
   * มีไว้ให้ detail แสดงรายละเอียดเพิ่มได้ โดยไม่ทำให้การกันปั๊มคะแนนพัง
   */
  dedupKey?: string,
): Promise<boolean> => {
  if (!studentId) return false;
  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = data.units[k] || emptyUnit();
  const list = type === 'video' ? u.videosClicked : type === 'fun' ? u.funClicked : u.articlesClicked;
  const key = dedupKey ?? detail;
  // รายการเดิมยังถือว่าบันทึกสำเร็จ แต่ไม่เขียน Firebase/เพิ่ม activity ซ้ำ
  // ช่วยกันการกดซ้ำเพื่อปั๊ม XP และลดจำนวน write ในห้องเรียนจริง
  if (list.includes(key)) return true;
  list.push(key);
  recordScoreEvidence(studentId, u, type, key);
  recordInClassDayIfApplicable(studentId, u);
  recordDailyActivity(data);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.activities.unshift({ type, gradeId, unitNo, detail, timestamp: Date.now() });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  return persist(data);
};

export interface TrackMissionEvidenceInput {
  studentId: string;
  gradeId: string;
  unitNo: number;
  eventId: string;
  kind: MissionEvidenceKind;
  detail: string;
  slideIndex?: number;
  totalSlides?: number;
}

export interface TrackMissionEvidenceResult {
  saved: boolean;
  awarded: boolean;
  reason?: 'duplicate' | 'limit' | 'invalid';
  unit: UnitProgress;
}

const missionEvidenceLimit: Record<MissionEvidenceKind, number> = {
  slide: 20,
  question: 10,
  game: 4,
  artifact: 3,
};

/**
 * บันทึกหลักฐานภารกิจห้อง 3D แบบ idempotent
 * eventId ต้องคงที่ตามงานจริง เช่น slide-1, question-0, game-maze, artifact-wood
 */
export const trackWorldMissionEvidence = async (
  input: TrackMissionEvidenceInput,
): Promise<TrackMissionEvidenceResult> => {
  const normalizedEventId = input.eventId.replace(/\s+/g, '-').trim().slice(0, 120);
  if (!input.studentId || !input.gradeId || !normalizedEventId) {
    return { saved: false, awarded: false, reason: 'invalid', unit: emptyUnit() };
  }
  let data = cache.get(input.studentId);
  if (!data) data = await fetchStudentProgress(input.studentId);
  const k = unitKey(input.gradeId, input.unitNo);
  const u = normalizeUnitProgress(data.units[k]);
  const existing = u.worldEvidence.find((item) => item.id === normalizedEventId);
  if (existing) return { saved: true, awarded: false, reason: 'duplicate', unit: u };

  const sameKind = u.worldEvidence.filter((item) => item.kind === input.kind);
  if (sameKind.length >= missionEvidenceLimit[input.kind]) {
    return { saved: true, awarded: false, reason: 'limit', unit: u };
  }

  const evidence: MissionEvidence = {
    id: normalizedEventId,
    kind: input.kind,
    detail: input.detail.replace(/\s+/g, ' ').trim().slice(0, 300),
    timestamp: Date.now(),
  };
  u.worldEvidence.push(evidence);
  u.worldEvidence = u.worldEvidence.slice(-80);

  if (input.kind === 'slide') {
    const slideIndex = Math.max(0, Number(input.slideIndex) || 0);
    if (!u.slidesViewed.includes(slideIndex)) u.slidesViewed.push(slideIndex);
    u.totalSlides = Math.max(u.totalSlides, Number(input.totalSlides) || slideIndex + 1);
  } else if (input.kind === 'question') {
    u.worldKnowledgeCorrect += 1;
    u.worldKnowledgeMax = Math.max(2, u.worldKnowledgeMax, u.worldKnowledgeCorrect);
  } else if (input.kind === 'game') {
    const key = `[3D Game] ${evidence.detail}`;
    if (!u.funClicked.includes(key)) u.funClicked.push(key);
  } else {
    const key = `[3D Artifact] ${evidence.detail}`;
    if (!u.practiceCompleted.includes(key)) u.practiceCompleted.push(key);
  }
  if (input.kind === 'slide') {
    recordScoreEvidence(input.studentId, u, 'slide', `3d:${normalizedEventId}`);
  } else if (input.kind === 'game') {
    recordScoreEvidence(input.studentId, u, 'fun', `3d:${normalizedEventId}`);
  } else if (input.kind === 'artifact') {
    recordScoreEvidence(input.studentId, u, 'practice', `3d:${normalizedEventId}`);
  }

  recordInClassDayIfApplicable(input.studentId, u);
  recordDailyActivity(data);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  const activityType: ActivityType = input.kind === 'slide'
    ? 'slide'
    : input.kind === 'artifact'
      ? 'practice'
      : input.kind === 'question'
        ? 'quiz'
        : 'fun';
  data.activities.unshift({
    type: activityType,
    gradeId: input.gradeId,
    unitNo: input.unitNo,
    detail: `[3D ${input.kind}] ${evidence.detail}`,
    index: input.slideIndex,
    timestamp: evidence.timestamp,
  });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  const saved = await persist(data);
  return { saved, awarded: saved, unit: u };
};

/** บันทึกกิจกรรมลงมือปฏิบัติตามตัวชี้วัด และคืนผลว่าเขียน Firebase สำเร็จหรือไม่ */
export const trackPracticeCompletion = async (
  studentId: string,
  gradeId: string,
  unitNo: number,
  detail: string,
): Promise<boolean> => {
  if (!studentId || !detail.trim()) return false;
  let data = cache.get(studentId);
  if (!data) data = await fetchStudentProgress(studentId);
  const k = unitKey(gradeId, unitNo);
  const u = normalizeUnitProgress(data.units[k]);
  const normalizedDetail = detail.replace(/\s+/g, ' ').trim();
  const isNewCompletion = !u.practiceCompleted.includes(normalizedDetail);

  if (isNewCompletion) {
    u.practiceCompleted.push(normalizedDetail);
    recordScoreEvidence(studentId, u, 'practice', normalizedDetail);
    data.activities.unshift({
      type: 'practice',
      gradeId,
      unitNo,
      detail: normalizedDetail,
      timestamp: Date.now(),
    });
    data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  }

  recordInClassDayIfApplicable(studentId, u);
  recordDailyActivity(data);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  return persist(data);
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
    saved: false,
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
  recordDailyActivity(data);
  u.updatedAt = Date.now();
  recomputeUnit(u);
  data.units[k] = u;
  data.attempts.unshift(attempt);
  data.attempts = data.attempts.slice(0, ATTEMPT_LIMIT);
  data.activities.unshift({ type: 'quiz', gradeId, unitNo, detail: `${score}/${maxScore}`, timestamp: Date.now() });
  data.activities = data.activities.slice(0, ACTIVITY_LIMIT);
  const saved = await persist(data);
  return { ...attempt, saved };
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
