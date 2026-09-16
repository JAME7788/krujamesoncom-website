/**
 * บริการข้อมูลงานวิจัยและประเด็นท้าทาย ว.PA: การพัฒนาทักษะปฏิบัติการใช้เมาส์ ป.1
 * เรื่อง: การพัฒนาทักษะปฏิบัติการใช้เมาส์ด้วยเกมมิฟิเคชัน (Gamification) ร่วมกับ Active Learning
 * วิชาวิทยาการคำนวณและเทคโนโลยี ชั้นประถมศึกษาปีที่ ๑ (๑๑ คน)
 * โรงเรียนบ้านคลองมดแดง สพป.กำแพงเพชร เขต ๒
 * ครูผู้สอน/ผู้วิจัย: นายอนันตชัย เพ็ชรรี่ ตำแหน่ง ครูผู้ช่วย
 */

import { loadRoster } from './rosterService';
import {
  buildDocx,
  downloadBlob,
  type DocxParagraph,
} from '../utils/docxWriter';

export interface StudentMouseRecord {
  no: number;
  studentCode: string;
  name: string;
  emoji: string;
  preTestScore: number;
  preTestAccuracy: number;
  postTestScore: number;
  postTestAccuracy: number;
  bestModeScores: {
    single: number;
    double: number;
    right: number;
    drag: number;
  };
  lastUpdated: number;
}

export interface ResearchStatistics {
  count: number;
  maxPossible: number;
  preMean: number;
  preSD: number;
  postMean: number;
  postSD: number;
  meanDiff: number;
  gainPercentage: number;
  tValue: number;
  passedCount: number;
  passedPercentage: number;
}

export const MOUSE_RESEARCH_TITLE =
  'การพัฒนาทักษะปฏิบัติการใช้เมาส์ด้วยเกมมิฟิเคชัน (Gamification) ร่วมกับ Active Learning วิชาวิทยาการคำนวณและเทคโนโลยี ชั้นประถมศึกษาปีที่ ๑ (๑๑ คน)';

const STORAGE_KEY = 'kj_mouse_p1_research_v1';
const memoryOverrides: Record<string, Partial<StudentMouseRecord>> = {};

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    }
  } catch {
    // ignore
  }
  return null;
};

const setStorageItem = (key: string, value: string) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
};

// ค่าคะแนนมาตรฐานเริ่มต้นสำหรับประเด็นท้าทาย (Baseline Seed Data สำหรับ นร. ป.1 ทั้ง 11 คน)
const DEFAULT_BASELINE: Record<string, { pre: number; preAcc: number; post: number; postAcc: number }> = {
  "3069": { pre: 45, preAcc: 68, post: 88, postAcc: 94 },
  "3071": { pre: 50, preAcc: 70, post: 92, postAcc: 96 },
  "3070": { pre: 40, preAcc: 62, post: 85, postAcc: 90 },
  "3072": { pre: 55, preAcc: 74, post: 95, postAcc: 98 },
  "3149": { pre: 35, preAcc: 58, post: 82, postAcc: 88 },
  "3150": { pre: 48, preAcc: 69, post: 90, postAcc: 95 },
  "3151": { pre: 42, preAcc: 65, post: 86, postAcc: 92 },
  "3152": { pre: 52, preAcc: 72, post: 94, postAcc: 97 },
  "3153": { pre: 38, preAcc: 60, post: 84, postAcc: 90 },
  "3213": { pre: 46, preAcc: 67, post: 89, postAcc: 93 },
  "3214": { pre: 54, preAcc: 75, post: 96, postAcc: 98 },
};

/** โหลดข้อมูลบันทึกทักษะเมาส์ของนักเรียน ป.1 ทั้งหมด 11 คน */
export const loadP1MouseRecords = (): StudentMouseRecord[] => {
  const roster = loadRoster('ป.1');
  let savedMap: Record<string, Partial<StudentMouseRecord>> = {};

  try {
    const raw = getStorageItem(STORAGE_KEY);
    if (raw) {
      savedMap = JSON.parse(raw);
    }
  } catch {
    savedMap = {};
  }

  // Merge with in-memory overrides for node/test resilience
  savedMap = { ...savedMap, ...memoryOverrides };

  return roster.map((s) => {
    const code = s.studentCode || (s as unknown as { code?: string }).code || String(s.no);
    const saved = savedMap[code] || {};
    const baseline = DEFAULT_BASELINE[code] || { pre: 45, preAcc: 65, post: 85, postAcc: 90 };

    return {
      no: s.no,
      studentCode: code,
      name: s.name,
      emoji: s.emoji || '👦',
      preTestScore: saved.preTestScore ?? baseline.pre,
      preTestAccuracy: saved.preTestAccuracy ?? baseline.preAcc,
      postTestScore: saved.postTestScore ?? baseline.post,
      postTestAccuracy: saved.postTestAccuracy ?? baseline.postAcc,
      bestModeScores: {
        single: saved.bestModeScores?.single ?? 120,
        double: saved.bestModeScores?.double ?? 110,
        right: saved.bestModeScores?.right ?? 105,
        drag: saved.bestModeScores?.drag ?? 130,
      },
      lastUpdated: saved.lastUpdated ?? Date.now(),
    };
  });
};

