// ตารางสอนวิชาเทคโนโลยี/วิทยาการคำนวณ และวิชาที่รับผิดชอบทั้งหมด
// แก้ไขผ่านหน้า Admin ได้ — เก็บใน localStorage

import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { isSchoolTeachingDate, isoDateInBangkok } from './schoolCalendar2569';

export interface ClassSlot {
  id: string;
  classroom: string; // 'ป.1', 'ม.2'
  day: number;       // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  start: string;     // 'HH:MM' 24h
  end: string;       // 'HH:MM'
  subject?: string;
  /** true = แสดงในตารางเฉยๆ ไม่นับเข้าคะแนน (A score, attendance ของวิชาเทคโนโลยีหลัก) */
  excludeFromGrading?: boolean;
}

export interface TimetablePeriodDef {
  period: number;
  label: string;
  start: string;
  end: string;
}

export const TIMETABLE_PERIODS: TimetablePeriodDef[] = [
  { period: 1, label: 'คาบที่ 1', start: '08:30', end: '09:20' },
  { period: 2, label: 'คาบที่ 2', start: '09:20', end: '10:10' },
  { period: 3, label: 'คาบที่ 3', start: '10:10', end: '11:00' },
  { period: 4, label: 'คาบที่ 4', start: '11:00', end: '11:50' },
  { period: 5, label: 'คาบที่ 5', start: '13:00', end: '13:50' },
  { period: 6, label: 'คาบที่ 6', start: '13:50', end: '14:40' },
  { period: 7, label: 'คาบที่ 7', start: '14:40', end: '15:30' },
];

