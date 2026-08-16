import {
  doc,
  onSnapshot,
  runTransaction,
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
const ONLINE_CONNECTION_ERROR = 'เชื่อมต่อห้องออนไลน์ไม่ได้ กรุณาตรวจอินเทอร์เน็ตแล้วลองอีกครั้ง';

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
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateTycoonRoomCode();
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
    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, COLLECTION, code);
        const snapshot = await transaction.get(ref);
        if (snapshot.exists()) throw new Error('room-code-collision');
        transaction.set(ref, room, { merge: false });
      });
      return { ok: true, room: cacheRoom(room) };
    } catch (error) {
      if (error instanceof Error && error.message === 'room-code-collision') continue;
      console.warn('Tycoon room creation failed', error);
      return { ok: false, error: ONLINE_CONNECTION_ERROR };
    }
  }
  return { ok: false, error: 'สร้างรหัสห้องไม่สำเร็จ กรุณาลองอีกครั้ง' };
};

export const joinTycoonRoom = async (
  code: string,
  password: string,
  player: Pick<TycoonRoomPlayer, 'id' | 'name' | 'characterId'>,
): Promise<TycoonRoomResult> => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);
  if (cleanCode.length !== 6) return { ok: false, error: 'กรุณาตรวจรหัสห้อง 6 หลัก' };
  const expectedPasswordHash = await passwordHash(cleanCode, password);
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
    const next = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, cleanCode);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('room-not-found');
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      if (room.status !== 'lobby') throw new Error('room-started');
      if (room.passwordHash !== expectedPasswordHash) throw new Error('wrong-password');
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
    if (error instanceof Error && error.message === 'room-not-found') {
      return { ok: false, error: 'ไม่พบห้อง กรุณาตรวจรหัส 6 หลัก' };
    }
    if (error instanceof Error && error.message === 'room-started') {
      return { ok: false, error: 'ห้องนี้เริ่มเล่นแล้ว' };
    }
    if (error instanceof Error && error.message === 'wrong-password') {
      return { ok: false, error: 'รหัสผ่านห้องไม่ถูกต้อง' };
    }
    if (error instanceof Error && error.message === 'room-full') {
      return { ok: false, error: 'ห้องเต็มแล้ว รองรับสูงสุด 4 คน' };
    }
    if (error instanceof Error && error.message === 'character-taken') {
      return { ok: false, error: 'ตัวละครนี้มีเพื่อนเลือกแล้ว กรุณาเลือกตัวอื่น' };
    }
    console.warn('Tycoon room join failed', error);
    return { ok: false, error: ONLINE_CONNECTION_ERROR };
  }
};

export const updateTycoonRoomPlayer = async (
  code: string,
  playerId: string,
  patch: Partial<Pick<TycoonRoomPlayer, 'name' | 'characterId' | 'ready'>>,
): Promise<TycoonRoomResult> => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);

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
    const next = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, cleanCode);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('room-not-found');
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      if (room.status !== 'lobby') throw new Error('room-started');
      if (!room.players.some((member) => member.id === playerId)) throw new Error('player-not-found');
      const updated = applyPatch(room);
      if (!updated) throw new Error('character-taken');
      transaction.set(ref, updated, { merge: false });
      return updated;
    });
    return { ok: true, room: cacheRoom(next) };
  } catch (error) {
    if (error instanceof Error && error.message === 'room-not-found') {
      return { ok: false, error: 'ไม่พบห้อง' };
    }
    if (error instanceof Error && error.message === 'room-started') {
      return { ok: false, error: 'เปลี่ยนข้อมูลไม่ได้หลังเริ่มเกม' };
    }
    if (error instanceof Error && error.message === 'player-not-found') {
      return { ok: false, error: 'ไม่พบผู้เล่นในห้อง กรุณาเข้าห้องใหม่' };
    }
    if (error instanceof Error && error.message === 'character-taken') {
      return { ok: false, error: 'ตัวละครนี้มีเพื่อนเลือกแล้ว' };
    }
    console.warn('Tycoon player update failed', error);
    return { ok: false, error: ONLINE_CONNECTION_ERROR };
  }
};

export const startTycoonMultiplayerRoom = async (
  code: string,
  hostId: string,
  game: TycoonGameSnapshot,
): Promise<TycoonRoomResult> => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);
  try {
    const next = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, cleanCode);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('room-not-found');
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      if (room.hostId !== hostId) throw new Error('host-only');
      if (!canStartTycoonRoom(room)) throw new Error('players-not-ready');
      const updated = normalizeRoom({
        ...room,
        status: 'playing',
        game,
        updatedAt: Date.now(),
      });
      transaction.set(ref, updated, { merge: false });
      return updated;
    });
    return { ok: true, room: cacheRoom(next) };
  } catch (error) {
    if (error instanceof Error && error.message === 'room-not-found') {
      return { ok: false, error: 'ไม่พบห้อง' };
    }
    if (error instanceof Error && error.message === 'host-only') {
      return { ok: false, error: 'เฉพาะเจ้าของห้องเท่านั้นที่เริ่มเกมได้' };
    }
    if (error instanceof Error && error.message === 'players-not-ready') {
      return { ok: false, error: 'ต้องมีอย่างน้อย 2 คน และทุกคนต้องกดพร้อม' };
    }
    console.warn('Tycoon game start failed', error);
    return { ok: false, error: ONLINE_CONNECTION_ERROR };
  }
};

export const publishTycoonGame = async (
  code: string,
  actorId: string,
  game: TycoonGameSnapshot,
): Promise<boolean> => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);
  try {
    const next = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, cleanCode);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) throw new Error('room-not-found');
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      if (!room.players.some((player) => player.id === actorId)) throw new Error('player-not-found');
      if (room.game && room.game.version >= game.version) throw new Error('stale-version');
      const updated = normalizeRoom({
        ...room,
        status: game.phase === 'over' ? 'finished' : 'playing',
        game,
        updatedAt: Date.now(),
      });
      transaction.set(ref, updated, { merge: false });
      return updated;
    });
    cacheRoom(next);
    return true;
  } catch (error) {
    if (error instanceof Error && error.message === 'stale-version') return false;
    console.warn('Tycoon turn sync failed', error);
    return false;
  }
};

export const leaveTycoonRoom = async (code: string, playerId: string): Promise<void> => {
  const cleanCode = code.replace(/\D/g, '').slice(0, 6);
  try {
    const next = await runTransaction(db, async (transaction) => {
      const ref = doc(db, COLLECTION, cleanCode);
      const snapshot = await transaction.get(ref);
      if (!snapshot.exists()) return null;
      const room = normalizeRoom(snapshot.data() as Partial<TycoonRoom>);
      const players = room.players.filter((player) => player.id !== playerId);
      if (players.length === 0) {
        transaction.delete(ref);
        return null;
      }
      const updated = normalizeRoom({
        ...room,
        hostId: room.hostId === playerId
          ? orderedTycoonRoomPlayers({ ...room, players })[0].id
          : room.hostId,
        players,
        updatedAt: Date.now(),
      });
      transaction.set(ref, updated, { merge: false });
      return updated;
    });

    if (next) {
      cacheRoom(next);
      return;
    }
    try {
      localStorage.removeItem(localKey(cleanCode));
    } catch {
      // Local cleanup is best effort.
    }
    emitRoom(cleanCode);
  } catch (error) {
    console.warn('Tycoon room leave failed', error);
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
