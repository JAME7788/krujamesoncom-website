import { findGrade } from '../data/curriculum';
import type {
  PrimaryGrade,
  PrimaryTechnologyCompetencyPlan,
} from '../data/primaryTechnologyCompetencyPlans';
import {
  characteristicCriteria,
  technologyCompetencyCriteria,
} from '../data/primaryTechnologyCompetencyPlans';
import { ACADEMIC_YEAR, COURSE_TEACHER_NAME } from '../services/gradeService';

const escapeHtml = (value: string) => value
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const listHtml = (items: string[]) => `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;

export const primaryGradeNumber = (grade: PrimaryGrade) => Number(grade.replace('ป.', ''));
export const primaryGradeId = (grade: PrimaryGrade) => `p${primaryGradeNumber(grade)}`;
export const primaryFullClassName = (grade: PrimaryGrade) => `ชั้นประถมศึกษาปีที่ ${primaryGradeNumber(grade)}`;
export const primaryTechnologyCourseCode = (grade: PrimaryGrade) => `ว1${primaryGradeNumber(grade)}101`;
export const PRIMARY_TECHNOLOGY_UNIT_TITLE = 'การค้นหา คัดเลือก และจัดการข้อมูลด้วยเทคโนโลยี';

export const buildPrimaryTechnologyPlanDocumentHtml = (
  plan: PrimaryTechnologyCompetencyPlan,
) => {
  const profile = findGrade(primaryGradeId(plan.grade))?.technologyProfile;
  const courseDescription = profile?.courseDescription || plan.concept;
  return `<!doctype html>
