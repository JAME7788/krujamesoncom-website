import { getSummary } from './progressService';
import { loadStudentReflections } from './gameReflectionService';

export type CtPillar = 'decomposition' | 'pattern' | 'abstraction' | 'algorithm';

export interface CtPillarInfo {
  id: CtPillar;
  name: string;
  nameEn: string;
  emoji: string;
  color: string;
  description: string;
  gameIds: string[];
}

export const CT_PILLARS: Record<CtPillar, CtPillarInfo> = {
  decomposition: {
    id: 'decomposition',
    name: 'การแยกย่อยปัญหา',
    nameEn: 'Decomposition',
    emoji: '🧩',
    color: '#0284c7', // Sky blue
    description: 'แตกปัญหาใหญ่ที่ซับซ้อนออกเป็นส่วนย่อยๆ เพื่อให้จัดการและแก้ไขได้ง่ายขึ้น',
    gameIds: ['pc-builder', 'robot-maker', 'step-sort', 'tech-system', 'device-match', 'circuit-lab', 'file-organizer', 'quick-answer'],
  },
  pattern: {
    id: 'pattern',
    name: 'การหารูปแบบ',
    nameEn: 'Pattern Recognition',
    emoji: '🔍',
    color: '#8b5cf6', // Purple
    description: 'สังเกตความเหมือน ความต่าง แนวโน้ม และกฎเกณฑ์ที่ซ่อนอยู่ในข้อมูลหรือปัญหา',
    gameIds: ['pattern', 'color-code-pixel', 'pixel-art', 'logic-gates', 'memory', 'sorting-dash', 'bug', 'stroop-color'],
  },
  abstraction: {
    id: 'abstraction',
    name: 'การคิดเชิงนามธรรม',
    nameEn: 'Abstraction',
    emoji: '💡',
    color: '#f59e0b', // Amber
    description: 'คัดกรองเฉพาะข้อมูลสำคัญที่เป็นแก่นแท้ และตัดรายละเอียดที่ไม่จำเป็นออกไป',
    gameIds: ['binary', 'safety', 'search-smart', 'ct-board', 'tycoon', 'digital-city-quest', 'cyber-shield', 'cyber-cop'],
  },
  algorithm: {
    id: 'algorithm',
    name: 'การออกแบบอัลกอริทึม',
    nameEn: 'Algorithm Design',
    emoji: '⚡',
    color: '#10b981', // Emerald green
    description: 'วางลำดับขั้นตอนและเงื่อนไขที่ชัดเจน เพื่อนำไปใช้แก้ปัญหาได้อย่างถูกต้องแม่นยำ',
    gameIds: ['algorithm-runner-3d', 'coding-studio', 'maze', 'snake', 'flowchart-bingo', 'obstacle-dodge', 'bomb-collector', 'space-treasure', 'cyber-racer', 'mouse', 'keyboard', 'situation-reaction', 'algorithm'],
  },
};

/** ค้นหาเสาหลักวิทยาการคำนวณจาก ID ของเกม */
export const getPillarForGameId = (gameId: string): CtPillarInfo => {
  const gId = gameId.toLowerCase();
  for (const pillar of Object.values(CT_PILLARS)) {
    if (pillar.gameIds.some((id) => id.toLowerCase() === gId || gId.includes(id.toLowerCase()))) {
      return pillar;
    }
  }
  return CT_PILLARS.algorithm;
};

export interface CtStudentProfile {
  studentId: string;
  pillars: Record<CtPillar, {
    score: number; // 0 - 100
    level: string; // ผู้เริ่มต้น, กำลังพัฒนา, คล่องแคล่ว, เชี่ยวชาญ
    completedGames: string[];
    reflectionCount: number;
  }>;
  overallScore: number;
  strongestPillar: CtPillar;
  recommendedPillar: CtPillar;
  recommendedGameId: string;
}

const getLevelTitle = (score: number): string => {
  if (score >= 75) return 'เชี่ยวชาญ';
  if (score >= 50) return 'คล่องแคล่ว';
  if (score >= 25) return 'กำลังพัฒนา';
  return 'ผู้เริ่มต้น';
};

