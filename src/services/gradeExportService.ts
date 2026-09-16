/**
 * บริการส่งออกผลการเรียนและสถิติวัดผลทางการ (Grade Export & Statistics Service)
 * สำหรับโรงเรียนบ้านคลองมดแดง สพป.กำแพงเพชร เขต 2
 *
 * รองรับ:
 * 1. Master CSV & Excel Spreadsheet รวมทุกห้อง (ป.1 - ม.3) 111 คน
 * 2. แบบสรุปผลการเรียนรายห้อง ปพ.5 พร้อมสถิติผลสัมฤทธิ์ (Mean, S.D., เกรด 0-4, ร้อยละผ่าน)
 * 3. ไฟล์นำเข้าสำหรับระบบทะเบียนวัดผลโรงเรียน (SchoolMIS / SGS)
 * 4. ชุดข้อมูลสำหรับพิมพ์รายงานผลการเรียนรายบุคคล (ปพ.6 / Grade Slip)
 */

import {
  loadGrades, getIndicators, computeBreakdown, computeGrade,
  examMaxScores, COURSE_TEACHER_NAME, ACADEMIC_YEAR,
  type Subject, type IndicatorDef,
  getSubjectsForClassroom,
} from './gradeService';
import { allClassrooms2569 } from '../data/students2569';
import { loadRoster } from './rosterService';

export const SCHOOL_NAME = 'โรงเรียนบ้านคลองมดแดง';
export const SCHOOL_AFFILIATION = 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษากำแพงเพชร เขต 2';
export const SCHOOL_DIRECTOR_NAME = 'นายปรัชญา ปรางค์ชัยภูมิ';
export const ACADEMIC_HEAD_NAME = 'หัวหน้าฝ่ายวิชาการและงานวัดผลประเมินผล';
export { COURSE_TEACHER_NAME, ACADEMIC_YEAR } from './gradeService';

export type GradeLevel = '4' | '3.5' | '3' | '2.5' | '2' | '1.5' | '1' | '0';

export interface GradeStatistics {
  totalStudents: number;
  evaluatedStudents: number;
  gradeCounts: Record<GradeLevel, number>;
  gradePercentages: Record<GradeLevel, number>;
  qualityCount: number;       // เกรด 3.00 ขึ้นไป (เกรด 3, 3.5, 4)
  qualityPercentage: number;  // ร้อยละของนักเรียนที่ได้ผลการเรียนระดับดีขึ้นไป
  passCount: number;          // เกรด 1.00 ขึ้นไป
  passPercentage: number;
  failCount: number;          // เกรด 0
  failPercentage: number;
  meanScore: number;          // คะแนนเฉลี่ย (X-bar)
  sdScore: number;            // ส่วนเบี่ยงเบนมาตรฐาน (S.D.)
  maxScore: number;           // คะแนนสูงสุดที่ได้
  minScore: number;           // คะแนนต่ำสุดที่ได้
  meanCollected: number;      // คะแนนเก็บเฉลี่ย (จาก 70)
  meanExam: number;           // คะแนนสอบเฉลี่ย (จาก 30)
}

export interface StudentExportRow {
  studentNo: number;
  studentCode: string;
  prefix: string;
  firstName: string;
  lastName: string;
  fullName: string;
  classroom: string;
  subjectTitle: string;
  subjectCode: string;
  indicatorScores: Record<string, { k: number; p: string; a: boolean }>;
  collectedK: number;
  collectedP: number;
  collectedA: number;
  totalCollected: number;
  midtermExam: number;
  finalExam: number;
  totalExam: number;
  totalScore: number;
  grade: string;
  isPassed: boolean;
  evaluationText: 'ผ่าน' | 'ไม่ผ่าน';
  characteristicsScore: 3 | 2 | 1 | 0; // คุณลักษณะอันพึงประสงค์ (3=ดีเยี่ยม, 2=ดี, 1=ผ่าน, 0=ไม่ผ่าน)
  competencyScore: 3 | 2 | 1 | 0;      // สมรรถนะสำคัญ
  readingThinkingScore: 3 | 2 | 1 | 0; // อ่าน คิดวิเคราะห์ และเขียน
}

export interface ClassroomExportSummary {
  classroom: string;
  subject: Subject;
  subjectTitle: string;
  subjectCode: string;
  teacherName: string;
  schoolName: string;
  affiliation: string;
  directorName: string;
  academicYear: string;
  indicators: IndicatorDef[];
  rows: StudentExportRow[];
  stats: GradeStatistics;
}

