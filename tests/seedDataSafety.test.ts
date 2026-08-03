import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('ความปลอดภัยของการเติมข้อมูลตั้งต้น', () => {
  it('ไม่เขียนทับแบบประเมินรายบุคคลที่ครูยืนยันแล้ว', async () => {
    const source = await readFile('scripts/seed-teaching-system-data.mjs', 'utf8');
    expect(source).toContain("listCollection(rest, 'studentAssessments')");
    expect(source).toContain('savedAssessment?.confirmedByTeacher === true');
  });
});
