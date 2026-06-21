import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play } from 'lucide-react';
import { speak, stop, pause, resume, isSpeaking, isPaused, isTTSSupported } from '../services/ttsService';

interface Props {
  text: string;
  label?: string;
  className?: string;
}

const TTSButton: React.FC<Props> = ({ text, label, className }) => {
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const i = setInterval(() => {
      setSpeaking(isSpeaking());
      setPaused(isPaused());
    }, 300);
    return () => { clearInterval(i); stop(); };
  }, []);

  if (!isTTSSupported()) return null;

  const handle = () => {
    if (!speaking) {
      speak(text, { onEnd: () => setSpeaking(false) });
      setSpeaking(true);
    } else if (paused) {
      resume();
      setPaused(false);
    } else {
      pause();
      setPaused(true);
    }
  };

  const handleStop = () => {
    stop();
    setSpeaking(false);
    setPaused(false);
  };

  return (
    <div className={`tts-controls ${className || ''}`} style={{ display: 'inline-flex', gap: 4 }}>
      <button
        onClick={handle}
        title={!speaking ? 'อ่านให้ฟัง' : paused ? 'เล่นต่อ' : 'หยุดชั่วคราว'}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          border: 0,
          borderRadius: 999,
          background: speaking ? '#dbeafe' : '#f9fafb',
          color: speaking ? '#1e40af' : '#374151',
          cursor: 'pointer',
          fontSize: '0.78rem',
          fontWeight: 600,
          fontFamily: 'inherit',
        }}
      >
        {!speaking ? <Volume2 size={14} /> : paused ? <Play size={14} /> : <Pause size={14} />}
        {label || (!speaking ? 'อ่านให้ฟัง' : paused ? 'เล่นต่อ' : 'หยุด')}
      </button>
      {speaking && (
        <button
          onClick={handleStop}
          title="หยุดทั้งหมด"
          style={{
            padding: '4px 8px',
            border: 0,
            borderRadius: 999,
            background: '#fee2e2',
            color: '#dc2626',
            cursor: 'pointer',
          }}
        >
          <VolumeX size={14} />
        </button>
      )}
    </div>
  );
};

export default TTSButton;
