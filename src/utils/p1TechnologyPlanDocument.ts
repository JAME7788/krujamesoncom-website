import {
  p1AnnualUnits,
  p1LessonPlans,
  p1TechnologyCourse,
} from '../data/p1TechnologyPlan';
import type { P1LessonPlan } from '../data/p1TechnologyPlan';

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const listHtml = (items: string[]) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;

const planHtml = (plan: P1LessonPlan) => {
  const unit = p1AnnualUnits.find((item) => item.no === plan.unitNo);
  const semester = plan.no <= 20 ? 1 : 2;
  return `<article class="plan">
<h1>แผนการจัดการเรียนรู้ที่ ${plan.no}</h1>
<div class="official">
<p>รายวิชา${escapeHtml(p1TechnologyCourse.courseName)} รหัสวิชา ว11101</p><p>ชั้น${escapeHtml(p1TechnologyCourse.grade)}</p>
<p>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</p><p>ภาคเรียนที่ ${semester} ปีการศึกษา ${p1TechnologyCourse.academicYear}</p>
<p>หน่วยการเรียนรู้ที่ ${plan.unitNo} ${escapeHtml(unit?.title || plan.title)}</p><p>เวลา ${unit?.hours || plan.hours} ชั่วโมง</p>
<p>เรื่อง ${escapeHtml(plan.title)}</p><p>เวลา ${plan.hours} ชั่วโมง</p>
<p>ครูผู้สอน ${escapeHtml(p1TechnologyCourse.teacher)}</p><p>วันที่สอน ......./........./...........</p>
</div><div class="official-rule"></div>
<h2>1. มาตรฐานการเรียนรู้/ตัวชี้วัด</h2>
<p><b>มาตรฐาน ว 4.2</b> เข้าใจและใช้แนวคิดเชิงคำนวณในการแก้ปัญหาที่พบในชีวิตจริงอย่างเป็นขั้นตอน ใช้เทคโนโลยีสารสนเทศและการสื่อสารในการเรียนรู้ การทำงาน และการแก้ปัญหาได้อย่างมีประสิทธิภาพ รู้เท่าทัน และมีจริยธรรม</p>
${listHtml(plan.indicators)}
<p><b>คำถามสำคัญ:</b> ${escapeHtml(plan.essentialQuestion)}</p>
<h2>2. สาระสำคัญ</h2><p>${escapeHtml(plan.concept)}</p>
<h2>3. จุดประสงค์การเรียนรู้</h2>
<table><tr><th>ด้าน</th><th>จุดประสงค์</th></tr>${plan.objectives.map((item) => `<tr><td><b>${item.domain}</b></td><td>${escapeHtml(item.text)}</td></tr>`).join('')}</table>
<h2>4. สาระการเรียนรู้</h2>${listHtml(plan.content)}
<h2>5. รูปแบบการสอน/วิธีการสอน</h2><p>บทเรียนบนเว็บ (WBI) ร่วมกับ Active Learning การสาธิต การฝึกแบบมีผู้ชี้แนะ เกมหรือภารกิจ และการสะท้อนผลท้ายคาบ</p>
<h2>6. สมรรถนะสำคัญของผู้เรียน</h2>${listHtml(p1TechnologyCourse.competencies)}
<h2>7. คุณลักษณะอันพึงประสงค์</h2>${listHtml(p1TechnologyCourse.characteristics)}
<h2>8. การจัดกระบวนการเรียนรู้</h2>
<table><tr><th style="width:18%">ขั้น/เวลา</th><th>กิจกรรมครูและผู้เรียน</th><th style="width:23%">หลักฐาน</th></tr>${plan.steps.map((step) => `<tr><td><b>${escapeHtml(step.phase)}</b><br>${step.minutes} นาที</td><td><b>ครู:</b> ${escapeHtml(step.teacher)}<br><b>ผู้เรียน:</b> ${escapeHtml(step.students)}</td><td>${escapeHtml(step.evidence)}</td></tr>`).join('')}</table>
<h2>9. สื่อและแหล่งเรียนรู้</h2>${listHtml(plan.media.map((item) => item.label))}
<p><b>ใบงาน:</b> ${escapeHtml(plan.worksheet)}</p><p><b>ชิ้นงาน:</b> ${escapeHtml(plan.product)}</p>
<h2>10. การวัดและประเมินผล</h2>
<table><tr><th>ด้าน</th><th>วิธีการ</th><th>เครื่องมือ</th><th>เกณฑ์ผ่าน</th></tr>${plan.assessments.map((item) => `<tr><td><b>${item.domain}</b></td><td>${escapeHtml(item.method)}</td><td>${escapeHtml(item.instrument)}</td><td>${escapeHtml(item.criteria)}</td></tr>`).join('')}</table>
<h2>11. การช่วยเหลือและเพิ่มความท้าทาย</h2>${listHtml(plan.support)}
<h2>12. บันทึกหลังสอน</h2>
<p>นักเรียนผ่านจุดประสงค์ .......... คน คิดเป็นร้อยละ ..........</p>
<p>สิ่งที่ทำได้ดี ....................................................................................................................................................</p>
<p>ปัญหา/สาเหตุ ..................................................................................................................................................</p>
<p>แนวทางปรับปรุง ..............................................................................................................................................</p>
<div class="signature"><p>ลงชื่อ ........................................................ ครูผู้สอน</p><p>(${escapeHtml(p1TechnologyCourse.teacher)})</p></div>
</article>`;
};

export const buildP1TechnologyPlanDocumentHtml = () => `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><title>แผนเทคโนโลยี ป.1 ปีการศึกษา ${p1TechnologyCourse.academicYear}</title>
<style>
@page { size: A4; margin: 1.5cm; }
body { color:#111; font-family:"TH Sarabun New","Sarabun",Arial,sans-serif; font-size:16pt; line-height:1.35; }
h1 { margin:0 0 8pt; font-size:20pt; text-align:center; } h2 { margin:12pt 0 4pt; font-size:17pt; }
p { margin:2pt 0; } .official { display:grid; grid-template-columns:1.35fr .65fr; gap:1pt 18pt; font-weight:700; }
.official-rule { height:1.5pt; margin-top:6pt; background:#111; }
table { width:100%; margin:6pt 0; border-collapse:collapse; } th,td { padding:5pt 6pt; border:1px solid #444; vertical-align:top; } th { background:#e8eef5; text-align:center; }
ul { margin:3pt 0 0 22pt; padding:0; } li { margin-bottom:2pt; } .signature { width:48%; margin:22pt 0 0 auto; text-align:center; }
.plan { break-after:page; } .plan:last-child { break-after:auto; } tr { break-inside:avoid; }
</style></head><body>
${p1LessonPlans.map(planHtml).join('')}
</body></html>`;
