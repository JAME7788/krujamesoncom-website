import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

export type BlockMaterial =
  | 'grass'
  | 'brick'
  | 'wood'
  | 'glass'
  | 'gold'
  | 'stone'
  | 'sand'
  | 'ice'
  | 'ruby'
  | 'jumppad'
  | 'speedpad'
  | 'lamp'
  | 'switch'
  | 'sign';
export type WorldSyncMode = 'connecting' | 'firebase' | 'local';
export type WorldJoinStatus = 'active' | 'waiting' | 'blocked';
export type WorldActivityKind = 'slide' | 'question' | 'game' | 'artifact';
export type WorldMotion = 'idle' | 'walk' | 'jump' | 'fly' | 'wave' | 'cheer' | 'dance' | 'build';
export type AvatarTechClass =
  | 'coder'
  | 'ai_engineer'
  | 'cyber_guardian'
  | 'vr_explorer'
  | 'hardware_maker'
  | 'game_creator';
export type AvatarFaceStyle = 'happy' | 'cool' | 'excited' | 'focused' | 'robo';
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
  ownerName?: string;
  label?: string;
  powered?: boolean;
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
  techClass?: AvatarTechClass;
  faceStyle?: AvatarFaceStyle;
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
  summonLookX?: number;
  summonLookZ?: number;
  summonLabel?: string;
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

const firebaseAvailable = (): boolean => {
  try {
    return !!db && !!import.meta.env.VITE_FIREBASE_PROJECT_ID;
  } catch {
    return false;
  }
};

/**
 * คำนวณรหัสสัปดาห์ตามมาตรฐาน ISO-8601 (ขึ้นต้นสัปดาห์ใหม่ทุกวันจันทร์)
 * เช่น 2026-W36, 2026-W37 เพื่อรีแมพโลกเสมือนอัตโนมัติทุกสัปดาห์
 */
export const getWorldWeekKey = (date = new Date()): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
};

export const getWeekDisplayLabel = (weekKey = getWorldWeekKey()): string => {
  const match = weekKey.match(/(\d{4})-W(\d{2})/);
  if (!match) return 'สัปดาห์ปัจจุบัน';
  const yearBE = parseInt(match[1], 10) + 543;
  const weekNo = parseInt(match[2], 10);
  return `สัปดาห์ที่ ${weekNo} (${yearBE})`;
};

export const getWorldDocId = (roomId: string, weekKey = getWorldWeekKey()): string => (
  `${roomId}_${weekKey}`
);

const blockKey = (roomId: string, weekKey = getWorldWeekKey()) => (
  `kj_virtual_world_${roomId}_${weekKey}`
);
const playerKey = (roomId: string) => `kj_virtual_players_${roomId}`;
const roomKey = (roomId: string) => `kj_virtual_room_state_${roomId}`;
const eventKey = (roomId: string) => `kj_virtual_events_${roomId}`;
const channelName = (roomId: string) => `kj-virtual-world-${roomId}`;

const emitWorldBlocks = (roomId: string, weekKey = getWorldWeekKey()) => {
  try {
    const channel = new BroadcastChannel(`${channelName(roomId)}-${weekKey}`);
    channel.postMessage({ type: 'blocks_changed', at: Date.now() });
    channel.close();
  } catch { /* channel optional */ }
};

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
  summonLookX: 0,
  summonLookZ: 0,
  summonLabel: '',
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
  if (!firebaseAvailable()) {
    onSyncMode?.('local');
    return () => channel.close();
  }
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
  if (!firebaseAvailable()) return false;
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

export const getLocalWorldBlocks = (roomId: string, weekKey = getWorldWeekKey()): WorldBlock[] => {
  const current = readLocal<WorldBlock[]>(blockKey(roomId, weekKey), []);
  if (current.length > 0) return current;

  // Fallback: ตรวจสอบข้อมูลเก่า unversioned สำหรับสัปดาห์นี้
  const legacy = readLocal<WorldBlock[]>(`kj_virtual_world_${roomId}`, []);
  if (legacy.length > 0) {
    const validInWeek = legacy.filter((b) => {
      if (!b.createdAt) return false;
      return getWorldWeekKey(new Date(b.createdAt)) === weekKey;
    });
    if (validInWeek.length > 0) {
      writeLocal(blockKey(roomId, weekKey), validInWeek);
      return validInWeek;
    }
  }
  return [];
};

