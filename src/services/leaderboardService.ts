// ระบบ Leaderboard — สแกน progress data ของทุกคน → จัดอันดับ
import type { StudentProgressData } from './progressService';
import { loadRoster, loadAllRosters } from './rosterService';
import { db } from './firebase';
import { collection, getDocs } from 'firebase/firestore';

export interface LeaderboardEntry {
  studentId: string;
  name: string;
  classroom: string;
  studentNo: number;
  emoji: string;
  totalPoints: number;
  totalActivities: number;
  totalSlides: number;
  unitsCompleted: number;
  weightedScore: number;   // คะแนนถ่วงน้ำหนัก (ใช้จัดอันดับ): quiz ×3 + activities ×2 + slides ×1
  rank: number;
}

const WEIGHT_QUIZ = 3;
const WEIGHT_ACTIVITY = 2;
const WEIGHT_SLIDE = 1;

const computeWeightedScore = (p: StudentProgressData): number =>
  (p.totalPoints || 0) * WEIGHT_QUIZ +
  (p.totalActivities || 0) * WEIGHT_ACTIVITY +
  (p.totalSlidesViewed || 0) * WEIGHT_SLIDE;

/** สแกน localStorage หา progress data ทั้งหมด */
const scanLocalProgress = (): StudentProgressData[] => {
  const result: StudentProgressData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith('krujames_progress_')) continue;
    try {
      const data = JSON.parse(localStorage.getItem(k) || '{}') as StudentProgressData;
      if (data.studentId) result.push(data);
    } catch (e) {
      console.error('Failed to parse progress from localStorage key', k, e);
    }
  }
  return result;
};


/** หาข้อมูลนักเรียนจาก roster โดยใช้ studentId pattern */
const findRosterStudent = (studentId: string) => {
  // Pattern: classroom_studentNo_nameNoSpace
  const parts = studentId.split('_');
  if (parts.length < 3) return null;
  const [classroom, studentNo, ...nameParts] = parts;
  const nameKey = nameParts.join('_').toLowerCase();
  const roster = loadRoster(classroom);
  const found = roster.find(
    (s) =>
      s.no === parseInt(studentNo) ||
      s.name.replace(/\s/g, '').toLowerCase() === nameKey
  );
  return found ? { ...found, classroom } : null;
};

/** ดึง leaderboard — ทุกห้อง หรือ filter ตามห้อง */
export const getLeaderboard = (
  filter: { classroom?: string; limit?: number } = {}
): LeaderboardEntry[] => {
  const allProgress = scanLocalProgress();
  const entries: LeaderboardEntry[] = [];

  allProgress.forEach((prog) => {
    const roster = findRosterStudent(prog.studentId);
    if (!roster) return;
    if (filter.classroom && roster.classroom !== filter.classroom) return;

    entries.push({
      studentId: prog.studentId,
      name: roster.name,
      classroom: roster.classroom,
      studentNo: roster.no,
      emoji: roster.emoji,
      totalPoints: prog.totalPoints || 0,
      totalActivities: prog.totalActivities || 0,
      totalSlides: prog.totalSlidesViewed || 0,
      unitsCompleted: prog.unitsCompleted || 0,
      weightedScore: computeWeightedScore(prog),
      rank: 0,
    });
  });

  // Sort by weightedScore (quiz×3 + activity×2 + slide×1), then unitsCompleted as tiebreaker
  entries.sort((a, b) => {
    if (b.weightedScore !== a.weightedScore) return b.weightedScore - a.weightedScore;
    if (b.unitsCompleted !== a.unitsCompleted) return b.unitsCompleted - a.unitsCompleted;
    return b.totalActivities - a.totalActivities;
  });

  // Assign ranks
  entries.forEach((e, i) => { e.rank = i + 1; });

  if (filter.limit) return entries.slice(0, filter.limit);
  return entries;
};

/** Top by classroom (สำหรับโชว์แบบ tabs) */
export const getTopByClassrooms = (limit = 5): Record<string, LeaderboardEntry[]> => {
  const result: Record<string, LeaderboardEntry[]> = {};
  const all = loadAllRosters();
  Object.keys(all).forEach((classroom) => {
    result[classroom] = getLeaderboard({ classroom, limit });
  });
  return result;
};

/**
 * ดึง progress data ของทุกคนจาก Firebase แล้วเขียนทับ localStorage
 * → ทำให้ leaderboard เห็นนักเรียนข้ามเครื่อง (มือถือ/แท็บเล็ตของเด็ก)
 * call ตอนหน้า leaderboard mount
 */
export const refreshLeaderboardFromCloud = async (): Promise<number> => {
  const fbAvailable = (() => {
    try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
  })();
  if (!fbAvailable) return 0;
  try {
    const snap = await getDocs(collection(db, 'progress'));
    let n = 0;
    snap.forEach((doc) => {
      const data = doc.data() as StudentProgressData;
      if (!data?.studentId) return;
      try {
        localStorage.setItem(`krujames_progress_${data.studentId}`, JSON.stringify(data));
        n += 1;
      } catch (e) {
        console.warn('refreshLeaderboardFromCloud: write skipped', e);
      }
    });
    return n;
  } catch (e) {
    console.debug('refreshLeaderboardFromCloud: fetch failed', e);
    return 0;
  }
};