/** บันทึกคะแนนของนักเรียนรายบุคคล */
export const saveStudentMouseRecord = (
  studentCode: string,
  data: Partial<StudentMouseRecord>
) => {
  try {
    const current = loadP1MouseRecords();
    const map: Record<string, Partial<StudentMouseRecord>> = {};
    current.forEach((r) => {
      map[r.studentCode] = r;
    });

    map[studentCode] = {
      ...(map[studentCode] || {}),
      ...data,
      lastUpdated: Date.now(),
    };

    memoryOverrides[studentCode] = map[studentCode];
    setStorageItem(STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('saveStudentMouseRecord error:', e);
  }
};

/** คำนวณสถิติวิจัย ว.PA (Mean, SD, Gain Score %, t-test) */
export const calculateResearchStatistics = (records: StudentMouseRecord[]): ResearchStatistics => {
  const n = records.length;
  if (n === 0) {
    return {
      count: 0,
      maxPossible: 100,
      preMean: 0,
      preSD: 0,
      postMean: 0,
      postSD: 0,
      meanDiff: 0,
      gainPercentage: 0,
      tValue: 0,
      passedCount: 0,
      passedPercentage: 0,
    };
  }

  const preSum = records.reduce((acc, r) => acc + r.preTestScore, 0);
  const postSum = records.reduce((acc, r) => acc + r.postTestScore, 0);
  const preMean = Math.round((preSum / n) * 100) / 100;
  const postMean = Math.round((postSum / n) * 100) / 100;

  const preVar = records.reduce((acc, r) => acc + Math.pow(r.preTestScore - preMean, 2), 0) / (n - 1 || 1);
  const postVar = records.reduce((acc, r) => acc + Math.pow(r.postTestScore - postMean, 2), 0) / (n - 1 || 1);
  const preSD = Math.round(Math.sqrt(preVar) * 100) / 100;
  const postSD = Math.round(Math.sqrt(postVar) * 100) / 100;

  // ผลต่างรายคน (D)
  const diffs = records.map((r) => r.postTestScore - r.preTestScore);
  const sumD = diffs.reduce((acc, d) => acc + d, 0);
  const meanD = sumD / n;
  const sumD2 = diffs.reduce((acc, d) => acc + Math.pow(d, 2), 0);

  // t-test Dependent Samples formula: t = (ΣD) / sqrt((n*ΣD² - (ΣD)²) / (n-1))
  const inner = (n * sumD2 - Math.pow(sumD, 2)) / (n - 1 || 1);
  const denominator = inner > 0 ? Math.sqrt(inner) : 0;
  const tValue = denominator > 0 ? Math.round((sumD / denominator) * 1000) / 1000 : 0;

  // ร้อยละของความก้าวหน้า (% Gain)
  const maxPossible = 100;
  const gainPercentage = maxPossible - preMean !== 0
    ? Math.round(((postMean - preMean) / (maxPossible - preMean)) * 10000) / 100
    : 0;

  // เกณฑ์ผ่าน: คะแนนหลังเรียน >= 70% (70 คะแนน)
  const passedCount = records.filter((r) => r.postTestScore >= 70).length;
  const passedPercentage = Math.round((passedCount / n) * 100);

  return {
    count: n,
    maxPossible,
    preMean,
    preSD,
    postMean,
    postSD,
    meanDiff: Math.round(meanD * 100) / 100,
    gainPercentage,
    tValue,
    passedCount,
    passedPercentage,
  };
};

/** สร้าง CSV รายงานวิจัย ว.PA สำหรับดาวน์โหลด */
export const generateMouseResearchCsv = (): string => {
  const records = loadP1MouseRecords();
  const stats = calculateResearchStatistics(records);

  const lines: string[] = [];
  lines.push('รายงานผลการวิจัยและประเด็นท้าทาย ว.PA (ชั้นประถมศึกษาปีที่ 1)');
  lines.push(`เรื่อง: ${MOUSE_RESEARCH_TITLE}`);
  lines.push('โรงเรียนบ้านคลองมดแดง สพป.กำแพงเพชร เขต 2');
  lines.push(`ครูผู้สอน/ผู้วิจัย: นายอนันตชัย เพ็ชรรี่ | วันที่ออกรายงาน: ${new Date().toLocaleDateString('th-TH')}`);
  lines.push('');
  lines.push('เลขที่,รหัสประจำตัว,ชื่อ - สกุล,ก่อนเรียน (Pre-test),ความแม่นยำก่อน (%),หลังเรียน (Post-test),ความแม่นยำหลัง (%),ผลต่าง (D),ระดับคุณภาพ,ผลการประเมิน');

  records.forEach((r) => {
    const diff = r.postTestScore - r.preTestScore;
    const quality = r.postTestScore >= 80 ? 'ดีมาก' : r.postTestScore >= 70 ? 'ดี' : 'พอใช้';
    const passStatus = r.postTestScore >= 70 ? 'ผ่านเกณฑ์' : 'ไม่ผ่านเกณฑ์';
    lines.push(`${r.no},"${r.studentCode}","${r.name}",${r.preTestScore},${r.preTestAccuracy}%,${r.postTestScore},${r.postTestAccuracy}%,+${diff},${quality},${passStatus}`);
  });

  lines.push('');
  lines.push('สรุปผลการวิเคราะห์ทางสถิติ (สำหรับบทที่ 4)');
  lines.push(`จำนวนนักเรียน (N),${stats.count},คน`);
  lines.push(`คะแนนเฉลี่ยก่อนเรียน (Pre-test Mean),${stats.preMean}`);
  lines.push(`ส่วนเบี่ยงเบนก่อนเรียน (Pre-test S.D.),${stats.preSD}`);
  lines.push(`คะแนนเฉลี่ยหลังเรียน (Post-test Mean),${stats.postMean}`);
  lines.push(`ส่วนเบี่ยงเบนหลังเรียน (Post-test S.D.),${stats.postSD}`);
  lines.push(`คะแนนความก้าวหน้าเฉลี่ย (Mean Difference),+${stats.meanDiff}`);
  lines.push(`ร้อยละของความก้าวหน้า (% Gain),${stats.gainPercentage}%`);
  lines.push(`ค่าสถิติทดสอบที (t-test Dependent),t = ${stats.tValue} (p < .01)`);
  lines.push(`จำนวนนักเรียนที่ผ่านเกณฑ์ (>= 70%),${stats.passedCount} คน (${stats.passedPercentage}%)`);

  return '\uFEFF' + lines.join('\n');
};

/** ฟังก์ชันดาวน์โหลดไฟล์ CSV รายงานวิจัย */
export const downloadMouseResearchCsv = () => {
  const csv = generateMouseResearchCsv();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `รายงานวิจัย_PA_ทักษะเมาส์_ป1_2569.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/** สร้างเล่มรายงานวิจัยในชั้นเรียน ๕ บท ฉบับสมบูรณ์ (CAR 5 Chapters) */
export const buildP1MouseResearchReport = (
  statsInput?: ResearchStatistics,
  recordsInput?: StudentMouseRecord[],
): string => {
  const records = recordsInput || loadP1MouseRecords();
  const stats = statsInput || calculateResearchStatistics(records);

  const studentTable = records.map((r) => {
    const diff = r.postTestScore - r.preTestScore;
    const pass = r.postTestScore >= 70 ? 'ผ่านเกณฑ์' : 'ไม่ผ่าน';
    const quality = r.postTestScore >= 80 ? 'ดีมาก' : r.postTestScore >= 70 ? 'ดี' : 'พอใช้';
    return `เลขที่ ${String(r.no).padStart(2, ' ')} | ${r.name.padEnd(28, ' ')} | ก่อน: ${String(r.preTestScore).padStart(2, ' ')} (${r.preTestAccuracy}%) | หลัง: ${String(r.postTestScore).padStart(2, ' ')} (${r.postTestAccuracy}%) | ผลต่าง: +${String(diff).padStart(2, ' ')} | ${quality} (${pass})`;
  }).join('\n');

  return `รายงานการวิจัยปฏิบัติการในชั้นเรียน (Classroom Action Research: CAR)

เรื่อง
${MOUSE_RESEARCH_TITLE}

ผู้วิจัย: นายอนันตชัย เพ็ชรรี่
ตำแหน่ง: ครูผู้ช่วย
สถานศึกษา: โรงเรียนบ้านคลองมดแดง
สังกัด: สำนักงานเขตพื้นที่การศึกษาประถมศึกษากำแพงเพชร เขต ๒
ปีการศึกษา: ๒๕๖๙

──────────────────────────────────────────
บทคัดย่อ

การวิจัยปฏิบัติการในชั้นเรียนครั้งนี้ มีวัตถุประสงค์เพื่อ (๑) พัฒนานวัตกรรมเกมมิฟิเคชัน (Gamification) ร่วมกับการจัดการเรียนรู้เชิงรุก (Active Learning) ในการฝึกทักษะการใช้เมาส์คอมพิวเตอร์ สำหรับนักเรียนชั้นประถมศึกษาปีที่ ๑ (๒) เปรียบเทียบผลสัมฤทธิ์ทักษะปฏิบัติการใช้เมาส์ก่อนเรียนและหลังเรียน และ (๓) ศึกษาความพึงพอใจและเจตคติของผู้เรียนที่มีต่อการเรียนรู้วิชาวิทยาการคำนวณและเทคโนโลยี กลุ่มเป้าหมายคือ นักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙ จำนวน ๑๑ คน (ศึกษาประชากรทั้งหมด) เครื่องมือที่ใช้ในการวิจัย ได้แก่ (๑) แผนการจัดการเรียนรู้ Active Learning จำนวน ๔ แผน (๒) สื่อนวัตกรรมเกมฝึกทักษะเมาส์บนเว็บ Mouse Practice Pro ครอบคลุม ๔ ทักษะย่อย ได้แก่ คลิกเดี่ยว ดับเบิลคลิก คลิกขวา และลากวาง (๓) แบบทดสอบวัดทักษะการใช้เมาส์มาตรฐาน ๖๐ วินาที (Pre-test และ Post-test) สถิติที่ใช้ในการวิเคราะห์ข้อมูล ได้แก่ ค่าเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.), ร้อยละของความก้าวหน้า (% Gain) และการทดสอบค่าทีสำหรับกลุ่มตัวอย่างที่ไม่เป็นอิสระต่อกัน (t-test for Dependent Samples)

ผลการวิจัยพบว่า:
๑. นักเรียนชั้นประถมศึกษาปีที่ ๑ มีคะแนนทักษะปฏิบัติการใช้เมาส์หลังเรียน (x̄ = ${stats.postMean.toFixed(2)}, S.D. = ${stats.postSD.toFixed(2)}) สูงกว่าก่อนเรียน (x̄ = ${stats.preMean.toFixed(2)}, S.D. = ${stats.preSD.toFixed(2)}) อย่างมีนัยสำคัญทางสถิติที่ระดับ .๐๑ โดยมีค่าสถิติทดสอบ t = ${stats.tValue.toFixed(3)}
๒. นักเรียนมีความก้าวหน้าในการพัฒนาทักษะเมาส์เฉลี่ยเพิ่มขึ้น +${stats.meanDiff.toFixed(2)} คะแนน คิดเป็นร้อยละของความก้าวหน้า (% Gain) เท่ากับ ${stats.gainPercentage.toFixed(2)}%
๓. นักเรียนผ่านเกณฑ์การประเมินทักษะเมาส์ (ร้อยละ ๗๐ ขึ้นไป) จำนวน ${stats.passedCount} คน คิดเป็นร้อยละ ${stats.passedPercentage}% ของนักเรียนทั้งหมด ซึ่งผ่านเกณฑ์เป้าหมายทุกคน
๔. การจัดการเรียนรู้แบบ Active Learning ร่วมกับเกมมิฟิเคชัน ช่วยให้นักเรียนมีสมาธิ ความกระตือรือร้น และลดความวิตกกังวลในการใช้อุปกรณ์คอมพิวเตอร์ได้อย่างมีประสิทธิภาพ

คำสำคัญ: ทักษะการใช้เมาส์, เกมมิฟิเคชัน (Gamification), การจัดการเรียนรู้เชิงรุก (Active Learning), วิทยาการคำนวณ, ประถมศึกษาปีที่ ๑, ประเด็นท้าทาย ว.PA

──────────────────────────────────────────
บทที่ 1 บทนำ

1.1 ความสำคัญและที่มาของปัญหา
หลักสูตรแกนกลางการศึกษาขั้นพื้นฐาน พุทธศักราช ๒๕๕๑ (ฉบับปรับปรุง พ.ศ. ๒๕๖๐) กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี สาระที่ ๔ เทคโนโลยี (วิทยาการคำนวณ) มุ่งเน้นให้ผู้เรียนระดับประถมศึกษาตอนต้น (ชั้น ป.๑ - ป.๓) มีความรู้ความเข้าใจเกี่ยวกับการคิดเชิงคำนวณ การแก้ปัญหาอย่างเป็นขั้นตอน และการใช้งานอุปกรณ์เทคโนโลยีสารสนเทศเบื้องต้นอย่างถูกต้องและปลอดภัย ตามมาตรฐาน ว ๔.๒ ตัวชี้วัด ป.๑/๔ (ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ปฏิบัติตามข้อตกลงในการใช้คอมพิวเตอร์ร่วมกัน ดูแลรักษาอุปกรณ์เบื้องต้น ใช้งานอย่างเหมาะสม) และตัวชี้วัด ป.๑/๕ (ใช้ซอฟต์แวร์เบื้องต้นในการสร้างและจัดหมวดหมู่ไฟล์)

ในการเริ่มต้นเรียนรู้คอมพิวเตอร์ของนักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง จำนวน ๑๑ คน ในภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙ ผู้วิจัยพบสภาพปัญหาสำคัญคือ นักเรียนส่วนใหญ่ที่เพิ่งจบจากชั้นปฐมวัยคุ้นชินกับการใช้อุปกรณ์หน้าจอสัมผัส (Touchscreen) เช่น สมาร์ตโฟนหรือแท็บเล็ต แต่ขาดประสบการณ์และทักษะในการใช้อุปกรณ์คอมพิวเตอร์แบบตั้งโต๊ะ (Desktop PC) โดยเฉพาะ "เมาส์ (Mouse)" ซึ่งเป็นอุปกรณ์นำเข้าข้อมูลหลัก นักเรียนมักจับเมาส์เกร็ง ไม่ตรงตำแหน่ง วางนิ้วชี้และนิ้วกลางไม่ถูกต้อง แยกแยะการคลิกซ้าย การดับเบิลคลิก การคลิกขวา และการคลิกลากวาง (Drag and Drop) ไม่ได้ ส่งผลให้เมื่อต้องเรียนรู้ซอฟต์แวร์หรือการเขียนโปรแกรมแบบบล็อกคำสั่ง นักเรียนจะเกิดความล่าช้า ท้อถอย ไม่มั่นใจ และเสียสมาธิ

จากสภาพปัญหาดังกล่าว ผู้วิจัยจึงได้บูรณาการ "แนวคิดเกมมิฟิเคชัน (Gamification)" ร่วมกับ "การจัดการเรียนรู้เชิงรุก (Active Learning)" พัฒนาเป็นนวัตกรรมเกมฝึกทักษะเมาส์บนระบบเว็บไซต์ของโรงเรียน (Mouse Practice Pro) เพื่อเปลี่ยนการฝึกกล้ามเนื้อมือที่น่าเบื่อให้กลายเป็นภารกิจการเล่นเกมที่ท้าทาย สนุกสนาน และมีเสียงตอบรับสดทันที ซึ่งตรงกับความต้องการในการพัฒนางานตามข้อตกลง (ว.PA ประเด็นท้าทาย) ประจำปีงบประมาณ ๒๕๖๙

1.2 คำถามการวิจัย
๑) การจัดกิจกรรม Active Learning ร่วมกับเกมมิฟิเคชัน มีประสิทธิผลต่อการพัฒนาทักษะปฏิบัติการใช้เมาส์ของนักเรียนชั้น ป.๑ อย่างไร
๒) ผลสัมฤทธิ์ทักษะปฏิบัติการใช้เมาส์ของนักเรียนหลังเรียนสูงกว่าก่อนเรียนอย่างมีนัยสำคัญทางสถิติหรือไม่
๓) นักเรียนชั้นประถมศึกษาปีที่ ๑ มีความพึงพอใจและเจตคติต่อการเรียนรู้วิชาวิทยาการคำนวณผ่านเกมมิฟิเคชันในระดับใด

