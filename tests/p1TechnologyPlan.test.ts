import { describe, expect, it } from 'vitest';
import {
  getP1HourlySessions,
  p1AnnualUnits,
  p1LessonPlans,
  p1TechnologyCourse,
} from '../src/data/p1TechnologyPlan';
import { buildP1TechnologyPlanDocumentHtml } from '../src/utils/p1TechnologyPlanDocument';
import type { LessonRecord } from '../src/services/lessonRecordService';

describe('P.1 hourly technology lesson plans', () => {
  it('contains 40 unique plans for 40 teaching periods', () => {
    expect(p1LessonPlans).toHaveLength(p1TechnologyCourse.totalPeriods);
    expect(new Set(p1LessonPlans.map((plan) => plan.title)).size).toBe(40);
    expect(p1LessonPlans.map((plan) => plan.no)).toEqual(
      Array.from({ length: 40 }, (_, index) => index + 1),
    );
  });

  it.each(p1LessonPlans)('plan $no is a complete 50-minute plan', (plan) => {
    expect(plan.hours).toBe(1);
    expect(plan.weeks).toBe(String(plan.no));
    expect(plan.steps).toHaveLength(5);
    expect(plan.steps.reduce((sum, step) => sum + step.minutes, 0)).toBe(
      p1TechnologyCourse.periodMinutes,
    );
    expect(plan.objectives.map((objective) => objective.domain)).toEqual(['K', 'P', 'A']);
    expect(plan.assessments.map((assessment) => assessment.domain)).toEqual(['K', 'P', 'A']);
    expect(plan.checkQuestions).toHaveLength(3);
    expect(plan.worksheet.length).toBeGreaterThan(10);
    expect(plan.product.length).toBeGreaterThan(10);

    const sessions = getP1HourlySessions(plan);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].minutes).toBe(p1TechnologyCourse.periodMinutes);
  });

  it('maps annual units to all 40 lesson plans without gaps', () => {
    expect(p1AnnualUnits.map((unit) => unit.plans)).toEqual([
      '1-12',
      '13-24',
      '25-36',
      '37-40',
    ]);
    expect(p1AnnualUnits.reduce((sum, unit) => sum + unit.hours, 0)).toBe(40);
  });

  it('exports all 40 plans with the supplied official header', () => {
    const html = buildP1TechnologyPlanDocumentHtml();

    expect(html.match(/แผนการจัดการเรียนรู้ที่ \d+/g)).toHaveLength(40);
    expect(html).toContain('แผนการจัดการเรียนรู้ที่ 1');
    expect(html).toContain('แผนการจัดการเรียนรู้ที่ 40');
    expect(html).toContain('รายวิชาเทคโนโลยี (วิทยาการคำนวณ) รหัสวิชา ว11101');
    expect(html).toContain('ชั้นประถมศึกษาปีที่ 1');
    expect(html).toContain('ภาคเรียนที่ 1 ปีการศึกษา 2569');
    expect(html).toContain('ภาคเรียนที่ 2 ปีการศึกษา 2569');
    expect(html).toContain('เวลา 1 ชั่วโมง');
    expect(html).toContain('วันที่สอน ......./........./...........');
    expect(html.match(/ผลลัพธ์การเรียนรู้ข้อ 5/g)).toHaveLength(40);
    expect(html.match(new RegExp(p1TechnologyCourse.learningOutcome5, 'g'))).toHaveLength(40);
    expect(html).toContain('5. รูปแบบการสอน / วิธีการสอน');
    expect(html).toContain('7. ทักษะ 4 Cs');
    expect(html).toContain('11. การวัดและการประเมินผล');
    expect(html).toContain('12. เกณฑ์การให้คะแนน');
    expect(html).toContain('13. แบบสังเกตพฤติกรรมของนักเรียน');
    expect(html).toContain('14. แบบประเมินใบงานและชิ้นงาน');
    expect(html).toContain('15. บันทึกหลังสอน');
    expect(html).toContain('font-family:"TH SarabunPSK"');
    expect(html).toContain('margin: 2.54cm');
  });

  it('exports saved post-teaching records inside the same Word document', () => {
    const record: LessonRecord = {
      id: 'p1-plan-1-hour-1-2026-05-07',
      classroom: 'ป.1',
      subject: 'main',
      courseName: 'เทคโนโลยี (วิทยาการคำนวณ)',
      planNo: 1,
      hourNo: 1,
      teachingDate: '2026-05-07',
      indicatorCodes: ['ว 4.2 ป.1/1'],
      snapshot: { present: 10, absent: 1, totalStudents: 11, passed: 9, averageK: 12, averageP: 24, attitudePassed: 10 },
      totalStudents: 11,
      passedCount: 9,
      failedCount: 2,
      summary: 'ผู้เรียนทำกิจกรรมตามลำดับและผ่านจุดประสงค์ส่วนใหญ่',
      strengths: 'ผู้เรียนช่วยกันอธิบายขั้นตอนได้ชัดเจน',
      problems: 'นักเรียนบางคนยังสลับลำดับ',
      causes: 'ต้องฝึกอ่านภาพสัญลักษณ์เพิ่ม',
      improvements: 'เพิ่มบัตรภาพและฝึกเรียงทีละขั้น',
      nextAction: 'ทบทวนก่อนเริ่มคาบถัดไป',
      teacherName: 'นายอนันตชัย เพ็ชรรี่',
      status: 'complete',
      createdAt: 1,
      updatedAt: 2,
    };

    const html = buildP1TechnologyPlanDocumentHtml([record]);

    expect(html).toContain('วันที่สอน 07/05/2026');
    expect(html).toContain('บันทึกสมบูรณ์');
    expect(html).toContain('9 คน<br>ร้อยละ 81.8');
    expect(html).toContain(record.summary);
    expect(html).toContain(record.nextAction);
    expect(html.match(/ยังไม่มีบันทึกหลังสอนในระบบ/g)).toHaveLength(39);
  });

  it('exports exactly 20 plans for the semester-one combined file', () => {
    const html = buildP1TechnologyPlanDocumentHtml([], {
      planNumbers: Array.from({ length: 20 }, (_, index) => index + 1),
    });

    expect(html.match(/แผนการจัดการเรียนรู้ที่ \d+/g)).toHaveLength(20);
    expect(html.match(/15\. บันทึกหลังสอน/g)).toHaveLength(20);
    expect(html).toContain('แผนการจัดการเรียนรู้ที่ 20');
    expect(html).not.toContain('แผนการจัดการเรียนรู้ที่ 21');
    expect(html).not.toContain('ภาคเรียนที่ 2 ปีการศึกษา 2569');
  });

  it('replaces legacy post-teaching placeholders with a K/P/A result narrative', () => {
    const record: LessonRecord = {
      id: 'p1-plan-1-hour-1-2026-05-07', classroom: 'ป.1', subject: 'main',
      courseName: 'เทคโนโลยี (วิทยาการคำนวณ)', planNo: 1, hourNo: 1,
      teachingDate: '2026-05-07', indicatorCodes: ['ว 4.2 ป.1/1'],
      snapshot: { present: 11, absent: 0, totalStudents: 11, passed: 11, averageK: 13.2, averageP: 26.3, attitudePassed: 11 },
      totalStudents: 11, passedCount: 11, failedCount: 0,
      summary: 'ฉบับร่างหลังแผนจากโปรไฟล์ผู้เรียน ครูต้องตรวจและยืนยันผล K/P/A หลังสอน',
      strengths: 'ร่างจากโปรไฟล์ความสามารถรายบุคคล รอครูปรับตามหลักฐานที่เกิดขึ้นจริงในคาบ',
      problems: '', causes: '',
      improvements: 'ตรวจนักเรียนรายคนจากงาน แบบทดสอบ การปฏิบัติ และพฤติกรรมก่อนยืนยัน',
      nextAction: 'บันทึกผลจริงทันทีหลังสอนและเปลี่ยนสถานะเป็นสมบูรณ์',
      teacherName: 'นายอนันตชัย เพ็ชรรี่', status: 'complete', createdAt: 1, updatedAt: 2,
    };

    const html = buildP1TechnologyPlanDocumentHtml([record], { planNumbers: [1] });
    expect(html).toContain('ผ่านจุดประสงค์ 11 คน จากทั้งหมด 11 คน');
    expect(html).not.toContain('ฉบับร่างหลังแผนจากโปรไฟล์ผู้เรียน');
    expect(html).not.toContain('บันทึกผลจริงทันทีหลังสอน');
  });
});
