// 🗄️ Unified Game Registry (ฐานข้อมูลเกมและการเรียนรู้รวมศูนย์)
// เชื่อมโยงข้อมูลจาก gamesCatalog, gameLessons, gameMissions, gameChallenges,
// Computational Thinking 4 Pillars, Bloom's Revised Taxonomy และหน่วยการเรียนรู้ (Target Units)
// เข้าด้วยกันเป็น Single Source of Truth โดยไม่ลบข้อมูลเดิม และรองรับการปรับแต่งของครู (Customizable Config)

import { gamesCatalog, type GameInfo } from './gamesCatalog';
import { gameLessons, type GameLesson, type LessonBody } from './gameLessons';
import { gameMissions, type GameMission } from './gameMissions';
import { gameChallenges } from './gameChallenges';
import {
  CT_PILLARS,
  getPillarForGameId,
  type CtPillar,
  type CtPillarInfo,
} from '../services/computationalThinkingService';
import {
  getActivityBloomLevel,
  getBloomInfo,
  type BloomInfo,
  type BloomLevel,
} from '../services/bloomTaxonomyService';
import {
  getGameTargetUnits,
  type GameProgressId,
} from '../services/gameProgressService';

export function normalizeCatalogGameId(gameId: string): GameProgressId {
  const trimmed = gameId.trim();
  if (trimmed === 'coding-maze') return 'maze';
  if (trimmed === 'bug-catcher') return 'bug';
  return trimmed as GameProgressId;
}

export interface GameCustomOverride {
  gameId: string;
  customTitle?: string;
  customDesc?: string;
  customObjective?: string;
  customChallenge?: string;
  customHint?: string;
  customQuestion?: string;
  customOptions?: [string, string];
  customExplanation?: string;
  speedMultiplier?: number; // 0.6 (ช้าลงสำหรับเด็กเล็ก) - 1.4 (ท้าทาย)
  timerBonusSeconds?: number; // เพิ่มเวลาให้เด็ก (0 - 60 วินาที)
  showControlHints?: boolean; // แสดงป้ายช่วยเหลือปุ่มกด
  updatedAt?: number;
}

export interface UnifiedGameRecord {
  id: GameProgressId;
  rawId: string;
  catalog: GameInfo;
  lesson: GameLesson | null;
  mission: GameMission | null;
  advancedChallenge: string;
  ctPillar: CtPillarInfo;
  bloom: BloomInfo;
  targetUnits: Array<{ gradeId: string; unitNo: number }>;
  customOverride: GameCustomOverride | null;
  // ค่าที่ผสานการปรับแต่งของครูแล้ว (Effective Values)
  effectiveTitle: string;
  effectiveDesc: string;
  effectiveMission: GameMission | null;
  effectiveAdvancedChallenge: string;
  effectiveSpeedMultiplier: number;
  effectiveTimerBonusSeconds: number;
  effectiveShowControlHints: boolean;
}

const CUSTOM_GAME_CONFIG_STORAGE_KEY = 'krujames_unified_game_config_v1';
let memoryCustomOverrides: Record<string, GameCustomOverride> = {};

export function loadAllGameCustomOverrides(): Record<string, GameCustomOverride> {
  if (typeof localStorage === 'undefined') {
    return { ...memoryCustomOverrides };
  }
  try {
    const raw = localStorage.getItem(CUSTOM_GAME_CONFIG_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return { ...memoryCustomOverrides };
  }
}

export function getGameCustomOverride(gameId: string): GameCustomOverride | null {
  const normalized = normalizeCatalogGameId(gameId);
  const all = loadAllGameCustomOverrides();
  return all[normalized] || all[gameId] || null;
}

export function saveGameCustomOverride(
  gameId: string,
  patch: Partial<Omit<GameCustomOverride, 'gameId'>>,
): GameCustomOverride {
  const normalized = normalizeCatalogGameId(gameId);
  const all = loadAllGameCustomOverrides();
  const current = all[normalized] || { gameId: normalized };
  const next: GameCustomOverride = {
    ...current,
    ...patch,
    gameId: normalized,
    updatedAt: Date.now(),
  };
  all[normalized] = next;
  memoryCustomOverrides = { ...all };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOM_GAME_CONFIG_STORAGE_KEY, JSON.stringify(all));
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('unified-game-config-updated', { detail: { gameId: normalized, config: next } }),
      );
    }
  } catch {
    // ignore storage errors
  }
  return next;
}

export function resetGameCustomOverride(gameId: string): void {
  const normalized = normalizeCatalogGameId(gameId);
  const all = loadAllGameCustomOverrides();
  delete all[normalized];
  delete all[gameId];
  memoryCustomOverrides = { ...all };
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(CUSTOM_GAME_CONFIG_STORAGE_KEY, JSON.stringify(all));
    }
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('unified-game-config-updated', { detail: { gameId: normalized, config: null } }),
      );
    }
  } catch {
    // ignore storage errors
  }
}

