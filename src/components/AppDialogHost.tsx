import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, HelpCircle, PencilLine, X } from 'lucide-react';
import {
  registerAppDialogHost,
  type AppDialogRequest,
  type NotifyTone,
} from '../services/appDialogService';

interface Props {
  onNotify: (message: string, tone: NotifyTone) => void;
}

const AppDialogHost: React.FC<Props> = ({ onNotify }) => {
  const [queue, setQueue] = useState<AppDialogRequest[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const active = queue[0] ?? null;

  useEffect(() => {
    registerAppDialogHost(
      (req) => {
        setQueue((prev) => [...prev, req]);
      },
      onNotify,
    );
    return () => {
      registerAppDialogHost(null, null);
    };
  }, [onNotify]);

  useEffect(() => {
    if (!active) return;
    if (active.kind === 'prompt') {
      const initial = active.defaultValue ?? '';
      const timer = window.setTimeout(() => {
        setInputValue(initial);
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        active.resolve(active.kind === 'prompt' ? null : false);
        setQueue((prev) => prev.slice(1));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [active]);

  if (!active) return null;

  const handleCancel = () => {
    active.resolve(active.kind === 'prompt' ? null : false);
    setQueue((prev) => prev.slice(1));
  };

  const handleConfirm = () => {
    active.resolve(active.kind === 'prompt' ? inputValue : true);
    setQueue((prev) => prev.slice(1));
  };

  return (
    <div
      className="app-dialog-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="app-dialog-title"
      onClick={handleCancel}
    >
      <div className="app-dialog-card" onClick={(e) => e.stopPropagation()}>
        <div className="app-dialog-head">
          <div className={`app-dialog-icon ${active.danger ? 'danger' : active.kind}`}>
            {active.danger ? (
              <AlertTriangle size={20} />
            ) : active.kind === 'prompt' ? (
              <PencilLine size={20} />
            ) : (
              <HelpCircle size={20} />
            )}
          </div>
          <h3 id="app-dialog-title" className="app-dialog-title">{active.title}</h3>
          <button
            type="button"
            className="app-dialog-close"
            onClick={handleCancel}
            aria-label="ปิดหน้าต่าง"
          >
            <X size={18} />
          </button>
        </div>

        <p className="app-dialog-message">{active.message}</p>

        {active.kind === 'prompt' && (
          <input
            ref={inputRef}
            type="text"
            className="app-dialog-input"
            value={inputValue}
            placeholder={active.placeholder}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleConfirm();
              }
            }}
          />
        )}

        <div className="app-dialog-actions">
          <button type="button" className="btn-secondary app-dialog-btn" onClick={handleCancel}>
            {active.cancelLabel || 'ยกเลิก'}
          </button>
          <button
            type="button"
            className={`app-dialog-btn ${active.danger ? 'app-dialog-btn-danger' : 'btn-primary'}`}
            onClick={handleConfirm}
          >
            {active.confirmLabel || 'ตกลง'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppDialogHost;