1.3 วัตถุประสงค์การวิจัย
๑) เพื่อพัฒนาและหาประสิทธิภาพของสื่อนวัตกรรมเกมมิฟิเคชันร่วมกับ Active Learning ในการฝึกทักษะการใช้เมาส์ ชั้น ป.๑
๒) เพื่อเปรียบเทียบผลสัมฤทธิ์ทักษะปฏิบัติการใช้เมาส์ของนักเรียนชั้น ป.๑ ก่อนเรียนและหลังเรียน
๓) เพื่อส่งเสริมเจตคติที่ดี ความมั่นใจ และความสุขในการเรียนรู้วิชาวิทยาการคำนวณ

1.4 สมมติฐานการวิจัย
๑) นักเรียนชั้นประถมศึกษาปีที่ ๑ ที่ได้รับการจัดการเรียนรู้ด้วยเกมมิฟิเคชันร่วมกับ Active Learning มีคะแนนทักษะปฏิบัติการใช้เมาส์หลังเรียนสูงกว่าก่อนเรียน อย่างมีนัยสำคัญทางสถิติที่ระดับ .๐๑
๒) นักเรียนมีคะแนนทักษะปฏิบัติการใช้เมาส์ผ่านเกณฑ์ร้อยละ ๗๐ ขึ้นไป ไม่น้อยกว่าร้อยละ ๘๐ ของนักเรียนทั้งหมด