export const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const dayNamesShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// ตารางสอนจริงปีการศึกษา 2569 ครูอนันตชัย เพ็ชรรี่ — ตรงตามตารางสอนทางการที่โรงเรียนออกให้ทุกคาบ
//
// เวลาแต่ละคาบ: 1=08:30-09:20  2=09:20-10:10  3=10:10-11:00  4=11:00-11:50
//               พักกลางวัน 11:50-13:00
//               5=13:00-13:50  6=13:50-14:40  7=14:40-15:30
//
// excludeFromGrading = แสดงในตารางสอนและใช้กดเช็คชื่อรายคาบได้ แต่ไม่นับเป็นคาบวิชาเทคโนโลยี/วิทยาการคำนวณหลัก
export const defaultSchedule: ClassSlot[] = [
  // ---------- วันจันทร์ ----------
  { id: 's-mon-1', classroom: 'ป.1', day: 1, start: '08:30', end: '09:20', subject: 'เทคโนโลยี 1' },
  { id: 's-mon-2', classroom: 'ป.5', day: 1, start: '09:20', end: '10:10', subject: 'วิทยาศาสตร์ สิ่งแวดล้อม 5', excludeFromGrading: true },
  { id: 's-mon-4', classroom: 'ป.6', day: 1, start: '11:00', end: '11:50', subject: 'วิทยาศาสตร์ สิ่งแวดล้อม 6', excludeFromGrading: true },
  { id: 's-mon-5', classroom: 'ม.1', day: 1, start: '13:00', end: '13:50', subject: '⭐ กิจกรรมแนะแนว (ครูที่ปรึกษา)', excludeFromGrading: true },
  { id: 's-mon-6', classroom: 'ม.3', day: 1, start: '13:50', end: '14:40', subject: 'การออกแบบและเทคโนโลยี' },

  // ---------- วันอังคาร ----------
  { id: 's-tue-2', classroom: 'ป.6', day: 2, start: '09:20', end: '10:10', subject: 'วิทยาศาสตร์ สิ่งแวดล้อม 6', excludeFromGrading: true },
  { id: 's-tue-5', classroom: 'ป.1', day: 2, start: '13:00', end: '13:50', subject: 'กิจกรรมตามความสนใจ', excludeFromGrading: true },
  { id: 's-tue-6', classroom: 'ม.2', day: 2, start: '13:50', end: '14:40', subject: 'ทักษะอาชีพ 2 (IS)', excludeFromGrading: true },
  { id: 's-tue-7', classroom: 'ม.2', day: 2, start: '14:40', end: '15:30', subject: 'ทักษะอาชีพ 2 (IS)', excludeFromGrading: true },

  // ---------- วันพุธ ----------
  { id: 's-wed-1', classroom: 'ม.1', day: 3, start: '08:30', end: '09:20', subject: 'ทักษะอาชีพ 1 (IS)', excludeFromGrading: true },
  { id: 's-wed-2', classroom: 'ม.1', day: 3, start: '09:20', end: '10:10', subject: 'ทักษะอาชีพ 1 (IS)', excludeFromGrading: true },
  { id: 's-wed-3', classroom: 'ป.5', day: 3, start: '10:10', end: '11:00', subject: 'เทคโนโลยี 5' },
  { id: 's-wed-4', classroom: 'ป.6', day: 3, start: '11:00', end: '11:50', subject: 'วิทยาศาสตร์ สิ่งแวดล้อม 6', excludeFromGrading: true },
  { id: 's-wed-7', classroom: 'ม.1', day: 3, start: '14:40', end: '15:30', subject: '⭐ ลูกเสือ/เนตรนารี', excludeFromGrading: true },

  // ---------- วันพฤหัสบดี ----------
  { id: 's-thu-2', classroom: 'ป.5', day: 4, start: '09:20', end: '10:10', subject: 'วิทยาศาสตร์ สิ่งแวดล้อม 5', excludeFromGrading: true },
  { id: 's-thu-3', classroom: 'ม.2', day: 4, start: '10:10', end: '11:00', subject: 'การออกแบบและเทคโนโลยี' },
  { id: 's-thu-4', classroom: 'ป.3', day: 4, start: '11:00', end: '11:50', subject: 'เทคโนโลยี 3' },
  { id: 's-thu-5', classroom: 'ป.4', day: 4, start: '13:00', end: '13:50', subject: 'เทคโนโลยี 4' },
  { id: 's-thu-6', classroom: 'ม.1', day: 4, start: '13:50', end: '14:40', subject: 'การออกแบบและเทคโนโลยี' },
  { id: 's-thu-7', classroom: 'ม.2', day: 4, start: '14:40', end: '15:30', subject: '⭐ ชุมนุม', excludeFromGrading: true },

  // ---------- วันศุกร์ ----------
  { id: 's-fri-2', classroom: 'ป.5', day: 5, start: '09:20', end: '10:10', subject: 'วิทยาศาสตร์ สิ่งแวดล้อม 5', excludeFromGrading: true },
  { id: 's-fri-3', classroom: 'ป.6', day: 5, start: '10:10', end: '11:00', subject: 'เทคโนโลยี 6' },
  { id: 's-fri-4', classroom: 'ป.2', day: 5, start: '11:00', end: '11:50', subject: 'เทคโนโลยี 2' },
  { id: 's-fri-5', classroom: 'ม.1', day: 5, start: '13:00', end: '13:50', subject: '⭐ ตลาดนัดอาชีพ (ครูที่ปรึกษา)', excludeFromGrading: true },
  { id: 's-fri-6', classroom: 'ม.2', day: 5, start: '13:50', end: '14:40', subject: '⭐ ตลาดนัดอาชีพ (ครูที่ปรึกษา)', excludeFromGrading: true },
  { id: 's-fri-7', classroom: 'ม.1', day: 5, start: '14:40', end: '15:30', subject: '⭐ สวดมนต์', excludeFromGrading: true },
];

/** คาบที่นับเข้าคะแนนของห้องนั้น (วิชาเทคโนโลยี/วิทยาการคำนวณ/การออกแบบและเทคโนโลยี) */
export const gradedSlotOf = (
  classroom: string,
  slots: ClassSlot[] = defaultSchedule,
): ClassSlot | undefined => slots.find(
  (slot) => slot.classroom === classroom && !slot.excludeFromGrading,
);

const KEY = 'krujames_schedule_v2';
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
  if (!isSchoolTeachingDate(isoDateInBangkok(d))) return false;
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
  if (!isSchoolTeachingDate(isoDateInBangkok())) return [];
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
  if (!isSchoolTeachingDate(isoDateInBangkok(at))) return undefined;
  const currentMinutes = at.getHours() * 60 + at.getMinutes();
  const slots = schedule
    .filter((slot) => slot.day === at.getDay() && !slot.excludeFromGrading)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start));
  return slots.find((slot) => (
    currentMinutes >= minutesOf(slot.start) && currentMinutes <= minutesOf(slot.end)
  )) || slots.find((slot) => minutesOf(slot.start) > currentMinutes) || slots[0];
};
