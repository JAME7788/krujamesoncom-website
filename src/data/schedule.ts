// ตารางสอนวิชาเทคโนโลยี/วิทยาการคำนวณ
// แก้ไขผ่านหน้า Admin ได้ — เก็บใน localStorage

export interface ClassSlot {
  id: string;
  classroom: string; // 'ป.1', 'ม.2'
  day: number;       // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  start: string;     // 'HH:MM' 24h
  end: string;       // 'HH:MM'
  subject?: string;
}

export const dayNames = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const dayNamesShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

// ตารางเริ่มต้น — แก้ในหน้า Admin ได้
export const defaultSchedule: ClassSlot[] = [
  { id: 's1', classroom: 'ป.1', day: 1, start: '08:30', end: '09:30', subject: 'เทคโนโลยี' },
  { id: 's2', classroom: 'ป.2', day: 1, start: '09:30', end: '10:30', subject: 'เทคโนโลยี' },
  { id: 's3', classroom: 'ป.3', day: 1, start: '10:30', end: '11:30', subject: 'เทคโนโลยี' },
  { id: 's4', classroom: 'ป.4', day: 2, start: '08:30', end: '09:30', subject: 'เทคโนโลยี' },
  { id: 's5', classroom: 'ป.5', day: 2, start: '09:30', end: '10:30', subject: 'เทคโนโลยี' },
  { id: 's6', classroom: 'ป.6', day: 2, start: '10:30', end: '11:30', subject: 'เทคโนโลยี' },
  { id: 's7', classroom: 'ม.1', day: 3, start: '13:00', end: '14:00', subject: 'วิทยาการคำนวณ' },
  { id: 's8', classroom: 'ม.2', day: 4, start: '13:00', end: '14:00', subject: 'วิทยาการคำนวณ' },
  { id: 's9', classroom: 'ม.3', day: 5, start: '13:00', end: '14:00', subject: 'วิทยาการคำนวณ' },
];

const KEY = 'krujames_schedule_v1';

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
  } catch (e) {
    console.warn('saveSchedule failed', e);
  }
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
