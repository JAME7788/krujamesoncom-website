import { describe, expect, it } from 'vitest';
import {
  getGameJourneyProfile,
  getLearningStarCount,
  getReflectionPrompts,
} from '../src/utils/gameLearningPersonalization';

describe('personalized game learning journey', () => {
  it('starts a new learner with foundation mode', () => {
    const profile = getGameJourneyProfile([], 'binary');
    expect(profile.stage).toBe('first');
    expect(profile.recommendedMode).toBe('foundation');
  });

  it('recommends challenge after a successful foundation reflection', () => {
    const profile = getGameJourneyProfile([
      { gameId: 'binary', challengeMode: false, questionAnswered: true },
    ], 'binary');
    expect(profile.stage).toBe('growing');
    expect(profile.recommendedMode).toBe('challenge');
  });

  it('recognizes repeated learning with at least one challenge attempt', () => {
    const profile = getGameJourneyProfile([
      { gameId: 'binary', challengeMode: false, questionAnswered: true },
      { gameId: 'binary', challengeMode: true, questionAnswered: true },
      { gameId: 'binary', challengeMode: true, questionAnswered: true },
      { gameId: 'memory', challengeMode: true, questionAnswered: true },
    ], 'binary');
    expect(profile.stage).toBe('mastery');
    expect(profile.message).toContain('3 ครั้ง');
  });

  it('awards stars only for observable learning steps', () => {
    expect(getLearningStarCount(false, false, '')).toBe(0);
    expect(getLearningStarCount(true, false, '')).toBe(1);
    expect(getLearningStarCount(true, true, 'ฉันลองใหม่')).toBe(3);
  });

  it('uses shorter reflection scaffolds for lower primary learners', () => {
    expect(getReflectionPrompts('ป.1-3', false)).toContain('ฉันทำทีละขั้น');
    expect(getReflectionPrompts('ม.1-3', true)).toContain('ฉันใช้หลักฐานตัดสินใจ');
  });
});