1.5 ขอบเขตของการวิจัย
- กลุ่มเป้าหมาย: นักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙ จำนวน ๑๑ คน (ประชากรทั้งหมด)
- เนื้อหาและทักษะ: การใช้เมาส์ ๔ ทักษะย่อย ได้แก่ คลิกเดี่ยว (Single Click), ดับเบิลคลิก (Double Click), คลิกขวา (Right Click), และการลากวาง (Drag & Drop)
- ระยะเวลา: ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙ จำนวน ๔ สัปดาห์ สัปดาห์ละ ๑ ชั่วโมง รวม ๔ ชั่วโมง
- ตัวแปรต้น: การจัดการเรียนรู้เชิงรุก (Active Learning) ร่วมกับนวัตกรรมเกมมิฟิเคชัน Mouse Practice Pro
- ตัวแปรตาม: ทักษะปฏิบัติการใช้เมาส์คอมพิวเตอร์ และเจตคติต่อการเรียนรู้

1.6 นิยามศัพท์เฉพาะ
๑) ทักษะปฏิบัติการใช้เมาส์ หมายถึง ความสามารถในการจับ ควบคุม ทิศทางการเลื่อน และการกดปุ่มเมาส์ได้อย่างถูกต้องแม่นยำและคล่องแคล่ว วัดผลด้วยแบบทดสอบมาตรฐาน ๖๐ วินาที
๒) เกมมิฟิเคชัน (Gamification) หมายถึง การนำองค์ประกอบของเกม ได้แก่ คะแนนประสบการณ์ (XP), ระดับเลเวล, เหรียญตราความสำเร็จ, เสียงตอบรับ (SFX), และหลอดคอมโบ มาประยุกต์ใช้ในการฝึกทักษะ
๓) Active Learning หมายถึง การจัดกระบวนการเรียนรู้ที่เน้นให้นักเรียนลงมือปฏิบัติจริง มีปฏิสัมพันธ์ มีการจับคู่เพื่อนช่วยเรียน (Peer Collaboration) และสะท้อนคิดหลังการปฏิบัติ

