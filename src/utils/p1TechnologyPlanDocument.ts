import {
  p1AnnualUnits,
  p1Indicators,
  p1LessonPlans,
  p1TechnologyCourse,
} from '../data/p1TechnologyPlan';
import type { P1LessonPlan } from '../data/p1TechnologyPlan';
import type { LessonRecord } from '../services/lessonRecordService';

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const listHtml = (items: string[], ordered = false) => {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`;
};

const checkGridHtml = (items: string[]) => {
  const rows: string[] = [];
  for (let index = 0; index < items.length; index += 2) {
    rows.push(`<tr><td>☑ ${escapeHtml(items[index])}</td><td>${items[index + 1] ? `☑ ${escapeHtml(items[index + 1])}` : ''}</td></tr>`);
  }
  return `<table class="check-table">${rows.join('')}</table>`;
};

const percent = (count?: number, total?: number) => (
  total && count !== undefined ? (Math.round((count / total) * 1000) / 10).toFixed(1) : '-'
);

const displayDate = (value?: string) => {
  if (!value) return '......./........./...........';
  const [year, month, day] = value.split('-');
  return year && month && day ? `${day}/${month}/${year}` : escapeHtml(value);
};

const objectiveLabel = { K: 'ด้านพุทธิพิสัย (K)', P: 'ด้านทักษะพิสัย (P)', A: 'ด้านจิตพิสัย (A)' } as const;

const rubricDescription = (domain: 'K' | 'P' | 'A', score: 3 | 2 | 1) => {
  if (domain === 'K') {
    return score === 3
      ? 'อธิบายความรู้และตอบคำถามได้ถูกต้อง ชัดเจน และยกตัวอย่างได้ด้วยตนเอง'
      : score === 2
        ? 'อธิบายความรู้และตอบคำถามได้ถูกต้องเป็นส่วนใหญ่ เมื่อได้รับคำแนะนำเล็กน้อย'
        : 'อธิบายความรู้หรือตอบคำถามได้บางส่วน เมื่อครูช่วยชี้แนะ';
  }
  if (domain === 'P') {
    return score === 3
      ? 'ปฏิบัติงานตามขั้นตอนได้ถูกต้องครบถ้วน ตรวจสอบและอธิบายวิธีทำได้'
      : score === 2
        ? 'ปฏิบัติงานได้ถูกต้องเป็นส่วนใหญ่ และแก้ไขงานได้เมื่อได้รับคำแนะนำ'
        : 'ปฏิบัติงานได้บางส่วน โดยต้องได้รับการช่วยเหลืออย่างใกล้ชิด';
  }
  return score === 3
    ? 'ปฏิบัติตามข้อตกลง รับผิดชอบ และร่วมกิจกรรมอย่างสม่ำเสมอ'
    : score === 2
      ? 'ปฏิบัติตามข้อตกลงและร่วมกิจกรรมเป็นส่วนใหญ่ เมื่อได้รับคำเตือนเล็กน้อย'
      : 'ปฏิบัติตามข้อตกลงหรือร่วมกิจกรรมได้บางครั้ง และต้องได้รับการดูแล';
};

const postTeachingHtml = (record?: LessonRecord) => {
  if (!record) {
    return `<h2>15. บันทึกหลังสอน</h2>
<p><b>สถานะ:</b> ยังไม่มีบันทึกหลังสอนในระบบ</p>
<p>นักเรียนทั้งหมด .......... คน ผ่านจุดประสงค์ .......... คน คิดเป็นร้อยละ ..........</p>
<p>นักเรียนไม่ผ่านจุดประสงค์ .......... คน คิดเป็นร้อยละ ..........</p>
<p><b>สรุปผลการจัดการเรียนรู้</b></p><p class="write-line">........................................................................................................................................................</p>
<p><b>สิ่งที่ผู้เรียนทำได้ดี</b></p><p class="write-line">........................................................................................................................................................</p>
<p><b>ปัญหาและสาเหตุ</b></p><p class="write-line">........................................................................................................................................................</p>
<p><b>แนวทางปรับปรุงและสิ่งที่จะทำในคาบถัดไป</b></p><p class="write-line">........................................................................................................................................................</p>`;
  }

  const total = record.totalStudents ?? record.snapshot.totalStudents;
  const passed = record.passedCount ?? record.snapshot.passed;
  const failed = record.failedCount ?? Math.max(0, total - passed);
  return `<h2>15. บันทึกหลังสอน</h2>
<table class="record-table"><tr><th>วันที่สอน</th><th>สถานะ</th><th>มาเรียน</th><th>ผ่าน</th><th>ไม่ผ่าน</th></tr>
<tr><td>${displayDate(record.teachingDate)}</td><td>${record.status === 'complete' ? 'บันทึกสมบูรณ์' : 'ฉบับร่าง'}</td><td>${record.snapshot.present}/${total}</td><td>${passed} คน<br>ร้อยละ ${percent(passed, total)}</td><td>${failed} คน<br>ร้อยละ ${percent(failed, total)}</td></tr></table>
<p><b>สรุปผลการจัดการเรียนรู้:</b> ${escapeHtml(record.summary || '-')}</p>
<p><b>สิ่งที่ผู้เรียนทำได้ดี:</b> ${escapeHtml(record.strengths || '-')}</p>
<p><b>ปัญหาที่พบ:</b> ${escapeHtml(record.problems || '-')}</p>
<p><b>สาเหตุ:</b> ${escapeHtml(record.causes || '-')}</p>
<p><b>แนวทางปรับปรุง:</b> ${escapeHtml(record.improvements || '-')}</p>
<p><b>สิ่งที่จะทำในคาบถัดไป:</b> ${escapeHtml(record.nextAction || '-')}</p>`;
};

const measurementTable = (plan: P1LessonPlan) => `<table>
<thead><tr><th>จุดประสงค์</th><th>วิธีการประเมิน</th><th>เครื่องมือการประเมิน</th><th>เกณฑ์การประเมิน</th></tr></thead>
<tbody>${plan.assessments.map((item) => {
  const objective = plan.objectives.find((candidate) => candidate.domain === item.domain)?.text || '-';
  return `<tr><td>${escapeHtml(objective)} (${item.domain})</td><td>${escapeHtml(item.method)}</td><td>${escapeHtml(item.instrument)}</td><td>${escapeHtml(item.criteria)}</td></tr>`;
}).join('')}</tbody></table>`;

const scoringRubric = (plan: P1LessonPlan) => `<table>
<thead><tr><th rowspan="2">ประเด็นการประเมินชิ้นงาน</th><th colspan="3">คำอธิบายระดับคุณภาพ / ระดับคะแนน</th></tr><tr><th>ดี (3 คะแนน)</th><th>พอใช้ (2 คะแนน)</th><th>ปรับปรุง (1 คะแนน)</th></tr></thead>
<tbody>${plan.objectives.map((item) => `<tr><td>${escapeHtml(item.text)} (${item.domain})</td><td>${rubricDescription(item.domain, 3)}</td><td>${rubricDescription(item.domain, 2)}</td><td>${rubricDescription(item.domain, 1)}</td></tr>`).join('')}</tbody></table>`;

const behaviorTable = () => `<table>
<thead><tr><th rowspan="2">พฤติกรรมที่สังเกต</th><th colspan="3">ระดับคะแนน</th></tr><tr><th>3</th><th>2</th><th>1</th></tr></thead>
<tbody>${p1TechnologyCourse.characteristics.map((item, index) => `<tr><td>${index + 1}. ${escapeHtml(item)}</td><td></td><td></td><td></td></tr>`).join('')}<tr><td class="center"><b>รวมคะแนน</b></td><td colspan="3"></td></tr></tbody></table>
<p><b>เกณฑ์การตัดสินคุณภาพ</b></p><table class="quality-table"><tr><th>ช่วงคะแนน</th><th>ระดับคุณภาพ</th></tr><tr><td>13 - 15</td><td>ดีมาก</td></tr><tr><td>10 - 12</td><td>ดี</td></tr><tr><td>7 - 9</td><td>พอใช้</td></tr><tr><td>1 - 6</td><td>ปรับปรุง</td></tr></table>`;

const productTable = (plan: P1LessonPlan) => {
  const criteria = [
    'ความสอดคล้องกับเนื้อหาและโจทย์',
    'ความถูกต้องของขั้นตอนหรือวิธีทำงาน',
    'การอธิบายเหตุผลและตรวจสอบผลงาน',
    'ความรับผิดชอบและความเรียบร้อยของชิ้นงาน',
  ];
  return `<p><b>ชิ้นงาน:</b> ${escapeHtml(plan.product)}</p><table>
<thead><tr><th>ประเด็นการประเมินชิ้นงาน</th><th>3 คะแนน</th><th>2 คะแนน</th><th>1 คะแนน</th></tr></thead>
<tbody>${criteria.map((item, index) => `<tr><td>${index + 1}. ${item}</td><td></td><td></td><td></td></tr>`).join('')}<tr><td class="center"><b>รวมคะแนน</b></td><td colspan="3"></td></tr></tbody></table>
<p><b>เกณฑ์การตัดสินคุณภาพ</b></p><table class="quality-table"><tr><th>ช่วงคะแนน</th><th>ระดับคุณภาพ</th></tr><tr><td>9 - 12</td><td>ดี</td></tr><tr><td>5 - 8</td><td>พอใช้</td></tr><tr><td>1 - 4</td><td>ปรับปรุง</td></tr></table>`;
};

const planHtml = (plan: P1LessonPlan, record?: LessonRecord) => {
  const unit = p1AnnualUnits.find((item) => item.no === plan.unitNo);
  const semester = plan.no <= 20 ? 1 : 2;
  const indicatorTexts = plan.indicators.map((code) => {
    const indicator = p1Indicators.find((item) => item.code === code);
    return `${code} ${indicator?.text || ''}`.trim();
  });
  return `<article class="plan">
<h1>แผนการจัดการเรียนรู้ที่ ${plan.no}</h1>
<table class="metadata"><tr><td>รายวิชา${escapeHtml(p1TechnologyCourse.courseName)} รหัสวิชา ว11101</td><td>ชั้น${escapeHtml(p1TechnologyCourse.grade)}</td></tr>
<tr><td>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</td><td>ภาคเรียนที่ ${semester} ปีการศึกษา ${p1TechnologyCourse.academicYear}</td></tr>
<tr><td>หน่วยการเรียนรู้ที่ ${plan.unitNo} ${escapeHtml(unit?.title || plan.title)}</td><td>เวลา ${unit?.hours || plan.hours} ชั่วโมง</td></tr>
<tr><td>เรื่อง ${escapeHtml(plan.title)}</td><td>เวลา ${plan.hours} ชั่วโมง</td></tr>
<tr><td>ครูผู้สอน ${escapeHtml(p1TechnologyCourse.teacher)}</td><td>วันที่สอน ${displayDate(record?.teachingDate)}</td></tr></table>
<div class="official-rule"></div>
<h2>1. มาตรฐานการเรียนรู้/ตัวชี้วัด</h2>
<p class="indent"><b>สาระที่ 4 เทคโนโลยี</b></p>
<p class="indent"><b>มาตรฐาน ว 4.2</b> เข้าใจและใช้แนวคิดเชิงคำนวณในการแก้ปัญหาที่พบในชีวิตจริงอย่างเป็นขั้นตอนและเป็นระบบ ใช้เทคโนโลยีสารสนเทศและการสื่อสารในการเรียนรู้ การทำงาน และการแก้ปัญหาได้อย่างมีประสิทธิภาพ รู้เท่าทัน และมีจริยธรรม</p>
${listHtml(indicatorTexts)}
<h2>2. สาระสำคัญ</h2><p class="indent">${escapeHtml(plan.concept)}</p>
<h2>3. จุดประสงค์การเรียนรู้</h2>${plan.objectives.map((item, index) => `<h3>3.${index + 1} ${objectiveLabel[item.domain]}</h3><p class="objective">3.${index + 1}.1 ${escapeHtml(item.text)}</p>`).join('')}
<h2>4. สาระการเรียนรู้</h2>${listHtml(plan.content, true)}
<h2>5. รูปแบบการสอน / วิธีการสอน</h2><p class="numbered">5.1 บทเรียนผ่านเว็บ (Web-based Instruction)</p><p class="numbered">5.2 การจัดการเรียนรู้เชิงรุก (Active Learning)</p><p class="numbered">5.3 การสาธิต การฝึกแบบมีผู้ชี้แนะ เกมหรือภารกิจ และการสะท้อนผล</p>
<h2>6. สมรรถนะสำคัญของผู้เรียน</h2><div class="check-list">${p1TechnologyCourse.competencies.map((item) => `<p>☑ ${escapeHtml(item)}</p>`).join('')}</div>
<h2>7. ทักษะ 4 Cs</h2><div class="check-list"><p>☑ ทักษะการคิดวิจารณญาณ (Critical Thinking)</p><p>☑ ทักษะการทำงานร่วมกัน (Collaboration Skill)</p><p>☑ ทักษะการสื่อสาร (Communication Skill)</p><p>☑ ทักษะความคิดสร้างสรรค์ (Creative Thinking)</p></div>
<h2>8. คุณลักษณะอันพึงประสงค์</h2>${checkGridHtml(p1TechnologyCourse.characteristics)}
<h2>9. การจัดกระบวนการเรียนรู้</h2><h3>ชั่วโมงที่ ${plan.no}</h3>${plan.steps.map((step) => `<h3>${escapeHtml(step.phase)} (${step.minutes} นาที)</h3><ol><li><b>บทบาทครู:</b> ${escapeHtml(step.teacher)}</li><li><b>บทบาทนักเรียน:</b> ${escapeHtml(step.students)}</li><li><b>หลักฐาน:</b> ${escapeHtml(step.evidence)}</li></ol>`).join('')}
<h2>10. สื่อและแหล่งการเรียนรู้</h2>${listHtml(plan.media.map((item) => item.label), true)}<p class="numbered"><b>ใบงาน:</b> ${escapeHtml(plan.worksheet)}</p><p class="numbered"><b>ชิ้นงาน:</b> ${escapeHtml(plan.product)}</p>
<h2>11. การวัดและการประเมินผล</h2>${measurementTable(plan)}
<h2>12. เกณฑ์การให้คะแนน</h2>${scoringRubric(plan)}
<h2>13. แบบสังเกตพฤติกรรมของนักเรียน</h2><p><b>คำชี้แจง:</b> ครูพิจารณาให้คะแนนนักเรียนรายบุคคล โดยใช้เกณฑ์ 3 = มาก  2 = ปานกลาง  1 = น้อย</p>${behaviorTable()}
<h2>14. แบบประเมินใบงานและชิ้นงาน</h2>${productTable(plan)}
${postTeachingHtml(record)}
<div class="signature"><p>ลงชื่อ ........................................................ ครูผู้สอน</p><p>(${escapeHtml(p1TechnologyCourse.teacher)})</p></div>
</article>`;
};

const latestRecordByPlan = (records: LessonRecord[]) => {
  const result = new Map<number, LessonRecord>();
  records
    .filter((record) => !record.archived && record.classroom === 'ป.1' && record.subject === 'main')
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .forEach((record) => {
      if (!result.has(record.planNo)) result.set(record.planNo, record);
    });
  return result;
};

export const buildP1TechnologyPlanDocumentHtml = (records: LessonRecord[] = []) => {
  const recordsByPlan = latestRecordByPlan(records);
  return `<!doctype html><html lang="th"><head><meta charset="utf-8"><title>แผนพร้อมบันทึกหลังสอน เทคโนโลยี ป.1 ปีการศึกษา ${p1TechnologyCourse.academicYear}</title>
<style>
@page { size: A4 portrait; margin: 2.54cm; }
body { color:#000; font-family:"TH SarabunPSK","TH Sarabun New",serif; font-size:16pt; line-height:1.15; }
h1 { margin:0 0 5pt; font-size:18pt; text-align:center; font-weight:bold; }
h2 { margin:14pt 0 3pt; font-size:16pt; font-weight:bold; page-break-after:avoid; }
h3 { margin:5pt 0 2pt 36pt; font-size:16pt; font-weight:bold; page-break-after:avoid; }
p { margin:1pt 0; } .indent { text-indent:36pt; text-align:justify; } .objective { margin-left:72pt; }
.numbered { margin-left:36pt; } ul,ol { margin:2pt 0 4pt 54pt; padding-left:18pt; } li { margin:1pt 0; }
.metadata { width:100%; border-collapse:collapse; margin:0; font-weight:normal; }
.metadata td { border:0; padding:0; vertical-align:top; } .metadata td:first-child { width:68%; } .metadata td:last-child { width:32%; text-align:right; }
.official-rule { border-top:1.25pt solid #000; margin:3pt 0 10pt; }
.check-list { margin-left:52pt; } .check-list p { margin:1pt 0; }
table { width:100%; margin:5pt 0 10pt; border-collapse:collapse; page-break-inside:auto; }
th,td { border:1px solid #000; padding:4pt 5pt; vertical-align:top; }
th { background:#e7e7e7; text-align:center; font-weight:bold; vertical-align:middle; }
.metadata { margin:0; } .metadata,.metadata td,.check-table,.check-table td { border:0; }
.check-table { width:88%; margin:0 0 5pt 52pt; } .check-table td { width:50%; padding:1pt 4pt; }
thead { display:table-header-group; } tr { page-break-inside:avoid; }
.quality-table { width:56% !important; margin-left:auto !important; margin-right:auto !important; page-break-inside:avoid; } .quality-table td { text-align:center; }
.record-table td { text-align:center; vertical-align:middle !important; } .center { text-align:center; }
.write-line { margin:2pt 0 8pt; } .signature { width:48%; margin:22pt 0 0 auto; text-align:center; }
.plan { page-break-after:always; } .plan:last-child { page-break-after:auto; }
</style></head><body>${p1LessonPlans.map((plan) => planHtml(plan, recordsByPlan.get(plan.no))).join('')}</body></html>`;
};
