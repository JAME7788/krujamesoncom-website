import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  Download,
  FileText,
  Printer,
} from 'lucide-react';
import {
  buildTechnologyTeachingSchedule,
  PRIMARY_TECHNOLOGY_GRADE_IDS,
  type PrimaryTechnologyGradeId,
  type TechnologyTeachingSchedule,
} from '../data/technologyTeachingSchedule';
import { ACADEMIC_YEAR, COURSE_TEACHER_NAME } from '../services/gradeService';
import './CoursePlan5.css';

type SemesterFilter = 'all' | 1 | 2;

const escapeHtml = (value: string | number) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const buildTeachingScheduleDocumentHtml = (
  schedule: TechnologyTeachingSchedule,
) => {
  const unitRows = schedule.units.map((unit) => `
    <tr>
      <td class="center">${unit.no}</td>
      <td>${escapeHtml(unit.title)}</td>
      <td>${escapeHtml(unit.indicators.join(', '))}</td>
      <td>${escapeHtml(unit.keyEvidence)}</td>
      <td class="center">${unit.hours}</td>
    </tr>`).join('');

  const lessonRows = schedule.rows.map((row) => `
    <tr>
      <td class="center">${row.period}</td>
      <td class="center">${row.semester}</td>
      <td class="center">สัปดาห์ที่ ${row.week}<br>วันที่ ...............</td>
      <td>หน่วยที่ ${row.unitNo}<br>${escapeHtml(row.unitTitle)}</td>
      <td><strong>${escapeHtml(row.lessonTitle)}</strong><br><small>${escapeHtml(row.learningActivity)}</small></td>
      <td>${escapeHtml(row.indicators.join(', '))}</td>
      <td>${escapeHtml(row.evidence)}<br><small>${escapeHtml(row.assessment)}</small></td>
      <td class="center">1</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>กำหนดการสอน ${escapeHtml(schedule.courseName)} ${escapeHtml(schedule.gradeLabel)}</title>
  <style>
    @page { size: A4 landscape; margin: 1.2cm; }
    body { font-family: "TH Sarabun New", "Sarabun", Arial, sans-serif; color: #111827; font-size: 14pt; line-height: 1.35; }
    h1, h2, p { margin: 0; }
    h1 { font-size: 22pt; text-align: center; }
    h2 { font-size: 17pt; margin: 16pt 0 7pt; }
    .center { text-align: center; }
    .meta { margin: 7pt auto 12pt; text-align: center; }
    .description { margin: 8pt 0; text-align: justify; }
    table { width: 100%; border-collapse: collapse; table-layout: fixed; margin-top: 6pt; }
    th, td { border: 1px solid #374151; padding: 5pt; vertical-align: top; overflow-wrap: anywhere; }
    th { background: #e0f2fe; text-align: center; font-weight: 700; }
    small { color: #374151; }
    .unit-table td:nth-child(1), .unit-table td:nth-child(5) { width: 7%; }
    .schedule-table { font-size: 11pt; }
    .schedule-table th:nth-child(1) { width: 4%; }
    .schedule-table th:nth-child(2) { width: 4%; }
    .schedule-table th:nth-child(3) { width: 9%; }
    .schedule-table th:nth-child(4) { width: 13%; }
    .schedule-table th:nth-child(5) { width: 25%; }
    .schedule-table th:nth-child(6) { width: 12%; }
    .schedule-table th:nth-child(7) { width: 27%; }
    .schedule-table th:nth-child(8) { width: 6%; }
    .score-note { margin-top: 10pt; padding: 8pt; border: 1px solid #9ca3af; background: #f9fafb; }
    .page-break { page-break-before: always; }
  </style>
</head>
<body>
  <h1>กำหนดการสอน</h1>
  <div class="meta">
    <p>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</p>
    <p><strong>รายวิชา ${escapeHtml(schedule.courseName)}</strong> รหัสวิชา ${escapeHtml(schedule.courseCode)}</p>
    <p>${escapeHtml(schedule.fullGradeLabel)} ปีการศึกษา ${ACADEMIC_YEAR} เวลา 40 ชั่วโมง</p>
    <p>ครูผู้สอน ${escapeHtml(COURSE_TEACHER_NAME)} โรงเรียนบ้านคลองมดแดง</p>
  </div>
  <h2>คำอธิบายรายวิชา</h2>
  <p class="description">${escapeHtml(schedule.description)}</p>
  <h2>โครงสร้างรายวิชา</h2>
  <table class="unit-table">
    <thead><tr><th>หน่วยที่</th><th>ชื่อหน่วย</th><th>ตัวชี้วัด</th><th>ภาระงาน/หลักฐานสำคัญ</th><th>ชั่วโมง</th></tr></thead>
    <tbody>${unitRows}</tbody>
  </table>
  <h2 class="page-break">กำหนดการสอนรายชั่วโมง</h2>
  <table class="schedule-table">
    <thead>
      <tr><th>คาบ</th><th>ภาค</th><th>สัปดาห์/วันที่</th><th>หน่วย</th><th>เรื่องและกิจกรรม</th><th>ตัวชี้วัด</th><th>หลักฐานและการประเมิน K/P/A</th><th>ชม.</th></tr>
    </thead>
    <tbody>${lessonRows}</tbody>
  </table>
  <div class="score-note"><strong>โครงสร้างคะแนน:</strong> คะแนนเก็บตามตัวชี้วัด 70 คะแนน + สอบกลางปี 15 คะแนน + สอบปลายปี 15 คะแนน = 100 คะแนน ออกผลการเรียน 1 ปี 1 เกรด</div>
</body>
</html>`;
};

const downloadFile = (content: string, type: string, filename: string) => {
  const blob = new Blob(['\ufeff' + content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

const CoursePlan5: React.FC = () => {
  const [gradeId, setGradeId] = useState<PrimaryTechnologyGradeId>('p1');
  const [semester, setSemester] = useState<SemesterFilter>('all');
  const schedule = useMemo(
    () => buildTechnologyTeachingSchedule(gradeId),
    [gradeId],
  );
  const visibleRows = useMemo(
    () => semester === 'all'
      ? schedule.rows
      : schedule.rows.filter((row) => row.semester === semester),
    [schedule, semester],
  );

  const downloadWord = () => {
    downloadFile(
      buildTeachingScheduleDocumentHtml(schedule),
      'application/msword;charset=utf-8',
      `กำหนดการสอน_เทคโนโลยี_${schedule.gradeLabel}_ปี${ACADEMIC_YEAR}.doc`,
    );
  };

  const downloadCsv = () => {
    const header = [
      'คาบ',
      'ภาคเรียน',
      'สัปดาห์',
      'หน่วย',
      'เรื่อง',
      'ตัวชี้วัด',
      'กิจกรรม',
      'หลักฐาน',
      'การประเมิน K/P/A',
      'ชั่วโมง',
    ];
    const rows = schedule.rows.map((row) => [
      row.period,
      row.semester,
      row.week,
      `หน่วยที่ ${row.unitNo} ${row.unitTitle}`,
      row.lessonTitle,
      row.indicators.join(', '),
      row.learningActivity,
      row.evidence,
      row.assessment,
      1,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\r\n');
    downloadFile(
      csv,
      'text/csv;charset=utf-8',
      `กำหนดการสอน_เทคโนโลยี_${schedule.gradeLabel}_ปี${ACADEMIC_YEAR}.csv`,
    );
  };

  return (
    <div className="techschedule-shell">
      <header className="techschedule-header">
        <div>
          <span>เอกสารพร้อมใช้ · ปีการศึกษา {ACADEMIC_YEAR}</span>
          <h2><CalendarDays size={25} /> กำหนดการสอนเทคโนโลยี ป.1-6</h2>
          <p>ตารางรายชั่วโมง 1 แผนต่อ 1 คาบ เชื่อมหน่วย ตัวชี้วัด กิจกรรม หลักฐาน และ K/P/A</p>
        </div>
        <div className="techschedule-actions">
          <button type="button" onClick={() => window.print()}><Printer size={17} /> พิมพ์/PDF</button>
          <button type="button" onClick={downloadWord}><Download size={17} /> Word</button>
          <button type="button" onClick={downloadCsv}><Download size={17} /> CSV</button>
        </div>
      </header>

      <div className="techschedule-controls">
        <div className="techschedule-grade-tabs" aria-label="เลือกระดับชั้น">
          {PRIMARY_TECHNOLOGY_GRADE_IDS.map((id) => (
            <button
              type="button"
              key={id}
              className={gradeId === id ? 'active' : ''}
              onClick={() => {
                setGradeId(id);
                setSemester('all');
              }}
            >
              ป.{id.slice(1)}
            </button>
          ))}
        </div>
        <div className="techschedule-semester-tabs" aria-label="เลือกภาคเรียน">
          {([
            ['all', 'ทั้งปี'],
            [1, 'ภาคเรียนที่ 1'],
            [2, 'ภาคเรียนที่ 2'],
          ] as Array<[SemesterFilter, string]>).map(([value, label]) => (
            <button
              type="button"
              key={value}
              className={semester === value ? 'active' : ''}
              onClick={() => setSemester(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="techschedule-formal-heading">
        <p>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</p>
        <h3>รายวิชา {schedule.courseName}</h3>
        <p>
          รหัสวิชา {schedule.courseCode} · {schedule.fullGradeLabel} ·
          เวลา {schedule.totalHours} ชั่วโมง · {schedule.weeklySlot}
        </p>
        <p>ครูผู้สอน {COURSE_TEACHER_NAME} · โรงเรียนบ้านคลองมดแดง</p>
      </section>

      <div className="techschedule-metrics">
        <div><FileText size={20} /><strong>40</strong><span>แผนรายชั่วโมง</span></div>
        <div><BookOpen size={20} /><strong>{schedule.units.length}</strong><span>หน่วยการเรียนรู้</span></div>
        <div><CalendarDays size={20} /><strong>20 + 20</strong><span>คาบต่อภาคเรียน</span></div>
        <div><ClipboardCheck size={20} /><strong>70 + 15 + 15</strong><span>โครงสร้าง 100 คะแนน</span></div>
      </div>

      <section className="techschedule-section">
        <h3>คำอธิบายรายวิชา</h3>
        <p className="techschedule-description">{schedule.description}</p>
        <div className="techschedule-focus">
          {schedule.focus.map((item) => <span key={item}>{item}</span>)}
        </div>
      </section>

      <section className="techschedule-section">
        <h3>โครงสร้างรายวิชา</h3>
        <div className="techschedule-table-wrap">
          <table className="techschedule-unit-table">
            <thead>
              <tr>
                <th>หน่วยที่</th>
                <th>ชื่อหน่วย</th>
                <th>ตัวชี้วัด</th>
                <th>ภาระงาน/หลักฐานสำคัญ</th>
                <th>ชั่วโมง</th>
              </tr>
            </thead>
            <tbody>
              {schedule.units.map((unit) => (
                <tr key={unit.no}>
                  <td>{unit.no}</td>
                  <td><strong>{unit.title}</strong></td>
                  <td>{unit.indicators.join(', ')}</td>
                  <td>{unit.keyEvidence}</td>
                  <td><strong>{unit.hours}</strong></td>
                </tr>
              ))}
            </tbody>
            <tfoot><tr><td colSpan={4}>รวมตลอดปี</td><td>40</td></tr></tfoot>
          </table>
        </div>
      </section>

      <section className="techschedule-section">
        <div className="techschedule-section-title">
          <div>
            <h3>กำหนดการสอนรายชั่วโมง</h3>
            <p>แสดง {visibleRows.length} คาบ · วันที่สอนจริงเว้นไว้ให้ครูบันทึกตามปฏิทินโรงเรียน</p>
          </div>
          <span>{semester === 'all' ? 'ทั้งปี' : `ภาคเรียนที่ ${semester}`}</span>
        </div>
        <div className="techschedule-table-wrap">
          <table className="techschedule-hour-table">
            <thead>
              <tr>
                <th>คาบ</th>
                <th>สัปดาห์/วันที่</th>
                <th>หน่วย</th>
                <th>เรื่องและกิจกรรม</th>
                <th>ตัวชี้วัด</th>
                <th>หลักฐานและการประเมิน K/P/A</th>
                <th>ชม.</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => (
                <tr key={row.period} className={row.period === 20 || row.period === 40 ? 'exam-row' : ''}>
                  <td><strong>{row.period}</strong><small>ภาค {row.semester}</small></td>
                  <td>สัปดาห์ที่ {row.week}<small>วันที่ ...............</small></td>
                  <td><strong>หน่วยที่ {row.unitNo}</strong><small>{row.unitTitle}</small></td>
                  <td><strong>{row.lessonTitle}</strong><small>{row.learningActivity}</small></td>
                  <td>{row.indicators.join(', ')}</td>
                  <td>{row.evidence}<small>{row.assessment}</small></td>
                  <td>1</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="techschedule-score-note">
        <strong>การวัดและประเมินผลตลอดปี 100 คะแนน</strong>
        <span>คะแนนเก็บตามตัวชี้วัด 70 คะแนน</span>
        <span>สอบกลางปี 15 คะแนน</span>
        <span>สอบปลายปี 15 คะแนน</span>
        <p>ประถมศึกษาออกผลการเรียน 1 ปี 1 เกรด โดยหลักฐานรายคาบส่งต่อการเก็บคะแนน K/P/A ตามตัวชี้วัดในสมุดคะแนนของเว็บ</p>
      </section>
    </div>
  );
};

export default CoursePlan5;
