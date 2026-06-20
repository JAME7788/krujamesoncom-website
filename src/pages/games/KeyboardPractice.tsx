import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Trophy, Clock } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';

interface FallingLetter {
  id: number;
  char: string;
  x: number;
  y: number;
  speed: number;
}

const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const charsForKid = 'ABCDEFGHIJ0123456789'; // ป.1 mode

const KeyboardPractice: React.FC = () => {
  const [score, setScore] = useState(0);
  const [time, setTime] = useState(60);
  const [running, setRunning] = useState(false);
  const [letters, setLetters] = useState<FallingLetter[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [easyMode, setEasyMode] = useState(true);
  const [bestScore, setBestScore] = useState(() =>
    parseInt(localStorage.getItem('kj_kb_best') || '0')
  );
  const recordGame = useGameProgress('keyboard', 'นักสำรวจคีย์บอร์ด');

  const start = () => {
    recordGame();
    setScore(0);
    setTime(60);
    setLetters([]);
    setCombo(0);
    setMaxCombo(0);
    setRunning(true);
  };

  const scoreRef = React.useRef(score);
  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  // Timer
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          setRunning(false);
          const currentScore = scoreRef.current;
          setBestScore((currentBest) => {
            if (currentScore > currentBest) {
              localStorage.setItem('kj_kb_best', String(currentScore));
              return currentScore;
            }
            return currentBest;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  // Spawn falling letters
  useEffect(() => {
    if (!running) return;
    const set = easyMode ? charsForKid : chars;
    const spawn = setInterval(() => {
      const letter: FallingLetter = {
        id: Date.now() + Math.random(),
        char: set[Math.floor(Math.random() * set.length)],
        x: Math.random() * 90 + 5,
        y: 0,
        speed: easyMode ? 0.3 : 0.6,
      };
      setLetters((prev) => [...prev, letter]);
    }, easyMode ? 1500 : 900);
    return () => clearInterval(spawn);
  }, [running, easyMode]);

  // Animate fall
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      setLetters((prev) =>
        prev
          .map((l) => ({ ...l, y: l.y + l.speed }))
          .filter((l) => {
            if (l.y > 95) {
              setCombo(0); // missed
              return false;
            }
            return true;
          })
      );
    }, 30);
    return () => clearInterval(tick);
  }, [running]);

  // Keyboard handler
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!running) return;
    const pressed = e.key.toUpperCase();
    setLetters((prev) => {
      // หาตัวที่ตรง — ที่ y สูงสุด (ใกล้พื้นที่สุด)
      const matches = prev.filter((l) => l.char === pressed).sort((a, b) => b.y - a.y);
      if (matches.length > 0) {
        const target = matches[0];
        setScore((s) => s + 10 + combo);
        setCombo((c) => {
          const next = c + 1;
          setMaxCombo((m) => Math.max(m, next));
          return next;
        });
        return prev.filter((l) => l.id !== target.id);
      }
      setCombo(0);
      return prev;
    });
  }, [running, combo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>⌨️ นักสำรวจคีย์บอร์ด</h2>
      </div>

      <div className="game-stats">
        <div className="gstat"><Trophy size={18} /> คะแนน: <strong>{score}</strong></div>
        <div className="gstat">🔥 Combo: <strong>{combo}</strong> (สูงสุด {maxCombo})</div>
        <div className="gstat"><Clock size={18} /> เหลือ: <strong>{time}s</strong></div>
        <div className="gstat">🏆 ดีที่สุด: <strong>{bestScore}</strong></div>
      </div>

      <div className="kb-arena">
        {!running && (
          <div className="game-overlay">
            <h1 style={{ fontSize: '3rem' }}>⌨️</h1>
            {time === 0 && score > 0 ? (
              <>
                <h2>เกมจบ!</h2>
                <p>คะแนน: <strong style={{ fontSize: '1.5rem' }}>{score}</strong></p>
                <p>Combo สูงสุด: <strong>{maxCombo}</strong></p>
              </>
            ) : (
              <>
                <h2>กดปุ่มก่อนตัวอักษรตก!</h2>
                <p>กดให้ตรงตัวอักษรที่ตกลงมา</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', margin: '12px 0' }}>
                  <button
                    className={`mode-btn ${easyMode ? 'active' : ''}`}
                    onClick={() => setEasyMode(true)}
                  >
                    👶 ง่าย (A-J, 0-9)
                  </button>
                  <button
                    className={`mode-btn ${!easyMode ? 'active' : ''}`}
                    onClick={() => setEasyMode(false)}
                  >
                    🔥 ยาก (A-Z, 0-9)
                  </button>
                </div>
              </>
            )}
            <button className="btn-game-start" onClick={start}>
              <RotateCcw size={20} /> {time === 0 ? 'เล่นอีก!' : 'เริ่มเลย'}
            </button>
          </div>
        )}
        {running && letters.map((l) => (
          <div
            key={l.id}
            className="falling-letter"
            style={{ left: `${l.x}%`, top: `${l.y}%` }}
          >
            {l.char}
          </div>
        ))}
        {running && (
          <div className="kb-floor">⌨️ พื้น</div>
        )}
      </div>

      <div className="game-tips">
        💡 <strong>ฝึกพิมพ์</strong> — มองหาตัวอักษรที่กำลังตก แล้วกดปุ่มให้ทัน — ยิ่งตอบติดต่อกัน คะแนน Combo ก็ยิ่งสูง!
      </div>
    </div>
  );
};

export default KeyboardPractice;
