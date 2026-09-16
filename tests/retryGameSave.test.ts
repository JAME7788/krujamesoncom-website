import { afterEach, expect, it, vi } from 'vitest';
import { retryGameSave } from '../src/utils/retryGameSave';

afterEach(() => vi.useRealTimers());

it('retries the same completion after a transient failure', async () => {
  vi.useFakeTimers();
  const operation = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue({ saved: 1 });
  const result = retryGameSave(operation);
  await vi.runAllTimersAsync();
  expect(await result).toEqual({ saved: 1 });
  expect(operation).toHaveBeenCalledTimes(2);
});

it('stops after three failed attempts and reports failure', async () => {
  vi.useFakeTimers();
  const operation = vi.fn().mockRejectedValue(new Error('offline'));
  const result = expect(retryGameSave(operation)).rejects.toThrow('offline');
  await vi.runAllTimersAsync();
  await result;
  expect(operation).toHaveBeenCalledTimes(3);
});

it.each(['permission-denied', 'unauthenticated', 'invalid-argument'])('does not retry %s', async (code) => {
  const operation = vi.fn().mockRejectedValue(Object.assign(new Error(code), { code }));
  await expect(retryGameSave(operation)).rejects.toThrow(code);
  expect(operation).toHaveBeenCalledTimes(1);
});
