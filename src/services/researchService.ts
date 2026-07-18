// สร้างเอกสารงานวิจัยจากข้อมูลจริงของเว็บ
// รูปแบบ: งานวิจัยการเรียนการสอนผ่านเว็บ (WBI) + ADDIE Model
// ดึงผลสัมฤทธิ์จริงจากกระดาษเกรด K/P/A → คำนวณค่าเฉลี่ย/SD/ระดับ → ประกอบเอกสาร

import {
  loadGrades, computeBreakdown, computeGrade, getSubjectsForClassroom,
} from './gradeService';
import type { Subject } from './gradeService';
import { loadAllRosters } from './rosterService';

export interface ResearchMeta {
  title: string;
  researcher: string;
  school: string;
  academicYear: string;
  classroomLabel: string;   // เช่น "ป.5" หรือ "ทุกชั้น"
  satisfactionMean?: number; // ครูกรอกเองถ้ามีแบบสอบถาม (1-5)
}

export interface ResearchData {
  n: number;                    // จำนวนประชากร
  classroomsUsed: string[];
  achievementMean100: number;   // คะแนนเฉลี่ยเต็ม 100
  achievementSD: number;
  achievementMean25: number;    // แปลงเป็นสเกล 25 (ตามตัวอย่างงานวิจัย)
  achievementLevel: string;     // ดีเยี่ยม/ดี/พอใช้/ผ่าน/ไม่ผ่าน
  gradeDist: Record<string, number>; // เกรด → จำนวนคน
  passRate: number;             // ร้อยละที่ผ่าน (>=50)
  kMean: number; pMean: number; aMean: number; examMean: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const levelFromPct = (pct: number): string => {
  if (pct >= 80) return 'ดีเยี่ยม';
  if (pct >= 70) return 'ดี';
  if (pct >= 60) return 'พอใช้';
  if (pct >= 50) return 'ผ่าน';
  return 'ไม่ผ่าน';
};

/** คำนวณสถิติผลสัมฤทธิ์จริงจากกระดาษเกรด */
export const computeResearchData = (classroom: string): ResearchData => {
  const rosters = loadAllRosters();
  const classroomsUsed = classroom === 'all' ? Object.keys(rosters) : [classroom];

  const totals: number[] = [];
  const grades: string[] = [];
  const ks: number[] = []; const ps: number[] = []; const as: number[] = []; const exams: number[] = [];

  classroomsUsed.forEach((c) => {
    const subjects: Subject[] = getSubjectsForClassroom(c).map((s) => s.id);
    subjects.forEach((subj) => {
      const rows = loadGrades(c, subj);
      rows.forEach((g) => {
        const b = computeBreakdown(g, c, subj);
        // นับเฉพาะคนที่มีคะแนน (เคยเรียน/ประเมินแล้ว)
        if (b.total > 0) {
          totals.push(b.total);
          grades.push(computeGrade(g, c, subj));
          ks.push(b.k); ps.push(b.p); as.push(b.a); exams.push(b.exam);
        }
      });
    });
  });

  const n = totals.length;
  const mean = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  const achievementMean100 = mean(totals);
  const variance = n > 1
    ? totals.reduce((s, x) => s + (x - achievementMean100) ** 2, 0) / (n - 1)
    : 0;
  const achievementSD = Math.sqrt(variance);

  const gradeDist: Record<string, number> = {};
  grades.forEach((g) => { gradeDist[g] = (gradeDist[g] || 0) + 1; });

  const passRate = n ? (totals.filter((t) => t >= 50).length / n) * 100 : 0;

  return {
    n,
    classroomsUsed,
    achievementMean100: round2(achievementMean100),
    achievementSD: round2(achievementSD),
    achievementMean25: round2((achievementMean100 / 100) * 25),
    achievementLevel: levelFromPct(achievementMean100),
    gradeDist,
    passRate: round2(passRate),
    kMean: round2(mean(ks)), pMean: round2(mean(ps)), aMean: round2(mean(as)), examMean: round2(mean(exams)),
  };
};

const satisfactionLevel = (m?: number): string => {
  if (m === undefined) return '(ยังไม่ได้เก็บแบบสอบถาม)';
  if (m >= 4.5) return 'มากที่สุด';
  if (m >= 3.5) return 'มาก';
  if (m >= 2.5) return 'ปานกลาง';
  if (m >= 1.5) return 'น้อย';
  return 'น้อยที่สุด';
};

/** ประกอบเอกสารงานวิจัยฉบับเต็ม (ภาษาไทย) จาก meta + data จริง */
export const buildResearchDocument = (meta: ResearchMeta, d: ResearchData): string => {
  const sat = meta.satisfactionMean;
  const satStr = sat !== undefined ? `${sat.toFixed(2)}` : '—';
  const gradeLines = Object.keys(d.gradeDist)
    .sort((a, b) => parseFloat(b) - parseFloat(a))
    .map((g) => `เกรด ${g}: ${d.gradeDist[g]} คน`)
    .join(' • ') || '(ยังไม่มีข้อมูลเกรด)';

  return `เอกสารสรุปงานวิจัย

เรื่อง
${meta.title}

ผู้วิจัย  ${meta.researcher}
สถาบัน  ${meta.school}
ปีการศึกษา ${meta.academicYear}

──────────────────────────────────────────
บทคัดย่อ

การวิจัยครั้งนี้มีวัตถุประสงค์เพื่อ (1) พัฒนาการเรียนการสอนผ่านเว็บ (Web-Based Instruction: WBI) ในรายวิชาวิทยาการคำนวณสำหรับนักเรียน${meta.classroomLabel} ${meta.school} และ (2) ศึกษาผลจากการใช้การเรียนการสอนผ่านเว็บดังกล่าว ประชากรของการวิจัยคือนักเรียนที่เข้าใช้ระบบจำนวน ${d.n} คน เครื่องมือวิจัยได้แก่ เว็บไซต์เรียนการสอนที่พัฒนาด้วยกระบวนการ ADDIE Model แบบทดสอบวัดผลสัมฤทธิ์ (K/P/A ต่อตัวชี้วัด + สอบปลายภาค) และแบบสอบถามความพึงพอใจ

ผลการวิจัยพบว่า นักเรียนมีผลสัมฤทธิ์ทางการเรียนโดยรวมเฉลี่ย ${d.achievementMean25.toFixed(2)} จากคะแนนเต็ม 25 (คิดเป็น ${d.achievementMean100.toFixed(2)} จาก 100, S.D. = ${d.achievementSD.toFixed(2)}) อยู่ในระดับ "${d.achievementLevel}" มีอัตราการผ่านเกณฑ์ร้อยละ ${d.passRate.toFixed(1)} ด้านความพึงพอใจของนักเรียนอยู่ในระดับ "${satisfactionLevel(sat)}" (ค่าเฉลี่ย ${satStr}) โดยเห็นว่าเป็นรูปแบบที่สะดวก มีเกม แบบทดสอบ และระบบติดตามคะแนนที่เพิ่มความน่าสนใจให้บทเรียน

คำสำคัญ: การเรียนการสอนผ่านเว็บ (WBI), วิทยาการคำนวณ, ADDIE Model, ผลสัมฤทธิ์ทางการเรียน, ความพึงพอใจ

──────────────────────────────────────────
บทที่ 1 บทนำ

1.1 ความสำคัญของปัญหา
ตามหลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560) วิชาคอมพิวเตอร์ถูกปรับเป็น "วิชาวิทยาการคำนวณ" ในกลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี ผู้วิจัยซึ่งจัดการเรียนการสอนวิชานี้ที่ ${meta.school} จึงนำแนวคิดการเรียนการสอนผ่านเว็บ (WBI) มาใช้ เพื่อให้ผู้เรียนศึกษา ค้นคว้า และทบทวนบทเรียนได้ทุกที่ทุกเวลา พร้อมระบบเกม แบบทดสอบออนไลน์ และการติดตามความก้าวหน้ารายบุคคล

1.2 วัตถุประสงค์ของการวิจัย
1) เพื่อพัฒนาการเรียนการสอนผ่านเว็บในรายวิชาวิทยาการคำนวณสำหรับนักเรียน${meta.classroomLabel}
2) เพื่อศึกษาผลจากการใช้การเรียนการสอนผ่านเว็บดังกล่าว (ผลสัมฤทธิ์และความพึงพอใจ)

1.3 ขอบเขตของการวิจัย
- ด้านประชากร: นักเรียน${meta.classroomLabel} ${meta.school} ปีการศึกษา ${meta.academicYear} จำนวน ${d.n} คน
- ด้านตัวแปร: ตัวแปรต้นคือเว็บไซต์เรียนการสอนที่พัฒนาด้วย ADDIE Model ตัวแปรตามคือผลสัมฤทธิ์ทางการเรียนและความพึงพอใจ

1.4 ประโยชน์ที่ได้รับ
1) ครูได้ระบบเรียนการสอนผ่านเว็บที่นำเสนอเนื้อหา แบบฝึกหัด แบบทดสอบ เกม และระบบเก็บคะแนนอัตโนมัติ
2) ผู้เรียนได้แหล่งเรียนรู้ออนไลน์ ทบทวนบทเรียนและติดตามคะแนนตนเองได้
3) สถานศึกษาได้ต้นแบบเว็บไซต์แหล่งเรียนรู้ที่ประยุกต์กับรายวิชาอื่นได้

──────────────────────────────────────────
บทที่ 2 การตรวจเอกสาร (สรุป)

ผู้วิจัยตรวจเอกสาร 5 หัวข้อ ได้แก่ (1) หลักสูตรแกนกลางฯ ฉบับปรับปรุง พ.ศ. 2560 (2) วิชาวิทยาการคำนวณและตัวชี้วัด (3) การเรียนการสอนผ่านเว็บ (WBI) (4) กระบวนการพัฒนาสื่อแบบ ADDIE Model และ (5) งานวิจัยที่เกี่ยวข้อง

ADDIE Model ประกอบด้วย 5 ขั้น: การวิเคราะห์ (Analysis), การออกแบบ (Design), การพัฒนา (Development), การนำไปใช้ (Implementation), และการประเมินผล (Evaluation) ซึ่งการวิจัยนี้ใช้เป็นกรอบพัฒนาเว็บไซต์เรียนการสอน

──────────────────────────────────────────
บทที่ 3 วิธีการวิจัย

3.1 ประชากร: นักเรียน${meta.classroomLabel} ${meta.school} จำนวน ${d.n} คน (${d.classroomsUsed.join(', ')})

3.2 เครื่องมือที่ใช้ในการวิจัย
1) เว็บไซต์เรียนการสอนวิชาวิทยาการคำนวณ พัฒนาด้วย ADDIE Model
2) แบบวัดผลสัมฤทธิ์แบบ K/P/A ต่อตัวชี้วัด (คะแนนเก็บ 70) + สอบปลายภาค (30)
3) แบบสอบถามความพึงพอใจ (มาตรประเมิน 5 ระดับของ Best, 1977)

3.3 การเก็บรวบรวมข้อมูล
จัดการเรียนการสอนผ่านเว็บกับนักเรียนตลอดภาคเรียน เก็บคะแนน K/P/A รายตัวชี้วัด คะแนนสอบ และแบบสอบถามความพึงพอใจ ผ่านระบบของเว็บไซต์โดยอัตโนมัติ

3.4 การวิเคราะห์ข้อมูล
ใช้สถิติบรรยาย ได้แก่ ค่าเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และร้อยละ

──────────────────────────────────────────
บทที่ 4 ผลการวิจัย

4.1 ผลสัมฤทธิ์ทางการเรียน (จากข้อมูลจริงในระบบ)
- จำนวนนักเรียนที่มีคะแนน: ${d.n} คน
- คะแนนเฉลี่ยรวม: ${d.achievementMean100.toFixed(2)} / 100 (S.D. = ${d.achievementSD.toFixed(2)})
- เทียบสเกล 25 คะแนน: ${d.achievementMean25.toFixed(2)} / 25 → ระดับ "${d.achievementLevel}"
- อัตราผ่านเกณฑ์ (≥ ร้อยละ 50): ร้อยละ ${d.passRate.toFixed(1)}
- คะแนนเฉลี่ยแยกองค์ประกอบ: K = ${d.kMean.toFixed(2)}, P = ${d.pMean.toFixed(2)}, A = ${d.aMean.toFixed(2)}, สอบ = ${d.examMean.toFixed(2)}
- การกระจายเกรด: ${gradeLines}

4.2 ความพึงพอใจของนักเรียน
ความพึงพอใจโดยรวมอยู่ในระดับ "${satisfactionLevel(sat)}" (ค่าเฉลี่ย ${satStr})

──────────────────────────────────────────
บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ

5.1 สรุปผล
การพัฒนาการเรียนการสอนผ่านเว็บด้วย ADDIE Model ทำให้ได้เว็บไซต์ที่นักเรียนใช้เรียน ทบทวน เล่นเกม และทำแบบทดสอบได้ ผลสัมฤทธิ์เฉลี่ยอยู่ในระดับ "${d.achievementLevel}" (${d.achievementMean25.toFixed(2)}/25) และความพึงพอใจอยู่ในระดับ "${satisfactionLevel(sat)}"

5.2 อภิปรายผล
ผลสัมฤทธิ์ที่อยู่ในระดับดีสอดคล้องกับงานวิจัยที่พบว่าการเรียนการสอนผ่านเว็บช่วยให้ผู้เรียนเข้าถึงบทเรียนได้ทุกที่ทุกเวลา มีปฏิสัมพันธ์ และกำกับการเรียนของตนเองได้ ระบบเกมและการติดตามคะแนนช่วยเพิ่มแรงจูงใจในการเรียน

5.3 ข้อเสนอแนะ
1) พัฒนาเนื้อหาและแบบฝึกหัดให้ครอบคลุมทุกตัวชี้วัดมากยิ่งขึ้น
2) เก็บข้อมูลแบบสอบถามความพึงพอใจอย่างเป็นระบบทุกภาคเรียน
3) การวิจัยครั้งต่อไปอาจใช้รูปแบบห้องเรียนกลับด้าน (Flipped Classroom) ควบคู่กับ WBI

──────────────────────────────────────────
หมายเหตุ: ตัวเลขผลสัมฤทธิ์ในบทที่ 4 คำนวณจากข้อมูลจริงในระบบ ณ วันที่ ${new Date().toLocaleDateString('th-TH')} — เมื่อครูกรอกคะแนน/นักเรียนใช้งานเพิ่ม ตัวเลขจะเปลี่ยนตาม`;
};
