import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  encodeWorksheetSubmission,
  followupAnswerKey,
  getShuffledBlocks,
  getWorksheetMaxScores,
  gradeInteractiveWorksheet,
  parseWorksheetSubmission,
  scaleWorksheetScoresToAssignment,
  validateWorksheetAnswers,
  type InteractiveWorksheetSpec,
  type WorksheetAnswerMap,
  type WorksheetBlockOrderItem,
} from '../src/utils/interactiveWorksheetEngine';
import {
  INTERACTIVE_WORKSHEET_TEMPLATES,
  getWorksheetTemplatesForClassroom,
} from '../src/data/interactiveWorksheetTemplates';
import { allClassrooms2569 } from '../src/data/students2569';
import {
  cacheGradesLocally,
  emptyIndicatorScore,
  getIndicators,
  loadGrades,
  loadManualAssessmentScores,
  type StudentGrade,
} from '../src/services/gradeService';
import { loadRoster } from '../src/services/rosterService';
import {
  autoGradeAllWorksheetSubmissions,
  createInteractiveWorksheetFromTemplate,
  evaluateWorksheetSubmissionForTeacher,
  getSubmissionsByAssignment,
  isInteractiveWorksheetPayload,
  purgeSubmissionBinaryCache,
  submitWork,
  validateSubmissionContent,
} from '../src/services/homeworkService';

const buildPerfectAnswers = (spec: InteractiveWorksheetSpec): WorksheetAnswerMap => {
  const answers: WorksheetAnswerMap = {};
  for (const item of spec.items) {
    if (item.kind === 'choice') {
      answers[item.id] = item.correctIndex;
    } else if (item.kind === 'followup') {
      for (const step of item.steps) {
        const key = followupAnswerKey(item.id, step.id);
        if (step.kind === 'choice') {
          answers[key] = step.correctIndex ?? 0;
        } else {
          answers[key] =
            step.acceptedAnswers?.[0] ||
            (step.acceptedKeywords ? step.acceptedKeywords.join(' ') : 'คำตอบทดสอบ');
        }
      }
    } else if (item.kind === 'block_order') {
      answers[item.id] = [...item.correctOrder];
    } else if (item.kind === 'match_group') {
      const mapping: Record<string, string> = {};
      for (const entry of item.items) {
        mapping[entry.id] = entry.correctGroupId;
      }
      answers[item.id] = mapping;
    } else if (item.kind === 'short_answer') {
      answers[item.id] =
        item.acceptedAnswers?.[0] ||
        (item.acceptedKeywords ? item.acceptedKeywords.join(' ') : 'คำตอบทดสอบ');
    }
  }
  return answers;
};

describe('Interactive Worksheet Templates (ป.1–ม.3)', () => {
  it('covers every grade level from ป.1 to ม.3 with unique IDs and valid indicators', () => {
    expect(INTERACTIVE_WORKSHEET_TEMPLATES.length).toBeGreaterThanOrEqual(20);
    const seenIds = new Set<string>();

    for (const classroom of allClassrooms2569) {
      const list = getWorksheetTemplatesForClassroom(classroom);
      expect(list.length, `missing templates for ${classroom}`).toBeGreaterThanOrEqual(2);
    }

    for (const tpl of INTERACTIVE_WORKSHEET_TEMPLATES) {
      expect(seenIds.has(tpl.id), `duplicate template id ${tpl.id}`).toBe(false);
      seenIds.add(tpl.id);

      const validInds = getIndicators(tpl.classroom, tpl.subject);
      expect(
        validInds.some((ind) => ind.id === tpl.indicatorId),
        `invalid indicatorId ${tpl.indicatorId} for ${tpl.classroom}/${tpl.subject}`,
      ).toBe(true);

      const max = getWorksheetMaxScores(tpl.spec);
      expect(max.kMax, `${tpl.id} K score`).toBe(5);
      expect(max.pMax, `${tpl.id} P score`).toBe(5);
      expect(max.totalMax, `${tpl.id} total score`).toBe(10);

      // Zero disallowed emojis in U+1FA70–U+1FAFF
      const serialized = JSON.stringify(tpl);
      expect(/[\u{1FA70}-\u{1FAFF}]/u.test(serialized), `disallowed emoji in ${tpl.id}`).toBe(false);
    }
  });

  it('validates internal structure and grades 100% with perfect answers for every template', () => {
    for (const tpl of INTERACTIVE_WORKSHEET_TEMPLATES) {
      for (const item of tpl.spec.items) {
        if (item.kind === 'choice') {
          expect(item.correctIndex).toBeGreaterThanOrEqual(0);
          expect(item.correctIndex).toBeLessThan(item.options.length);
        } else if (item.kind === 'block_order') {
          const ids = new Set(item.blocks.map((b) => b.id));
          expect(item.correctOrder.length).toBe(item.blocks.length);
          for (const id of item.correctOrder) {
            expect(ids.has(id)).toBe(true);
          }
          // No step-number spoiler icons like 1️⃣ 2️⃣ 3️⃣
          for (const b of item.blocks) {
            expect(/[1-9]\uFE0F?\u20E3/.test(b.icon || ''), `spoiler icon in ${tpl.id}/${item.id}`).toBe(false);
          }
        } else if (item.kind === 'match_group') {
          const grpIds = new Set(item.groups.map((g) => g.id));
          for (const entry of item.items) {
            expect(grpIds.has(entry.correctGroupId)).toBe(true);
          }
        } else if (item.kind === 'followup') {
          expect(item.steps.length).toBeGreaterThanOrEqual(2);
        }
      }

      const perfect = buildPerfectAnswers(tpl.spec);
      const validation = validateWorksheetAnswers(tpl.spec, perfect);
      expect(validation.valid, `${tpl.id} missing: ${validation.missingLabels.join(', ')}`).toBe(true);

      const graded = gradeInteractiveWorksheet(tpl.spec, perfect);
      expect(graded.totalScore, `${tpl.id} totalScore`).toBe(10);
      expect(graded.kScore, `${tpl.id} kScore`).toBe(5);
      expect(graded.pScore, `${tpl.id} pScore`).toBe(5);
      expect(graded.percent, `${tpl.id} percent`).toBe(100);
    }
  });
});

