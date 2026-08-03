import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('ความปลอดภัยของการเติมข้อมูลตั้งต้น', () => {
  it('ไม่เขียนทับแบบประเมินรายบุคคลที่ครูยืนยันแล้ว', async () => {
    const source = await readFile('scripts/seed-teaching-system-data.mjs', 'utf8');
    expect(source).toContain("listCollection(rest, 'studentAssessments')");
    expect(source).toContain('savedAssessment?.confirmedByTeacher === true');
    expect(source).toContain('.filter((row) => row.period <= 11)');

    const abilitySync = await readFile('scripts/sync-student-ability-assessments.mjs', 'utf8');
    expect(abilitySync).toContain('const POST_PLAN_COUNT = 11');
    expect(abilitySync).toContain('current?.confirmedByTeacher === true');
  });
});