export const MAX_WORLD_BLOCKS = 1_200;
/** โควตาต่อคน: ห้องหนึ่งมี 10–30 คน ถ้าไม่จำกัด คนเดียวอาจใช้บล็อกของทั้งห้องหมด */
export const MAX_BLOCKS_PER_PLAYER = 150;

/*
 * เก็บบล็อกแยกเอกสารตามเจ้าของ (shard) แทนการรวมทุกบล็อกไว้ในเอกสารเดียว
 * Firestore รับการเขียนเอกสารเดียวกันได้ราว 1 ครั้งต่อวินาที เมื่อเด็ก 10 คนขึ้นไปวางบล็อกพร้อมกัน
 * เอกสารเดียวจะชนกันจนบล็อกบางส่วนไม่ถูกบันทึก แยกเอกสารต่อคนทำให้แต่ละคนเขียนเอกสารของตัวเอง
 * เอกสารเดิม `${roomId}_${weekKey}` ยังอ่านอยู่ บล็อกที่สร้างก่อนหน้านี้จึงไม่หาย
 */
const shardOwnerKey = (ownerId: string) => ownerId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) || 'anon';
export const getWorldShardDocId = (roomId: string, ownerId: string, weekKey = getWorldWeekKey()): string => (
  `${getWorldDocId(roomId, weekKey)}__${shardOwnerKey(ownerId)}`
);

/** บล็อกแต่ละก้อนมาจากเอกสารไหน ใช้ตอนลบหรือแก้ให้ไปแก้ที่เอกสารถูกตัว */
const blockSourceDoc = new Map<string, string>();
const sourceDocOf = (roomId: string, block: WorldBlock, weekKey: string) => (
  blockSourceDoc.get(block.id) ?? getWorldShardDocId(roomId, block.ownerId, weekKey)
);

/** รวมบล็อกจากทุก shard: ถ้าสองก้อนอยู่ตำแหน่งเดียวกัน (วางพร้อมกันพอดี) ก้อนที่วางก่อนชนะ */
export const mergeWorldBlockShards = (shards: Array<{ docId: string; blocks: WorldBlock[] }>): WorldBlock[] => {
  const all = shards.flatMap(({ docId, blocks }) => blocks.map((block) => ({ docId, block })));
  all.sort((a, b) => (a.block.createdAt || 0) - (b.block.createdAt || 0));
  const byPosition = new Map<string, WorldBlock>();
  all.forEach(({ docId, block }) => {
    const key = `${block.x},${block.y},${block.z}`;
    if (byPosition.has(key)) return;
    byPosition.set(key, block);
    blockSourceDoc.set(block.id, docId);
  });
  return [...byPosition.values()];
};

export const countBlocksByOwner = (blocks: WorldBlock[], ownerId: string) => (
  blocks.filter((block) => block.ownerId === ownerId).length
);

const writeWithTimeout = async (write: Promise<unknown>, ms: number, label: string) => {
  try {
    await Promise.race([write, new Promise((resolve) => setTimeout(resolve, ms))]);
  } catch (error) {
    console.warn(label, error);
  }
};

export const subscribeWorldBlocks = (
  roomId: string,
  onChange: (blocks: WorldBlock[]) => void,
  weekKey = getWorldWeekKey(),
): (() => void) => {
  const localKey = blockKey(roomId, weekKey);
  const channelKey = `${channelName(roomId)}-${weekKey}`;

  onChange(getLocalWorldBlocks(roomId, weekKey));
  const channel = new BroadcastChannel(channelKey);
  channel.onmessage = () => onChange(getLocalWorldBlocks(roomId, weekKey));
  if (!firebaseAvailable()) {
    return () => channel.close();
  }

  const shardsQuery = query(
    collection(db, WORLD_COLLECTION),
    where('roomId', '==', roomId),
    where('weekKey', '==', weekKey),
  );
  const unsubscribe = onSnapshot(
    shardsQuery,
    (snapshot) => {
      const blocks = mergeWorldBlockShards(snapshot.docs.map((item) => ({
        docId: item.id,
        blocks: (item.data().blocks as WorldBlock[] | undefined) || [],
      })));
      writeLocal(localKey, blocks);
      onChange(blocks);
    },
    (error) => console.warn('virtual world sync unavailable; using local world', error),
  );

  return () => {
    channel.close();
    unsubscribe();
  };
};

