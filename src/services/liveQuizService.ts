// Live Quiz — Kahoot-style ใช้ BroadcastChannel + localStorage
// (ใช้ในเครื่องเดียวกัน / network เดียว ผ่าน Firebase ถ้ามี)

import { db } from './firebase';
import { doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';

export interface LiveQuizQuestion {
  q: string;
  options: string[];
  answer: number;
  timeLimit?: number; // วินาที
  bankId?: string;
}

export interface LiveQuizRoom {
  code: string;
  title: string;
  hostId: string;
  questions: LiveQuizQuestion[];
  state: 'lobby' | 'question' | 'reveal' | 'finished';
  currentQuestion: number;
  startedAt?: number;
  questionStartedAt?: number;
  players: Record<string, LivePlayer>;
  createdAt: number;
  /** ผูกคะแนน Quiz เข้ากับ unit ของหลักสูตร (optional). ถ้าไม่ระบุ default = unit 1 ของห้องนักเรียน */
  targetGradeId?: string;
  targetUnitNo?: number;
}

export interface LivePlayer {
  id: string;
  name: string;
  emoji: string;
  score: number;
  answers: Record<number, { choice: number; correct: boolean; time: number }>;
  joinedAt: number;
}

const KEY = (code: string) => `krujames_live_quiz_${code}`;
const fbAvailable = () => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

// สร้างรหัสห้อง 6 หลัก
export const generateRoomCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createRoom = async (data: Omit<LiveQuizRoom, 'state' | 'currentQuestion' | 'players' | 'createdAt'>): Promise<LiveQuizRoom> => {
  const room: LiveQuizRoom = {
    ...data,
    state: 'lobby',
    currentQuestion: 0,
    players: {},
    createdAt: Date.now(),
  };
  saveRoom(room);
  return room;
};

export const loadRoom = (code: string): LiveQuizRoom | null => {
  try {
    const raw = localStorage.getItem(KEY(code));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const saveRoom = (room: LiveQuizRoom) => {
  try {
    localStorage.setItem(KEY(room.code), JSON.stringify(room));
    syncFirebase(room);
    broadcastChange(room.code);
  } catch (e) { console.warn('saveRoom failed', e); }
};

const syncFirebase = async (room: LiveQuizRoom) => {
  if (!fbAvailable()) return;
  try {
    const ref = doc(db, 'liveQuizzes', room.code);
    await setDoc(ref, room, { merge: true });
  } catch { /* ignore Firebase sync errors */ }
};

// BroadcastChannel for same-origin tabs
const channels: Record<string, BroadcastChannel> = {};
const getChannel = (code: string) => {
  if (!channels[code]) channels[code] = new BroadcastChannel(`live-quiz-${code}`);
  return channels[code];
};
const broadcastChange = (code: string) => {
  try { getChannel(code).postMessage({ type: 'update', ts: Date.now() }); } catch { /* ignore BroadcastChannel errors */ }
};

export const subscribeRoom = (code: string, cb: (room: LiveQuizRoom | null) => void): (() => void) => {
  // Local channel
  const channel = getChannel(code);
  const handler = () => cb(loadRoom(code));
  channel.addEventListener('message', handler);

  // Firebase realtime
  let unsubFb: (() => void) | null = null;
  if (fbAvailable()) {
    try {
      const ref = doc(db, 'liveQuizzes', code);
      unsubFb = onSnapshot(ref, (snap) => {
        if (snap.exists()) {
          const room = snap.data() as LiveQuizRoom;
          localStorage.setItem(KEY(code), JSON.stringify(room));
          cb(room);
        }
      });
    } catch { /* ignore Firebase subscription errors */ }
  }

  // Initial load
  cb(loadRoom(code));

  // poll every 2s as fallback
  const interval = setInterval(() => cb(loadRoom(code)), 2000);

  return () => {
    channel.removeEventListener('message', handler);
    if (unsubFb) unsubFb();
    clearInterval(interval);
  };
};

export const joinRoom = (code: string, player: Omit<LivePlayer, 'score' | 'answers' | 'joinedAt'>): boolean => {
  const room = loadRoom(code);
  if (!room) return false;
  if (room.state !== 'lobby') return false;
  room.players[player.id] = {
    ...player,
    score: 0,
    answers: {},
    joinedAt: Date.now(),
  };
  saveRoom(room);
  return true;
};

export const startQuiz = (code: string) => {
  const room = loadRoom(code);
  if (!room) return;
  room.state = 'question';
  room.currentQuestion = 0;
  room.startedAt = Date.now();
  room.questionStartedAt = Date.now();
  saveRoom(room);
};

export const submitAnswer = (code: string, playerId: string, choice: number) => {
  const room = loadRoom(code);
  if (!room || room.state !== 'question') return;
  const player = room.players[playerId];
  if (!player) return;
  if (player.answers[room.currentQuestion]) return; // already answered

  const question = room.questions[room.currentQuestion];
  const correct = choice === question.answer;
  const time = Date.now() - (room.questionStartedAt || Date.now());
  const points = correct ? Math.max(100, 1000 - Math.floor(time / 10)) : 0;

  player.answers[room.currentQuestion] = { choice, correct, time };
  player.score += points;
  saveRoom(room);
};

export const revealAnswer = (code: string) => {
  const room = loadRoom(code);
  if (!room) return;
  room.state = 'reveal';
  saveRoom(room);
};

export const nextQuestion = (code: string) => {
  const room = loadRoom(code);
  if (!room) return;
  if (room.currentQuestion + 1 >= room.questions.length) {
    room.state = 'finished';
  } else {
    room.currentQuestion += 1;
    room.state = 'question';
    room.questionStartedAt = Date.now();
  }
  saveRoom(room);
};

export const closeRoom = async (code: string) => {
  localStorage.removeItem(KEY(code));
  if (fbAvailable()) {
    try {
      const ref = doc(db, 'liveQuizzes', code);
      await deleteDoc(ref);
    } catch { /* ignore Firebase cleanup errors */ }
  }
};