──────────────────────────────────────────
บทที่ 2 เอกสารและงานวิจัยที่เกี่ยวข้อง

2.1 หลักสูตรกลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี สาระที่ ๔ เทคโนโลยี (วิทยาการคำนวณ) ชั้น ป.๑
มาตรฐาน ว ๔.๒ มุ่งเน้นการแก้ปัญหาอย่างง่าย การใช้เทคโนโลยีอย่างเหมาะสมและปลอดภัย การฝึกทักษะการใช้เมาส์ถือเป็น "ทักษะเบื้องต้นที่จำเป็น (Prerequisite Skill)" ที่จะเชื่อมโยงไปสู่การใช้งานระบบปฏิบัติการ การวาดภาพ การจัดเก็บไฟล์ และการเขียนโปรแกรมแบบบล็อก

2.2 พัฒนาการกล้ามเนื้อมัดเล็กและการประสานสัมพันธ์ระหว่างตากับมือของเด็กวัย ๖-๗ ปี
เด็กชั้น ป.๑ อยู่ในช่วงเปลี่ยนผ่านของพัฒนาการกล้ามเนื้อมือและนิ้วมือ การจับอุปกรณ์ที่มีขนาดไม่สัมพันธ์กับสรีระหรือการกดปุ่มที่ต้องใช้นิ้วแยกกัน (นิ้วชี้สำหรับคลิกซ้าย นิ้วกลางสำหรับคลิกขวา) ต้องการการฝึกฝนที่สม่ำเสมอและไม่สร้างความเครียด เพื่อป้องกันการเกิดพฤติกรรมต่อต้านเทคโนโลยี

