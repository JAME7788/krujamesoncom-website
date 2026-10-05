import { describe, expect, it } from 'vitest';
import {
  CT_PILLARS,
  calculateStudentCtProfile,
} from '../src/services/computationalThinkingService';
import { gamesCatalog } from '../src/data/gamesCatalog';

describe('Computational Thinking (CT) 4 Pillars Service', () => {
  it('covers 4 fundamental pillars with non-empty game mappings', () => {
    const keys = Object.keys(CT_PILLARS);
    expect(keys).toEqual(['decomposition', 'pattern', 'abstraction', 'algorithm']);

    keys.forEach((key) => {
      const p = CT_PILLARS[key as keyof typeof CT_PILLARS];
      expect(p.name).toBeDefined();
      expect(p.emoji).toBeDefined();
      expect(p.color).toBeDefined();
      expect(p.gameIds.length).toBeGreaterThan(0);
    });
  });

  it('calculates student CT profile with realistic scores, levels, and recommendation', () => {
    const profile = calculateStudentCtProfile('student_p1_01', 'ป.1');

    expect(profile.studentId).toBe('student_p1_01');
    expect(profile.overallScore).toBeGreaterThanOrEqual(10);
    expect(profile.overallScore).toBeLessThanOrEqual(100);

    // Pillars
    expect(profile.pillars.decomposition).toBeDefined();
    expect(profile.pillars.pattern).toBeDefined();
    expect(profile.pillars.abstraction).toBeDefined();
    expect(profile.pillars.algorithm).toBeDefined();

    // Recommendation
    expect(profile.recommendedPillar).toBeDefined();
    expect(profile.recommendedGameId).toBeDefined();
    const game = gamesCatalog.find((g) => g.id === profile.recommendedGameId);
    expect(game).toBeDefined();
  });

  it('correctly maps any game ID to its corresponding CT pillar', async () => {
    const { getPillarForGameId } = await import('../src/services/computationalThinkingService');
    const pcBuilderPillar = getPillarForGameId('pc-builder');
    expect(pcBuilderPillar.id).toBe('decomposition');

    const patternPillar = getPillarForGameId('pattern');
    expect(patternPillar.id).toBe('pattern');

    const binaryPillar = getPillarForGameId('binary');
    expect(binaryPillar.id).toBe('abstraction');

    const algorithmRunnerPillar = getPillarForGameId('algorithm-runner-3d');
    expect(algorithmRunnerPillar.id).toBe('algorithm');

    // Unknown defaults gracefully to algorithm
    const unknownPillar = getPillarForGameId('non-existent-game-xyz');
    expect(unknownPillar.id).toBe('algorithm');
  });

  it('safely handles speech service functions without throwing in node/jsdom environment', async () => {
    const { isSpeechSupported, speakThai, stopSpeech } = await import('../src/utils/speechService');
    expect(typeof isSpeechSupported()).toBe('boolean');
    // If window.speechSynthesis does not exist in testing environment, returns false gracefully
    const speakResult = speakThai('ทดสอบเสียง');
    expect(typeof speakResult).toBe('boolean');
    expect(() => stopSpeech()).not.toThrow();
  });
});

