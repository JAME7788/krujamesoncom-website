import { describe, expect, it } from 'vitest';
import { search } from '../src/services/searchService';
import { gamesCatalog } from '../src/data/gamesCatalog';

describe('global catalog search', () => {
  it.each(gamesCatalog)('finds $id at its registered route', game => {
    expect(search(game.title, 200).some(result => result.type === 'game' && result.url === game.path)).toBe(true);
  });
  it('trims query and searches game skills', () => {
    expect(search('  Python  ')).toEqual(search('Python'));
    expect(search('เขียนโปรแกรม', 200).some(result => result.type === 'game')).toBe(true);
  });
  it('does not return all content for a blank query', () => {
    expect(search('   ')).toEqual([]);
    expect(search('x')).toEqual([]);
  });
});
