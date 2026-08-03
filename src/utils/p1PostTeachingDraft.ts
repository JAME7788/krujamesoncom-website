import type { P1LessonPlan } from '../data/p1TechnologyPlan';

export interface P1PostTeachingDraft {
  summary: string;
  strengths: string;
  problems: string;
  causes: string;
  improvements: string;
  nextAction: string;
}

export interface PostTeachingResult {
  totalStudents: number;
  passed: number;
  averageK: number;
  averageP: number;
  attitudePassed: number;
}

export interface PostTeachingReadiness {
  sessionStatus?: 'planned' | 'in_progress' | 'completed' | 'postponed' | 'makeup';
  recordStatus?: 'draft' | 'complete';
  teachingDate?: string;
  hasResult?: boolean;
}

const objective = (plan: P1LessonPlan, domain: 'K' | 'P' | 'A') => (
  plan.objectives.find((item) => item.domain === domain)?.text || plan.title
);

const clampPercent = (value: number) => Math.max(0, Math.min(100, value));
const percentOf = (value: number, total: number) => (
  total > 0 ? Math.round(clampPercent((value / total) * 100) * 10) / 10 : 0
);
const scorePercent = (score: number, maximum: number) => percentOf(score, maximum);
const displayNumber = (value: number) => Number(value.toFixed(1)).toLocaleString('th-TH');
const levelFromPercent = (percent: number) => {
  if (percent >= 85) return 'ดีมาก';
  if (percent >= 70) return 'ดี';
  if (percent >= 60) return 'ผ่านเกณฑ์';
  return 'อยู่ระหว่างพัฒนา';
};

export const hasPostTeachingResult = (result?: Partial<PostTeachingResult>): result is PostTeachingResult => (
  Boolean(result && Number(result.totalStudents) > 0 && (
    Number(result.passed) > 0
    || Number(result.averageK) > 0
    || Number(result.averageP) > 0
    || Number(result.attitudePassed) > 0
  ))
);

/** แผนอนาคตต้องว่าง จนกว่าจะเริ่มคาบ สอนแล้ว หรือมีผลจริงของวันที่ผ่านมา */
export const isPostTeachingReady = (
  value: PostTeachingReadiness,
): boolean => {
  if (value.sessionStatus === 'in_progress' || value.sessionStatus === 'completed' || value.sessionStatus === 'makeup') {
    return true;
  }
  if (value.recordStatus === 'complete') return true;
  return false;
};

const legacyDraftMarkers = [
  'ฉบับร่างหลังแผน',
  'ฉบับร่างอัตโนมัติ',
  'ร่างจากโปรไฟล์ความสามารถ',
  'ครูต้องตรวจ',
  'รอครูปรับตามหลักฐาน',
  'ผู้เรียนประมาณร้อยละ 20-30',
  'ผู้เรียนส่วนใหญ่มีส่วนร่วมกับกิจกรรม',
  'ผู้เรียนมีประสบการณ์เดิม ความคล่องในการอ่านคำสั่ง',
  'จัดคู่ช่วยเรียน ใช้คำสั่งสั้นพร้อมภาพ',
  'ทบทวนจุดที่พบข้อผิดพลาดจากคาบนี้',
  'ตรวจนักเรียนรายคนจากงาน',
  'บันทึกผลจริงทันทีหลังสอน',
];

/** ใช้แยกข้อความร่างเดิมออกจากข้อความที่ครูเขียนเอง เพื่อไม่เขียนทับงานของครู */
export const isLegacyPostTeachingText = (value?: string) => (
  !value?.trim() || legacyDraftMarkers.some((marker) => value.includes(marker))
);

