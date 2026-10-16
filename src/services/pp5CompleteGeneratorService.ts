/**
 * บริการสร้างเล่มรายงาน ปพ.5 ฉบับสมบูรณ์ (Excel Multi-Sheet & Word Document)
 * ตามมาตรฐานแบบฟอร์มทางการของ สำนักงานคณะกรรมการการศึกษาขั้นพื้นฐาน (สพฐ.)
 * โรงเรียนบ้านคลองมดแดง สพป.กำแพงเพชร เขต 2
 *
 * ครอบคลุม 7 หมวดสำคัญ:
 * 1. หน้าปก (พร้อมตารางสถิติกระจายเกรด 0-4, คุณลักษณะ, อ่านคิดเขียน และลายมือชื่อ 4 ฝ่าย)
 * 2. ข้อมูลเกี่ยวกับนักเรียน (เลขประจำตัว, เลขบัตร ปชช. 13 หลัก, วันเกิด, บิดา, มารดา)
 * 3. ตัวชี้วัดและสาระการเรียนรู้แกนกลาง
 * 4. บันทึกและสรุปเวลาเรียน 20 สัปดาห์ (ร้อยละเวลาเรียน 80% มีสิทธิ์สอบ/มส)
 * 5. สรุปคะแนนผลการเรียนรู้ (คะแนนเก็บตามตัวชี้วัด K/P/A, กลางภาค, ปลายภาค, ตัดเกรด)
 * 6. แบบประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ
 * 7. แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน 5 ข้อ
 */

import type { ClassroomExportSummary } from './gradeExportService';
import { downloadFile } from './gradeExportService';

const escapeXml = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
};

const escapeHtml = (value: string | number | undefined | null): string => {
  if (value === undefined || value === null) return '';
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
};

/**
 * 1. สร้างเอกสารเล่ม ปพ.5 สมบูรณ์ในรูปแบบ Word (.doc / .docx)
 * จัดหน้า A4 แนวตั้ง ฟอนต์ TH SarabunPSK 16pt มีหน้าปก เส้นขอบตาราง และแบ่งหน้าเป็นสัดส่วน
 */
export const generatePp5CompleteDocxHtml = (summary: ClassroomExportSummary): string => {
  const isPrimary = summary.classroom.startsWith('ป.');
  const gradeLevels = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'] as const;

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>เล่ม ปพ.5 สมบูรณ์_${summary.classroom}_${summary.subjectTitle}</title>
<!--[if gte mso 9]>
<xml>
 <w:WordDocument>
  <w:View>Print</w:View>
  <w:Zoom>100</w:Zoom>
  <w:DoNotOptimizeForBrowser/>
 </w:WordDocument>
</xml>
<![endif]-->
<style>
@page {
  size: 21.0cm 29.7cm; /* A4 Portrait */
  margin: 2.2cm 1.8cm 2.2cm 2.2cm;
  mso-header-margin: 1.2cm;
  mso-footer-margin: 1.2cm;
}
body {
  font-family: 'TH SarabunPSK', 'TH Sarabun New', 'Angsana New', serif;
  font-size: 16pt;
  line-height: 1.15;
  color: #000000;
  background: #ffffff;
}
p, h1, h2, h3, h4 { margin: 0; padding: 0; }
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.bold { font-weight: bold; }
.page-break { page-break-before: always; }

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6pt;
  margin-bottom: 8pt;
  font-size: 14pt;
}
table.compact-table {
  font-size: 12.5pt;
}
th, td {
  border: 1px solid #000000;
  padding: 4pt 5pt;
  vertical-align: middle;
}
th {
  background-color: #f1f5f9;
  font-weight: bold;
  text-align: center;
}
.th-highlight {
  background-color: #fef08a;
}
.no-border td, .no-border th, table.no-border {
  border: none !important;
}

/* Cover Styling */
.cover-wrapper {
  text-align: center;
  padding-top: 1.5cm;
}
.school-badge {
  font-size: 22pt;
  font-weight: bold;
  color: #0f172a;
  margin-bottom: 4pt;
}
.doc-title {
  font-size: 24pt;
  font-weight: bold;
  color: #1e3a8a;
  margin-top: 10pt;
  margin-bottom: 6pt;
}
.doc-subtitle {
  font-size: 18pt;
  font-weight: bold;
  color: #334155;
  margin-bottom: 12pt;
}
.info-box {
  width: 90%;
  margin: 16pt auto;
  border: 1.5pt solid #1e3a8a;
  padding: 12pt;
  text-align: left;
  font-size: 15pt;
  background-color: #f8fafc;
}
.stat-summary-table {
  width: 95%;
  margin: 12pt auto;
  font-size: 13pt;
}
.stat-summary-table th {
  background-color: #e2e8f0;
}
.signature-grid {
  width: 100%;
  margin-top: 25pt;
}
.signature-box {
  text-align: center;
  padding: 6pt;
  font-size: 14.5pt;
  line-height: 1.3;
}
.section-title {
  font-size: 18pt;
  font-weight: bold;
  color: #0f172a;
  border-bottom: 2pt solid #1e3a8a;
  padding-bottom: 4pt;
  margin-top: 10pt;
  margin-bottom: 8pt;
}
.section-desc {
  font-size: 14pt;
  color: #475569;
  margin-bottom: 8pt;
}
</style>
</head>
<body>

