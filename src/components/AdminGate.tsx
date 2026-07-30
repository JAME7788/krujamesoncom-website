import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, KeyRound, LogIn, AlertCircle } from 'lucide-react';
import { adminLoginSecure, isAdminAuthed } from '../services/authAdmin';

interface Props {
  children: React.ReactNode;
}

const AdminGate: React.FC<Props> = ({ children }) => {
  const [authed, setAuthed] = useState(isAdminAuthed());
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const session = await adminLoginSecure(user, pass);
      if (session) {
        setAuthed(true);
        window.location.reload();
      } else {
        setError('ชื่อผู้ใช้ อีเมล หรือรหัสผ่านไม่ถูกต้อง');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authed) return <>{children}</>;

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '6rem 1rem 2rem',
        background: 'linear-gradient(135deg, #1f2937 0%, #4338ca 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'white',
          borderRadius: 20,
          padding: '2.5rem',
          boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              marginBottom: '1rem',
            }}
          >
            <Shield size={36} />
          </div>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>เข้าสู่ระบบ Admin</h1>
          <p style={{ margin: '0.25rem 0 0', color: '#6b7280', fontSize: '0.9rem' }}>
            แผงควบคุมสำหรับครูเจ้าของเว็บเท่านั้น
          </p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
              ชื่อผู้ใช้หรืออีเมลครู
            </label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              autoFocus
              required
              placeholder="ชื่อผู้ใช้เดิม หรืออีเมล Firebase"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                marginTop: 4,
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4b5563' }}>
              <KeyRound size={14} style={{ verticalAlign: 'middle' }} /> รหัสผ่าน
            </label>
            <input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              required
              placeholder="กรอกรหัสผ่าน"
              style={{
                width: '100%',
                padding: '0.75rem 1rem',
                marginTop: 4,
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0.65rem 1rem',
                background: '#fee2e2',
                color: '#991b1b',
                borderRadius: 8,
                fontSize: '0.85rem',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '0.85rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 0,
              borderRadius: 10,
              fontSize: '1rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            <LogIn size={18} />
            {submitting ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <p style={{ marginTop: '1.5rem', fontSize: '0.75rem', color: '#9ca3af', textAlign: 'center' }}>
          🔒 ระบบจะจดจำการเข้าใช้งาน 8 ชั่วโมง • ออกจากระบบได้ตลอดเวลา
        </p>
      </motion.div>
    </div>
  );
};

export default AdminGate;
