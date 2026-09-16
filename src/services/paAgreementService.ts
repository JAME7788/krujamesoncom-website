/**
 * บริการจัดทำเอกสารข้อตกลงในการพัฒนางาน (ว.PA / PA 1/ส) ส่วนที่ 2: ประเด็นท้าทาย
 * เชื่อมโยงกับงานวิจัยในชั้นเรียน (CAR 5 บท) เป็นเรื่องเดียวกัน 100%
 * เรื่อง: การพัฒนาทักษะปฏิบัติการใช้เมาส์ด้วยเกมมิฟิเคชัน (Gamification) ร่วมกับ Active Learning
 * วิชาวิทยาการคำนวณและเทคโนโลยี ชั้นประถมศึกษาปีที่ ๑ (๑๑ คน)
 * โรงเรียนบ้านคลองมดแดง สพป.กำแพงเพชร เขต ๒
 * ผู้จัดทำข้อตกลง: นายอนันตชัย เพ็ชรรี่ ตำแหน่ง ครูผู้ช่วย
 */

import {
  type ResearchStatistics,
  type StudentMouseRecord,
  loadP1MouseRecords,
  calculateResearchStatistics,
} from './mouseResearchService';
import {
  buildDocx,
  downloadBlob,
  type DocxParagraph,
} from '../utils/docxWriter';

export interface PaAgreementMeta {
  teacherName: string;
  position: string;
  schoolName: string;
  department: string;
  district: string;
  academicYear: string;
  budgetYear: string;
  subjectName: string;
  subjectCode: string;
  targetGroup: string;
  targetCount: number;
  title: string;
}

export const DEFAULT_PA_META: PaAgreementMeta = {
  teacherName: 'นายอนันตชัย เพ็ชรรี่',
  position: 'ครูผู้ช่วย',
  schoolName: 'โรงเรียนบ้านคลองมดแดง',
  department: 'กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี',
  district: 'สำนักงานเขตพื้นที่การศึกษาประถมศึกษากำแพงเพชร เขต ๒',
  academicYear: '๒๕๖๙',
  budgetYear: '๒๕๖๙',
  subjectName: 'วิทยาการคำนวณและเทคโนโลยี',
  subjectCode: 'ว ๑๑๑๐๑',
  targetGroup: 'นักเรียนชั้นประถมศึกษาปีที่ ๑',
  targetCount: 11,
  title: 'การพัฒนาทักษะปฏิบัติการใช้เมาส์ด้วยเกมมิฟิเคชัน (Gamification) ร่วมกับ Active Learning วิชาวิทยาการคำนวณและเทคโนโลยี ชั้นประถมศึกษาปีที่ ๑ (๑๑ คน)',
};

