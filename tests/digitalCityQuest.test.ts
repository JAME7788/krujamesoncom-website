import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DIGITAL_CITY_BOARD,
  DIGITAL_CITY_EVENTS,
  DIGITAL_CITY_QUESTIONS,
  LITERACY_DOMAINS,
} from '../src/data/digitalCityQuest';

const pageSource = readFileSync('src/pages/games/DigitalCityQuestGame.tsx', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const catalogSource = readFileSync('src/data/gamesCatalog.ts', 'utf8');

describe('Digital City Quest competition content', () => {
  it('contains 12 linked missions with three ordered questions each', () => {
    const missionIds = [...new Set(DIGITAL_CITY_QUESTIONS.map((question) => question.missionId))];
    expect(missionIds).toHaveLength(12);
    expect(DIGITAL_CITY_QUESTIONS).toHaveLength(36);
    missionIds.forEach((missionId) => {
      const stages = DIGITAL_CITY_QUESTIONS
        .filter((question) => question.missionId === missionId)
        .map((question) => question.stage)
        .sort();
      expect(stages).toEqual([1, 2, 3]);
    });
  });

  it('covers all five literacy domains and has valid answer choices', () => {
    const domains = new Set(DIGITAL_CITY_QUESTIONS.map((question) => question.domain));
    expect(domains).toEqual(new Set(Object.keys(LITERACY_DOMAINS)));
    DIGITAL_CITY_QUESTIONS.forEach((question) => {
      expect(question.choices).toHaveLength(3);
      expect(new Set(question.choices).size).toBe(3);
      expect(question.answer).toBeGreaterThanOrEqual(0);
      expect(question.answer).toBeLessThan(question.choices.length);
      expect(question.stimulus.length).toBeGreaterThan(30);
      expect(question.why.length).toBeGreaterThan(20);
      expect(question.competency.length).toBeGreaterThan(8);
    });
  });

  it('uses a complete 28-space city board and decision cards with consequences', () => {
    expect(DIGITAL_CITY_BOARD).toHaveLength(28);
    expect(DIGITAL_CITY_BOARD.filter((tile) => tile.kind === 'property').length).toBeGreaterThanOrEqual(14);
    expect(DIGITAL_CITY_EVENTS.length).toBeGreaterThanOrEqual(6);
    DIGITAL_CITY_EVENTS.forEach((event) => {
      expect(event.choices).toHaveLength(2);
      expect(event.choices.some((choice) => choice.evidence > 0 || choice.strategy > 0)).toBe(true);
      expect(event.choices.every((choice) => choice.result.length > 15)).toBe(true);
    });
  });

  it('keeps the classic game and registers the new route separately', () => {
    expect(appSource).toContain('path="/games/tycoon"');
    expect(appSource).toContain('path="/games/digital-city-quest"');
    expect(catalogSource).toContain("id: 'tycoon'");
    expect(catalogSource).toContain("id: 'digital-city-quest'");
  });

  it('includes multiplayer support, live K/P/A, qualification, export, and reflection', () => {
    expect(pageSource).toContain('supportDigitalCityTurn');
    expect(pageSource).toContain('คะแนนสมรรถนะ K/P/A');
    expect(pageSource).toContain('accuracy >= 0.6');
    expect(pageSource).toContain('masteredDomains >= 3');
    expect(pageSource).toContain('Export K/P/A');
    expect(pageSource).toContain('สะท้อนคิดหลังภารกิจ');
  });
});