const quotaError = (current: WorldBlock[], ownerId: string, adding: number) => {
  if (current.length + adding > MAX_WORLD_BLOCKS) {
    return `โลกนี้มีบล็อกครบ ${MAX_WORLD_BLOCKS.toLocaleString('th-TH')} ชิ้นแล้ว`;
  }
  if (countBlocksByOwner(current, ownerId) + adding > MAX_BLOCKS_PER_PLAYER) {
    return `วางได้คนละ ${MAX_BLOCKS_PER_PLAYER} ก้อน เพื่อให้เพื่อนทุกคนมีบล็อกสร้าง ลองลบก้อนเก่าก่อนนะ`;
  }
  return null;
};

export const addWorldBlock = async (
  roomId: string,
  block: WorldBlock,
  weekKey = getWorldWeekKey(),
): Promise<boolean> => {
  const current = getLocalWorldBlocks(roomId, weekKey);
  if (current.some((item) => item.x === block.x && item.y === block.y && item.z === block.z)) return false;
  const blocked = quotaError(current, block.ownerId, 1);
  if (blocked) throw new Error(blocked);
  writeLocal(blockKey(roomId, weekKey), [...current, block]);
  emitWorldBlocks(roomId, weekKey);
  if (!firebaseAvailable()) return true;
  const shardId = getWorldShardDocId(roomId, block.ownerId, weekKey);
  blockSourceDoc.set(block.id, shardId);
  await writeWithTimeout(setDoc(doc(db, WORLD_COLLECTION, shardId), {
    roomId,
    weekKey,
    ownerId: block.ownerId,
    blocks: arrayUnion(block),
    updatedAt: Date.now(),
  }, { merge: true }), 1500, 'block saved locally only');
  return true;
};

export const addWorldBlocksBatch = async (
  roomId: string,
  candidateBlocks: WorldBlock[],
  weekKey = getWorldWeekKey(),
): Promise<number> => {
  const current = getLocalWorldBlocks(roomId, weekKey);
  const occupied = new Set(current.map((item) => `${item.x},${item.y},${item.z}`));
  const ownedCount = new Map<string, number>();
  const added: WorldBlock[] = [];
  for (const block of candidateBlocks) {
    if (current.length + added.length >= MAX_WORLD_BLOCKS) break;
    const owned = ownedCount.get(block.ownerId) ?? countBlocksByOwner(current, block.ownerId);
    if (owned >= MAX_BLOCKS_PER_PLAYER) continue;
    const key = `${block.x},${block.y},${block.z}`;
    if (occupied.has(key)) continue;
    occupied.add(key);
    ownedCount.set(block.ownerId, owned + 1);
    added.push(block);
  }
  if (added.length === 0) return 0;
  writeLocal(blockKey(roomId, weekKey), [...current, ...added]);
  emitWorldBlocks(roomId, weekKey);
  if (!firebaseAvailable()) return added.length;
  const byOwner = new Map<string, WorldBlock[]>();
  added.forEach((block) => byOwner.set(block.ownerId, [...(byOwner.get(block.ownerId) ?? []), block]));
  await writeWithTimeout(Promise.all([...byOwner.entries()].map(([ownerId, blocks]) => {
    const shardId = getWorldShardDocId(roomId, ownerId, weekKey);
    blocks.forEach((block) => blockSourceDoc.set(block.id, shardId));
    return setDoc(doc(db, WORLD_COLLECTION, shardId), {
      roomId,
      weekKey,
      ownerId,
      blocks: arrayUnion(...blocks),
      updatedAt: Date.now(),
    }, { merge: true });
  })), 1800, 'batch blocks saved locally only');
  return added.length;
};

export const removeWorldBlock = async (
  roomId: string,
  block: WorldBlock,
  weekKey = getWorldWeekKey(),
): Promise<void> => {
  const current = getLocalWorldBlocks(roomId, weekKey);
  const stored = current.find((item) => item.id === block.id) ?? block;
  writeLocal(blockKey(roomId, weekKey), current.filter((item) => item.id !== block.id));
  emitWorldBlocks(roomId, weekKey);
  if (!firebaseAvailable()) return;
  // ลบเฉพาะก้อนนี้ด้วย arrayRemove เดิมเขียนทับทั้งรายการจากข้อมูลในเครื่อง จึงอาจลบบล็อกที่เพื่อนเพิ่งวาง
  const sourceId = sourceDocOf(roomId, stored, weekKey);
  await writeWithTimeout(
    updateDoc(doc(db, WORLD_COLLECTION, sourceId), { blocks: arrayRemove(stored), updatedAt: Date.now() }),
    1500,
    'block removed locally only',
  );
  blockSourceDoc.delete(block.id);
};