<!-- ========================================== -->
<!-- 1. หน้าปก (COVER SHEET)                    -->
<!-- ========================================== -->
<div class="cover-wrapper">
  <p class="school-badge">${escapeHtml(summary.schoolName)}</p>
  <p style="font-size: 15pt; color: #475569;">${escapeHtml(summary.affiliation)}</p>
  
  <div style="height: 0.8cm;"></div>
  <h1 class="doc-title">แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)</h1>
  <h2 class="doc-subtitle">กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</h2>

  <div class="info-box">
    <p><strong>รายวิชา:</strong> ${escapeHtml(summary.subjectTitle)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>รหัสวิชา:</strong> ${escapeHtml(summary.subjectCode)}</p>
    <p><strong>ระดับชั้น:</strong> ${escapeHtml(summary.classroom)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>ภาคเรียนที่:</strong> ${escapeHtml(summary.term)} &nbsp;&nbsp;&nbsp;&nbsp; <strong>ปีการศึกษา:</strong> ${escapeHtml(summary.academicYear)}</p>
    <p><strong>จำนวนหน่วยกิต:</strong> ${summary.credit} หน่วยกิต &nbsp;&nbsp;&nbsp;&nbsp; <strong>เวลาเรียน:</strong> ${summary.totalHours} ชั่วโมง/ภาค</p>
    <p><strong>ครูผู้สอน:</strong> ${escapeHtml(summary.teacherName)}</p>
    <p><strong>ครูประจำชั้น:</strong> ${escapeHtml(summary.advisorName)}</p>
    <p><strong>ผู้อำนวยการโรงเรียน:</strong> ${escapeHtml(summary.directorName)}</p>
  </div>

  <p class="bold" style="font-size: 15pt; margin-top: 14pt;">สรุปผลการประเมินและการกระจายระดับผลการเรียน</p>
  
  <table class="stat-summary-table">
    <tr>
      <th>ระดับผลการเรียน</th>
      ${gradeLevels.map((g) => `<th>เกรด ${g}</th>`).join('')}
      <th>รวม (คน)</th>
    </tr>
    <tr>
      <td class="bold">จำนวนนักเรียน (คน)</td>
      ${gradeLevels.map((g) => `<td class="text-center">${summary.stats.gradeCounts[g] || 0}</td>`).join('')}
      <td class="text-center bold">${summary.stats.totalStudents}</td>
    </tr>
    <tr>
      <td class="bold">ร้อยละ (%)</td>
      ${gradeLevels.map((g) => `<td class="text-center">${summary.stats.gradePercentages[g] || 0}%</td>`).join('')}
      <td class="text-center bold">100%</td>
    </tr>
  </table>

  <table class="stat-summary-table" style="margin-top: 6pt;">
    <tr>
      <th style="width: 25%;">คะแนนเฉลี่ย (X̄)</th>
      <th style="width: 25%;">ส่วนเบี่ยงเบนมาตรฐาน (S.D.)</th>
      <th style="width: 25%;">ร้อยละที่ได้ระดับ 3 ขึ้นไป</th>
      <th style="width: 25%;">ร้อยละที่ผ่านเกณฑ์</th>
    </tr>
    <tr>
      <td class="text-center bold" style="color: #1e3a8a;">${summary.stats.meanScore}</td>
      <td class="text-center bold">${summary.stats.sdScore}</td>
      <td class="text-center bold" style="color: #15803d;">${summary.stats.qualityPercentage}%</td>
      <td class="text-center bold" style="color: #15803d;">${summary.stats.passPercentage}%</td>
    </tr>
  </table>

  <!-- ลายมือชื่อ 4 ฝ่าย -->
  <table class="no-border signature-grid">
    <tr>
      <td class="signature-box" style="width: 50%;">
        ลงชื่อ........................................................ครูผู้สอน<br>
        (${escapeHtml(summary.teacherName)})<br>
        ตำแหน่ง ครู โรงเรียนบ้านคลองมดแดง
      </td>
      <td class="signature-box" style="width: 50%;">
        ลงชื่อ........................................................ครูประจำชั้น<br>
        (${escapeHtml(summary.advisorName.split(',')[0])})<br>
        ครูประจำชั้น ${escapeHtml(summary.classroom)}
      </td>
    </tr>
    <tr>
      <td class="signature-box" style="padding-top: 18pt;">
        ลงชื่อ........................................................หัวหน้าวิชาการ<br>
        (นายอนันตชัย เพ็ชรรี่)<br>
        หัวหน้าฝ่ายวิชาการและงานวัดผลประเมินผล
      </td>
      <td class="signature-box" style="padding-top: 18pt;">
        ลงชื่อ........................................................ผู้อนุมัติ<br>
        (${escapeHtml(summary.directorName)})<br>
        ผู้อำนวยการโรงเรียนบ้านคลองมดแดง
      </td>
    </tr>
  </table>
</div>

<!-- ========================================== -->
<!-- 2. ตัวชี้วัดและสาระการเรียนรู้แกนกลาง         -->
<!-- ========================================== -->
<div class="page-break"></div>
<h2 class="section-title">หมวดที่ ๑: โครงสร้างหลักสูตรและตัวชี้วัดการเรียนรู้</h2>
<p class="section-desc">รายวิชา ${escapeHtml(summary.subjectTitle)} รหัสวิชา ${escapeHtml(summary.subjectCode)} ชั้น ${escapeHtml(summary.classroom)} ภาคเรียนที่ ${escapeHtml(summary.term)} ปีการศึกษา ${escapeHtml(summary.academicYear)}</p>

<table>
  <thead>
    <tr>
      <th style="width: 10%;">ข้อที่</th>
      <th style="width: 25%;">รหัสตัวชี้วัด</th>
      <th style="width: 65%;">สาระการเรียนรู้ / ข้อความตัวชี้วัดแกนกลาง</th>
    </tr>
  </thead>
  <tbody>
    ${summary.indicators.map((ind, idx) => `
      <tr>
        <td class="text-center bold">${idx + 1}</td>
        <td class="text-center bold">${escapeHtml(ind.code)}</td>
        <td class="text-left">${escapeHtml(ind.title)}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<!-- ========================================== -->
<!-- 3. ข้อมูลนักเรียนและเวลาเรียน                 -->
<!-- ========================================== -->
<div class="page-break"></div>
<h2 class="section-title">หมวดที่ ๒: ข้อมูลประวัตินักเรียนและบันทึกเวลาเรียน</h2>
<p class="section-desc">เวลาเรียนเต็มตามหลักสูตร ${summary.totalHours} ชั่วโมง/ภาค (เกณฑ์ผ่านไม่น้อยกว่าร้อยละ ๘๐ คือต้องมีเวลาเรียนไม่น้อยกว่า ${Math.ceil(summary.totalHours * 0.8)} ชั่วโมง)</p>

<table class="compact-table">
  <thead>
    <tr>
      <th rowspan="2" style="width: 5%;">เลขที่</th>
      <th rowspan="2" style="width: 8%;">รหัสนักเรียน</th>
      <th rowspan="2" style="width: 14%;">เลขประจำตัวประชาชน</th>
      <th rowspan="2" style="width: 20%;">ชื่อ - นามสกุล</th>
      <th rowspan="2" style="width: 10%;">วันเกิด</th>
      <th colspan="4">เวลาเรียน (ชั่วโมง)</th>
      <th rowspan="2" style="width: 8%;">ร้อยละ (%)</th>
      <th rowspan="2" style="width: 8%;">ผลเวลา</th>
    </tr>
    <tr>
      <th style="width: 6%;">มา</th>
      <th style="width: 6%;">ขาด</th>
      <th style="width: 6%;">ลา</th>
      <th style="width: 7%;">รวมเต็ม</th>
    </tr>
  </thead>
  <tbody>
    ${summary.rows.map((r) => `
      <tr>
        <td class="text-center">${r.studentNo}</td>
        <td class="text-center">${escapeHtml(r.studentCode)}</td>
        <td class="text-center" style="font-family: monospace;">${escapeHtml(r.citizenId || '-')}</td>
        <td class="text-left">${escapeHtml(r.fullName)}</td>
        <td class="text-center">${escapeHtml(r.birthDate || '-')}</td>
        <td class="text-center">${r.attendancePresent}</td>
        <td class="text-center">${r.attendanceAbsent}</td>
        <td class="text-center">${r.attendanceSick}</td>
        <td class="text-center bold">${r.attendanceTotalHours}</td>
        <td class="text-center bold">${r.attendancePercentage}%</td>
        <td class="text-center bold" style="color: ${r.attendanceStatus === 'ผ่าน' ? '#15803d' : '#b91c1c'};">${r.attendanceStatus}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<!-- ========================================== -->
<!-- 4. สรุปคะแนนผลการเรียนรู้และตัดเกรด         -->
<!-- ========================================== -->
<div class="page-break"></div>
<h2 class="section-title">หมวดที่ ๓: สรุปคะแนนผลการเรียนรู้และตัดสินผลการเรียน</h2>
<p class="section-desc">สัดส่วนคะแนน: คะแนนเก็บระหว่างภาค ${isPrimary ? '๓๕' : '๕๕'} คะแนน + กลางภาค ${isPrimary ? '-' : '๑๕'} คะแนน + ปลายภาค ${isPrimary ? '๑๕' : '๓๐'} คะแนน = รวม ๑๐๐ คะแนน</p>

<table class="compact-table">
  <thead>
    <tr>
      <th rowspan="2" style="width: 5%;">เลขที่</th>
      <th rowspan="2" style="width: 9%;">รหัส</th>
      <th rowspan="2" style="width: 22%;">ชื่อ - นามสกุล</th>
      <th colspan="3">คะแนนเก็บระหว่างภาค</th>
      <th rowspan="2" style="width: 9%;">รวมเก็บ</th>
      ${!isPrimary ? '<th rowspan="2" style="width: 8%;">กลางภาค</th>' : ''}
      <th rowspan="2" style="width: 8%;">ปลายภาค</th>
      <th rowspan="2" style="width: 9%;">รวมทั้งสิ้น<br>(100)</th>
      <th rowspan="2" style="width: 9%;" class="th-highlight">ระดับเกรด</th>
      <th rowspan="2" style="width: 9%;">ผลตัดสิน</th>
    </tr>
    <tr>
      <th style="width: 7%;">K</th>
      <th style="width: 7%;">P</th>
      <th style="width: 7%;">A</th>
    </tr>
  </thead>
  <tbody>
    ${summary.rows.map((r) => `
      <tr>
        <td class="text-center">${r.studentNo}</td>
        <td class="text-center">${escapeHtml(r.studentCode)}</td>
        <td class="text-left">${escapeHtml(r.fullName)}</td>
        <td class="text-center">${r.collectedK}</td>
        <td class="text-center">${r.collectedP}</td>
        <td class="text-center">${r.collectedA}</td>
        <td class="text-center bold">${r.totalCollected}</td>
        ${!isPrimary ? `<td class="text-center">${r.midtermExam === '' ? '-' : r.midtermExam}</td>` : ''}
        <td class="text-center">${r.finalExam === '' ? '-' : r.finalExam}</td>
        <td class="text-center bold" style="font-size: 13.5pt;">${r.totalScore}</td>
        <td class="text-center bold th-highlight" style="font-size: 14pt; color: ${r.grade === '0' ? '#b91c1c' : '#0f172a'};">${r.grade}</td>
        <td class="text-center bold" style="color: ${r.isPassed ? '#15803d' : '#b91c1c'};">${r.evaluationText}</td>
      </tr>
    `).join('')}
  </tbody>
</table>

<!-- ========================================== -->
<!-- 5. คุณลักษณะอันพึงประสงค์ & อ่านคิดวิเคราะห์   -->
<!-- ========================================== -->
<div class="page-break"></div>
<h2 class="section-title">หมวดที่ ๔: การประเมินคุณลักษณะอันพึงประสงค์และการอ่าน คิดวิเคราะห์ เขียน</h2>
<p class="section-desc">เกณฑ์การตัดสิน: ๓ = ดีเยี่ยม, ๒ = ดี, ๑ = ผ่าน, ๐ = ไม่ผ่าน (ต้องได้ระดับ ๑ ขึ้นไปจึงจะผ่านเกณฑ์)</p>

<table>
  <thead>
    <tr>
      <th rowspan="2" style="width: 6%;">เลขที่</th>
      <th rowspan="2" style="width: 10%;">รหัส</th>
      <th rowspan="2" style="width: 26%;">ชื่อ - นามสกุล</th>
      <th colspan="2">คุณลักษณะอันพึงประสงค์ (๘ ประการ)</th>
      <th colspan="2">การอ่าน คิดวิเคราะห์ และเขียน (๕ ข้อ)</th>
      <th rowspan="2" style="width: 14%;">สมรรถนะสำคัญ</th>
    </tr>
    <tr>
      <th style="width: 11%;">ระดับคะแนน</th>
      <th style="width: 11%;">ผลการตัดสิน</th>
      <th style="width: 11%;">ระดับคะแนน</th>
      <th style="width: 11%;">ผลการตัดสิน</th>
    </tr>
  </thead>
  <tbody>
    ${summary.rows.map((r) => {
      const charLabel = r.characteristicsScore === 3 ? 'ดีเยี่ยม' : r.characteristicsScore === 2 ? 'ดี' : r.characteristicsScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
      const readLabel = r.readingThinkingScore === 3 ? 'ดีเยี่ยม' : r.readingThinkingScore === 2 ? 'ดี' : r.readingThinkingScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
      const compLabel = r.competencyScore === 3 ? 'ดีเยี่ยม' : r.competencyScore === 2 ? 'ดี' : r.competencyScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
      return `
        <tr>
          <td class="text-center">${r.studentNo}</td>
          <td class="text-center">${escapeHtml(r.studentCode)}</td>
          <td class="text-left">${escapeHtml(r.fullName)}</td>
          <td class="text-center bold">${r.characteristicsScore ?? 3}</td>
          <td class="text-center bold" style="color: #15803d;">${charLabel}</td>
          <td class="text-center bold">${r.readingThinkingScore ?? 3}</td>
          <td class="text-center bold" style="color: #15803d;">${readLabel}</td>
          <td class="text-center bold">${compLabel}</td>
        </tr>
      `;
    }).join('')}
  </tbody>
</table>

<div style="height: 0.8cm;"></div>
<table class="no-border" style="width: 100%;">
  <tr>
    <td style="width: 50%; vertical-align: top; padding: 10pt; border: 1pt solid #cbd5e1 !important;">
      <p class="bold">ความเห็นของหัวหน้าฝ่ายวิชาการและงานวัดผลประเมินผล:</p>
      <p style="margin-top: 6pt;">[ &nbsp; ] ตรวจสอบแล้ว ถูกต้องตามระเบียบการวัดและประเมินผล</p>
      <p>[ &nbsp; ] เห็นควรอนุมัติผลการเรียน</p>
      <br><br>
      <p class="text-center">ลงชื่อ........................................................<br>(นายอนันตชัย เพ็ชรรี่)<br>วันที่......./......./.......</p>
    </td>
    <td style="width: 50%; vertical-align: top; padding: 10pt; border: 1pt solid #cbd5e1 !important;">
      <p class="bold">คำสั่ง / ความเห็นของผู้อำนวยการสถานศึกษา:</p>
      <p style="margin-top: 6pt;">[ &nbsp; ] อนุมัติผลการเรียนตามที่เสนอ</p>
      <p>[ &nbsp; ] อื่นๆ............................................................</p>
      <br><br>
      <p class="text-center">ลงชื่อ........................................................<br>(${escapeHtml(summary.directorName)})<br>ผู้อำนวยการโรงเรียนบ้านคลองมดแดง<br>วันที่......./......./.......</p>
    </td>
  </tr>
</table>

</body>
</html>
  `.trim();
};

/**
 * 2. สร้างไฟล์สเปรดชีต Excel แบบ Multi-Sheet (SpreadsheetML XML)
 * เมื่อเปิดด้วย Microsoft Excel จะแสดงชีตแยกกันครบทั้ง 7 ชีตที่ด้านล่างทันที
 */
export const generatePp5CompleteSpreadsheetXml = (summary: ClassroomExportSummary): string => {
  const isPrimary = summary.classroom.startsWith('ป.');
  const gradeLevels = ['4', '3.5', '3', '2.5', '2', '1.5', '1', '0'] as const;

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${escapeXml(summary.teacherName)}</Author>
  <Title>ปพ.5 ${escapeXml(summary.classroom)} ${escapeXml(summary.subjectTitle)}</Title>
  <Company>${escapeXml(summary.schoolName)}</Company>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Borders/>
   <Font ss:FontName="TH SarabunPSK" ss:Size="14"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="TH SarabunPSK" ss:Size="18" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="HeaderSub">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="TH SarabunPSK" ss:Size="14" ss:Color="#334155"/>
  </Style>
  <Style ss:ID="ThYellow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1"/>
   <Interior ss:Color="#FEF08A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ThBlue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1"/>
   <Interior ss:Color="#E0E7FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ThGray">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellBorder">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13"/>
  </Style>
  <Style ss:ID="CellBold">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1"/>
  </Style>
  <Style ss:ID="CellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13"/>
  </Style>
  <Style ss:ID="CellText">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13"/>
   <NumberFormat ss:Format="@"/>
  </Style>
  <Style ss:ID="CellGradePass">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellGradeFail">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- ============================================================== -->
 <!-- SHEET 1: หน้าปก                                                -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="หน้าปก">
  <Table ss:DefaultColumnWidth="60" ss:DefaultRowHeight="22">
   <Column ss:Index="1" ss:Width="70"/>
   <Column ss:Index="2" ss:Width="160"/>
   <Column ss:Index="3" ss:Width="70"/>
   <Column ss:Index="4" ss:Width="70"/>
   <Column ss:Index="5" ss:Width="70"/>
   <Column ss:Index="6" ss:Width="70"/>
   <Column ss:Index="7" ss:Width="70"/>
   <Column ss:Index="8" ss:Width="70"/>
   <Column ss:Index="9" ss:Width="70"/>

   <Row ss:Height="30">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderTitle"><Data ss:Type="String">${escapeXml(summary.schoolName)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderSub"><Data ss:Type="String">${escapeXml(summary.affiliation)}</Data></Cell>
   </Row>
   <Row ss:Height="26">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderTitle"><Data ss:Type="String">แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderSub"><Data ss:Type="String">กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี รายวิชา ${escapeXml(summary.subjectTitle)} (${escapeXml(summary.subjectCode)})</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderSub"><Data ss:Type="String">ชั้น ${escapeXml(summary.classroom)} ภาคเรียนที่ ${escapeXml(summary.term)} ปีการศึกษา ${escapeXml(summary.academicYear)} • ${summary.credit} หน่วยกิต (${summary.totalHours} ชั่วโมง/ภาค)</Data></Cell>
   </Row>
   <Row ss:Height="15"><Cell ss:MergeAcross="8"><Data ss:Type="String"></Data></Cell></Row>

   <!-- สรุปผลการเรียน -->
   <Row ss:Height="24">
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">เกรด</Data></Cell>
    ${gradeLevels.map((g) => `<Cell ss:StyleID="ThBlue"><Data ss:Type="String">เกรด ${g}</Data></Cell>`).join('')}
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="CellBold"><Data ss:Type="String">จำนวน (คน)</Data></Cell>
    ${gradeLevels.map((g) => `<Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${summary.stats.gradeCounts[g] || 0}</Data></Cell>`).join('')}
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="CellBold"><Data ss:Type="String">ร้อยละ (%)</Data></Cell>
    ${gradeLevels.map((g) => `<Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${summary.stats.gradePercentages[g] || 0}</Data></Cell>`).join('')}
   </Row>

   <Row ss:Height="20"><Cell ss:MergeAcross="8"><Data ss:Type="String"></Data></Cell></Row>

   <!-- ข้อมูลสถิติ -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="2" ss:StyleID="ThYellow"><Data ss:Type="String">คะแนนเฉลี่ย (X̄): ${summary.stats.meanScore}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="ThYellow"><Data ss:Type="String">ส่วนเบี่ยงเบนมาตรฐาน (S.D.): ${summary.stats.sdScore}</Data></Cell>
    <Cell ss:MergeAcross="2" ss:StyleID="ThYellow"><Data ss:Type="String">ผ่านเกณฑ์: ${summary.stats.passPercentage}%</Data></Cell>
   </Row>

   <Row ss:Height="30"><Cell ss:MergeAcross="8"><Data ss:Type="String"></Data></Cell></Row>

   <!-- ลายมือชื่อ -->
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="CellLeft"><Data ss:Type="String">ครูผู้สอน: ${escapeXml(summary.teacherName)}</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="CellLeft"><Data ss:Type="String">ครูประจำชั้น: ${escapeXml(summary.advisorName)}</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:MergeAcross="3" ss:StyleID="CellLeft"><Data ss:Type="String">หัวหน้าวิชาการ: นายอนันตชัย เพ็ชรรี่</Data></Cell>
    <Cell ss:MergeAcross="4" ss:StyleID="CellLeft"><Data ss:Type="String">ผู้อำนวยการ: ${escapeXml(summary.directorName)}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 2: ข้อมูลเกี่ยวกับนักเรียน                                 -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="ข้อมูลเกี่ยวกับนักเรียน">
  <Table ss:DefaultColumnWidth="75" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="70"/>
   <Column ss:Index="3" ss:Width="130"/>
   <Column ss:Index="4" ss:Width="180"/>
   <Column ss:Index="5" ss:Width="90"/>
   <Column ss:Index="6" ss:Width="150"/>
   <Column ss:Index="7" ss:Width="150"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="6" ss:StyleID="HeaderTitle"><Data ss:Type="String">ข้อมูลเกี่ยวกับนักเรียน ชั้น ${escapeXml(summary.classroom)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="6" ss:StyleID="HeaderSub"><Data ss:Type="String">โรงเรียนบ้านคลองมดแดง ปีการศึกษา ${escapeXml(summary.academicYear)}</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="6"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">รหัสนักเรียน</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขประจำตัวประชาชน</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อ - นามสกุล</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">วันเดือนปีเกิด</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อบิดา</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อมารดา</Data></Cell>
   </Row>

   ${summary.rows.map((r) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.citizenId || '-')}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="String">${escapeXml(r.birthDate || '-')}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fatherName || '-')}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.motherName || '-')}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 3: ตัวชี้วัด                                              -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="ตัวชี้วัด">
  <Table ss:DefaultColumnWidth="80" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="50"/>
   <Column ss:Index="2" ss:Width="120"/>
   <Column ss:Index="3" ss:Width="500"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="2" ss:StyleID="HeaderTitle"><Data ss:Type="String">ตัวชี้วัด วิชา ${escapeXml(summary.subjectTitle)} (${escapeXml(summary.subjectCode)})</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="HeaderSub"><Data ss:Type="String">ชั้น ${escapeXml(summary.classroom)} ภาคเรียนที่ ${escapeXml(summary.term)} ปีการศึกษา ${escapeXml(summary.academicYear)}</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="2"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ข้อที่</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">รหัสตัวชี้วัด</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">คำอธิบายตัวชี้วัดแกนกลาง</Data></Cell>
   </Row>

   ${summary.indicators.map((ind, idx) => `
   <Row ss:Height="26">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="String">${escapeXml(ind.code)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(ind.title)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 4: เวลาเรียน                                             -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="เวลาเรียน">
  <Table ss:DefaultColumnWidth="65" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="70"/>
   <Column ss:Index="3" ss:Width="180"/>
   <Column ss:Index="4" ss:Width="75"/>
   <Column ss:Index="5" ss:Width="75"/>
   <Column ss:Index="6" ss:Width="75"/>
   <Column ss:Index="7" ss:Width="80"/>
   <Column ss:Index="8" ss:Width="75"/>
   <Column ss:Index="9" ss:Width="75"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderTitle"><Data ss:Type="String">สรุปเวลาเรียน วิชา ${escapeXml(summary.subjectTitle)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderSub"><Data ss:Type="String">ชั้น ${escapeXml(summary.classroom)} เวลาเรียนทั้งหมด ${summary.totalHours} ชั่วโมง/ภาค (เกณฑ์ผ่าน 80%)</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="8"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">รหัส</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อ - นามสกุล</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เวลาเรียนเต็ม</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">มาเรียน (ชม.)</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ขาด (ชม.)</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ลา (ชม.)</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ร้อยละ (%)</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ผลประเมิน</Data></Cell>
   </Row>

   ${summary.rows.map((r) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.attendanceTotalHours}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.attendancePresent}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.attendanceAbsent}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.attendanceSick}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${r.attendancePercentage}</Data></Cell>
    <Cell ss:StyleID="${r.attendanceStatus === 'ผ่าน' ? 'CellGradePass' : 'CellGradeFail'}"><Data ss:Type="String">${r.attendanceStatus}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 5: สรุปคะแนน                                            -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="สรุปคะแนน">
  <Table ss:DefaultColumnWidth="55" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="65"/>
   <Column ss:Index="3" ss:Width="180"/>
   <Column ss:Index="4" ss:Width="60"/>
   <Column ss:Index="5" ss:Width="60"/>
   <Column ss:Index="6" ss:Width="60"/>
   <Column ss:Index="7" ss:Width="75"/>
   ${!isPrimary ? '<Column ss:Index="8" ss:Width="70"/>' : ''}
   <Column ss:Index="${!isPrimary ? 9 : 8}" ss:Width="70"/>
   <Column ss:Index="${!isPrimary ? 10 : 9}" ss:Width="75"/>
   <Column ss:Index="${!isPrimary ? 11 : 10}" ss:Width="65"/>
   <Column ss:Index="${!isPrimary ? 12 : 11}" ss:Width="70"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="${!isPrimary ? 11 : 10}" ss:StyleID="HeaderTitle"><Data ss:Type="String">สรุปผลคะแนนรายวิชา ${escapeXml(summary.subjectTitle)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="${!isPrimary ? 11 : 10}" ss:StyleID="HeaderSub"><Data ss:Type="String">ชั้น ${escapeXml(summary.classroom)} ภาคเรียนที่ ${escapeXml(summary.term)} ปีการศึกษา ${escapeXml(summary.academicYear)}</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="${!isPrimary ? 11 : 10}"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">รหัส</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อ - นามสกุล</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">เก็บ K</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">เก็บ P</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">เก็บ A</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">รวมเก็บ</Data></Cell>
    ${!isPrimary ? '<Cell ss:StyleID="ThYellow"><Data ss:Type="String">กลางภาค</Data></Cell>' : ''}
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ปลายภาค</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">รวม 100</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เกรด</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ผลตัดสิน</Data></Cell>
   </Row>

   ${summary.rows.map((r) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.collectedK}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.collectedP}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.collectedA}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${r.totalCollected}</Data></Cell>
    ${!isPrimary ? `<Cell ss:StyleID="CellBorder"><Data ss:Type="${r.midtermExam === '' ? 'String' : 'Number'}">${r.midtermExam === '' ? '-' : r.midtermExam}</Data></Cell>` : ''}
    <Cell ss:StyleID="CellBorder"><Data ss:Type="${r.finalExam === '' ? 'String' : 'Number'}">${r.finalExam === '' ? '-' : r.finalExam}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${r.totalScore}</Data></Cell>
    <Cell ss:StyleID="${r.grade === '0' ? 'CellGradeFail' : 'CellGradePass'}"><Data ss:Type="String">${r.grade}</Data></Cell>
    <Cell ss:StyleID="${r.isPassed ? 'CellGradePass' : 'CellGradeFail'}"><Data ss:Type="String">${r.evaluationText}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 6: คุณลักษณะ                                            -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="คุณลักษณะ">
  <Table ss:DefaultColumnWidth="45" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="65"/>
   <Column ss:Index="3" ss:Width="180"/>
   <Column ss:Index="4" ss:Width="40"/>
   <Column ss:Index="5" ss:Width="40"/>
   <Column ss:Index="6" ss:Width="40"/>
   <Column ss:Index="7" ss:Width="40"/>
   <Column ss:Index="8" ss:Width="40"/>
   <Column ss:Index="9" ss:Width="40"/>
   <Column ss:Index="10" ss:Width="40"/>
   <Column ss:Index="11" ss:Width="40"/>
   <Column ss:Index="12" ss:Width="60"/>
   <Column ss:Index="13" ss:Width="70"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="12" ss:StyleID="HeaderTitle"><Data ss:Type="String">แบบประเมินคุณลักษณะอันพึงประสงค์ 8 ประการ</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="12" ss:StyleID="HeaderSub"><Data ss:Type="String">ชั้น ${escapeXml(summary.classroom)} ภาคเรียนที่ ${escapeXml(summary.term)} ปีการศึกษา ${escapeXml(summary.academicYear)}</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="12"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThGray"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThGray"><Data ss:Type="String">รหัส</Data></Cell>
    <Cell ss:StyleID="ThGray"><Data ss:Type="String">ชื่อ - นามสกุล</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 1</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 2</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 3</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 4</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 5</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 6</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 7</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 8</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">สรุปผล</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ระดับ</Data></Cell>
   </Row>

   ${summary.rows.map((r) => {
     const score = r.characteristicsScore ?? 3;
     const label = score === 3 ? 'ดีเยี่ยม' : score === 2 ? 'ดี' : score === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
     return `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellGradePass"><Data ss:Type="String">${label}</Data></Cell>
   </Row>
     `;
   }).join('')}
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 7: อ่านคิด                                              -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="อ่านคิด">
  <Table ss:DefaultColumnWidth="50" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="65"/>
   <Column ss:Index="3" ss:Width="180"/>
   <Column ss:Index="4" ss:Width="50"/>
   <Column ss:Index="5" ss:Width="50"/>
   <Column ss:Index="6" ss:Width="50"/>
   <Column ss:Index="7" ss:Width="50"/>
   <Column ss:Index="8" ss:Width="50"/>
   <Column ss:Index="9" ss:Width="60"/>
   <Column ss:Index="10" ss:Width="70"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="9" ss:StyleID="HeaderTitle"><Data ss:Type="String">แบบประเมินการอ่าน คิดวิเคราะห์ และเขียน (5 ข้อ)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="9" ss:StyleID="HeaderSub"><Data ss:Type="String">ชั้น ${escapeXml(summary.classroom)} ภาคเรียนที่ ${escapeXml(summary.term)} ปีการศึกษา ${escapeXml(summary.academicYear)}</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="9"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThGray"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThGray"><Data ss:Type="String">รหัส</Data></Cell>
    <Cell ss:StyleID="ThGray"><Data ss:Type="String">ชื่อ - นามสกุล</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 1</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 2</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 3</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 4</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ข้อ 5</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">สรุปผล</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ระดับ</Data></Cell>
   </Row>

   ${summary.rows.map((r) => {
     const score = r.readingThinkingScore ?? 3;
     const label = score === 3 ? 'ดีเยี่ยม' : score === 2 ? 'ดี' : score === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
     return `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${score}</Data></Cell>
    <Cell ss:StyleID="CellGradePass"><Data ss:Type="String">${label}</Data></Cell>
   </Row>
     `;
   }).join('')}
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 8: สรุปเวลา (ตามฟอร์ม ปพ.5 โรงเรียนบ้านคลองมดแดง)        -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="สรุปเวลา">
  <Table ss:DefaultColumnWidth="65" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="70"/>
   <Column ss:Index="3" ss:Width="180"/>
   <Column ss:Index="4" ss:Width="65"/>
   <Column ss:Index="5" ss:Width="65"/>
   <Column ss:Index="6" ss:Width="65"/>
   <Column ss:Index="7" ss:Width="75"/>
   <Column ss:Index="8" ss:Width="75"/>
   <Column ss:Index="9" ss:Width="80"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderTitle"><Data ss:Type="String">สรุปผลเวลามาเรียน วิชา ${escapeXml(summary.subjectTitle)} รหัสวิชา ${escapeXml(summary.subjectCode)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="8" ss:StyleID="HeaderSub"><Data ss:Type="String">ชั้น ${escapeXml(summary.classroom)} ภาคเรียนที่ ${escapeXml(summary.term)} ปีการศึกษา ${escapeXml(summary.academicYear)} • เวลาเรียนทั้งหมด ${summary.totalHours} คาบ</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="8"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขประจำตัว</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อ - สกุล</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ป่วย</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ลา</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ขาด</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">มาเรียน</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ร้อยละ (%)</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ผลการประเมิน</Data></Cell>
   </Row>

   ${summary.rows.map((r) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.attendanceSick}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">0</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.attendanceAbsent}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${r.attendancePresent}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${r.attendancePercentage}</Data></Cell>
    <Cell ss:StyleID="${r.attendanceStatus === 'ผ่าน' ? 'CellGradePass' : 'CellGradeFail'}"><Data ss:Type="String">${r.attendanceStatus}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- ============================================================== -->
 <!-- SHEET 9: ปกหลัง (คำชี้แจงการจัดทำ ปพ.5 มาตรฐาน สพฐ.)           -->
 <!-- ============================================================== -->
 <Worksheet ss:Name="ปกหลัง">
  <Table ss:DefaultColumnWidth="85" ss:DefaultRowHeight="22">
   <Column ss:Index="1" ss:Width="150"/>
   <Column ss:Index="2" ss:Width="180"/>
   <Column ss:Index="3" ss:Width="260"/>

   <Row ss:Height="28">
    <Cell ss:MergeAcross="2" ss:StyleID="HeaderTitle"><Data ss:Type="String">คำชี้แจงการจัดทำแบบบันทึกผลการเรียนประจำรายวิชา (ปพ.5)</Data></Cell>
   </Row>
   <Row ss:Height="22"><Cell ss:MergeAcross="2" ss:StyleID="CellLeft"><Data ss:Type="String">1. บันทึกข้อมูลเกี่ยวกับตัวนักเรียนตามทะเบียนนักเรียน (DMC โรงเรียนบ้านคลองมดแดง)</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:MergeAcross="2" ss:StyleID="CellLeft"><Data ss:Type="String">2. บันทึกการตรวจสอบการผ่านผลการเรียนตามตัวชี้วัด/ผลการเรียนรู้ ของนักเรียนรายบุคคล</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:MergeAcross="2" ss:StyleID="CellLeft"><Data ss:Type="String">3. บันทึกผลการประเมินระหว่างเรียนและปลายภาค/ปลายปี รวม 100 คะแนน</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:MergeAcross="2" ss:StyleID="CellLeft"><Data ss:Type="String">4. เกณฑ์การตัดสินระดับผลการเรียน 8 ระดับ ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง 2560)</Data></Cell></Row>
   <Row ss:Height="14"><Cell ss:MergeAcross="2"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ระดับผลการเรียน</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ช่วงคะแนนร้อยละ</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ความหมายผลการเรียน</Data></Cell>
   </Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 4</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">80 - 100</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนดีเยี่ยม</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 3.5</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">75 - 79</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนดีมาก</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 3</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">70 - 74</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนดี</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 2.5</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">65 - 69</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนค่อนข้างดี</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 2</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">60 - 64</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนปานกลาง</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 1.5</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">55 - 59</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนพอใช้</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 1</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">50 - 54</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนผ่านเกณฑ์ขั้นต่ำ</Data></Cell></Row>
   <Row ss:Height="20"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับ 0</Data></Cell><Cell ss:StyleID="CellBorder"><Data ss:Type="String">0 - 49</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">ผลการเรียนต่ำกว่าเกณฑ์ขั้นต่ำ</Data></Cell></Row>
  </Table>
 </Worksheet>
</Workbook>
  `.trim();
};

/**
 * 3. สร้างไฟล์สเปรดชีต Excel แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6)
 * ตามโครงสร้างไฟล์ ปพ.6 ประถม.xlsx และ ปพ.6 มัธยม.xlsx
 * ประกอบด้วย 4 ชีต:
 * - กำหนดข้อมูล
 * - บันทึกข้อมูล คะแนน
 * - บันทึก คุณลักษณะ อ่านคิด กิจกรรม
 * - รายงาน ปพ.6
 */
export const generatePp6CompleteSpreadsheetXml = (summary: ClassroomExportSummary): string => {
  const isPrimary = summary.classroom.startsWith('ป.');

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>${escapeXml(summary.teacherName)}</Author>
  <Title>ปพ.6 ${escapeXml(summary.classroom)} ${escapeXml(summary.subjectTitle)}</Title>
  <Company>${escapeXml(summary.schoolName)}</Company>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="TH SarabunPSK" ss:Size="14"/>
  </Style>
  <Style ss:ID="HeaderTitle">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="TH SarabunPSK" ss:Size="18" ss:Bold="1" ss:Color="#0F172A"/>
  </Style>
  <Style ss:ID="HeaderSub">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Font ss:FontName="TH SarabunPSK" ss:Size="14" ss:Color="#334155"/>
  </Style>
  <Style ss:ID="ThYellow">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1"/>
   <Interior ss:Color="#FEF08A" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="ThBlue">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1"/>
   <Interior ss:Color="#E0E7FF" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellBorder">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13"/>
  </Style>
  <Style ss:ID="CellBold">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1"/>
  </Style>
  <Style ss:ID="CellLeft">
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13"/>
  </Style>
  <Style ss:ID="CellText">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13"/>
   <NumberFormat ss:Format="@"/>
  </Style>
  <Style ss:ID="CellGradePass">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1" ss:Color="#15803D"/>
   <Interior ss:Color="#DCFCE7" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="CellGradeFail">
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
   <Font ss:FontName="TH SarabunPSK" ss:Size="13" ss:Bold="1" ss:Color="#B91C1C"/>
   <Interior ss:Color="#FEE2E2" ss:Pattern="Solid"/>
  </Style>
 </Styles>

 <!-- SHEET 1: กำหนดข้อมูล -->
 <Worksheet ss:Name="กำหนดข้อมูล">
  <Table ss:DefaultColumnWidth="120" ss:DefaultRowHeight="22">
   <Column ss:Index="1" ss:Width="150"/>
   <Column ss:Index="2" ss:Width="320"/>
   <Row ss:Height="28">
    <Cell ss:MergeAcross="1" ss:StyleID="HeaderTitle"><Data ss:Type="String">ข้อมูลพื้นฐานสำหรับออกรายงาน ปพ.6 (${escapeXml(summary.classroom)})</Data></Cell>
   </Row>
   <Row ss:Height="22"><Cell ss:StyleID="ThBlue"><Data ss:Type="String">รายการ</Data></Cell><Cell ss:StyleID="ThBlue"><Data ss:Type="String">ข้อมูล</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">โรงเรียน</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.schoolName)}</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">สังกัด</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.affiliation)}</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ผู้อำนวยการโรงเรียน</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.directorName)}</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ครูประจำชั้น</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.advisorName)}</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ครูผู้สอน</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.teacherName)}</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ระดับชั้น</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.classroom)}</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">ภาคเรียนที่ / ปีการศึกษา</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.term)} / ${escapeXml(summary.academicYear)}</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">รายวิชา</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.subjectTitle)} (${escapeXml(summary.subjectCode)})</Data></Cell></Row>
   <Row ss:Height="22"><Cell ss:StyleID="CellBold"><Data ss:Type="String">จำนวนหน่วยกิต / เวลาเรียน</Data></Cell><Cell ss:StyleID="CellLeft"><Data ss:Type="String">${summary.credit} หน่วยกิต (${summary.totalHours} ชั่วโมง)</Data></Cell></Row>
  </Table>
 </Worksheet>

 <!-- SHEET 2: บันทึกข้อมูล คะแนน -->
 <Worksheet ss:Name="บันทึกข้อมูล คะแนน">
  <Table ss:DefaultColumnWidth="70" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="75"/>
   <Column ss:Index="3" ss:Width="120"/>
   <Column ss:Index="4" ss:Width="185"/>
   <Column ss:Index="5" ss:Width="75"/>
   ${!isPrimary ? '<Column ss:Index="6" ss:Width="75"/>' : ''}
   <Column ss:Index="${!isPrimary ? 7 : 6}" ss:Width="75"/>
   <Column ss:Index="${!isPrimary ? 8 : 7}" ss:Width="80"/>
   <Column ss:Index="${!isPrimary ? 9 : 8}" ss:Width="70"/>
   <Column ss:Index="${!isPrimary ? 10 : 9}" ss:Width="80"/>

   <Row ss:Height="26">
    <Cell ss:MergeAcross="${!isPrimary ? 9 : 8}" ss:StyleID="HeaderTitle"><Data ss:Type="String">บันทึกผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6) — ชั้น ${escapeXml(summary.classroom)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="${!isPrimary ? 9 : 8}" ss:StyleID="HeaderSub"><Data ss:Type="String">${escapeXml(summary.schoolName)} • วิชา ${escapeXml(summary.subjectTitle)} (${escapeXml(summary.subjectCode)}) • ภาคเรียนที่ ${escapeXml(summary.term)}/${escapeXml(summary.academicYear)}</Data></Cell>
   </Row>
   <Row ss:Height="12"><Cell ss:MergeAcross="${!isPrimary ? 9 : 8}"><Data ss:Type="String"></Data></Cell></Row>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขประจำตัว</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขบัตรประชาชน</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อ-นามสกุล</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">คะแนนเก็บ</Data></Cell>
    ${!isPrimary ? '<Cell ss:StyleID="ThBlue"><Data ss:Type="String">กลางภาค</Data></Cell>' : ''}
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ปลายภาค</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">คะแนนรวม</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ผลการเรียน</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ผลตัดสิน</Data></Cell>
   </Row>

   ${summary.rows.map((r) => `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.citizenId || '-')}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.totalCollected}</Data></Cell>
    ${!isPrimary ? `<Cell ss:StyleID="CellBorder"><Data ss:Type="${r.midtermExam === '' ? 'String' : 'Number'}">${r.midtermExam === '' ? '-' : r.midtermExam}</Data></Cell>` : ''}
    <Cell ss:StyleID="CellBorder"><Data ss:Type="${r.finalExam === '' ? 'String' : 'Number'}">${r.finalExam === '' ? '-' : r.finalExam}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${r.totalScore}</Data></Cell>
    <Cell ss:StyleID="${r.grade === '0' ? 'CellGradeFail' : 'CellGradePass'}"><Data ss:Type="String">${escapeXml(r.grade)}</Data></Cell>
    <Cell ss:StyleID="${r.isPassed ? 'CellGradePass' : 'CellGradeFail'}"><Data ss:Type="String">${escapeXml(r.evaluationText)}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 3: บันทึก คุณลักษณะ อ่านคิด กิจกรร -->
 <Worksheet ss:Name="บันทึก คุณลักษณะ อ่านคิด กิจกรร">
  <Table ss:DefaultColumnWidth="85" ss:DefaultRowHeight="20">
   <Column ss:Index="1" ss:Width="45"/>
   <Column ss:Index="2" ss:Width="75"/>
   <Column ss:Index="3" ss:Width="185"/>
   <Column ss:Index="4" ss:Width="135"/>
   <Column ss:Index="5" ss:Width="135"/>
   <Column ss:Index="6" ss:Width="120"/>

   <Row ss:Height="24">
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขที่</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">เลขประจำตัว</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ชื่อ-นามสกุล</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">คุณลักษณะอันพึงประสงค์ของสถานศึกษา</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">การอ่าน คิด วิเคราะห์และเขียน</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">กิจกรรมพัฒนาผู้เรียน</Data></Cell>
   </Row>

   ${summary.rows.map((r) => {
     const charScore = r.characteristicsScore ?? 3;
     const readScore = r.readingThinkingScore ?? 3;
     const charLabel = charScore === 3 ? 'ดีเยี่ยม' : charScore === 2 ? 'ดี' : charScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
     const readLabel = readScore === 3 ? 'ดีเยี่ยม' : readScore === 2 ? 'ดี' : readScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
     return `
   <Row ss:Height="20">
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.studentNo}</Data></Cell>
    <Cell ss:StyleID="CellText"><Data ss:Type="String">${escapeXml(r.studentCode)}</Data></Cell>
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(r.fullName)}</Data></Cell>
    <Cell ss:StyleID="CellGradePass"><Data ss:Type="String">${charLabel}</Data></Cell>
    <Cell ss:StyleID="CellGradePass"><Data ss:Type="String">${readLabel}</Data></Cell>
    <Cell ss:StyleID="CellGradePass"><Data ss:Type="String">ผ่าน</Data></Cell>
   </Row>
     `;
   }).join('')}
  </Table>
 </Worksheet>

 <!-- SHEET 4: รายงาน ปพ.6 -->
 <Worksheet ss:Name="รายงาน ปพ.6">
  <Table ss:DefaultColumnWidth="85" ss:DefaultRowHeight="22">
   <Column ss:Index="1" ss:Width="170"/>
   <Column ss:Index="2" ss:Width="85"/>
   <Column ss:Index="3" ss:Width="85"/>
   <Column ss:Index="4" ss:Width="85"/>
   <Column ss:Index="5" ss:Width="95"/>
   <Column ss:Index="6" ss:Width="95"/>
   <Column ss:Index="7" ss:Width="95"/>

   ${summary.rows.map((r) => {
     const charScore = r.characteristicsScore ?? 3;
     const readScore = r.readingThinkingScore ?? 3;
     const charLabel = charScore === 3 ? 'ดีเยี่ยม' : charScore === 2 ? 'ดี' : charScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
     const readLabel = readScore === 3 ? 'ดีเยี่ยม' : readScore === 2 ? 'ดี' : readScore === 1 ? 'ผ่าน' : 'ไม่ผ่าน';
     return `
   <Row ss:Height="26">
    <Cell ss:MergeAcross="6" ss:StyleID="HeaderTitle"><Data ss:Type="String">แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="6" ss:StyleID="HeaderSub"><Data ss:Type="String">${escapeXml(summary.schoolName)} • ${escapeXml(summary.affiliation)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="6" ss:StyleID="CellBold"><Data ss:Type="String">เลขที่ ${r.studentNo} | เลขประจำตัว ${escapeXml(r.studentCode)} | ชื่อ-สกุล ${escapeXml(r.fullName)} | ชั้น ${escapeXml(summary.classroom)} | ภาคเรียนที่ ${escapeXml(summary.term)}/${escapeXml(summary.academicYear)}</Data></Cell>
   </Row>
   <Row ss:Height="24">
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">รายวิชา</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">ประเภท</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">เวลาเรียน (ชม.)</Data></Cell>
    <Cell ss:StyleID="ThBlue"><Data ss:Type="String">หน่วยกิต</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">คะแนนเก็บ</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">คะแนนรวม</Data></Cell>
    <Cell ss:StyleID="ThYellow"><Data ss:Type="String">ผลการเรียน</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="CellLeft"><Data ss:Type="String">${escapeXml(summary.subjectTitle)} (${escapeXml(summary.subjectCode)})</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="String">พื้นฐาน</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${summary.totalHours}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${summary.credit}</Data></Cell>
    <Cell ss:StyleID="CellBorder"><Data ss:Type="Number">${r.totalCollected}</Data></Cell>
    <Cell ss:StyleID="CellBold"><Data ss:Type="Number">${r.totalScore}</Data></Cell>
    <Cell ss:StyleID="CellGradePass"><Data ss:Type="String">${escapeXml(r.grade)}</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="CellLeft"><Data ss:Type="String">คุณลักษณะอันพึงประสงค์: ${charLabel}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="CellLeft"><Data ss:Type="String">อ่าน คิดวิเคราะห์ เขียน: ${readLabel}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="CellLeft"><Data ss:Type="String">เวลาเรียน: ${r.attendancePresent}/${r.attendanceTotalHours} ชม. (${r.attendancePercentage}%)</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:MergeAcross="2" ss:StyleID="CellLeft"><Data ss:Type="String">ครูประจำชั้น/ผู้สอน: ${escapeXml(summary.teacherName)}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="CellLeft"><Data ss:Type="String">ผอ.โรงเรียน: ${escapeXml(summary.directorName)}</Data></Cell>
    <Cell ss:MergeAcross="1" ss:StyleID="CellLeft"><Data ss:Type="String">ลงชื่อ..........................................ผู้ปกครอง</Data></Cell>
   </Row>
   <Row ss:Height="18"><Cell ss:MergeAcross="6"><Data ss:Type="String"></Data></Cell></Row>
     `;
   }).join('')}
  </Table>
 </Worksheet>
