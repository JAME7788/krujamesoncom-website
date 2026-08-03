// สร้างเอกสารงานวิจัยจากข้อมูลจริงของเว็บ
// รูปแบบ: งานวิจัยการเรียนการสอนผ่านเว็บ (WBI) + ADDIE Model
// ดึงผลสัมฤทธิ์จริงจากกระดาษเกรด K/P/A → คำนวณค่าเฉลี่ย/SD/ระดับ → ประกอบเอกสาร

import {
  loadGrades, computeBreakdown, computeGrade, getSubjectsForClassroom, getIndicators,
} from './gradeService';
import type { Subject } from './gradeService';
import { loadAllRosters } from './rosterService';
import { getAllCachedProgress, computeGamification } from './progressService';
import { SURVEY_QUESTIONS } from './satisfactionSurveyService';
import type { SurveyStats } from './satisfactionSurveyService';

export interface ResearchMeta {
  title: string;
  researcher: string;
  school: string;
  academicYear: string;
  classroomLabel: string;   // เช่น "ป.5" หรือ "ทุกชั้น"
  satisfactionMean?: number; // ครูกรอกเองถ้ามีแบบสอบถาม (1-5)
}

export interface ResearchData {
  n: number;                    // จำนวนนักเรียนที่มีคะแนน (ไม่ซ้ำคน)
  populationSize: number;       // จำนวนนักเรียนทั้งหมดตามบัญชีรายชื่อ
  scoreRecords: number;         // จำนวนระเบียนผลการเรียนที่นำมาวิเคราะห์
  classroomsUsed: string[];
  achievementMean100: number;   // คะแนนเฉลี่ยเต็ม 100
  achievementSD: number;
  achievementMean25: number;    // แปลงเป็นสเกล 25 (ตามตัวอย่างงานวิจัย)
  achievementLevel: string;     // ดีเยี่ยม/ดี/พอใช้/ผ่าน/ไม่ผ่าน
  gradeDist: Record<string, number>; // เกรด → จำนวนคน
  passRate: number;             // ร้อยละที่ผ่าน (>=50)
  kMean: number; pMean: number; aMean: number; examMean: number;
  // ===== เกมมิฟิเคชัน (engagement จริงจากระบบ) =====
  activeStudents: number;       // จำนวนที่มี progress (เคยเข้าใช้)
  avgXp: number;
  avgLevel: number;
  maxLevel: number;
  avgStreak: number;
  avgActivities: number;        // กิจกรรม/สื่อเฉลี่ยต่อคน
  avgQuizzes: number;           // ครั้งทำแบบทดสอบเฉลี่ยต่อคน
  avgSlides: number;            // สไลด์อ่านเฉลี่ยต่อคน
  engagementRate: number;       // ร้อยละ active / ประชากรทั้งหมด
  // ===== ผลสัมฤทธิ์รายจุดประสงค์การเรียนรู้ (ต่อตัวชี้วัด) =====
  objectives: ObjectiveResult[];
  // ===== ประสิทธิภาพ E1/E2 =====
  e1: number;                   // ประสิทธิภาพระหว่างเรียน (คะแนนเก็บ %)
  e2: number;                   // ประสิทธิภาพหลังเรียน (คะแนนสอบ %)
  // ===== Pre-test / Post-test (จากประวัติการทำแบบทดสอบ) =====
  preMean: number;              // % ครั้งแรกที่ทำ (ก่อนเรียนรู้)
  postMean: number;             // % ครั้งที่ดีที่สุด (หลังเรียนรู้)
  learningGain: number;         // post - pre
  prePostN: number;             // จำนวนคู่ที่คำนวณได้
}

export interface ObjectiveResult {
  classroom: string;
  code: string;      // เช่น ว 4.2 ม.1/1
  title: string;     // จุดประสงค์/ตัวชี้วัด
  mean: number;      // คะแนนเฉลี่ยที่ได้ของตัวชี้วัดนี้
  max: number;       // คะแนนเต็มของตัวชี้วัดนี้
  pct: number;       // ร้อยละ
  level: string;     // ระดับ
  n: number;         // จำนวนคนที่มีคะแนน
}

export interface ResearchDocumentPart {
  key: 'front' | `chapter-${1 | 2 | 3 | 4 | 5}`;
  label: string;
  title: string;
  content: string;
  start: number;
  end: number;
}

export const RESEARCH_CHAPTER_OUTLINE = [
  { number: 1, title: 'บทนำ', sections: 'ปัญหา คำถาม วัตถุประสงค์ สมมติฐาน ขอบเขต และนิยามศัพท์' },
  { number: 2, title: 'เอกสารและงานวิจัยที่เกี่ยวข้อง', sections: 'หลักสูตร WBI เกมมิฟิเคชัน ADDIE การวัด K/P/A และกรอบแนวคิด' },
  { number: 3, title: 'วิธีดำเนินการวิจัย', sections: 'แบบวิจัย กลุ่มเป้าหมาย เครื่องมือ ขั้นตอน เก็บข้อมูล สถิติ และจริยธรรม' },
  { number: 4, title: 'ผลการวิเคราะห์ข้อมูล', sections: 'ผลสัมฤทธิ์ ตัวชี้วัด E1/E2 ก่อน-หลัง การมีส่วนร่วม และความพึงพอใจ' },
  { number: 5, title: 'สรุป อภิปรายผล และข้อเสนอแนะ', sections: 'สรุปผล อภิปราย ข้อจำกัด การนำไปใช้ และข้อเสนอแนะ' },
] as const;

/** แยกต้นฉบับเป็นบทคัดย่อ/ข้อมูลนำและบทที่ 1-5 เพื่อให้แก้ไขในเว็บทีละบทได้ */
export const splitResearchDocument = (documentText: string): ResearchDocumentPart[] => {
  const headings = Array.from(documentText.matchAll(/^บทที่\s*([1-5])\s+([^\r\n]+)$/gm));
  if (headings.length !== 5) {
    return [{ key: 'front', label: 'ต้นฉบับ', title: 'เอกสารงานวิจัย', content: documentText, start: 0, end: documentText.length }];
  }

  const parts: ResearchDocumentPart[] = [{
    key: 'front',
    label: 'บทคัดย่อ',
    title: 'ปก บทคัดย่อ และคำสำคัญ',
    content: documentText.slice(0, headings[0].index).trim(),
    start: 0,
    end: headings[0].index,
  }];

  headings.forEach((heading, index) => {
    const number = Number(heading[1]) as 1 | 2 | 3 | 4 | 5;
    const start = heading.index;
    const end = headings[index + 1]?.index ?? documentText.length;
    parts.push({
      key: `chapter-${number}`,
      label: `บทที่ ${number}`,
      title: heading[2].trim(),
      content: documentText.slice(start, end).trim(),
      start,
      end,
    });
  });

  return parts;
};

