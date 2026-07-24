import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type BlockMaterial = 'grass' | 'brick' | 'wood' | 'glass' | 'gold' | 'stone' | 'sand' | 'ice' | 'ruby';
export type WorldSyncMode = 'connecting' | 'firebase' | 'local';
export type WorldJoinStatus = 'active' | 'waiting' | 'blocked';
export type WorldActivityKind = 'slide' | 'question' | 'game' | 'artifact';
export type WorldMotion = 'idle' | 'walk' | 'jump';
export type CamouflagePose = 'stand' | 'crouch' | 'freeze';

export interface CamouflageRound {
  id: string;
  seekerId: string;
  participantIds: string[];
  foundPlayerIds: string[];
  startedAt: number;
  hideEndsAt: number;
  roundEndsAt: number;
}

export interface WorldBlock {
  id: string;
  x: number;
  y: number;
  z: number;
  material: BlockMaterial;
  ownerId: string;
  createdAt: number;
}

export interface WorldPlayer {
  id: string;
  roomId: string;
  name: string;
  classroom: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
  color: string;
  camouflageColor?: string;
  camouflagePose?: CamouflagePose;
  motion?: WorldMotion;
  role?: 'teacher' | 'student';
  joinStatus?: WorldJoinStatus;
  updatedAt: number;
}

export interface VirtualRoomState {
  roomId: string;
  classroom: string;
  isOpen: boolean;
  accessCodeHash: string;
  requireApproval: boolean;
  movementLocked: boolean;
  buildLocked: boolean;
  presentationUnitNo: number;
  presentationSlideIndex: number;
  presentationVersion: number;
  activeGamePath: string;
  activeGameTitle: string;
  gameVersion: number;
  summonVersion: number;
  summonX: number;
  summonZ: number;
  approvedPlayerIds: string[];
  blockedPlayerIds: string[];
  camouflageRound: CamouflageRound | null;
  updatedAt: number;
  updatedBy: string;
}

export interface WorldActivityEvent {
  id: string;
  eventId: string;
  roomId: string;
  playerId: string;
  playerName: string;
  classroom: string;
  kind: WorldActivityKind;
  unitNo: number;
  detail: string;
  createdAt: number;
}

const WORLD_COLLECTION = 'virtualWorlds';
const PLAYER_COLLECTION = 'virtualPlayers';
const ROOM_COLLECTION = 'virtualRooms';
const EVENT_COLLECTION = 'virtualActivityEvents';
const blockKey = (roomId: string) => `kj_virtual_world_${roomId}`;
const playerKey = (roomId: string) => `kj_virtual_players_${roomId}`;
const roomKey = (roomId: string) => `kj_virtual_room_state_${roomId}`;
const eventKey = (roomId: string) => `kj_virtual_events_${roomId}`;
const channelName = (roomId: string) => `kj-virtual-world-${roomId}`;

const readLocal = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch { return fallback; }
};

const writeLocal = <T>(key: string, value: T) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* local cache is optional */ }
};

const emit = (roomId: string) => {
  try {
    const channel = new BroadcastChannel(channelName(roomId));
    channel.postMessage({ type: 'changed', at: Date.now() });
    channel.close();
  } catch { /* same-tab use still works */ }
};

const safeDocId = (value: string) => (
  value.replace(/[^a-zA-Z0-9ก-๙_-]/g, '_').slice(0, 500)
);

const playerDocId = (roomId: string, playerId: string) => safeDocId(`${roomId}_${playerId}`);

export const defaultVirtualRoomState = (roomId: string, classroom: string): VirtualRoomState => ({
  roomId,
  classroom,
  isOpen: true,
  accessCodeHash: '',
  requireApproval: false,
  movementLocked: false,
  buildLocked: false,
  presentationUnitNo: 0,
  presentationSlideIndex: 0,
  presentationVersion: 0,
  activeGamePath: '',
  activeGameTitle: '',
  gameVersion: 0,
  summonVersion: 0,
  summonX: 0,
  summonZ: 10,
  approvedPlayerIds: [],
  blockedPlayerIds: [],
  camouflageRound: null,
  updatedAt: 0,
  updatedBy: '',
});

const normalizeIdList = (value: unknown) => (
  Array.isArray(value)
    ? Array.from(new Set(value.map(String).filter(Boolean))).slice(0, 100)
    : []
);

