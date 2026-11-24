import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const readRepoFile = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../${rel}`, import.meta.url)), 'utf8');

describe('All-games gameplay bug regression invariants', () => {
  it('eliminates raw per-call AudioContext leaks in action/tower-defense/board games', () => {
    const files = [
      'src/pages/games/BombCollectorGame.tsx',
      'src/pages/games/ObstacleDodgeGame.tsx',
      'src/pages/games/CyberShieldGame.tsx',
      'src/pages/games/TycoonGame.tsx',
    ];
    for (const rel of files) {
      const src = readRepoFile(rel);
      expect(src, `${rel} should reuse singleton playGameTone`).toContain('playGameTone');
      expect(src, `${rel} should not construct raw AudioContext per sound`).not.toMatch(
        /new\s+(AudioCtx|AudioContextClass)\s*\(/,
      );
    }
  });

  it('keeps BombCollectorGame and ObstacleDodgeGame rAF loops independent of buff/life HUD state', () => {
    const bombSrc = readRepoFile('src/pages/games/BombCollectorGame.tsx');
    expect(bombSrc).toContain('runStatsRef');
    expect(bombSrc).not.toMatch(/\},\s*\[hasShield,\s*speedBoostTimer\]\)/);
    expect(bombSrc).not.toMatch(/\},\s*\[lives\]\)/);

    const dodgeSrc = readRepoFile('src/pages/games/ObstacleDodgeGame.tsx');
    expect(dodgeSrc).toContain('overdriveRef');
    expect(dodgeSrc).not.toMatch(/\},\s*\[overdrive\]\)/);
  });

  it('makes ClawPlatformerGame exit portals reachable and keeps Level 1 Terminal #3 clear of the cloud', () => {
    const src = readRepoFile('src/pages/games/ClawPlatformerGame.tsx');
    // Player center vs portal center (exitY - 32), not top-left p.y vs exitY
    expect(src).toContain('p.x + p.w / 2 - lvl.exitX');
    expect(src).toContain('lvl.exitY - 32');
    // Level 1 Terminal #3 raised to y: 100 above cloud at y: 200 (player height 46 -> 14px clearance)
    expect(src).toContain("{ x: 2000, y: 100, w: 40, h: 40, type: 'terminal' as const }");
    // World horizontal bounds clamp
    expect(src).toContain('Math.max(0, Math.min(lvl.worldWidth - p.w, p.x))');
    // One-way cloud/spring ceiling pass-through
    expect(src).toContain("(plat.type === 'solid' || plat.type === 'terminal')");
  });

  it('ensures CodingMaze Level 6 has uniform 11-column rows and cancellable run tokens', () => {
    const src = readRepoFile('src/pages/games/CodingMaze.tsx');
    const level6Match = src.match(/อุโมงค์เขาวงกต[\s\S]*?parseGrid\(\[([\s\S]*?)\]\)/);
    expect(level6Match).not.toBeNull();
    const rows = Array.from(level6Match![1].matchAll(/'([^']+)'/g), (m) => m[1]);
    expect(rows.length).toBe(5);
    const widths = new Set(rows.map((r) => r.length));
    expect(widths.size).toBe(1);
    expect([...widths][0]).toBe(11);
    expect(src).toContain('runTokenRef');
  });

  it('gives SpaceTreasureGame enough command slots for Levels 2 and 3 (min optimal 27 commands)', () => {
    const src = readRepoFile('src/pages/games/SpaceTreasureGame.tsx');
    const limitMatch = src.match(/program\.length\s*>=\s*(\d+)/);
    expect(limitMatch).not.toBeNull();
    expect(Number(limitMatch![1])).toBeGreaterThanOrEqual(30);
    expect(src).toContain('level-${currentLevel.levelNum}');
  });

  it('uses setInterval (not one-shot setTimeout) for DigitalCityQuestGame countdowns and lets host publish over', () => {
    const src = readRepoFile('src/pages/games/DigitalCityQuestGame.tsx');
    expect(src).toContain('(!canPublishTurn && !(isRoomHost && phase === \'over\'))');
    expect(src).toContain('window.setInterval(tick, 1000)');
    expect(src).toContain('window.setInterval(tick, 500)');
  });

  it('guards double-click races in SafetyGame, TechSystemGame, and StepSort', () => {
    for (const rel of [
      'src/pages/games/SafetyGame.tsx',
      'src/pages/games/TechSystemGame.tsx',
      'src/pages/games/StepSort.tsx',
    ]) {
      const src = readRepoFile(rel);
      expect(src, `${rel} should use createGameRoundGuard`).toContain('createGameRoundGuard');
    }
  });

  it('prevents reversed-pair false wrong answers in StroopColorGame Stage 2', () => {
    const src = readRepoFile('src/pages/games/StroopColorGame.tsx');
    expect(src).not.toContain('`${target2.th} และ ${target1.th}`');
  });

  it('uses cumulative waveElapsedRef in CyberShieldGame so waves never slow down quadratically', () => {
    const src = readRepoFile('src/pages/games/CyberShieldGame.tsx');
    expect(src).toContain('waveElapsedRef.current += deltaSec');
    expect(src).toContain('waveElapsedRef.current >= spawnQueueRef.current[0].delay');
  });
});
