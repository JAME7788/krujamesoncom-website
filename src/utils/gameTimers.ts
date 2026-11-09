/** Own delayed actions so a previous round cannot change the next round. */
export const createGameTimers = () => {
  const pending = new Set<ReturnType<typeof setTimeout>>();
  const clear = () => {
    pending.forEach(clearTimeout);
    pending.clear();
  };
  const schedule = (callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      pending.delete(id);
      callback();
    }, delay);
    pending.add(id);
    return id;
  };
  return { schedule, clear };
};

/**
 * Seconds elapsed between two requestAnimationFrame timestamps, clamped to [0, max].
 * The first rAF timestamp is the frame start time and can be earlier than the
 * performance.now() captured during setup, which would otherwise give a negative
 * delta and run simulations backwards.
 */
export const frameDeltaSeconds = (now: number, last: number, max = 0.05): number => {
  const dt = (now - last) / 1000;
  if (!Number.isFinite(dt) || dt <= 0) return 0;
  return Math.min(max, dt);
};
