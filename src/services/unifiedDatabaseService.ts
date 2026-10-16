// 🔗 Unified Database Service (ศูนย์กลางการเชื่อมโยงฐานข้อมูลเดียวของระบบเรียนและเกม)
// เชื่อมโยงข้อมูลจาก:
// 1. Unified Game Registry (แคตตาล็อกเกม 38 เกม + บทเรียน + ภารกิจ + คำถาม + CT 4 เสาหลัก + Bloom + ตัวชี้วัด)
// 2. Progress Service (ความก้าวหน้ารายหน่วยการเรียนรู้)
// 3. Learning Evidence Service (หลักฐานการเรียนรู้เชิงประจักษ์ K/P/A)
// 4. Game Reflection Service (บันทึกการสะท้อนคิด 3 ดาว Portfolio)
// 5. Computational Thinking Service (โปรไฟล์ทักษะการคิดเชิงคำนวณ 4 ด้าน)
// 6. Coin & Reward Service (เหรียญสะสมและตัวละคร)
// 7. Teacher Custom Config Sync (ปรับแต่งความเร็ว เวลา โจทย์ และคำใบ้ของแต่ละเกมได้ทั้งในเครื่องและ Cloud)

import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import {
  getAllUnifiedGames,
  getUnifiedGameRecord,
  loadAllGameCustomOverrides,
  saveGameCustomOverride,
  resetGameCustomOverride,
  normalizeCatalogGameId,
  type GameCustomOverride,
  type UnifiedGameRecord,
} from '../data/unifiedGameRegistry';
import { getProgress, getSummary } from './progressService';
import { loadLearningEvidence, type LearningEvidence } from './learningEvidenceService';
import { loadStudentReflections, type GameReflectionRecord } from './gameReflectionService';
import { calculateStudentCtProfile, type CtStudentProfile } from './computationalThinkingService';
import { getCoins, getOwnedCharacters } from './coinService';

export interface UnifiedGamePlayEntry {
  gameId: string;
  gameTitle: string;
  bestScore: number;
  lastScore: number;
  maxScore?: number;
  playCount: number;
  lastPlayedAt: number;
  lastActivityKey?: string;
}

export interface UnifiedStudentLearningSnapshot {
  studentId: string;
  classroom: string;
  coins: number;
  ownedCharacters: string[];
  totalActivities: number;
  completedUnits: number;
  ctProfile: CtStudentProfile;
  reflections: GameReflectionRecord[];
  evidence: LearningEvidence[];
  playHistory: Record<string, UnifiedGamePlayEntry>;
  games: Array<{
    record: UnifiedGameRecord;
    played: boolean;
    playCount: number;
    bestScore: number;
    reflectionCount: number;
    earnedStars: number;
    evidenceCount: number;
  }>;
}

const PLAY_HISTORY_PREFIX = 'kj_unified_play_history_';
const CLOUD_CONFIG_COLLECTION = 'site_settings';
const CLOUD_CONFIG_DOC = 'unified_game_config';
const memoryPlayHistory: Record<string, Record<string, UnifiedGamePlayEntry>> = {};

function playHistoryKey(studentId?: string): string {
  return `${PLAY_HISTORY_PREFIX}${studentId || 'guest'}`;
}

export function loadStudentPlayHistory(
  studentId?: string,
): Record<string, UnifiedGamePlayEntry> {
  const key = playHistoryKey(studentId);
  if (typeof localStorage === 'undefined') {
    return { ...(memoryPlayHistory[key] || {}) };
  }
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { ...(memoryPlayHistory[key] || {}) };
  }
}

export function recordUnifiedPlayHistory(
  studentId: string | undefined,
  gameId: string,
  gameTitle: string,
  score?: number,
  maxScore?: number,
  activityKey?: string,
): UnifiedGamePlayEntry {
  const canonicalId = normalizeCatalogGameId(gameId);
  const key = playHistoryKey(studentId);
  const history = loadStudentPlayHistory(studentId);
  const prev = history[canonicalId];
  const numericScore = typeof score === 'number' && Number.isFinite(score) ? score : 0;

  const entry: UnifiedGamePlayEntry = {
    gameId: canonicalId,
    gameTitle,
    bestScore: prev ? Math.max(prev.bestScore, numericScore) : numericScore,
    lastScore: numericScore,
    maxScore: maxScore ?? prev?.maxScore,
    playCount: (prev?.playCount || 0) + 1,
    lastPlayedAt: Date.now(),
    lastActivityKey: activityKey || prev?.lastActivityKey,
  };

  history[canonicalId] = entry;
  memoryPlayHistory[key] = { ...history };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(history));
    }
  } catch {
    // ignore storage quota errors
  }
  return entry;
}

/**
 * ดึงข้อมูลภาพรวมการเรียนรู้ของนักเรียนจากฐานข้อมูลเดียว (เชื่อมโยงทุกบริการเข้าด้วยกัน)
 */
