import { describe, expect, it } from 'vitest';
import {
  TYCOON_BOARD,
  TYCOON_CHARACTERS,
  countCompletedPropertyGroups,
  getTycoonCharacter,
  propertyRent,
  propertyUpgradeCost,
  propertyUpgradeInvestment,
  tileGridPos,
} from '../src/data/tycoonGame';

describe('computing tycoon rules', () => {
  it('keeps all 28 board positions unique on the perimeter', () => {
    const positions = TYCOON_BOARD.map((_, index) => tileGridPos(index).join(','));

    expect(TYCOON_BOARD).toHaveLength(28);
    expect(new Set(positions).size).toBe(28);
    expect(positions.every((position) => {
      const [row, column] = position.split(',').map(Number);
      return row === 1 || row === 8 || column === 1 || column === 8;
    })).toBe(true);
  });

  it('calculates the three upgrade levels and invested value', () => {
    expect(propertyUpgradeCost(1, 0)).toBe(210);
    expect(propertyUpgradeCost(1, 1)).toBe(300);
    expect(propertyUpgradeCost(1, 2)).toBe(390);
    expect(propertyUpgradeCost(1, 3)).toBe(0);
    expect(propertyUpgradeInvestment(1, 3)).toBe(900);
  });

  it('increases rent for a complete group and upgraded property', () => {
    expect(propertyRent(1, 0, false)).toBe(120);
    expect(propertyRent(1, 0, true)).toBe(240);
    expect(propertyRent(1, 3, true)).toBe(672);
    expect(propertyRent(0, 3, true)).toBe(0);
  });

  it('counts only fully owned property groups', () => {
    expect(countCompletedPropertyGroups([1])).toBe(0);
    expect(countCompletedPropertyGroups([1, 3])).toBe(1);
    expect(countCompletedPropertyGroups([1, 3, 5, 6, 8, 10])).toBe(3);
  });

  it('provides eight distinct playable characters with local sprite assets', () => {
    expect(TYCOON_CHARACTERS).toHaveLength(8);
    expect(new Set(TYCOON_CHARACTERS.map((character) => character.id)).size).toBe(8);
    expect(new Set(TYCOON_CHARACTERS.map((character) => character.image)).size).toBe(8);
    expect(TYCOON_CHARACTERS.every((character) => (
      character.image.startsWith('/media/games/tycoon-characters/')
      && character.image.endsWith('.webp')
    ))).toBe(true);
  });

  it('falls back to the first character when a saved character no longer exists', () => {
    expect(getTycoonCharacter('missing-character')).toEqual(TYCOON_CHARACTERS[0]);
  });
});
