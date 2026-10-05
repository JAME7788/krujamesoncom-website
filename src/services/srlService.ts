// 🎯 Self-Regulated Learning (SRL) Service
// วงจรการกำกับตนเองของผู้เรียน: วางแผน (Plan) ➔ ปฏิบัติ/ตรวจสอบ (Monitor) ➔ สะท้อนคิด (Reflect)
// บันทึกลง LocalStorage ปลอดภัย ไม่แตะต้องข้อมูลคะแนนเด็ก (Non-destructive)

import { loadLocalExitTickets } from './exitTicketService';
import { loadLocalExamAttempts } from './examService';
import { loadStudentReflections } from './gameReflectionService';

export interface WeeklyGoalDefinition {
  id: string;
  title: string;
  description: string;
  targetCount: number;
  unit: string;
  icon: string;
  xpReward: number;
}

export const weeklyGoalPresets: WeeklyGoalDefinition[] = [
  {
    id: 'learn_slides',
    title: 'อ่านสไลด์บทเรียนใหม่',
    description: 'ศึกษาและเปิดอ่านสไลด์บทเรียนอย่างน้อย 1 หน่วย',
    targetCount: 1,
    unit: 'หน่วย',
    icon: '📖',
    xpReward: 30,
  },
  {
    id: 'play_games',
    title: 'พิชิตเกมฝึกทักษะ 2 ภารกิจ',
    description: 'ฝึกฝนทักษะการคิดเชิงคำนวณผ่านเกม 2 ครั้ง',
    targetCount: 2,
    unit: 'เกม',
    icon: '🎮',
    xpReward: 40,
  },
  {
    id: 'take_exam',
    title: 'ทำข้อสอบมาตรฐาน ว 4.2',
    description: 'ทำแบบทดสอบมาตรฐานประจำชั้นเรียน 1 ชุด',
    targetCount: 1,
    unit: 'ชุด',
    icon: '✍️',
    xpReward: 50,
  },
  {
    id: 'exit_ticket',
    title: 'ส่งตั๋วบอกลาคาบเรียน (Exit Ticket)',
    description: 'สะท้อนคิดท้ายคาบเพื่อรับคะแนนจิตพิสัย',
    targetCount: 1,
    unit: 'ครั้ง',
    icon: '🎫',
    xpReward: 25,
  },
];

export interface StudentWeeklyGoalRecord {
  studentId: string;
  weekKey: string; // e.g. "2026-W40"
  goalId: string;
  achieved: boolean;
  achievedAt?: number;
  reflectionText?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'kj_srl_weekly_goals_v1';
const inMemoryStore: StudentWeeklyGoalRecord[] = [];

/** คำนวณรหัสสัปดาห์ปัจจุบัน (e.g. 2026-W40) */
export const getCurrentWeekKey = (): string => {
  const d = new Date();
  const dNum = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = dNum.getUTCDay() || 7;
  dNum.setUTCDate(dNum.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(dNum.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((dNum.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${dNum.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

/** โหลดรายการเป้าหมายทั้งหมด */
export const loadAllWeeklyGoals = (): StudentWeeklyGoalRecord[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }
    return [...inMemoryStore];
  } catch {
    return [...inMemoryStore];
  }
};

/** บันทึกเป้าหมาย */
export const saveStudentWeeklyGoal = (record: StudentWeeklyGoalRecord): void => {
  try {
    const all = loadAllWeeklyGoals();
    const idx = all.findIndex((g) => g.studentId === record.studentId && g.weekKey === record.weekKey);
    if (idx >= 0) all[idx] = record;
    else all.unshift(record);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, 500)));
    } else {
      inMemoryStore.length = 0;
      inMemoryStore.push(...all.slice(0, 500));
    }
  } catch (e) {
    console.warn('saveStudentWeeklyGoal warning:', e);
  }
};

/** ดึงเป้าหมายสัปดาห์นี้ของนักเรียน (ถ้ายังไม่มี ให้ค่าเริ่มต้น preset แรก) */
export const getActiveWeeklyGoal = (studentId: string): {
  goal: WeeklyGoalDefinition;
  record: StudentWeeklyGoalRecord;
  currentCount: number;
  progressPct: number;
  achieved: boolean;
} => {
  const weekKey = getCurrentWeekKey();
  const all = loadAllWeeklyGoals();
  let record = all.find((g) => g.studentId === studentId && g.weekKey === weekKey);

  if (!record) {
    record = {
      studentId,
      weekKey,
      goalId: 'play_games', // ค่าเริ่มต้น: เล่นเกม 2 ภารกิจ
      achieved: false,
      updatedAt: Date.now(),
    };
    saveStudentWeeklyGoal(record);
  }

  const def = weeklyGoalPresets.find((p) => p.id === record?.goalId) || weeklyGoalPresets[1];

  // คำนวณความคืบหน้า (Monitoring)
  let currentCount = 0;
  if (def.id === 'play_games') {
    const reflections = loadStudentReflections(studentId);
    currentCount = reflections.length;
  } else if (def.id === 'take_exam') {
    const exams = loadLocalExamAttempts(studentId);
    currentCount = exams.length;
  } else if (def.id === 'exit_ticket') {
    const tickets = loadLocalExitTickets().filter((t) => t.studentId === studentId);
    currentCount = tickets.length;
  } else {
    // learn_slides หรือกิจกรรมทั่วไป
    currentCount = 1;
  }

  const progressPct = Math.min(100, Math.round((currentCount / def.targetCount) * 100));
  const isAchieved = progressPct >= 100 || record.achieved;

  if (isAchieved && !record.achieved) {
    record.achieved = true;
    record.achievedAt = Date.now();
    saveStudentWeeklyGoal(record);
  }

  return {
    goal: def,
    record,
    currentCount,
    progressPct,
    achieved: isAchieved,
  };
};

/** เปลี่ยนเป้าหมายประจำสัปดาห์ (Plan) */
export const changeWeeklyGoal = (studentId: string, goalId: string): void => {
  const weekKey = getCurrentWeekKey();
  const record: StudentWeeklyGoalRecord = {
    studentId,
    weekKey,
    goalId,
    achieved: false,
    updatedAt: Date.now(),
  };
  saveStudentWeeklyGoal(record);
};

/** บันทึกการสะท้อนคิดหลังบรรลุเป้าหมาย (Reflect) */
export const recordGoalReflection = (studentId: string, reflectionText: string): void => {
  const weekKey = getCurrentWeekKey();
  const all = loadAllWeeklyGoals();
  let target = all.find((g) => g.studentId === studentId && g.weekKey === weekKey);
  if (!target) {
    target = {
      studentId,
      weekKey,
      goalId: 'play_games',
      achieved: true,
      updatedAt: Date.now(),
    };
  }
  target.reflectionText = reflectionText;
  target.updatedAt = Date.now();
  saveStudentWeeklyGoal(target);
};