export function getUnifiedStudentLearningSnapshot(
  studentId: string,
  classroom = 'ป.4',
): UnifiedStudentLearningSnapshot {
  const safeId = studentId || 'guest';
  const safeClassroom = classroom || 'ป.4';
  const summary = getSummary(safeId, safeClassroom);
  const rawProgress = getProgress(safeId);
  const reflections = loadStudentReflections(safeId);
  const allEvidence = loadLearningEvidence().filter((item) => item.studentId === safeId);
  const ctProfile = calculateStudentCtProfile(safeId, safeClassroom);
  const playHistory = loadStudentPlayHistory(safeId);
  const allGames = getAllUnifiedGames(safeClassroom);

  const activityDetails = Object.values(rawProgress.units || {}).flatMap(
    (u) => u.funClicked || [],
  );

  const games = allGames.map((record) => {
    const gId = record.id;
    const historyEntry = playHistory[gId];
    const gameReflections = reflections.filter(
      (r) => normalizeCatalogGameId(r.gameId) === gId || r.gameId === gId,
    );
    const gameEvidence = allEvidence.filter(
      (e) =>
        e.source === 'game' &&
        (e.id.includes(gId) || e.title === record.catalog.title || e.detail?.includes(record.catalog.title)),
    );
    const progressMatches = activityDetails.filter(
      (a) =>
        a.includes(record.catalog.title) ||
        a.toLowerCase().includes(gId.toLowerCase()),
    );

    const playCount = Math.max(
      historyEntry?.playCount || 0,
      progressMatches.length,
      gameEvidence.length > 0 ? 1 : 0,
    );
    const bestScoreFromEvidence = gameEvidence.reduce(
      (max, e) => (typeof e.score === 'number' && e.score > max ? e.score : max),
      0,
    );
    const bestScore = Math.max(historyEntry?.bestScore || 0, bestScoreFromEvidence);
    const earnedStars = gameReflections.reduce(
      (max, r) => Math.max(max, r.learningStars || 0),
      playCount > 0 ? 1 : 0,
    );

    return {
      record,
      played: playCount > 0 || gameReflections.length > 0,
      playCount,
      bestScore,
      reflectionCount: gameReflections.length,
      earnedStars,
      evidenceCount: gameEvidence.length,
    };
  });

  const completedUnitsCount = (summary.units || []).filter(
    (u) => u.bestQuizScore > 0 || (u.funClicked && u.funClicked.length > 0) || (u.slidesViewed && u.slidesViewed.length > 0),
  ).length;

  return {
    studentId: safeId,
    classroom: safeClassroom,
    coins: getCoins(safeId),
    ownedCharacters: getOwnedCharacters(safeId),
    totalActivities: summary.totalActivities,
    completedUnits: completedUnitsCount,
    ctProfile,
    reflections,
    evidence: allEvidence,
    playHistory,
    games,
  };
}

/**
 * ซิงค์การตั้งค่าปรับแต่งเกมของครู (Teacher Custom Game Overrides) ขึ้น Cloud Firestore
 * เพื่อให้เด็กทุกเครื่องเห็นค่าที่ครูปรับแต่งตรงกัน (พร้อม fallback ลง localStorage เสมอ)
 */
export async function syncGameCustomConfigToCloud(
  gameId: string,
  patch: Partial<Omit<GameCustomOverride, 'gameId'>>,
): Promise<GameCustomOverride> {
  const updated = saveGameCustomOverride(gameId, patch);
  if (!db) return updated;
  try {
    const allOverrides = loadAllGameCustomOverrides();
    await setDoc(
      doc(db, CLOUD_CONFIG_COLLECTION, CLOUD_CONFIG_DOC),
      {
        overrides: allOverrides,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // ออฟไลน์หรือไม่มีสิทธิ์เขียน Cloud — ใช้ค่าในเครื่องได้ตามปกติ
  }
  return updated;
}

export async function resetGameCustomConfigWithCloud(gameId: string): Promise<void> {
  resetGameCustomOverride(gameId);
  if (!db) return;
  try {
    const allOverrides = loadAllGameCustomOverrides();
    await setDoc(
      doc(db, CLOUD_CONFIG_COLLECTION, CLOUD_CONFIG_DOC),
      {
        overrides: allOverrides,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } catch {
    // ignore offline error
  }
}

export async function fetchGameCustomConfigsFromCloud(): Promise<Record<string, GameCustomOverride>> {
  const local = loadAllGameCustomOverrides();
  if (!db) return local;
  try {
    const snap = await getDoc(doc(db, CLOUD_CONFIG_COLLECTION, CLOUD_CONFIG_DOC));
    if (!snap.exists()) return local;
    const data = snap.data() as { overrides?: Record<string, GameCustomOverride> } | undefined;
    if (!data?.overrides || typeof data.overrides !== 'object') return local;
    const merged: Record<string, GameCustomOverride> = { ...data.overrides, ...local };
    Object.entries(data.overrides).forEach(([key, remoteVal]) => {
      const localVal = local[key];
      if (!localVal || (remoteVal?.updatedAt || 0) >= (localVal?.updatedAt || 0)) {
        merged[key] = remoteVal;
      }
    });
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('krujames_unified_game_config_v1', JSON.stringify(merged));
    }
    return merged;
  } catch {
    return local;
  }
}

export {
  getUnifiedGameRecord,
  getAllUnifiedGames,
  loadAllGameCustomOverrides,
  saveGameCustomOverride,
  resetGameCustomOverride,
};
