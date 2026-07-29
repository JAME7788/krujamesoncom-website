import {
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  runTransaction,
  setDoc,
} from 'firebase/firestore';
import type { CTQuestion } from '../data/ctBoardGame';
import type { ChanceCard } from '../data/tycoonGame';
import { db } from './firebase';

export type TycoonRoomStatus = 'lobby' | 'playing' | 'finished';
export type TycoonRoomSyncMode = 'connecting' | 'firebase' | 'local';
export type TycoonGamePhase = 'roll' | 'question' | 'buy' | 'chance' | 'info' | 'over';

export interface TycoonRoomPlayer {
  id: string;
  name: string;
  characterId: string;
  ready: boolean;
  joinedAt: number;
  lastSeenAt: number;
}

export interface TycoonPlayerState {
  idx: number;
  name: string;
  characterId: string;
  pos: number;
  money: number;
  owned: number[];
  levels: Record<number, number>;
  skip: number;
  out: boolean;
  correct: number;
  answered: number;
}

export interface TycoonGameSnapshot {
  version: number;
  updatedBy: string;
  phase: TycoonGamePhase;
  players: TycoonPlayerState[];
  turn: number;
  dice: number | null;
  isRolling: boolean;
  question: CTQuestion | null;
  picked: number | null;
  chance: ChanceCard | null;
  message: string;
  buyTile: number | null;
  rentTile: number | null;
  rentOwner: number | null;
  pendingRent: number;
  upgradeTile: number | null;
  finishReason: string;
  endsAt: number;
  questionEndsAt: number;
}

export interface TycoonRoom {
  code: string;
  name: string;
  passwordHash: string;
  hostId: string;
  status: TycoonRoomStatus;
  minutes: 5 | 10 | 15;
  players: TycoonRoomPlayer[];
  game: TycoonGameSnapshot | null;
  createdAt: number;
  updatedAt: number;
}

export interface TycoonRoomResult {
  ok: boolean;
  room?: TycoonRoom;
  error?: string;
}

const COLLECTION = 'tycoonRooms';
const ROOM_PREFIX = 'kj_tycoon_room_';
const CHANNEL_PREFIX = 'kj-tycoon-room-';
const MAX_PLAYERS = 4;
let firestoreUnavailable = false;

const localKey = (code: string) => `${ROOM_PREFIX}${code}`;
const channelName = (code: string) => `${CHANNEL_PREFIX}${code}`;

