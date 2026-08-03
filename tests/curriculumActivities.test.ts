import { describe, expect, it } from 'vitest';
import { grades } from '../src/data/curriculum';

describe('กิจกรรมประจำหน่วย', () => {
  it('ทุกหน่วยทุกวิชาต้องมีกิจกรรมพร้อมใช้ไม่น้อยกว่า 3 กิจกรรม', () => {
    grades.forEach((grade) => {
      grade.units.forEach((unit) => {
        expect(
          unit.activities?.length || 0,
          `${grade.id} หน่วย ${unit.no} (${unit.title}) ยังมีกิจกรรมไม่ครบ`,
        ).toBeGreaterThanOrEqual(3);
      });
    });
  });
});