/** แยกคำนำหน้า ชื่อ นามสกุล จากชื่อภาษาไทย */
export const parseThaiName = (fullName: string): { prefix: string; firstName: string; lastName: string } => {
  const trimmed = fullName.trim();
  const prefixes = ['เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว', 'นาง', 'ด.ช.', 'ด.ญ.'];
  let prefix = '';
  let rest = trimmed;

  for (const p of prefixes) {
    if (trimmed.startsWith(p)) {
      prefix = p;
      rest = trimmed.slice(p.length).trim();
      break;
    }
  }

  const parts = rest.split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';

  return { prefix, firstName, lastName };
};

/** คำนวณสถิติผลสัมฤทธิ์ทางการเรียนอย่างละเอียด */
export const calculateGradeStatistics = (
  rows: { totalScore: number; totalCollected: number; totalExam: number; grade: string }[]
): GradeStatistics => {
  const totalStudents = rows.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      evaluatedStudents: 0,
      gradeCounts: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 },
      gradePercentages: { '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0 },
      qualityCount: 0,
      qualityPercentage: 0,
      passCount: 0,
      passPercentage: 0,
      failCount: 0,
      failPercentage: 0,
      meanScore: 0,
      sdScore: 0,
      maxScore: 0,
      minScore: 0,
      meanCollected: 0,
      meanExam: 0,
    };
  }

  const gradeCounts: Record<GradeLevel, number> = {
    '4': 0, '3.5': 0, '3': 0, '2.5': 0, '2': 0, '1.5': 0, '1': 0, '0': 0,
  };

  let sumScore = 0;
  let sumCollected = 0;
  let sumExam = 0;
  let maxScore = -Infinity;
  let minScore = Infinity;

  rows.forEach((r) => {
    const g = r.grade as GradeLevel;
    if (gradeCounts[g] !== undefined) {
      gradeCounts[g] += 1;
    }
    sumScore += r.totalScore;
    sumCollected += r.totalCollected;
    sumExam += r.totalExam;
    if (r.totalScore > maxScore) maxScore = r.totalScore;
    if (r.totalScore < minScore) minScore = r.totalScore;
  });

  const gradePercentages: Record<GradeLevel, number> = {} as Record<GradeLevel, number>;
  (Object.keys(gradeCounts) as GradeLevel[]).forEach((g) => {
    gradePercentages[g] = Math.round((gradeCounts[g] / totalStudents) * 1000) / 10;
  });

  const qualityCount = gradeCounts['4'] + gradeCounts['3.5'] + gradeCounts['3'];
  const qualityPercentage = Math.round((qualityCount / totalStudents) * 1000) / 10;

  const passCount = totalStudents - gradeCounts['0'];
  const passPercentage = Math.round((passCount / totalStudents) * 1000) / 10;

  const failCount = gradeCounts['0'];
  const failPercentage = Math.round((failCount / totalStudents) * 1000) / 10;

  const meanScore = Math.round((sumScore / totalStudents) * 10) / 10;
  const meanCollected = Math.round((sumCollected / totalStudents) * 10) / 10;
  const meanExam = Math.round((sumExam / totalStudents) * 10) / 10;

  // Standard Deviation
  const variance = rows.reduce((acc, r) => acc + Math.pow(r.totalScore - meanScore, 2), 0) / totalStudents;
  const sdScore = Math.round(Math.sqrt(variance) * 100) / 100;

  return {
    totalStudents,
    evaluatedStudents: totalStudents,
    gradeCounts,
    gradePercentages,
    qualityCount,
    qualityPercentage,
    passCount,
    passPercentage,
    failCount,
    failPercentage,
    meanScore,
    sdScore,
    maxScore: maxScore === -Infinity ? 0 : maxScore,
    minScore: minScore === Infinity ? 0 : minScore,
    meanCollected,
    meanExam,
  };
};

