import { describe, expect, it } from 'vitest';
import { grades } from '../src/data/curriculum';
import {
  getPrimaryTechnologyPlan,
  primaryTechnologyCompetencyPlans,
} from '../src/data/primaryTechnologyCompetencyPlans';
import { buildPrimaryTechnologyPlanDocumentHtml } from '../src/utils/primaryTechnologyPlanDocument';

describe('primary technology course descriptions and official plans', () => {
  it('provides a formal, grade-specific technology description for P.1-P.6', () => {
    const primaryGrades = grades.filter((grade) => /^p[1-6]$/.test(grade.id));

    expect(primaryGrades).toHaveLength(6);
    primaryGrades.forEach((grade) => {
      const profile = grade.technologyProfile;
      expect(profile).toBeDefined();
      expect(profile?.source).toContain(`ป.${grade.id.slice(1)}`);
      expect(profile?.courseDescription.length).toBeGreaterThan(250);
      expect(profile?.focus.length).toBeGreaterThanOrEqual(4);
      expect(profile?.learningOutcomes.length).toBeGreaterThanOrEqual(3);
      expect(profile?.assessmentEvidence.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('builds the supplied official header structure for every primary grade', () => {
    expect(primaryTechnologyCompetencyPlans).toHaveLength(6);

    primaryTechnologyCompetencyPlans.forEach((plan, index) => {
      const html = buildPrimaryTechnologyPlanDocumentHtml(getPrimaryTechnologyPlan(plan.grade));
      const gradeNo = index + 1;

      expect(html).toContain('แผนการจัดการเรียนรู้ที่ 1');
      expect(html).toContain(`รายวิชาเทคโนโลยี (วิทยาการคำนวณ) รหัสวิชา ว1${gradeNo}101`);
      expect(html).toContain(`ชั้นประถมศึกษาปีที่ ${gradeNo}`);
      expect(html).toContain('กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี');
      expect(html).toContain('ภาคเรียนที่ 1 ปีการศึกษา');
      expect(html).toContain('หน่วยการเรียนรู้ที่ 1');
      expect(html).toContain(`เรื่อง ${plan.title}`);
      expect(html).toContain('ครูผู้สอน');
      expect(html).toContain('วันที่สอน');
      expect(html).toContain('คำอธิบายรายวิชาเทคโนโลยี');
    });
  });
});
