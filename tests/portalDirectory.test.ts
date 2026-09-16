import { describe, expect, it } from 'vitest';
import { filterPortal, isPortalNavActive, portalDirectory } from '../src/data/portalDirectory';
import { gamesCatalog } from '../src/data/gamesCatalog';

describe('portal directory', () => {
  it('includes every catalog game once without private tools for visitors', () => {
    const entries = portalDirectory();
    for (const game of gamesCatalog) expect(entries.filter(entry => entry.path === game.path)).toHaveLength(1);
    expect(entries.some(entry => ['teach', 'results'].includes(entry.section))).toBe(false);
    expect(new Set(entries.map(entry => entry.path)).size).toBe(entries.length);
  });
  it('separates student records from teacher tools', () => {
    const entries = portalDirectory({ id: 'student-1', accountType: 'student' });
    expect(entries.filter(entry => entry.section === 'results')).toHaveLength(3);
    expect(entries.some(entry => entry.section === 'teach')).toBe(false);
  });
  it('shows teacher destinations but not student results for an admin', () => {
    const entries = portalDirectory({ id: 'admin_teacher_account' });
    expect(entries.some(entry => entry.path === '/admin?tab=today')).toBe(true);
    expect(entries.some(entry => entry.section === 'results')).toBe(false);
  });
  it('keeps external visitors out of private shortcuts', () => {
    expect(portalDirectory({ id: 'external_visitor_1' }).some(entry => ['teach', 'results'].includes(entry.section))).toBe(false);
  });
  it('filters by multiple keywords and section', () => {
    const entries = portalDirectory();
    expect(filterPortal(entries, '  คอร์สเรียน รายวิชา ', 'learn').map(entry => entry.path)).toEqual(['/courses']);
    expect(filterPortal(entries, 'คอร์สเรียน', 'practice')).toEqual([]);
    expect(filterPortal(entries, '   ', 'all')).toEqual(entries);
    expect(filterPortal(entries, 'not-a-real-title', 'all')).toEqual([]);
    expect(filterPortal(entries, 'Python', 'practice').some(entry => entry.path === '/games/coding-studio')).toBe(true);
  });
  it.each([
    ['/games/memory', '/games', true], ['/games-other', '/games', false],
    ['/curriculum/p1/unit/1', '/courses', true], ['/lesson/1', '/courses', true],
    ['/admin', '/admin', true], ['/about', '/', false], ['/', '/', true],
  ])('matches navigation %s against %s', (path, target, active) => {
    expect(isPortalNavActive(path, target)).toBe(active);
  });
});