export const updateWorldBlock = async (
  roomId: string,
  blockId: string,
  patch: Partial<Pick<WorldBlock, 'label' | 'powered' | 'ownerName'>>,
  weekKey = getWorldWeekKey(),
): Promise<WorldBlock | null> => {
  const current = getLocalWorldBlocks(roomId, weekKey);
  const target = current.find((item) => item.id === blockId);
  if (!target) return null;
  const updated: WorldBlock = {
    ...target,
    ...patch,
    ...(typeof patch.label === 'string' ? { label: patch.label.trim().slice(0, 48) } : {}),
  };
  writeLocal(blockKey(roomId, weekKey), current.map((item) => (item.id === blockId ? updated : item)));
  emitWorldBlocks(roomId, weekKey);
  if (!firebaseAvailable()) return updated;
  // แก้เฉพาะก้อนนี้ในเอกสารต้นทางผ่าน transaction จะได้ไม่ทับบล็อกอื่นในเอกสารเดียวกัน
  const ref = doc(db, WORLD_COLLECTION, sourceDocOf(roomId, target, weekKey));
  await writeWithTimeout(runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const blocks = ((snap.data().blocks as WorldBlock[] | undefined) || [])
      .map((item) => (item.id === blockId ? { ...item, ...updated } : item));
    tx.update(ref, { blocks, updatedAt: Date.now() });
  }), 1500, 'block updated locally only');
  return updated;
};

/** ล้างบล็อกทั้งหมดในแผนที่สำหรับสัปดาห์นี้ (รีแมพ / Reset Map) ทุก shard */
export const clearWorldBlocks = async (
  roomId: string,
  weekKey = getWorldWeekKey(),
): Promise<void> => {
  writeLocal(blockKey(roomId, weekKey), []);
  emitWorldBlocks(roomId, weekKey);
  if (!firebaseAvailable()) return;
  try {
    const shards = await getDocs(query(
      collection(db, WORLD_COLLECTION),
      where('roomId', '==', roomId),
      where('weekKey', '==', weekKey),
    ));
    await writeWithTimeout(Promise.all(shards.docs.map((item) => setDoc(item.ref, {
      blocks: [],
      updatedAt: Date.now(),
    }, { merge: true }))), 2500, 'world cleared locally only');
  } catch (error) {
    console.warn('world cleared locally only', error);
  }
};

export const PLAYER_PRESENCE_TTL_MS = 90_000;

const getLocalPlayers = (roomId: string): WorldPlayer[] => {
  const now = Date.now();
  return readLocal<WorldPlayer[]>(playerKey(roomId), [])
    .filter((player) => Math.abs(now - player.updatedAt) < PLAYER_PRESENCE_TTL_MS);
};

const cachePlayer = (player: WorldPlayer) => {
  const others = getLocalPlayers(player.roomId).filter((item) => item.id !== player.id);
  writeLocal(playerKey(player.roomId), [player, ...others]);
  emit(player.roomId);
};

const extractServerSeenAtMs = (raw: Record<string, unknown>): number | null => {
  const candidate = raw.serverSeenAt as { toMillis?: () => number; seconds?: number } | number | undefined;
  if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
  if (candidate && typeof candidate === 'object') {
    if (typeof candidate.toMillis === 'function') return candidate.toMillis();
    if (typeof candidate.seconds === 'number') return candidate.seconds * 1000;
  }
  return null;
};

const stripInternalPlayerFields = (raw: Record<string, unknown>): WorldPlayer => {
  const copy = { ...raw };
  delete copy.serverSeenAt;
  return copy as unknown as WorldPlayer;
};

