import type { P1LessonPlan } from '../data/p1TechnologyPlan';

export interface P1PostTeachingDraft {
  summary: string;
  strengths: string;
  problems: string;
  causes: string;
  improvements: string;
  nextAction: string;
}

const objective = (plan: P1LessonPlan, domain: 'K' | 'P' | 'A') => (
  plan.objectives.find((item) => item.domain === domain)?.text || plan.title
);

/**
 * ร่างข้อความตามกิจกรรมของแผน ไม่สร้างผลคะแนนหรือจำนวนผู้ผ่านแทนครู
 * ครูต้องตรวจเทียบผลงาน เช็กชื่อ และ K/P/A ก่อนยืนยันเป็นบันทึกสมบูรณ์
 */
export const buildP1PostTeachingDraft = (plan: P1LessonPlan): P1PostTeachingDraft => ({
  summary: `จัดกิจกรรมเรื่อง “${plan.title}” ตามกระบวนการเรียนรู้ 5 ขั้นครบ ${plan.steps.reduce((sum, step) => sum + step.minutes, 0)} นาที ผู้เรียนได้เรียนรู้จากการสาธิต ฝึกปฏิบัติ และสะท้อนผลท้ายคาบ ครูต้องตรวจจำนวนผู้ผ่านจากชิ้นงานและคะแนน K/P/A ก่อนยืนยันบันทึก`,
  strengths: `ผู้เรียนส่วนใหญ่มีส่วนร่วมกับกิจกรรมและได้ฝึกปฏิบัติตามเป้าหมายด้านทักษะ คือ ${objective(plan, 'P')}`,
  problems: `ผู้เรียนประมาณร้อยละ 20-30 ของห้องอาจต้องการคำชี้แนะทีละขั้น เวลาเพิ่มเติม หรือการสาธิตซ้ำในเรื่อง “${plan.title}”`,
  causes: 'ผู้เรียนมีประสบการณ์เดิม ความคล่องในการอ่านคำสั่ง และความพร้อมด้านการใช้เครื่องมือแตกต่างกัน',
  improvements: `จัดคู่ช่วยเรียน ใช้คำสั่งสั้นพร้อมภาพ สาธิตทีละขั้น และประเมินซ้ำด้วย ${plan.assessments.find((item) => item.domain === 'P')?.instrument || 'รูบริกการปฏิบัติ'}`,
  nextAction: `ทบทวนจุดที่พบข้อผิดพลาดจากคาบนี้ แล้วเชื่อมเข้าสู่กิจกรรมของแผนถัดไป พร้อมติดตามผู้เรียนที่ยังไม่ผ่านเป็นรายบุคคล`,
});
