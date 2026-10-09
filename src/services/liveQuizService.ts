// Live Quiz — room state is public, answer keys stay only on the teacher device.
// Students send immutable join/answer requests; the authenticated teacher processes them.

import { db } from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

export interface LiveQuizQuestion {
  q: string;
  options: string[];
  /** Present only in the teacher's private copy. */
  answer?: number;
  timeLimit?: number;
  /** Present only in the teacher's private copy. */
  bankId?: string;
}

export interface LiveAnswer {
  choice: number;
  /** Hidden from students until reveal/finish. */
  correct?: boolean;
  time: number;
}

export interface LivePlayer {
  id: string;
  name: string;
  emoji: string;
  score: number;
  answers: Record<number, LiveAnswer>;
  joinedAt: number;
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
  revealedAnswer?: number;
  targetGradeId?: string;
  targetUnitNo?: number;
}

interface JoinRequest {
  code: string;
  studentId: string;
  name: string;
  emoji: string;
  requestedAt: number;
}

interface AnswerRequest {
  code: string;
  studentId: string;
  questionIndex: number;
  choice: number;
  answeredAt: number;
}

const KEY = (code: string) => `krujames_live_quiz_${code}`;
const SECRET_KEY = (code: string) => `krujames_live_quiz_secret_${code}`;
const fbAvailable = () => {
  try { return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID; } catch { return false; }
};

const cleanForFirestore = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const storeHostSecret = (room: LiveQuizRoom) => {
  try {
    sessionStorage.setItem(SECRET_KEY(room.code), JSON.stringify(room.questions.map((question) => ({
      answer: question.answer,
      bankId: question.bankId,
    }))));
  } catch (error) {
    console.warn('Unable to store Live Quiz answer key', error);
  }
};