/**
 * ตัวติดตามผู้เล่นออนไลน์ที่ทนทานต่อปัญหาเวลาเครื่องคอมพิวเตอร์ในห้องเรียนไม่ตรงกัน (Clock Skew)
 * โดยใช้ทั้งเวลาจากเซิร์ฟเวอร์ (serverSeenAt) และการตรวจจับการเปลี่ยนแปลงของสัญญาณชีพ (heartbeat updatedAt)
 */
export const createPlayerPresenceTracker = (ttlMs = PLAYER_PRESENCE_TTL_MS) => {
  const observedUpdatedAt = new Map<string, number>();
  const observedServerSeenAt = new Map<string, number>();
  const lastActiveLocalMs = new Map<string, number>();
  const latestPlayers = new Map<string, WorldPlayer>();

  const ingestSnapshot = (
    rawDocs: Array<Record<string, unknown>>,
    now = Date.now(),
  ): WorldPlayer[] => {
    const presentIds = new Set<string>();
    const parsed = rawDocs
      .map((raw) => ({
        player: stripInternalPlayerFields(raw),
        serverSeenAtMs: extractServerSeenAtMs(raw),
      }))
      .filter((item) => Boolean(item.player?.id));

    for (const { player, serverSeenAtMs } of parsed) {
      presentIds.add(player.id);
      latestPlayers.set(player.id, player);
      const prevUpdated = observedUpdatedAt.get(player.id);
      const prevServer = observedServerSeenAt.get(player.id);

      const updatedAdvanced = prevUpdated !== undefined && prevUpdated !== player.updatedAt;
      const serverAdvanced = prevServer !== undefined && serverSeenAtMs !== null && prevServer !== serverSeenAtMs;
      const firstSeenNearLocalClock = prevUpdated === undefined && (
        Math.abs(now - player.updatedAt) < ttlMs
        || (serverSeenAtMs !== null && Math.abs(now - serverSeenAtMs) < ttlMs)
      );

      if (updatedAdvanced || serverAdvanced || firstSeenNearLocalClock) {
        lastActiveLocalMs.set(player.id, now);
      }
      observedUpdatedAt.set(player.id, player.updatedAt);
      if (serverSeenAtMs !== null) {
        observedServerSeenAt.set(player.id, serverSeenAtMs);
      }
    }

    // เทียบเวลาเซิร์ฟเวอร์ของผู้เล่นที่เพิ่งยืนยันว่าออนไลน์กับคนอื่นในห้องเดียวกัน (แก้ปัญหาเครื่องนักเรียนตั้งวันที่/ปีผิด)
    let verifiedServerNowMs: number | null = null;
    for (const { player, serverSeenAtMs } of parsed) {
      const activeAt = lastActiveLocalMs.get(player.id);
      if (activeAt !== undefined && now - activeAt < ttlMs && serverSeenAtMs !== null) {
        if (verifiedServerNowMs === null || serverSeenAtMs > verifiedServerNowMs) {
          verifiedServerNowMs = serverSeenAtMs;
        }
      }
    }
    if (verifiedServerNowMs !== null) {
      for (const { player, serverSeenAtMs } of parsed) {
        if (serverSeenAtMs !== null && Math.abs(verifiedServerNowMs - serverSeenAtMs) < ttlMs) {
          if (!lastActiveLocalMs.has(player.id)) {
            lastActiveLocalMs.set(player.id, now);
          }
        }
      }
    }

    for (const id of Array.from(latestPlayers.keys())) {
      if (!presentIds.has(id)) {
        latestPlayers.delete(id);
        observedUpdatedAt.delete(id);
        observedServerSeenAt.delete(id);
        lastActiveLocalMs.delete(id);
      }
    }

    return getActivePlayers(now);
  };

  const getActivePlayers = (now = Date.now()): WorldPlayer[] => {
    const active: WorldPlayer[] = [];
    for (const [id, player] of latestPlayers.entries()) {
      const activeAt = lastActiveLocalMs.get(id);
      if (activeAt !== undefined && now - activeAt < ttlMs) {
        active.push(player);
      }
    }
    return active;
  };

  return { ingestSnapshot, getActivePlayers };
};

const remotePresence = new Map<string, { at: number; signature: string }>();

