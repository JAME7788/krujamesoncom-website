import { describe, expect, it } from 'vitest';
import { toPublicLiveQuizRoom, type LiveQuizRoom } from '../src/services/liveQuizService';

const room = (state: LiveQuizRoom['state']): LiveQuizRoom => ({
  code: '123456',
  title: 'Security test',
  hostId: 'teacher',
  state,
  currentQuestion: 0,
  createdAt: 1,
  questionStartedAt: 1,
  revealedAnswer: 1,
  questions: [{
    q: 'คำตอบใดถูกต้อง',
    options: ['ก', 'ข', 'ค', 'ง'],
    answer: 1,
    bankId: 'bank-secret',
  }],
  players: {
    student1: {
      id: 'student1',
      name: 'นักเรียน',
      emoji: '🧑‍🎓',
      score: 990,
      joinedAt: 1,
      answers: { 0: { choice: 1, correct: true, time: 100 } },
    },
  },
});

describe('Live Quiz public room security', () => {
  it('does not expose answer keys, bank ids, correctness, scores, or reveal before reveal', () => {
    const publicRoom = toPublicLiveQuizRoom(room('question'));
    expect(publicRoom.questions[0]).not.toHaveProperty('answer');
    expect(publicRoom.questions[0]).not.toHaveProperty('bankId');
    expect(publicRoom.players.student1.score).toBe(0);
    expect(publicRoom.players.student1.answers[0]).not.toHaveProperty('correct');
    expect(publicRoom).not.toHaveProperty('revealedAnswer');
  });

  it('publishes only the current revealed answer and results during reveal', () => {
    const publicRoom = toPublicLiveQuizRoom(room('reveal'));
    expect(publicRoom.revealedAnswer).toBe(1);
    expect(publicRoom.players.student1.score).toBe(990);
    expect(publicRoom.players.student1.answers[0].correct).toBe(true);
    expect(publicRoom.questions[0]).not.toHaveProperty('answer');
  });

  it('removes the transient revealed answer when the quiz is finished', () => {
    const publicRoom = toPublicLiveQuizRoom(room('finished'));
    expect(publicRoom).not.toHaveProperty('revealedAnswer');
  });
});
