// สรุปผลสอบรายห้อง และวิเคราะห์ข้อสอบ (ค่าความยาก p, อำนาจจำแนก r แบบกลุ่มสูง-กลุ่มต่ำ 27%, และสัดส่วนการเลือกแต่ละตัวเลือก)
import type { ExamAttempt } from '../services/examService';

export interface AnswerKeyItem {
  /** คีย์ใน attempt.answers (ออนไลน์ = id ข้อ, กระดาษ = q1, q2, ...) */
  key: string;
  label: string;
  /** บิตมาสก์ตัวเลือกที่ถูก (บิต 0 = ก) */
  mask: number;
  choiceCount: number;
}

export interface ItemStat extends AnswerKeyItem {
  n: number;
  /** สัดส่วนคนตอบถูก (0–1) ยิ่งมากยิ่งง่าย */
  p: number;
  /** อำนาจจำแนก (−1 ถึง 1) null เมื่อผู้สอบน้อยเกินไป (< 6 คน) */
  r: number | null;
  /** จำนวนคนที่เลือกแต่ละตัวเลือก (ดูว่าตัวลวงทำงานไหม) */
  choiceCounts: number[];
  blank: number;
}

const accepted = (mask: number, answer: unknown) =>
  typeof answer === 'number' && answer >= 0 && ((mask >> answer) & 1) === 1;

/** ผลดีที่สุดของแต่ละคน (คะแนนสูงสุด ถ้าเท่ากันเอาครั้งล่าสุด) */
export const bestAttemptPerStudent = (attempts: ExamAttempt[]): ExamAttempt[] => {
  const best = new Map<string, ExamAttempt>();
  for (const attempt of attempts) {
    const current = best.get(attempt.studentId);
    if (!current || attempt.score > current.score || (attempt.score === current.score && attempt.timestamp > current.timestamp)) {
      best.set(attempt.studentId, attempt);
    }
  }
  return [...best.values()];
};

export const analyzeItems = (attempts: ExamAttempt[], key: AnswerKeyItem[]): ItemStat[] => {
  const sorted = [...attempts].sort((a, b) => b.score - a.score);
  const n = sorted.length;
  const group = Math.max(1, Math.round(n * 0.27));
  const upper = sorted.slice(0, group);
  const lower = sorted.slice(n - group);
  const rate = (list: ExamAttempt[], item: AnswerKeyItem) =>
    list.length ? list.filter((a) => accepted(item.mask, a.answers?.[item.key])).length / list.length : 0;
  return key.map((item) => {
    const choiceCounts = Array.from({ length: item.choiceCount }, () => 0);
    let blank = 0;
    sorted.forEach((a) => {
      const answer = a.answers?.[item.key];
      if (typeof answer === 'number' && answer >= 0 && answer < item.choiceCount) choiceCounts[answer] += 1;
      else blank += 1;
    });
    return {
      ...item,
      n,
      p: rate(sorted, item),
      r: n >= 6 ? rate(upper, item) - rate(lower, item) : null,
      choiceCounts,
      blank,
    };
  });
};

export const describeDifficulty = (p: number) => (p < 0.2 ? 'ยากมาก' : p > 0.8 ? 'ง่ายมาก' : 'พอเหมาะ');

export const describeDiscrimination = (r: number | null) => {
  if (r === null) return 'ผู้สอบน้อยเกินไป';
  if (r < 0) return 'ติดลบ: ตรวจเฉลยหรือตัวลวง';
  if (r < 0.2) return 'ควรปรับปรุง';
  if (r < 0.4) return 'ใช้ได้';
  return 'ดีมาก';
};

export interface ExamSummary {
  takers: number;
  averagePercent: number;
  passRate: number;
}

export const summarizeAttempts = (best: ExamAttempt[]): ExamSummary => ({
  takers: best.length,
  averagePercent: best.length ? Math.round(best.reduce((sum, a) => sum + a.percentage, 0) / best.length) : 0,
  passRate: best.length ? Math.round((best.filter((a) => a.percentage >= 50).length / best.length) * 100) : 0,
});

