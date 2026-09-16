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