describe('Interactive Worksheet Engine', () => {
  it('deterministically shuffles blocks and avoids identity order for >= 2 blocks', () => {
    const item: WorksheetBlockOrderItem = {
      id: 'seed-test-1',
      kind: 'block_order',
      domain: 'p',
      points: 4,
      prompt: 'เรียงลำดับ',
      blocks: [
        { id: 'b1', label: 'A' },
        { id: 'b2', label: 'B' },
        { id: 'b3', label: 'C' },
        { id: 'b4', label: 'D' },
      ],
      correctOrder: ['b1', 'b2', 'b3', 'b4'],
    };
    const s1 = getShuffledBlocks(item);
    const s2 = getShuffledBlocks(item);
    expect(s1.map((b) => b.id)).toEqual(s2.map((b) => b.id));
    expect(s1.map((b) => b.id)).not.toEqual(item.blocks.map((b) => b.id));
  });

  it('grades partial credit, keyword short answers, and scales scores cleanly', () => {
    const spec: InteractiveWorksheetSpec = {
      version: 1,
      items: [
        {
          id: 'q1',
          kind: 'block_order',
          domain: 'p',
          points: 4,
          prompt: 'เรียงลำดับ',
          blocks: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
            { id: 'c', label: 'C' },
            { id: 'd', label: 'D' },
          ],
          correctOrder: ['a', 'b', 'c', 'd'],
        },
        {
          id: 'q2',
          kind: 'short_answer',
          domain: 'k',
          points: 2,
          prompt: 'คำสั่งแสดงผลใน Python',
          acceptedAnswers: ['print', 'print()'],
        },
        {
          id: 'q3',
          kind: 'short_answer',
          domain: 'k',
          points: 2,
          prompt: 'อธิบายเหตุผลเปิด',
        },
      ],
    };

    const res = gradeInteractiveWorksheet(spec, {
      q1: ['a', 'b', 'd', 'c'], // 2/4 positions correct => 2 pts
      q2: '  PRINT()  ', // normalized exact match => 2 pts
      q3: 'เพราะช่วยประหยัดเวลา', // open-ended => flagged manual review
    });
    expect(res.pScore).toBe(2);
    expect(res.kScore).toBe(2);
    expect(res.needsManualReviewCount).toBe(1);

    const scaled = scaleWorksheetScoresToAssignment(res, 10, 10);
    expect(scaled.kScore).toBe(5);
    expect(scaled.pScore).toBe(5);
  });

  it('round-trips JSON payload and rejects binary image Data URLs', () => {
    const tpl = INTERACTIVE_WORKSHEET_TEMPLATES[0];
    const perfect = buildPerfectAnswers(tpl.spec);
    const { encodedData } = encodeWorksheetSubmission(tpl.spec, perfect);
    const parsed = parseWorksheetSubmission(encodedData);
    expect(parsed?.__kind).toBe('interactive_worksheet_v1');
    expect(parsed?.templateId).toBe(tpl.id);
    expect(parseWorksheetSubmission('data:image/png;base64,iVBORw0KGgo=')).toBeNull();
  });
});