const readLocalRoom = (code: string): TycoonRoom | null => {
  try {
    const raw = localStorage.getItem(localKey(code));
    return raw ? normalizeRoom(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

const writeLocalRoom = (room: TycoonRoom) => {
  try {
    localStorage.setItem(localKey(room.code), JSON.stringify(room));
  } catch {
    // The Firebase copy remains authoritative when local storage is unavailable.
  }
};

const emitRoom = (code: string) => {
  try {
    const channel = new BroadcastChannel(channelName(code));
    channel.postMessage({ type: 'changed', at: Date.now() });
    window.setTimeout(() => channel.close(), 0);
  } catch {
    // Same-device synchronization is optional when BroadcastChannel is unavailable.
  }
};

const normalizePlayer = (value: Partial<TycoonRoomPlayer>): TycoonRoomPlayer => ({
  id: String(value.id || '').slice(0, 300),
  name: String(value.name || 'ผู้เล่น').slice(0, 80),
  characterId: String(value.characterId || 'neo').slice(0, 40),
  ready: Boolean(value.ready),
  joinedAt: Number(value.joinedAt) || Date.now(),
  lastSeenAt: Number(value.lastSeenAt) || Date.now(),
});

const normalizeGame = (value: unknown): TycoonGameSnapshot | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const source = value as Partial<TycoonGameSnapshot>;
  if (!Array.isArray(source.players) || typeof source.phase !== 'string') return null;
  return {
    version: Number(source.version) || 0,
    updatedBy: String(source.updatedBy || ''),
    phase: source.phase,
    players: source.players.map((player) => ({
      ...player,
      characterId: String(player.characterId || 'neo'),
      owned: Array.isArray(player.owned) ? player.owned.map(Number) : [],
      levels: player.levels && typeof player.levels === 'object' ? player.levels : {},
    })),
    turn: Number(source.turn) || 0,
    dice: source.dice == null ? null : Number(source.dice),
    isRolling: Boolean(source.isRolling),
    question: source.question || null,
    picked: source.picked == null ? null : Number(source.picked),
    chance: source.chance || null,
    message: String(source.message || ''),
    buyTile: source.buyTile == null ? null : Number(source.buyTile),
    rentTile: source.rentTile == null ? null : Number(source.rentTile),
    rentOwner: source.rentOwner == null ? null : Number(source.rentOwner),
    pendingRent: Number(source.pendingRent) || 0,
    upgradeTile: source.upgradeTile == null ? null : Number(source.upgradeTile),
    finishReason: String(source.finishReason || ''),
    endsAt: Number(source.endsAt) || 0,
    questionEndsAt: Number(source.questionEndsAt) || 0,
  };
};

const normalizeRoom = (value: Partial<TycoonRoom>): TycoonRoom => ({
  code: String(value.code || '').replace(/\D/g, '').slice(0, 6),
  name: String(value.name || 'ห้องเกมวิทยาการคำนวณ').slice(0, 80),
  passwordHash: String(value.passwordHash || '').slice(0, 100),
  hostId: String(value.hostId || '').slice(0, 300),
  status: value.status === 'playing' || value.status === 'finished' ? value.status : 'lobby',
  minutes: value.minutes === 5 || value.minutes === 15 ? value.minutes : 10,
  players: Array.isArray(value.players)
    ? value.players.map(normalizePlayer).filter((player) => player.id).slice(0, MAX_PLAYERS)
    : [],
  game: normalizeGame(value.game),
  createdAt: Number(value.createdAt) || Date.now(),
  updatedAt: Number(value.updatedAt) || Date.now(),
});

const hashText = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(
    new Uint8Array(digest),
    (byte) => byte.toString(16).padStart(2, '0'),
  ).join('');
};

const passwordHash = (code: string, password: string) => (
  password.trim() ? hashText(`${code}:${password.trim()}`) : Promise.resolve('')
);

const cacheRoom = (room: TycoonRoom) => {
  writeLocalRoom(room);
  emitRoom(room.code);
  return room;
};

const fetchRoom = async (code: string): Promise<TycoonRoom | null> => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);
  if (!firestoreUnavailable) {
    try {
      const snapshot = await getDoc(doc(db, COLLECTION, cleanCode));
      if (snapshot.exists()) return cacheRoom(normalizeRoom(snapshot.data() as Partial<TycoonRoom>));
    } catch {
      firestoreUnavailable = true;
    }
  }
  return readLocalRoom(cleanCode);
};

export const generateTycoonRoomCode = () => (
  Math.floor(100000 + Math.random() * 900000).toString()
);

export const orderedTycoonRoomPlayers = (room: TycoonRoom) => (
  [...room.players].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
);

export const canStartTycoonRoom = (room: TycoonRoom) => {
  const players = orderedTycoonRoomPlayers(room);
  const characters = new Set(players.map((player) => player.characterId));
  return room.status === 'lobby'
    && players.length >= 2
    && players.length <= MAX_PLAYERS
    && players.every((player) => player.ready)
    && characters.size === players.length;
};

export const createTycoonRoom = async (input: {
  name: string;
  password: string;
  minutes: 5 | 10 | 15;
  host: Pick<TycoonRoomPlayer, 'id' | 'name' | 'characterId'>;
}): Promise<TycoonRoomResult> => {
  let code = generateTycoonRoomCode();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const existing = await fetchRoom(code);
    if (!existing) break;
    code = generateTycoonRoomCode();
  }
  const now = Date.now();
  const room = normalizeRoom({
    code,
    name: input.name.trim() || 'ห้องเกมวิทยาการคำนวณ',
    passwordHash: await passwordHash(code, input.password),
    hostId: input.host.id,
    status: 'lobby',
    minutes: input.minutes,
    players: [{
      ...input.host,
      ready: false,
      joinedAt: now,
      lastSeenAt: now,
    }],
    game: null,
    createdAt: now,
    updatedAt: now,
  });
  cacheRoom(room);
  if (!firestoreUnavailable) {
    try {
      await setDoc(doc(db, COLLECTION, code), room, { merge: false });
    } catch (error) {
      firestoreUnavailable = true;
      console.warn('Tycoon room saved locally only', error);
    }
  }
  return { ok: true, room };
};

