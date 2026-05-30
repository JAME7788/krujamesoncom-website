// ระบบปฏิทินกิจกรรม — ครูสร้างกำหนดส่งงาน, สอบ, กิจกรรมพิเศษ

export type EventType = 'homework' | 'exam' | 'activity' | 'holiday' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  desc?: string;
  type: EventType;
  date: string;     // 'YYYY-MM-DD'
  time?: string;    // 'HH:MM' (optional)
  classroom?: string; // '' = ทุกห้อง
  emoji?: string;
  url?: string;     // ลิงก์ไปหน้าเรียน/แบบทดสอบ
  createdAt: number;
}

const KEY = 'krujames_calendar_v1';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const loadEvents = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

const save = (list: CalendarEvent[]) => {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
};

export const createEvent = (data: Omit<CalendarEvent, 'id' | 'createdAt'>): CalendarEvent => {
  const e: CalendarEvent = { ...data, id: uid(), createdAt: Date.now() };
  const list = loadEvents();
  list.push(e);
  save(list);
  return e;
};

export const deleteEvent = (id: string) => {
  save(loadEvents().filter((e) => e.id !== id));
};

export const updateEvent = (id: string, patch: Partial<CalendarEvent>) => {
  const list = loadEvents();
  const i = list.findIndex((e) => e.id === id);
  if (i === -1) return;
  list[i] = { ...list[i], ...patch };
  save(list);
};

/** event ที่ใกล้จะถึง (7 วัน) */
export const getUpcomingEvents = (classroom?: string, days = 14): CalendarEvent[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + days);

  return loadEvents()
    .filter((e) => {
      const d = new Date(e.date);
      return d >= today && d <= end;
    })
    .filter((e) => !e.classroom || !classroom || e.classroom === classroom)
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const eventTypeInfo: Record<EventType, { label: string; emoji: string; color: string }> = {
  homework: { label: 'การบ้าน', emoji: '📝', color: '#3b82f6' },
  exam:     { label: 'สอบ',     emoji: '📋', color: '#ef4444' },
  activity: { label: 'กิจกรรม',  emoji: '🎉', color: '#22c55e' },
  holiday:  { label: 'วันหยุด',  emoji: '🌴', color: '#f59e0b' },
  meeting:  { label: 'ประชุม',  emoji: '👥', color: '#8b5cf6' },
};