export const updateWorldPlayer = async (player: WorldPlayer, force = false): Promise<void> => {
  cachePlayer(player);
  const id = playerDocId(player.roomId, player.id);
  const now = Date.now();
  const signature = [
    Math.round(player.x * 4),
    Math.round(player.y * 4),
    Math.round(player.z * 4),
    Math.round(player.rotation * 8),
    player.color,
    player.techClass || 'coder',
    player.faceStyle || 'happy',
    player.camouflageColor || '',
    player.camouflagePose || 'stand',
    player.motion || 'idle',
    player.joinStatus || 'active',
  ].join('|');
  const previous = remotePresence.get(id);
  if (!force) {
    if (previous && now - previous.at < 1_500) return;
    if (previous?.signature === signature && now - previous.at < 4_500) return;
  }
  remotePresence.set(id, { at: now, signature });
  if (!firebaseAvailable()) return;
  try {
    await setDoc(doc(db, PLAYER_COLLECTION, id), {
      ...player,
      serverSeenAt: serverTimestamp(),
    }, { merge: true });
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
  if (!firebaseAvailable()) return;
  try {
    await deleteDoc(doc(db, PLAYER_COLLECTION, id));
  } catch { /* presence expires automatically in the UI */ }
};

export const subscribeWorldPlayers = (
  roomId: string,
  onChange: (players: WorldPlayer[]) => void,
  onSyncMode?: (mode: WorldSyncMode) => void,
): (() => void) => {
  const tracker = createPlayerPresenceTracker(PLAYER_PRESENCE_TTL_MS);
  const mergeWithLocal = (remotePlayers: WorldPlayer[]): WorldPlayer[] => {
    const merged = new Map<string, WorldPlayer>();
    getLocalPlayers(roomId).forEach((p) => merged.set(p.id, p));
    remotePlayers.forEach((p) => merged.set(p.id, p));
    return Array.from(merged.values());
  };

  onChange(getLocalPlayers(roomId));
  onSyncMode?.('connecting');
  const channel = new BroadcastChannel(channelName(roomId));
  channel.onmessage = () => onChange(mergeWithLocal(tracker.getActivePlayers()));
  if (!firebaseAvailable()) {
    onSyncMode?.('local');
    return () => channel.close();
  }

  const playersQuery = query(collection(db, PLAYER_COLLECTION), where('roomId', '==', roomId));
  const unsubscribe = onSnapshot(
    playersQuery,
    (snapshot) => {
      onSyncMode?.('firebase');
      const remotePlayers = tracker.ingestSnapshot(
        snapshot.docs.map((item) => item.data() as Record<string, unknown>),
      );
      const combined = mergeWithLocal(remotePlayers);
      writeLocal(playerKey(roomId), combined);
      onChange(combined);
    },
    (error) => {
      onSyncMode?.('local');
      console.warn('online player sync unavailable; using local presence', error);
    },
  );

  const sweepInterval = setInterval(() => {
    const combined = mergeWithLocal(tracker.getActivePlayers());
    onChange(combined);
  }, 15_000);

  return () => {
    clearInterval(sweepInterval);
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
    if (!firebaseAvailable()) return false;
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
  if (!firebaseAvailable()) {
    return () => channel.close();
  }
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
  if (!firebaseAvailable()) {
    try {
      localStorage.removeItem(blockKey(roomId));
      localStorage.removeItem(`kj_virtual_world_${roomId}`);
      localStorage.removeItem(playerKey(roomId));
      localStorage.removeItem(roomKey(roomId));
      localStorage.removeItem(eventKey(roomId));
    } catch { /* cleanup cache is best effort */ }
    return;
  }
  const playersQuery = query(collection(db, PLAYER_COLLECTION), where('roomId', '==', roomId));
  const eventsQuery = query(collection(db, EVENT_COLLECTION), where('roomId', '==', roomId));
  try {
    const shardsQuery = query(collection(db, WORLD_COLLECTION), where('roomId', '==', roomId));
    const [players, events, shards] = await Promise.all([getDocs(playersQuery), getDocs(eventsQuery), getDocs(shardsQuery)]);
    await Promise.all([
      deleteDoc(doc(db, WORLD_COLLECTION, getWorldDocId(roomId))),
      ...shards.docs.map((item) => deleteDoc(item.ref)),
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
    localStorage.removeItem(`kj_virtual_world_${roomId}`);
    localStorage.removeItem(playerKey(roomId));
    localStorage.removeItem(roomKey(roomId));
    localStorage.removeItem(eventKey(roomId));
  } catch { /* cleanup cache is best effort */ }
};