/** ดึงข้อมูลสรุปผลการเรียนของห้องและวิชาที่กำหนด */
export const getClassroomExportSummary = (
  classroom: string,
  subject: Subject = 'main'
): ClassroomExportSummary => {
  let grades = loadGrades(classroom, subject);
  const roster = loadRoster(classroom);

  // ถ้ารายการเกรดยังไม่ถูก init ให้ใช้ roster สร้างชั่วคราว
  if (grades.length === 0 && roster.length > 0) {
    grades = roster.map((s) => ({
      studentCode: s.studentCode || (s as unknown as { code?: string }).code || '',
      classroom,
      studentNo: s.no,
      name: s.name,
      emoji: s.emoji || '👤',
      indicators: {},
      updatedAt: Date.now(),
    }));
  }

  const indicators = getIndicators(classroom, subject);
  const subjects = getSubjectsForClassroom(classroom);
  const currentSubj = subjects.find((s) => s.id === subject) || {
    id: subject,
    title: classroom.startsWith('ป.') ? 'เทคโนโลยี (วิทยาการคำนวณ)' : (subject === 'cs' ? 'วิทยาการคำนวณ' : 'ออกแบบและเทคโนโลยี'),
    code: subject === 'dt' ? 'ว 4.1' : 'ว 4.2',
  };

  const rows: StudentExportRow[] = grades.map((g) => {
    const { prefix, firstName, lastName } = parseThaiName(g.name);
    const b = computeBreakdown(g, classroom, subject);
    const grade = computeGrade(g, classroom, subject);
    const isPassed = grade !== '0';

    const indicatorScores: Record<string, { k: number; p: string; a: boolean }> = {};
    indicators.forEach((ind) => {
      const s = g.indicators[ind.id];
      indicatorScores[ind.id] = {
        k: s?.k || 0,
        p: s?.p || 'พอใช้',
        a: Boolean(s?.a),
      };
    });

    // คุณลักษณะอันพึงประสงค์ & สมรรถนะ คำนวณจากสัดส่วน A และคะแนนรวม
    const aPassedRatio = indicators.length > 0
      ? indicators.filter((ind) => g.indicators[ind.id]?.a).length / indicators.length
      : 1;

    let characteristicsScore: 3 | 2 | 1 | 0 = 3;
    if (aPassedRatio >= 0.8) characteristicsScore = 3;
    else if (aPassedRatio >= 0.6) characteristicsScore = 2;
    else if (aPassedRatio >= 0.4) characteristicsScore = 1;
    else characteristicsScore = 0;

    let competencyScore: 3 | 2 | 1 | 0 = 3;
    if (b.total >= 70) competencyScore = 3;
    else if (b.total >= 60) competencyScore = 2;
    else if (b.total >= 50) competencyScore = 1;
    else competencyScore = 0;

    let readingThinkingScore: 3 | 2 | 1 | 0 = 3;
    if (b.total >= 75) readingThinkingScore = 3;
    else if (b.total >= 65) readingThinkingScore = 2;
    else if (b.total >= 50) readingThinkingScore = 1;
    else readingThinkingScore = 0;

    return {
      studentNo: g.studentNo,
      studentCode: g.studentCode,
      prefix,
      firstName,
      lastName,
      fullName: g.name,
      classroom,
      subjectTitle: currentSubj.title,
      subjectCode: currentSubj.code,
      indicatorScores,
      collectedK: b.k,
      collectedP: b.p,
      collectedA: b.a,
      totalCollected: b.collected,
      midtermExam: b.midterm,
      finalExam: b.final,
      totalExam: b.exam,
      totalScore: b.total,
      grade,
      isPassed,
      evaluationText: isPassed ? 'ผ่าน' : 'ไม่ผ่าน',
      characteristicsScore,
      competencyScore,
      readingThinkingScore,
    };
  });

  // เรียงตามเลขที่
  rows.sort((a, b) => a.studentNo - b.studentNo);

  const stats = calculateGradeStatistics(rows);

  return {
    classroom,
    subject,
    subjectTitle: currentSubj.title,
    subjectCode: currentSubj.code,
    teacherName: COURSE_TEACHER_NAME,
    schoolName: SCHOOL_NAME,
    affiliation: SCHOOL_AFFILIATION,
    directorName: SCHOOL_DIRECTOR_NAME,
    academicYear: ACADEMIC_YEAR,
    indicators,
    rows,
    stats,
  };
};

