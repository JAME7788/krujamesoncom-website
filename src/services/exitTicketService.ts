import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { db } from './firebase';
import type { Subject } from './gradeService';
import { syncStudentGradesFromProgress } from './gameProgressService';
import { getCourseAccessSettings } from './courseAccessService';
import { recordLearningEvidence } from './learningEvidenceService';
import { isNonScoringUserId } from './userAccessService';

export type ExitMood = 'great' | 'good' | 'confused' | 'tired';

export interface ExitTicket {
  id: string;
  studentId: string;
  studentName: string;
  classroom: string;
  studentNumber: string;
  subject: Subject;
  unitId?: string;
  unitTitle?: string;
  date: string; // YYYY-MM-DD
  mood: ExitMood;
  learnedKeyword: string;
  questions?: string;
  selfScore: number; // 1-5
  earnedScoreA: number; // 1-3
  timestamp: number;
}

export interface ExitTicketSummary {
  total: number;
  averageStars: number;
  moodCounts: Record<ExitMood, number>;
  topLearned: { keyword: string; count: number }[];
  questions: {
    studentName: string;
    studentNumber: string;
    text: string;
    mood: ExitMood;
  }[];
}

const COLLECTION = 'exitTickets';
const LOCAL_KEY = 'krujames_exit_tickets_v1';
const MAX_LOCAL_RECORDS = 500;

export const MOOD_LABELS: Record<ExitMood, { emoji: string; label: string; color: string }> = {
  great: { emoji: '😄', label: 'สนุกและเข้าใจมาก', color: '#10b981' },
  good: { emoji: '🙂', label: 'เข้าใจดี ทำได้', color: '#3b82f6' },
  confused: { emoji: '🤔', label: 'ยังมีจุดที่งงๆ', color: '#f59e0b' },
  tired: { emoji: '😴', label: 'คาบนี้เหนื่อยจัง', color: '#8b5cf6' },
};

const firebaseAvailable = () => {
  try {
    return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID);
  } catch {
    return false;
  }
};

export const getTodayDateString = (dateObj: Date = new Date()): string => {
  const y = dateObj.getFullYear();
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const d = String(dateObj.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const loadLocalExitTickets = (): ExitTicket[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as ExitTicket[]) : [];
  } catch {
    return [];
  }
};

const cacheLocalExitTickets = (items: ExitTicket[]) => {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items.slice(0, MAX_LOCAL_RECORDS)));
  } catch {
    // Local cache error ignore
  }
};

export const hasStudentSubmittedToday = (
  studentId: string,
  dateStr: string = getTodayDateString(),
): boolean => {
  const local = loadLocalExitTickets();
  return local.some((t) => t.studentId === studentId && t.date === dateStr);
};

export const submitExitTicket = async (
  input: Omit<ExitTicket, 'id' | 'timestamp' | 'earnedScoreA'>,
): Promise<ExitTicket> => {
  if (isNonScoringUserId(input.studentId)) {
    throw new Error('ผู้ใช้ชั่วคราวไม่สามารถส่ง Exit Ticket บันทึกเกรดได้');
  }

  const timestamp = Date.now();
  const id = `${input.studentId}_${input.date}_${input.subject}`.replace(/[^a-zA-Z0-9ก-๙_-]+/g, '-');
  
  // Calculate A score (1-3) based on self evaluation & reflection effort
  const earnedScoreA = input.selfScore >= 4 ? 3 : input.selfScore >= 3 ? 2 : 1;

  const ticket: ExitTicket = {
    ...input,
    id,
    earnedScoreA,
    timestamp,
  };

  // 1. Save local
  const local = loadLocalExitTickets();
  const nextLocal = [ticket, ...local.filter((t) => t.id !== id)];
  cacheLocalExitTickets(nextLocal);

  // 2. Save Firebase if available
  if (firebaseAvailable()) {
    try {
      await setDoc(doc(db, COLLECTION, id), ticket, { merge: true });
    } catch (err) {
      console.warn('Firebase setDoc exitTicket error:', err);
    }
  }

  // 3. Record Learning Evidence for domain 'A' (Attitude)
  try {
    const moodMeta = MOOD_LABELS[ticket.mood];
    await recordLearningEvidence({
      studentId: ticket.studentId,
      studentName: ticket.studentName,
      classroom: ticket.classroom,
      subject: ticket.subject,
      source: 'exit-ticket',
      domain: 'A',
      title: 'ตั๋วบอกลาคาบเรียน (Exit Ticket)',
      detail: `${moodMeta.emoji} ${moodMeta.label} • เข้าใจ: "${ticket.learnedKeyword}" • สมาธิ: ${ticket.selfScore}/5 ดาว`,
      score: earnedScoreA,
      maxScore: 3,
      inClass: true,
      occurredAt: timestamp,
      dedupKey: `exit-ticket_${ticket.date}_${ticket.subject}`,
    });

    // 4. Sync student grade
    const accessSettings = getCourseAccessSettings();
    await syncStudentGradesFromProgress(
      {
        id: ticket.studentId,
        name: ticket.studentName,
        classroom: ticket.classroom,
        studentNumber: ticket.studentNumber,
      },
      accessSettings,
    );
  } catch (err) {
    console.warn('Evidence recording error:', err);
  }

  return ticket;
};