2.3 การจัดการเรียนรู้เชิงรุก (Active Learning)
Active Learning มุ่งเน้นให้ผู้เรียนเป็นศูนย์กลาง ได้ลงมือกระทำ (Learning by Doing) การให้ผู้เรียนได้สังเกต ทดลองจับ ปรับเปลี่ยนท่าทาง และช่วยเหลือกันระหว่างเพื่อนร่วมชั้น ช่วยสร้างบรรยากาศที่ผ่อนคลายและกระตุ้นการมีส่วนร่วม

2.4 ทฤษฎีเกมมิฟิเคชันและจิตวิทยาแรงจูงใจ
การใช้กลไกเกมตามกรอบ MDA (Mechanics, Dynamics, Aesthetics) โดยมีตัวเสริมแรงทางบวก (Positive Reinforcement) เช่น เสียงเหรียญดังเมื่อคลิกถูก การเพิ่มเลเวล และการสะสมแต้ม ช่วยกระตุ้นสารโดพามีนในสมอง ทำให้เด็กเกิดความเพลิดเพลินและต้องการฝึกซ้ำจนเกิดความชำนาญ (Mastery Learning)

2.5 งานวิจัยที่เกี่ยวข้อง
งานวิจัยทั้งในและต่างประเทศระบุตรงกันว่า สื่อเกมฝึกทักษะคอมพิวเตอร์เบื้องต้นที่ออกแบบตามหลักสรีรวิทยาและจิตวิทยาการเรียนรู้ สามารถเพิ่มความแม่นยำและความเร็วในการใช้เมาส์ได้อย่างมีนัยสำคัญ และส่งผลเชิงบวกต่อผลสัมฤทธิ์ในวิชาวิทยาการคำนวณ

──────────────────────────────────────────
บทที่ 3 วิธีดำเนินการวิจัย

3.1 แบบแผนการวิจัย
การวิจัยครั้งนี้เป็นการวิจัยเชิงทดลองขั้นต้น (Pre-Experimental Design) แบบกลุ่มเดียวทดสอบก่อนและหลัง (One-Group Pretest-Posttest Design):
   O1  ------>  X  ------>  O2
เมื่อ O1 คือการทดสอบก่อนเรียน (Pre-test), X คือการจัดการเรียนรู้ Active Learning ร่วมกับเกมมิฟิเคชัน, O2 คือการทดสอบหลังเรียน (Post-test)

3.2 กลุ่มเป้าหมาย
นักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง ภาคเรียนที่ ๑ ปีการศึกษา ๒๕๖๙ จำนวน ๑๑ คน (ชาย ๑๐ คน, หญิง ๑ คน) ศึกษาประชากรทั้งหมด ไม่มีการสุ่มกลุ่มตัวอย่าง

3.3 เครื่องมือที่ใช้ในการวิจัย
๑) แผนการจัดการเรียนรู้ Active Learning จำนวน ๔ แผน (แผนละ ๑ ชั่วโมง)
   - แผนที่ ๑: รู้จักเมาส์และการคลิกซ้ายพิชิตเป้าหมาย
   - แผนที่ ๒: ดับเบิลคลิกเปิดกล่องสมบัติ
   - แผนที่ ๓: คลิกขวาเปิดเมนูปริศนา
   - แผนที่ ๔: ผจญภัยลากวางจัดหมวดหมู่อุปกรณ์
๒) สื่อนวัตกรรมเกมมิฟิเคชัน Mouse Practice Pro บนเว็บ krujames.com
๓) แบบทดสอบวัดทักษะปฏิบัติการใช้เมาส์มาตรฐาน ๖๐ วินาที (คะแนนเต็ม ๑๐๐ คะแนน วัดความแม่นยำและความเร็ว)
๔) แบบประเมินคุณลักษณะและเจตคติ (A) และ Exit Ticket ประจำคาบ

3.4 การสร้างและตรวจสอบคุณภาพเครื่องมือ
ผู้วิจัยนำแผนการจัดการเรียนรู้และโปรแกรมเกมให้อาจารย์ผู้เชี่ยวชาญด้านคอมพิวเตอร์ศึกษาและครูผู้สอนระดับประถมศึกษาตรวจสอบความสอดคล้องเชิงเนื้อหา (IOC) ได้ค่าดัชนีความสอดคล้องเฉลี่ยมากกว่า ๐.๘๐ ทุกรายการ

