// ระบบใบงานโต้ตอบออนไลน์ (Interactive Worksheet Engine)
// รองรับ 5 ชนิดโจทย์: ปรนัย (choice), ถามต่อต่อเนื่อง (followup), ลากบล็อกต่อบล็อก (block_order),
// จัดหมวดหมู่/จับคู่ (match_group), และเติมคำสั้น/คำสำคัญ (short_answer)
// พร้อมตรวจคะแนนอัตโนมัติแยกด้าน K (ความรู้) และ P (ปฏิบัติ) อย่างแม่นยำ

export type WorksheetDomain = 'k' | 'p';

export interface WorksheetChoiceItem {
  id: string;
  kind: 'choice';
  domain: WorksheetDomain;
  points: number;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface WorksheetFollowupStep {
  id: string;
  kind: 'choice' | 'short_answer';
  domain: WorksheetDomain;
  points: number;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  acceptedAnswers?: string[];
  acceptedKeywords?: string[];
  minKeywords?: number;
  placeholder?: string;
  explanation?: string;
}

export interface WorksheetFollowupItem {
  id: string;
  kind: 'followup';
  scenario: string;
  steps: WorksheetFollowupStep[];
}

export interface WorksheetBlockDef {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface WorksheetBlockOrderItem {
  id: string;
  kind: 'block_order';
  domain: WorksheetDomain;
  points: number;
  prompt: string;
  blocks: WorksheetBlockDef[];
  /** ลำดับ block.id ที่ถูกต้องตั้งแต่บนลงล่าง */
  correctOrder: string[];
  explanation?: string;
}

export interface WorksheetMatchGroupDef {
  id: string;
  label: string;
  icon?: string;
  color?: string;
}

export interface WorksheetMatchEntry {
  id: string;
  label: string;
  correctGroupId: string;
}

export interface WorksheetMatchGroupItem {
  id: string;
  kind: 'match_group';
  domain: WorksheetDomain;
  points: number;
  prompt: string;
  groups: WorksheetMatchGroupDef[];
  items: WorksheetMatchEntry[];
  explanation?: string;
}

export interface WorksheetShortAnswerItem {
  id: string;
  kind: 'short_answer';
  domain: WorksheetDomain;
  points: number;
  prompt: string;
  placeholder?: string;
  /** คำตอบสั้นที่ตรงกันทั้งหมด (ไม่สนตัวพิมพ์เล็ก/ใหญ่และช่องว่างหัวท้าย) */
  acceptedAnswers?: string[];
  /** คำสำคัญที่ควรมีในคำตอบ (ตรวจเบื้องต้นอัตโนมัติ) */
  acceptedKeywords?: string[];
  minKeywords?: number;
  explanation?: string;
}

export type WorksheetItem =
  | WorksheetChoiceItem
  | WorksheetFollowupItem
  | WorksheetBlockOrderItem
  | WorksheetMatchGroupItem
  | WorksheetShortAnswerItem;

export interface InteractiveWorksheetSpec {
  version: 1;
  templateId?: string;
  intro?: string;
  allowRetry?: boolean;
  showExplanationAfterSubmit?: boolean;
  items: WorksheetItem[];
}

/**
 * แผนที่คำตอบของนักเรียน:
 * - choice: number (index ที่เลือก)
 * - followup step (id = `${item.id}::${step.id}`): number | string
 * - block_order: string[] (รายการ block.id ที่ต่อเรียง)
 * - match_group: Record<string, string> (entryId -> groupId)
 * - short_answer: string
 */
export type WorksheetAnswerMap = Record<string, unknown>;

export interface WorksheetSubItemGrade {
  id: string;
  label: string;
  domain: WorksheetDomain;
  earned: number;
  max: number;
  correct: boolean;
  partial?: boolean;
  needsManualReview?: boolean;
  studentSummary: string;
  expectedSummary: string;
  explanation?: string;
}

export interface WorksheetGradingResult {
  totalScore: number;
  totalMax: number;
  kScore: number;
  kMax: number;
  pScore: number;
  pMax: number;
  percent: number;
  answeredSubItems: number;
  totalSubItems: number;
  needsManualReviewCount: number;
  details: WorksheetSubItemGrade[];
}

export interface WorksheetSubmissionPayload {
  __kind: 'interactive_worksheet_v1';
  templateId?: string;
  answers: WorksheetAnswerMap;
  previewResult: {
    totalScore: number;
    totalMax: number;
    kScore: number;
    kMax: number;
    pScore: number;
    pMax: number;
    percent: number;
  };
  completedAt: number;
}

export const followupAnswerKey = (itemId: string, stepId: string) => `${itemId}::${stepId}`;

const normalizeText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

const gradeShortText = (
  raw: string,
  points: number,
  acceptedAnswers?: string[],
  acceptedKeywords?: string[],
  minKeywords = 1,
): { earned: number; correct: boolean; partial: boolean; needsManualReview: boolean; expectedSummary: string } => {
  const answer = normalizeText(raw);
  const expectedParts: string[] = [];
  if (acceptedAnswers?.length) expectedParts.push(acceptedAnswers.join(' / '));
  if (acceptedKeywords?.length) expectedParts.push(`มีคำสำคัญ: ${acceptedKeywords.join(', ')}`);
  const expectedSummary = expectedParts.join(' หรือ ') || 'คำตอบอธิบายที่สอดคล้องกับโจทย์';

  if (!answer) {
    return { earned: 0, correct: false, partial: false, needsManualReview: false, expectedSummary };
  }

  if (acceptedAnswers && acceptedAnswers.length > 0) {
    const matched = acceptedAnswers.some((candidate) => normalizeText(candidate) === answer);
    if (matched) {
      return { earned: points, correct: true, partial: false, needsManualReview: false, expectedSummary };
    }
  }

  if (acceptedKeywords && acceptedKeywords.length > 0) {
    const hits = acceptedKeywords.filter((kw) => answer.includes(normalizeText(kw))).length;
    const target = Math.max(1, Math.min(minKeywords, acceptedKeywords.length));
    if (hits >= target) {
      return { earned: points, correct: true, partial: false, needsManualReview: false, expectedSummary };
    }
    if (hits > 0 && points > 1) {
      const partialScore = Math.max(1, Math.floor((points * hits) / target));
      return { earned: partialScore, correct: false, partial: true, needsManualReview: false, expectedSummary };
    }
    return { earned: 0, correct: false, partial: false, needsManualReview: false, expectedSummary };
  }

  // Open-ended text without keywords -> flag for quick teacher review, award base effort preview 0
  return { earned: 0, correct: false, partial: false, needsManualReview: true, expectedSummary };
};

/** สลับลำดับบล็อกแบบกำหนดได้จาก itemId เพื่อให้เด็กเห็นบล็อกคละกันเสมอและไม่ซ้ำเฉลย */
export const getShuffledBlocks = (item: WorksheetBlockOrderItem): WorksheetBlockDef[] => {
  const arr = [...item.blocks];
  if (arr.length <= 1) return arr;
  // Deterministic Fisher-Yates seeded by item.id
  let seed = 0;
  for (let i = 0; i < item.id.length; i += 1) {
    seed = (seed * 31 + item.id.charCodeAt(i)) >>> 0;
  }
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0x100000000;
  };
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  const sameAsAnswer = arr.every((b, idx) => b.id === item.correctOrder[idx]);
  if (sameAsAnswer && arr.length >= 2) {
    [arr[0], arr[arr.length - 1]] = [arr[arr.length - 1], arr[0]];
  }
  return arr;
};

export const getWorksheetMaxScores = (spec: InteractiveWorksheetSpec) => {
  let kMax = 0;
  let pMax = 0;
  let subItemCount = 0;

  for (const item of spec.items) {
    if (item.kind === 'followup') {
      for (const step of item.steps) {
        subItemCount += 1;
        if (step.domain === 'p') pMax += step.points;
        else kMax += step.points;
      }
    } else {
      subItemCount += 1;
      if (item.domain === 'p') pMax += item.points;
      else kMax += item.points;
    }
  }
  return {
    totalMax: kMax + pMax,
    kMax,
    pMax,
    itemCount: spec.items.length,
    subItemCount,
  };
};

/** ตรวจใบงานโต้ตอบทั้งหมดแบบ Deterministic (ใช้ได้ทั้งฝั่งเด็กและครูตัดคะแนนเข้า ปพ.5) */
export const gradeInteractiveWorksheet = (
  spec: InteractiveWorksheetSpec,
  answers: WorksheetAnswerMap,
): WorksheetGradingResult => {
  let kScore = 0;
  let kMax = 0;
  let pScore = 0;
  let pMax = 0;
  let answeredSubItems = 0;
  let totalSubItems = 0;
  let needsManualReviewCount = 0;
  const details: WorksheetSubItemGrade[] = [];

  const addDomainScore = (domain: WorksheetDomain, earned: number, max: number) => {
    if (domain === 'p') {
      pScore += earned;
      pMax += max;
    } else {
      kScore += earned;
      kMax += max;
    }
  };

  spec.items.forEach((item, index) => {
    const itemNo = index + 1;

    if (item.kind === 'choice') {
      totalSubItems += 1;
      const raw = answers[item.id];
      const picked = typeof raw === 'number' ? raw : -1;
      if (picked >= 0 && picked < item.options.length) answeredSubItems += 1;
      const correct = picked === item.correctIndex;
      const earned = correct ? item.points : 0;
      addDomainScore(item.domain, earned, item.points);
      details.push({
        id: item.id,
        label: `ข้อ ${itemNo} (ปรนัย): ${item.prompt}`,
        domain: item.domain,
        earned,
        max: item.points,
        correct,
        studentSummary: picked >= 0 && item.options[picked] ? item.options[picked] : '(ยังไม่ตอบ)',
        expectedSummary: item.options[item.correctIndex] || '-',
        explanation: item.explanation,
      });
      return;
    }

    if (item.kind === 'followup') {
      item.steps.forEach((step, sIdx) => {
        totalSubItems += 1;
        const key = followupAnswerKey(item.id, step.id);
        const raw = answers[key];
        const label = `ข้อ ${itemNo}.${sIdx + 1} (ถามต่อ): ${step.prompt}`;

        if (step.kind === 'choice') {
          const opts = step.options || [];
          const picked = typeof raw === 'number' ? raw : -1;
          if (picked >= 0 && picked < opts.length) answeredSubItems += 1;
          const correct = picked === (step.correctIndex ?? 0);
          const earned = correct ? step.points : 0;
          addDomainScore(step.domain, earned, step.points);
          details.push({
            id: key,
            label,
            domain: step.domain,
            earned,
            max: step.points,
            correct,
            studentSummary: picked >= 0 && opts[picked] ? opts[picked] : '(ยังไม่ตอบ)',
            expectedSummary: opts[step.correctIndex ?? 0] || '-',
            explanation: step.explanation,
          });
        } else {
          const text = typeof raw === 'string' ? raw : '';
          if (text.trim().length > 0) answeredSubItems += 1;
          const res = gradeShortText(
            text,
            step.points,
            step.acceptedAnswers,
            step.acceptedKeywords,
            step.minKeywords,
          );
          if (res.needsManualReview) needsManualReviewCount += 1;
          addDomainScore(step.domain, res.earned, step.points);
          details.push({
            id: key,
            label,
            domain: step.domain,
            earned: res.earned,
            max: step.points,
            correct: res.correct,
            partial: res.partial,
            needsManualReview: res.needsManualReview,
            studentSummary: text.trim() || '(ยังไม่ตอบ)',
            expectedSummary: res.expectedSummary,
            explanation: step.explanation,
          });
        }
      });
      return;
    }

    if (item.kind === 'block_order') {
      totalSubItems += 1;
      const raw = answers[item.id];
      const order = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === 'string') : [];
      if (order.length > 0) answeredSubItems += 1;
      const blockLabelById = new Map(item.blocks.map((b) => [b.id, b.label]));
      const totalSlots = item.correctOrder.length;
      let matchedSlots = 0;
      for (let i = 0; i < totalSlots; i += 1) {
        if (order[i] === item.correctOrder[i]) matchedSlots += 1;
      }
      const exact = matchedSlots === totalSlots && order.length === totalSlots;
      const earned = exact
        ? item.points
        : totalSlots > 0 && order.length === totalSlots
          ? Math.floor((item.points * matchedSlots) / totalSlots)
          : 0;
      addDomainScore(item.domain, earned, item.points);
      details.push({
        id: item.id,
        label: `ข้อ ${itemNo} (ลากบล็อกต่อบล็อก): ${item.prompt}`,
        domain: item.domain,
        earned,
        max: item.points,
        correct: exact,
        partial: !exact && earned > 0,
        studentSummary:
          order.length > 0
            ? order.map((id, i) => `${i + 1}. ${blockLabelById.get(id) || id}`).join(' → ')
            : '(ยังไม่ต่อบล็อก)',
        expectedSummary: item.correctOrder
          .map((id, i) => `${i + 1}. ${blockLabelById.get(id) || id}`)
          .join(' → '),
        explanation: item.explanation,
      });
      return;
    }

    if (item.kind === 'match_group') {
      totalSubItems += 1;
      const raw = answers[item.id];
      const mapping =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, string>)
          : {};
      const answeredCount = item.items.filter((entry) => Boolean(mapping[entry.id])).length;
      if (answeredCount > 0) answeredSubItems += 1;
      const groupLabelById = new Map(item.groups.map((g) => [g.id, g.label]));
      let correctEntries = 0;
      for (const entry of item.items) {
        if (mapping[entry.id] === entry.correctGroupId) correctEntries += 1;
      }
      const allCorrect = correctEntries === item.items.length && item.items.length > 0;
      const earned = allCorrect
        ? item.points
        : item.items.length > 0
          ? Math.round((item.points * correctEntries) / item.items.length)
          : 0;
      addDomainScore(item.domain, earned, item.points);
      details.push({
        id: item.id,
        label: `ข้อ ${itemNo} (จัดหมวดหมู่/จับคู่): ${item.prompt}`,
        domain: item.domain,
        earned,
        max: item.points,
        correct: allCorrect,
        partial: !allCorrect && earned > 0,
        studentSummary:
          answeredCount > 0
            ? item.items
                .map((entry) => `${entry.label} → ${groupLabelById.get(mapping[entry.id]) || 'ยังไม่เลือก'}`)
                .join(' | ')
            : '(ยังไม่จับคู่)',
        expectedSummary: item.items
          .map((entry) => `${entry.label} → ${groupLabelById.get(entry.correctGroupId) || '-'}`)
          .join(' | '),
        explanation: item.explanation,
      });
      return;
    }

    if (item.kind === 'short_answer') {
      totalSubItems += 1;
      const raw = answers[item.id];
      const text = typeof raw === 'string' ? raw : '';
      if (text.trim().length > 0) answeredSubItems += 1;
      const res = gradeShortText(
        text,
        item.points,
        item.acceptedAnswers,
        item.acceptedKeywords,
        item.minKeywords,
      );
      if (res.needsManualReview) needsManualReviewCount += 1;
      addDomainScore(item.domain, res.earned, item.points);
      details.push({
        id: item.id,
        label: `ข้อ ${itemNo} (เติมคำ): ${item.prompt}`,
        domain: item.domain,
        earned: res.earned,
        max: item.points,
        correct: res.correct,
        partial: res.partial,
        needsManualReview: res.needsManualReview,
        studentSummary: text.trim() || '(ยังไม่ตอบ)',
        expectedSummary: res.expectedSummary,
        explanation: item.explanation,
      });
    }
  });

  const totalScore = kScore + pScore;
  const totalMax = kMax + pMax;
  const percent = totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0;

  return {
    totalScore,
    totalMax,
    kScore,
    kMax,
    pScore,
    pMax,
    percent,
    answeredSubItems,
    totalSubItems,
    needsManualReviewCount,
    details,
  };
};