const buildResultNarrative = (
  plan: P1LessonPlan,
  result: PostTeachingResult,
): P1PostTeachingDraft => {
  const total = Math.max(0, Math.round(result.totalStudents));
  const passed = Math.max(0, Math.min(total, Math.round(result.passed)));
  const developing = Math.max(0, total - passed);
  const attitudePassed = Math.max(0, Math.min(total, Math.round(result.attitudePassed)));
  const passPercent = percentOf(passed, total);
  const developingPercent = percentOf(developing, total);
  const kPercent = scorePercent(result.averageK, 15);
  const pPercent = scorePercent(result.averageP, 30);
  const attitudePercent = percentOf(attitudePassed, total);
  const allPassed = passed === total;

  return {
    summary: `จากการจัดกิจกรรมการเรียนรู้เรื่อง “${plan.title}” พบว่า ผู้เรียนผ่านจุดประสงค์ ${passed} คน จากทั้งหมด ${total} คน คิดเป็นร้อยละ ${displayNumber(passPercent)} ผลด้านความรู้ (K) มีคะแนนเฉลี่ย ${displayNumber(result.averageK)}/15 หรือร้อยละ ${displayNumber(kPercent)} อยู่ในระดับ${levelFromPercent(kPercent)} ด้านทักษะกระบวนการ (P) มีคะแนนเฉลี่ย ${displayNumber(result.averageP)}/30 หรือร้อยละ ${displayNumber(pPercent)} อยู่ในระดับ${levelFromPercent(pPercent)} และผู้เรียนผ่านด้านคุณลักษณะ (A) ${attitudePassed} คน คิดเป็นร้อยละ ${displayNumber(attitudePercent)} แสดงให้เห็นว่าผู้เรียนสามารถเรียนรู้และปฏิบัติกิจกรรมตามเป้าหมายของแผนได้อย่างเหมาะสมตามวัย`,
    strengths: `ผู้เรียนแสดงความเข้าใจตามเป้าหมายด้านความรู้ คือ “${objective(plan, 'K')}” และสามารถปฏิบัติตามเป้าหมายด้านทักษะ คือ “${objective(plan, 'P')}” ได้ในระดับ${levelFromPercent(pPercent)} โดยมีความตั้งใจ รับผิดชอบ และร่วมกิจกรรมอย่างต่อเนื่อง ผู้เรียนที่มีความพร้อมสามารถอธิบายขั้นตอนและช่วยแนะนำเพื่อนได้ ส่งผลให้บรรยากาศการเรียนรู้เป็นไปในเชิงบวก`,
    problems: allPassed
      ? 'ผู้เรียนทุกคนผ่านจุดประสงค์การเรียนรู้ ไม่พบอุปสรรคที่ส่งผลต่อการบรรลุเป้าหมายของคาบ ความแตกต่างที่พบเป็นเพียงความเร็วในการทำงานและรูปแบบการเรียนรู้ของแต่ละคน ซึ่งสามารถนำมาใช้จัดกิจกรรมต่อยอดให้เหมาะกับศักยภาพรายบุคคลได้'
      : `ผู้เรียน ${developing} คน คิดเป็นร้อยละ ${displayNumber(developingPercent)} อยู่ระหว่างพัฒนาความคล่องในการทำงานตามขั้นตอน ผู้เรียนกลุ่มนี้สามารถร่วมกิจกรรมได้และมีความพยายาม แต่ยังควรได้รับเวลา คำใบ้ หรือการสาธิตเพิ่มเติมเพื่อให้แสดงความสามารถได้เต็มศักยภาพ`,
    causes: allPassed
      ? 'ผู้เรียนมีประสบการณ์เดิมและจังหวะการเรียนรู้แตกต่างกัน การใช้สื่อภาพ การสาธิตทีละขั้น และการช่วยเหลือกันระหว่างเพื่อนทำให้ผู้เรียนทุกคนเข้าถึงกิจกรรมและบรรลุจุดประสงค์ได้'
      : 'ผู้เรียนมีประสบการณ์เดิม ความคล่องในการอ่านคำสั่ง และความมั่นใจในการใช้เครื่องมือแตกต่างกัน เมื่อได้รับตัวอย่างที่ชัดเจนและคำแนะนำเป็นรายขั้น ผู้เรียนสามารถพัฒนาผลงานได้ดีขึ้น',
    improvements: allPassed
      ? `จัดภารกิจต่อยอดหลายระดับ โดยให้ผู้เรียนเลือกวิธีนำความรู้เรื่อง “${plan.title}” ไปสร้างผลงานหรืออธิบายแก่เพื่อน พร้อมเปิดโอกาสให้ตรวจสอบและปรับปรุงผลงานด้วยตนเอง เพื่อส่งเสริมการคิด การสื่อสาร และการใช้เทคโนโลยีอย่างมั่นใจ`
      : `จัดกลุ่มยืดหยุ่นและใช้เพื่อนช่วยเพื่อน แบ่งภารกิจเป็นขั้นสั้นพร้อมภาพตัวอย่าง ให้เวลาฝึกเพิ่มเติมแก่ผู้เรียน ${developing} คน และประเมินซ้ำด้วย ${plan.assessments.find((item) => item.domain === 'P')?.instrument || 'รูบริกการปฏิบัติ'} โดยเน้นเปรียบเทียบพัฒนาการของผู้เรียนกับตนเอง`,
    nextAction: allPassed
      ? `คาบถัดไปทบทวนแนวคิดสำคัญเรื่อง “${plan.title}” อย่างกระชับ แล้วต่อยอดด้วยภารกิจที่เปิดโอกาสให้ผู้เรียนวางแผน ลงมือทำ อธิบายเหตุผล และแลกเปลี่ยนวิธีทำกับเพื่อน โดยมอบบทบาทผู้นำกลุ่มหรือผู้ช่วยสาธิตแก่ผู้เรียนที่พร้อม`
      : `คาบถัดไปทบทวนขั้นตอนสำคัญด้วยสื่อภาพและตัวอย่างใกล้ตัว ติดตามผู้เรียน ${developing} คนเป็นรายบุคคลระหว่างปฏิบัติ และให้ผู้เรียนที่ผ่านแล้วทำภารกิจต่อยอดหรือช่วยอธิบายแก่เพื่อน เพื่อให้ทั้งห้องพัฒนาไปพร้อมกัน`,
  };
};

