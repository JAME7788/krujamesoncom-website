// ระบบ Leaderboard — สแกน progress data ของทุกคน → จัดอันดับ
import type { StudentProgressData } from './progressService';
import { loadRoster, loadAllRosters } from './rosterService';

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
  rank: number;
}

/** สแกน localStorage หา progress data ทั้งหมด */
const scanLocalProgress = (): StudentProgressData[] => {
  const result: StudentProgressData[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k?.startsWith('krujames_progress_')) continue;
    try {
      const data = JSON.parse(localStorage.getItem(k) || '{}') as StudentProgressData;
      if (data.studentId) result.push(data);
    } catch {}
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
      rank: 0,
    });
  });

  // Sort by totalPoints desc, then activities, then slides
  entries.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalActivities !== a.totalActivities) return b.totalActivities - a.totalActivities;
    return b.totalSlides - a.totalSlides;
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