/** ตรวจสอบว่านักเรียนทำครบทุกข้อก่อนส่ง */
export const validateWorksheetAnswers = (
  spec: InteractiveWorksheetSpec,
  answers: WorksheetAnswerMap,
): { valid: boolean; missingLabels: string[] } => {
  const missingLabels: string[] = [];

  spec.items.forEach((item, index) => {
    const no = index + 1;
    if (item.kind === 'choice') {
      const picked = answers[item.id];
      if (typeof picked !== 'number' || picked < 0 || picked >= item.options.length) {
        missingLabels.push(`ข้อ ${no}`);
      }
    } else if (item.kind === 'followup') {
      item.steps.forEach((step, sIdx) => {
        const key = followupAnswerKey(item.id, step.id);
        const val = answers[key];
        if (step.kind === 'choice') {
          if (typeof val !== 'number' || val < 0 || val >= (step.options?.length || 0)) {
            missingLabels.push(`ข้อ ${no}.${sIdx + 1}`);
          }
        } else if (typeof val !== 'string' || val.trim().length < 2) {
          missingLabels.push(`ข้อ ${no}.${sIdx + 1}`);
        }
      });
    } else if (item.kind === 'block_order') {
      const order = answers[item.id];
      if (!Array.isArray(order) || order.length < item.correctOrder.length) {
        missingLabels.push(`ข้อ ${no} (ต่อบล็อกให้ครบ ${item.correctOrder.length} บล็อก)`);
      }
    } else if (item.kind === 'match_group') {
      const raw = answers[item.id];
      const mapping =
        raw && typeof raw === 'object' && !Array.isArray(raw)
          ? (raw as Record<string, string>)
          : {};
      const missingCount = item.items.filter((entry) => !mapping[entry.id]).length;
      if (missingCount > 0) {
        missingLabels.push(`ข้อ ${no} (ยังขาด ${missingCount} รายการ)`);
      }
    } else if (item.kind === 'short_answer') {
      const val = answers[item.id];
      if (typeof val !== 'string' || val.trim().length < 1) {
        missingLabels.push(`ข้อ ${no}`);
      }
    }
  });

  return { valid: missingLabels.length === 0, missingLabels };
};