/** สร้าง CSV รายห้องที่มีข้อมูลครบถ้วนสำหรับเปิดใน Excel / Google Sheets */
export const generateClassroomCsv = (classroom: string, subject: Subject = 'main'): string => {
  const summary = getClassroomExportSummary(classroom, subject);
  const exam = examMaxScores(classroom);

  let csv = `แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) - ${SCHOOL_NAME}\n`;
  csv += `กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี รายวิชา ${summary.subjectTitle} (${summary.subjectCode}) ชั้น ${classroom} ปีการศึกษา ${ACADEMIC_YEAR}\n`;
  csv += `ครูผู้สอน: ${COURSE_TEACHER_NAME} | ผู้อำนวยการ: ${SCHOOL_DIRECTOR_NAME}\n\n`;

  // Header row
  let header = 'เลขที่,รหัสนักเรียน,คำนำหน้า,ชื่อ,นามสกุล,ชื่อ-สกุลเต็ม';
  summary.indicators.forEach((ind) => {
    header += `,"${ind.code} (K)","${ind.code} (P)","${ind.code} (A)"`;
  });
  header += ',รวม K (42),รวม P (17.5),รวม A (10.5),คะแนนเก็บ (70)';
  if (exam.midterm > 0) header += `,สอบกลางภาค (${exam.midterm})`;
  header += `,สอบปลายภาค (${exam.final}),คะแนนสอบ (30),คะแนนรวม (100),ผลการเรียน,ผลการประเมิน,คุณลักษณะฯ,อ่านคิดฯ,สมรรถนะ\n`;

  csv += header;

  summary.rows.forEach((r) => {
    let row = `${r.studentNo},"${r.studentCode}","${r.prefix}","${r.firstName}","${r.lastName}","${r.fullName}"`;
    summary.indicators.forEach((ind) => {
      const s = r.indicatorScores[ind.id] || { k: 0, p: 'พอใช้', a: false };
      row += `,${s.k},"${s.p}",${s.a ? 'ผ่าน' : 'ไม่ผ่าน'}`;
    });
    row += `,${r.collectedK},${r.collectedP},${r.collectedA},${r.totalCollected}`;
    if (exam.midterm > 0) row += `,${r.midtermExam}`;
    row += `,${r.finalExam},${r.totalExam},${r.totalScore},${r.grade},"${r.evaluationText}",${r.characteristicsScore},${r.readingThinkingScore},${r.competencyScore}\n`;
    csv += row;
  });

  // สรุปสถิติท้ายตาราง
  csv += '\n--- สรุปผลสัมฤทธิ์ทางการเรียน ---\n';
  csv += `จำนวนนักเรียนทั้งหมด,${summary.stats.totalStudents},คน\n`;
  csv += `คะแนนเฉลี่ย (Mean),${summary.stats.meanScore},คะแนน\n`;
  csv += `ส่วนเบี่ยงเบนมาตรฐาน (S.D.),${summary.stats.sdScore}\n`;
  csv += `คะแนนสูงสุด,${summary.stats.maxScore},คะแนน\n`;
  csv += `คะแนนต่ำสุด,${summary.stats.minScore},คะแนน\n`;
  csv += `นักเรียนที่ได้ระดับ 3 ขึ้นไป,${summary.stats.qualityCount},คน,(${summary.stats.qualityPercentage}%)\n`;
  csv += `นักเรียนที่ผ่านเกณฑ์,${summary.stats.passCount},คน,(${summary.stats.passPercentage}%)\n\n`;

  csv += 'การกระจายเกรด,เกรด 4,เกรด 3.5,เกรด 3,เกรด 2.5,เกรด 2,เกรด 1.5,เกรด 1,เกรด 0\n';
  csv += `จำนวน (คน),${summary.stats.gradeCounts['4']},${summary.stats.gradeCounts['3.5']},${summary.stats.gradeCounts['3']},${summary.stats.gradeCounts['2.5']},${summary.stats.gradeCounts['2']},${summary.stats.gradeCounts['1.5']},${summary.stats.gradeCounts['1']},${summary.stats.gradeCounts['0']}\n`;
  csv += `ร้อยละ (%),${summary.stats.gradePercentages['4']}%,${summary.stats.gradePercentages['3.5']}%,${summary.stats.gradePercentages['3']}%,${summary.stats.gradePercentages['2.5']}%,${summary.stats.gradePercentages['2']}%,${summary.stats.gradePercentages['1.5']}%,${summary.stats.gradePercentages['1']}%,${summary.stats.gradePercentages['0']}%\n`;

  return csv;
};

