/** Synchronous guard for inputs that can arrive before React renders again. */
export const createGameRoundGuard = () => {
  const claimed = new Set<string>();
  return {
    claim(key: string): boolean {
      if (claimed.has(key)) return false;
      claimed.add(key);
      return true;
    },
    reset(): void { claimed.clear(); },
  };
};