export const encodeWorksheetSubmission = (
  spec: InteractiveWorksheetSpec,
  answers: WorksheetAnswerMap,
): { encodedData: string; result: WorksheetGradingResult; summaryComment: string } => {
  const result = gradeInteractiveWorksheet(spec, answers);
  const payload: WorksheetSubmissionPayload = {
    __kind: 'interactive_worksheet_v1',
    templateId: spec.templateId,
    answers,
    previewResult: {
      totalScore: result.totalScore,
      totalMax: result.totalMax,
      kScore: result.kScore,
      kMax: result.kMax,
      pScore: result.pScore,
      pMax: result.pMax,
      percent: result.percent,
    },
    completedAt: Date.now(),
  };
  const summaryComment = `🧩 ทำใบงานโต้ตอบผ่านเว็บครบ ${result.answeredSubItems}/${result.totalSubItems} ข้อย่อย · ตรวจอัตโนมัติได้ ${result.totalScore}/${result.totalMax} คะแนน (K ${result.kScore}/${result.kMax}, P ${result.pScore}/${result.pMax})${
    result.needsManualReviewCount > 0 ? ` · รอครูตรวจเพิ่ม ${result.needsManualReviewCount} ข้อ` : ''
  }`;
  return {
    encodedData: JSON.stringify(payload),
    result,
    summaryComment,
  };
};

