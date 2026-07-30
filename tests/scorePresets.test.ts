import { describe, expect, it } from 'vitest';
import { calculatePresetScore } from '../src/utils/scorePresets';

describe('ปุ่มคะแนนสำเร็จรูป', () => {
  it('ใช้คะแนนเต็มตามที่กำหนด', () => {
    expect(calculatePresetScore(15, 1)).toBe(15);
    expect(calculatePresetScore(10, 1)).toBe(10);
  });

  it('คำนวณร้อยละ 50 และปัดเป็นจำนวนเต็ม', () => {
    expect(calculatePresetScore(15, 0.5)).toBe(8);
    expect(calculatePresetScore(10, 0.5)).toBe(5);
  });

  it('หักร้อยละ 20 สำหรับระดับปานกลางและปัดเป็นจำนวนเต็ม', () => {
    expect(calculatePresetScore(15, 0.8)).toBe(12);
    expect(calculatePresetScore(10, 0.8)).toBe(8);
  });

  it('ไม่สร้างคะแนนติดลบหรือเกินคะแนนเต็ม', () => {
    expect(calculatePresetScore(-10, 0.5)).toBe(0);
    expect(calculatePresetScore(Number.NaN, 1)).toBe(0);
  });
});
