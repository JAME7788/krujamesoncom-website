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
@page { size: A4; margin: 1.5cm; }
body { font-family: "TH Sarabun New", "Sarabun", Arial, sans-serif; color: #111; font-size: 16pt; line-height: 1.35; }
h1,h2,h3,p { margin: 0; } h1 { font-size: 20pt; text-align: center; }
.official { display: grid; grid-template-columns: 1.35fr .65fr; gap: 1pt 18pt; margin-top: 8pt; font-weight: 700; }
.official-rule { height: 1.5pt; margin-top: 6pt; background: #111; }
.source { margin-top: 4pt; color: #555; font-size: 12pt; }
.grid { width: 100%; border-collapse: collapse; margin: 12pt 0; } .grid th,.grid td { border: 1px solid #444; padding: 6pt 7pt; vertical-align: top; }
.grid th { background: #e8eef5; text-align: center; } .section { margin-top: 12pt; font-weight: bold; font-size: 17pt; }
.outcome { border-left: 5px solid #1f4e79; background: #eef4f8; padding: 8pt 10pt; margin-top: 6pt; }
ul { margin: 4pt 0 0 22pt; padding: 0; } li { margin-bottom: 3pt; } .signature { margin-top: 22pt; text-align: center; }
</style></head><body>
<h1>แผนการจัดการเรียนรู้ที่ 1</h1>
<div class="official">
<p>รายวิชาเทคโนโลยี (วิทยาการคำนวณ) รหัสวิชา ${primaryTechnologyCourseCode(plan.grade)}</p><p>${primaryFullClassName(plan.grade)}</p>
<p>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</p><p>ภาคเรียนที่ 1 ปีการศึกษา ${ACADEMIC_YEAR}</p>
<p>หน่วยการเรียนรู้ที่ 1 ${PRIMARY_TECHNOLOGY_UNIT_TITLE}</p><p>เวลา 4 ชั่วโมง</p>
<p>เรื่อง ${escapeHtml(plan.title)}</p><p>เวลา 4 ชั่วโมง</p>
<p>ครูผู้สอน ${escapeHtml(COURSE_TEACHER_NAME)}</p><p>วันที่สอน ......./........./...........</p>
</div><div class="official-rule"></div>
<p class="section">คำอธิบายรายวิชาเทคโนโลยี</p><p>${escapeHtml(courseDescription)}</p>
<p class="source">เรียบเรียงจาก ${escapeHtml(profile?.source || 'เอกสารคำอธิบายรายวิชาของโรงเรียน')} ซึ่งเป็นรายวิชาบูรณาการ ${profile?.hours || '-'} ชั่วโมง</p>
<p class="section">1. ผลลัพธ์การเรียนรู้หลัก</p><div class="outcome"><b>ข้อ 5</b> ${escapeHtml(plan.mainOutcome)}</div>
<p class="section">2. ตัวชี้วัดที่ใช้เป็นหลักฐาน</p>${listHtml(plan.subIndicators.map((item) => `${item.code} ${item.description}`))}
<p class="section">3. จุดประสงค์การเรียนรู้</p><table class="grid"><tr><th style="width:12%">ด้าน</th><th>จุดประสงค์</th></tr><tr><td><b>K</b></td><td>${escapeHtml(plan.objectives.k)}</td></tr><tr><td><b>P</b></td><td>${escapeHtml(plan.objectives.p)}</td></tr><tr><td><b>A</b></td><td>${escapeHtml(plan.objectives.a)}</td></tr></table>
<p class="section">4. สาระสำคัญ</p><p>${escapeHtml(plan.concept)}</p>
<p class="section">5. สาระการเรียนรู้</p>${listHtml(plan.content)}
<p class="section">6. สมรรถนะสำคัญและคุณลักษณะอันพึงประสงค์</p><table class="grid"><tr><th>สมรรถนะการใช้เทคโนโลยี</th><th>คุณลักษณะอันพึงประสงค์</th></tr><tr><td>${listHtml(technologyCompetencyCriteria)}</td><td>${listHtml(characteristicCriteria)}</td></tr></table>
<p class="section">7. กิจกรรมการเรียนรู้</p><table class="grid"><tr><th style="width:18%">คาบ/เวลา</th><th>กิจกรรมการเรียนรู้</th><th style="width:24%">หลักฐาน</th></tr>${plan.phases.map((phase) => `<tr><td><b>${escapeHtml(phase.title)}</b><br>${escapeHtml(phase.period)}</td><td><b>บทบาทครู:</b> ${escapeHtml(phase.teacherRole)}<br><b>บทบาทผู้เรียน:</b> ${escapeHtml(phase.studentRole)}</td><td>${escapeHtml(phase.evidence)}</td></tr>`).join('')}</table>
<p class="section">8. ชิ้นงาน ใบงาน และสื่อ</p><p><b>ชิ้นงาน:</b> ${escapeHtml(plan.product)}</p>${listHtml(plan.worksheet)}${listHtml(plan.resources)}
<p class="section">9. การวัดและประเมินผล</p><table class="grid"><tr><th>สิ่งที่ประเมิน</th><th>วิธีการ/เครื่องมือ</th><th>เกณฑ์ผ่าน</th></tr><tr><td>K ความรู้</td><td>แบบทดสอบหลังเรียน 10 ข้อ</td><td>ตอบถูกอย่างน้อย 6 ข้อ แปลงเป็น K 0-15</td></tr><tr><td>P ทักษะปฏิบัติ</td><td>ชิ้นงานและรูบริกสมรรถนะ ระดับ 0-3</td><td>ค่าเฉลี่ยตั้งแต่ระดับ 2</td></tr><tr><td>A คุณลักษณะ</td><td>แบบสังเกตคุณลักษณะ ระดับ 0-3</td><td>ค่าเฉลี่ยตั้งแต่ระดับ 2</td></tr></table>
<p class="section">10. บันทึกหลังสอน</p><p>ผู้เรียนผ่าน .......... คน คิดเป็นร้อยละ ..........</p><p>สิ่งที่ผู้เรียนทำได้ดี ....................................................................................................</p><p>ปัญหาและสาเหตุ .......................................................................................................</p><p>แนวทางปรับปรุง .........................................................................................................</p>
<div class="signature"><p>ลงชื่อ ........................................................ ครูผู้สอน</p><p>(${escapeHtml(COURSE_TEACHER_NAME)})</p></div>
</body></html>`;
};
