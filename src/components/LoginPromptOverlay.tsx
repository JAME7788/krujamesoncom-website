import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { LogIn, X, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DISMISS_FLAG = 'krujames_login_prompt_dismissed_v1';

/**
 * Wrap หน้าที่ "เข้าได้โดยไม่ต้อง login แต่ขึ้น popup เชิญ"
 * - ถ้า login แล้ว → แสดง children เฉยๆ ไม่มี popup
 * - ถ้ายังไม่ login → แสดง children + popup (dismiss ได้)
 * - dismiss แล้วเก็บ flag ใน sessionStorage — ไม่ขึ้นซ้ำในเซสชันเดียวกัน
 */
const LoginPromptOverlay: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return sessionStorage.getItem(DISMISS_FLAG) === 'true'; } catch { return false; }
  });

  const showPrompt = !user && !dismissed;

  const handleDismiss = () => {
    try { sessionStorage.setItem(DISMISS_FLAG, 'true'); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <>
      {children}
      {showPrompt && createPortal(
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 5000,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16, animation: 'fadeIn 0.2s ease-out',
          }}
          onClick={handleDismiss}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white', borderRadius: 18, padding: '2rem',
              maxWidth: 440, width: '100%', textAlign: 'center',
              boxShadow: '0 20px 60px rgba(0,0,0,0.25)', position: 'relative',
            }}
          >
            <button
              onClick={handleDismiss}
              aria-label="ปิด"
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'transparent', border: 0, cursor: 'pointer',
                color: '#9ca3af', padding: 4,
              }}
            >
              <X size={20} />
            </button>

            <div
              style={{
                width: 64, height: 64, margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                borderRadius: 18, display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <LogIn size={32} />
            </div>

            <span
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', background: '#fef3c7', color: '#92400e',
                borderRadius: 999, fontSize: '0.78rem', fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <Sparkles size={12} /> Student Portal
            </span>

            <h2 style={{ margin: '0 0 8px', fontSize: '1.35rem' }}>
              เข้าสู่ระบบเพื่อบันทึกคะแนน
            </h2>
            <p style={{ margin: '0 0 20px', color: '#6b7280', fontSize: '0.9rem', lineHeight: 1.6 }}>
              คุณสามารถดูเนื้อหา/เล่นเกมได้โดยไม่ login<br />
              แต่ถ้าจะให้ครูเห็นคะแนน + ขึ้นกระดาษเกรด ต้อง login ก่อน
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Link
                to="/login"
                className="btn-primary"
                style={{ justifyContent: 'center', padding: '12px 20px', fontSize: '1rem' }}
              >
                <LogIn size={18} /> เข้าสู่ระบบ
              </Link>
              <button
                onClick={handleDismiss}
                style={{
                  background: 'transparent', border: 0, cursor: 'pointer',
                  color: '#6b7280', fontSize: '0.88rem', fontFamily: 'inherit',
                  padding: '8px 16px',
                }}
              >
                ดูต่อโดยไม่ login
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default LoginPromptOverlay;
