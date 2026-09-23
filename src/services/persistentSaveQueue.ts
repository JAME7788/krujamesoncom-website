export type SaveStatus = { state: 'idle' | 'saving' | 'saved' | 'error'; pending: number; error?: string };
type Job<T> = { key: string; scope: string; revision: number; payload: T };

/** Serial, durable, coalescing writes. A completed older write cannot remove a newer edit. */
export class PersistentSaveQueue<T> {
  private jobs: Job<T>[] = [];
  private listeners = new Set<() => void>();
  private states = new Map<string, SaveStatus>();
  private running: Promise<void> | null = null;
  private revision = 0;
  private loadError?: string;
  private persisted = '[]';
  private storage: Pick<Storage, 'getItem' | 'setItem'>;
  private storageKey: string;
  private send: (payload: T) => Promise<void>;

  constructor(storage: Pick<Storage, 'getItem' | 'setItem'>, storageKey: string, send: (payload: T) => Promise<void>) {
    this.storage = storage; this.storageKey = storageKey; this.send = send;
    try {
      const raw = storage.getItem(storageKey);
      this.persisted = raw ?? '[]';
      const jobs = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(jobs) || jobs.some(j => !j || typeof j.key !== 'string' || typeof j.scope !== 'string' || !Number.isFinite(j.revision))) throw new Error('คิวบันทึกเสียหาย กรุณาสำรองข้อมูลก่อนแก้ไข');
      this.jobs = jobs;
      this.revision = Math.max(0, ...jobs.map(j => j.revision));
    } catch (error) { this.loadError = String(error); }
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  status(scope: string): SaveStatus {
    const pending = this.jobs.filter(j => j.scope === scope).length;
    if (this.loadError) return { state: 'error', pending, error: this.loadError };
    return { ...(this.states.get(scope) ?? { state: pending ? 'error' : 'idle' }), pending };
  }

  private emit() { this.listeners.forEach(listener => listener()); }
  private persist() {
    if (this.loadError) throw new Error(this.loadError);
    this.write(this.jobs);
  }
  private write(jobs: Job<T>[]) {
    if ((this.storage.getItem(this.storageKey) ?? '[]') !== this.persisted) {
      throw new Error('คิวถูกแก้จากอีกแท็บ กรุณาเก็บสำเนาคะแนนและใช้สมุดคะแนนแท็บเดียว');
    }
    const serialized = JSON.stringify(jobs);
    this.storage.setItem(this.storageKey, serialized);
    this.persisted = serialized;
  }

  enqueue(key: string, scope: string, payload: T) {
    const job = { key, scope, payload: JSON.parse(JSON.stringify(payload)) as T, revision: ++this.revision };
    const index = this.jobs.findIndex(j => j.key === key);
    if (index < 0) this.jobs.push(job); else this.jobs[index] = job;
    this.states.set(scope, { state: 'saving', pending: 0 });
    try { this.persist(); }
    catch (error) {
      this.states.set(scope, { state: 'error', pending: 0, error: `เก็บคิวในเครื่องไม่สำเร็จ: ${String(error)}` });
      this.emit(); return;
    }
    this.emit();
    void this.retry();
  }

  retry(): Promise<void> {
    if (this.running) return this.running;
    this.running = this.drain().finally(() => { this.running = null; });
    return this.running;
  }

  private async drain() {
    while (this.jobs.length) {
      const job = this.jobs[0];
      this.states.set(job.scope, { state: 'saving', pending: 0 }); this.emit();
      try {
        this.persist();
        await this.send(job.payload);
        const remaining = this.jobs.filter(j => j.key !== job.key || j.revision !== job.revision);
        // Persist acknowledgement before showing saved. Retrying a write is safe.
        this.write(remaining);
        this.jobs = remaining;
        this.states.set(job.scope, { state: 'saved', pending: 0 }); this.emit();
      } catch (error) {
        this.jobs.forEach(pending => this.states.set(pending.scope, { state: 'error', pending: 0, error: String(error) }));
        this.emit();
        return;
      }
    }
  }
}
