import { describe, expect, it, vi } from 'vitest';
import { PersistentSaveQueue } from '../src/services/persistentSaveQueue';
const storage = () => {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
};
describe('durable teacher save queue', () => {
  it('keeps failed edits after reload and acknowledges only after retry succeeds', async () => {
    const local = storage();
    const queue = new PersistentSaveQueue(local, 'queue', async () => { throw new Error('offline'); });
    queue.enqueue('score', 'class', { value: 12 });
    await queue.retry();
    expect(queue.status('class')).toMatchObject({ state: 'error', pending: 1 });
    const send = vi.fn(async () => {});
    const reloaded = new PersistentSaveQueue(local, 'queue', send);
    expect(reloaded.status('class').pending).toBe(1);
    await reloaded.retry();
    expect(send).toHaveBeenCalledWith({ value: 12 });
    expect(reloaded.status('class')).toMatchObject({ state: 'saved', pending: 0 });
  });
  it('does not delete a newer edit when the older network request completes', async () => {
    let finish!: () => void;
    const first = new Promise<void>(resolve => { finish = resolve; });
    const sent: number[] = [];
    const queue = new PersistentSaveQueue(storage(), 'queue', async (value: number) => { sent.push(value); if (sent.length === 1) await first; });
    queue.enqueue('same', 'class', 15);
    queue.enqueue('same', 'class', 8);
    expect(queue.status('class')).toMatchObject({ state: 'saving', pending: 1 });
    finish(); await queue.retry();
    expect(sent).toEqual([15, 8]);
    expect(queue.status('class')).toMatchObject({ state: 'saved', pending: 0 });
  });
  it('does not send when storage is full and retries after storage recovers', async () => {
    const local = storage(); const original = local.setItem;
    local.setItem = () => { throw new Error('quota'); };
    const send = vi.fn(async () => {});
    const queue = new PersistentSaveQueue(local, 'queue', send);
    queue.enqueue('score', 'class', 0);
    expect(send).not.toHaveBeenCalled();
    expect(queue.status('class').state).toBe('error');
    local.setItem = original; await queue.retry();
    expect(send).toHaveBeenCalledWith(0);
  });
  it('preserves a corrupt saved queue instead of silently replacing it', async () => {
    const local = storage(); local.setItem('queue', 'broken');
    const send = vi.fn(async () => {});
    const queue = new PersistentSaveQueue(local, 'queue', send);
    queue.enqueue('score', 'class', 5); await queue.retry();
    expect(local.getItem('queue')).toBe('broken'); expect(send).not.toHaveBeenCalled();
    expect(queue.status('class').state).toBe('error');
  });
  it('refuses to overwrite a queue changed by another tab', async () => {
    const local = storage(); const send = vi.fn(async () => {});
    const queue = new PersistentSaveQueue(local, 'queue', send);
    const other = JSON.stringify([{ key: 'other', scope: 'class', revision: 1, payload: 9 }]);
    local.setItem('queue', other);
    queue.enqueue('score', 'class', 5); await queue.retry();
    expect(local.getItem('queue')).toBe(other); expect(send).not.toHaveBeenCalled();
    expect(queue.status('class').error).toContain('อีกแท็บ');
  });
  it('marks later classrooms as retryable when an earlier write blocks the queue', async () => {
    let fail!: () => void;
    const blocked = new Promise<void>((_, reject) => { fail = () => reject(new Error('offline')); });
    const queue = new PersistentSaveQueue(storage(), 'queue', () => blocked);
    queue.enqueue('a', 'first', 1); queue.enqueue('b', 'second', 2);
    fail(); await queue.retry();
    expect(queue.status('second')).toMatchObject({ state: 'error', pending: 1 });
  });
});
