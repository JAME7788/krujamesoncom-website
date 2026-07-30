import { collection, deleteDoc, doc, getDocs, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Subject } from './gradeService';
import { writeAuditLog } from './auditLogService';

export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface QuestionBankItem {
  id: string;
  classroom: string;
  subject: Subject;
  indicatorId: string;
  indicatorCode: string;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  attempts: number;
  correct: number;
  status: 'draft' | 'published';
  createdAt: number;
  updatedAt: number;
}

const COLLECTION = 'questionBank';
const LOCAL_KEY = 'krujames_question_bank_v1';

const firebaseAvailable = () => {
  try { return Boolean(db && import.meta.env.VITE_FIREBASE_PROJECT_ID); } catch { return false; }
};

const clean = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export const loadQuestionBank = (): QuestionBankItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) as QuestionBankItem[] : [];
  } catch {
    return [];
  }
};

const cache = (items: QuestionBankItem[]) => {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(items)); } catch { /* optional */ }
};

export const fetchQuestionBank = async (): Promise<QuestionBankItem[]> => {
  if (!firebaseAvailable()) return loadQuestionBank();
  try {
    const snapshot = await getDocs(collection(db, COLLECTION));
    const items = snapshot.docs
      .map((item) => item.data() as QuestionBankItem)
      .sort((a, b) => b.updatedAt - a.updatedAt);
    cache(items);
    return items;
  } catch (error) {
    console.warn('fetch question bank failed, using local cache', error);
    return loadQuestionBank();
  }
};

export const saveQuestionBankItem = async (
  input: Omit<QuestionBankItem, 'id' | 'attempts' | 'correct' | 'createdAt' | 'updatedAt'> & {
    id?: string;
  },
): Promise<QuestionBankItem> => {
  const current = input.id
    ? loadQuestionBank().find((item) => item.id === input.id)
    : undefined;
  const now = Date.now();
  const id = input.id || `question_${now}_${Math.random().toString(36).slice(2, 8)}`;
  const item: QuestionBankItem = clean({
    ...input,
    id,
    attempts: current?.attempts || 0,
    correct: current?.correct || 0,
    createdAt: current?.createdAt || now,
    updatedAt: now,
  });
  cache([item, ...loadQuestionBank().filter((entry) => entry.id !== id)]);
  if (firebaseAvailable()) await setDoc(doc(db, COLLECTION, id), item, { merge: true });
  await writeAuditLog({
    action: current ? 'update' : 'create',
    entityType: 'question',
    entityId: id,
    classroom: item.classroom,
    subject: item.subject,
    summary: `${current ? 'แก้ไข' : 'สร้าง'}คำถาม ${item.indicatorCode}`,
    before: current,
    after: item,
  });
  return item;
};

export const deleteQuestionBankItem = async (id: string): Promise<void> => {
  const current = loadQuestionBank().find((item) => item.id === id);
  cache(loadQuestionBank().filter((item) => item.id !== id));
  if (firebaseAvailable()) await deleteDoc(doc(db, COLLECTION, id));
  if (current) {
    await writeAuditLog({
      action: 'delete',
      entityType: 'question',
      entityId: id,
      classroom: current.classroom,
      subject: current.subject,
      summary: `ลบคำถาม ${current.indicatorCode}`,
      before: current,
    });
  }
};

export const recordQuestionAnalysis = async (
  id: string,
  attempts: number,
  correct: number,
): Promise<void> => {
  const items = loadQuestionBank();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return;
  const updated = {
    ...items[index],
    attempts: items[index].attempts + Math.max(0, attempts),
    correct: items[index].correct + Math.max(0, correct),
    updatedAt: Date.now(),
  };
  items[index] = updated;
  cache(items);
  if (firebaseAvailable()) await setDoc(doc(db, COLLECTION, id), updated, { merge: true });
};

export const drawQuestionSet = (
  items: QuestionBankItem[],
  count = 10,
): QuestionBankItem[] => {
  const published = items.filter((item) => item.status === 'published');
  const pools = {
    easy: published.filter((item) => item.difficulty === 'easy'),
    medium: published.filter((item) => item.difficulty === 'medium'),
    hard: published.filter((item) => item.difficulty === 'hard'),
  };
  const shuffle = <T,>(values: T[]) => [...values].sort(() => Math.random() - 0.5);
  const target = {
    easy: Math.ceil(count * 0.4),
    medium: Math.ceil(count * 0.4),
    hard: Math.max(0, count - Math.ceil(count * 0.4) * 2),
  };
  const selected = [
    ...shuffle(pools.easy).slice(0, target.easy),
    ...shuffle(pools.medium).slice(0, target.medium),
    ...shuffle(pools.hard).slice(0, target.hard),
  ];
  const remaining = shuffle(published.filter((item) => !selected.includes(item)));
  return shuffle([...selected, ...remaining.slice(0, Math.max(0, count - selected.length))])
    .slice(0, count);
};