/**
 * คำนวณโปรไฟล์ทักษะการคิดเชิงคำนวณ 4 เสาหลัก (Computational Thinking 4 Pillars)
 * จากประวัติการเล่นเกม (Progress) และการสะท้อนคิด (Reflections) ของนักเรียน
 */
export const calculateStudentCtProfile = (studentId: string, classroom: string): CtStudentProfile => {
  const summary = studentId ? getSummary(studentId, classroom) : null;
  const reflections = studentId ? loadStudentReflections(studentId) : [];

  const completedActivities = new Set(
    (summary?.recentActivities || [])
      .filter((a) => a.type === 'fun' || a.type === 'practice')
      .map((a) => (a.detail || `${a.gradeId}_${a.unitNo}`).toLowerCase())
  );

  const reflectionGameIds = new Set(reflections.map((r) => r.gameId.toLowerCase()));

  const pillarsResult = {} as CtStudentProfile['pillars'];
  let minScore = 999;
  let maxScore = -1;
  let recommendedPillarKey: CtPillar = 'algorithm';
  let strongestPillarKey: CtPillar = 'decomposition';
  let totalScoreSum = 0;

  (Object.keys(CT_PILLARS) as CtPillar[]).forEach((pillarKey) => {
    const pillar = CT_PILLARS[pillarKey];
    const totalGames = pillar.gameIds.length;
    
    // นับจำนวนเกมที่เล่นแล้ว หรือมีบันทึกสะท้อนคิด
    let playedCount = 0;
    const completedList: string[] = [];
    let pillarReflections = 0;

    pillar.gameIds.forEach((gameId) => {
      const gLower = gameId.toLowerCase();
      const hasPlayed = completedActivities.has(gLower) ||
        Array.from(completedActivities).some((act) => act.includes(gLower));
      const hasReflected = reflectionGameIds.has(gLower);

      if (hasReflected) {
        pillarReflections += reflections.filter((r) => r.gameId.toLowerCase() === gLower).length;
      }

      if (hasPlayed || hasReflected) {
        playedCount++;
        completedList.push(gameId);
      }
    });

    // คำนวณคะแนน (เล่นเกม = 60%, มีการสะท้อนคิด = 40%)
    const playRatio = totalGames > 0 ? (playedCount / totalGames) : 0;
    const reflectRatio = totalGames > 0 ? Math.min(1, pillarReflections / (Math.ceil(totalGames * 0.5))) : 0;
    
    // ฐานคะแนนเริ่มต้น 10 เพื่อไม่ให้เป็น 0 แห้งๆ สำหรับผู้เรียนใหม่
    const calculatedScore = Math.min(100, Math.round(10 + (playRatio * 55) + (reflectRatio * 35)));

    pillarsResult[pillarKey] = {
      score: calculatedScore,
      level: getLevelTitle(calculatedScore),
      completedGames: completedList,
      reflectionCount: pillarReflections,
    };

    totalScoreSum += calculatedScore;

    if (calculatedScore > maxScore) {
      maxScore = calculatedScore;
      strongestPillarKey = pillarKey;
    }
    if (calculatedScore < minScore) {
      minScore = calculatedScore;
      recommendedPillarKey = pillarKey;
    }
  });

  // ค้นหาเกมในเสาหลักที่ยังไม่ได้เล่น เพื่อแนะนำนักเรียน
  const recPillarGames = CT_PILLARS[recommendedPillarKey].gameIds;
  const unplayed = recPillarGames.find(g => !pillarsResult[recommendedPillarKey].completedGames.includes(g));
  const recommendedGameId = unplayed || recPillarGames[0];

  return {
    studentId,
    pillars: pillarsResult,
    overallScore: Math.round(totalScoreSum / 4),
    strongestPillar: strongestPillarKey,
    recommendedPillar: recommendedPillarKey,
    recommendedGameId,
  };
};
