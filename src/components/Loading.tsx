import React from 'react';

interface Props {
  text?: string;
  fullScreen?: boolean;
}

const Loading: React.FC<Props> = ({ text = 'กำลังโหลด...', fullScreen = false }) => {
  const wrap: React.CSSProperties = fullScreen
    ? {
        position: 'fixed',
        inset: 0,
        background: 'rgba(255,255,255,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9000,
      }
    : { padding: '3rem 1rem', textAlign: 'center' };

  return (
    <div style={wrap}>
      <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <div
          style={{
            width: 44,
            height: 44,
            border: '4px solid #e5e7eb',
            borderTopColor: '#6366f1',
            borderRadius: '50%',
            animation: 'spinKJ 0.7s linear infinite',
          }}
        />
        <p style={{ color: '#6b7280', fontWeight: 600, margin: 0 }}>{text}</p>
      </div>
      <style>{`@keyframes spinKJ { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default Loading;