</Workbook>
  `.trim();
};

/**
 * 4. สร้างเอกสาร Word (.doc) สำหรับ ปพ.6 (แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล)
 */
export const generatePp6CompleteDocxHtml = (
  summary: ClassroomExportSummary,
  selectedStudentCode?: string,
): string => {
  const isPrimary = summary.classroom.startsWith('ป.');
  const rows = selectedStudentCode
    ? summary.rows.filter((r) => r.studentCode === selectedStudentCode)
    : summary.rows;

  return `
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<title>รายงาน ปพ.6_${summary.classroom}_${summary.subjectTitle}</title>
<style>
@page {
  size: 21.0cm 29.7cm;
  margin: 1.8cm 1.8cm 1.8cm 1.8cm;
}
body {
  font-family: 'TH SarabunPSK', 'TH Sarabun New', serif;
  font-size: 15pt;
  color: #000000;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6pt;
  margin-bottom: 6pt;
  font-size: 14pt;
}
th, td {
  border: 1px solid #000000;
  padding: 4pt 6pt;
  vertical-align: middle;
}
th {
  background-color: #f1f5f9;
  font-weight: bold;
  text-align: center;
}
.text-center { text-align: center; }
.text-left { text-align: left; }
.bold { font-weight: bold; }
.page-break { page-break-before: always; }
.no-border td, table.no-border { border: none !important; }
</style>
</head>
<body>
${rows.map((r, idx) => {
  const charScore = r.characteristicsScore ?? 3;
  const readScore = r.readingThinkingScore ?? 3;
  const compScore = r.competencyScore ?? 3;
  const charLabel = charScore === 3 ? 'ดีเยี่ยม (3)' : charScore === 2 ? 'ดี (2)' : charScore === 1 ? 'ผ่าน (1)' : 'ไม่ผ่าน (0)';
  const readLabel = readScore === 3 ? 'ดีเยี่ยม (3)' : readScore === 2 ? 'ดี (2)' : readScore === 1 ? 'ผ่าน (1)' : 'ไม่ผ่าน (0)';
  const compLabel = compScore === 3 ? 'ดีเยี่ยม (3)' : compScore === 2 ? 'ดี (2)' : compScore === 1 ? 'ผ่าน (1)' : 'ไม่ผ่าน (0)';
  return `
  ${idx > 0 ? '<div class="page-break"></div>' : ''}
  <div style="border: 1.5pt solid #0f172a; padding: 14pt;">
    <p class="text-center bold" style="font-size: 20pt;">แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6)</p>
    <p class="text-center bold" style="font-size: 16pt;">${escapeHtml(summary.schoolName)}</p>
    <p class="text-center" style="font-size: 14pt;">${escapeHtml(summary.affiliation)}</p>
    <p class="text-center bold" style="font-size: 15pt; margin-top: 4pt;">ระดับชั้น ${escapeHtml(summary.classroom)} • ภาคเรียนที่ ${escapeHtml(summary.term)} ปีการศึกษา ${escapeHtml(summary.academicYear)}</p>

    <table style="margin-top: 8pt;">
      <tr>
        <td style="width: 18%;"><strong>เลขที่:</strong> ${r.studentNo}</td>
        <td style="width: 24%;"><strong>เลขประจำตัว:</strong> ${escapeHtml(r.studentCode)}</td>
        <td style="width: 58%;"><strong>ชื่อ-นามสกุล:</strong> ${escapeHtml(r.fullName)}</td>
      </tr>
      <tr>
        <td colspan="2"><strong>เลขประจำตัวประชาชน:</strong> ${escapeHtml(r.citizenId || '-')}</td>
        <td><strong>บิดา/มารดา:</strong> ${escapeHtml(r.fatherName || '-')} / ${escapeHtml(r.motherName || '-')}</td>
      </tr>
    </table>

    <p class="bold" style="margin-top: 8pt;">๑. ผลการประเมินรายวิชาและตัวชี้วัด</p>
    <table>
      <thead>
        <tr>
          <th style="width: 28%;">รหัสและชื่อรายวิชา</th>
          <th style="width: 10%;">ประเภท</th>
          <th style="width: 10%;">เวลาเรียน<br>(ชม.)</th>
          <th style="width: 10%;">หน่วยกิต</th>
          <th style="width: 11%;">คะแนนเก็บ</th>
          ${!isPrimary ? '<th style="width: 10%;">กลางภาค</th>' : ''}
          <th style="width: 10%;">ปลายภาค</th>
          <th style="width: 11%;">คะแนนรวม</th>
          <th style="width: 10%;">ผลการเรียน</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="text-left bold">${escapeHtml(summary.subjectTitle)} (${escapeHtml(summary.subjectCode)})</td>
          <td class="text-center">พื้นฐาน</td>
          <td class="text-center">${summary.totalHours}</td>
          <td class="text-center">${summary.credit}</td>
          <td class="text-center">${r.totalCollected}</td>
          ${!isPrimary ? `<td class="text-center">${r.midtermExam === '' ? '-' : r.midtermExam}</td>` : ''}
          <td class="text-center">${r.finalExam === '' ? '-' : r.finalExam}</td>
          <td class="text-center bold">${r.totalScore}</td>
          <td class="text-center bold">${escapeHtml(r.grade)}</td>
        </tr>
      </tbody>
    </table>

    <p class="bold" style="margin-top: 8pt;">๒. ผลการประเมินตามตัวชี้วัดรายวิชา (${summary.indicators.length} ตัวชี้วัด)</p>
    <table>
      <thead>
        <tr>
          <th style="width: 18%;">รหัสตัวชี้วัด</th>
          <th style="width: 52%;">คำอธิบายตัวชี้วัด</th>
          <th style="width: 10%;">คะแนน K</th>
          <th style="width: 10%;">ทักษะ P</th>
          <th style="width: 10%;">คุณลักษณะ A</th>
        </tr>
      </thead>
      <tbody>
        ${summary.indicators.map((ind) => {
          const s = r.indicatorScores[ind.id] || { k: 0, p: 'พอใช้', a: false };
          return `
          <tr>
            <td class="text-center bold">${escapeHtml(ind.code)}</td>
            <td class="text-left">${escapeHtml(ind.title)}</td>
            <td class="text-center">${s.k}/${ind.maxScore}</td>
            <td class="text-center">${escapeHtml(s.p)}</td>
            <td class="text-center">${s.a ? 'ผ่าน' : 'รอประเมิน'}</td>
          </tr>
          `;
        }).join('')}
      </tbody>
    </table>

    <p class="bold" style="margin-top: 8pt;">๓. สรุปการประเมินคุณลักษณะอันพึงประสงค์ การอ่านคิดวิเคราะห์ และเวลาเรียน</p>
    <table>
      <tr>
        <td style="width: 50%;"><strong>คุณลักษณะอันพึงประสงค์ของสถานศึกษา:</strong> ${charLabel}</td>
        <td style="width: 50%;"><strong>การอ่าน คิดวิเคราะห์ และเขียน:</strong> ${readLabel}</td>
      </tr>
      <tr>
        <td><strong>สมรรถนะสำคัญของผู้เรียน:</strong> ${compLabel}</td>
        <td><strong>กิจกรรมพัฒนาผู้เรียน:</strong> ผ่าน</td>
      </tr>
      <tr>
        <td colspan="2"><strong>สรุปเวลาเรียน:</strong> เวลาเรียนเต็ม ${r.attendanceTotalHours} ชั่วโมง • มาเรียน ${r.attendancePresent} ชั่วโมง • ลาป่วย ${r.attendanceSick} ชั่วโมง • ขาด ${r.attendanceAbsent} ชั่วโมง (คิดเป็นร้อยละ ${r.attendancePercentage}% — <strong>${r.attendanceStatus}</strong>)</td>
      </tr>
    </table>

    <table class="no-border" style="margin-top: 18pt;">
      <tr>
        <td class="text-center" style="width: 33%;">
          ลงชื่อ..................................................<br>
          (${escapeHtml(summary.teacherName)})<br>
          ครูผู้สอน
        </td>
        <td class="text-center" style="width: 33%;">
          ลงชื่อ..................................................<br>
          (${escapeHtml(summary.advisorName.split(',')[0])})<br>
          ครูประจำชั้น ${escapeHtml(summary.classroom)}
        </td>
        <td class="text-center" style="width: 34%;">
          ลงชื่อ..................................................<br>
          (${escapeHtml(summary.directorName)})<br>
          ผู้อำนวยการโรงเรียนบ้านคลองมดแดง
        </td>
      </tr>
      <tr>
        <td colspan="3" class="text-center" style="padding-top: 14pt;">
          <strong>ส่วนรับทราบผลการเรียนของผู้ปกครอง:</strong> ข้าพเจ้ารับทราบผลการเรียนของ ${escapeHtml(r.fullName)} &nbsp;&nbsp; ลงชื่อ..................................................ผู้ปกครอง (..................................................)
        </td>
      </tr>
    </table>
  </div>
  `;
}).join('')}
</body>
</html>
  `.trim();
};

/**
 * ฟังก์ชันดาวน์โหลดเล่ม Word ปพ.5 สมบูรณ์ (.doc / .docx)
 */
export const downloadClassroomPp5Docx = (summary: ClassroomExportSummary): void => {
  const content = generatePp5CompleteDocxHtml(summary);
  const cleanTitle = summary.subjectTitle.replace(/\s+/g, '_');
  const filename = `ปพ5_เล่มสมบูรณ์_${summary.classroom}_${cleanTitle}_${summary.academicYear}_ท${summary.term}.doc`;
  downloadFile(content, filename, 'application/msword;charset=utf-8');
};

/**
 * ฟังก์ชันดาวน์โหลดเล่ม Excel ปพ.5 สมบูรณ์ 9 ชีต (.xls / Multi-Sheet XML)
 */
export const downloadClassroomPp5CompleteExcel = (summary: ClassroomExportSummary): void => {
  const content = generatePp5CompleteSpreadsheetXml(summary);
  const cleanTitle = summary.subjectTitle.replace(/\s+/g, '_');
  const filename = `ปพ5_เล่มสมบูรณ์_${summary.classroom}_${cleanTitle}_${summary.academicYear}_ท${summary.term}.xls`;
  downloadFile(content, filename, 'application/vnd.ms-excel;charset=utf-8');
};

/**
 * ฟังก์ชันดาวน์โหลดไฟล์ Excel ปพ.6 สมบูรณ์ 4 ชีต (.xls / Multi-Sheet XML)
 */
export const downloadClassroomPp6Excel = (summary: ClassroomExportSummary): void => {
  const content = generatePp6CompleteSpreadsheetXml(summary);
  const cleanTitle = summary.subjectTitle.replace(/\s+/g, '_');
  const filename = `ปพ6_รายงานรายบุคคล_${summary.classroom}_${cleanTitle}_${summary.academicYear}_ท${summary.term}.xls`;
  downloadFile(content, filename, 'application/vnd.ms-excel;charset=utf-8');
};

/**
 * ฟังก์ชันดาวน์โหลดไฟล์ Word ปพ.6 รายบุคคลหรือทั้งห้อง (.doc)
 */
export const downloadClassroomPp6Docx = (
  summary: ClassroomExportSummary,
  selectedStudentCode?: string,
): void => {
  const content = generatePp6CompleteDocxHtml(summary, selectedStudentCode);
  const cleanTitle = summary.subjectTitle.replace(/\s+/g, '_');
  const suffix = selectedStudentCode ? `_${selectedStudentCode}` : '_ทั้งห้อง';
  const filename = `ปพ6_รายงานผลการเรียน_${summary.classroom}_${cleanTitle}${suffix}_${summary.academicYear}.doc`;
  downloadFile(content, filename, 'application/msword;charset=utf-8');
};

