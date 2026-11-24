import { describe, expect, it, beforeEach, vi } from 'vitest';
import type { StudentProgressData } from '../src/services/progressService';

const progressState = vi.hoisted(() => ({
  items: [] as StudentProgressData[],
}));

vi.mock('../src/services/progressService', () => ({
  getAllCachedProgress: () => structuredClone(progressState.items),
  fetchAllProgressFromFirebase: async () => structuredClone(progressState.items),
}));

import {
  isAssignmentPublishedForStudents,
  formatMissingStudentsMessage,
  type Assignment,
} from '../src/services/homeworkService';
import {
  initClassroom,
  loadGrades,
  syncAllFromProgress,
} from '../src/services/gradeService';

const storage = new Map<string, string>();
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => { storage.set(key, String(value)); },
    removeItem: (key: string) => { storage.delete(key); },
    clear: () => { storage.clear(); },
    key: (index: number) => Array.from(storage.keys())[index] ?? null,
    get length() { return storage.size; },
  },
  configurable: true,
});

const makeAssignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: 'hw_test_1',
  title: 'ใบงานอัลกอริทึม',
  description: 'ออกแบบขั้นตอนการชงโกโก้',
  classroom: 'ป.1',
  dueDate: '2026-12-01',
  maxScore: 10,
  category: 'k',
  createdAt: 1700000000000,
  ...overrides,
});

describe('System upgrade regression checks (Items 1-3)', () => {
  beforeEach(() => {
    localStorage.clear();
    progressState.items = [];
  });

  it('hides system-seed-2569 draft assignments from students unless explicitly published', () => {
    const seededDefault = makeAssignment({ createdBy: 'system-seed-2569' });
    const seededPublished = makeAssignment({ createdBy: 'system-seed-2569', isDraft: false });
    const teacherDraft = makeAssignment({ createdBy: 'teacher', isDraft: true });
    const teacherNormal = makeAssignment({ createdBy: 'teacher' });

    expect(isAssignmentPublishedForStudents(seededDefault)).toBe(false);
    expect(isAssignmentPublishedForStudents(seededPublished)).toBe(true);
    expect(isAssignmentPublishedForStudents(teacherDraft)).toBe(false);
    expect(isAssignmentPublishedForStudents(teacherNormal)).toBe(true);
  });

  it('formats missing students list clearly for chat groups', () => {
    const msg = formatMissingStudentsMessage(makeAssignment({ classroom: 'ป.1' }));
    expect(msg).toContain('ใบงานอัลกอริทึม');
    expect(msg).toContain('ป.1');
    expect(msg).toContain('ยังไม่ส่ง');
  });

  it('caps slide-only P score at 12/30 while letting practice/games reach full 30/30', () => {
    initClassroom('ป.1', 'main');
    const roster = loadGrades('ป.1', 'main');
    const student = roster[0];
    expect(student).toBeDefined();

    const studentId = `ป.1_${student.studentNo}_${student.name.replace(/\s/g, '')}`;
    const slideOnlyEvidence = Array.from({ length: 25 }, (_, i) => ({
      key: `slide:${i}`,
      type: 'slide' as const,
      detail: `สไลด์ ${i + 1}`,
      basePoints: 1,
      inClass: true,
      timestamp: 0,
    }));

    const prog: StudentProgressData = {
      studentId,
      units: {
        p1_1: {
          gradeId: 'p1',
          unitNo: 1,
          slidesViewed: Array.from({ length: 25 }, (_, i) => i),
          totalSlides: 25,
          videosClicked: [],
          articlesClicked: [],
          funClicked: [],
          practiceCompleted: [],
          scoreEvidence: slideOnlyEvidence,
          inClassDays: [],
          quizAttempts: 0,
          bestQuizScore: 0,
          bestQuizMax: 0,
          lastVisit: Date.now(),
          completionPct: 40,
        },
      },
      activities: [],
      quizHistory: [],
      inClassDays: [],
      bonuses: [],
    };
    progressState.items = [prog];

    const report1 = syncAllFromProgress('ป.1', 'main');
    expect(report1.studentsUpdated).toBeGreaterThanOrEqual(1);
    const afterSlides = loadGrades('ป.1', 'main').find((s) => s.studentCode === student.studentCode);
    const linkedInd = Object.values(afterSlides!.indicators).find((ind) => ind.webPScore !== undefined);
    expect(linkedInd?.webPScore).toBe(12);

    // เพิ่มกิจกรรมปฏิบัติ 4 ชิ้น (+20 คะแนน) -> รวมกับสไลด์ 12 คะแนน ต้องชนเพดาน 30 คะแนน
    prog.units.p1_1.scoreEvidence = [
      ...slideOnlyEvidence,
      ...Array.from({ length: 4 }, (_, i) => ({
        key: `practice:${i}`,
        type: 'practice' as const,
        detail: `ฝึกปฏิบัติ ${i + 1}`,
        basePoints: 5,
        inClass: true,
        timestamp: 0,
      })),
    ];
    prog.units.p1_1.practiceCompleted = ['p1', 'p2', 'p3', 'p4'];
    progressState.items = [prog];
    syncAllFromProgress('ป.1', 'main');
    const afterPractice = loadGrades('ป.1', 'main').find((s) => s.studentCode === student.studentCode);
    const linkedIndAfter = Object.values(afterPractice!.indicators).find((ind) => ind.webPScore !== undefined);
    expect(linkedIndAfter?.webPScore).toBe(30);
  });
});