export const replaceResearchDocumentPart = (
  documentText: string,
  key: ResearchDocumentPart['key'],
  content: string,
): string => {
  const part = splitResearchDocument(documentText).find((item) => item.key === key);
  if (!part) return documentText;
  const before = documentText.slice(0, part.start).trimEnd();
  const after = documentText.slice(part.end).trimStart();
  return [before, content.trim(), after].filter(Boolean).join('\n\n');
};

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
  const studentsWithScores = new Set<string>();
  const ks: number[] = []; const ps: number[] = []; const as: number[] = []; const exams: number[] = [];
  const collecteds: number[] = [];

  // สะสมคะแนนรายตัวชี้วัด (จุดประสงค์): key = classroom|subject|indicatorId
  const objAcc = new Map<string, { classroom: string; code: string; title: string; sum: number; count: number; max: number }>();

  classroomsUsed.forEach((c) => {
    const subjects: Subject[] = getSubjectsForClassroom(c).map((s) => s.id);
    subjects.forEach((subj) => {
      const indicators = getIndicators(c, subj);
      const titleById = new Map(indicators.map((ind) => [ind.id, ind.title]));
      const rows = loadGrades(c, subj);
      rows.forEach((g) => {
        const b = computeBreakdown(g, c, subj);
        // นับเฉพาะคนที่มีคะแนน (เคยเรียน/ประเมินแล้ว)
        if (b.total > 0) {
          studentsWithScores.add(`${c}|${g.studentCode || g.studentNo}`);
          totals.push(b.total);
          grades.push(computeGrade(g, c, subj));
          ks.push(b.k); ps.push(b.p); as.push(b.a); exams.push(b.exam);
          collecteds.push(b.collected);
          // สะสมรายตัวชี้วัดจาก contributions
          b.contributions.forEach((con) => {
            const key = `${c}|${subj}|${con.indicatorId}`;
            const cur = objAcc.get(key) || {
              classroom: c, code: con.code,
              title: titleById.get(con.indicatorId) || con.code,
              sum: 0, count: 0, max: con.weight,
            };
            cur.sum += con.total;
            cur.count += 1;
            cur.max = con.weight;
            objAcc.set(key, cur);
          });
        }
      });
    });
  });

  const objectives: ObjectiveResult[] = Array.from(objAcc.values())
    .filter((o) => o.count > 0)
    .map((o) => {
      const m = o.sum / o.count;
      const pct = o.max > 0 ? (m / o.max) * 100 : 0;
      return {
        classroom: o.classroom, code: o.code, title: o.title,
        mean: round2(m), max: round2(o.max), pct: round2(pct),
        level: levelFromPct(pct), n: o.count,
      };
    })
    .sort((a, b) => a.code.localeCompare(b.code, 'th'));

  const n = studentsWithScores.size;
  const scoreRecords = totals.length;
  const mean = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);
  const achievementMean100 = mean(totals);
  const variance = scoreRecords > 1
    ? totals.reduce((s, x) => s + (x - achievementMean100) ** 2, 0) / (scoreRecords - 1)
    : 0;
  const achievementSD = Math.sqrt(variance);

  const gradeDist: Record<string, number> = {};
  grades.forEach((g) => { gradeDist[g] = (gradeDist[g] || 0) + 1; });

  const passRate = scoreRecords ? (totals.filter((t) => t >= 50).length / scoreRecords) * 100 : 0;

  // ===== เกมมิฟิเคชัน: อ่าน progress จริงในระบบ (filter ตามชั้นที่เลือก) =====
  const allProg = getAllCachedProgress();
  const inClass = allProg.filter((p) => {
    const c = classroomsUsed.find((cc) => p.studentId.startsWith(`${cc}_`));
    return !!c;
  });
  const xps: number[] = []; const levels: number[] = []; const streaks: number[] = [];
  const acts: number[] = []; const quizzes: number[] = []; const slides: number[] = [];
  inClass.forEach((p) => {
    const g = computeGamification(p.studentId);
    xps.push(g.xp); levels.push(g.level); streaks.push(g.streakDays);
    acts.push(p.totalActivities || 0);
    quizzes.push((p.attempts || []).length);
    slides.push(p.totalSlidesViewed || 0);
  });
  const activeStudents = inClass.length;
  const totalPopulation = classroomsUsed.reduce((s, c) => s + (rosters[c]?.length || 0), 0);

  // ===== ประสิทธิภาพ E1/E2 (E1 = คะแนนเก็บ/70, E2 = คะแนนสอบ/30) =====
  const e1 = collecteds.length ? (mean(collecteds) / 70) * 100 : 0;
  const e2 = exams.length ? (mean(exams) / 30) * 100 : 0;

  // ===== Pre/Post จากประวัติแบบทดสอบ: ครั้งแรก(pre) เทียบครั้งดีสุด(post) ต่อ unit =====
  const pres: number[] = []; const posts: number[] = [];
  inClass.forEach((p) => {
    const byUnit = new Map<string, { first: number; best: number; firstTs: number }>();
    (p.attempts || []).forEach((att) => {
      const key = `${att.gradeId}_${att.unitNo}`;
      const cur = byUnit.get(key);
      if (!cur) {
        byUnit.set(key, { first: att.percentage, best: att.percentage, firstTs: att.timestamp });
      } else {
        if (att.timestamp < cur.firstTs) { cur.first = att.percentage; cur.firstTs = att.timestamp; }
        if (att.percentage > cur.best) cur.best = att.percentage;
      }
    });
    byUnit.forEach((u) => { pres.push(u.first); posts.push(u.best); });
  });
  const preMean = pres.length ? mean(pres) : 0;
  const postMean = posts.length ? mean(posts) : 0;

  return {
    n,
    populationSize: totalPopulation,
    scoreRecords,
    classroomsUsed,
    achievementMean100: round2(achievementMean100),
    achievementSD: round2(achievementSD),
    achievementMean25: round2((achievementMean100 / 100) * 25),
    achievementLevel: levelFromPct(achievementMean100),
    gradeDist,
    passRate: round2(passRate),
    kMean: round2(mean(ks)), pMean: round2(mean(ps)), aMean: round2(mean(as)), examMean: round2(mean(exams)),
    activeStudents,
    avgXp: round2(mean(xps)),
    avgLevel: round2(mean(levels)),
    maxLevel: levels.length ? Math.max(...levels) : 0,
    avgStreak: round2(mean(streaks)),
    avgActivities: round2(mean(acts)),
    avgQuizzes: round2(mean(quizzes)),
    avgSlides: round2(mean(slides)),
    engagementRate: totalPopulation ? round2((activeStudents / totalPopulation) * 100) : 0,
    objectives,
    e1: round2(e1),
    e2: round2(e2),
    preMean: round2(preMean),
    postMean: round2(postMean),
    learningGain: round2(postMean - preMean),
    prePostN: pres.length,
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

/** ประกอบเอกสารงานวิจัยฉบับเต็ม (ภาษาไทย) จาก meta + data จริง + แบบสอบถามจริง (ถ้ามี) */
export const buildResearchDocument = (meta: ResearchMeta, d: ResearchData, survey?: SurveyStats): string => {
  // ถ้ามีแบบสอบถามจริงในระบบ ใช้ค่านั้น มิฉะนั้นใช้ค่าที่ครูกรอก
  const sat = (survey && survey.n > 0) ? survey.mean : meta.satisfactionMean;
  const satStr = sat !== undefined ? `${sat.toFixed(2)}` : '—';
  const satSource = (survey && survey.n > 0) ? `จากแบบสอบถามจริง ${survey.n} คน` : '(ครูกรอก)';
  const perQLines = (survey && survey.n > 0)
    ? SURVEY_QUESTIONS.map((q, i) => `   ${i + 1}) ${q} — เฉลี่ย ${survey.perQuestion[i].toFixed(2)}`).join('\n')
    : '';
  const gradeLines = Object.keys(d.gradeDist)
    .sort((a, b) => parseFloat(b) - parseFloat(a))
    .map((g) => `เกรด ${g}: ${d.gradeDist[g]} คน`)
    .join(' • ') || '(ยังไม่มีข้อมูลเกรด)';

  const objLines = d.objectives.length
    ? d.objectives.map((o, i) =>
        `${i + 1}) [${o.classroom}] ${o.code} — ${o.title}\n     คะแนนเฉลี่ย ${o.mean.toFixed(2)}/${o.max.toFixed(2)} (ร้อยละ ${o.pct.toFixed(1)}) → ระดับ "${o.level}" [n=${o.n}]`
      ).join('\n')
    : '(ยังไม่มีคะแนนรายตัวชี้วัด — กรอกคะแนน K/P/A ก่อน)';

  return `เอกสารสรุปงานวิจัย

เรื่อง
${meta.title}

ผู้วิจัย  ${meta.researcher}
สถาบัน  ${meta.school}
ปีการศึกษา ${meta.academicYear}

──────────────────────────────────────────
บทคัดย่อ

การวิจัยครั้งนี้มีวัตถุประสงค์เพื่อ (1) พัฒนาการเรียนการสอนผ่านเว็บเทคโนโลยีร่วมกับแนวคิดเกมมิฟิเคชัน (Web-Based Instruction with Gamification) ในรายวิชาวิทยาการคำนวณสำหรับนักเรียน${meta.classroomLabel} ${meta.school} และ (2) ศึกษาผลจากการใช้การเรียนการสอนดังกล่าว ทั้งด้านผลสัมฤทธิ์ทางการเรียนและการมีส่วนร่วม (Engagement) ของผู้เรียน ประชากรตามบัญชีรายชื่อมี ${d.populationSize} คน ผู้เข้าใช้ระบบมี ${d.activeStudents} คน และผู้มีข้อมูลคะแนนอย่างน้อยหนึ่งรายการมี ${d.n} คน เครื่องมือวิจัยได้แก่ เว็บไซต์เรียนการสอนที่พัฒนาด้วยกระบวนการ ADDIE Model ซึ่งบูรณาการกลไกเกมมิฟิเคชัน (คะแนนประสบการณ์ XP, ระดับ Level, ยศ, ต่อเนื่องรายวัน Streak, เหรียญตรา และกระดานอันดับ) แบบทดสอบวัดผลสัมฤทธิ์ แบบประเมิน K/P/A ต่อตัวชี้วัด แบบประเมินชิ้นงาน และแบบสอบถามความพึงพอใจ

ผลการวิจัยพบว่า บทเรียนมีประสิทธิภาพ E1/E2 = ${d.e1.toFixed(2)}/${d.e2.toFixed(2)} นักเรียนมีผลสัมฤทธิ์ทางการเรียนโดยรวมเฉลี่ย ${d.achievementMean25.toFixed(2)} จากคะแนนเต็ม 25 (คิดเป็น ${d.achievementMean100.toFixed(2)} จาก 100, S.D. = ${d.achievementSD.toFixed(2)}) อยู่ในระดับ "${d.achievementLevel}" มีอัตราการผ่านเกณฑ์ร้อยละ ${d.passRate.toFixed(1)} และมีผลการเรียนรู้ที่เพิ่มขึ้นจากก่อนเรียน (Learning Gain) ร้อยละ ${d.learningGain.toFixed(2)} ด้านการมีส่วนร่วม นักเรียนมีคะแนนประสบการณ์ (XP) เฉลี่ย ${d.avgXp.toFixed(0)} เลื่อนระดับเฉลี่ย Level ${d.avgLevel.toFixed(1)} (สูงสุด Level ${d.maxLevel}) เข้าเรียนต่อเนื่องเฉลี่ย ${d.avgStreak.toFixed(1)} วัน ทำกิจกรรม/สื่อเฉลี่ย ${d.avgActivities.toFixed(1)} รายการต่อคน คิดเป็นอัตราการเข้าใช้ระบบ (Engagement Rate) ร้อยละ ${d.engagementRate.toFixed(1)} ด้านความพึงพอใจอยู่ในระดับ "${satisfactionLevel(sat)}" (ค่าเฉลี่ย ${satStr}) โดยเห็นว่ากลไกเกมมิฟิเคชันช่วยเพิ่มแรงจูงใจและความสนุกในการเรียน

คำสำคัญ: การเรียนการสอนผ่านเว็บ (WBI), เกมมิฟิเคชัน (Gamification), วิทยาการคำนวณ, ADDIE Model, ผลสัมฤทธิ์ทางการเรียน, การมีส่วนร่วม

──────────────────────────────────────────
บทที่ 1 บทนำ

1.1 ความสำคัญของปัญหา
หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พ.ศ. 2551 (ฉบับปรับปรุง พ.ศ. 2560) กำหนดให้สาระเทคโนโลยีมุ่งพัฒนาผู้เรียนให้คิดอย่างเป็นระบบ แก้ปัญหา ใช้เทคโนโลยีสารสนเทศอย่างเหมาะสม และรู้เท่าทันผลกระทบที่เกิดขึ้น การจัดการเรียนรู้จึงควรเปิดโอกาสให้ผู้เรียนลงมือปฏิบัติ ได้รับข้อมูลย้อนกลับ และทบทวนตามความพร้อมของตนเอง

บริบทของ ${meta.school} มีผู้เรียนที่มีความพร้อมและจังหวะการเรียนรู้แตกต่างกัน การเรียนในเวลาเดียวกันเพียงรูปแบบเดียวอาจไม่ตอบสนองผู้เรียนทุกคน ผู้วิจัยจึงพัฒนาการเรียนการสอนผ่านเว็บ (Web-Based Instruction: WBI) ที่รวมบทเรียน สไลด์ เกมฝึกทักษะ แบบทดสอบ งานปฏิบัติ และระบบติดตามความก้าวหน้ารายบุคคล พร้อมใช้เกมมิฟิเคชันเป็นแรงเสริมให้ผู้เรียนเห็นเป้าหมายและความก้าวหน้าของตน กระบวนการพัฒนาใช้ ADDIE Model เพื่อให้การวิเคราะห์ ออกแบบ พัฒนา ทดลองใช้ และประเมินผลดำเนินไปอย่างเป็นระบบ

ข้อมูลปัจจุบันมีนักเรียนตามบัญชีรายชื่อ ${d.populationSize} คน มีผู้เข้าใช้ระบบ ${d.activeStudents} คน และมีนักเรียนที่มีคะแนน K/P/A อย่างน้อยหนึ่งรายการ ${d.n} คน ข้อมูลดังกล่าวทำให้สามารถศึกษาทั้งผลสัมฤทธิ์ พฤติกรรมการเรียนรู้ และข้อจำกัดของสื่อจากหลักฐานที่เกิดขึ้นจริงในชั้นเรียน ไม่ใช้เพียงความรู้สึกของผู้สอน

1.2 คำถามการวิจัย
1) การเรียนการสอนผ่านเว็บร่วมกับเกมมิฟิเคชันที่พัฒนาด้วย ADDIE Model มีองค์ประกอบและกระบวนการใช้งานอย่างไร
2) หลังใช้ระบบ ผู้เรียนมีผลสัมฤทธิ์รายองค์ประกอบ K/P/A และรายตัวชี้วัดอยู่ในระดับใด
3) ผู้เรียนมีส่วนร่วมในการเรียนและมีความพึงพอใจต่อระบบอยู่ในระดับใด

1.3 วัตถุประสงค์ของการวิจัย
1) เพื่อพัฒนาการเรียนการสอนผ่านเว็บเทคโนโลยีร่วมกับเกมมิฟิเคชันในรายวิชาวิทยาการคำนวณสำหรับนักเรียน${meta.classroomLabel}
2) เพื่อศึกษาผลสัมฤทธิ์ทางการเรียน จำแนกรายจุดประสงค์การเรียนรู้ (ตามตัวชี้วัด)
3) เพื่อศึกษาการมีส่วนร่วม (Engagement) และความพึงพอใจของผู้เรียนที่มีต่อระบบ

1.4 สมมติฐานการวิจัย
1) ผู้เรียนมีคะแนนหลังเรียนสูงกว่าคะแนนก่อนเรียน
2) ผู้เรียนผ่านเกณฑ์ผลสัมฤทธิ์ที่กำหนดไม่น้อยกว่าร้อยละ 50
3) ผู้เรียนมีความพึงพอใจต่อการเรียนผ่านเว็บตั้งแต่ระดับมากขึ้นไป

หมายเหตุ: การยืนยันสมมติฐานต้องอาศัยข้อมูลที่ครบตามแผนและการทดสอบทางสถิติที่เหมาะสม หากข้อมูลยังไม่ครบ ระบบจะแสดงเป็นผลเบื้องต้นเท่านั้น

1.5 ขอบเขตของการวิจัย
- ประชากร/กลุ่มเป้าหมาย: นักเรียน${meta.classroomLabel} ${meta.school} ปีการศึกษา ${meta.academicYear} ตามบัญชีรายชื่อ ${d.populationSize} คน
- เนื้อหา: บทเรียนและกิจกรรมในรายวิชาวิทยาการคำนวณที่เชื่อมกับตัวชี้วัดของชั้นเรียนที่เลือก
- ระยะเวลา: ภายในปีการศึกษา ${meta.academicYear} ตามกำหนดการสอนของสถานศึกษา
- ตัวแปรต้น: การเรียนการสอนผ่านเว็บที่พัฒนาด้วย ADDIE Model และใช้เกมมิฟิเคชัน
- ตัวแปรตาม: ผลสัมฤทธิ์ K/P/A คะแนนแบบทดสอบ การมีส่วนร่วมในการใช้ระบบ และความพึงพอใจ

1.6 นิยามศัพท์เฉพาะ
1) การเรียนการสอนผ่านเว็บ (WBI) หมายถึง การจัดเนื้อหา กิจกรรม งาน แบบทดสอบ และข้อมูลย้อนกลับผ่านเว็บไซต์ของผู้วิจัย
2) เกมมิฟิเคชัน หมายถึง การใช้คะแนน XP ระดับ ความต่อเนื่อง เหรียญ และรางวัล เพื่อส่งเสริมแรงจูงใจ โดยไม่แทนที่เป้าหมายการเรียนรู้
3) ผลสัมฤทธิ์ K/P/A หมายถึง คะแนนความรู้ (K) ทักษะกระบวนการหรือการปฏิบัติ (P) และคุณลักษณะ/เจตคติ (A) ที่เชื่อมกับตัวชี้วัด
4) การมีส่วนร่วม หมายถึง หลักฐานการเข้าใช้ การทำกิจกรรม การอ่านสไลด์ การทำแบบทดสอบ และความต่อเนื่องที่ระบบบันทึกได้

1.7 ประโยชน์ที่คาดว่าจะได้รับ
1) ครูได้ระบบเรียนการสอนผ่านเว็บที่นำเสนอเนื้อหา แบบฝึกหัด แบบทดสอบ เกม และระบบเก็บคะแนนอัตโนมัติ
2) ผู้เรียนได้แหล่งเรียนรู้ออนไลน์ ทบทวนบทเรียนและติดตามคะแนนตนเองได้
3) สถานศึกษาได้ต้นแบบเว็บไซต์แหล่งเรียนรู้ที่ประยุกต์กับรายวิชาอื่นได้

──────────────────────────────────────────
บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง

2.1 หลักสูตรและสาระเทคโนโลยี
การจัดการเรียนรู้ยึดมาตรฐานและตัวชี้วัดของกลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี เน้นการคิดเชิงคำนวณ การแก้ปัญหาอย่างเป็นขั้นตอน การจัดการข้อมูล การสร้างชิ้นงาน และการใช้เทคโนโลยีอย่างปลอดภัย เนื้อหา งาน และการประเมินในเว็บไซต์ต้องเชื่อมโยงย้อนกลับไปยังตัวชี้วัด เพื่อให้คะแนนที่เกิดขึ้นมีความหมายทางการเรียนรู้

2.2 การเรียนการสอนผ่านเว็บ (Web-Based Instruction)
WBI เป็นการจัดประสบการณ์เรียนรู้ผ่านเครือข่าย โดยผู้เรียนเข้าถึงเนื้อหา กิจกรรม การสื่อสาร และการประเมินได้ตามเวลาและอุปกรณ์ที่เหมาะสม องค์ประกอบสำคัญของระบบนี้ ได้แก่ เนื้อหาที่แบ่งเป็นหน่วยสั้นและชัดเจน สื่อหลายรูปแบบ การฝึกปฏิบัติ ข้อมูลย้อนกลับทันที การติดตามความก้าวหน้า และช่องทางที่ครูใช้มอบหมายงานหรือช่วยเหลือรายบุคคล

2.3 เกมมิฟิเคชันและแรงจูงใจในการเรียน
เกมมิฟิเคชันคือการนำองค์ประกอบจากเกมมาใช้ในบริบทที่ไม่ใช่เกม ระบบใช้ XP ระดับ ความต่อเนื่อง เหรียญ ภารกิจ และรางวัลเพื่อทำให้เป้าหมายระยะสั้นมองเห็นได้ อย่างไรก็ตาม คะแนนเกมเป็นเพียงแรงเสริม การออกแบบที่เหมาะสมต้องให้รางวัลกับพฤติกรรมการเรียนรู้ที่มีคุณภาพ เช่น การทำแบบฝึกหัดจนสำเร็จ การแก้ไขข้อผิดพลาด และการเรียนในคาบ ไม่ใช่ให้รางวัลจากเวลาที่เปิดหน้าเว็บเพียงอย่างเดียว

2.4 กระบวนการพัฒนาแบบ ADDIE
ADDIE Model ประกอบด้วย 5 ขั้น ได้แก่ (1) Analysis วิเคราะห์ผู้เรียน ตัวชี้วัด ปัญหา และข้อจำกัด (2) Design กำหนดผลลัพธ์ โครงบทเรียน กิจกรรม และวิธีประเมิน (3) Development สร้างและตรวจสอบเว็บไซต์ สื่อ เกม และแบบทดสอบ (4) Implementation นำไปใช้จริงในชั้นเรียนพร้อมเก็บหลักฐาน และ (5) Evaluation ประเมินระหว่างพัฒนาและหลังใช้เพื่อนำผลกลับไปปรับปรุง

2.5 การวัดผลตามกรอบ K/P/A
K วัดความรู้และความเข้าใจจากแบบทดสอบ คำถาม และงานที่ต้องอธิบายเหตุผล P วัดการลงมือปฏิบัติจากชิ้นงาน ขั้นตอนการทำงาน การใช้เครื่องมือ และรูบริก A วัดความรับผิดชอบ ความพยายาม ความสม่ำเสมอ และการใช้เทคโนโลยีอย่างเหมาะสม คะแนนแต่ละด้านต้องมีหลักฐาน ระบุคะแนนเต็ม และไม่เกินน้ำหนักที่กำหนด

2.6 การมีส่วนร่วมและข้อมูลร่องรอยการเรียนรู้
ข้อมูลการเข้าใช้ จำนวนกิจกรรม แบบทดสอบ สไลด์ และความต่อเนื่องช่วยสะท้อนโอกาสในการเรียนรู้ แต่ไม่ควรตีความว่าเป็นความสามารถโดยตรง การวิจัยจึงพิจารณาข้อมูลพฤติกรรมร่วมกับผล K/P/A และผลงานของผู้เรียน

2.7 การสังเคราะห์งานวิจัยที่เกี่ยวข้อง
แนวโน้มจากงานวิจัยด้าน WBI และเกมมิฟิเคชันชี้ว่า ผลลัพธ์ขึ้นกับความสอดคล้องระหว่างเป้าหมาย เนื้อหา กิจกรรม ข้อมูลย้อนกลับ และบริบทของผู้เรียน ผู้วิจัยจึงไม่สรุปว่าเกมทำให้คะแนนสูงขึ้นโดยลำพัง แต่ตรวจทั้งผลสัมฤทธิ์ การมีส่วนร่วม และข้อจำกัดที่พบระหว่างใช้จริง

2.8 กรอบแนวคิดการวิจัย
ปัจจัยนำเข้า: ผู้เรียน ตัวชี้วัด เนื้อหา อุปกรณ์ และเวลาเรียน
กระบวนการ: WBI ที่พัฒนาด้วย ADDIE + กิจกรรม/เกมมิฟิเคชัน + ข้อมูลย้อนกลับของครู
ผลผลิต: ผลสัมฤทธิ์ K/P/A การมีส่วนร่วม และความพึงพอใจ
ข้อมูลย้อนกลับ: ผลรายตัวชี้วัดและบันทึกหลังสอนถูกใช้ปรับบทเรียนในรอบถัดไป

──────────────────────────────────────────
บทที่ 3 วิธีดำเนินการวิจัย

3.1 รูปแบบการวิจัย
เป็นการวิจัยในชั้นเรียนร่วมกับการพัฒนาสื่อการเรียนการสอนตาม ADDIE Model ใช้ข้อมูลแบบผสมจากคะแนนผลสัมฤทธิ์ ร่องรอยการใช้เว็บไซต์ และความคิดเห็นของผู้เรียน การรายงานผลเป็นสถิติบรรยายและการเปรียบเทียบก่อน-หลังจากคู่คะแนนที่ระบบมีอยู่ โดยไม่อ้างความเป็นเหตุเป็นผลเกินกว่ารูปแบบการวิจัยที่ใช้

3.2 ประชากรและกลุ่มข้อมูล
ประชากรคือ นักเรียน${meta.classroomLabel} ${meta.school} ปีการศึกษา ${meta.academicYear} ตามบัญชีรายชื่อ ${d.populationSize} คน (${d.classroomsUsed.join(', ')}) ข้อมูลผลสัมฤทธิ์ที่วิเคราะห์มาจากนักเรียนซึ่งมีคะแนนอย่างน้อยหนึ่งรายการ ${d.n} คน รวม ${d.scoreRecords} ระเบียนผลการเรียน ส่วนข้อมูลการมีส่วนร่วมมาจากผู้เข้าใช้ระบบ ${d.activeStudents} คน

เกณฑ์นำข้อมูลเข้า: เป็นนักเรียนในบัญชีรายชื่อของชั้นที่เลือกและมีหลักฐานการเรียนหรือการประเมินในช่วงศึกษา เกณฑ์ตัดออก: รหัสทดสอบ บัญชีครู ผู้ใช้นอกโรงเรียน และระเบียนที่ไม่มีคะแนนหรือไม่สามารถเชื่อมกับบัญชีรายชื่อได้

3.3 ตัวแปรที่ศึกษา
1) ตัวแปรจัดกระทำ: การเรียนการสอนผ่านเว็บร่วมกับเกมมิฟิเคชันที่พัฒนาด้วย ADDIE Model
2) ตัวแปรผล: คะแนน K/P/A คะแนนสอบ ผลรายตัวชี้วัด การมีส่วนร่วม และความพึงพอใจ
3) ข้อมูลบริบท: ชั้นเรียน จำนวนครั้งที่เข้าใช้ กิจกรรมที่ทำ และความครบถ้วนของข้อมูล

3.4 เครื่องมือที่ใช้ในการวิจัย
1) เว็บไซต์เรียนการสอนวิชาวิทยาการคำนวณ พัฒนาด้วย ADDIE Model บูรณาการกลไกเกมมิฟิเคชัน
2) แบบวัดผลสัมฤทธิ์แบบ K/P/A ต่อตัวชี้วัด (คะแนนเก็บ 70) + สอบปลายภาค (30)
3) แบบทดสอบก่อน/หลังและแบบฝึกหัดที่เชื่อมกับหน่วยเรียน
4) แบบประเมินชิ้นงาน/การปฏิบัติด้วยรูบริก
5) แบบสอบถามความพึงพอใจแบบมาตราส่วนประมาณค่า 5 ระดับ
6) แบบบันทึกหลังสอนและบันทึกเหตุการณ์จากเว็บไซต์

3.4.1 กลไกเกมมิฟิเคชันที่ออกแบบในระบบ
- คะแนนประสบการณ์ (XP): ทำแบบทดสอบ +10/คะแนน, เล่นเกม/ใช้สื่อ +5, อ่านสไลด์ +1
- ระดับและยศ (Level & Title): เลื่อนระดับตาม XP สะสม พร้อมยศ 8 ขั้น (ผู้เริ่มต้น → ตำนาน)
- ความต่อเนื่องรายวัน (Streak): กระตุ้นการเข้าเรียนสม่ำเสมอ
- เหรียญตรา (Achievement Badges): ปลดล็อกเมื่อทำเป้าหมายสำเร็จ
- กระดานอันดับ (Leaderboard): จัดอันดับด้วยคะแนนถ่วงน้ำหนัก
- รางวัลจากครู (Bonus) และคำถามประจำวัน (Daily Question) เพื่อเสริมแรงจูงใจ

3.5 การตรวจสอบคุณภาพเครื่องมือ
ตรวจความสอดคล้องระหว่างตัวชี้วัด จุดประสงค์ กิจกรรม และข้อคำถามด้วยตารางเชื่อมโยงหลักสูตร ทดลองใช้กับผู้เรียนกลุ่มเล็กเพื่อตรวจภาษา เวลา ความยาก และข้อผิดพลาดของระบบ ก่อนจัดทำรายงานฉบับสมบูรณ์ ผู้วิจัยต้องแนบผลตรวจจากผู้เชี่ยวชาญ ค่าความตรง/ความเชื่อมั่น หรือหลักฐานการทดลองใช้ตามที่ดำเนินการจริง ระบบจะไม่สร้างค่าคุณภาพเครื่องมือที่ไม่มีหลักฐาน

3.6 ขั้นตอนการดำเนินงานตาม ADDIE
1) Analysis: วิเคราะห์มาตรฐาน ตัวชี้วัด ผู้เรียน อุปกรณ์ เครือข่าย และผลการเรียนเดิม
2) Design: กำหนดจุดประสงค์ โครงหน่วย แผนรายชั่วโมง หลักฐาน K/P/A เกณฑ์ผ่าน และข้อมูลย้อนกลับ
3) Development: สร้างสไลด์ เกม แบบฝึก แบบทดสอบ ใบงานลิงก์ และระบบบันทึกคะแนน แล้วตรวจความถูกต้องก่อนใช้
4) Implementation: จัดการเรียนในคาบตามแผน เช็กชื่อ เปิดบทเรียน ให้ผู้เรียนทำกิจกรรมและเก็บหลักฐาน พร้อมช่วยเหลือผู้เรียนที่ต้องการเวลาเพิ่ม
5) Evaluation: ประเมินระหว่างเรียน หลังเรียน ความพึงพอใจ และบันทึกหลังสอน แล้วปรับเนื้อหา/กิจกรรมในรอบถัดไป

3.7 การเก็บรวบรวมข้อมูล
ก่อนเรียน ชี้แจงวัตถุประสงค์และเก็บข้อมูลพื้นฐาน/คะแนนครั้งแรก ระหว่างเรียน ระบบบันทึกกิจกรรมและครูประเมินชิ้นงานตามรูบริก หลังเรียน เก็บคะแนนหลังเรียน ผล K/P/A ความพึงพอใจ และบันทึกหลังสอน จากนั้นตรวจชื่อซ้ำ รหัสทดสอบ ข้อมูลขาด และความสอดคล้องระหว่างห้องเรียนกับรายวิชาก่อนวิเคราะห์

3.8 การวิเคราะห์ข้อมูล
1) ค่าเฉลี่ย ใช้อธิบายระดับคะแนนและพฤติกรรมโดยรวม
2) ส่วนเบี่ยงเบนมาตรฐานแบบตัวอย่าง ใช้อธิบายการกระจายของคะแนน
3) ร้อยละ ใช้อธิบายอัตราผ่าน การเข้าใช้ และผลรายตัวชี้วัด
4) E1/E2 ใช้คะแนนระหว่างเรียนเทียบคะแนนเต็ม และคะแนนหลังเรียน/สอบเทียบคะแนนเต็ม
5) Learning Gain คำนวณจากคะแนนหลังเรียนลบคะแนนก่อนเรียนของคู่ข้อมูลเดียวกัน

3.9 การคุ้มครองข้อมูลผู้เรียน
รายงานผลในภาพรวม ใช้รหัสแทนชื่อเมื่อวิเคราะห์รายบุคคล จำกัดสิทธิ์เข้าถึงข้อมูลให้เฉพาะผู้เกี่ยวข้อง ไม่แสดงคะแนนหรือข้อมูลส่วนบุคคลต่อสาธารณะ และเก็บข้อมูลเท่าที่จำเป็นต่อการเรียนการสอนและการวิจัยในชั้นเรียน

──────────────────────────────────────────
บทที่ 4 ผลการวิจัย

4.1 ผลสัมฤทธิ์ทางการเรียน (จากข้อมูลจริงในระบบ)
- จำนวนนักเรียนที่มีคะแนน: ${d.n} คน จากบัญชีรายชื่อ ${d.populationSize} คน
- จำนวนระเบียนผลการเรียนที่ใช้คำนวณ: ${d.scoreRecords} ระเบียน
- คะแนนเฉลี่ยรวม: ${d.achievementMean100.toFixed(2)} / 100 (S.D. = ${d.achievementSD.toFixed(2)})
- เทียบสเกล 25 คะแนน: ${d.achievementMean25.toFixed(2)} / 25 → ระดับ "${d.achievementLevel}"
- อัตราผ่านเกณฑ์ (≥ ร้อยละ 50): ร้อยละ ${d.passRate.toFixed(1)}
- คะแนนเฉลี่ยแยกองค์ประกอบ: K = ${d.kMean.toFixed(2)}, P = ${d.pMean.toFixed(2)}, A = ${d.aMean.toFixed(2)}, สอบ = ${d.examMean.toFixed(2)}
- การกระจายเกรด: ${gradeLines}

4.1.1 ผลสัมฤทธิ์รายจุดประสงค์การเรียนรู้ (จำแนกตามตัวชี้วัด)
${objLines}

4.2 ผลด้านการมีส่วนร่วมจากกลไกเกมมิฟิเคชัน (จากข้อมูลจริงในระบบ)
- จำนวนนักเรียนที่เข้าใช้ระบบ: ${d.activeStudents} คน (Engagement Rate ร้อยละ ${d.engagementRate.toFixed(1)})
- คะแนนประสบการณ์ (XP) เฉลี่ย: ${d.avgXp.toFixed(0)} ต่อคน
- ระดับ (Level) เฉลี่ย: ${d.avgLevel.toFixed(1)} (สูงสุด Level ${d.maxLevel})
- เข้าเรียนต่อเนื่อง (Streak) เฉลี่ย: ${d.avgStreak.toFixed(1)} วัน
- กิจกรรม/สื่อที่ใช้เฉลี่ย: ${d.avgActivities.toFixed(1)} รายการ/คน
- ทำแบบทดสอบเฉลี่ย: ${d.avgQuizzes.toFixed(1)} ครั้ง/คน • อ่านสไลด์เฉลี่ย: ${d.avgSlides.toFixed(1)} หน้า/คน

4.3 ประสิทธิภาพของบทเรียน (E1/E2)
- E1 (ประสิทธิภาพระหว่างเรียน — คะแนนเก็บ): ร้อยละ ${d.e1.toFixed(2)}
- E2 (ประสิทธิภาพหลังเรียน — คะแนนสอบ): ร้อยละ ${d.e2.toFixed(2)}
- สรุปประสิทธิภาพ E1/E2 = ${d.e1.toFixed(2)}/${d.e2.toFixed(2)} ${(d.e1 >= 80 && d.e2 >= 80) ? '(ผ่านเกณฑ์มาตรฐาน 80/80)' : '(เทียบเกณฑ์มาตรฐาน 80/80)'}

4.4 ผลการเปรียบเทียบก่อน-หลังเรียน (Pre-test / Post-test)
คำนวณจากประวัติการทำแบบทดสอบ (ครั้งแรก = ก่อนเรียนรู้, ครั้งดีที่สุด = หลังเรียนรู้) จำนวน ${d.prePostN} คู่คะแนน
- คะแนนเฉลี่ยก่อนเรียน (Pre): ร้อยละ ${d.preMean.toFixed(2)}
- คะแนนเฉลี่ยหลังเรียน (Post): ร้อยละ ${d.postMean.toFixed(2)}
- ผลการเรียนรู้ที่เพิ่มขึ้น (Learning Gain): ร้อยละ ${d.learningGain.toFixed(2)} ${d.learningGain > 0 ? '(สูงขึ้น)' : ''}

4.5 ความพึงพอใจของนักเรียน ${satSource}
ความพึงพอใจโดยรวมอยู่ในระดับ "${satisfactionLevel(sat)}" (ค่าเฉลี่ย ${satStr})${perQLines ? '\nรายข้อ:\n' + perQLines : ''}

──────────────────────────────────────────
บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ

5.1 สรุปผล
การพัฒนาการเรียนการสอนผ่านเว็บด้วย ADDIE Model ทำให้ได้ระบบที่รวมบทเรียน สไลด์ เกม แบบฝึก งาน และแบบทดสอบไว้ในเส้นทางเรียนเดียวกัน ผู้เรียนที่มีข้อมูลคะแนน ${d.n} คน มีผลสัมฤทธิ์เฉลี่ยอยู่ในระดับ "${d.achievementLevel}" (${d.achievementMean25.toFixed(2)}/25) อัตราผ่านร้อยละ ${d.passRate.toFixed(1)} ผู้เข้าใช้ระบบมี ${d.activeStudents} คน คิดเป็นร้อยละ ${d.engagementRate.toFixed(1)} ของบัญชีรายชื่อ และความพึงพอใจอยู่ในระดับ "${satisfactionLevel(sat)}"

5.2 อภิปรายผล
ผลสัมฤทธิ์และการมีส่วนร่วมควรพิจารณาร่วมกัน ผู้เรียนได้รับข้อมูลย้อนกลับจากแบบทดสอบและเห็นความก้าวหน้าของตนผ่าน XP ระดับ และภารกิจ จึงมีเป้าหมายระยะสั้นระหว่างเรียน ขณะเดียวกัน WBI เปิดโอกาสให้ทบทวนซ้ำและทำกิจกรรมตามความพร้อม กลไกเหล่านี้อาจช่วยส่งเสริมความสม่ำเสมอ แต่ข้อมูลการเข้าใช้เพียงอย่างเดียวไม่ยืนยันว่าเกิดความเข้าใจ จึงต้องใช้คะแนน K ผลงาน P พฤติกรรม A และบันทึกของครูประกอบกัน

ผลรายตัวชี้วัดช่วยให้เห็นจุดที่ควรซ่อมเสริมได้ชัดกว่าคะแนนรวม หากตัวชี้วัดใดมีคะแนนต่ำ ครูควรตรวจทั้งความยากของเนื้อหา ความชัดของคำสั่ง เวลา อุปกรณ์ และโอกาสฝึกปฏิบัติ ก่อนสรุปว่าเป็นข้อจำกัดของผู้เรียน สำหรับค่า Learning Gain ต้องตีความตามวิธีเก็บข้อมูล เนื่องจากระบบใช้ครั้งแรกและครั้งดีที่สุดของหน่วยเป็นตัวแทนก่อน-หลัง มิใช่การสุ่มกลุ่มทดลอง

5.3 ข้อจำกัดของการวิจัย
1) ข้อมูลเกิดจากชั้นเรียนของสถานศึกษาเดียวและไม่มีการสุ่มกลุ่ม จึงไม่ควรอ้างอิงครอบคลุมผู้เรียนทุกบริบท
2) ความครบถ้วนของผลขึ้นกับการบันทึกคะแนน การเชื่อมบัญชี และการใช้ระบบจริงของผู้เรียน
3) คะแนนก่อน-หลังจากประวัติแบบทดสอบอาจได้รับอิทธิพลจากจำนวนครั้งที่ทำไม่เท่ากัน
4) ถ้ายังไม่มีผลตรวจคุณภาพเครื่องมือหรือแบบสอบถามครบถ้วน ต้องระบุเป็นข้อจำกัดและไม่เติมค่าประมาณแทนข้อมูลจริง

5.4 ข้อเสนอแนะในการนำผลไปใช้
1) ใช้ผลรายตัวชี้วัดวางแผนซ่อมเสริมและจัดกลุ่มช่วยเหลือ แทนการพิจารณาเฉพาะคะแนนรวม
2) กำหนดหลักฐาน K/P/A และคะแนนเต็มก่อนเริ่มแต่ละหน่วย พร้อมใช้รูบริกเดียวกันกับผู้เรียนทุกคน
3) ให้น้ำหนักกิจกรรมในคาบมากกว่านอกคาบ และจำกัดคะแนนอัตโนมัติไม่ให้เกินเกณฑ์รายวิชา
4) ตรวจข้อมูลรหัสทดสอบ ผู้ใช้นอกโรงเรียน และระเบียนซ้ำก่อนสรุปผลทุกครั้ง

5.5 ข้อเสนอแนะสำหรับการวิจัยครั้งต่อไป
1) ใช้แบบทดสอบก่อน-หลังชุดเทียบเคียงและกำหนดช่วงเวลาทดสอบเดียวกัน
2) เพิ่มการวิเคราะห์รายกลุ่มตามระดับความพร้อม โดยไม่เปิดเผยตัวตนของผู้เรียน
3) ศึกษาความสัมพันธ์ระหว่าง XP, Streak, คุณภาพชิ้นงาน และผลสัมฤทธิ์ โดยควบคุมจำนวนครั้งในการฝึก
4) เปรียบเทียบรูปแบบ WBI ร่วมกับห้องเรียนกลับด้านหรือการเรียนรู้แบบโครงงาน

──────────────────────────────────────────
รายการอ้างอิงและภาคผนวกที่ต้องแนบก่อนส่ง
- เอกสารหลักสูตร/ตัวชี้วัดที่ใช้จริง และรายการอ้างอิงด้าน WBI เกมมิฟิเคชัน และ ADDIE ตามรูปแบบอ้างอิงของสถานศึกษา
- ตารางเชื่อมโยงตัวชี้วัด จุดประสงค์ กิจกรรม เครื่องมือ และคะแนน K/P/A
- แผนการจัดการเรียนรู้ เครื่องมือวิจัย แบบทดสอบ รูบริก แบบสอบถาม และผลตรวจคุณภาพเครื่องมือ
- ตารางข้อมูลสรุปแบบไม่ระบุตัวตน ภาพหน้าจอระบบ และตัวอย่างผลงานที่ได้รับอนุญาต

──────────────────────────────────────────
หมายเหตุ: ตัวเลขผลสัมฤทธิ์ในบทที่ 4 คำนวณจากข้อมูลจริงในระบบ ณ วันที่ ${new Date().toLocaleDateString('th-TH')} — เมื่อครูกรอกคะแนน/นักเรียนใช้งานเพิ่ม ตัวเลขจะเปลี่ยนตาม`;
};
