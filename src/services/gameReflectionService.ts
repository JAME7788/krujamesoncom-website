export interface GameReflectionRecord {
  id: string;
  studentId: string;
  studentCode: string;
  studentName: string;
  classroom: string;
  gameId: string;
  gameTitle: string;
  objective: string;
  challengeMode: boolean; // false = foundation, true = extension
  challengeText: string;
  questionAnswered: boolean;
  reflectionText: string;
  createdAt: number;
}

export type GameReflectionInput = Omit<GameReflectionRecord, 'id' | 'createdAt'>;

const STORAGE_KEY = 'kj_game_reflections_v1';
const FIRESTORE_COLLECTION = 'gameReflections';
let memoryFallback: GameReflectionRecord[] = [];

const getLocalReflections = (): GameReflectionRecord[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as GameReflectionRecord[];
    }
  } catch {
    // localStorage may be blocked in private browsing; use the in-memory copy.
  }
  return memoryFallback;
};

const saveLocalReflections = (records: GameReflectionRecord[]) => {
  memoryFallback = records;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    }
  } catch (e) {
    console.warn('Failed to save game reflections locally', e);
  }
};

/** บันทึกการสะท้อนคิดจากเกมการเรียนรู้ (Non-destructive: เขียนเพิ่มเท่านั้น ไม่แตะต้องคะแนนเดิม) */
export const saveGameReflection = async (input: GameReflectionInput): Promise<GameReflectionRecord> => {
  const newRecord: GameReflectionRecord = {
    ...input,
    id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: Date.now(),
  };

  // 1. บันทึกลง LocalStorage เสมอ (ทำงานได้แม้ไม่มีเน็ต)
  const current = getLocalReflections();
  // เก็บเฉพาะ 500 รายการล่าสุดในเครื่องเพื่อประหยัดหน่วยความจำ
  const updated = [newRecord, ...current].slice(0, 500);
  saveLocalReflections(updated);

  // 2. บันทึกลง Firestore หากเชื่อมต่อได้
  try {
    const isTest = (globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'test';
    if (typeof navigator !== 'undefined' && navigator.onLine && !isTest) {
      const [{ db }, { collection, addDoc }] = await Promise.all([
        import('./firebase'),
        import('firebase/firestore'),
      ]);
      await addDoc(collection(db, FIRESTORE_COLLECTION), newRecord);
    }
  } catch (error) {
    console.info('Saved game reflection to local cache (cloud sync pending)', error);
  }

  return newRecord;
};

/** โหลดบันทึกสะท้อนคิดของนักเรียนรายบุคคล */
export const loadStudentReflections = (studentIdOrCode: string): GameReflectionRecord[] => {
  const all = getLocalReflections();
  return all.filter((r) => r.studentId === studentIdOrCode || r.studentCode === studentIdOrCode);
};

/** โหลดบันทึกสะท้อนคิดตามห้องเรียน */
export const loadClassroomReflections = (classroom: string): GameReflectionRecord[] => {
  const all = getLocalReflections();
  if (classroom === 'all' || !classroom) return all;
  return all.filter((r) => r.classroom === classroom);
};

/** โหลดบันทึกสะท้อนคิดทั้งหมด */
export const loadAllReflections = (): GameReflectionRecord[] => {
  return getLocalReflections();
};

/** ดึงข้อมูลสถิติภาพรวมของการสะท้อนคิด (สำหรับงานวิจัย CAR และ แดชบอร์ดครู) */
export const getReflectionStats = (classroom?: string) => {
  const records = classroom ? loadClassroomReflections(classroom) : loadAllReflections();
  const totalCount = records.length;
  const challengeCount = records.filter((r) => r.challengeMode).length;
  const foundationCount = totalCount - challengeCount;
  
  const uniqueGames = new Set(records.map((r) => r.gameId));
  const uniqueStudents = new Set(records.map((r) => r.studentId || r.studentCode));

  return {
    totalCount,
    foundationCount,
    challengeCount,
    uniqueGamesCount: uniqueGames.size,
    uniqueStudentsCount: uniqueStudents.size,
    challengeRatio: totalCount > 0 ? Math.round((challengeCount / totalCount) * 100) : 0,
    records,
  };
};
