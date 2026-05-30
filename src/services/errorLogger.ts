// Lightweight Error Tracking — เก็บ error ใน localStorage + console
// (ทดแทน Sentry แบบ free - ครูดู error ได้ใน Admin)

export interface ErrorLog {
  id: string;
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  user?: string;
  timestamp: number;
  type: 'error' | 'warn' | 'crash' | 'network';
}

const KEY = 'krujames_errors_v1';
const MAX_LOGS = 50;

export const logError = (
  err: Error | string,
  type: ErrorLog['type'] = 'error',
  extra?: { user?: string }
) => {
  try {
    const log: ErrorLog = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      message: typeof err === 'string' ? err : err.message,
      stack: typeof err === 'string' ? undefined : err.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      user: extra?.user,
      timestamp: Date.now(),
      type,
    };
    const list = loadErrors();
    list.unshift(log);
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX_LOGS)));
    console.error('[errorLogger]', log);
  } catch (e) {
    console.warn('errorLogger failed', e);
  }
};

export const loadErrors = (): ErrorLog[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const clearErrors = () => {
  try { localStorage.removeItem(KEY); } catch {}
};

/** ติดตั้ง global error handler (เรียกครั้งเดียวใน main.tsx) */
export const installGlobalErrorHandler = () => {
  window.addEventListener('error', (e) => {
    logError(e.error || e.message, 'crash');
  });
  window.addEventListener('unhandledrejection', (e) => {
    logError(`Unhandled Promise: ${e.reason}`, 'crash');
  });
};