export const parseWorksheetSubmission = (contentData?: string): WorksheetSubmissionPayload | null => {
  if (!contentData || typeof contentData !== 'string') return null;
  const trimmed = contentData.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(trimmed) as Partial<WorksheetSubmissionPayload>;
    if (parsed && parsed.__kind === 'interactive_worksheet_v1' && parsed.answers && typeof parsed.answers === 'object') {
      return parsed as WorksheetSubmissionPayload;
    }
    return null;
  } catch {
    return null;
  }
};

/** ปรับสเกลคะแนน K/P ให้พอดีกับคะแนนเต็มที่ครูตั้งไว้บน Assignment (กรณีครูแก้ไขคะแนนเต็มทีหลัง) */
export const scaleWorksheetScoresToAssignment = (
  result: WorksheetGradingResult,
  assignmentKMax: number,
  assignmentPMax: number,
): { kScore: number; pScore: number } => {
  const kScore =
    assignmentKMax <= 0
      ? 0
      : result.kMax > 0
        ? Math.round((result.kScore / result.kMax) * assignmentKMax)
        : Math.round((result.totalScore / Math.max(1, result.totalMax)) * assignmentKMax);
  const pScore =
    assignmentPMax <= 0
      ? 0
      : result.pMax > 0
        ? Math.round((result.pScore / result.pMax) * assignmentPMax)
        : Math.round((result.totalScore / Math.max(1, result.totalMax)) * assignmentPMax);
  return {
    kScore: Math.max(0, Math.min(assignmentKMax, kScore)),
    pScore: Math.max(0, Math.min(assignmentPMax, pScore)),
  };
};
