export const readGameRecord = (key: string, fallback = 0): number => {
  try {
    const raw = localStorage.getItem(key);
    const value = raw === null ? NaN : Number(raw);
    return Number.isFinite(value) && value >= 0 ? Math.floor(value) : fallback;
  } catch { return fallback; }
};

export const writeGameRecord = (key: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0) return;
  try { localStorage.setItem(key, String(Math.floor(value))); } catch { /* Optional personal best. */ }
};
