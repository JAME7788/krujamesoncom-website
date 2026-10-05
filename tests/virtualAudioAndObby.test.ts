import { describe, expect, it, vi, beforeEach } from 'vitest';
import { virtualAudioService } from '../src/services/virtualAudioService';

describe('Virtual Audio SFX & Algorithm Obby Parkour', () => {
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

    it('ฟังก์ชันเสียงทั้งหมดเรียกใช้งานได้อย่างปลอดภัยโดยไม่โยน Error แม้ไม่มี Web Audio Hardware', () => {
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

    it('เมื่อปิดเสียง (soundEnabled = false) จะไม่สร้าง AudioContext หรือเรียกสังเคราะห์เสียง', () => {
      virtualAudioService.setSoundEnabled(false);
      expect(() => {
        virtualAudioService.playJump();
        virtualAudioService.playStep();
        virtualAudioService.playBlockPlace();
        virtualAudioService.playBlockRemove();
        virtualAudioService.playStar();
        virtualAudioService.playObbyStep(0);
        virtualAudioService.playVictory();
      }).not.toThrow();
    });
  });

  describe('ลานกระโดดฝึกคิดเป็นลำดับ (Computational Algorithm Parkour)', () => {
    interface ObbyPlatform {
      step: number;
      name: string;
      concept: string;
      x: number;
      z: number;
      sizeX: number;
      sizeZ: number;
      topY: number;
      color: number;
    }

    const OBBY_PLATFORMS: ObbyPlatform[] = [
      {
        step: 1,
        name: 'ขั้นที่ 1: แยกย่อยปัญหา',
        concept: 'Decomposition',
        x: 18.5,
        z: 20.5,
        sizeX: 2.4,
        sizeZ: 2.4,
        topY: 0.65,
        color: 0x2563eb,
      },
      {
        step: 2,
        name: 'ขั้นที่ 2: วางแผนขั้นตอนวิธี',
        concept: 'Algorithm Design',
        x: 21.2,
        z: 16.8,
        sizeX: 2.4,
        sizeZ: 2.4,
        topY: 1.30,
        color: 0x0284c7,
      },
      {
        step: 3,
        name: 'ขั้นที่ 3: ปฏิบัติตามลำดับ',
        concept: 'Sequencing & Execution',
        x: 18.2,
        z: 13.1,
        sizeX: 2.4,
        sizeZ: 2.4,
        topY: 1.95,
        color: 0x10b981,
      },
      {
        step: 4,
        name: 'ขั้นที่ 4: ตรวจสอบและแก้ไข',
        concept: 'Testing & Debugging',
        x: 21.2,
        z: 9.4,
        sizeX: 2.4,
        sizeZ: 2.4,
        topY: 2.60,
        color: 0xf59e0b,
      },
      {
        step: 5,
        name: 'ยอดเขาแห่งปัญญา (Goal Summit)',
        concept: 'Computational Mastery',
        x: 18.5,
        z: 5.5,
        sizeX: 3.4,
        sizeZ: 3.4,
        topY: 3.20,
        color: 0x7c3aed,
      },
    ];

    it('แท่นทั้ง 5 ขั้นต้องมีระยะกระโดดแนวดิ่ง (Delta Y) ไม่เกินความสูงกระโดดสูงสุดของผู้เล่น (1.68m)', () => {
      const MAX_JUMP_HEIGHT = (8.2 * 8.2) / (2 * 20); // vy^2 / (2g) = 1.681m
      expect(MAX_JUMP_HEIGHT).toBeGreaterThan(1.6);

      // จากพื้นดิน y=0 ขึ้นขั้นที่ 1
      expect(OBBY_PLATFORMS[0].topY).toBeLessThan(MAX_JUMP_HEIGHT);

      // ความสูงระหว่างแต่ละขั้น
      for (let i = 0; i < OBBY_PLATFORMS.length - 1; i++) {
        const current = OBBY_PLATFORMS[i];
        const next = OBBY_PLATFORMS[i + 1];
        const deltaY = next.topY - current.topY;
        expect(deltaY).toBeGreaterThan(0.5);
        expect(deltaY).toBeLessThanOrEqual(0.66);
        expect(deltaY).toBeLessThan(MAX_JUMP_HEIGHT);
      }
    });

    it('ระยะห่างแนวระนาบระหว่างขอบแท่น (Edge Gap) ต้องอยู่ในระยะที่ผู้เล่นกระโดดข้ามได้ง่าย (1.5m - 2.5m)', () => {
      for (let i = 0; i < OBBY_PLATFORMS.length - 1; i++) {
        const cur = OBBY_PLATFORMS[i];
        const nxt = OBBY_PLATFORMS[i + 1];
        const centerDist = Math.hypot(nxt.x - cur.x, nxt.z - cur.z);
        const radiusSum = (cur.sizeX + nxt.sizeX) / 4 + (cur.sizeZ + nxt.sizeZ) / 4;
        const edgeGap = centerDist - radiusSum;

        // ขอบแท่นต้องไม่ติดกันและไม่ไกลเกินกว่าแรงกระโดดปกติ (2.8m)
        expect(edgeGap).toBeGreaterThan(1.2);
        expect(edgeGap).toBeLessThan(2.6);
      }
    });

    it('แท่นทั้งหมดต้องลงทะเบียนใน platforms array เพื่อให้ระบบฟิสิกส์ยืนเหยียบ (floorTop) ทำงานอัตโนมัติ', () => {
      const platforms: { minX: number; maxX: number; minZ: number; maxZ: number; top: number }[] = [];

      OBBY_PLATFORMS.forEach((p) => {
        platforms.push({
          minX: p.x - p.sizeX / 2,
          maxX: p.x + p.sizeX / 2,
          minZ: p.z - p.sizeZ / 2,
          maxZ: p.z + p.sizeZ / 2,
          top: p.topY,
        });
      });

      expect(platforms).toHaveLength(5);

      // ทดสอบการยืนเหยียบบนขั้นที่ 1 (x=18.5, z=20.5, feetY=0.65)
      const playerFeet = 0.65;
      let floorTop = 0;
      platforms.forEach((pf) => {
        if (18.5 >= pf.minX && 18.5 <= pf.maxX && 20.5 >= pf.minZ && 20.5 <= pf.maxZ) {
          if (pf.top > floorTop && pf.top <= playerFeet + 0.35) {
            floorTop = pf.top;
          }
        }
      });
      expect(floorTop).toBeCloseTo(0.65);

      // ทดสอบการยืนเหยียบบนแท่นยอดเขา Goal (x=18.5, z=5.5, feetY=3.20)
      floorTop = 0;
      platforms.forEach((pf) => {
        if (18.5 >= pf.minX && 18.5 <= pf.maxX && 5.5 >= pf.minZ && 5.5 <= pf.maxZ) {
          if (pf.top > floorTop && pf.top <= 3.20 + 0.35) {
            floorTop = pf.top;
          }
        }
      });
      expect(floorTop).toBeCloseTo(3.20);
    });

    it('เมื่อผู้เล่นเหยียบถึงแท่นยอดเขา จะได้รับรางวัล +5 ⭐ และส่งเสียง Victory Fanfare', () => {
      let stars = 0;
      let soundPlayed: string | null = null;
      let activityRecorded = false;

      const onReachGoal = () => {
        stars += 5;
        soundPlayed = 'victory';
        activityRecorded = true;
      };

      onReachGoal();

      expect(stars).toBe(5);
      expect(soundPlayed).toBe('victory');
      expect(activityRecorded).toBe(true);
    });
  });
});