/** คำนวณค่าความเชื่อมั่นของแบบทดสอบด้วยสูตร Kuder-Richardson 20 (KR-20) */
export const computeKr20 = (attempts: ExamAttempt[], key: AnswerKeyItem[]): number | null => {
  const k = key.length;
  const n = attempts.length;
  if (k < 2 || n < 2) return null;
  const studentTotals = attempts.map((a) =>
    key.reduce((sum, item) => sum + (accepted(item.mask, a.answers?.[item.key]) ? 1 : 0), 0),
  );
  const mean = studentTotals.reduce((sum, s) => sum + s, 0) / n;
  const variance = studentTotals.reduce((sum, s) => sum + (s - mean) ** 2, 0) / n;
  if (variance <= 1e-9) return null;
  const sumPQ = key.reduce((sum, item) => {
    const p = attempts.filter((a) => accepted(item.mask, a.answers?.[item.key])).length / n;
    return sum + p * (1 - p);
  }, 0);
  const kr20 = (k / (k - 1)) * (1 - sumPQ / variance);
  return Math.max(-1, Math.min(1, Math.round(kr20 * 1000) / 1000));
};

export const describeKr20 = (kr20: number | null): { label: string; level: 'good' | 'warn' | 'bad' | 'muted' } => {
  if (kr20 === null) return { label: 'ข้อมูลยังไม่พอคำนวณ', level: 'muted' };
  if (kr20 >= 0.8) return { label: 'เชื่อมั่นสูงมาก (ระดับวิจัย/มาตรฐาน)', level: 'good' };
  if (kr20 >= 0.7) return { label: 'เชื่อมั่นดี (ผ่านเกณฑ์วิจัย ≥ 0.70)', level: 'good' };
  if (kr20 >= 0.6) return { label: 'พอใช้ (ควรปรับข้อที่ r ต่ำ)', level: 'warn' };
  return { label: 'เชื่อมั่นต่ำ (ควรปรับปรุงข้อสอบ)', level: 'bad' };
};

export interface PsychometricSummary {
  takers: number;
  meanScore: number;
  sdScore: number;
  medianScore: number;
  minScore: number;
  maxScore: number;
  totalPossible: number;
  meanPercent: number;
  sdPercent: number;
  passRate50: number;
  passRate70: number;
  kr20: number | null;
  goodItemsCount: number;
  reviewItemsCount: number;
}

/** สถิติระดับงานวิจัยในชั้นเรียน (Mean, S.D., Median, Min, Max, ผ่าน 50%/70%, KR-20) */
export const computePsychometricSummary = (
  attempts: ExamAttempt[],
  key: AnswerKeyItem[],
  totalPossibleOverride?: number,
): PsychometricSummary => {
  const n = attempts.length;
  const totalPossible = totalPossibleOverride ?? Math.max(1, attempts[0]?.totalQuestions ?? key.length);
  if (n === 0) {
    return {
      takers: 0,
      meanScore: 0,
      sdScore: 0,
      medianScore: 0,
      minScore: 0,
      maxScore: 0,
      totalPossible,
      meanPercent: 0,
      sdPercent: 0,
      passRate50: 0,
      passRate70: 0,
      kr20: null,
      goodItemsCount: 0,
      reviewItemsCount: 0,
    };
  }
  const scores = attempts.map((a) => a.score).sort((a, b) => a - b);
  const percents = attempts.map((a) => a.percentage);
  const meanScore = scores.reduce((s, v) => s + v, 0) / n;
  const sdScore = Math.sqrt(scores.reduce((s, v) => s + (v - meanScore) ** 2, 0) / n);
  const meanPercent = percents.reduce((s, v) => s + v, 0) / n;
  const sdPercent = Math.sqrt(percents.reduce((s, v) => s + (v - meanPercent) ** 2, 0) / n);
  const mid = Math.floor(n / 2);
  const medianScore = n % 2 === 1 ? scores[mid] : (scores[mid - 1] + scores[mid]) / 2;
  const passRate50 = Math.round((attempts.filter((a) => a.percentage >= 50).length / n) * 100);
  const passRate70 = Math.round((attempts.filter((a) => a.percentage >= 70).length / n) * 100);
  const items = analyzeItems(attempts, key);
  const goodItemsCount = items.filter((item) => item.p >= 0.2 && item.p <= 0.8 && (item.r === null || item.r >= 0.2)).length;
  const reviewItemsCount = items.length - goodItemsCount;
  const round2 = (v: number) => Math.round(v * 100) / 100;
  return {
    takers: n,
    meanScore: round2(meanScore),
    sdScore: round2(sdScore),
    medianScore: round2(medianScore),
    minScore: scores[0],
    maxScore: scores[n - 1],
    totalPossible,
    meanPercent: round2(meanPercent),
    sdPercent: round2(sdPercent),
    passRate50,
    passRate70,
    kr20: computeKr20(attempts, key),
    goodItemsCount,
    reviewItemsCount,
  };
};