function buildSynthesizedLesson(
  catalogEntry: GameInfo,
  baseMission: GameMission | null,
  baseChallenge: string,
  ctPillar: CtPillarInfo,
): GameLesson {
  const objective = baseMission?.objective || catalogEntry.desc;
  const hint = baseMission?.hint || `ใช้หลักการ ${ctPillar.name} (${ctPillar.nameEn}) เพื่อแก้ปัญหาทีละขั้น`;
  const explanation =
    baseMission?.explanation ||
    `เกมนี้เชื่อมโยงกับเสาหลัก ${ctPillar.name} (${ctPillar.nameEn}): ${ctPillar.description}`;

  return {
    emoji: catalogEntry.emoji,
    title: catalogEntry.title,
    subject: `${ctPillar.name} (${ctPillar.nameEn})`,
    color: catalogEntry.color || ctPillar.color,
    lower: {
      concept: `${objective} — เริ่มสังเกตและลองทำทีละขั้นตอนอย่างสนุกสนาน`,
      points: [
        { icon: catalogEntry.emoji, text: `เป้าหมายหลัก: ${objective}` },
        { icon: '💡', text: `เคล็ดลับ: ${hint}` },
      ],
      example: explanation,
      howTo: [
        'อ่านภารกิจด้านบนก่อนเริ่มเล่น',
        'สังเกตเงื่อนไขของโจทย์แล้วเลือกคำตอบที่ถูกต้อง',
        'ตอบคำถามท้ายเกมเพื่อรับดาวสะสมเพิ่ม',
      ],
    },
    upper: {
      concept: `${objective} — ฝึกเชื่อมโยงกับทักษะ ${ctPillar.name} (${ctPillar.nameEn})`,
      points: [
        { icon: ctPillar.emoji, text: `หลักคิดสำคัญ: ${ctPillar.description}` },
        { icon: '🎯', text: `ภารกิจ: ${objective}` },
        { icon: '💡', text: `คำแนะนำเชิงกลยุทธ์: ${hint}` },
      ],
      example: explanation,
      howTo: [
        'วิเคราะห์เงื่อนไขและรูปแบบของโจทย์ในแต่ละด่าน',
        'วางแผนก่อนตัดสินใจเลือกคำตอบเพื่อทำคะแนนสูงสุด',
        'สรุปสิ่งที่ได้เรียนรู้ในภารกิจท้ายเกม',
      ],
    },
    middle: {
      concept: `${objective} — วิเคราะห์เชิงลึกด้วย ${ctPillar.nameEn} และประเมินประสิทธิภาพของวิธีการแก้ปัญหา`,
      points: [
        { icon: ctPillar.emoji, text: `Computational Thinking Pillar: ${ctPillar.name} (${ctPillar.nameEn})` },
        { icon: '🚀', text: `ภารกิจขั้นสูง: ${baseChallenge || objective}` },
        { icon: '🧠', text: `แนวทางการวิเคราะห์: ${explanation}` },
      ],
      example: explanation,
      howTo: [
        'วิเคราะห์โครงสร้างของปัญหาและแยกย่อยเงื่อนไขที่ซับซ้อน',
        'เลือกวิธีแก้ปัญหาที่แม่นยำและใช้ขั้นตอนน้อยที่สุด',
        'เชื่อมโยงหลักการในเกมเข้ากับการใช้งานจริงด้านเทคโนโลยี',
      ],
    },
  };
}

// เติมบทเรียนที่ยังขาดให้ครบทั้ง 38 เกมในฐานข้อมูลเดียว โดยไม่ทับข้อมูลเดิมที่มีอยู่แล้ว
for (const catalogEntry of gamesCatalog) {
  const canonicalId = normalizeCatalogGameId(catalogEntry.id);
  if (!gameLessons[canonicalId] && !gameLessons[catalogEntry.id]) {
    const baseMission = gameMissions[canonicalId] || gameMissions[catalogEntry.id] || null;
    const baseChallenge = gameChallenges[canonicalId] || gameChallenges[catalogEntry.id] || '';
    const ctPillar = getPillarForGameId(canonicalId);
    gameLessons[canonicalId] = buildSynthesizedLesson(
      catalogEntry,
      baseMission,
      baseChallenge,
      ctPillar,
    );
  }
}

/**
 * ดึงข้อมูลเกมแบบเชื่อมโยงครบทุกมิติ (Catalog + Lesson + Mission + Challenge + CT Pillar + Bloom + Target Units + Custom Override)
 */