const normalizeRoomState = (
  roomId: string,
  classroom: string,
  value: unknown,
): VirtualRoomState => {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? value as Partial<VirtualRoomState>
    : {};
  const roundSource = source.camouflageRound
    && typeof source.camouflageRound === 'object'
    && !Array.isArray(source.camouflageRound)
    ? source.camouflageRound
    : null;
  const camouflageRound: CamouflageRound | null = roundSource
    && typeof roundSource.id === 'string'
    && typeof roundSource.seekerId === 'string'
    ? {
      id: roundSource.id,
      seekerId: roundSource.seekerId,
      participantIds: normalizeIdList(roundSource.participantIds).slice(0, 10),
      foundPlayerIds: normalizeIdList(roundSource.foundPlayerIds).slice(0, 10),
      startedAt: Number(roundSource.startedAt) || 0,
      hideEndsAt: Number(roundSource.hideEndsAt) || 0,
      roundEndsAt: Number(roundSource.roundEndsAt) || 0,
    }
    : null;
  return {
    ...defaultVirtualRoomState(roomId, classroom),
    ...source,
    roomId,
    classroom,
    accessCodeHash: typeof source.accessCodeHash === 'string' ? source.accessCodeHash : '',
    approvedPlayerIds: normalizeIdList(source.approvedPlayerIds),
    blockedPlayerIds: normalizeIdList(source.blockedPlayerIds),
    camouflageRound,
  };
};

export const getLocalVirtualRoomState = (roomId: string, classroom: string) => (
  normalizeRoomState(roomId, classroom, readLocal(roomKey(roomId), {}))
);

export const subscribeVirtualRoomState = (
  roomId: string,
  classroom: string,
  onChange: (state: VirtualRoomState) => void,
  onSyncMode?: (mode: WorldSyncMode) => void,
): (() => void) => {
  onChange(getLocalVirtualRoomState(roomId, classroom));
  onSyncMode?.('connecting');
  const channel = new BroadcastChannel(channelName(roomId));
  channel.onmessage = () => onChange(getLocalVirtualRoomState(roomId, classroom));
  const unsubscribe = onSnapshot(
    doc(db, ROOM_COLLECTION, roomId),
    (snapshot) => {
      onSyncMode?.('firebase');
      const state = normalizeRoomState(roomId, classroom, snapshot.exists() ? snapshot.data() : {});
      writeLocal(roomKey(roomId), state);
      onChange(state);
    },
    (error) => {
      onSyncMode?.('local');
      console.warn('virtual room control sync unavailable; using local room state', error);
    },
  );
  return () => {
    channel.close();
    unsubscribe();
  };
};

export const updateVirtualRoomState = async (
  roomId: string,
  classroom: string,
  patch: Partial<VirtualRoomState>,
  updatedBy = 'teacher',
): Promise<boolean> => {
  const current = getLocalVirtualRoomState(roomId, classroom);
  const next = normalizeRoomState(roomId, classroom, {
    ...current,
    ...patch,
    updatedAt: Date.now(),
    updatedBy,
  });
  writeLocal(roomKey(roomId), next);
  emit(roomId);
  try {
    await setDoc(doc(db, ROOM_COLLECTION, roomId), next, { merge: true });
    return true;
  } catch (error) {
    console.warn('virtual room controls saved locally only', error);
    return false;
  }
};

