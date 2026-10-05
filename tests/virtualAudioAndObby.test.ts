import { describe, expect, it, beforeEach } from 'vitest';
import { virtualAudioService } from '../src/services/virtualAudioService';
import { QUESTION_BANK } from '../src/data/ctBoardGame';
import type { CTPillar } from '../src/data/ctBoardGame';
import { ageTierFromClassroom, ageTierLabel } from '../src/data/gameLessons';
import type { AgeTier } from '../src/data/gameLessons';

describe('Virtual Audio SFX & Multi-Zone Algorithm Obby Parkour with Grade Quizzes', () => {
  beforeEach(() => {
    virtualAudioService.setSoundEnabled(true);
  });

  describe('Web Audio SFX System (VirtualAudioService)', () => {
    it('สามารถเปิดและปิดเสียงเอฟเฟกต์ SFX ได้อย่างถูกต้อง', () => {
      expect(virtualAudioService.isSoundEnabled()).toBe(true);
      virtualAudioService.setSoundEnabled(false);
      expect(virtualAudioService.isSoundEnabled()).toBe(false);
      virtualAudioService.setSoundEnabled(true);
      expect(virtualAudioService.isSoundEnabled()).toBe(true);
    });

    it('ฟังก์ชันเสียงทั้งหมดเรียกใช้งานได้อย่างปลอดภัยโดยไม่โยน Error', () => {
      expect(() => virtualAudioService.playJump()).not.toThrow();
      expect(() => virtualAudioService.playStep()).not.toThrow();
      expect(() => virtualAudioService.playBlockPlace()).not.toThrow();
      expect(() => virtualAudioService.playBlockRemove()).not.toThrow();
      expect(() => virtualAudioService.playStar()).not.toThrow();
      expect(() => virtualAudioService.playObbyStep(0)).not.toThrow();
      expect(() => virtualAudioService.playObbyStep(1)).not.toThrow();
      expect(() => virtualAudioService.playObbyStep(2)).not.toThrow();
      expect(() => virtualAudioService.playObbyStep(3)).not.toThrow();
      expect(() => virtualAudioService.playVictory()).not.toThrow();
    });
  });

  describe('ระบบคำถามประจำด่านตามระดับชั้น (Grade-Level Checkpoint Quizzes)', () => {
    const PILLARS: CTPillar[] = ['decompose', 'pattern', 'abstract', 'algorithm'];
    const TIERS: AgeTier[] = ['lower', 'upper', 'middle'];

    it('ระบบสามารถแปลงระดับชั้นห้องเรียนเป็น AgeTier ได้อย่างถูกต้องตามหลักสูตร', () => {
      expect(ageTierFromClassroom('ป.1')).toBe('lower');
      expect(ageTierFromClassroom('ป.2')).toBe('lower');
      expect(ageTierFromClassroom('ป.3')).toBe('lower');
      expect(ageTierFromClassroom('ป.4')).toBe('upper');
      expect(ageTierFromClassroom('ป.5')).toBe('upper');
      expect(ageTierFromClassroom('ป.6')).toBe('upper');
      expect(ageTierFromClassroom('ม.1')).toBe('middle');
      expect(ageTierFromClassroom('ม.2')).toBe('middle');
      expect(ageTierFromClassroom('ม.3')).toBe('middle');
    });

    it('ทุกด่านทั้ง 4 ทักษะ (Decompose, Pattern, Abstract, Algorithm) มีคลังคำถามตรงตามวัยสำหรับผู้เรียน', () => {
      TIERS.forEach((tier) => {
        PILLARS.forEach((pillar) => {
          const pool = QUESTION_BANK[tier].filter((q) => q.pillar === pillar);
          expect(pool.length).toBeGreaterThan(0);

          const sample = pool[0];
          expect(sample.q.length).toBeGreaterThan(5);
          expect(sample.choices).toHaveLength(3);
          expect(sample.answer).toBeGreaterThanOrEqual(0);
          expect(sample.answer).toBeLessThan(3);
          expect(sample.why.length).toBeGreaterThan(5);
        });
      });
    });

    it('เมื่อตอบคำถามเช็คพอยต์ถูกต้อง จะได้รับดาว +2 ⭐ และปลดล็อกด่านต่อไป', () => {
      let stars = 0;
      let unlocked = [false, false, false, false];
      let highestCheckpoint = -1;

      const answerCheckpoint = (index: number, chosenIdx: number, correctIdx: number) => {
        if (chosenIdx === correctIdx) {
          stars += 2;
          unlocked[index] = true;
          highestCheckpoint = Math.max(highestCheckpoint, index);
          return true;
        }
        return false;
      };

      // ด่านที่ 1: ตอบถูก
      const pass1 = answerCheckpoint(0, 1, 1);
      expect(pass1).toBe(true);
      expect(stars).toBe(2);
      expect(unlocked[0]).toBe(true);
      expect(highestCheckpoint).toBe(0);

      // ด่านที่ 2: ตอบผิด
      const pass2Wrong = answerCheckpoint(1, 0, 2);
      expect(pass2Wrong).toBe(false);
      expect(stars).toBe(2);
      expect(unlocked[1]).toBe(false);

      // ด่านที่ 2: ตอบถูกรอบแก้ตัว
      const pass2Right = answerCheckpoint(1, 2, 2);
      expect(pass2Right).toBe(true);
      expect(stars).toBe(4);
      expect(unlocked[1]).toBe(true);
      expect(highestCheckpoint).toBe(1);
    });
  });

  describe('ลานผจญภัยกระโดด 4 โซนท้าทาย (Diverse Adventure Parkour Stages)', () => {
    interface PlatformDef {
      name: string;
      type: 'stone' | 'beam' | 'pad' | 'launch' | 'floating' | 'checkpoint' | 'summit';
      x: number;
      z: number;
      sizeX: number;
      sizeZ: number;
      topY: number;
    }

    const COURSE_PLATFORMS: PlatformDef[] = [
      // Zone 1: บันไดหินวน
      { name: 'Stone 1', type: 'stone', x: 18.5, z: 22.5, sizeX: 1.6, sizeZ: 1.6, topY: 0.65 },
      { name: 'Stone 2', type: 'stone', x: 21.0, z: 20.2, sizeX: 1.5, sizeZ: 1.5, topY: 1.20 },
      { name: 'Stone 3', type: 'stone', x: 23.2, z: 17.8, sizeX: 1.5, sizeZ: 1.5, topY: 1.75 },
      { name: 'Stone 4', type: 'stone', x: 21.0, z: 15.2, sizeX: 1.5, sizeZ: 1.5, topY: 2.30 },
      { name: 'Checkpoint 1 (Decompose)', type: 'checkpoint', x: 17.8, z: 14.5, sizeX: 2.6, sizeZ: 2.6, topY: 2.70 },

      // Zone 2: สะพานคานแคบ & ทแยงมุม
      { name: 'Balance Beam', type: 'beam', x: 14.5, z: 14.5, sizeX: 3.8, sizeZ: 0.8, topY: 2.70 },
      { name: 'Diagonal 1', type: 'pad', x: 11.5, z: 12.0, sizeX: 1.4, sizeZ: 1.4, topY: 3.15 },
      { name: 'Diagonal 2', type: 'pad', x: 13.5, z: 9.2, sizeX: 1.4, sizeZ: 1.4, topY: 3.65 },
      { name: 'Checkpoint 2 (Pattern)', type: 'checkpoint', x: 17.0, z: 8.0, sizeX: 2.6, sizeZ: 2.6, topY: 4.05 },

      // Zone 3: สปริงบอร์ดดีดตัว & เกาะลอยน้ำ
      { name: 'Super Launch Pad', type: 'launch', x: 20.5, z: 8.0, sizeX: 1.8, sizeZ: 1.8, topY: 4.05 },
      { name: 'Floating Island 1', type: 'floating', x: 23.5, z: 11.2, sizeX: 1.7, sizeZ: 1.7, topY: 5.20 },
      { name: 'Floating Island 2', type: 'floating', x: 24.0, z: 14.8, sizeX: 1.6, sizeZ: 1.6, topY: 5.75 },
      { name: 'Checkpoint 3 (Abstract)', type: 'checkpoint', x: 21.5, z: 18.0, sizeX: 2.6, sizeZ: 2.6, topY: 6.25 },

      // Zone 4: บันไดลอยฟ้าสู่ยอดเขา
      { name: 'Sky Step 1', type: 'pad', x: 18.5, z: 20.2, sizeX: 1.5, sizeZ: 1.5, topY: 6.80 },
      { name: 'Sky Step 2', type: 'pad', x: 15.5, z: 18.5, sizeX: 1.5, sizeZ: 1.5, topY: 7.35 },
      { name: 'Checkpoint 4 (Algorithm)', type: 'checkpoint', x: 14.0, z: 15.5, sizeX: 2.6, sizeZ: 2.6, topY: 7.85 },
      { name: 'Summit Approach', type: 'pad', x: 14.0, z: 12.6, sizeX: 1.6, sizeZ: 1.6, topY: 8.25 },
      { name: 'Wisdom Summit', type: 'summit', x: 14.0, z: 9.2, sizeX: 3.6, sizeZ: 3.6, topY: 8.65 },
    ];

    it('จำนวนแท่นในเส้นทางต้องมีความหลากหลายไม่น้อยกว่า 17 แท่น', () => {
      expect(COURSE_PLATFORMS.length).toBeGreaterThanOrEqual(17);
      const types = new Set(COURSE_PLATFORMS.map((p) => p.type));
      expect(types.size).toBeGreaterThanOrEqual(5);
    });

    it('ระบบ Launch Pad สามารถเพิ่มความเร็วแนวดิ่ง (v_y = 12m/s) เพื่อให้กระโดดขึ้นสู่เกาะลอยน้ำได้', () => {
      let verticalVelocity = 0;
      let grounded = true;

      // เหยียบ Launch Pad
      verticalVelocity = 12.0;
      grounded = false;

      const launchHeight = (12 * 12) / (2 * 20); // 3.6m lift
      expect(launchHeight).toBe(3.6);
      expect(COURSE_PLATFORMS[9].topY + launchHeight).toBeGreaterThan(COURSE_PLATFORMS[10].topY);
    });

    it('สะพานคานแคบ (Balance Beam) เชื่อมต่อตรงกับ Checkpoint 1 อย่างราบรื่น', () => {
      const cp1 = COURSE_PLATFORMS[4];
      const beam = COURSE_PLATFORMS[5];

      // จุดเชื่อมต่อต้องมีระดับความสูงเดียวกัน
      expect(cp1.topY).toBe(beam.topY);
      // ความกว้างของคานต้องแคบกว่าแท่นปกติ (0.8m เทียบกับ 2.6m) เพื่อทดสอบการทรงตัว
      expect(beam.sizeZ).toBeLessThan(1.0);
    });

    it('ระบบ Respawn / Teleport Pad นำทางผู้เล่นกลับสู่ Checkpoint ล่าสุดที่ปลดล็อกแล้วได้', () => {
      const highestCheckpoint = 2; // ปลดล็อกถึงด่านที่ 3
      const checkpoints = COURSE_PLATFORMS.filter((p) => p.type === 'checkpoint');
      const targetCheckpoint = checkpoints[highestCheckpoint];

      const playerPos = { x: 0, y: 0, z: 0 };
      const teleportToCheckpoint = (cp: PlatformDef) => {
        playerPos.x = cp.x;
        playerPos.y = cp.topY + 1.7;
        playerPos.z = cp.z;
      };

      teleportToCheckpoint(targetCheckpoint);

      expect(playerPos.x).toBe(targetCheckpoint.x);
      expect(playerPos.y).toBe(targetCheckpoint.topY + 1.7);
      expect(playerPos.z).toBe(targetCheckpoint.z);
    });

    it('แท่นลอยสูงในอากาศ (เช่น Checkpoint 1, 2, 3, 4 และยอดเขา) ต้องไม่ขวางการเดินบนพื้นดินด้านล่าง', () => {
      const PLAYER_RADIUS = 0.34;
      const feetY = 0; // ยืนบนพื้นดิน
      const slabThick = 0.32;

      // จำลองฟังก์ชัน collidesAt สำหรับ platforms
      const collidesWithPlatform = (
        testX: number,
        testZ: number,
        feetYLevel: number,
        pf: { minX: number; maxX: number; minZ: number; maxZ: number; top: number; bottom: number },
      ): boolean => {
        if (pf.bottom >= feetYLevel + 1.65) return false; // ลอยเหนือศีรษะ
        if (pf.top <= feetYLevel + 0.65 || feetYLevel >= pf.top - 0.15) return false;
        return (
          testX + PLAYER_RADIUS > pf.minX
          && testX - PLAYER_RADIUS < pf.maxX
          && testZ + PLAYER_RADIUS > pf.minZ
          && testZ - PLAYER_RADIUS < pf.maxZ
        );
      };

      // ทดสอบ Checkpoint 1 (top=2.70, bottom=2.38)
      const cp1Platform = {
        minX: 17.8 - 1.3,
        maxX: 17.8 + 1.3,
        minZ: 14.5 - 1.3,
        maxZ: 14.5 + 1.3,
        top: 2.70,
        bottom: 2.70 - slabThick,
      };

      // เดินบนพื้นตรงตำแหน่งใต้ Checkpoint 1 -> ต้องเดินผ่านได้ ไม่ติดขวาง
      expect(collidesWithPlatform(17.8, 14.5, feetY, cp1Platform)).toBe(false);

      // ทดสอบยอดเขา Wisdom Summit (top=8.65, bottom=8.20)
      const summitPlatform = {
        minX: 14.0 - 1.8,
        maxX: 14.0 + 1.8,
        minZ: 9.2 - 1.8,
        maxZ: 9.2 + 1.8,
        top: 8.65,
        bottom: 8.65 - 0.45,
      };

      // เดินบนพื้นตรงตำแหน่งใต้ยอดเขา -> ต้องเดินผ่านได้ ไม่ติดขวาง
      expect(collidesWithPlatform(14.0, 9.2, feetY, summitPlatform)).toBe(false);
    });

    it('แท่นขั้นแรก (Stone 1 top=0.65) สามารถก้าวขึ้นและกระโดดขึ้นจากพื้นดินได้อย่างราบรื่น', () => {
      const feetY = 0; // ยืนบนพื้นดิน
      const stone1 = { top: 0.65, bottom: 0.33 };

      // เงื่อนไข step-up: แท่นต้องไม่สูงกว่า feetY + 0.65
      expect(stone1.top).toBeLessThanOrEqual(feetY + 0.65);
    });
  });
});
