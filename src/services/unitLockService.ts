import { isAdminAuthed } from './authAdmin';

const KEY = 'krujames_unlocked_units_v1';

export const getUnlockedUnits = (): Record<string, number[]> => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export const saveUnlockedUnits = (data: Record<string, number[]>) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('saveUnlockedUnits failed', e);
  }
};

export const isUnitLocked = (gradeId: string, unitNo: number): boolean => {
  // ครู (Admin) เข้าได้เสมอ
  if (isAdminAuthed()) return false;
  
  // หน่วยที่ 1 เปิดให้เข้าได้ตลอดเวลาอยู่แล้ว
  if (unitNo === 1) return false;
  
  const unlocked = getUnlockedUnits();
  const list = unlocked[gradeId] || [];
  return !list.includes(unitNo);
};

export const toggleUnitLock = (gradeId: string, unitNo: number, unlock: boolean) => {
  const unlocked = getUnlockedUnits();
  if (!unlocked[gradeId]) unlocked[gradeId] = [];
  
  if (unlock) {
    if (!unlocked[gradeId].includes(unitNo)) {
      unlocked[gradeId].push(unitNo);
    }
  } else {
    unlocked[gradeId] = unlocked[gradeId].filter((no) => no !== unitNo);
  }
  saveUnlockedUnits(unlocked);
};
