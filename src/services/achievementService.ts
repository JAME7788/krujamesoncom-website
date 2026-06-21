// ระบบ Badges/Achievements — ปลดล็อกของรางวัลเมื่อทำเป้าหมาย
import { getSummary } from './progressService';

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  /** ตรวจสอบว่าปลดล็อกแล้วหรือยัง — รับ summary คืน boolean */
  check: (summary: ReturnType<typeof getSummary>) => boolean;
  /** ระดับความยาก: bronze < silver < gold < diamond */
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  /** หมวด */
  category: 'reading' | 'quiz' | 'activity' | 'streak' | 'special';
}

export const allAchievements: Achievement[] = [
  // === Reading ===
  {
    id: 'first-slide', emoji: '👶', tier: 'bronze', category: 'reading',
    title: 'นักเรียนใหม่', desc: 'อ่านสไลด์แรก',
    check: (s) => s.totalSlidesViewed >= 1,
  },
  {
    id: 'slides-10', emoji: '📖', tier: 'bronze', category: 'reading',
    title: 'หนอนหนังสือ', desc: 'อ่านสไลด์ครบ 10 หน้า',
    check: (s) => s.totalSlidesViewed >= 10,
  },
  {
    id: 'slides-50', emoji: '📚', tier: 'silver', category: 'reading',
    title: 'นักอ่านขยัน', desc: 'อ่านสไลด์ครบ 50 หน้า',
    check: (s) => s.totalSlidesViewed >= 50,
  },
  {
    id: 'slides-100', emoji: '🎓', tier: 'gold', category: 'reading',
    title: 'ปราชญ์น้อย', desc: 'อ่านสไลด์ครบ 100 หน้า',
    check: (s) => s.totalSlidesViewed >= 100,
  },
  {
    id: 'slides-500', emoji: '🏆', tier: 'diamond', category: 'reading',
    title: 'ตำนานนักอ่าน', desc: 'อ่านสไลด์ครบ 500 หน้า',
    check: (s) => s.totalSlidesViewed >= 500,
  },

  // === Quiz ===
  {
    id: 'first-quiz', emoji: '✅', tier: 'bronze', category: 'quiz',
    title: 'ทดสอบครั้งแรก', desc: 'ทำควิซครั้งแรกสำเร็จ',
    check: (s) => s.recentAttempts.length >= 1,
  },
  {
    id: 'quiz-perfect', emoji: '💯', tier: 'silver', category: 'quiz',
    title: 'คะแนนเต็ม', desc: 'ทำควิซได้ 100% สักครั้ง',
    check: (s) => s.recentAttempts.some((a) => a.percentage === 100),
  },
  {
    id: 'quiz-80avg', emoji: '🌟', tier: 'gold', category: 'quiz',
    title: 'นักเรียนระดับ A', desc: 'คะแนนเฉลี่ยเกิน 80%',
    check: (s) => s.averageScore >= 80,
  },
  {
    id: 'quiz-10', emoji: '🎯', tier: 'silver', category: 'quiz',
    title: 'นักทดสอบ', desc: 'ทำควิซครบ 10 ครั้ง',
    check: (s) => s.recentAttempts.length >= 10,
  },

  // === Activity ===
  {
    id: 'first-game', emoji: '🎮', tier: 'bronze', category: 'activity',
    title: 'นักเล่นเกม', desc: 'กดเล่นกิจกรรมแรก',
    check: (s) => s.totalActivities >= 1,
  },
  {
    id: 'activities-25', emoji: '🎪', tier: 'silver', category: 'activity',
    title: 'นักผจญภัย', desc: 'เล่นกิจกรรมครบ 25 รายการ',
    check: (s) => s.totalActivities >= 25,
  },
  {
    id: 'activities-100', emoji: '👑', tier: 'gold', category: 'activity',
    title: 'ราชาแห่งกิจกรรม', desc: 'เล่นกิจกรรมครบ 100 รายการ',
    check: (s) => s.totalActivities >= 100,
  },

  // === Streak / Completion ===
  {
    id: 'first-unit', emoji: '🌱', tier: 'bronze', category: 'streak',
    title: 'จบหน่วยแรก', desc: 'เรียนหน่วยแรกครบทุกอย่าง',
    check: (s) => s.unitsCompleted >= 1,
  },
  {
    id: 'units-5', emoji: '🌳', tier: 'silver', category: 'streak',
    title: 'นักเรียนตัวจริง', desc: 'เรียนจบ 5 หน่วย',
    check: (s) => s.unitsCompleted >= 5,
  },
  {
    id: 'units-10', emoji: '🏔️', tier: 'gold', category: 'streak',
    title: 'พิชิตยอดเขา', desc: 'เรียนจบ 10 หน่วย',
    check: (s) => s.unitsCompleted >= 10,
  },
  {
    id: 'units-all', emoji: '🌟', tier: 'diamond', category: 'streak',
    title: 'จบหลักสูตร!', desc: 'เรียนจบ 20+ หน่วย',
    check: (s) => s.unitsCompleted >= 20,
  },

  // === Special ===
  {
    id: 'pair-learner', emoji: '👯', tier: 'silver', category: 'special',
    title: 'เพื่อนเรียนคู่', desc: 'login โหมดนั่งคู่ครั้งแรก',
    check: () => !!localStorage.getItem('current_partner'),
  },
  {
    id: 'all-rounder', emoji: '⭐', tier: 'gold', category: 'special',
    title: 'รอบรู้ทุกด้าน', desc: 'มีคะแนนทุกหมวด (อ่าน + ควิซ + กิจกรรม)',
    check: (s) => s.totalSlidesViewed > 0 && s.recentAttempts.length > 0 && s.totalActivities > 0,
  },
];

