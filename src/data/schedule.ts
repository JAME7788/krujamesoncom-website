// ตารางสอนวิชาเทคโนโลยี/วิทยาการคำนวณ
// แก้ไขผ่านหน้า Admin ได้ — เก็บใน localStorage

import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface ClassSlot {
  id: string;
  classroom: string; // 'ป.1', 'ม.2'
  day: number;       // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  start: string;     // 'HH:MM' 24h
  end: string;       // 'HH:MM'
  subject?: string;
  /** true = แสดงในตารางเฉยๆ ไม่นับเข้าคะแนน (A score, attendance) */
  excludeFromGrading?: boolean;
}

export const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const dayNamesShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// ตารางเริ่มต้น — แก้ในหน้า Admin ได้
// ตารางจริงปีการศึกษา 2569 ครูเจมส์
// คาบ CS หลัก (วิทยาการคำนวณ/เทคโนโลยี) — นับเข้า A score
// ทักษะอาชีพ ม.1 (อังคารคาบ 6-7) — แสดงในตารางแต่ไม่นับ A score
export const defaultSchedule: ClassSlot[] = [
  // จันทร์
  { id: 's-mon-1',  classroom: 'ม.1', day: 1, start: '08:30', end: '09:20', subject: 'วิทยาการคำนวณ' },
  { id: 's-mon-6',  classroom: 'ป.2', day: 1, start: '13:50', end: '14:40', subject: 'เทคโนโลยี' },
  // อังคาร — ทักษะอาชีพ ม.1 (2 คาบติด) — design/marketing/Canva, แสดงเฉยๆ
  { id: 's-tue-6',  classroom: 'ม.1', day: 2, start: '13:50', end: '14:40', subject: 'ทักษะอาชีพ', excludeFromGrading: true },
  { id: 's-tue-7',  classroom: 'ม.1', day: 2, start: '14:40', end: '15:30', subject: 'ทักษะอาชีพ', excludeFromGrading: true },
  // พุธ
  { id: 's-wed-2',  classroom: 'ป.4', day: 3, start: '09:20', end: '10:10', subject: 'เทคโนโลยี' },
  { id: 's-wed-6',  classroom: 'ป.5', day: 3, start: '13:50', end: '14:40', subject: 'เทคโนโลยี' },
  // พฤหัสบดี
  { id: 's-thu-2',  classroom: 'ม.3', day: 4, start: '09:20', end: '10:10', subject: 'วิทยาการคำนวณ' },
  { id: 's-thu-4',  classroom: 'ป.6', day: 4, start: '11:00', end: '11:50', subject: 'เทคโนโลยี' },
  // ป.1 เคยลงผิดเป็นพุธเช้า ทำให้งานทั้งห้องถูกนับเป็น "นอกคาบ" 100%
  // ผล: P เหลือ 40% และ A ขาดไป 4 คะแนน — ครูยืนยันคาบจริงคือพฤหัสบดีบ่าย
  { id: 's-wed-1',  classroom: 'ป.1', day: 4, start: '13:00', end: '14:00', subject: 'เทคโนโลยี' },
  // ศุกร์
  { id: 's-fri-3',  classroom: 'ม.2', day: 5, start: '10:10', end: '11:00', subject: 'วิทยาการคำนวณ' },
  { id: 's-fri-4',  classroom: 'ป.3', day: 5, start: '11:00', end: '11:50', subject: 'เทคโนโลยี' },
];

const KEY = 'krujames_schedule_v1';
const SCHEDULE_DOC = 'main';

const firebaseAvailable = (): boolean => {
  try {
    return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  } catch {
    return false;
  }
};

export const loadSchedule = (): ClassSlot[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSchedule;
    return JSON.parse(raw);
  } catch {
    return defaultSchedule;
  }
};

export const saveSchedule = (slots: ClassSlot[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(slots));
    // sync ขึ้น Firebase อัตโนมัติ (best-effort) — เครื่องอื่นจะได้เห็นทันที
    void syncScheduleToFirebase(slots);
  } catch (e) {
    console.warn('saveSchedule failed', e);
  }
};

export const syncScheduleToFirebase = async (
  slots: ClassSlot[]
): Promise<{ ok: boolean; error?: string }> => {
  if (!firebaseAvailable()) {
    return { ok: false, error: 'Firebase is not configured' };
  }
  try {
    const ref = doc(db, 'schedule', SCHEDULE_DOC);
    await setDoc(ref, { slots, updatedAt: Date.now() });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.warn('syncScheduleToFirebase failed', e);
    return { ok: false, error };
  }
};

export const fetchScheduleFromFirebase = async (): Promise<ClassSlot[] | null> => {
  if (!firebaseAvailable()) return null;
  try {
    const ref = doc(db, 'schedule', SCHEDULE_DOC);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data() as { slots?: ClassSlot[] };
      if (data && Array.isArray(data.slots)) {
        localStorage.setItem(KEY, JSON.stringify(data.slots));
        return data.slots;
      }
    }
  } catch (e) {
    console.warn('fetchScheduleFromFirebase failed', e);
  }
  return null;
};


/** แปลงเวลา 'HH:MM' เป็นนาทีตั้งแต่เที่ยงคืน */
export const minutesOf = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

/** เช็คว่า timestamp (ms) อยู่ในช่วงคาบเรียนของห้องนี้ไหม */
export const isInClassTime = (
  timestamp: number,
  classroom: string,
  schedule: ClassSlot[]
): boolean => {
  const d = new Date(timestamp);
  const day = d.getDay();
  const minutes = d.getHours() * 60 + d.getMinutes();
  return schedule.some(
    (s) =>
      s.classroom === classroom &&
      s.day === day &&
      !s.excludeFromGrading &&            // ข้ามคาบที่ไม่เกี่ยวกับ CS (เช่น ทักษะอาชีพ กิจกรรมความสนใจ)
      minutes >= minutesOf(s.start) &&
      minutes <= minutesOf(s.end)
  );
};

/** ดึงคาบเรียนของวันนี้ (เรียงตามเวลา) */
export const todaySlots = (schedule: ClassSlot[]): ClassSlot[] => {
  const day = new Date().getDay();
  return schedule
    .filter((s) => s.day === day)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
};

/** คาบที่กำลังสอน หรือคาบถัดไปของวัน โดยไม่นำคาบที่แยกออกจากการวัดผลมาเปิดในศูนย์คาบเรียน */
export const currentOrNextTeachingSlot = (
  schedule: ClassSlot[],
  at = new Date(),
): ClassSlot | undefined => {
  const currentMinutes = at.getHours() * 60 + at.getMinutes();
  const slots = schedule
    .filter((slot) => slot.day === at.getDay() && !slot.excludeFromGrading)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
  return slots.find((slot) => (
    currentMinutes >= minutesOf(slot.start) && currentMinutes <= minutesOf(slot.end)
  )) || slots.find((slot) => minutesOf(slot.start) > currentMinutes) || slots[0];
};