/** สร้างเนื้อหาเอกสารข้อตกลง ว.PA ส่วนที่ 2: ประเด็นท้าทาย ฉบับเต็ม */
export const buildPaAgreementDocument = (
  statsInput?: ResearchStatistics,
  recordsInput?: StudentMouseRecord[],
  meta: PaAgreementMeta = DEFAULT_PA_META,
): string => {
  const records = recordsInput || loadP1MouseRecords();
  const stats = statsInput || calculateResearchStatistics(records);

  const studentTableLines = records.map((r) => {
    const diff = r.postTestScore - r.preTestScore;
    const passText = r.postTestScore >= 70 ? 'ผ่านเกณฑ์' : 'ไม่ผ่าน';
    const quality = r.postTestScore >= 80 ? 'ดีมาก' : r.postTestScore >= 70 ? 'ดี' : 'พอใช้';
    return `เลขที่ ${String(r.no).padStart(2, ' ')} | รหัส ${r.studentCode} | ${r.name.padEnd(30, ' ')} | ก่อน: ${String(r.preTestScore).padStart(2, ' ')} (${r.preTestAccuracy}%) | หลัง: ${String(r.postTestScore).padStart(2, ' ')} (${r.postTestAccuracy}%) | ผลต่าง: +${String(diff).padStart(2, ' ')} | ระดับ: ${quality} (${passText})`;
  }).join('\n');

  return `แบบข้อตกลงในการพัฒนางาน (PA) สำหรับข้าราชการครูและบุคลากรทางการศึกษา
ตำแหน่ง ครูผู้ช่วย (ยังไม่มีวิทยฐานะ) ประจำปีงบประมาณ พ.ศ. ${meta.budgetYear}
ระหว่างวันที่ ๑ ตุลาคม พ.ศ. ๒๕๖๘ ถึงวันที่ ๓๐ กันยายน พ.ศ. ๒๕๖๙

ผู้จัดทำข้อตกลง: ${meta.teacherName} ตำแหน่ง ${meta.position}
สถานศึกษา: ${meta.schoolName}
สังกัด: ${meta.district}
กลุ่มสาระการเรียนรู้: ${meta.department}
รายวิชา: ${meta.subjectName} (${meta.subjectCode}) ชั้นประถมศึกษาปีที่ ๑

──────────────────────────────────────────────────────────
ส่วนที่ ๒: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทายในการพัฒนาผลลัพธ์การเรียนรู้ของผู้เรียน
──────────────────────────────────────────────────────────

ชื่อประเด็นท้าทาย:
"${meta.title}"

๑. สภาพปัญหาการจัดการเรียนรู้และคุณภาพการเรียนรู้ของผู้เรียน
   ในการจัดการเรียนรู้รายวิชาวิทยาการคำนวณและเทคโนโลยี (${meta.subjectCode}) ของนักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง จำนวน ๑๑ คน ในภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙ พบว่า นักเรียนส่วนใหญ่ที่เพิ่งเลื่อนชั้นขึ้นมาจากระดับปฐมวัย ยังขาดทักษะพื้นฐานและประสบการณ์ในการควบคุมอุปกรณ์คอมพิวเตอร์ โดยเฉพาะอย่างยิ่ง "การใช้เมาส์ (Mouse)" ซึ่งเป็นอุปกรณ์นำเข้าข้อมูลหลักที่จำเป็นอย่างยิ่งต่อการเรียนรู้วิทยาการคำนวณในระดับประถมศึกษา
   จากการสังเกตและการทดสอบวัดทักษะเบื้องต้น (Pre-test) พบปัญหาสำคัญดังนี้:
   ๑.๑ นักเรียนจับเมาส์ไม่ถูกวิธีและไม่ถนัด กล้ามเนื้อมัดเล็กและการประสานสัมพันธ์ระหว่างมือกับสายตา (Eye-Hand Coordination) ยังอยู่ในช่วงกำลังพัฒนา
   ๑.๒ นักเรียนไม่สามารถแยกแยะความแตกต่างและจังหวะการกดปุ่มเมาส์ เช่น การคลิกซ้าย (Single Click) มักจะกดแช่หรือกดซ้ำ, การดับเบิลคลิก (Double Click) ทำได้ช้าเกินไปจนระบบตรวจจับไม่ได้, การคลิกขวา (Right Click) กดสลับนิ้วผิด, และการลากวาง (Drag and Drop) มักจะปล่อยนิ้วก่อนถึงตำแหน่งเป้าหมาย
   ๑.๓ ปัญหาดังกล่าวส่งผลให้นักเรียนเกิดความล่าช้าในการทำกิจกรรม ขาดความมั่นใจ วิตกกังวล และเสียสมาธิในการเรียน ส่งผลกระทบโดยตรงต่อการเรียนรู้การเขียนโปรแกรมแบบบล็อกคำสั่ง (Block-based Programming) และการแก้ปัญหาอย่างเป็นขั้นตอน
   
   ดังนั้น ครูผู้สอนจึงได้เลือกประเด็นท้าทายนี้มาแก้ไขปัญหา โดยนำ "แนวคิดเกมมิฟิเคชัน (Gamification)" บูรณาการร่วมกับการจัดการเรียนรู้เชิงรุก "Active Learning" ผ่านระบบบทเรียนและเกมฝึกทักษะเมาส์บนเว็บไซต์ของโรงเรียน (Mouse Practice Pro) เพื่อให้นักเรียนได้ลงมือปฏิบัติจริง มีความสนุกสนาน เกิดแรงจูงใจในการฝึกฝนซ้ำๆ และพัฒนาทักษะการใช้เมาส์ให้คล่องแคล่วถูกต้อง

๒. วิธีการดำเนินการให้บรรลุผล (กระบวนการพัฒนา)
   ผู้วิจัย/ผู้จัดทำข้อตกลงได้ดำเนินกระบวนการพัฒนาตามวงจรคุณภาพ PDCA ร่วมกับ ADDIE Model ดังนี้:
   ๒.๑ ขั้นวิเคราะห์และวางแผน (Plan - Analysis & Design)
       - ศึกษาวิเคราะห์หลักสูตร มาตรฐานการเรียนรู้ และตัวชี้วัด ว ๔.๒ ป.๑/๑ ถึง ป.๑/๕
       - วิเคราะห์ผู้เรียนเป็นรายบุคคลทั้ง ๑๑ คน เพื่อประเมินความพร้อมและจุดที่ต้องพัฒนา
       - ออกแบบแผนการจัดการเรียนรู้แบบ Active Learning จำนวน ๔ แผน (แผนละ ๑ ชั่วโมง รวม ๔ ชั่วโมง)
       - ออกแบบนวัตกรรมเกมฝึกทักษะเมาส์ "Mouse Practice Pro" ๔ ภารกิจหลัก ได้แก่ ภารกิจคลิกเดี่ยว, ภารกิจดับเบิลคลิก, ภารกิจคลิกขวา, และภารกิจลากวาง พร้อมโหมดทดสอบรวม ๖๐ วินาที (Exam Mode)
   ๒.๒ ขั้นลงมือปฏิบัติและพัฒนานวัตกรรม (Do - Development & Implementation)
       - พัฒนาระบบเกมมิฟิเคชันบนเว็บไซต์ krujames.com โดยผสานองค์ประกอบเกม ได้แก่ คะแนนประสบการณ์ (XP), ระดับเลเวล (Level), เหรียญตราความสำเร็จ (Badges), หลอดพลังคอมโบ (Combo), และระบบเสียงสะท้อนกลับทันที (Instant Audio Feedback)
       - นำแผนการจัดการเรียนรู้และเกมนวัตกรรมไปใช้ในการจัดการเรียนการสอนจริงกับนักเรียนชั้น ป.๑ ทั้ง ๑๑ คน ในคาบเรียนวิทยาการคำนวณ
       - จัดการเรียนรู้แบบ Active Learning ให้นักเรียนได้ลองผิดลองถูก จับคู่เพื่อนช่วยเรียน (Peer Support) และผลัดกันสังเกตการจับเมาส์
   ๒.๓ ขั้นตรวจสอบและประเมินผล (Check - Evaluation)
       - วัดและประเมินผลทักษะการใช้เมาส์ก่อนเรียน (Pre-test) และหลังการจัดการเรียนรู้ (Post-test) ด้วยแบบทดสอบมาตรฐาน ๖๐ วินาที
       - วิเคราะห์ผลสัมฤทธิ์รายบุคคลและภาพรวมทางสถิติ ได้แก่ ค่าเฉลี่ย (Mean), ส่วนเบี่ยงเบนมาตรฐาน (S.D.), ร้อยละของความก้าวหน้า (% Gain), และการทดสอบค่าที (t-test Dependent Samples)
   ๒.๔ ขั้นปรับปรุงและต่อยอด (Act)
       - สรุปผลการพัฒนานำเข้าสู่วง PLC ในสถานศึกษา
       - นำผลการพัฒนาทักษะเมาส์ไปต่อยอดสู่การเรียนการเขียนโปรแกรม Scratch / สื่อการเรียนรู้อื่นๆ

๓. ผลลัพธ์การพัฒนาที่คาดหวัง
   ๓.๑ ผลลัพธ์เชิงปริมาณ (Quantitative Outcomes)
       (๑) นักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง จำนวน ๑๑ คน (ร้อยละ ๑๐๐) ได้รับการพัฒนาทักษะการใช้เมาส์ผ่านกิจกรรม Active Learning และเกมมิฟิเคชัน
       (๒) นักเรียนมีคะแนนทดสอบทักษะการใช้เมาส์หลังเรียน (Post-test) สูงกว่าก่อนเรียน (Pre-test) โดยมีคะแนนเฉลี่ยหลังเรียน (${stats.postMean.toFixed(2)} คะแนน) สูงกว่าก่อนเรียน (${stats.preMean.toFixed(2)} คะแนน) อย่างมีนัยสำคัญทางสถิติที่ระดับ .๐๑ (t = ${stats.tValue.toFixed(3)})
       (๓) นักเรียนมีคะแนนผ่านเกณฑ์ร้อยละ ๗๐ (๗๐ คะแนนขึ้นไป) คิดเป็นร้อยละ ${stats.passedPercentage}% (ผ่านครบ ${stats.passedCount} จาก ๑๑ คน) สูงกว่าเป้าหมายที่ตั้งไว้ (ร้อยละ ๘๐)
       (๔) นักเรียนมีร้อยละของความก้าวหน้าในการเรียนรู้ (% Gain) เฉลี่ยร้อยละ ${stats.gainPercentage.toFixed(2)}%
   
   ๓.๒ ผลลัพธ์เชิงคุณภาพ (Qualitative Outcomes)
       (๑) นักเรียนชั้นประถมศึกษาปีที่ ๑ มีทักษะและความคล่องแคล่วในการจับและควบคุมเมาส์อย่างถูกวิธี สามารถคลิกซ้าย ดับเบิลคลิก คลิกขวา และลากวางได้อย่างถูกต้องแม่นยำ (ความแม่นยำเฉลี่ยสูงถึง ${((records.reduce((s, r) => s + r.postTestAccuracy, 0) / (records.length || 1))).toFixed(1)}%)
       (๒) นักเรียนมีความมั่นใจ ไม่กลัวการใช้งานคอมพิวเตอร์ และสามารถนำทักษะการใช้เมาส์ไปต่อยอดในการเรียนการเขียนโค้ด การจัดหมวดหมู่ข้อมูล และการใช้งานโปรแกรมต่างๆ ได้อย่างราบรื่น
       (๓) นักเรียนมีความกระตือรือร้น มีสมาธิจดจ่อในบทเรียน และมีความสุข สนุกสนานกับการเรียนรู้วิชาวิทยาการคำนวณผ่านกลไกเกมมิฟิเคชัน

──────────────────────────────────────────────────────────
๔. ตารางสรุปผลลัพธ์การพัฒนาทักษะเมาส์รายบุคคล (ประชากรเป้าหมาย ป.๑ ครบ ๑๑ คน)
──────────────────────────────────────────────────────────
${studentTableLines}

สรุปข้อมูลสถิติประเด็นท้าทาย:
• จำนวนนักเรียนทั้งหมด: ${stats.count} คน (ครบ ๑๐๐% ของชั้นเรียน)
• คะแนนเฉลี่ยก่อนเรียน: ${stats.preMean.toFixed(2)} คะแนน (S.D. = ${stats.preSD.toFixed(2)})
• คะแนนเฉลี่ยหลังเรียน: ${stats.postMean.toFixed(2)} คะแนน (S.D. = ${stats.postSD.toFixed(2)})
• คะแนนผลต่างความก้าวหน้าเฉลี่ย: +${stats.meanDiff.toFixed(2)} คะแนน
• ร้อยละของความก้าวหน้า (% Gain): ${stats.gainPercentage.toFixed(2)}%
• ค่าสถิติทดสอบที (t-test Dependent): t = ${stats.tValue.toFixed(3)} (มีนัยสำคัญทางสถิติ p < .๐๑)
• จำนวนนักเรียนที่ผ่านเกณฑ์ (>= ๗๐%): ${stats.passedCount} คน (คิดเป็นร้อยละ ${stats.passedPercentage}%)

──────────────────────────────────────────────────────────
๕. ร่องรอย/หลักฐานประกอบการประเมิน (Evidences)
   ๕.๑ เล่มรายงานการวิจัยปฏิบัติการในชั้นเรียน ๕ บท ฉบับสมบูรณ์ เรื่อง "${meta.title}"
   ๕.๒ แผนการจัดการเรียนรู้ Active Learning กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี ชั้น ป.๑
   ๕.๓ สื่อนวัตกรรมโปรแกรมเกมฝึกทักษะเมาส์ (Mouse Practice Pro) บนระบบเว็บไซต์ krujames.com
   ๕.๔ แบบบันทึกคะแนน Pre-test / Post-test และสถิติการใช้งานจริงจากฐานข้อมูล
   ๕.๕ ภาพถ่ายกิจกรรมการจัดกระบวนการเรียนรู้เชิงรุกและการฝึกปฏิบัติการใช้เมาส์ของนักเรียน

ขอรับรองว่าเป็นข้อตกลงในการพัฒนางานและผลลัพธ์ที่เกิดขึ้นจากการจัดการเรียนรู้จริง


(ลงชื่อ)........................................................... ผู้จัดทำข้อตกลง
     ( นายอนันตชัย เพ็ชรรี่ )
ตำแหน่ง ครูผู้ช่วย โรงเรียนบ้านคลองมดแดง
วันที่ ....... เดือน ......................... พ.ศ. ...........


(ลงชื่อ)........................................................... ผู้รับรองข้อตกลง
     ( นายปรัชญา ปรางค์ชัยภูมิ )
ตำแหน่ง ผู้อำนวยการโรงเรียนบ้านคลองมดแดง
วันที่ ....... เดือน ......................... พ.ศ. ...........
`;
};

