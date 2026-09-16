import { describe, it, expect } from 'vitest';
import {
  parseThaiName,
  calculateGradeStatistics,
  getClassroomExportSummary,
  generateClassroomCsv,
  generateMasterAllClassroomsCsv,
  generateSchoolMisCsv,
  generateExcelHtml,
  SCHOOL_NAME,
  COURSE_TEACHER_NAME,
} from '../src/services/gradeExportService';

describe('gradeExportService', () => {
  it('correctly parses Thai prefixes, first names, and last names', () => {
    expect(parseThaiName('เด็กชายสมชาย ใจดี')).toEqual({
      prefix: 'เด็กชาย',
      firstName: 'สมชาย',
      lastName: 'ใจดี',
    });

    expect(parseThaiName('เด็กหญิงกานดา รักเรียน')).toEqual({
      prefix: 'เด็กหญิง',
      firstName: 'กานดา',
      lastName: 'รักเรียน',
    });

    expect(parseThaiName('นายอนันตชัย เพ็ชรรี่')).toEqual({
      prefix: 'นาย',
      firstName: 'อนันตชัย',
      lastName: 'เพ็ชรรี่',
    });

    expect(parseThaiName('ด.ช.ธนภัทร แสงแก้ว')).toEqual({
      prefix: 'ด.ช.',
      firstName: 'ธนภัทร',
      lastName: 'แสงแก้ว',
    });
  });

  it('calculates comprehensive grade statistics correctly', () => {
    const mockRows = [
      { totalScore: 85, totalCollected: 60, totalExam: 25, grade: '4' },
      { totalScore: 78, totalCollected: 55, totalExam: 23, grade: '3.5' },
      { totalScore: 72, totalCollected: 52, totalExam: 20, grade: '3' },
      { totalScore: 66, totalCollected: 48, totalExam: 18, grade: '2.5' },
      { totalScore: 45, totalCollected: 30, totalExam: 15, grade: '0' },
    ];

    const stats = calculateGradeStatistics(mockRows);

    expect(stats.totalStudents).toBe(5);
    expect(stats.gradeCounts['4']).toBe(1);
    expect(stats.gradeCounts['3.5']).toBe(1);
    expect(stats.gradeCounts['3']).toBe(1);
    expect(stats.gradeCounts['2.5']).toBe(1);
    expect(stats.gradeCounts['0']).toBe(1);

    expect(stats.qualityCount).toBe(3); // 4, 3.5, 3
    expect(stats.qualityPercentage).toBe(60);
    expect(stats.passCount).toBe(4);
    expect(stats.passPercentage).toBe(80);
    expect(stats.failCount).toBe(1);
    expect(stats.failPercentage).toBe(20);

    expect(stats.meanScore).toBe(69.2);
    expect(stats.maxScore).toBe(85);
    expect(stats.minScore).toBe(45);
    expect(stats.sdScore).toBeGreaterThan(0);
  });

  it('returns valid classroom export summary for Primary class (ป.1)', () => {
    const summary = getClassroomExportSummary('ป.1', 'main');

    expect(summary.classroom).toBe('ป.1');
    expect(summary.schoolName).toBe(SCHOOL_NAME);
    expect(summary.teacherName).toBe(COURSE_TEACHER_NAME);
    expect(summary.indicators.length).toBeGreaterThan(0);
    expect(summary.rows.length).toBeGreaterThan(0);
    expect(summary.stats.totalStudents).toBe(summary.rows.length);

    const firstStudent = summary.rows[0];
    expect(firstStudent.studentNo).toBeDefined();
    expect(firstStudent.studentCode).toBeDefined();
    expect(firstStudent.fullName).toBeDefined();
    expect(firstStudent.totalScore).toBeGreaterThanOrEqual(0);
    expect(firstStudent.grade).toBeDefined();
  });

  it('returns valid classroom export summary for Secondary class (ม.1 cs and dt)', () => {
    const csSummary = getClassroomExportSummary('ม.1', 'cs');
    expect(csSummary.classroom).toBe('ม.1');
    expect(csSummary.subject).toBe('cs');
    expect(csSummary.subjectCode).toBe('ว 4.2');

    const dtSummary = getClassroomExportSummary('ม.1', 'dt');
    expect(dtSummary.classroom).toBe('ม.1');
    expect(dtSummary.subject).toBe('dt');
    expect(dtSummary.subjectCode).toBe('ว 4.1');
  });

  it('generates non-empty CSV, Master CSV, and SchoolMIS CSV with required headers', () => {
    const classCsv = generateClassroomCsv('ป.1', 'main');
    expect(classCsv).toContain(SCHOOL_NAME);
    expect(classCsv).toContain('แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)');
    expect(classCsv).toContain('เลขที่,รหัสนักเรียน,คำนำหน้า,ชื่อ,นามสกุล');
    expect(classCsv).toContain('สรุปผลสัมฤทธิ์ทางการเรียน');

    const masterCsv = generateMasterAllClassroomsCsv();
    expect(masterCsv).toContain('Master Grade Sheet');
    expect(masterCsv).toContain('ระดับชั้น,วิชา,รหัสวิชา,เลขที่,รหัสนักเรียน');

    const schoolMisCsv = generateSchoolMisCsv('ป.1', 'main');
    expect(schoolMisCsv).toContain('รหัสประจำตัว,เลขที่,คำนำหน้า,ชื่อ,นามสกุล,คะแนนเก็บ,คะแนนกลางภาค,คะแนนปลายภาค,คะแนนรวม,เกรด');
  });

  it('generates valid Excel HTML format with tables, styling, and statistics', () => {
    const excelHtml = generateExcelHtml('ป.1', 'main');
    expect(excelHtml).toContain('xmlns:x="urn:schemas-microsoft-com:office:excel"');
    expect(excelHtml).toContain(SCHOOL_NAME);
    expect(excelHtml).toContain('แบบบันทึกผลการเรียนรายวิชา (ปพ.5)');
    expect(excelHtml).toContain('สรุปผลสัมฤทธิ์ทางการเรียน ชั้น ป.1');
    expect(excelHtml).toContain(COURSE_TEACHER_NAME);
  });
});
