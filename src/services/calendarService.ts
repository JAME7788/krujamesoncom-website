// ปฏิทินกลาง: Firestore เป็นข้อมูลจริงและ localStorage เป็น cache
import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export type EventType = 'homework' | 'exam' | 'activity' | 'holiday' | 'meeting';

export interface CalendarEvent {
  id: string;
  title: string;
  desc?: string;
  type: EventType;
  date: string;
  time?: string;
  classroom?: string;
  emoji?: string;
  url?: string;
  createdAt: number;
}

const KEY = 'krujames_calendar_v1';
const COLLECTION = 'events';
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const loadEvents = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) as CalendarEvent[] : [];
  } catch { return []; }
};

const cache = (events: CalendarEvent[]) => localStorage.setItem(KEY, JSON.stringify(events));
const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const fetchEventsFromFirebase = async (): Promise<CalendarEvent[]> => {
  try {
    const snap = await getDocs(collection(db, COLLECTION));
    const remote = snap.docs.map((item) => item.data() as CalendarEvent);
    if (remote.length > 0) {
      const sorted = remote.sort((a, b) => a.date.localeCompare(b.date));
      cache(sorted);
      return sorted;
    }
    const local = loadEvents();
    await Promise.all(local.map((item) => setDoc(doc(db, COLLECTION, item.id), clean(item))));
    return local;
  } catch (error) {
    console.warn('fetch calendar failed, using local cache', error);
    return loadEvents();
  }
};

export const createEvent = async (
  data: Omit<CalendarEvent, 'id' | 'createdAt'>,
): Promise<CalendarEvent> => {
  const event: CalendarEvent = { ...data, id: uid(), createdAt: Date.now() };
  await setDoc(doc(db, COLLECTION, event.id), clean(event));
  cache([...loadEvents(), event]);
  return event;
};

export const deleteEvent = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, COLLECTION, id));
  cache(loadEvents().filter((event) => event.id !== id));
};

export const updateEvent = async (id: string, patch: Partial<CalendarEvent>): Promise<void> => {
  const list = loadEvents();
  const index = list.findIndex((event) => event.id === id);
  if (index === -1) return;
  const updated = { ...list[index], ...patch };
  await setDoc(doc(db, COLLECTION, id), clean(updated));
  list[index] = updated;
  cache(list);
};

export const getUpcomingEvents = (classroom?: string, days = 14): CalendarEvent[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(today);
  end.setDate(end.getDate() + days);
  return loadEvents()
    .filter((event) => {
      const date = new Date(event.date);
      return date >= today && date <= end;
    })
    .filter((event) => !event.classroom || !classroom || event.classroom === classroom)
    .sort((a, b) => a.date.localeCompare(b.date));
};

export const eventTypeInfo: Record<EventType, { label: string; emoji: string; color: string }> = {
  homework: { label: 'การบ้าน', emoji: '📝', color: '#3b82f6' },
  exam: { label: 'สอบ', emoji: '📋', color: '#ef4444' },
  activity: { label: 'กิจกรรม', emoji: '🎉', color: '#22c55e' },
  holiday: { label: 'วันหยุด', emoji: '🌴', color: '#f59e0b' },
  meeting: { label: 'ประชุม', emoji: '👥', color: '#8b5cf6' },
};