export interface AchievementProgress {
  unlocked: string[];        // achievement ids
  notifications: string[];    // ids ที่เพิ่งปลดล็อก (ยังไม่ดู)
  unlockedAt: Record<string, number>; // timestamp
}

const KEY = (studentId: string) => `krujames_achievements_${studentId}`;

export const loadAchievements = (studentId: string): AchievementProgress => {
  try {
    const raw = localStorage.getItem(KEY(studentId));
    if (!raw) return { unlocked: [], notifications: [], unlockedAt: {} };
    return JSON.parse(raw);
  } catch {
    return { unlocked: [], notifications: [], unlockedAt: {} };
  }
};

const save = (studentId: string, data: AchievementProgress) => {
  try {
    localStorage.setItem(KEY(studentId), JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save achievements', e);
  }
};


/** ตรวจสอบ achievements ใหม่ — เรียกหลังทำกิจกรรม */
export const checkAchievements = (studentId: string): string[] => {
  if (!studentId) return [];
  const summary = getSummary(studentId);
  const data = loadAchievements(studentId);
  const newlyUnlocked: string[] = [];

  allAchievements.forEach((ach) => {
    if (data.unlocked.includes(ach.id)) return;
    if (ach.check(summary)) {
      data.unlocked.push(ach.id);
      data.notifications.push(ach.id);
      data.unlockedAt[ach.id] = Date.now();
      newlyUnlocked.push(ach.id);
    }
  });

  if (newlyUnlocked.length > 0) save(studentId, data);
  return newlyUnlocked;
};

/** ทำเครื่องหมายว่าดูแล้ว */
export const markSeen = (studentId: string) => {
  const data = loadAchievements(studentId);
  data.notifications = [];
  save(studentId, data);
};

/** สรุปสำหรับ Dashboard */
export const getAchievementStats = (studentId: string) => {
  const data = loadAchievements(studentId);
  const total = allAchievements.length;
  const unlockedCount = data.unlocked.length;
  const byTier = {
    bronze: data.unlocked.filter((id) => allAchievements.find((a) => a.id === id)?.tier === 'bronze').length,
    silver: data.unlocked.filter((id) => allAchievements.find((a) => a.id === id)?.tier === 'silver').length,
    gold: data.unlocked.filter((id) => allAchievements.find((a) => a.id === id)?.tier === 'gold').length,
    diamond: data.unlocked.filter((id) => allAchievements.find((a) => a.id === id)?.tier === 'diamond').length,
  };
  return {
    total,
    unlockedCount,
    percentage: Math.round((unlockedCount / total) * 100),
    byTier,
    pendingNotifications: data.notifications,
    achievements: allAchievements.map((a) => ({
      ...a,
      unlocked: data.unlocked.includes(a.id),
      unlockedAt: data.unlockedAt[a.id],
    })),
  };
};
