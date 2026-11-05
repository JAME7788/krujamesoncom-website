import { describe, it, expect } from 'vitest';
import { loadSkillGradeData, getDefaultIsSkillAssignments } from '../src/services/skillGradeService';
import { IS_CAREER_CURRICULUM, buildPrintableIsWorksheetHtml } from '../src/data/isCareerCurriculum';
import {
  IS_BLOG_SOURCE_META,
  IS_COURSE_UNIT_STRUCTURES,
  IS_EVALUATION_BREAKDOWN,
  IS_KNOWLEDGE_BLOG_POSTS,
  IS_LEARNING_GOALS_TABLE,
  IS_PRE_POST_QUESTIONS,
  IS_STUDENT_PROJECT_EXAMPLES,
  buildPrintableIsBlogPostHtml,
} from '../src/data/isKnowledgeBlogData';
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

    const isM1Summary = getClassroomExportSummary('ม.1', 'is');
    expect(isM1Summary.classroom).toBe('ม.1');
    expect(isM1Summary.subject).toBe('is');
    expect(isM1Summary.subjectTitle).toBe('ทักษะอาชีพ 1 (IS)');
    expect(isM1Summary.subjectCode).toBe('ง 21201');
    expect(isM1Summary.credit).toBe(1.0);
    expect(isM1Summary.totalHours).toBe(40);
    expect(isM1Summary.indicators).toHaveLength(5);
    expect(isM1Summary.indicators[0].code).toBe('IS ม.1/1');

    const isM2Summary = getClassroomExportSummary('ม.2', 'is');
    expect(isM2Summary.classroom).toBe('ม.2');
    expect(isM2Summary.subject).toBe('is');
    expect(isM2Summary.subjectTitle).toBe('ทักษะอาชีพ 2 (IS)');
    expect(isM2Summary.subjectCode).toBe('ง 22201');
    expect(isM2Summary.credit).toBe(1.0);
    expect(isM2Summary.totalHours).toBe(40);
    expect(isM2Summary.indicators).toHaveLength(5);
    expect(isM2Summary.indicators[0].code).toBe('IS ม.2/1');

    const m1Skill = loadSkillGradeData('ม.1');
    expect(m1Skill.assignments).toHaveLength(5);
    expect(getDefaultIsSkillAssignments('ม.2').reduce((sum, a) => sum + a.maxScore, 0)).toBe(100);
  });

  it('generates review CSVs and blocks SchoolMIS before annual results are complete', () => {
    const classCsv = generateClassroomCsv('ป.1', 'main');
    expect(classCsv).toContain(SCHOOL_NAME);
    expect(classCsv).toContain('แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)');
    expect(classCsv).toContain('เลขที่,รหัสนักเรียน,คำนำหน้า,ชื่อ,นามสกุล');
    expect(classCsv).toContain('สรุปผลสัมฤทธิ์ทางการเรียน');

    const masterCsv = generateMasterAllClassroomsCsv();
    expect(masterCsv).toContain('Master Grade Sheet');
    expect(masterCsv).toContain('ระดับชั้น,วิชา,รหัสวิชา,เลขที่,รหัสนักเรียน');

    expect(() => generateSchoolMisCsv('ป.1', 'main')).toThrow('ยังส่ง SchoolMIS ไม่ได้');
  });

  it('generates valid Excel HTML format with tables, styling, and statistics', () => {
    const excelHtml = generateExcelHtml('ป.1', 'main');
    expect(excelHtml).toContain('xmlns:x="urn:schemas-microsoft-com:office:excel"');
    expect(excelHtml).toContain(SCHOOL_NAME);
    expect(excelHtml).toContain('แบบบันทึกผลการเรียนรายวิชา (ปพ.5)');
    expect(excelHtml).toContain('สรุปผลสัมฤทธิ์ทางการเรียน ชั้น ป.1');
    expect(excelHtml).toContain(COURSE_TEACHER_NAME);
  });

  it('provides complete 5-step IS career curriculum, worksheets, and quizzes for ม.1 and ม.2', () => {
    (['ม.1', 'ม.2'] as const).forEach((cls) => {
      const course = IS_CAREER_CURRICULUM[cls];
      expect(course.steps).toHaveLength(5);
      expect(course.steps.reduce((sum, s) => sum + s.hours, 0)).toBe(40);
      expect(course.steps.reduce((sum, s) => sum + s.maxScore, 0)).toBe(100);
      course.steps.forEach((step) => {
        expect(step.coreConcepts.length).toBeGreaterThanOrEqual(3);
        expect(step.worksheetItems.length).toBeGreaterThanOrEqual(2);
        expect(step.quiz).toHaveLength(5);
      });

      const studentSheet = buildPrintableIsWorksheetHtml(course, course.steps[0], false);
      expect(studentSheet).toContain(course.courseCode);
      expect(studentSheet).not.toContain('แนวคำตอบครู:');

      const teacherKeySheet = buildPrintableIsWorksheetHtml(course, undefined, true);
      expect(teacherKeySheet).toContain('แนวคำตอบครู:');
      expect(teacherKeySheet).toContain('เฉลย:');
    });

    expect(IS_BLOG_SOURCE_META.courseCodeI1).toBe('I20201');
    expect(IS_BLOG_SOURCE_META.learningOutcomes).toHaveLength(9);
    expect(IS_COURSE_UNIT_STRUCTURES).toHaveLength(3);
    expect(IS_COURSE_UNIT_STRUCTURES.reduce((sum, u) => sum + u.hours, 0)).toBe(40);
    expect(IS_COURSE_UNIT_STRUCTURES.reduce((sum, u) => sum + u.scoreWeight, 0)).toBe(100);
    expect(IS_LEARNING_GOALS_TABLE).toHaveLength(9);
    expect(IS_EVALUATION_BREAKDOWN).toHaveLength(9);
    expect(IS_KNOWLEDGE_BLOG_POSTS).toHaveLength(8);
    expect(IS_PRE_POST_QUESTIONS).toHaveLength(10);
    expect(IS_STUDENT_PROJECT_EXAMPLES).toHaveLength(18);

    const printableBlogHtml = buildPrintableIsBlogPostHtml(IS_KNOWLEDGE_BLOG_POSTS[0]);
    expect(printableBlogHtml).toContain(IS_KNOWLEDGE_BLOG_POSTS[0].title);
    expect(printableBlogHtml).toContain(IS_KNOWLEDGE_BLOG_POSTS[0].worksheet.worksheetNo);
    (['ม.1'] as const).forEach(() => {
      expect(true).toBe(true);
    });
  });
});