const readHostSecret = (code: string): Array<{ answer?: number; bankId?: string }> => {
  try {
    const raw = sessionStorage.getItem(SECRET_KEY(code));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const toPublicLiveQuizRoom = (room: LiveQuizRoom): LiveQuizRoom => {
  const revealResults = room.state === 'reveal' || room.state === 'finished';
  const { revealedAnswer, ...roomWithoutReveal } = room;
  const players = Object.fromEntries(Object.entries(room.players).map(([id, player]) => [id, {
    ...player,
    score: revealResults ? player.score : 0,
    answers: Object.fromEntries(Object.entries(player.answers).map(([index, answer]) => [index, {
      choice: answer.choice,
      time: answer.time,
      ...(revealResults ? { correct: Boolean(answer.correct) } : {}),
    }])),
  }]));

  return cleanForFirestore({
    ...roomWithoutReveal,
    questions: room.questions.map(({ answer: _answer, bankId: _bankId, ...question }) => question),
    players,
    ...(room.state === 'reveal' && Number.isInteger(revealedAnswer)
      ? { revealedAnswer }
      : {}),
  });
};

const hydrateHostRoom = (publicRoom: LiveQuizRoom): LiveQuizRoom => {
  const secrets = readHostSecret(publicRoom.code);
  const questions = publicRoom.questions.map((question, index) => ({
    ...question,
    answer: secrets[index]?.answer,
    bankId: secrets[index]?.bankId,
  }));
  const players = Object.fromEntries(Object.entries(publicRoom.players).map(([id, player]) => {
    let score = 0;
    const answers = Object.fromEntries(Object.entries(player.answers).map(([rawIndex, answer]) => {
      const index = Number(rawIndex);
      const correct = answer.choice === secrets[index]?.answer;
      if (correct) score += Math.max(100, 1000 - Math.floor(answer.time / 10));
      return [rawIndex, { ...answer, correct }];
    }));
    return [id, { ...player, answers, score }];
  }));
  return { ...publicRoom, questions, players };
};

export const generateRoomCode = (): string => Math.floor(100000 + Math.random() * 900000).toString();

export const createRoom = async (
  data: Omit<LiveQuizRoom, 'state' | 'currentQuestion' | 'players' | 'createdAt'>,
): Promise<LiveQuizRoom> => {
  if (data.questions.some((question) => !Number.isInteger(question.answer))) {
    throw new Error('ทุกคำถามต้องกำหนดคำตอบที่ถูกต้อง');
  }
  const room: LiveQuizRoom = {
    ...data,
    state: 'lobby',
    currentQuestion: 0,
    players: {},
    createdAt: Date.now(),
  };
  storeHostSecret(room);
  await saveRoom(room);
  return room;
};

export const loadRoom = (code: string): LiveQuizRoom | null => {
  try {
    const raw = localStorage.getItem(KEY(code));
    return raw ? JSON.parse(raw) as LiveQuizRoom : null;
  } catch { return null; }
};

const channels: Record<string, BroadcastChannel> = {};
const getChannel = (code: string) => {
  if (!channels[code]) channels[code] = new BroadcastChannel(`live-quiz-${code}`);
  return channels[code];
};

const broadcastChange = (code: string) => {
  try { getChannel(code).postMessage({ type: 'update', ts: Date.now() }); } catch { /* optional */ }
};

export const saveRoom = async (room: LiveQuizRoom): Promise<void> => {
  localStorage.setItem(KEY(room.code), JSON.stringify(room));
  broadcastChange(room.code);
  if (!fbAvailable()) return;
  await setDoc(doc(db, 'liveQuizzes', room.code), toPublicLiveQuizRoom(room));
};

export const subscribeRoom = (
  code: string,
  cb: (room: LiveQuizRoom | null) => void,
  options: { host?: boolean } = {},
): (() => void) => {
  const present = (room: LiveQuizRoom | null) => cb(room && options.host ? hydrateHostRoom(room) : room);
  const channel = getChannel(code);
  const handler = () => present(loadRoom(code));
  channel.addEventListener('message', handler);

  let unsubFb: (() => void) | null = null;
  if (fbAvailable()) {
    unsubFb = onSnapshot(doc(db, 'liveQuizzes', code), (snapshot) => {
      if (!snapshot.exists()) {
        present(null);
        return;
      }
      const publicRoom = snapshot.data() as LiveQuizRoom;
      localStorage.setItem(KEY(code), JSON.stringify(publicRoom));
      present(publicRoom);
    });
  }

  present(loadRoom(code));
  const interval = window.setInterval(() => present(loadRoom(code)), 2000);
  return () => {
    channel.removeEventListener('message', handler);
    unsubFb?.();
    window.clearInterval(interval);
  };
};

export const joinRoom = async (
  code: string,
  player: Omit<LivePlayer, 'score' | 'answers' | 'joinedAt'>,
): Promise<boolean> => {
  if (fbAvailable()) {
    const roomSnapshot = await getDoc(doc(db, 'liveQuizzes', code));
    if (!roomSnapshot.exists() || roomSnapshot.data().state !== 'lobby') return false;
    const request: JoinRequest = {
      code,
      studentId: player.id,
      name: player.name,
      emoji: player.emoji,
      requestedAt: Date.now(),
    };
    await setDoc(doc(db, 'liveQuizJoinRequests', `${code}_${player.id}`), request);
    return true;
  }

  const room = loadRoom(code);
  if (!room || room.state !== 'lobby') return false;
  room.players[player.id] = { ...player, score: 0, answers: {}, joinedAt: Date.now() };
  await saveRoom(room);
  return true;
};

export const submitAnswer = async (
  code: string,
  playerId: string,
  choice: number,
): Promise<boolean> => {
  const room = loadRoom(code);
  if (!room || room.state !== 'question' || room.players[playerId]?.answers[room.currentQuestion]) return false;
  if (!Number.isInteger(choice) || choice < 0 || choice >= (room.questions[room.currentQuestion]?.options.length || 0)) return false;

  if (fbAvailable()) {
    const request: AnswerRequest = {
      code,
      studentId: playerId,
      questionIndex: room.currentQuestion,
      choice,
      answeredAt: Date.now(),
    };
    await setDoc(doc(db, 'liveQuizAnswerRequests', `${code}_${room.currentQuestion}_${playerId}`), request);
    return true;
  }

  const player = room.players[playerId];
  const question = room.questions[room.currentQuestion];
  if (!player || !Number.isInteger(question.answer)) return false;
  const time = Date.now() - (room.questionStartedAt || Date.now());
  const correct = choice === question.answer;
  player.answers[room.currentQuestion] = { choice, correct, time };
  if (correct) player.score += Math.max(100, 1000 - Math.floor(time / 10));
  await saveRoom(room);
  return true;
};

export const subscribeHostRequests = (code: string): (() => void) => {
  if (!fbAvailable()) return () => undefined;
  let processing = Promise.resolve();
  const enqueue = (task: () => Promise<void>) => { processing = processing.then(task).catch(console.warn); };

  const joinQuery = query(collection(db, 'liveQuizJoinRequests'), where('code', '==', code));
  const answerQuery = query(collection(db, 'liveQuizAnswerRequests'), where('code', '==', code));

  const unsubscribeJoins = onSnapshot(joinQuery, (snapshot) => {
    snapshot.docChanges().filter((change) => change.type === 'added').forEach((change) => enqueue(async () => {
      const request = change.doc.data() as JoinRequest;
      const remote = await getDoc(doc(db, 'liveQuizzes', code));
      const source = loadRoom(code) || (remote.exists() ? remote.data() as LiveQuizRoom : null);
      if (source) {
        const room = hydrateHostRoom(source);
        if (room.state === 'lobby' && !room.players[request.studentId]) {
          room.players[request.studentId] = {
            id: request.studentId,
            name: request.name,
            emoji: request.emoji || '🧑‍🎓',
            score: 0,
            answers: {},
            joinedAt: request.requestedAt,
          };
          await saveRoom(room);
        }
      }
      await deleteDoc(change.doc.ref);
    }));
  });

  const unsubscribeAnswers = onSnapshot(answerQuery, (snapshot) => {
    snapshot.docChanges().filter((change) => change.type === 'added').forEach((change) => enqueue(async () => {
      const request = change.doc.data() as AnswerRequest;
      const remote = await getDoc(doc(db, 'liveQuizzes', code));
      const source = loadRoom(code) || (remote.exists() ? remote.data() as LiveQuizRoom : null);
      if (source) {
        const room = hydrateHostRoom(source);
        const player = room.players[request.studentId];
        const question = room.questions[request.questionIndex];
        if (
          room.state === 'question'
          && request.questionIndex === room.currentQuestion
          && player
          && question
          && !player.answers[request.questionIndex]
          && request.choice >= 0
          && request.choice < question.options.length
        ) {
          const time = Math.max(0, request.answeredAt - (room.questionStartedAt || request.answeredAt));
          const correct = request.choice === question.answer;
          player.answers[request.questionIndex] = { choice: request.choice, correct, time };
          if (correct) player.score += Math.max(100, 1000 - Math.floor(time / 10));
          await saveRoom(room);
        }
      }
      await deleteDoc(change.doc.ref);
    }));
  });

  return () => {
    unsubscribeJoins();
    unsubscribeAnswers();
  };
};

export const startQuiz = async (code: string): Promise<void> => {
  const source = loadRoom(code);
  if (!source) return;
  const room = hydrateHostRoom(source);
  room.state = 'question';
  room.currentQuestion = 0;
  room.startedAt = Date.now();
  room.questionStartedAt = Date.now();
  delete room.revealedAnswer;
  await saveRoom(room);
};

export const revealAnswer = async (code: string): Promise<void> => {
  const source = loadRoom(code);
  if (!source) return;
  const room = hydrateHostRoom(source);
  const answer = room.questions[room.currentQuestion]?.answer;
  if (!Number.isInteger(answer)) throw new Error('ไม่พบเฉลยของคำถามนี้ในเครื่องครู');
  room.state = 'reveal';
  room.revealedAnswer = answer;
  await saveRoom(room);
};

export const nextQuestion = async (code: string): Promise<void> => {
  const source = loadRoom(code);
  if (!source) return;
  const room = hydrateHostRoom(source);
  delete room.revealedAnswer;
  if (room.currentQuestion + 1 >= room.questions.length) {
    room.state = 'finished';
  } else {
    room.currentQuestion += 1;
    room.state = 'question';
    room.questionStartedAt = Date.now();
  }
  await saveRoom(room);
};

export const closeRoom = async (code: string): Promise<void> => {
  localStorage.removeItem(KEY(code));
  sessionStorage.removeItem(SECRET_KEY(code));
  if (fbAvailable()) await deleteDoc(doc(db, 'liveQuizzes', code));
};