export const fetchExitTickets = async (
  classroom: string,
  dateStr?: string,
): Promise<ExitTicket[]> => {
  const local = loadLocalExitTickets();
  const filterFn = (t: ExitTicket) =>
    t.classroom === classroom && (!dateStr || t.date === dateStr);

  if (!firebaseAvailable()) {
    return local.filter(filterFn);
  }

  try {
    let q = query(collection(db, COLLECTION), where('classroom', '==', classroom));
    if (dateStr) {
      q = query(collection(db, COLLECTION), where('classroom', '==', classroom), where('date', '==', dateStr));
    }
    const snapshot = await getDocs(q);
    const remote = snapshot.docs
      .map((d) => d.data() as ExitTicket)
      .sort((a, b) => b.timestamp - a.timestamp);

    // Merge remote with other local
    const otherLocal = local.filter((t) => t.classroom !== classroom);
    cacheLocalExitTickets([...remote, ...otherLocal]);

    return remote;
  } catch (err) {
    console.warn('fetchExitTickets remote failed, using local', err);
    return local.filter(filterFn);
  }
};

export const getExitTicketSummary = (tickets: ExitTicket[]): ExitTicketSummary => {
  if (tickets.length === 0) {
    return {
      total: 0,
      averageStars: 0,
      moodCounts: { great: 0, good: 0, confused: 0, tired: 0 },
      topLearned: [],
      questions: [],
    };
  }

  const moodCounts: Record<ExitMood, number> = {
    great: 0,
    good: 0,
    confused: 0,
    tired: 0,
  };

  let starSum = 0;
  const keywordMap = new Map<string, number>();
  const questions: ExitTicketSummary['questions'] = [];

  tickets.forEach((t) => {
    if (moodCounts[t.mood] !== undefined) {
      moodCounts[t.mood]++;
    }
    starSum += t.selfScore;

    if (t.learnedKeyword.trim()) {
      const kw = t.learnedKeyword.trim();
      keywordMap.set(kw, (keywordMap.get(kw) || 0) + 1);
    }

    if (t.questions && t.questions.trim()) {
      questions.push({
        studentName: t.studentName,
        studentNumber: t.studentNumber,
        text: t.questions.trim(),
        mood: t.mood,
      });
    }
  });

  const topLearned = Array.from(keywordMap.entries())
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    total: tickets.length,
    averageStars: Number((starSum / tickets.length).toFixed(1)),
    moodCounts,
    topLearned,
    questions,
  };
};

export const formatExitTicketNarrative = (summary: ExitTicketSummary): {
  summaryAddition: string;
  reflectionNote: string;
  problemsAddition: string;
} => {
  if (summary.total === 0) {
    return {
      summaryAddition: '',
      reflectionNote: 'ยังไม่มีข้อมูล Exit Ticket จากผู้เรียนในคาบนี้',
      problemsAddition: '',
    };
  }

  const moodTexts: string[] = [];
  if (summary.moodCounts.great > 0) moodTexts.push(`สนุกมาก ${summary.moodCounts.great} คน`);
  if (summary.moodCounts.good > 0) moodTexts.push(`เข้าใจดี ${summary.moodCounts.good} คน`);
  if (summary.moodCounts.confused > 0) moodTexts.push(`ยังมีจุดสงสัย ${summary.moodCounts.confused} คน`);
  if (summary.moodCounts.tired > 0) moodTexts.push(`เหนื่อยล้า ${summary.moodCounts.tired} คน`);

  const topTopics = summary.topLearned.map((t) => `"${t.keyword}" (${t.count} คน)`).join(', ');

  const summaryAddition = ` ด้านการสะท้อนคิดของผู้เรียน (Exit Ticket) มีนักเรียนส่งตั๋วบอกลาคาบเรียน ${summary.total} คน ประเมินตนเองเฉลี่ย ${summary.averageStars}/5 ดาว บรรยากาศการเรียนรู้ส่วนใหญ่: ${moodTexts.join(' ')}${topTopics ? ` โดยเนื้อหาที่ผู้เรียนระบุว่าเข้าใจได้ชัดเจนที่สุด ได้แก่ ${topTopics}` : ''}`;

  const problemsAddition = summary.questions.length > 0
    ? `จากการสะท้อนคิดท้ายคาบ มีข้อสงสัย/คำถามจากนักเรียน ${summary.questions.length} รายการ (เช่น ${summary.questions.slice(0, 2).map((q) => `เลขที่ ${q.studentNumber}: "${q.text}"`).join('; ')}) ซึ่งครูจะนำไปตอบข้อสงสัยและทบทวนในช่วงต้นของคาบถัดไป`
    : (summary.moodCounts.confused > 0 ? `มีผู้เรียนสะท้อนว่ายังมีจุดสงสัย ${summary.moodCounts.confused} คน ครูจัดให้มีการทบทวนและจับคู่เพื่อนช่วยเรียนในคาบถัดไป` : '');

  return {
    summaryAddition,
    reflectionNote: `ส่งแล้ว ${summary.total} คน • สมาธิเฉลี่ย ${summary.averageStars} ดาว`,
    problemsAddition,
  };
};