const hashText = async (value: string): Promise<string> => {
  const bytes = new TextEncoder().encode(value.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const setVirtualRoomAccessCode = async (
  roomId: string,
  classroom: string,
  accessCode: string,
  updatedBy = 'teacher',
) => updateVirtualRoomState(
  roomId,
  classroom,
  { accessCodeHash: accessCode.trim() ? await hashText(accessCode) : '' },
  updatedBy,
);

export const verifyVirtualRoomAccessCode = async (state: VirtualRoomState, accessCode: string) => (
  !state.accessCodeHash || await hashText(accessCode) === state.accessCodeHash
);

export const getLocalWorldBlocks = (roomId: string): WorldBlock[] => (
  readLocal<WorldBlock[]>(blockKey(roomId), [])
);

export const MAX_WORLD_BLOCKS = 1_200;

export const subscribeWorldBlocks = (
  roomId: string,
  onChange: (blocks: WorldBlock[]) => void,
): (() => void) => {
  onChange(getLocalWorldBlocks(roomId));
  const channel = new BroadcastChannel(channelName(roomId));
  channel.onmessage = () => onChange(getLocalWorldBlocks(roomId));

  const unsubscribe = onSnapshot(
    doc(db, WORLD_COLLECTION, roomId),
    (snapshot) => {
      const blocks = snapshot.exists()
        ? ((snapshot.data().blocks as WorldBlock[] | undefined) || [])
        : [];
      writeLocal(blockKey(roomId), blocks);
      onChange(blocks);
    },
    (error) => console.warn('virtual world sync unavailable; using local world', error),
  );

  return () => {
    channel.close();
    unsubscribe();
  };
};

export const addWorldBlock = async (roomId: string, block: WorldBlock): Promise<boolean> => {
  const current = getLocalWorldBlocks(roomId);
  if (current.some((item) => item.x === block.x && item.y === block.y && item.z === block.z)) return false;
  if (current.length >= MAX_WORLD_BLOCKS) {
    throw new Error(`โลกนี้มีบล็อกครบ ${MAX_WORLD_BLOCKS.toLocaleString('th-TH')} ชิ้นแล้ว`);
  }
  const next = [...current, block];
  writeLocal(blockKey(roomId), next);
  emit(roomId);
  try {
    await setDoc(doc(db, WORLD_COLLECTION, roomId), {
      roomId,
      blocks: arrayUnion(block),
      updatedAt: Date.now(),
    }, { merge: true });
  } catch (error) {
    console.warn('block saved locally only', error);
  }
  return true;
};

export const removeWorldBlock = async (roomId: string, block: WorldBlock): Promise<void> => {
  const next = getLocalWorldBlocks(roomId).filter((item) => item.id !== block.id);
  writeLocal(blockKey(roomId), next);
  emit(roomId);
  try {
    await updateDoc(doc(db, WORLD_COLLECTION, roomId), {
      blocks: arrayRemove(block),
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.warn('block removed locally only', error);
  }
};

const getLocalPlayers = (roomId: string): WorldPlayer[] => {
  const now = Date.now();
  return readLocal<WorldPlayer[]>(playerKey(roomId), [])
    .filter((player) => now - player.updatedAt < 30_000);
};

const cachePlayer = (player: WorldPlayer) => {
  const others = getLocalPlayers(player.roomId).filter((item) => item.id !== player.id);
  writeLocal(playerKey(player.roomId), [player, ...others]);
  emit(player.roomId);
};

const remotePresence = new Map<string, { at: number; signature: string }>();

export const updateWorldPlayer = async (player: WorldPlayer): Promise<void> => {
  cachePlayer(player);
  const id = playerDocId(player.roomId, player.id);
  const now = Date.now();
  const signature = [
    Math.round(player.x * 4),
    Math.round(player.y * 4),
    Math.round(player.z * 4),
    Math.round(player.rotation * 8),
    player.color,
    player.camouflageColor || '',
    player.camouflagePose || 'stand',
    player.motion || 'idle',
    player.joinStatus || 'active',
  ].join('|');
  const previous = remotePresence.get(id);
  if (previous && now - previous.at < 2_500) return;
  if (previous?.signature === signature && now - previous.at < 7_500) return;
  remotePresence.set(id, { at: now, signature });
  try {
    await setDoc(doc(db, PLAYER_COLLECTION, id), player, { merge: true });
  } catch (error) {
    console.warn('player presence saved locally only', error);
  }
};

export const removeWorldPlayer = async (roomId: string, playerId: string): Promise<void> => {
  writeLocal(
    playerKey(roomId),
    getLocalPlayers(roomId).filter((player) => player.id !== playerId),
  );
  emit(roomId);
  const id = playerDocId(roomId, playerId);
  remotePresence.delete(id);
  try {
    await deleteDoc(doc(db, PLAYER_COLLECTION, id));
  } catch { /* presence expires automatically in the UI */ }
};

export const subscribeWorldPlayers = (
  roomId: string,
  onChange: (players: WorldPlayer[]) => void,
  onSyncMode?: (mode: WorldSyncMode) => void,
): (() => void) => {
  onChange(getLocalPlayers(roomId));
  onSyncMode?.('connecting');
  const channel = new BroadcastChannel(channelName(roomId));
  channel.onmessage = () => onChange(getLocalPlayers(roomId));

  const playersQuery = query(collection(db, PLAYER_COLLECTION), where('roomId', '==', roomId));
  const unsubscribe = onSnapshot(
    playersQuery,
    (snapshot) => {
      onSyncMode?.('firebase');
      const now = Date.now();
      const players = snapshot.docs
        .map((item) => item.data() as WorldPlayer)
        .filter((player) => now - player.updatedAt < 30_000);
      writeLocal(playerKey(roomId), players);
      onChange(players);
    },
    (error) => {
      onSyncMode?.('local');
      console.warn('online player sync unavailable; using local presence', error);
    },
  );

  return () => {
    channel.close();
    unsubscribe();
  };
};

const getLocalEvents = (roomId: string): WorldActivityEvent[] => (
  readLocal<WorldActivityEvent[]>(eventKey(roomId), [])
    .filter((event) => Date.now() - event.createdAt < 7 * 86_400_000)
    .slice(0, 400)
);

export const recordWorldActivityEvent = async (
  event: Omit<WorldActivityEvent, 'id' | 'createdAt'>,
): Promise<boolean> => {
  const day = new Date().toISOString().slice(0, 10);
  const id = safeDocId(`${event.roomId}_${event.playerId}_${event.eventId}_${day}`);
  const nextEvent: WorldActivityEvent = { ...event, id, createdAt: Date.now() };
  const current = getLocalEvents(event.roomId);
  if (!current.some((item) => item.id === id)) {
    writeLocal(eventKey(event.roomId), [nextEvent, ...current].slice(0, 400));
    emit(event.roomId);
  }
  try {
    await setDoc(doc(db, EVENT_COLLECTION, id), nextEvent, { merge: false });
    return true;
  } catch (error) {
    console.warn('virtual classroom activity saved locally only', error);
    return false;
  }
};

export const subscribeWorldActivityEvents = (
  roomId: string,
  onChange: (events: WorldActivityEvent[]) => void,
): (() => void) => {
  onChange(getLocalEvents(roomId));
  const channel = new BroadcastChannel(channelName(roomId));
  channel.onmessage = () => onChange(getLocalEvents(roomId));
  const eventsQuery = query(collection(db, EVENT_COLLECTION), where('roomId', '==', roomId));
  const unsubscribe = onSnapshot(
    eventsQuery,
    (snapshot) => {
      const events = snapshot.docs
        .map((item) => item.data() as WorldActivityEvent)
        .filter((event) => Date.now() - event.createdAt < 7 * 86_400_000)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, 400);
      writeLocal(eventKey(roomId), events);
      onChange(events);
    },
    (error) => console.warn('virtual classroom analytics unavailable; using local events', error),
  );
  return () => {
    channel.close();
    unsubscribe();
  };
};

/** ล้างข้อมูลห้องทดสอบอัตโนมัติ ไม่อนุญาตให้ใช้กับห้องเรียนจริง */
export const cleanupVirtualQaRoom = async (roomId: string): Promise<void> => {
  if (!roomId.includes('-qa-')) return;
  const playersQuery = query(collection(db, PLAYER_COLLECTION), where('roomId', '==', roomId));
  const eventsQuery = query(collection(db, EVENT_COLLECTION), where('roomId', '==', roomId));
  try {
    const [players, events] = await Promise.all([getDocs(playersQuery), getDocs(eventsQuery)]);
    await Promise.all([
      deleteDoc(doc(db, WORLD_COLLECTION, roomId)),
      deleteDoc(doc(db, ROOM_COLLECTION, roomId)),
      ...players.docs.map((item) => deleteDoc(item.ref)),
      ...events.docs.map((item) => deleteDoc(item.ref)),
    ]);
  } catch (error) {
    console.warn('QA room cleanup failed', error);
  }
  try {
    localStorage.removeItem(blockKey(roomId));
    localStorage.removeItem(playerKey(roomId));
    localStorage.removeItem(roomKey(roomId));
    localStorage.removeItem(eventKey(roomId));
  } catch { /* cleanup cache is best effort */ }
};
