import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);

  const dismiss = (id: number) => setToasts((t) => t.filter((x) => x.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => {
          const icon =
            t.type === 'success' ? <CheckCircle2 size={18} /> :
            t.type === 'error' ? <AlertCircle size={18} /> :
            <Info size={18} />;
          return (
            <div key={t.id} className={`toast toast-${t.type}`} role="status">
              <span className="toast-icon">{icon}</span>
              <span className="toast-msg">{t.message}</span>
              <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="ปิดการแจ้งเตือน">
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <ToastStyles />
    </ToastContext.Provider>
  );
};

const ToastStyles: React.FC = () => {
  useEffect(() => {
    if (document.getElementById('toast-styles')) return;
    const s = document.createElement('style');
    s.id = 'toast-styles';
    s.innerHTML = `
      .toast-stack {
        position: fixed; bottom: 1.25rem; right: 1.25rem;
        display: flex; flex-direction: column; gap: 0.5rem;
        z-index: 9999; max-width: calc(100vw - 2rem);
      }
      .toast {
        display: flex; align-items: center; gap: 0.5rem;
        padding: 0.75rem 1rem; border-radius: 12px;
        background: white; color: #1f2937; font-weight: 600;
        box-shadow: 0 10px 30px rgba(0,0,0,0.12);
        min-width: 240px; max-width: 360px;
        border-left: 4px solid #6366f1;
        animation: toastIn 0.25s ease-out;
      }
      .toast-success { border-left-color: #22c55e; }
      .toast-success .toast-icon { color: #22c55e; }
      .toast-error { border-left-color: #ef4444; }
      .toast-error .toast-icon { color: #ef4444; }
      .toast-info { border-left-color: #3b82f6; }
      .toast-info .toast-icon { color: #3b82f6; }
      .toast-msg { flex: 1; font-size: 0.9rem; white-space: pre-wrap; }
      .toast-close {
        background: transparent; border: 0; cursor: pointer;
        color: #9ca3af; padding: 4px; border-radius: 6px;
      }
      .toast-close:hover { background: #f3f4f6; color: #1f2937; }
      @keyframes toastIn {
        from { opacity: 0; transform: translateY(10px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      @media (max-width: 600px) {
        .toast-stack { left: 1rem; right: 1rem; bottom: 1rem; }
        .toast { min-width: 0; max-width: 100%; }
      }
    `;
    document.head.appendChild(s);
  }, []);
  return null;
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // safe fallback if used without provider
    return { show: (m) => console.log('[toast]', m) };
  }
  return ctx;
};

export default ToastProvider;
