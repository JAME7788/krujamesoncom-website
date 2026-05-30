import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Trophy, Clock } from 'lucide-react';
import './GameStyles.css';

interface Target {
  id: number;
  x: number;
  y: number;
  emoji: string;
  size: number;
}

const emojis = ['🍎', '🍌', '🍇', '🍉', '🍊', '🍓', '🥝', '🍑', '🍒', '🥭'];

const MousePractice: React.FC = () => {
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);
  const [time, setTime] = useState(60);
  const [running, setRunning] = useState(false);
  const [targets, setTargets] = useState<Target[]>([]);
  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem('kj_mouse_best') || '0')
  );
  const arenaRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (!running) return;
    if (time <= 0) {
      setRunning(false);
      if (score > bestScore) {
        setBestScore(score);
        localStorage.setItem('kj_mouse_best', String(score));
      }
      return;
    }
    const t = setTimeout(() => setTime(time - 1), 1000);
    return () => clearTimeout(t);
  }, [running, time, score, bestScore]);

  // Spawn targets
  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      if (!arenaRef.current) return;
      const rect = arenaRef.current.getBoundingClientRect();
      const size = 50 + Math.random() * 30;
      const target: Target = {
        id: Date.now() + Math.random(),
        x: Math.random() * (rect.width - size - 20) + 10,
        y: Math.random() * (rect.height - size - 20) + 10,
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        size,
      };
      setTargets((prev) => [...prev, target]);
      // Auto-remove after 2s
      setTimeout(() => {
        setTargets((prev) => prev.filter((t) => t.id !== target.id));
      }, 2000);
    }, 800);
    return () => clearInterval(spawn);
  }, [running]);

  const start = () => {
    setScore(0);
    setMisses(0);
    setTime(60);
    setTargets([]);
    setRunning(true);
  };

  const handleHit = (id: number) => {
    setScore((s) => s + 10);
    setTargets((prev) => prev.filter((t) => t.id !== id));
  };

  const handleMiss = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('mouse-target')) return;
    if (running) setMisses((m) => m + 1);
  };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🖱️ ภารกิจเมาส์แม่นยำ</h2>
      </div>

      <div className="game-stats">
        <div className="gstat"><Trophy size={18} /> คะแนน: <strong>{score}</strong></div>
        <div className="gstat">❌ พลาด: <strong>{misses}</strong></div>
        <div className="gstat"><Clock size={18} /> เหลือ: <strong>{time}s</strong></div>
        <div className="gstat">🏆 ดีที่สุด: <strong>{bestScore}</strong></div>
      </div>

      <div className="mouse-arena" ref={arenaRef} onClick={handleMiss}>
        {!running ? (
          <div className="game-overlay">
            <h1 style={{ fontSize: '3rem' }}>🖱️</h1>
            {time === 0 && score > 0 ? (
              <>
                <h2>เกมจบแล้ว!</h2>
                <p>คะแนนของคุณ: <strong style={{ fontSize: '1.5rem' }}>{score}</strong></p>
                {score > bestScore - 10 && score >= bestScore && <p>🎉 สถิติใหม่!</p>}
              </>
            ) : (
              <>
                <h2>คลิกผลไม้ให้เร็วที่สุด!</h2>
                <p>เป้าหมายโผล่ขึ้นมา 2 วินาที — คลิกก่อนหายไป</p>
                <ul style={{ textAlign: 'left', marginTop: 16 }}>
                  <li>✅ คลิกถูก = +10 คะแนน</li>
                  <li>❌ คลิกพลาด = นับเป็นพลาด</li>
                  <li>⏱️ เวลา 60 วินาที</li>
                </ul>
              </>
            )}
            <button className="btn-game-start" onClick={start}>
              <RotateCcw size={20} /> {time === 0 ? 'เล่นอีก!' : 'เริ่มเลย'}
            </button>
          </div>
        ) : (
          targets.map((t) => (
            <button
              key={t.id}
              className="mouse-target"
              style={{
                left: t.x,
                top: t.y,
                width: t.size,
                height: t.size,
                fontSize: t.size * 0.6,
              }}
              onClick={(e) => { e.stopPropagation(); handleHit(t.id); }}
            >
              {t.emoji}
            </button>
          ))
        )}
      </div>

      <div className="game-tips">
        💡 <strong>ฝึกการใช้เมาส์</strong> — คลิกเร็ว แม่นยำ — ทักษะพื้นฐานที่นักเรียนคอมต้องมี!
      </div>
    </div>
  );
};

export default MousePractice;
