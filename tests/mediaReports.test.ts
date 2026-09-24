import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync } from 'node:fs';
import {
  DEFAULT_MEDIA_REPORTS,
  loadMediaReports,
  saveMediaReports,
  resetMediaReports,
  type MediaReportItem,
} from '../src/data/mediaReportsData';

// Mock localStorage for node test runner
const store: Record<string, string> = {};
const mockLocalStorage = {
  getItem: (key: string) => store[key] || null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { Object.keys(store).forEach(k => delete store[k]); },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('ระบบแบบบันทึกข้อมูลการผลิตสื่อการสอน (Canva A4 Style)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('มีข้อมูลสื่อเริ่มต้นมากกว่า 100 รายการ และมีสื่อจาก Canva ครบ 62 หน้าตามแม่แบบ', () => {
    expect(DEFAULT_MEDIA_REPORTS.length).toBeGreaterThanOrEqual(100);
    const canvaItems = DEFAULT_MEDIA_REPORTS.filter((m) => m.category === 'canva-slide');
    expect(canvaItems.length).toBe(62);
  });

  it('มีรายการสื่อเกมสไลด์และโครงงานนวัตกรรมจาก Canva ครบถ้วน', () => {
    const robot = DEFAULT_MEDIA_REPORTS.find((m) => m.id === 'canva-hardware-robot');
    const chicken = DEFAULT_MEDIA_REPORTS.find((m) => m.id === 'canva-pseudocode-chicken');
    const circuit = DEFAULT_MEDIA_REPORTS.find((m) => m.id === 'canva-circuit-project');
    const boardgame = DEFAULT_MEDIA_REPORTS.find((m) => m.id === 'canva-boardgame-ar');
    const pandan = DEFAULT_MEDIA_REPORTS.find((m) => m.id === 'canva-pandan-project');
    const plc = DEFAULT_MEDIA_REPORTS.find((m) => m.id === 'canva-plc-learning');

    expect(robot).toBeDefined();
    expect(robot?.title).toContain('สื่ออุปกรณ์คอมพิวเตอร์และฮาร์ดแวร์');
    expect(robot?.author).toBe('นายอนันตชัย เพ็ชรรี่');
    expect(robot?.category).toBe('canva-slide');

    expect(chicken).toBeDefined();
    expect(chicken?.title).toContain('รหัสลำลอง');
    expect(chicken?.author).toBe('นายอนันตชัย เพ็ชรรี่');
    expect(chicken?.category).toBe('canva-slide');

    expect(circuit).toBeDefined();
    expect(circuit?.title).toContain('วงจรไฟฟ้า');

    expect(boardgame).toBeDefined();
    expect(boardgame?.title).toContain('บอร์ดเกม');
    expect(boardgame?.title).toContain('AR');

    expect(pandan).toBeDefined();
    expect(pandan?.title).toContain('ใบเตย');

    expect(plc).toBeDefined();
    expect(plc?.title).toContain('PLC');
  });

  it('รายการ Canva ทั้ง 62 หน้าต้องใช้ภาพจริงเฉพาะหน้าที่มีไฟล์อยู่ครบ', () => {
    const canvaItems = DEFAULT_MEDIA_REPORTS.filter((m) => m.category === 'canva-slide');
    const imageUrls = canvaItems.map((m) => m.imageUrl);

    expect(imageUrls).toHaveLength(62);
    expect(new Set(imageUrls).size).toBe(62);
    imageUrls.forEach((imageUrl, index) => {
      expect(imageUrl).toBe(`/media/reports/canva/page-${String(index + 1).padStart(2, '0')}.webp`);
      expect(existsSync(`public${imageUrl}`)).toBe(true);
    });

    expect(existsSync('public/media/reports/banner_kids.png')).toBe(true);
  });

  it('สื่อเกมทั้ง 36 เกมต้องใช้ภาพหน้าจอจริงเฉพาะเกมและมีไฟล์อยู่ครบ', () => {
    const gameItems = DEFAULT_MEDIA_REPORTS.filter((m) => m.category === 'digital-game');
    const imageUrls = gameItems.map((m) => m.imageUrl);

    expect(gameItems).toHaveLength(36);
    expect(new Set(imageUrls).size).toBe(36);
    imageUrls.forEach((imageUrl) => {
      expect(imageUrl).toMatch(/^\/media\/reports\/games\/[a-z0-9-]+\.webp$/);
      expect(existsSync(`public${imageUrl}`)).toBe(true);
    });
  });

  it('มีไฟล์ Word A4 รวม Canva 62 รายการและเกม 36 เกมพร้อมดาวน์โหลด', () => {
    const wordBundle = 'public/downloads/media-use-record-school-template-98.docx';
    expect(existsSync(wordBundle)).toBe(true);
  });

  it('ทุกรายการสื่อต้องมี id ไม่ซ้ำกัน และกรอกข้อมูลฟิลด์สำคัญครบถ้วน', () => {
    const ids = DEFAULT_MEDIA_REPORTS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);

    const incomplete = DEFAULT_MEDIA_REPORTS.filter(
      (m) => !m.title?.trim() || !m.author?.trim() || !m.subject?.trim() || !m.usageInstructions?.trim() || !m.imageUrl?.trim()
    );
    expect(incomplete.map((m) => m.id)).toEqual([]);
  });

  it('ฟังก์ชัน loadMediaReports, saveMediaReports และ resetMediaReports ทำงานถูกต้อง', () => {
    // 1. Initial load should return default
    const initial = loadMediaReports();
    expect(initial.length).toBe(DEFAULT_MEDIA_REPORTS.length);

    // 2. Save custom item (merges with default items)
    const customItem: MediaReportItem = {
      id: 'custom-test-1',
      title: 'สื่อทดสอบการสอน',
      author: 'ครูเจมส์',
      dateCreated: '23 กันยายน 2569',
      learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
      subject: 'วิทยาการคำนวณ',
      gradeLevel: 'ป.1',
      imageUrl: '/media/reports/photo_robot.png',
      usageInstructions: 'ทดสอบการทำงาน',
      category: 'custom',
    };
    saveMediaReports([customItem]);

    const loaded = loadMediaReports();
    expect(loaded.length).toBe(DEFAULT_MEDIA_REPORTS.length + 1);
    expect(loaded[0].id).toBe('custom-test-1');

    // 3. Reset
    const reset = resetMediaReports();
    expect(reset.length).toBe(DEFAULT_MEDIA_REPORTS.length);
    expect(loadMediaReports().length).toBe(DEFAULT_MEDIA_REPORTS.length);
  });
});
