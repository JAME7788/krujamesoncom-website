/** Retry the same idempotent completion, not a new gameplay attempt. */
export const retryGameSave = async <T>(save: () => Promise<T>): Promise<T> => {
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await save();
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
      if (attempt >= 2 || error instanceof RangeError || /permission-denied|unauthenticated|invalid-argument/.test(code)) {
        throw error;
      }
      await new Promise<void>((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
};