/** สร้าง Master CSV รวมทุกห้อง ป.1 - ม.3 ทั้ง 111 คน */
export const generateMasterAllClassroomsCsv = (): string => {
  let csv = `ทะเบียนสรุปผลการเรียนรวมทุกระดับชั้น (Master Grade Sheet) - ${SCHOOL_NAME}\n`;
  csv += `ปีการศึกษา ${ACADEMIC_YEAR} | ข้อมูลรวม 9 ห้องเรียน 111 คน | ครูผู้สอน: ${COURSE_TEACHER_NAME}\n\n`;
  csv += 'ระดับชั้น,วิชา,รหัสวิชา,เลขที่,รหัสนักเรียน,คำนำหน้า,ชื่อ,นามสกุล,ชื่อ-สกุล,คะแนนเก็บ K,คะแนนเก็บ P,คะแนนเก็บ A,รวมคะแนนเก็บ (70),สอบกลางภาค,สอบปลายภาค,รวมคะแนนสอบ (30),คะแนนรวม (100),ระดับผลการเรียน,ผลการตัดสิน,คุณลักษณะฯ,อ่านคิดเขียน,สมรรถนะ\n';

  allClassrooms2569.forEach((cls) => {
    const subjects = getSubjectsForClassroom(cls);
    subjects.forEach((subj) => {
      const summary = getClassroomExportSummary(cls, subj.id);
      summary.rows.forEach((r) => {
        csv += `"${cls}","${summary.subjectTitle}","${summary.subjectCode}",${r.studentNo},"${r.studentCode}","${r.prefix}","${r.firstName}","${r.lastName}","${r.fullName}",${r.collectedK},${r.collectedP},${r.collectedA},${r.totalCollected},${r.midtermExam},${r.finalExam},${r.totalExam},${r.totalScore},${r.grade},"${r.evaluationText}",${r.characteristicsScore},${r.readingThinkingScore},${r.competencyScore}\n`;
      });
    });
  });

  return csv;
};

/** สร้างไฟล์รูปแบบที่ตรงตามระบบทะเบียน SchoolMIS / SGS */
export const generateSchoolMisCsv = (classroom: string, subject: Subject = 'main'): string => {
  const summary = getClassroomExportSummary(classroom, subject);
  let csv = 'รหัสประจำตัว,เลขที่,คำนำหน้า,ชื่อ,นามสกุล,คะแนนเก็บ,คะแนนกลางภาค,คะแนนปลายภาค,คะแนนรวม,เกรด,คุณลักษณะ,อ่านคิดวิเคราะห์,สมรรถนะ\n';

  summary.rows.forEach((r) => {
    csv += `"${r.studentCode}",${r.studentNo},"${r.prefix}","${r.firstName}","${r.lastName}",${r.totalCollected},${r.midtermExam},${r.finalExam},${r.totalScore},${r.grade},${r.characteristicsScore},${r.readingThinkingScore},${r.competencyScore}\n`;
  });

  return csv;
};

/**
 * สร้างไฟล์สเปรดชีต Excel (.xls / HTML Table format) ที่มีสไตล์สวยงาม
 * มีสีหัวตาราง ขอบเส้น และตารางสรุปสถิติที่เปิดใน Microsoft Excel และ Google Sheets ได้ทันที
 */