export const joinTycoonRoom = async (
  code: string,
  password: string,
  player: Pick<TycoonRoomPlayer, 'id' | 'name' | 'characterId'>,
): Promise<TycoonRoomResult> => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);
  const current = await fetchRoom(cleanCode);
  if (!current) return { ok: false, error: 'ไม่พบห้อง กรุณาตรวจรหัส 6 หลัก' };
  if (current.status !== 'lobby') return { ok: false, error: 'ห้องนี้เริ่มเล่นแล้ว' };
  if (current.passwordHash !== await passwordHash(cleanCode, password)) {
    return { ok: false, error: 'รหัสผ่านห้องไม่ถูกต้อง' };
  }
  if (
    current.players.some(
      (member) => member.id !== player.id && member.characterId === player.characterId,
    )
  ) {
    return { ok: false, error: 'ตัวละครนี้มีเพื่อนเลือกแล้ว กรุณาเลือกตัวอื่น' };
  }

  const now = Date.now();
  const addPlayer = (room: TycoonRoom) => {
    const existing = room.players.find((member) => member.id === player.id);
    if (!existing && room.players.length >= MAX_PLAYERS) return room;
    const players = existing
      ? room.players.map((member) => (
        member.id === player.id
          ? { ...member, ...player, lastSeenAt: now }
          : member
      ))
      : [...room.players, {
        ...player,
        ready: false,
        joinedAt: now,
        lastSeenAt: now,
      }];
    return normalizeRoom({ ...room, players, updatedAt: now });
  };

  try {
    if (firestoreUnavailable) throw new Error('firebase-unavailable');
    const next = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, cleanCode);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('room-not-found');
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      if (room.status !== 'lobby') throw new Error('room-started');
      if (!room.players.some((member) => member.id === player.id) && room.players.length >= MAX_PLAYERS) {
        throw new Error('room-full');
      }
      if (room.players.some(
        (member) => member.id !== player.id && member.characterId === player.characterId,
      )) {
        throw new Error('character-taken');
      }
      const updated = addPlayer(room);
      transaction.set(ref, updated, { merge: false });
      return updated;
    });
    return { ok: true, room: cacheRoom(next) };
  } catch (error) {
    if (error instanceof Error && error.message === 'room-full') {
      return { ok: false, error: 'ห้องเต็มแล้ว รองรับสูงสุด 4 คน' };
    }
    if (error instanceof Error && error.message === 'character-taken') {
      return { ok: false, error: 'ตัวละครนี้มีเพื่อนเลือกแล้ว กรุณาเลือกตัวอื่น' };
    }
    const local = addPlayer(current);
    if (!local.players.some((member) => member.id === player.id)) {
      return { ok: false, error: 'ห้องเต็มแล้ว รองรับสูงสุด 4 คน' };
    }
    cacheRoom(local);
    return { ok: true, room: local };
  }
};

export const updateTycoonRoomPlayer = async (
  code: string,
  playerId: string,
  patch: Partial<Pick<TycoonRoomPlayer, 'name' | 'characterId' | 'ready'>>,
): Promise<TycoonRoomResult> => {
  const current = await fetchRoom(code);
  if (!current) return { ok: false, error: 'ไม่พบห้อง' };
  if (current.status !== 'lobby') return { ok: false, error: 'เปลี่ยนข้อมูลไม่ได้หลังเริ่มเกม' };

  const applyPatch = (room: TycoonRoom) => {
    const nextCharacter = patch.characterId;
    if (
      nextCharacter
      && room.players.some(
        (member) => member.id !== playerId && member.characterId === nextCharacter,
      )
    ) return null;
    return normalizeRoom({
      ...room,
      players: room.players.map((member) => (
        member.id === playerId
          ? {
            ...member,
            ...patch,
            name: patch.name?.trim() || member.name,
            lastSeenAt: Date.now(),
          }
          : member
      )),
      updatedAt: Date.now(),
    });
  };

  try {
    if (firestoreUnavailable) throw new Error('firebase-unavailable');
    const next = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, current.code);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('room-not-found');
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      const updated = applyPatch(room);
      if (!updated) throw new Error('character-taken');
      transaction.set(ref, updated, { merge: false });
      return updated;
    });
    return { ok: true, room: cacheRoom(next) };
  } catch (error) {
    if (error instanceof Error && error.message === 'character-taken') {
      return { ok: false, error: 'ตัวละครนี้มีเพื่อนเลือกแล้ว' };
    }
    const local = applyPatch(current);
    if (!local) return { ok: false, error: 'ตัวละครนี้มีเพื่อนเลือกแล้ว' };
    return { ok: true, room: cacheRoom(local) };
  }
};