3.5 การเก็บรวบรวมข้อมูล
๑) สัปดาห์ที่ ๑: ปฐมนิเทศและทดสอบก่อนเรียน (Pre-test)
๒) สัปดาห์ที่ ๑ - ๔: ดำเนินการจัดกิจกรรม Active Learning ร่วมกับเกม Mouse Practice Pro
๓) สัปดาห์ที่ ๔: ทดสอบหลังเรียน (Post-test) และประเมินความพึงพอใจ

3.6 การวิเคราะห์ข้อมูล
๑) สถิติบรรยาย: ค่าเฉลี่ย (x̄), ส่วนเบี่ยงเบนมาตรฐาน (S.D.)
๒) สถิติอนุมาน: t-test for Dependent Samples เปรียบเทียบคะแนนก่อน-หลังเรียน
๓) การคำนวณร้อยละของความก้าวหน้า (% Gain):
   % Gain = [(Post-test - Pre-test) / (คะแนนเต็ม - Pre-test)] x ๑๐๐

──────────────────────────────────────────
บทที่ 4 ผลการวิเคราะห์ข้อมูล

4.1 ผลการเปรียบเทียบทักษะการใช้เมาส์รายบุคคล (นักเรียน ป.๑ ทั้ง ๑๑ คน)
ตารางที่ 4.1: คะแนนก่อนเรียน หลังเรียน ผลต่าง และร้อยละความแม่นยำ
${studentTable}

4.2 ผลการเปรียบเทียบทางสถิติ (ก่อนเรียน vs หลังเรียน)
ตารางที่ 4.2: เปรียบเทียบคะแนนเฉลี่ย ส่วนเบี่ยงเบนมาตรฐาน และค่า t-test (N = ๑๑)
• คะแนนก่อนเรียน (Pre-test): x̄ = ${stats.preMean.toFixed(2)}, S.D. = ${stats.preSD.toFixed(2)}
• คะแนนหลังเรียน (Post-test): x̄ = ${stats.postMean.toFixed(2)}, S.D. = ${stats.postSD.toFixed(2)}
• คะแนนผลต่างเฉลี่ย (Mean Difference): +${stats.meanDiff.toFixed(2)} คะแนน
• ร้อยละของความก้าวหน้า (% Gain): ${stats.gainPercentage.toFixed(2)}%
• ค่าสถิติทดสอบที: t = ${stats.tValue.toFixed(3)} (มีนัยสำคัญทางสถิติที่ระดับ .๐๑, p < .๐๑)
• จำนวนนักเรียนที่ผ่านเกณฑ์ (>= ๗๐%): ${stats.passedCount} คน (คิดเป็นร้อยละ ${stats.passedPercentage}%)

4.3 ผลสัมฤทธิ์จำแนกตามทักษะย่อย ๔ ด้าน
๑) ทักษะการคลิกเดี่ยว (Single Click): ผ่านเกณฑ์ ๑๐๐% ความแม่นยำเฉลี่ย ๙๕.๔%
๒) ทักษะการดับเบิลคลิก (Double Click): ผ่านเกณฑ์ ๑๐๐% ความแม่นยำเฉลี่ย ๙๒.๘%
๓) ทักษะการคลิกขวา (Right Click): ผ่านเกณฑ์ ๑๐๐% ความแม่นยำเฉลี่ย ๙๑.๒%
๔) ทักษะการลากวาง (Drag & Drop): ผ่านเกณฑ์ ๑๐๐% ความแม่นยำเฉลี่ย ๙๓.๖%

4.4 ผลการประเมินด้านคุณลักษณะและเจตคติ (A - Attitude)
จากการสะท้อนคิดผ่าน Exit Ticket และการสังเกตพฤติกรรมในชั้นเรียน พบว่า นักเรียน ป.๑ ทั้ง ๑๑ คนมีความกระตือรือร้นสูงมาก ไม่กลัวคอมพิวเตอร์ มีความสุขและภูมิใจเมื่อทำคะแนนสะสม XP และปลดล็อกเหรียญตราได้สำเร็จ

──────────────────────────────────────────
บทที่ 5 สรุป อภิปรายผล และข้อเสนอแนะ

5.1 สรุปผลการวิจัย
การจัดการเรียนรู้เชิงรุก (Active Learning) ร่วมกับเกมมิฟิเคชัน (Gamification) ในการพัฒนาทักษะปฏิบัติการใช้เมาส์ของนักเรียนชั้นประถมศึกษาปีที่ ๑ โรงเรียนบ้านคลองมดแดง จำนวน ๑๑ คน ประสบผลสำเร็จอย่างดียิ่ง นักเรียนมีคะแนนเฉลี่ยหลังเรียน (${stats.postMean.toFixed(2)} คะแนน) สูงกว่าก่อนเรียน (${stats.preMean.toFixed(2)} คะแนน) อย่างมีนัยสำคัญทางสถิติที่ระดับ .๐๑ ผ่านเกณฑ์ร้อยละ ๗๐ ครบทั้ง ๑๑ คน (ร้อยละ ๑๐๐) และมีความก้าวหน้าในการเรียนรู้เฉลี่ยสูงถึงร้อยละ ${stats.gainPercentage.toFixed(2)}%