export const generateExcelHtml = (classroom: string, subject: Subject = 'main'): string => {
  const summary = getClassroomExportSummary(classroom, subject);
  const exam = examMaxScores(classroom);

  const html = `
<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<style>
  body { font-family: 'TH Sarabun New', 'Sarabun', Tahoma, sans-serif; font-size: 14pt; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #000000; padding: 6px 10px; text-align: center; }
  th { background-color: #fef08a; font-weight: bold; }
  .header-title { font-size: 18pt; font-weight: bold; text-align: center; border: none; padding: 4px; }
  .header-sub { font-size: 14pt; text-align: center; border: none; padding: 2px; }
  .text-left { text-align: left; }
  .num { mso-number-format:"\\@"; text-align: center; }
  .grade-4 { background-color: #dcfce7; font-weight: bold; }
  .grade-0 { background-color: #fee2e2; color: #dc2626; font-weight: bold; }
  .stat-th { background-color: #e0e7ff; }
</style>
</head>
<body>
<table>
  <tr><td colspan="${summary.indicators.length * 3 + 12}" class="header-title">${SCHOOL_NAME}</td></tr>
  <tr><td colspan="${summary.indicators.length * 3 + 12}" class="header-sub">แบบบันทึกผลการเรียนรายวิชา (ปพ.5) ปีการศึกษา ${ACADEMIC_YEAR}</td></tr>
  <tr><td colspan="${summary.indicators.length * 3 + 12}" class="header-sub">กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี รายวิชา ${summary.subjectTitle} (${summary.subjectCode}) ชั้น ${classroom}</td></tr>
  <tr><td colspan="${summary.indicators.length * 3 + 12}" class="header-sub">ครูผู้สอน: ${COURSE_TEACHER_NAME} | สังกัด: ${SCHOOL_AFFILIATION}</td></tr>
  <tr><td colspan="${summary.indicators.length * 3 + 12}" style="border:none; height:15px;"></td></tr>
  
  <thead>
    <tr>
      <th rowspan="2">เลขที่</th>
      <th rowspan="2">รหัส</th>
      <th rowspan="2">ชื่อ - สกุล</th>
      ${summary.indicators.map((ind) => `<th colspan="3">${ind.code}</th>`).join('')}
      <th colspan="4">คะแนนเก็บ</th>
      ${exam.midterm > 0 ? `<th rowspan="2">กลางภาค<br>(${exam.midterm})</th>` : ''}
      <th rowspan="2">ปลายภาค<br>(${exam.final})</th>
      <th rowspan="2">รวมสอบ<br>(30)</th>
      <th rowspan="2">รวมทั้งสิ้น<br>(100)</th>
      <th rowspan="2">ผลการเรียน<br>(เกรด)</th>
      <th rowspan="2">ผลการตัดสิน</th>
    </tr>
    <tr>
      ${summary.indicators.map(() => '<th>K</th><th>P</th><th>A</th>').join('')}
      <th>K (42)</th>
      <th>P (17.5)</th>
      <th>A (10.5)</th>
      <th>รวม (70)</th>
    </tr>
  </thead>
  <tbody>
    ${summary.rows.map((r) => `
      <tr>
        <td>${r.studentNo}</td>
        <td class="num">${r.studentCode}</td>
        <td class="text-left">${r.fullName}</td>
        ${summary.indicators.map((ind) => {
          const s = r.indicatorScores[ind.id] || { k: 0, p: 'พอใช้', a: false };
          return `<td>${s.k}</td><td>${s.p}</td><td>${s.a ? 'ผ' : 'มผ'}</td>`;
        }).join('')}
        <td>${r.collectedK}</td>
        <td>${r.collectedP}</td>
        <td>${r.collectedA}</td>
        <td><strong>${r.totalCollected}</strong></td>
        ${exam.midterm > 0 ? `<td>${r.midtermExam}</td>` : ''}
        <td>${r.finalExam}</td>
        <td><strong>${r.totalExam}</strong></td>
        <td style="font-size:15pt;"><strong>${r.totalScore}</strong></td>
        <td class="${r.grade === '4' ? 'grade-4' : (r.grade === '0' ? 'grade-0' : '')}" style="font-size:15pt;"><strong>${r.grade}</strong></td>
        <td>${r.evaluationText}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<br><br>

<table style="width: 700px; margin-left: auto; margin-right: auto;">
  <tr><th colspan="9" class="stat-th" style="font-size:16pt;">สรุปผลสัมฤทธิ์ทางการเรียน ชั้น ${classroom}</th></tr>
  <tr>
    <th>เกรด</th>
    <th>4</th><th>3.5</th><th>3</th><th>2.5</th><th>2</th><th>1.5</th><th>1</th><th>0</th>
  </tr>
  <tr>
    <td><strong>จำนวน (คน)</strong></td>
    <td>${summary.stats.gradeCounts['4']}</td>
    <td>${summary.stats.gradeCounts['3.5']}</td>
    <td>${summary.stats.gradeCounts['3']}</td>
    <td>${summary.stats.gradeCounts['2.5']}</td>
    <td>${summary.stats.gradeCounts['2']}</td>
    <td>${summary.stats.gradeCounts['1.5']}</td>
    <td>${summary.stats.gradeCounts['1']}</td>
    <td>${summary.stats.gradeCounts['0']}</td>
  </tr>
  <tr>
    <td><strong>ร้อยละ (%)</strong></td>
    <td>${summary.stats.gradePercentages['4']}%</td>
    <td>${summary.stats.gradePercentages['3.5']}%</td>
    <td>${summary.stats.gradePercentages['3']}%</td>
    <td>${summary.stats.gradePercentages['2.5']}%</td>
    <td>${summary.stats.gradePercentages['2']}%</td>
    <td>${summary.stats.gradePercentages['1.5']}%</td>
    <td>${summary.stats.gradePercentages['1']}%</td>
    <td>${summary.stats.gradePercentages['0']}%</td>
  </tr>
</table>

<br>

<table style="width: 700px; margin-left: auto; margin-right: auto;">
  <tr>
    <td style="text-align:left;">จำนวนนักเรียนทั้งหมด: <strong>${summary.stats.totalStudents}</strong> คน</td>
    <td style="text-align:left;">คะแนนเฉลี่ย (X̄): <strong>${summary.stats.meanScore}</strong></td>
    <td style="text-align:left;">ส่วนเบี่ยงเบนมาตรฐาน (S.D.): <strong>${summary.stats.sdScore}</strong></td>
  </tr>
  <tr>
    <td style="text-align:left;">ได้เกรด 3 ขึ้นไป: <strong>${summary.stats.qualityCount}</strong> คน (${summary.stats.qualityPercentage}%)</td>
    <td style="text-align:left;">ผ่านเกณฑ์: <strong>${summary.stats.passCount}</strong> คน (${summary.stats.passPercentage}%)</td>
    <td style="text-align:left;">คะแนนสูงสุด / ต่ำสุด: <strong>${summary.stats.maxScore} / ${summary.stats.minScore}</strong></td>
  </tr>
</table>

<br><br>

<table style="border:none; width:100%;">
  <tr style="border:none;">
    <td style="border:none; width:33%; text-align:center;">
      ลงชื่อ........................................................<br>
      (${COURSE_TEACHER_NAME})<br>
      ครูผู้สอน
    </td>
    <td style="border:none; width:33%; text-align:center;">
      ลงชื่อ........................................................<br>
      (${ACADEMIC_HEAD_NAME})<br>
      หัวหน้างานวัดและประเมินผล
    </td>
    <td style="border:none; width:33%; text-align:center;">
      ลงชื่อ........................................................<br>
      (${SCHOOL_DIRECTOR_NAME})<br>
      ผู้อำนวยการโรงเรียนบ้านคลองมดแดง
    </td>
  </tr>
</table>
</body>
</html>
  `;
  return html.trim();
};

/** ฟังก์ชันช่วยดาวน์โหลด Blob ไฟล์ */
export const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const downloadClassroomCsvFile = (classroom: string, subject: Subject = 'main') => {
  const csv = generateClassroomCsv(classroom, subject);
  const subjLabel = subject === 'cs' ? '_วิทยาการคำนวณ' : subject === 'dt' ? '_ออกแบบ' : '';
  downloadFile('\uFEFF' + csv, `ปพ5_คะแนน_${classroom}${subjLabel}_${ACADEMIC_YEAR}.csv`, 'text/csv;charset=utf-8');
};

export const downloadMasterCsvFile = () => {
  const csv = generateMasterAllClassroomsCsv();
  downloadFile('\uFEFF' + csv, `Master_สรุปคะแนนทุกห้อง_ป1-ม3_${ACADEMIC_YEAR}.csv`, 'text/csv;charset=utf-8');
};

export const downloadSchoolMisCsvFile = (classroom: string, subject: Subject = 'main') => {
  const csv = generateSchoolMisCsv(classroom, subject);
  const subjLabel = subject === 'cs' ? '_CS' : subject === 'dt' ? '_DT' : '';
  downloadFile('\uFEFF' + csv, `SchoolMIS_${classroom}${subjLabel}_${ACADEMIC_YEAR}.csv`, 'text/csv;charset=utf-8');
};

export const downloadClassroomExcelFile = (classroom: string, subject: Subject = 'main') => {
  const html = generateExcelHtml(classroom, subject);
  const subjLabel = subject === 'cs' ? '_วิทยาการคำนวณ' : subject === 'dt' ? '_ออกแบบ' : '';
  downloadFile(html, `ปพ5_${classroom}${subjLabel}_${ACADEMIC_YEAR}.xls`, 'application/vnd.ms-excel;charset=utf-8');
};
