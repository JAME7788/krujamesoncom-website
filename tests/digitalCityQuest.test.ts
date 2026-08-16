import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  DIGITAL_CITY_BOARD,
  DIGITAL_CITY_EVENTS,
  DIGITAL_CITY_QUESTIONS,
  LITERACY_DOMAINS,
  selectDigitalCityQuestion,
  shuffleDigitalCityQuestion,
} from '../src/data/digitalCityQuest';

const pageSource = readFileSync('src/pages/games/DigitalCityQuestGame.tsx', 'utf8');
const appSource = readFileSync('src/App.tsx', 'utf8');
const catalogSource = readFileSync('src/data/gamesCatalog.ts', 'utf8');
const multiplayerSource = readFileSync('src/services/tycoonMultiplayerService.ts', 'utf8');
const pageCss = readFileSync('src/pages/games/DigitalCityQuestGame.css', 'utf8');

describe('Digital City Quest competition content', () => {
  it('keeps character names in a separate column from the avatar', () => {
    expect(pageCss).toContain('grid-template-columns: 72px minmax(0, 1fr)');
    expect(pageCss).toContain('grid-column: 2');
    expect(pageCss).toContain('box-sizing: border-box');
  });

  it('contains 30 linked missions and 90 unique questions', () => {
    const missionIds = [...new Set(DIGITAL_CITY_QUESTIONS.map((question) => question.missionId))];
    expect(missionIds).toHaveLength(30);
    expect(DIGITAL_CITY_QUESTIONS).toHaveLength(90);
    expect(new Set(DIGITAL_CITY_QUESTIONS.map((question) => question.id)).size).toBe(90);
    expect(new Set(DIGITAL_CITY_QUESTIONS.map((question) => question.q)).size).toBe(90);
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
    Object.keys(LITERACY_DOMAINS).forEach((domain) => {
      expect(DIGITAL_CITY_QUESTIONS.filter((question) => question.domain === domain)).toHaveLength(18);
    });
  });

  it('does not serve a used question or mission start to the next player', () => {
    const first = selectDigitalCityQuestion({}, {}, [], () => 0.12);
    const second = selectDigitalCityQuestion({}, {}, [first.id], () => 0.12);
    expect(second.id).not.toBe(first.id);
    expect(second.missionId).not.toBe(first.missionId);
    expect(second.stage).toBe(1);

    const continuation = selectDigitalCityQuestion(
      { [first.missionId]: 1 },
      {},
      [first.id, second.id],
      () => 0.32,
    );
    expect(continuation.missionId).toBe(first.missionId);
    expect(continuation.stage).toBe(2);
  });

  it('shuffles choices while preserving the correct answer', () => {
    const original = DIGITAL_CITY_QUESTIONS[0];
    const shuffled = shuffleDigitalCityQuestion(original, () => 0);
    expect(shuffled.choices).not.toEqual(original.choices);
    expect(shuffled.choices[shuffled.answer]).toBe(original.choices[original.answer]);
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
    expect(pageSource).toContain('rememberQuestion(nextQuestion)');
    expect(pageSource).toContain('usedQuestionIds');
    expect(multiplayerSource).toContain('usedQuestionIds?: string[]');
  });

  it('keeps every popup inside the game root in normal and fullscreen modes', () => {
    expect(pageSource).toContain('const [modalRoot, setModalRoot] = useState<HTMLElement | null>(null)');
    expect(pageSource).toContain('ref={setModalRoot} className="game-page dcq-page dcq-playing-page"');
    expect(pageSource).toContain('modalRoot?.requestFullscreen()');
    expect(pageSource).not.toContain('document.fullscreenElement || document.body');
  });

  it('fits the complete board into the remaining desktop viewport height', () => {
    expect(pageCss).toContain('flex-direction: column');
    expect(pageCss).toContain('height: 100dvh');
    expect(pageCss).toContain('flex: 1 1 0');
    expect(pageCss).toContain('.dcq-page:fullscreen .dcq-board-shell');
    expect(pageCss).not.toContain('height: calc(100vh - 260px)');
  });

  it('carries the arcade reveal, dice burst, movement, and active-player effects', () => {
    expect(pageSource).toContain('dcq-player-reveal');
    expect(pageSource).toContain('dcq-roll-fx');
    expect(pageSource).toContain('dcq-flying-dice');
    expect(pageSource).toContain('dcq-step-fx');
    expect(pageSource).toContain("' current'");
    expect(pageSource).toContain('setShowPlayerReveal(false), 2_250');
    expect(pageSource).toContain('showPlayerReveal && <div className="dcq-player-reveal"');
    expect(pageCss).toContain('.dcq-playing-page > .dcq-player-reveal');
  });

  it('shows queued effects for economy, learning, building, dice, map, and victory events', () => {
    expect(pageSource).toContain("queueImpact('pay'");
    expect(pageSource).toContain("queueImpact('earn'");
    expect(pageSource).toContain("queueImpact('build'");
    expect(pageSource).toContain("queueImpact('upgrade'");
    expect(pageSource).toContain('dcq-roll-result');
    expect(pageSource).toContain('dcq-map-fx');
    expect(pageSource).toContain('dcq-victory-rays');
    expect(pageCss).toContain('.dcq-playing-page > .dcq-impact-fx');
  });

  it('includes a seven-step visual tutorial that can be reopened during play', () => {
    expect(pageSource).toContain("type TutorialStepId = 'setup' | 'roll' | 'question' | 'economy' | 'project' | 'team' | 'victory'");
    expect(pageSource).toContain('const TUTORIAL_STEPS: TutorialStep[]');
    expect(pageSource).toContain('คู่มือภาพ 7 ขั้น');
    expect(pageSource).toContain('<TutorialVisual step={tutorial.id} />');
    expect(pageSource).toContain('ภาพจำลองจากหน้าจอเกมจริง');
    expect(pageSource).toContain('ตัวอย่าง: ทอยได้ 4');
    expect(pageSource).toContain('onClick={openTutorial}><BookOpen size={18} /> วิธีเล่น');
    expect(pageCss).toContain('.dcq-tutorial-modal { z-index: 13000; }');
    expect(pageCss).toContain("url('/media/games/tycoon-theme/pixel-tech-campus.webp')");
  });

  it('allows only one project upgrade per landing and exposes the score close button', () => {
    expect(pageSource).not.toContain('setUpgradeTile(buyTile)');
    expect(pageSource.match(/setUpgradeTile\(null\)/g)?.length).toBeGreaterThanOrEqual(3);
    expect(pageSource).toContain('aria-label="ปิดหน้าคะแนน"');
    expect(pageSource).toContain('กลับมาที่ช่องเดิมเพื่อพัฒนาได้ถึงขั้น 3');
  });
});