export function getUnifiedGameRecord(
  gameId: string,
  classroom = 'ป.4',
): UnifiedGameRecord | null {
  const normalizedId = normalizeCatalogGameId(gameId);
  const catalogEntry =
    gamesCatalog.find((g) => g.id === normalizedId || g.id === gameId) || null;
  if (!catalogEntry) return null;

  const canonicalId = catalogEntry.id as GameProgressId;
  const baseMission = gameMissions[canonicalId] || gameMissions[gameId] || null;
  const baseChallenge = gameChallenges[canonicalId] || gameChallenges[gameId] || '';
  const ctPillar = getPillarForGameId(canonicalId);
  const lesson =
    gameLessons[canonicalId] ||
    gameLessons[gameId] ||
    buildSynthesizedLesson(catalogEntry, baseMission, baseChallenge, ctPillar);
  const bloomLevel: BloomLevel = getActivityBloomLevel('fun', canonicalId);
  const bloom = getBloomInfo(bloomLevel);
  const targetUnits = getGameTargetUnits(canonicalId, classroom);
  const override = getGameCustomOverride(canonicalId);

  const effectiveMission: GameMission | null = baseMission
    ? {
        objective: override?.customObjective?.trim() || baseMission.objective,
        challenge: override?.customChallenge?.trim() || baseMission.challenge,
        hint: override?.customHint?.trim() || baseMission.hint,
        question: override?.customQuestion?.trim() || baseMission.question,
        options:
          override?.customOptions &&
          override.customOptions[0]?.trim() &&
          override.customOptions[1]?.trim()
            ? [override.customOptions[0].trim(), override.customOptions[1].trim()]
            : baseMission.options,
        explanation: override?.customExplanation?.trim() || baseMission.explanation,
      }
    : null;

  return {
    id: canonicalId,
    rawId: gameId,
    catalog: catalogEntry,
    lesson,
    mission: baseMission,
    advancedChallenge: baseChallenge,
    ctPillar,
    bloom,
    targetUnits,
    customOverride: override,
    effectiveTitle: override?.customTitle?.trim() || catalogEntry.title,
    effectiveDesc: override?.customDesc?.trim() || catalogEntry.desc,
    effectiveMission,
    effectiveAdvancedChallenge: override?.customChallenge?.trim() || baseChallenge,
    effectiveSpeedMultiplier: Math.max(
      0.6,
      Math.min(1.5, Number(override?.speedMultiplier) || 1),
    ),
    effectiveTimerBonusSeconds: Math.max(
      0,
      Math.min(60, Number(override?.timerBonusSeconds) || 0),
    ),
    effectiveShowControlHints: override?.showControlHints ?? true,
  };
}

/**
 * ดึงรายการเกมทั้งหมดในระบบแบบเชื่อมโยงฐานข้อมูลเดียว (38 เกมครบถ้วน ไม่มีการลบข้อมูล)
 */
export function getAllUnifiedGames(classroom = 'ป.4'): UnifiedGameRecord[] {
  return gamesCatalog
    .map((game) => getUnifiedGameRecord(game.id, classroom))
    .filter((item): item is UnifiedGameRecord => item !== null);
}

/**
 * ดึงเนื้อหาบทเรียนตามระดับชั้นของนักเรียนจากฐานข้อมูลเดียว
 */
export function getUnifiedLessonForClassroom(
  gameId: string,
  classroom = 'ป.4',
): { lesson: GameLesson; band: 'lower' | 'upper' | 'middle'; content: LessonBody } | null {
  const record = getUnifiedGameRecord(gameId, classroom);
  if (!record?.lesson) return null;
  const band: 'lower' | 'upper' | 'middle' =
    classroom.startsWith('ม.')
      ? 'middle'
      : classroom === 'ป.1' || classroom === 'ป.2' || classroom === 'ป.3'
        ? 'lower'
        : 'upper';
  return {
    lesson: record.lesson,
    band,
    content: record.lesson[band],
  };
}

/**
 * สรุปภาพรวมการเชื่อมโยงฐานข้อมูลเกมทั้งหมด (สำหรับการตรวจสอบความสมบูรณ์ของข้อมูล)
 */
export function getUnifiedRegistryIntegrityReport(classroom = 'ป.4') {
  const all = getAllUnifiedGames(classroom);
  const byPillar: Record<CtPillar, number> = {
    decomposition: 0,
    pattern: 0,
    abstraction: 0,
    algorithm: 0,
  };
  all.forEach((g) => {
    byPillar[g.ctPillar.id] = (byPillar[g.ctPillar.id] || 0) + 1;
  });

  return {
    totalGames: all.length,
    withLesson: all.filter((g) => Boolean(g.lesson)).length,
    withMission: all.filter((g) => Boolean(g.mission)).length,
    withChallenge: all.filter((g) => Boolean(g.advancedChallenge)).length,
    withTargetUnits: all.filter((g) => g.targetUnits.length > 0).length,
    customizedCount: all.filter((g) => Boolean(g.customOverride)).length,
    pillarsCoverage: byPillar,
    ctPillarsCatalogCount: Object.values(CT_PILLARS).reduce(
      (sum, p) => sum + p.gameIds.length,
      0,
    ),
  };
}
