/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import AppDialogHost from './AppDialogHost';

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
      <AppDialogHost onNotify={show} />
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
        border: 1px solid rgba(180, 83, 9, 0.45);
        animation: toastIn 0.25s ease-out;
      }
      .toast-success { border-color: #22c55e; }
      .toast-success .toast-icon { color: #22c55e; }
      .toast-error { border-color: #ef4444; }
      .toast-error .toast-icon { color: #ef4444; }
      .toast-info { border-color: #3b82f6; }
      .toast-info .toast-icon { color: #3b82f6; }
      .toast-msg { flex: 1; font-size: 0.9rem; white-space: pre-wrap; }
      .toast-close {
        background: transparent; border: 0; cursor: pointer;
        color: #9ca3af; padding: 4px; border-radius: 6px;
      }
      .toast-close:hover { background: #f3f4f6; color: #1f2937; }
      html[data-theme="dark"] .toast {
        background: #1e293b; color: #f1f5f9;
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
      }
      html[data-theme="dark"] .toast-close:hover {
        background: rgba(255, 255, 255, 0.08); color: #f8fafc;
      }
      .app-dialog-backdrop {
        position: fixed; inset: 0; z-index: 10050;
        background: rgba(15, 23, 42, 0.58);
        backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
        padding: 1rem;
        animation: appDialogFade 0.16s ease-out;
      }
      .app-dialog-card {
        width: 100%; max-width: 440px;
        background: var(--card, #ffffff);
        color: var(--text-main, #0f172a);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 18px;
        padding: 1.35rem 1.4rem;
        box-shadow: 0 24px 60px rgba(15, 23, 42, 0.28);
        animation: toastIn 0.18s ease-out;
      }
      .app-dialog-head {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 0.75rem;
      }
      .app-dialog-icon {
        width: 38px; height: 38px; border-radius: 12px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        background: rgba(245, 158, 11, 0.16); color: #b45309;
      }
      .app-dialog-icon.danger { background: rgba(239, 68, 68, 0.14); color: #dc2626; }
      .app-dialog-icon.prompt { background: rgba(37, 99, 235, 0.14); color: #2563eb; }
      html[data-theme="dark"] .app-dialog-icon { color: #fcd34d; }
      html[data-theme="dark"] .app-dialog-icon.danger { color: #fca5a5; }
      html[data-theme="dark"] .app-dialog-icon.prompt { color: #93c5fd; }
      .app-dialog-title {
        margin: 0; font-size: 1.05rem; font-weight: 800; flex: 1;
        color: var(--text-main, #0f172a);
      }
      .app-dialog-close {
        background: transparent; border: 0; cursor: pointer;
        color: var(--text-muted, #64748b); padding: 4px; border-radius: 8px;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .app-dialog-close:hover { background: var(--surface, #f1f5f9); color: var(--text-main, #0f172a); }
      .app-dialog-message {
        margin: 0 0 1rem; font-size: 0.93rem; line-height: 1.6;
        color: var(--text-muted, #475569); white-space: pre-wrap;
        max-height: 55vh; overflow-y: auto;
      }
      .app-dialog-input {
        width: 100%; box-sizing: border-box;
        padding: 10px 12px; margin-bottom: 1rem;
        border: 1.5px solid var(--border, #cbd5e1);
        border-radius: 10px;
        background: var(--surface, #f8fafc);
        color: var(--text-main, #0f172a);
        font: inherit; font-size: 0.95rem;
      }
      .app-dialog-input:focus {
        outline: none; border-color: #f59e0b;
        box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.2);
      }
      .app-dialog-actions {
        display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap;
      }
      .app-dialog-btn {
        padding: 9px 18px; border-radius: 10px; font-weight: 700; font-size: 0.9rem;
      }
      .app-dialog-btn-danger {
        background: linear-gradient(135deg, #ef4444, #dc2626);
        color: #ffffff; border: 0; cursor: pointer;
        box-shadow: 0 4px 12px rgba(220, 38, 38, 0.25);
      }
      .app-dialog-btn-danger:hover { filter: brightness(1.05); }
      @keyframes appDialogFade { from { opacity: 0; } to { opacity: 1; } }
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
