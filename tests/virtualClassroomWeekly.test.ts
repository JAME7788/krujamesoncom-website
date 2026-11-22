import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearWorldBlocks,
  addWorldBlock,
  addWorldBlocksBatch,
  removeWorldBlock,
  updateWorldBlock,
  createPlayerPresenceTracker,
  getLocalWorldBlocks,
  getWeekDisplayLabel,
  getWorldDocId,
  getWorldWeekKey,
  MAX_WORLD_BLOCKS,
  PLAYER_PRESENCE_TTL_MS,
} from '../src/services/virtualClassroomService';
import type { WorldBlock } from '../src/services/virtualClassroomService';

const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, val: string) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });

describe('Virtual Classroom Weekly Remap & Partitioning', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  describe('ISO-8601 Week Calculation', () => {
    it('คำนวณรหัสสัปดาห์ถูกต้องในวันอาทิตย์ (สัปดาห์ที่ 36)', () => {
      const sunday = new Date('2026-09-06T12:00:00Z');
      expect(getWorldWeekKey(sunday)).toBe('2026-W36');
    });

    it('คำนวณรหัสสัปดาห์ถูกต้องในวันจันทร์ถัดไป (สัปดาห์ที่ 37) แสดงการรีแมพอัตโนมัติ', () => {
      const monday = new Date('2026-09-07T08:00:00Z');
      expect(getWorldWeekKey(monday)).toBe('2026-W37');
    });

    it('แสดงป้ายชื่อสัปดาห์ภาษาไทยพร้อมปี พ.ศ.', () => {
      expect(getWeekDisplayLabel('2026-W36')).toBe('สัปดาห์ที่ 36 (2569)');
      expect(getWeekDisplayLabel('2026-W37')).toBe('สัปดาห์ที่ 37 (2569)');
    });

    it('สร้าง Document ID แยกตามห้องและสัปดาห์', () => {
      expect(getWorldDocId('class-ป1', '2026-W36')).toBe('class-ป1_2026-W36');
      expect(getWorldDocId('class-ป1', '2026-W37')).toBe('class-ป1_2026-W37');
    });
  });

  describe('Block Storage & Weekly Separation', () => {
    const dummyBlock: WorldBlock = {
      id: 'block_1',
      x: 0.5,
      y: 0.5,
      z: 0.5,
      material: 'grass',
      ownerId: 'student_1',
      createdAt: new Date('2026-09-06T10:00:00Z').getTime(),
    };

    it('สัปดาห์ใหม่จะเริ่มต้นด้วยแมพที่สะอาด (ไม่มีบล็อกค้าง)', () => {
      const roomId = 'test-room-p1';
      localStorage.setItem(`kj_virtual_world_${roomId}_2026-W36`, JSON.stringify([dummyBlock]));
      expect(getLocalWorldBlocks(roomId, '2026-W36')).toHaveLength(1);
      expect(getLocalWorldBlocks(roomId, '2026-W37')).toHaveLength(0);
    });

    it('ฟังก์ชัน clearWorldBlocks สามารถรีเซ็ตล้างบล็อกในสัปดาห์นั้นได้', async () => {
      const roomId = 'test-room-p2';
      const weekKey = '2026-W36';
      localStorage.setItem(`kj_virtual_world_${roomId}_${weekKey}`, JSON.stringify([dummyBlock]));
      expect(getLocalWorldBlocks(roomId, weekKey)).toHaveLength(1);

      await clearWorldBlocks(roomId, weekKey);
      expect(getLocalWorldBlocks(roomId, weekKey)).toHaveLength(0);
      expect(await addWorldBlock(roomId, dummyBlock, weekKey)).toBe(true);
      expect(getLocalWorldBlocks(roomId, weekKey)).toHaveLength(1);
      await removeWorldBlock(roomId, dummyBlock, weekKey);
      expect(getLocalWorldBlocks(roomId, weekKey)).toHaveLength(0);
    });

    it('มีขีดจำกัดจำนวนบล็อกสูงสุดไม่เกิน 1,200 ก้อนเพื่อประสิทธิภาพ', () => {
      expect(MAX_WORLD_BLOCKS).toBe(1200);
    });

    it('รองรับบล็อกวิเศษ/กลไก (switch สลับ ON/OFF และ sign แก้ไขข้อความบนป้าย 3D)', async () => {
      const roomId = 'test-room-magic';
      const weekKey = '2026-W36';
      const switchBlock: WorldBlock = {
        id: 'sw_1',
        x: 1.5,
        y: 0.5,
        z: 1.5,
        material: 'switch',
        ownerId: 'student_1',
        ownerName: 'ด.ช.ก้อง',
        powered: true,
        createdAt: Date.now(),
      };
      const signBlock: WorldBlock = {
        id: 'sign_1',
        x: 2.5,
        y: 0.5,
        z: 1.5,
        material: 'sign',
        ownerId: 'student_1',
        ownerName: 'ด.ช.ก้อง',
        label: '⭐ ผลงานของ ด.ช.ก้อง',
        createdAt: Date.now(),
      };

      await addWorldBlock(roomId, switchBlock, weekKey);
      await addWorldBlock(roomId, signBlock, weekKey);

      const toggled = await updateWorldBlock(roomId, 'sw_1', { powered: false }, weekKey);
      expect(toggled?.powered).toBe(false);

      const renamed = await updateWorldBlock(roomId, 'sign_1', { label: '🏁 เส้นชัย Parkour!' }, weekKey);
      expect(renamed?.label).toBe('🏁 เส้นชัย Parkour!');

      const blocks = getLocalWorldBlocks(roomId, weekKey);
      expect(blocks.find((b) => b.id === 'sw_1')?.powered).toBe(false);
      expect(blocks.find((b) => b.id === 'sign_1')?.label).toBe('🏁 เส้นชัย Parkour!');
    });

    it('รองรับการรันโค้ดสร้างบล็อกเป็นชุด (addWorldBlocksBatch) สำหรับ KruJames Code Builder และแม่แบบวิชาคอม', async () => {
      const roomId = 'test-room-codebuilder';
      const weekKey = '2026-W36';
      const batch: WorldBlock[] = [
        { id: 'cb_1', x: 0.5, y: 0.5, z: 0.5, material: 'wood', ownerId: 'student_1', createdAt: 1 },
        { id: 'cb_2', x: 1.5, y: 1.5, z: 0.5, material: 'lamp', ownerId: 'student_1', createdAt: 2 },
        { id: 'cb_dup', x: 0.5, y: 0.5, z: 0.5, material: 'stone', ownerId: 'student_1', createdAt: 3 },
      ];
      const addedCount = await addWorldBlocksBatch(roomId, batch, weekKey);
      expect(addedCount).toBe(2);
      expect(getLocalWorldBlocks(roomId, weekKey)).toHaveLength(2);
    });
  });

  describe('Multiplayer Presence & Clock-Skew Resilience', () => {
    it('เห็นเพื่อนในห้องเดียวกันได้แม้เวลาเครื่องคอมพิวเตอร์สองเครื่องตั้งวันที่/เดือนต่างกัน (ผ่าน serverSeenAt)', () => {
      const tracker = createPlayerPresenceTracker(PLAYER_PRESENCE_TTL_MS);
      const localNow = new Date('2026-11-18T12:00:00Z').getTime();
      const serverNow = new Date('2026-04-18T12:00:00Z').getTime();
      const friendSkewedClock = new Date('2026-09-15T08:00:00Z').getTime();

      const active = tracker.ingestSnapshot([
        {
          id: 'student_1',
          roomId: 'class-ป1',
          name: 'ด.ช.ก้อง',
          classroom: 'ป.1',
          x: 0,
          y: 0,
          z: 10,
          rotation: 0,
          color: '#2563eb',
          updatedAt: localNow,
          serverSeenAt: { toMillis: () => serverNow },
        },
        {
          id: 'student_2',
          roomId: 'class-ป1',
          name: 'ด.ญ.ฟ้า',
          classroom: 'ป.1',
          x: 1.5,
          y: 0,
          z: 10,
          rotation: 0,
          color: '#e11d48',
          updatedAt: friendSkewedClock,
          serverSeenAt: { toMillis: () => serverNow - 2_000 },
        },
      ], localNow);

      expect(active.map((p) => p.id)).toEqual(['student_1', 'student_2']);
    });

    it('กรองข้อมูลค้างเก่าจากสัปดาห์ก่อนออก แต่รับรู้ผู้เล่นที่ส่งสัญญาณชีพ (heartbeat) ทันทีแม้ไม่มี serverSeenAt', () => {
      const tracker = createPlayerPresenceTracker(PLAYER_PRESENCE_TTL_MS);
      const localNow = new Date('2026-11-18T12:00:00Z').getTime();
      const staleTime = new Date('2026-09-15T08:00:00Z').getTime();

      const first = tracker.ingestSnapshot([
        {
          id: 'stale_ghost',
          roomId: 'class-ป1',
          name: 'ข้อมูลค้าง',
          classroom: 'ป.1',
          x: 0,
          y: 0,
          z: 10,
          rotation: 0,
          color: '#16a34a',
          updatedAt: staleTime,
        },
      ], localNow);
      expect(first).toHaveLength(0);

      const second = tracker.ingestSnapshot([
        {
          id: 'stale_ghost',
          roomId: 'class-ป1',
          name: 'เพื่อนออนไลน์จริงแต่เวลาเครื่องเพี้ยน',
          classroom: 'ป.1',
          x: 1,
          y: 0,
          z: 10,
          rotation: 0,
          color: '#16a34a',
          updatedAt: staleTime + 3_500,
        },
      ], localNow + 3_500);
      expect(second).toHaveLength(1);
      expect(second[0].id).toBe('stale_ghost');
    });
  });
});
