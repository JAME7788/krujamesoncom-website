// เช็คชื่อแบบ Manual — ครูคลิก "มา/ขาด/ลา" ต่อคน ต่อวัน
// เก็บ Firebase attendance/{date}_{classroom}
// คนที่ "มา" จะได้ XP โบนัสเล็กน้อย → recordDailyActivity ผ่าน awardBonus

import { db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { awardBonus, fetchStudentProgress } from './progressService';

export type AttendanceStatus = 'present' | 'absent' | 'sick';

export interface ManualAttendance {
  date: string;          // YYYY-MM-DD
  classroom: string;
  records: Record<string, AttendanceStatus>;  // studentCode → status
  updatedAt: number;
}

export const ATTENDANCE_LABEL: Record<AttendanceStatus, { th: string; emoji: string; color: string; xp: number }> = {
  present: { th: 'มาเรียน', emoji: '✅', color: '#22c55e', xp: 5 },
  absent:  { th: 'ขาด',     emoji: '❌', color: '#ef4444', xp: 0 },
  sick:    { th: 'ลาป่วย',  emoji: '🤒', color: '#9ca3af', xp: 0 },
};

const fbAvailable = (): boolean => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const docId = (date: string, classroom: string) => `${date}_${classroom}`;
const LOCAL_KEY = (date: string, classroom: string) => `krujames_attendance_${docId(date, classroom)}`;

type LegacyAttendanceData = Omit<Partial<ManualAttendance>, 'records'> & {
  records?: Record<string, string>;
};

const normalizeAttendance = (
  data: LegacyAttendanceData,
  date: string,
  classroom: string,
): ManualAttendance => ({
  date,
  classroom,
  records: Object.fromEntries(
    Object.entries(data.records || {}).map(([studentCode, status]) => [
      studentCode,
      status === 'late' || status === 'present'
        ? 'present'
        : status === 'sick' ? 'sick' : 'absent',
    ]),
  ) as Record<string, AttendanceStatus>,
  updatedAt: Number(data.updatedAt) || 0,
});

export const todayDateKey = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const loadAttendance = (date: string, classroom: string): ManualAttendance => {
  const empty: ManualAttendance = { date, classroom, records: {}, updatedAt: 0 };
  try {
    const raw = localStorage.getItem(LOCAL_KEY(date, classroom));
    if (!raw) return empty;
    return normalizeAttendance(JSON.parse(raw) as LegacyAttendanceData, date, classroom);
  } catch { return empty; }
};

export const fetchAttendance = async (date: string, classroom: string): Promise<ManualAttendance> => {
  const local = loadAttendance(date, classroom);
  if (!fbAvailable()) return local;
  try {
    const ref = doc(db, 'attendance', docId(date, classroom));
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = normalizeAttendance(
        { ...local, ...(snap.data() as LegacyAttendanceData) },
        date,
        classroom,
      );
      try { localStorage.setItem(LOCAL_KEY(date, classroom), JSON.stringify(data)); } catch { /* ignore */ }
      return data;
    }
  } catch (e) {
    console.debug('attendance fetch failed', e);
  }
  return local;
};

const syncToFirebase = async (data: ManualAttendance) => {
  if (!fbAvailable()) throw new Error('Firebase ยังไม่ได้ตั้งค่า');
  await setDoc(doc(db, 'attendance', docId(data.date, data.classroom)), data, { merge: true });
};

const saveLocal = (data: ManualAttendance) => {
  try { localStorage.setItem(LOCAL_KEY(data.date, data.classroom), JSON.stringify(data)); } catch { /* ignore */ }
};

/** ตั้งสถานะคนๆ หนึ่ง + แจก XP โบนัสตามสถานะ (ผ่าน awardBonus → progress + streak) */
export const setStatus = async (
  date: string,
  classroom: string,
  studentCode: string,
  studentId: string,
  status: AttendanceStatus,
): Promise<void> => {
  const data = await fetchAttendance(date, classroom);
  const prev = data.records[studentCode];
  data.records = { ...data.records, [studentCode]: status };
  data.updatedAt = Date.now();
  await syncToFirebase(data);
  saveLocal(data);

  // ถ้าเปลี่ยนจาก absent/sick → present ให้ XP แต่ครั้งเดียวต่อวัน
  const info = ATTENDANCE_LABEL[status];
  if (info.xp > 0 && prev !== status) {
    try {
      await fetchStudentProgress(studentId);
      const stored = await awardBonus(studentId, {
        emoji: info.emoji,
        reason: `[Attend:${date}] ${info.th}`,
        xp: info.xp,
      });
      if (!stored) throw new Error('บันทึก XP เข้า Firebase ไม่สำเร็จ');
    } catch (e) {
      console.warn('attendance bonus failed', e);
    }
  }
};

/** เซ็ตทุกคนเป็น "มาเรียน" — ปุ่ม "ทุกคนมา" ในห้อง */
export const markAllPresent = async (
  date: string, classroom: string,
  students: { studentCode: string; studentId: string }[],
): Promise<void> => {
  for (const s of students) {
    await setStatus(date, classroom, s.studentCode, s.studentId, 'present');
  }
};