/**
 * สร้างบันทึกหลังสอนจากผล K/P/A จริง เมื่อยังไม่มีผลจะอธิบายกิจกรรมโดยไม่แต่งคะแนนแทนครู
 */
export const buildP1PostTeachingDraft = (
  plan: P1LessonPlan,
  result?: Partial<PostTeachingResult>,
): P1PostTeachingDraft => {
  if (hasPostTeachingResult(result)) return buildResultNarrative(plan, result);

  return {
    summary: `จัดกิจกรรมเรื่อง “${plan.title}” ตามกระบวนการเรียนรู้ 5 ขั้น รวม ${plan.steps.reduce((sum, step) => sum + step.minutes, 0)} นาที ผู้เรียนได้รับโอกาสเรียนรู้จากการสาธิต การฝึกปฏิบัติ การแลกเปลี่ยนกับเพื่อน และการสะท้อนผลท้ายคาบ ขณะนี้ยังไม่มีผล K/P/A ของคาบสำหรับคำนวณจำนวนและร้อยละ ระบบจะเรียบเรียงผลเชิงบวกให้ทันทีเมื่อดึงข้อมูลล่าสุด`,
    strengths: `กิจกรรมส่งเสริมให้ผู้เรียนพัฒนาทักษะตามเป้าหมาย “${objective(plan, 'P')}” ผ่านการลงมือทำจริง การใช้สื่อที่เหมาะกับวัย และการช่วยเหลือกันระหว่างเพื่อน`,
    problems: 'ยังไม่มีข้อมูลผลการประเมินรายคาบเพียงพอสำหรับระบุผู้เรียนที่ควรได้รับการส่งเสริมเพิ่มเติม จึงยังไม่สรุปปัญหาแทนครู',
    causes: 'รอผลจากการเช็กชื่อ แบบทดสอบ ชิ้นงาน การปฏิบัติ และพฤติกรรมการเรียนรู้ของคาบนี้',
    improvements: `เตรียมกิจกรรมหลายระดับ ใช้คำสั่งสั้นพร้อมภาพ สาธิตทีละขั้น และประเมินด้วย ${plan.assessments.find((item) => item.domain === 'P')?.instrument || 'รูบริกการปฏิบัติ'} เพื่อสะท้อนความสามารถรายบุคคลอย่างเป็นธรรม`,
    nextAction: `เมื่อมีผล K/P/A ให้ใช้ข้อมูลรายบุคคลจัดกลุ่มยืดหยุ่น โดยต่อยอดผู้เรียนที่พร้อมและให้การช่วยเหลือเฉพาะด้านแก่ผู้เรียนที่ต้องการเวลาเพิ่มในคาบถัดไป`,
  };
};