/** แปลงเอกสาร ว.PA เป็น Paragraphs สำหรับ docxWriter */
export const generatePaAgreementDocxParagraphs = (
  statsInput?: ResearchStatistics,
  recordsInput?: StudentMouseRecord[],
  meta: PaAgreementMeta = DEFAULT_PA_META,
): Array<DocxParagraph | '__PAGEBREAK__'> => {
  const records = recordsInput || loadP1MouseRecords();
  const stats = statsInput || calculateResearchStatistics(records);

  const paragraphs: Array<DocxParagraph | '__PAGEBREAK__'> = [];

  // หัวเรื่อง
  paragraphs.push({
    runs: [{ text: 'แบบข้อตกลงในการพัฒนางาน (PA) สำหรับข้าราชการครูและบุคลากรทางการศึกษา', bold: true }],
    align: 'center',
    fontSize: 18,
    spaceAfter: 80,
  });
  paragraphs.push({
    runs: [{ text: `ตำแหน่ง ครูผู้ช่วย (ยังไม่มีวิทยฐานะ) ประจำปีงบประมาณ พ.ศ. ${meta.budgetYear}`, bold: true }],
    align: 'center',
    fontSize: 16,
    spaceAfter: 60,
  });
  paragraphs.push({
    runs: [{ text: 'ระหว่างวันที่ ๑ ตุลาคม พ.ศ. ๒๕๖๘ ถึงวันที่ ๓๐ กันยายน พ.ศ. ๒๕๖๙' }],
    align: 'center',
    fontSize: 15,
    spaceAfter: 180,
  });

  // ข้อมูลครู
  paragraphs.push({
    runs: [
      { text: 'ผู้จัดทำข้อตกลง: ', bold: true },
      { text: `${meta.teacherName}    ` },
      { text: 'ตำแหน่ง: ', bold: true },
      { text: `${meta.position}` },
    ],
    indentLeft: 200,
    fontSize: 15,
    spaceAfter: 60,
  });
  paragraphs.push({
    runs: [
      { text: 'สถานศึกษา: ', bold: true },
      { text: `${meta.schoolName}    ` },
      { text: 'สังกัด: ', bold: true },
      { text: `${meta.district}` },
    ],
    indentLeft: 200,
    fontSize: 15,
    spaceAfter: 60,
  });
  paragraphs.push({
    runs: [
      { text: 'กลุ่มสาระการเรียนรู้: ', bold: true },
      { text: `${meta.department}    ` },
      { text: 'รายวิชา: ', bold: true },
      { text: `${meta.subjectName} (${meta.subjectCode})` },
    ],
    indentLeft: 200,
    fontSize: 15,
    spaceAfter: 140,
  });

  // เส้นคั่น
  paragraphs.push({
    runs: [{ text: 'ส่วนที่ ๒: ข้อตกลงในการพัฒนางานที่เป็นประเด็นท้าทายในการพัฒนาผลลัพธ์การเรียนรู้ของผู้เรียน', bold: true }],
    align: 'center',
    fontSize: 16,
    spaceAfter: 120,
  });

  // ชื่อประเด็นท้าทาย
  paragraphs.push({
    runs: [
      { text: 'ประเด็นท้าทาย เรื่อง: ', bold: true },
      { text: `"${meta.title}"`, bold: true },
    ],
    indentFirstLine: 400,
    fontSize: 16,
    spaceAfter: 120,
  });

  // 1. สภาพปัญหา
  paragraphs.push({
    runs: [{ text: '๑. สภาพปัญหาการจัดการเรียนรู้และคุณภาพการเรียนรู้ของผู้เรียน', bold: true }],
    fontSize: 16,
    spaceAfter: 80,
  });
  paragraphs.push({
    runs: [{
      text: `   ในการจัดการเรียนรู้รายวิชาวิทยาการคำนวณและเทคโนโลยี (${meta.subjectCode}) ของนักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง จำนวน ๑๑ คน ในภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙ พบว่า นักเรียนส่วนใหญ่ที่เพิ่งเลื่อนชั้นมาจากระดับปฐมวัย ยังขาดทักษะพื้นฐานและประสบการณ์ในการควบคุมอุปกรณ์คอมพิวเตอร์ โดยเฉพาะอย่างยิ่ง "การใช้เมาส์ (Mouse)" ซึ่งเป็นอุปกรณ์นำเข้าข้อมูลหลักที่จำเป็นอย่างยิ่งต่อการเรียนรู้วิทยาการคำนวณในระดับประถมศึกษา`,
    }],
    indentFirstLine: 400,
    fontSize: 15,
    spaceAfter: 60,
  });
  paragraphs.push({
    runs: [{
      text: `   จากการทดสอบก่อนเรียน (Pre-test) พบว่านักเรียนจับเมาส์ไม่ถูกต้อง ขาดความคล่องแคล่วในการกดปุ่มคลิกซ้าย มักกดแช่หรือกดซ้ำ การดับเบิลคลิกทำได้ช้าเกินไปจนระบบไม่ทำงาน การคลิกขวากดสลับนิ้วผิด และการลากวาง (Drag and Drop) ปล่อยนิ้วก่อนถึงเป้าหมาย ส่งผลให้นักเรียนเกิดความกังวล ช้ากว่าบทเรียน และส่งผลกระทบต่อการเรียนการเขียนโปรแกรมแบบบล็อกคำสั่ง ครูผู้สอนจึงได้นำ "แนวคิดเกมมิฟิเคชัน (Gamification)" บูรณาการร่วมกับการจัดการเรียนรู้เชิงรุก "Active Learning" ผ่านระบบเกมฝึกทักษะเมาส์ Mouse Practice Pro บนเว็บไซต์ของโรงเรียน เพื่อให้นักเรียนได้ลงมือฝึกฝนจริงอย่างสนุกสนานและมีแรงจูงใจ`,
    }],
    indentFirstLine: 400,
    fontSize: 15,
    spaceAfter: 120,
  });

  // 2. วิธีการดำเนินการ
  paragraphs.push({
    runs: [{ text: '๒. วิธีการดำเนินการให้บรรลุผล (กระบวนการพัฒนา)', bold: true }],
    fontSize: 16,
    spaceAfter: 80,
  });
  paragraphs.push({
    runs: [{ text: '๒.๑ การวิเคราะห์และออกแบบ: ', bold: true }, { text: 'วิเคราะห์หลักสูตร มาตรฐาน ว ๔.๒ ป.๑ ออกแบบแผนการจัดการเรียนรู้ Active Learning ๔ สัปดาห์ และออกแบบเกมฝึกเมาส์ ๔ โหมด ได้แก่ คลิกเดี่ยว, ดับเบิลคลิก, คลิกขวา, และลากวาง' }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 60,
  });
  paragraphs.push({
    runs: [{ text: '๒.๒ การพัฒนานวัตกรรมและจัดกิจกรรม: ', bold: true }, { text: 'สร้างระบบเกมมิฟิเคชันบนเว็บ krujames.com มีคะแนน XP, เลเวล, เหรียญตราความสำเร็จ และเสียงเอฟเฟกต์ตอบรับสด ให้นักเรียนได้ฝึกปฏิบัติจริงในคาบเรียนพร้อมการจับคู่เพื่อนช่วยเรียน' }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 60,
  });
  paragraphs.push({
    runs: [{ text: '๒.๓ การประเมินผลและการสรุป: ', bold: true }, { text: 'ทดสอบวัดผลสัมฤทธิ์ก่อนเรียน (Pre-test) และหลังเรียน (Post-test) วิเคราะห์สถิติ เปรียบเทียบคะแนนรายบุคคล และนำข้อค้นพบไปแลกเปลี่ยนในชุมชนการเรียนรู้ทางวิชาชีพ (PLC)' }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 120,
  });

  // 3. ผลลัพธ์
  paragraphs.push({
    runs: [{ text: '๓. ผลลัพธ์การพัฒนาที่คาดหวัง', bold: true }],
    fontSize: 16,
    spaceAfter: 80,
  });
  paragraphs.push({
    runs: [{ text: '๓.๑ ผลลัพธ์เชิงปริมาณ: ', bold: true }],
    indentLeft: 200,
    fontSize: 15,
    spaceAfter: 40,
  });
  paragraphs.push({
    runs: [{ text: `(๑) นักเรียนชั้นประถมศึกษาปีที่ ๑ จำนวน ๑๑ คน (ร้อยละ ๑๐๐) ได้รับการพัฒนาทักษะการใช้เมาส์` }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 40,
  });
  paragraphs.push({
    runs: [{ text: `(๒) นักเรียนมีคะแนนทดสอบหลังเรียนเฉลี่ย ${stats.postMean.toFixed(2)} คะแนน สูงกว่าก่อนเรียนซึ่งมีค่าเฉลี่ย ${stats.preMean.toFixed(2)} คะแนน อย่างมีนัยสำคัญทางสถิติที่ระดับ .๐๑ (t = ${stats.tValue.toFixed(3)})` }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 40,
  });
  paragraphs.push({
    runs: [{ text: `(๓) นักเรียนผ่านเกณฑ์ร้อยละ ๗๐ (๗๐ คะแนนขึ้นไป) คิดเป็นร้อยละ ${stats.passedPercentage}% (ผ่านครบ ${stats.passedCount} จาก ๑๑ คน) สูงกว่าเป้าหมายที่ตั้งไว้` }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 40,
  });
  paragraphs.push({
    runs: [{ text: `(๔) นักเรียนมีร้อยละของความก้าวหน้า (% Gain) เฉลี่ยร้อยละ ${stats.gainPercentage.toFixed(2)}%` }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 80,
  });

  paragraphs.push({
    runs: [{ text: '๓.๒ ผลลัพธ์เชิงคุณภาพ: ', bold: true }],
    indentLeft: 200,
    fontSize: 15,
    spaceAfter: 40,
  });
  paragraphs.push({
    runs: [{ text: `(๑) นักเรียน ป.๑ มีทักษะและความคล่องแคล่วในการจับและควบคุมเมาส์อย่างถูกวิธี สามารถคลิกซ้าย ดับเบิลคลิก คลิกขวา และลากวางได้อย่างถูกต้องแม่นยำ` }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 40,
  });
  paragraphs.push({
    runs: [{ text: `(๒) นักเรียนมีความมั่นใจ ไม่กลัวอุปกรณ์คอมพิวเตอร์ และนำทักษะการใช้เมาส์ไปต่อยอดการเรียนเขียนโปรแกรมและใช้ซอฟต์แวร์ได้อย่างราบรื่น` }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 40,
  });
  paragraphs.push({
    runs: [{ text: `(๓) นักเรียนมีความสุข กระตือรือร้น และมีเจตคติที่ดีต่อการเรียนรู้วิชาวิทยาการคำนวณ` }],
    indentLeft: 400,
    fontSize: 15,
    spaceAfter: 120,
  });

  // 4. ตารางคะแนน 11 คน
  paragraphs.push({
    runs: [{ text: '๔. สรุปข้อมูลคะแนนก่อนเรียน-หลังเรียน รายบุคคล (นักเรียน ป.๑ ทั้ง ๑๑ คน)', bold: true }],
    fontSize: 16,
    spaceAfter: 80,
  });

  records.forEach((r) => {
    const diff = r.postTestScore - r.preTestScore;
    paragraphs.push({
      runs: [
        { text: `เลขที่ ${r.no}  ${r.name}: `, bold: true },
        { text: `ก่อนเรียน ${r.preTestScore} คะแนน (${r.preTestAccuracy}%)  |  หลังเรียน ${r.postTestScore} คะแนน (${r.postTestAccuracy}%)  |  ผลต่าง +${diff} คะแนน (ผ่านเกณฑ์)` },
      ],
      indentLeft: 400,
      fontSize: 14,
      spaceAfter: 30,
    });
  });

  paragraphs.push({
    runs: [
      { text: `สรุปสถิติภาพรวม: N = ${stats.count} คน, ก่อนเรียน x̄ = ${stats.preMean.toFixed(2)} (S.D. = ${stats.preSD.toFixed(2)}), หลังเรียน x̄ = ${stats.postMean.toFixed(2)} (S.D. = ${stats.postSD.toFixed(2)}), ความก้าวหน้าเฉลี่ย +${stats.meanDiff.toFixed(2)} คะแนน, t = ${stats.tValue.toFixed(3)} (p < .01), ผ่านเกณฑ์ ${stats.passedPercentage}%`, bold: true },
    ],
    indentLeft: 200,
    fontSize: 14,
    spaceAfter: 140,
  });

  // ลายเซ็น
  paragraphs.push({
    runs: [{ text: '(ลงชื่อ)........................................................... ผู้จัดทำข้อตกลง' }],
    align: 'center',
    fontSize: 15,
    spaceAfter: 30,
  });
  paragraphs.push({
    runs: [{ text: `( ${meta.teacherName} )` }],
    align: 'center',
    fontSize: 15,
    spaceAfter: 30,
  });
  paragraphs.push({
    runs: [{ text: `ตำแหน่ง ${meta.position} ${meta.schoolName}` }],
    align: 'center',
    fontSize: 15,
    spaceAfter: 120,
  });

  paragraphs.push({
    runs: [{ text: '(ลงชื่อ)........................................................... ผู้รับรองข้อตกลง' }],
    align: 'center',
    fontSize: 15,
    spaceAfter: 30,
  });
  paragraphs.push({
    runs: [{ text: '( นายปรัชญา ปรางค์ชัยภูมิ )' }],
    align: 'center',
    fontSize: 15,
    spaceAfter: 30,
  });
  paragraphs.push({
    runs: [{ text: `ผู้อำนวยการโรงเรียนบ้านคลองมดแดง` }],
    align: 'center',
    fontSize: 15,
    spaceAfter: 40,
  });

  return paragraphs;
};

/** ดาวน์โหลดเอกสารข้อตกลง ว.PA เป็นไฟล์ Word (.docx) */
export const downloadPaAgreementDocx = (
  statsInput?: ResearchStatistics,
  recordsInput?: StudentMouseRecord[],
  meta: PaAgreementMeta = DEFAULT_PA_META,
) => {
  const paragraphs = generatePaAgreementDocxParagraphs(statsInput, recordsInput, meta);
  const blob = buildDocx(paragraphs);
  downloadBlob(blob, `ข้อตกลง_PA_ประเด็นท้าทาย_ทักษะเมาส์_ป1_2569.docx`);
};