describe('HomeworkService Interactive Worksheet Integration & Auto-Grading', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => {
        store.clear();
      },
    });
  });

  it('publishes worksheet, submits JSON answers, survives binary purge, ignores tampered scores, and cuts grades into ปพ.5', async () => {
    const tpl = INTERACTIVE_WORKSHEET_TEMPLATES.find((t) => t.classroom === 'ป.4')!;
    const roster = loadRoster('ป.4');
    expect(roster.length).toBeGreaterThan(0);
    const student = roster[0];

    // Seed classroom GradeBook (ปพ.5) like the app does when opening GradeBook
    const indicators = getIndicators('ป.4', tpl.subject);
    const initialGrades: StudentGrade[] = roster.map((r) => ({
      studentCode: r.studentCode,
      classroom: 'ป.4',
      studentNo: r.no,
      name: r.name,
      emoji: '👤',
      indicators: Object.fromEntries(
        indicators.map((ind) => [ind.id, { ...emptyIndicatorScore(ind.maxScore), webK: 0, webPScore: 0 }]),
      ),
      updatedAt: Date.now(),
    }));
    cacheGradesLocally('ป.4', initialGrades, tpl.subject);

    const assignment = await createInteractiveWorksheetFromTemplate(tpl);
    expect(assignment.interactiveWorksheet?.templateId).toBe(tpl.id);
    expect(assignment.knowledgeMaxScore).toBe(5);
    expect(assignment.practiceMaxScore).toBe(5);

    const answers = buildPerfectAnswers(tpl.spec);
    // Deliberately break one K item (followup step) to test real scoring (not 10/10) and tamper with previewResult
    const firstFollowup = tpl.spec.items.find((it) => it.kind === 'followup');
    expect(firstFollowup).toBeDefined();
    if (firstFollowup && firstFollowup.kind === 'followup') {
      const step = firstFollowup.steps[0];
      const key = followupAnswerKey(firstFollowup.id, step.id);
      answers[key] = ((step.correctIndex ?? 0) + 1) % (step.options?.length || 2);
    }

    const { encodedData, summaryComment } = encodeWorksheetSubmission(tpl.spec, answers);
    const tamperedPayload = JSON.parse(encodedData);
    tamperedPayload.previewResult = {
      totalScore: 999,
      totalMax: 10,
      kScore: 999,
      kMax: 5,
      pScore: 999,
      pMax: 5,
      percent: 999,
    };
    const tamperedString = JSON.stringify(tamperedPayload);

    expect(
      isInteractiveWorksheetPayload({
        submissionMethod: 'interactive_worksheet',
        contentData: tamperedString,
      }),
    ).toBe(true);
    expect(
      isInteractiveWorksheetPayload({
        submissionMethod: 'interactive_worksheet',
        contentData: 'data:image/jpeg;base64,AAAA',
      }),
    ).toBe(false);

    const validCheck = validateSubmissionContent({
      submissionMethod: 'interactive_worksheet',
      contentData: tamperedString,
      comment: summaryComment,
    });
    expect(validCheck.valid).toBe(true);

    const sub = await submitWork({
      assignmentId: assignment.id,
      studentId: student.studentCode,
      studentName: student.name,
      classroom: 'ป.4',
      studentNo: student.no,
      contentData: tamperedString,
      submissionMethod: 'interactive_worksheet',
      comment: summaryComment,
    });
    expect(sub.submissionMethod).toBe('interactive_worksheet');
    expect(sub.contentData).toBe(tamperedString);
    expect(sub.score).toBeUndefined(); // Students cannot write official scores directly

    // Binary cache purge must NOT delete interactive worksheet JSON answers
    await purgeSubmissionBinaryCache(false);
    const afterPurge = getSubmissionsByAssignment(assignment.id)[0];
    expect(afterPurge.contentData).toBe(tamperedString);

    // Deterministic teacher evaluation ignores tampered previewResult
    const evaluated = evaluateWorksheetSubmissionForTeacher(assignment, afterPurge);
    expect(evaluated).not.toBeNull();
    expect(evaluated!.scaledTotal).toBeLessThan(10);
    expect(evaluated!.scaledK).toBeLessThan(5);
    expect(evaluated!.scaledP).toBe(5);

    // 1-click batch auto-grade cuts scores into submission + GradeBook (ปพ.5)
    const batch = await autoGradeAllWorksheetSubmissions(assignment.id, { onlyUnreviewed: true });
    expect(batch.gradedCount).toBe(1);
    expect(batch.failedCount).toBe(0);

    const reviewedSub = getSubmissionsByAssignment(assignment.id)[0];
    expect(reviewedSub.reviewedAt).toBeDefined();
    expect(reviewedSub.score).toBe(evaluated!.scaledTotal);
    expect(reviewedSub.kScore).toBe(evaluated!.scaledK);
    expect(reviewedSub.pScore).toBe(evaluated!.scaledP);

    const manualScores = loadManualAssessmentScores('ป.4', tpl.subject);
    expect(manualScores[assignment.linkedKnowledgeAssessmentId!]?.[student.studentCode]).toBe(
      evaluated!.scaledK,
    );
    expect(manualScores[assignment.linkedPracticeAssessmentId!]?.[student.studentCode]).toBe(
      evaluated!.scaledP,
    );

    const grades = loadGrades('ป.4', tpl.subject);
    const studentGrade = grades.find((g) => g.studentCode === student.studentCode);
    expect(studentGrade).toBeDefined();
    const indScore = studentGrade!.indicators[tpl.indicatorId];
    expect(indScore.k).toBeGreaterThan(0);
    expect(indScore.pScore || 0).toBeGreaterThan(0);
  });
});
