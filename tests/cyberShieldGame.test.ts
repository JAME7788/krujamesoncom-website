import { describe, it, expect } from 'vitest';
import {
  MISSION_LEVELS,
  TOWER_CONFIGS,
  THREAT_CONFIGS,
  type TowerType,
  type ThreatType,
} from '../src/pages/games/cyberShieldData';

describe('เกม 🛡️ Cyber Shield (CyberShieldGame)', () => {
  describe('ภารกิจและด่าน (Mission Levels)', () => {
    it('มีภารกิจครบทั้ง 8 ด่าน', () => {
      expect(MISSION_LEVELS.length).toBe(8);
      MISSION_LEVELS.forEach((level, idx) => {
        expect(level.id).toBe(idx + 1);
        expect(level.title).toBeTruthy();
        expect(level.subtitle).toBeTruthy();
        expect(level.location).toBeTruthy();
        expect(level.story).toBeTruthy();
        expect(level.initialBandwidth).toBeGreaterThanOrEqual(200);
      });
    });

    it('ทุกด่านมีเส้นทางสายเคเบิล (pathPoints) และจุดติดตั้งป้อม (mapNodes) ครบถ้วน', () => {
      MISSION_LEVELS.forEach((level) => {
        expect(level.pathPoints.length).toBeGreaterThanOrEqual(3);
        expect(level.mapNodes.length).toBeGreaterThanOrEqual(4);

        // จุดเริ่มต้นต้องอยู่ฝั่งซ้าย (Internet Gateway)
        expect(level.pathPoints[0].x).toBeLessThan(100);
        // จุดปลายทางต้องอยู่ฝั่งขวา (School Server)
        expect(level.pathPoints[level.pathPoints.length - 1].x).toBeGreaterThan(600);

        // พิกัดต้องอยู่ภายในจอจำลอง 700x450
        level.pathPoints.forEach((pt) => {
          expect(pt.x).toBeGreaterThanOrEqual(0);
          expect(pt.x).toBeLessThanOrEqual(700);
          expect(pt.y).toBeGreaterThanOrEqual(0);
          expect(pt.y).toBeLessThanOrEqual(450);
        });

        level.mapNodes.forEach((node) => {
          expect(node.x).toBeGreaterThanOrEqual(0);
          expect(node.x).toBeLessThanOrEqual(700);
          expect(node.y).toBeGreaterThanOrEqual(0);
          expect(node.y).toBeLessThanOrEqual(450);
        });
      });
    });

    it('ทุกด่านมีคลื่นภัยคุกคาม (waves) อย่างน้อย 3 เวฟ และทุกกลุ่มมีศัตรูที่กำหนดไว้ใน THREAT_CONFIGS', () => {
      const validThreatTypes = Object.keys(THREAT_CONFIGS) as ThreatType[];

      MISSION_LEVELS.forEach((level) => {
        expect(level.waves.length).toBeGreaterThanOrEqual(3);
        level.waves.forEach((wave, wIdx) => {
          expect(wave.threats.length).toBeGreaterThanOrEqual(1);
          wave.threats.forEach((group) => {
            expect(validThreatTypes).toContain(group.type);
            expect(group.count).toBeGreaterThan(0);
            expect(group.intervalSeconds).toBeGreaterThan(0);
          });
        });
      });
    });

    it('ทุกด่านมี Cyber Briefing Question ที่ถูกต้องและมีคำอธิบาย', () => {
      MISSION_LEVELS.forEach((level) => {
        const b = level.briefing;
        expect(b.question).toBeTruthy();
        expect(b.options.length).toBe(4);
        expect(b.correctIndex).toBeGreaterThanOrEqual(0);
        expect(b.correctIndex).toBeLessThan(4);
        expect(b.explanation).toBeTruthy();
        expect(b.bonusBandwidth).toBeGreaterThanOrEqual(50);
      });
    });
  });

  describe('ภัยคุกคามไซเบอร์ (Threats Config)', () => {
    it('มีภัยคุกคามครบทั้ง 5 ชนิด', () => {
      const types: ThreatType[] = ['malware', 'phishing', 'ransomware', 'spyware', 'ddos'];
      types.forEach((t) => {
        const conf = THREAT_CONFIGS[t];
        expect(conf).toBeDefined();
        expect(conf.name).toBeTruthy();
        expect(conf.emoji).toBeTruthy();
        expect(conf.maxHp).toBeGreaterThan(0);
        expect(conf.speed).toBeGreaterThan(0);
        expect(conf.reward).toBeGreaterThan(0);
        expect(conf.serverDamage).toBeGreaterThan(0);
        expect(conf.color).toMatch(/^#[0-9a-f]{3,6}$/i);
      });
    });

    it('สมดุลของภัยคุกคาม: Ransomware มี HP สูงที่สุด, Phishing มีความเร็วสูง', () => {
      expect(THREAT_CONFIGS.ransomware.maxHp).toBeGreaterThan(THREAT_CONFIGS.malware.maxHp);
      expect(THREAT_CONFIGS.phishing.speed).toBeGreaterThan(THREAT_CONFIGS.malware.speed);
      expect(THREAT_CONFIGS.ransomware.serverDamage).toBeGreaterThan(THREAT_CONFIGS.ddos.serverDamage);
    });
  });

  describe('ป้อมปราการเครือข่าย (Tower Config)', () => {
    it('มีป้อมป้องกันครบทั้ง 5 ประเภท', () => {
      const towers: TowerType[] = ['firewall', 'antivirus', 'encryption', 'twofa', 'cloudbackup'];
      towers.forEach((t) => {
        const conf = TOWER_CONFIGS[t];
        expect(conf).toBeDefined();
        expect(conf.name).toBeTruthy();
        expect(conf.emoji).toBeTruthy();
        expect(conf.cost).toBeGreaterThan(0);
        expect(conf.upgradeCost).toBeGreaterThan(0);
        expect(conf.range).toBeGreaterThan(0);
        expect(conf.fireRate).toBeGreaterThan(0);
        expect(conf.color).toMatch(/^#[0-9a-f]{3,6}$/i);
        expect(conf.special).toBeTruthy();
      });
    });

    it('สมดุลของป้อม: Firewall ราคาเริ่มต้นเข้าถึงง่าย, 2FA ดาเมจสูงสุด, Backup ช่วยฟื้นฟู', () => {
      expect(TOWER_CONFIGS.firewall.cost).toBeLessThanOrEqual(100);
      expect(TOWER_CONFIGS.twofa.damage).toBeGreaterThan(TOWER_CONFIGS.antivirus.damage);
      expect(TOWER_CONFIGS.cloudbackup.damage).toBe(0); // Support tower
    });
  });
});