export const startTycoonMultiplayerRoom = async (
  code: string,
  hostId: string,
  game: TycoonGameSnapshot,
): Promise<TycoonRoomResult> => {
  const current = await fetchRoom(code);
  if (!current) return { ok: false, error: 'ไม่พบห้อง' };
  if (current.hostId !== hostId) return { ok: false, error: 'เฉพาะเจ้าของห้องเท่านั้นที่เริ่มเกมได้' };
  if (!canStartTycoonRoom(current)) {
    return { ok: false, error: 'ต้องมีอย่างน้อย 2 คน และทุกคนต้องกดพร้อม' };
  }
  const next = normalizeRoom({
    ...current,
    status: 'playing',
    game,
    updatedAt: Date.now(),
  });
  cacheRoom(next);
  if (!firestoreUnavailable) {
    try {
      await setDoc(doc(db, COLLECTION, current.code), next, { merge: false });
    } catch (error) {
      firestoreUnavailable = true;
      console.warn('Tycoon game started locally only', error);
    }
  }
  return { ok: true, room: next };
};

export const publishTycoonGame = async (
  code: string,
  actorId: string,
  game: TycoonGameSnapshot,
): Promise<boolean> => {
  const current = await fetchRoom(code);
  if (!current || !current.players.some((player) => player.id === actorId)) return false;
  if (current.game && current.game.version >= game.version) return false;
  const next = normalizeRoom({
    ...current,
    status: game.phase === 'over' ? 'finished' : 'playing',
    game,
    updatedAt: Date.now(),
  });
  cacheRoom(next);
  if (!firestoreUnavailable) {
    try {
      await setDoc(doc(db, COLLECTION, current.code), next, { merge: false });
      return true;
    } catch (error) {
      firestoreUnavailable = true;
      console.warn('Tycoon turn synced locally only', error);
    }
  }
  return true;
};

export const leaveTycoonRoom = async (code: string, playerId: string): Promise<void> => {
  const room = await fetchRoom(code);
  if (!room) return;
  const players = room.players.filter((player) => player.id !== playerId);
  if (players.length === 0) {
    try {
      localStorage.removeItem(localKey(room.code));
    } catch {
      // Local cleanup is best effort.
    }
    emitRoom(room.code);
    if (!firestoreUnavailable) {
      try {
        await deleteDoc(doc(db, COLLECTION, room.code));
      } catch {
        firestoreUnavailable = true;
      }
    }
    return;
  }
  const next = normalizeRoom({
    ...room,
    hostId: room.hostId === playerId ? orderedTycoonRoomPlayers({ ...room, players })[0].id : room.hostId,
    players,
    updatedAt: Date.now(),
  });
  cacheRoom(next);
  if (!firestoreUnavailable) {
    try {
      await setDoc(doc(db, COLLECTION, room.code), next, { merge: false });
    } catch {
      firestoreUnavailable = true;
    }
  }
};

export const subscribeTycoonRoom = (
  code: string,
  onChange: (room: TycoonRoom | null) => void,
  onSyncMode?: (mode: TycoonRoomSyncMode) => void,
): (() => void) => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);
  onChange(readLocalRoom(cleanCode));
  onSyncMode?.('connecting');

  const channel = new BroadcastChannel(channelName(cleanCode));
  channel.onmessage = () => onChange(readLocalRoom(cleanCode));
  const onStorage = (event: StorageEvent) => {
    if (event.key === localKey(cleanCode)) onChange(readLocalRoom(cleanCode));
  };
  window.addEventListener('storage', onStorage);
  const unsubscribe = onSnapshot(
    doc(db, COLLECTION, cleanCode),
    (snapshot) => {
      if (!snapshot.exists()) {
        onSyncMode?.('local');
        onChange(readLocalRoom(cleanCode));
        return;
      }
      onSyncMode?.('firebase');
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      writeLocalRoom(room);
      onChange(room);
    },
    (error) => {
      onSyncMode?.('local');
      console.warn('Tycoon multiplayer sync unavailable; using same-device mode', error);
    },
  );

  return () => {
    channel.close();
    window.removeEventListener('storage', onStorage);
    unsubscribe();
  };
};