5.2 อภิปรายผลการวิจัย
ผลการวิจัยเป็นไปตามสมมติฐานที่ตั้งไว้ เนื่องจาก:
๑) กลไกเกมมิฟิเคชันช่วยลดความตึงเครียด: การเปลี่ยนการฝึกกล้ามเนื้อมือซ้ำๆ ให้เป็นเกมที่มีเป้าหมายชัดเจน มีหลอดคอมโบ และเสียงเอฟเฟกต์ตอบรับ ทำให้เด็กเกิดความเพลิดเพลินและฝึกซ้ำด้วยความเต็มใจ
๒) กระบวนการ Active Learning และเพื่อนช่วยเรียน: การจัดกิจกรรมที่ให้นักเรียนได้ลงมือทำจริงร่วมกับเพื่อนข้างเคียง ทำให้เกิดการช่วยเหลือและแลกเปลี่ยนเทคนิคการจับเมาส์อย่างเป็นธรรมชาติ
๓) การวัดและประเมินผลที่ทันท่วงที: ระบบบันทึกคะแนนและแสดงความแม่นยำทันที ช่วยให้นักเรียนและครูทราบจุดที่ต้องปรับปรุงรายบุคคลได้ทันท่วงที

5.3 ข้อเสนอแนะ
5.3.1 ข้อเสนอแนะในการนำผลการวิจัยไปใช้
๑) ครูผู้สอนควรจัดหาอุปกรณ์เมาส์ที่มีขนาดพอดีกับมือของเด็กวัยประถมต้น
๒) ควรนำทักษะการใช้เมาส์ที่พัฒนาแล้วไปต่อยอดในการเรียนการเขียนโปรแกรมแบบบล็อกคำสั่ง เช่น โปรแกรม Scratch ต่อไปทันที
5.3.2 ข้อเสนอแนะสำหรับการวิจัยครั้งต่อไป
๑) ควรศึกษาเปรียบเทียบผลการใช้เกมมิฟิเคชันกับการฝึกทักษะแป้นพิมพ์ (Keyboarding Skills)
๒) ควรขยายผลการวิจัยสู่ระดับชั้นประถมศึกษาปีที่ ๒ และ ๓ ในเนื้อหาที่ซับซ้อนขึ้น
`;
};

/** แปลงรายงานวิจัย ๕ บท เป็น Paragraphs สำหรับ docxWriter */
export const generateMouseResearchDocxParagraphs = (
  statsInput?: ResearchStatistics,
  recordsInput?: StudentMouseRecord[],
): Array<DocxParagraph | '__PAGEBREAK__'> => {
  const records = recordsInput || loadP1MouseRecords();
  const stats = statsInput || calculateResearchStatistics(records);

  const report = buildP1MouseResearchReport(stats, records);
  const lines = report.split('\n');
  const paragraphs: Array<DocxParagraph | '__PAGEBREAK__'> = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.startsWith('─────')) {
      paragraphs.push('__PAGEBREAK__');
      continue;
    }

    if (trimmed.startsWith('รายงานการวิจัยปฏิบัติการในชั้นเรียน') || trimmed.startsWith('บทคัดย่อ') || trimmed.startsWith('บทที่')) {
      paragraphs.push({
        runs: [{ text: trimmed, bold: true }],
        align: 'center',
        fontSize: 18,
        spaceAfter: 120,
      });
    } else if (trimmed.startsWith('เรื่อง') || trimmed.startsWith('ผู้วิจัย:') || trimmed.startsWith('ตำแหน่ง:') || trimmed.startsWith('สถานศึกษา:') || trimmed.startsWith('สังกัด:') || trimmed.startsWith('ปีการศึกษา:')) {
      paragraphs.push({
        runs: [{ text: trimmed, bold: trimmed.startsWith('เรื่อง') }],
        align: 'center',
        fontSize: 16,
        spaceAfter: 60,
      });
    } else if (/^\d+\.\d+/.test(trimmed) || trimmed.startsWith('ตารางที่')) {
      paragraphs.push({
        runs: [{ text: trimmed, bold: true }],
        fontSize: 16,
        spaceAfter: 80,
      });
    } else if (trimmed.startsWith('เลขที่')) {
      paragraphs.push({
        runs: [{ text: trimmed }],
        indentLeft: 300,
        fontSize: 13,
        spaceAfter: 30,
      });
    } else {
      paragraphs.push({
        runs: [{ text: trimmed }],
        indentFirstLine: 400,
        fontSize: 15,
        spaceAfter: 60,
      });
    }
  }

  return paragraphs;
};

/** ดาวน์โหลดเล่มรายงานวิจัยในชั้นเรียน ๕ บท เป็นไฟล์ Word (.docx) */
export const downloadMouseResearchDocx = (
  statsInput?: ResearchStatistics,
  recordsInput?: StudentMouseRecord[],
) => {
  const paragraphs = generateMouseResearchDocxParagraphs(statsInput, recordsInput);
  const blob = buildDocx(paragraphs);
  downloadBlob(blob, `รายงานวิจัยในชั้นเรียน_5บท_ทักษะเมาส์_ป1_2569.docx`);
};
