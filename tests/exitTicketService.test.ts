import { describe, expect, it, beforeEach } from 'vitest';
import {
  submitExitTicket,
  hasStudentSubmittedToday,
  loadLocalExitTickets,
  getExitTicketSummary,
  formatExitTicketNarrative,
  MOOD_LABELS,
  type ExitTicket,
} from '../src/services/exitTicketService';

const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, val: string) => store.set(key, String(val)),
  removeItem: (key: string) => store.delete(key),
  clear: () => store.clear(),
};
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, configurable: true });

describe('Exit Ticket Service', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('calculates earnedScoreA correctly according to self-score stars', async () => {
    const t1 = await submitExitTicket({
      studentId: 'std_001',
      studentName: 'สมชาย ใจดี',
      classroom: 'ป.1',
      studentNumber: '1',
      subject: 'main',
      date: '2026-09-08',
      mood: 'great',
      learnedKeyword: 'เข้าใจขั้นตอนอัลกอริทึม',
      selfScore: 5,
    });
    expect(t1.earnedScoreA).toBe(3);

    const t2 = await submitExitTicket({
      studentId: 'std_002',
      studentName: 'สมหญิง รักเรียน',
      classroom: 'ป.1',
      studentNumber: '2',
      subject: 'main',
      date: '2026-09-08',
      mood: 'good',
      learnedKeyword: 'เขียนโค้ดบล็อก',
      selfScore: 3,
    });
    expect(t2.earnedScoreA).toBe(2);

    const t3 = await submitExitTicket({
      studentId: 'std_003',
      studentName: 'มานะ พากเพียร',
      classroom: 'ป.1',
      studentNumber: '3',
      subject: 'main',
      date: '2026-09-08',
      mood: 'confused',
      learnedKeyword: 'จำสัญลักษณ์',
      selfScore: 2,
    });
    expect(t3.earnedScoreA).toBe(1);
  });

  it('rejects submissions from non-scoring / guest accounts', async () => {
    await expect(
      submitExitTicket({
        studentId: 'external_visitor_test_id',
        studentName: 'ผู้เยี่ยมชม',
        classroom: 'บุคคลภายนอก',
        studentNumber: '0',
        subject: 'main',
        date: '2026-09-08',
        mood: 'great',
        learnedKeyword: 'ทดสอบ',
        selfScore: 5,
      }),
    ).rejects.toThrow('ผู้ใช้ชั่วคราวไม่สามารถส่ง Exit Ticket บันทึกเกรดได้');

    await expect(
      submitExitTicket({
        studentId: 'admin_teacher_account',
        studentName: 'ครูเจมส์',
        classroom: 'ป.1',
        studentNumber: '0',
        subject: 'main',
        date: '2026-09-08',
        mood: 'great',
        learnedKeyword: 'ทดสอบครู',
        selfScore: 5,
      }),
    ).rejects.toThrow('ผู้ใช้ชั่วคราวไม่สามารถส่ง Exit Ticket บันทึกเกรดได้');
  });

  it('detects if student has submitted today', async () => {
    expect(hasStudentSubmittedToday('std_005', '2026-09-08')).toBe(false);

    await submitExitTicket({
      studentId: 'std_005',
      studentName: 'ชูใจ ใจงาม',
      classroom: 'ป.2',
      studentNumber: '5',
      subject: 'main',
      date: '2026-09-08',
      mood: 'good',
      learnedKeyword: 'แก้ปัญหาด้วยผังงาน',
      selfScore: 4,
    });

    expect(hasStudentSubmittedToday('std_005', '2026-09-08')).toBe(true);
    expect(hasStudentSubmittedToday('std_005', '2026-09-09')).toBe(false);
  });

  it('aggregates exit tickets into an insightful summary', () => {
    const mockTickets: ExitTicket[] = [
      {
        id: '1',
        studentId: 's1',
        studentName: 'กิตติ',
        classroom: 'ป.1',
        studentNumber: '1',
        subject: 'main',
        date: '2026-09-08',
        mood: 'great',
        learnedKeyword: 'อัลกอริทึม',
        questions: 'ตรงท่าทางถ้าหันซ้ายต้องกดอะไรครับ',
        selfScore: 5,
        earnedScoreA: 3,
        timestamp: 1000,
      },
      {
        id: '2',
        studentId: 's2',
        studentName: 'วีณา',
        classroom: 'ป.1',
        studentNumber: '2',
        subject: 'main',
        date: '2026-09-08',
        mood: 'great',
        learnedKeyword: 'อัลกอริทึม',
        selfScore: 5,
        earnedScoreA: 3,
        timestamp: 1001,
      },
      {
        id: '3',
        studentId: 's3',
        studentName: 'ชินวรณ์',
        classroom: 'ป.1',
        studentNumber: '3',
        subject: 'main',
        date: '2026-09-08',
        mood: 'good',
        learnedKeyword: 'ผังงาน',
        selfScore: 4,
        earnedScoreA: 3,
        timestamp: 1002,
      },
      {
        id: '4',
        studentId: 's4',
        studentName: 'ปาริฉัตร',
        classroom: 'ป.1',
        studentNumber: '4',
        subject: 'main',
        date: '2026-09-08',
        mood: 'confused',
        learnedKeyword: 'การดีบั๊ก',
        questions: 'ยังหา bug ไม่ค่อยเจอ',
        selfScore: 2,
        earnedScoreA: 1,
        timestamp: 1003,
      },
    ];

    const summary = getExitTicketSummary(mockTickets);
    expect(summary.total).toBe(4);
    expect(summary.averageStars).toBe(4.0); // (5+5+4+2)/4 = 4.0
    expect(summary.moodCounts.great).toBe(2);
    expect(summary.moodCounts.good).toBe(1);
    expect(summary.moodCounts.confused).toBe(1);
    expect(summary.moodCounts.tired).toBe(0);

    // Top learned keyword
    expect(summary.topLearned[0].keyword).toBe('อัลกอริทึม');
    expect(summary.topLearned[0].count).toBe(2);

    // Student questions
    expect(summary.questions.length).toBe(2);
    expect(summary.questions[0].studentName).toBe('กิตติ');
    expect(summary.questions[0].text).toBe('ตรงท่าทางถ้าหันซ้ายต้องกดอะไรครับ');
  });

  it('formats student reflection narrative for official post-teaching records', () => {
    const mockTickets: ExitTicket[] = [
      {
        id: '1',
        studentId: 's1',
        studentName: 'สมชาย',
        classroom: 'ป.1',
        studentNumber: '1',
        subject: 'main',
        date: '2026-09-08',
        mood: 'great',
        learnedKeyword: 'อัลกอริทึม',
        questions: 'อยากให้เล่นเกมอีกรอบครับ',
        selfScore: 5,
        earnedScoreA: 3,
        timestamp: 1000,
      },
    ];

    const summary = getExitTicketSummary(mockTickets);
    const narrative = formatExitTicketNarrative(summary);

    expect(narrative.summaryAddition).toContain('Exit Ticket');
    expect(narrative.summaryAddition).toContain('1 คน');
    expect(narrative.summaryAddition).toContain('5/5 ดาว');
    expect(narrative.problemsAddition).toContain('อยากให้เล่นเกมอีกรอบครับ');
  });

  it('verifies all mood labels and emojis exist', () => {
    expect(MOOD_LABELS.great.emoji).toBe('😄');
    expect(MOOD_LABELS.good.emoji).toBe('🙂');
    expect(MOOD_LABELS.confused.emoji).toBe('🤔');
    expect(MOOD_LABELS.tired.emoji).toBe('😴');
  });
});