<html lang="th"><head><meta charset="utf-8"><title>แผนการจัดการเรียนรู้ ${escapeHtml(plan.grade)}</title>
<style>
@page { size: A4 portrait; margin: 2.54cm; }
body { font-family:"TH SarabunPSK","TH Sarabun New",serif; color:#000; font-size:16pt; line-height:1.15; }
h1 { margin:0 0 5pt; font-size:18pt; text-align:center; } h2 { margin:14pt 0 3pt; font-size:16pt; page-break-after:avoid; }
h3 { margin:5pt 0 2pt 36pt; font-size:16pt; page-break-after:avoid; } p { margin:1pt 0; }
.official { display:grid; grid-template-columns:68% 32%; margin-top:0; } .official p:nth-child(even) { text-align:right; }
.official-rule { border-top:1.25pt solid #000; margin:3pt 0 10pt; }
.indent { text-indent:36pt; text-align:justify; } .objective { margin-left:72pt; }
.check-list { margin-left:52pt; } .check-list p { margin:1pt 0; }
.check-grid { margin-left:52pt; } .check-grid p { display:inline-block; width:45%; }
ul,ol { margin:2pt 0 4pt 54pt; padding-left:18pt; } li { margin:1pt 0; }
table { width:100%; border-collapse:collapse; margin:3pt 0 7pt; } th,td { border:1px solid #000; padding:3pt 4pt; vertical-align:top; }
th { background:#e7e7e7; text-align:center; vertical-align:middle; } thead { display:table-header-group; } tr { page-break-inside:avoid; }
.score-form { font-size:15pt; }
.score-form th,.score-form td { padding:0.5pt 3pt; mso-padding-alt:0.5pt 3pt 0.5pt 3pt; line-height:1; vertical-align:middle; }
.score-form th:first-child,.score-form td:first-child { width:68%; }
.score-form th:not(:first-child),.score-form td:not(:first-child) { width:10.67%; text-align:center; }
.quality { width:56%; margin:2pt auto 6pt; page-break-inside:avoid; }
.quality { font-size:15pt; }
.quality th,.quality td { padding:0.5pt 3pt; mso-padding-alt:0.5pt 3pt 0.5pt 3pt; line-height:1; text-align:center; vertical-align:middle; }
.signature { width:48%; margin:22pt 0 0 auto; text-align:center; }
</style></head><body>
<h1>แผนการจัดการเรียนรู้ที่ 1</h1>
<div class="official">
<p>รายวิชาเทคโนโลยี (วิทยาการคำนวณ) รหัสวิชา ${primaryTechnologyCourseCode(plan.grade)}</p><p>${primaryFullClassName(plan.grade)}</p>
<p>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</p><p>ภาคเรียนที่ 1 ปีการศึกษา ${ACADEMIC_YEAR}</p>
<p>หน่วยการเรียนรู้ที่ 1 ${PRIMARY_TECHNOLOGY_UNIT_TITLE}</p><p>เวลา 4 ชั่วโมง</p>
<p>เรื่อง ${escapeHtml(plan.title)}</p><p>เวลา 4 ชั่วโมง</p>
<p>ครูผู้สอน ${escapeHtml(COURSE_TEACHER_NAME)}</p><p>วันที่สอน ......./........./...........</p>
</div><div class="official-rule"></div>
<h2>1. มาตรฐานการเรียนรู้/ตัวชี้วัด</h2><p class="indent"><b>สาระที่ 4 เทคโนโลยี</b></p><p class="indent"><b>มาตรฐาน ว 4.2</b> เข้าใจและใช้แนวคิดเชิงคำนวณในการแก้ปัญหาที่พบในชีวิตจริงอย่างเป็นขั้นตอนและเป็นระบบ ใช้เทคโนโลยีสารสนเทศและการสื่อสารในการเรียนรู้ การทำงาน และการแก้ปัญหาได้อย่างมีประสิทธิภาพ รู้เท่าทัน และมีจริยธรรม</p>${listHtml(plan.subIndicators.map((item) => `${item.code} ${item.description}`))}
<h2>2. สาระสำคัญ</h2><p class="indent">${escapeHtml(plan.concept)}</p><p class="indent">${escapeHtml(courseDescription)}</p>
<h2>3. จุดประสงค์การเรียนรู้</h2><h3>3.1 ด้านพุทธิพิสัย (K)</h3><p class="objective">3.1.1 ${escapeHtml(plan.objectives.k)}</p><h3>3.2 ด้านทักษะพิสัย (P)</h3><p class="objective">3.2.1 ${escapeHtml(plan.objectives.p)}</p><h3>3.3 ด้านจิตพิสัย (A)</h3><p class="objective">3.3.1 ${escapeHtml(plan.objectives.a)}</p>
<h2>4. สาระการเรียนรู้</h2>${listHtml(plan.content)}
<h2>5. รูปแบบการสอน / วิธีการสอน</h2><ol><li>บทเรียนผ่านเว็บ (Web-based Instruction)</li><li>การจัดการเรียนรู้เชิงรุก (Active Learning)</li><li>การสาธิต การฝึกแบบมีผู้ชี้แนะ และการสะท้อนผล</li></ol>
<h2>6. สมรรถนะสำคัญของผู้เรียน</h2><div class="check-list">${technologyCompetencyCriteria.map((item) => `<p>☑ ${escapeHtml(item)}</p>`).join('')}</div>
<h2>7. ทักษะ 4 Cs</h2><div class="check-list"><p>☑ ทักษะการคิดวิจารณญาณ (Critical Thinking)</p><p>☑ ทักษะการทำงานร่วมกัน (Collaboration Skill)</p><p>☑ ทักษะการสื่อสาร (Communication Skill)</p><p>☑ ทักษะความคิดสร้างสรรค์ (Creative Thinking)</p></div>
<h2>8. คุณลักษณะอันพึงประสงค์</h2><div class="check-grid">${characteristicCriteria.map((item) => `<p>☑ ${escapeHtml(item)}</p>`).join('')}</div>
<h2>9. การจัดกระบวนการเรียนรู้</h2>${plan.phases.map((phase) => `<h3>${escapeHtml(phase.title)} (${escapeHtml(phase.period)})</h3><ol><li><b>บทบาทครู:</b> ${escapeHtml(phase.teacherRole)}</li><li><b>บทบาทผู้เรียน:</b> ${escapeHtml(phase.studentRole)}</li><li><b>หลักฐาน:</b> ${escapeHtml(phase.evidence)}</li></ol>`).join('')}
<h2>10. สื่อและแหล่งการเรียนรู้</h2>${listHtml(plan.resources)}<p><b>ใบงาน:</b> ${escapeHtml(plan.worksheet.join(' / '))}</p><p><b>ชิ้นงาน:</b> ${escapeHtml(plan.product)}</p>
<h2>11. การวัดและการประเมินผล</h2><table><tr><th>จุดประสงค์</th><th>วิธีการประเมิน</th><th>เครื่องมือการประเมิน</th><th>เกณฑ์การประเมิน</th></tr><tr><td>${escapeHtml(plan.objectives.k)} (K)</td><td>ตรวจคำตอบหลังเรียน</td><td>แบบทดสอบ 10 ข้อ</td><td>ตอบถูกอย่างน้อย 6 ข้อ</td></tr><tr><td>${escapeHtml(plan.objectives.p)} (P)</td><td>ประเมินการปฏิบัติและชิ้นงาน</td><td>รูบริกชิ้นงาน 3 ระดับ</td><td>คุณภาพระดับพอใช้ขึ้นไป</td></tr><tr><td>${escapeHtml(plan.objectives.a)} (A)</td><td>สังเกตพฤติกรรม</td><td>แบบสังเกตพฤติกรรม</td><td>คุณภาพระดับพอใช้ขึ้นไป</td></tr></table>
<h2>12. เกณฑ์การให้คะแนน</h2><table><tr><th>ประเด็นการประเมินชิ้นงาน</th><th>ดี (3 คะแนน)</th><th>พอใช้ (2 คะแนน)</th><th>ปรับปรุง (1 คะแนน)</th></tr><tr><td>ความถูกต้องและสอดคล้องกับโจทย์</td><td>ถูกต้องครบถ้วนและอธิบายได้</td><td>ถูกต้องเป็นส่วนใหญ่</td><td>ถูกต้องบางส่วนเมื่อได้รับคำแนะนำ</td></tr><tr><td>การใช้เทคโนโลยีและกระบวนการทำงาน</td><td>ทำตามขั้นตอนได้ด้วยตนเอง</td><td>ทำได้เมื่อมีคำแนะนำเล็กน้อย</td><td>ต้องได้รับการช่วยเหลือใกล้ชิด</td></tr><tr><td>ความรับผิดชอบ</td><td>รับผิดชอบและร่วมมือสม่ำเสมอ</td><td>รับผิดชอบเป็นส่วนใหญ่</td><td>ต้องได้รับการเตือนและดูแล</td></tr></table>
<h2>13. แบบสังเกตพฤติกรรมของนักเรียน</h2><p><b>คำชี้แจง:</b> 3 = มาก  2 = ปานกลาง  1 = น้อย</p><table class="score-form"><tr><th>พฤติกรรมที่สังเกต</th><th>3</th><th>2</th><th>1</th></tr>${characteristicCriteria.map((item, index) => `<tr><td>${index + 1}. ${escapeHtml(item)}</td><td></td><td></td><td></td></tr>`).join('')}<tr><td><b>รวมคะแนน</b></td><td colspan="3"></td></tr></table><table class="quality"><tr><th>ช่วงคะแนน</th><th>ระดับคุณภาพ</th></tr><tr><td>13 - 15</td><td>ดีมาก</td></tr><tr><td>10 - 12</td><td>ดี</td></tr><tr><td>7 - 9</td><td>พอใช้</td></tr><tr><td>1 - 6</td><td>ปรับปรุง</td></tr></table>
<h2>14. แบบประเมินใบงานและชิ้นงาน</h2><table class="score-form"><tr><th>ประเด็นการประเมิน</th><th>3 คะแนน</th><th>2 คะแนน</th><th>1 คะแนน</th></tr><tr><td>ความสอดคล้องกับเนื้อหา</td><td></td><td></td><td></td></tr><tr><td>ความถูกต้องของขั้นตอน</td><td></td><td></td><td></td></tr><tr><td>การอธิบายเหตุผล</td><td></td><td></td><td></td></tr><tr><td>ความเรียบร้อยและความรับผิดชอบ</td><td></td><td></td><td></td></tr><tr><td><b>รวมคะแนน</b></td><td colspan="3"></td></tr></table>
<h2>15. บันทึกหลังสอน</h2><p>นักเรียนทั้งหมด .......... คน ผ่านจุดประสงค์ .......... คน คิดเป็นร้อยละ ..........</p><p><b>สรุปผลการจัดการเรียนรู้</b> ............................................................................................................................</p><p><b>สิ่งที่ผู้เรียนทำได้ดี</b> ....................................................................................................................................</p><p><b>ปัญหาและสาเหตุ</b> ........................................................................................................................................</p><p><b>แนวทางปรับปรุงและสิ่งที่จะทำในคาบถัดไป</b> ...............................................................................................</p>
<div class="signature"><p>ลงชื่อ ........................................................ ครูผู้สอน</p><p>(${escapeHtml(COURSE_TEACHER_NAME)})</p></div>
</body></html>`;
};