const csvEsc = (value: string | number) => {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** สร้างไฟล์ CSV เมทริกซ์ 0/1 และตารางวิเคราะห์คุณภาพข้อสอบ (p, r, KR-20) สำหรับ Excel / SPSS */
export const buildItemAnalysisCsv = (
  examTitle: string,
  classroom: string,
  attempts: ExamAttempt[],
  key: AnswerKeyItem[],
  choiceLabels: string[] = ['ก', 'ข', 'ค', 'ง', 'จ'],
): string => {
  const best = bestAttemptPerStudent(attempts).sort(
    (a, b) => (a.studentNo ?? 999) - (b.studentNo ?? 999),
  );
  const summary = computePsychometricSummary(best, key);
  const items = analyzeItems(best, key);
  const maxChoices = Math.max(4, ...key.map((k) => k.choiceCount));
  const lines: (string | number)[][] = [
    ['รายงานวิเคราะห์คุณภาพข้อสอบ (Item Analysis & Research Matrix)'],
    ['ชุดข้อสอบ', examTitle, 'ชั้นเรียน', classroom, 'จำนวนผู้สอบ', summary.takers],
    ['ค่าเฉลี่ย (Mean)', summary.meanScore, 'ส่วนเบี่ยงเบนมาตรฐาน (S.D.)', summary.sdScore, 'มัธยฐาน (Median)', summary.medianScore],
    ['คะแนนต่ำสุด', summary.minScore, 'คะแนนสูงสุด', summary.maxScore, 'คะแนนเต็ม', summary.totalPossible],
    ['ผ่าน 50% (%)', summary.passRate50, 'ผ่าน 70% (%)', summary.passRate70, 'ความเชื่อมั่น KR-20', summary.kr20 ?? '-'],
    [],
    ['ตารางที่ 1: ค่าความยาก (p) อำนาจจำแนก (r) และสัดส่วนการเลือกตัวลวง'],
    [
      'ข้อ', 'เฉลย', 'ผู้สอบ (N)', 'ตอบถูก (คน)', 'ความยาก (p)', 'แปลผล p',
      'อำนาจจำแนก (r)', 'แปลผล r',
      ...Array.from({ length: maxChoices }, (_, c) => `เลือก ${choiceLabels[c] ?? c + 1} (%)`),
      'ไม่ตอบ (คน)',
    ],
    ...items.map((item) => {
      const keyLabel = choiceLabels.filter((_, i) => (item.mask >> i) & 1).join('/') || '-';
      return [
        item.label,
        keyLabel,
        item.n,
        Math.round(item.p * item.n),
        item.p.toFixed(2),
        describeDifficulty(item.p),
        item.r === null ? '-' : item.r.toFixed(2),
        describeDiscrimination(item.r),
        ...Array.from({ length: maxChoices }, (_, c) => (
          c < item.choiceCounts.length && item.n > 0 ? Math.round((item.choiceCounts[c] / item.n) * 100) : ''
        )),
        item.blank,
      ];
    }),
    [],
    ['ตารางที่ 2: เมทริกซ์คะแนนรายข้อแบบ 0/1 (สำหรับ SPSS / Jamovi / Excel)'],
    ['เลขที่', 'ชื่อ-สกุล', ...key.map((k) => k.label), 'คะแนนรวม', 'ร้อยละ'],
    ...best.map((a) => [
      a.studentNo ?? '',
      a.studentName || a.studentId,
      ...key.map((item) => (accepted(item.mask, a.answers?.[item.key]) ? 1 : 0)),
      a.score,
      a.percentage,
    ]),
  ];
  return `\uFEFF${lines.map((row) => row.map(csvEsc).join(',')).join('\r\n')}`;
};
