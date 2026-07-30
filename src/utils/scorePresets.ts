export type ScorePresetRatio = 1 | 0.8 | 0.5;

export const calculatePresetScore = (maxScore: number, ratio: ScorePresetRatio): number => {
  const safeMax = Number.isFinite(maxScore) ? Math.max(0, maxScore) : 0;
  if (ratio === 1) return safeMax;
  return Math.min(safeMax, Math.max(0, Math.round(safeMax * ratio)));
};
