import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { buildGameProgressDedupKey } from '../src/services/gameProgressService';

const source = (name: string) =>
  readFileSync(`src/pages/games/${name}`, 'utf8');

const functionBody = (file: string, functionName: string): string => {
  const src = source(file);
  const start = src.indexOf(`const ${functionName} =`);
  expect(start, `${file} must contain ${functionName}`).toBeGreaterThanOrEqual(0);
  const end = src.indexOf('\n  };', start + 8);
  expect(end, `${file}.${functionName} must have a top-level closing brace`).toBeGreaterThan(start);
  return src.slice(start, end + 5);
};

describe('game completion scoring contracts', () => {
  it.each([
    ['MemoryMatch.tsx', 'start'],
    ['KeyboardPractice.tsx', 'start'],
    ['MousePractice.tsx', 'start'],
    ['BugCatcher.tsx', 'start'],
    ['QuickAnswerComputing.tsx', 'startGame'],
    ['SnakeGame.tsx', 'reset'],
  ])('%s does not award progress from %s', (file, startFunction) => {
    expect(functionBody(file, startFunction)).not.toContain('recordGame(');
  });

  it('Coding Maze only records after a solved level', () => {
    const src = source('CodingMaze.tsx');
    const runBody = functionBody('CodingMaze.tsx', 'run');
    const solvedMarker = runBody.indexOf('ns[levelIdx] = true');
    const recordMarker = runBody.indexOf('recordGame(solvedCount)');
    expect(solvedMarker).toBeGreaterThanOrEqual(0);
    expect(recordMarker).toBeGreaterThan(solvedMarker);
    expect(src).not.toContain('recordGame(solved.filter(Boolean).length)');
  });

  it('timed and arcade games record a real positive result', () => {
    expect(source('KeyboardPractice.tsx')).toContain(
      'if (currentScore > 0) void recordGame(currentScore)',
    );
    expect(source('MousePractice.tsx')).toContain(
      'if (currentScore > 0) void recordGame(currentScore)',
    );
    expect(source('BugCatcher.tsx')).toContain(
      'if (finalScore > 0) void recordGame(finalScore)',
    );
    expect(source('SnakeGame.tsx')).toContain(
      'if (gameOver && score > 0) void recordGame(score)',
    );
  });

  it('Algorithm Sorter freezes a solved puzzle to prevent score farming', () => {
    const src = source('AlgorithmSorter.tsx');
    expect(functionBody('AlgorithmSorter.tsx', 'move')).toContain('if (isCorrect) return');
    expect(functionBody('AlgorithmSorter.tsx', 'check')).toContain('if (isCorrect) return');
    expect(functionBody('AlgorithmSorter.tsx', 'reset')).toContain('if (isCorrect) return');
    expect(src).toContain('{!isCorrect && (');
  });
});

describe('per-challenge game progress keys', () => {
  it('keeps the regular game key stable regardless of score', () => {
    expect(buildGameProgressDedupKey('Coding Maze')).toBe('[Game] Coding Maze');
  });

  it('separates different Coding Studio challenges', () => {
    expect(buildGameProgressDedupKey('Coding Studio', 'py-01')).toBe(
      '[Game] Coding Studio:py-01',
    );
    expect(buildGameProgressDedupKey('Coding Studio', 'py-02')).not.toBe(
      buildGameProgressDedupKey('Coding Studio', 'py-01'),
    );
  });

  it('normalizes activity keys so the same challenge cannot be counted twice', () => {
    expect(buildGameProgressDedupKey('Coding Studio', '  py  01  ')).toBe(
      buildGameProgressDedupKey('Coding Studio', 'py-01'),
    );
  });
});
