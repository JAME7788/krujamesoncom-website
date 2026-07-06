import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Volume2, Play, RefreshCw, Sparkles } from 'lucide-react';
import { loadRoster, loadAllRosters } from '../../services/rosterService';
import type { StudentInfo } from '../../data/students2569';

const COLORS = [
  '#ff6b6b', '#4dadf7', '#339af0', '#22b8cf', '#20c997',
  '#51cf66', '#94d82d', '#fcc419', '#ff922b', '#ff8787',
  '#f06595', '#cc5de8', '#845ef7', '#7048e8', '#e8590c'
];

const RosterSpinner: React.FC = () => {
  const allRosters = useMemo(() => loadAllRosters(), []);
  const classrooms = useMemo(() => Object.keys(allRosters).sort(), [allRosters]);

  const [selectedClass, setSelectedClass] = useState<string>(classrooms[0] || 'ป.1');
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [winner, setWinner] = useState<StudentInfo | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  // Spin variables
  const angleRef = useRef(0);
  const angularVelocityRef = useRef(0);
  const isSpinningRef = useRef(false);

  const currentRoster = useMemo(() => {
    return loadRoster(selectedClass);
  }, [selectedClass]);

  // Active roster (excluding checked out students)
  const activeRoster = useMemo(() => {
    return currentRoster.filter(s => !excludedIds.has(s.studentCode));
  }, [currentRoster, excludedIds]);

  // Redraw wheel whenever roster or selected class changes
  useEffect(() => {
    drawWheel();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [selectedClass, excludedIds, currentRoster]);

  // Draw the wheel using Canvas API
  const drawWheel = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 15;

    ctx.clearRect(0, 0, size, size);

    const list = activeRoster.length > 0 ? activeRoster : [{ no: 0, name: 'ไม่มีรายชื่อ', studentCode: '', emoji: '❓' }];
    const arcSize = (Math.PI * 2) / list.length;

    // Draw wheel segments
    list.forEach((item, index) => {
      const angle = angleRef.current + index * arcSize;
      
      // Segment path
      ctx.beginPath();
      ctx.fillStyle = COLORS[index % COLORS.length];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw text
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Prompt, sans-serif';
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      
      const label = list.length > 15 ? `${item.no}` : `${item.no}. ${item.name.split(' ')[0]}`;
      ctx.fillText(label, radius / 2.2, 5);
      ctx.restore();
    });

    // Draw center circle cap
    ctx.beginPath();
    ctx.fillStyle = '#1e293b';
    ctx.arc(center, center, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text/icon
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎯', center, center);

    // Draw pointer pin at the top
    ctx.beginPath();
    ctx.fillStyle = '#ef4444';
    ctx.moveTo(center - 12, 10);
    ctx.lineTo(center + 12, 10);
    ctx.lineTo(center, 34);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  // Run the physics spin logic
  const spinTick = () => {
    if (!isSpinningRef.current) return;

    angleRef.current += angularVelocityRef.current;
    angularVelocityRef.current *= 0.985; // Deceleration/friction

    drawWheel();

    if (angularVelocityRef.current < 0.002) {
      // Stopped
      isSpinningRef.current = false;
      setIsSpinning(false);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      determineWinner();
    } else {
      animationRef.current = requestAnimationFrame(spinTick);
    }
  };

  // Trigger spin
  const handleSpin = () => {
    if (isSpinning || activeRoster.length === 0) return;

    setWinner(null);
    setIsSpinning(true);
    isSpinningRef.current = true;

    // Set a high initial velocity
    angularVelocityRef.current = 0.3 + Math.random() * 0.25; 
    
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(spinTick);
  };

  // Determine winner based on stopping angle
  const determineWinner = () => {
    const list = activeRoster;
    if (list.length === 0) return;

    const arcSize = (Math.PI * 2) / list.length;
    
    // The needle is at 12 o'clock, which is -Math.PI / 2
    // We adjust target angle relative to this pointer position
    const normalizedAngle = (Math.PI * 2 - (angleRef.current % (Math.PI * 2))) % (Math.PI * 2);
    
    // Offset because pointer is at -90deg (top)
    const pointerOffsetAngle = (normalizedAngle + Math.PI * 1.5) % (Math.PI * 2);
    
    const winningIndex = Math.floor(pointerOffsetAngle / arcSize) % list.length;
    const selected = list[winningIndex];

    setWinner(selected);
    speakName(selected);
  };

  // Text-To-Speech
  const speakName = (student: StudentInfo) => {
    if (!speechEnabled) return;

    try {
      window.speechSynthesis.cancel(); // Cancel active speech

      const text = `เลขที่ ${student.no} ${student.name}`;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.95;

      // Try to find a Thai voice
      const voices = window.speechSynthesis.getVoices();
      const thaiVoice = voices.find(voice => voice.lang.includes('TH') || voice.lang.includes('th'));
      if (thaiVoice) {
        utterance.voice = thaiVoice;
      }

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('TTS failed', e);
    }
  };

  // Toggle exclusion
  const handleToggleExclude = (studentCode: string) => {
    const next = new Set(excludedIds);
    if (next.has(studentCode)) {
      next.delete(studentCode);
    } else {
      next.add(studentCode);
    }
    setExcludedIds(next);
  };

  // Reset exclusions
  const handleResetExclusions = () => {
    setExcludedIds(new Set());
    setWinner(null);
  };

  // Auto-exclude current winner
  const handleExcludeWinner = () => {
    if (winner) {
      const next = new Set(excludedIds);
      next.add(winner.studentCode);
      setExcludedIds(next);
      setWinner(null);
    }
  };

  return (
    <div className="spinner-container">
      {/* Header and Class Selector */}
      <div className="section-header-spinner">
        <div className="title-block">
          <Sparkles className="header-icon" size={24} />
          <div>
            <h3>วงล้อสุ่มรายชื่ออัจฉริยะ</h3>
            <p>สุ่มเลือกเลขที่/ผู้โชคดีเพื่อตอบคำถามหรือมอบหมายงาน</p>
          </div>
        </div>

        <div className="header-actions">
          <button 
            type="button" 
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`btn-speech-toggle ${speechEnabled ? 'enabled' : ''}`}
            title={speechEnabled ? 'เปิดเสียงอ่านชื่อภาษาไทย' : 'ปิดเสียงอ่าน'}
          >
            <Volume2 size={16} /> {speechEnabled ? 'เปิดเสียงพูด' : 'ปิดเสียงพูด'}
          </button>
          <div className="class-selector">
            <span className="select-label">เลือกระดับชั้น:</span>
            <select 
              value={selectedClass} 
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setExcludedIds(new Set());
                setWinner(null);
              }}
              className="custom-select"
              disabled={isSpinning}
            >
              {classrooms.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="spinner-layout">
        {/* Wheel Canvas Screen */}
        <div className="wheel-main-section">
          <div className="canvas-wrapper">
            <canvas 
              ref={canvasRef} 
              width={380} 
              height={380} 
              className="wheel-canvas"
            />
            {/* Center pointer overlay */}
            <div className="center-cap"></div>
          </div>
          
          <button 
            onClick={handleSpin} 
            disabled={isSpinning || activeRoster.length === 0} 
            className="btn-spin-wheel"
          >
            <Play size={18} fill="currentColor" /> {isSpinning ? 'กำลังหมุนวงล้อ...' : 'เริ่มสุ่มรายชื่อ!'}
          </button>
        </div>

        {/* Sidebar Roster and Exclusions */}
        <div className="spinner-sidebar">
          {/* Excluded & Active List */}
          <div className="sidebar-card">
            <div className="sidebar-header">
              <h4>👥 ตัวกรองนักเรียน ({activeRoster.length}/{currentRoster.length})</h4>
              {excludedIds.size > 0 && (
                <button onClick={handleResetExclusions} className="btn-reset-filters">
                  <RefreshCw size={11} /> รีเซ็ตสิทธิ์
                </button>
              )}
            </div>
            
            <p className="sidebar-hint">คลิกติ๊กถูกหน้านักเรียนเพื่อ <strong>ยกเว้นสิทธิ์</strong> (ไม่นำมารวมสุ่ม)</p>
            
            <div className="students-filter-list">
              {currentRoster.map(s => {
                const isExcluded = excludedIds.has(s.studentCode);
                return (
                  <div 
                    key={s.studentCode} 
                    onClick={() => !isSpinning && handleToggleExclude(s.studentCode)}
                    className={`filter-item ${isExcluded ? 'excluded' : 'active'}`}
                  >
                    <input 
                      type="checkbox" 
                      checked={!isExcluded} 
                      onChange={() => {}} // Controlled by filter-item click
                      disabled={isSpinning}
                      className="filter-checkbox"
                    />
                    <span className="emoji">{s.emoji}</span>
                    <span className="no">เลขที่ {s.no}</span>
                    <span className="name text-truncate">{s.name.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Winner Popup Modal overlay */}
      {winner && (
        <div className="winner-overlay">
          <div className="winner-modal shadow-2xl scale-in">
            <div className="confetti-effect">🎉 🎉 🎉</div>
            <span className="winner-badge">ยินดีด้วย! ผู้โชคดีคือ</span>
            <div className="winner-avatar-big">{winner.emoji}</div>
            <h2 className="winner-name">เด็กดี เลขที่ {winner.no}</h2>
            <h3 className="winner-full-name">{winner.name}</h3>
            
            <div className="winner-modal-actions">
              <button 
                onClick={handleExcludeWinner} 
                className="btn-exclude-winner"
              >
                สุ่มครั้งหน้า (ข้ามคนนี้)
              </button>
              <button 
                onClick={() => setWinner(null)} 
                className="btn-close-winner"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spinner-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          font-family: 'Prompt', sans-serif;
        }
        .section-header-spinner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 12px;
          background: white;
          padding: 1.25rem 1.5rem;
          border-radius: 1.25rem;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          border: 1px solid #f1f5f9;
        }
        .btn-speech-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 500;
          color: #64748b;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-speech-toggle.enabled {
          background: #eef2ff;
          border-color: #c7d2fe;
          color: #4f46e5;
        }
        .spinner-layout {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 1.5rem;
        }
        @media (max-width: 900px) {
          .spinner-layout {
            grid-template-columns: 1fr;
          }
        }
        .wheel-main-section {
          background: white;
          border-radius: 1.25rem;
          padding: 2rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }
        .canvas-wrapper {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
          width: 380px;
          height: 380px;
        }
        @media (max-width: 480px) {
          .canvas-wrapper {
            width: 290px;
            height: 290px;
          }
          .wheel-canvas {
            width: 290px !important;
            height: 290px !important;
          }
        }
        .wheel-canvas {
          background: transparent;
          border-radius: 50%;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        }
        .btn-spin-wheel {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #6366f1;
          color: white;
          padding: 12px 32px;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.3);
          transition: background 0.2s, transform 0.1s;
        }
        .btn-spin-wheel:hover:not(:disabled) {
          background: #4f46e5;
          transform: translateY(-1px);
        }
        .btn-spin-wheel:disabled {
          background: #94a3b8;
          cursor: not-allowed;
          box-shadow: none;
        }
        .sidebar-card {
          background: white;
          border-radius: 1.25rem;
          padding: 1.5rem;
          border: 1px solid #f1f5f9;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          display: flex;
          flex-direction: column;
          height: 480px;
        }
        .sidebar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .sidebar-header h4 {
          margin: 0;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
        }
        .btn-reset-filters {
          display: flex;
          align-items: center;
          gap: 3px;
          padding: 4px 8px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 500;
          cursor: pointer;
        }
        .sidebar-hint {
          font-size: 0.75rem;
          color: #64748b;
          margin: 0 0 12px;
        }
        .students-filter-list {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-right: 4px;
        }
        .filter-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          font-size: 0.8rem;
          cursor: pointer;
          user-select: none;
          transition: all 0.2s;
        }
        .filter-item.active {
          background: white;
          color: #1e293b;
        }
        .filter-item.excluded {
          background: #f1f5f9;
          color: #94a3b8;
          border-color: #e2e8f0;
          opacity: 0.7;
        }
        .filter-item.active:hover {
          border-color: #6366f1;
          background: #f8fafc;
        }
        .filter-checkbox {
          width: 14px;
          height: 14px;
          accent-color: #6366f1;
        }
        .filter-item .emoji {
          font-size: 1rem;
        }
        .filter-item .no {
          font-size: 0.7rem;
          background: #f1f5f9;
          color: #64748b;
          padding: 1px 4px;
          border-radius: 4px;
          font-weight: 500;
        }
        .filter-item.excluded .no {
          background: #e2e8f0;
        }
        .filter-item .name {
          font-weight: 500;
        }
        .winner-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
        }
        .winner-modal {
          background: white;
          border-radius: 2rem;
          padding: 2.5rem;
          max-width: 420px;
          width: 100%;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
        }
        .confetti-effect {
          font-size: 1.8rem;
          animation: float 2s infinite ease-in-out;
        }
        .winner-badge {
          font-size: 0.85rem;
          font-weight: 600;
          background: #fef3c7;
          color: #d97706;
          padding: 4px 12px;
          border-radius: 20px;
          letter-spacing: 0.5px;
        }
        .winner-avatar-big {
          font-size: 4.5rem;
          margin: 10px 0;
          filter: drop-shadow(0 10px 8px rgba(0,0,0,0.08));
        }
        .winner-name {
          margin: 0;
          font-size: 1.4rem;
          font-weight: 700;
          color: #1e293b;
        }
        .winner-full-name {
          margin: 0 0 12px;
          font-size: 1rem;
          color: #64748b;
          font-weight: 500;
        }
        .winner-modal-actions {
          display: flex;
          flex-direction: column;
          gap: 8px;
          width: 100%;
        }
        .btn-exclude-winner {
          background: #10b981;
          color: white;
          border: none;
          padding: 10px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-exclude-winner:hover {
          background: #059669;
        }
        .btn-close-winner {
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #cbd5e1;
          padding: 10px;
          border-radius: 10px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-close-winner:hover {
          background: #e2e8f0;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .scale-in {
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default RosterSpinner;
