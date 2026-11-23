// บล็อกในห้อง 3D เก็บแยกเอกสารตามเจ้าของ เพื่อให้เด็ก 10 คนขึ้นไปสร้างพร้อมกันได้โดยไม่เขียนเอกสารเดียวกันชนกัน
import { beforeEach, describe, expect, it } from 'vitest';
import {
  addWorldBlock,
  addWorldBlocksBatch,
  countBlocksByOwner,
  getLocalWorldBlocks,
  getWorldDocId,
  getWorldShardDocId,
  MAX_BLOCKS_PER_PLAYER,
  mergeWorldBlockShards,
} from '../src/services/virtualClassroomService';
import type { WorldBlock } from '../src/services/virtualClassroomService';

const store = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, String(val)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  },
  configurable: true,
});

const block = (id: string, x: number, ownerId: string, createdAt = 1, y = 1, z = 0): WorldBlock => ({
  id, x, y, z, material: 'grass', ownerId, createdAt,
});

describe('3D world block shards', () => {
  beforeEach(() => store.clear());

  it('gives each builder their own document, safe for any player id', () => {
    const week = '2026-W48';
    const a = getWorldShardDocId('room-p1', 'uid/abc.def', week);
    const b = getWorldShardDocId('room-p1', 'guest_12', week);
    expect(a).not.toBe(b);
    expect(a.startsWith(`${getWorldDocId('room-p1', week)}__`)).toBe(true);
    expect(a).not.toMatch(/[/.]/);
  });

  it('merges blocks from every builder; the earlier block wins a shared position', () => {
    const merged = mergeWorldBlockShards([
      { docId: 'legacy', blocks: [block('old', 0, 'kid1', 1)] },
      { docId: 'shard-kid2', blocks: [block('late', 0, 'kid2', 5), block('own', 1, 'kid2', 2)] },
      { docId: 'shard-kid3', blocks: [block('k3', 2, 'kid3', 3)] },
    ]);
    expect(merged.map((b) => b.id).sort()).toEqual(['k3', 'old', 'own']);
  });

  it('caps each builder so one child cannot use the whole room', async () => {
    const room = 'room-quota';
    const many = Array.from({ length: MAX_BLOCKS_PER_PLAYER + 20 }, (_, i) => block(`b${i}`, i, 'kid1', i));
    const added = await addWorldBlocksBatch(room, many);
    expect(added).toBe(MAX_BLOCKS_PER_PLAYER);
    await expect(addWorldBlock(room, block('extra', 999, 'kid1', 999))).rejects.toThrow(String(MAX_BLOCKS_PER_PLAYER));
    // a classmate can still build
    expect(await addWorldBlock(room, block('friend', 1000, 'kid2', 1000))).toBe(true);
    const blocks = getLocalWorldBlocks(room);
    expect(countBlocksByOwner(blocks, 'kid1')).toBe(MAX_BLOCKS_PER_PLAYER);
    expect(countBlocksByOwner(blocks, 'kid2')).toBe(1);
  });
});
