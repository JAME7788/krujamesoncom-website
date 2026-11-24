import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Trophy, Clock } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { readGameRecord, writeGameRecord } from '../../utils/gameRecords';
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
  const [bestScore, setBestScore] = useState(() => readGameRecord('kj_kb_best'));
  const recordGame = useGameProgress('keyboard', 'นักสำรวจคีย์บอร์ด');

  const scoreRef = useRef(0);
  const comboRef = useRef(0);
  const lettersRef = useRef<FallingLetter[]>([]);
  const endedRef = useRef(false);

  const start = () => {
    scoreRef.current = 0;
    comboRef.current = 0;
    lettersRef.current = [];
    endedRef.current = false;
    setScore(0);
    setTime(60);
    setLetters([]);
    setCombo(0);
    setMaxCombo(0);
    setRunning(true);
  };

  // Timer (pure state decrement)
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setTime((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [running]);

  // Handle round completion outside state updater (prevents StrictMode double recordGame)
  useEffect(() => {
    if (!running || time > 0 || endedRef.current) return;
    endedRef.current = true;
    setRunning(false);
    const currentScore = scoreRef.current;
    setBestScore((currentBest) => {
      if (currentScore > currentBest) {
        writeGameRecord('kj_kb_best', currentScore);
        return currentScore;
      }
      return currentBest;
    });
    if (currentScore > 0) void recordGame(currentScore);
  }, [recordGame, running, time]);

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
      lettersRef.current = [...lettersRef.current, letter];
      setLetters(lettersRef.current);
    }, easyMode ? 1500 : 900);
    return () => clearInterval(spawn);
  }, [running, easyMode]);

  // Animate fall (pure state update outside updater)
  useEffect(() => {
    if (!running) return;
    const tick = setInterval(() => {
      let missedAny = false;
      const nextLetters: FallingLetter[] = [];
      for (const l of lettersRef.current) {
        const ny = l.y + l.speed;
        if (ny > 95) {
          missedAny = true;
        } else {
          nextLetters.push({ ...l, y: ny });
        }
      }
      lettersRef.current = nextLetters;
      setLetters(nextLetters);
      if (missedAny && comboRef.current !== 0) {
        comboRef.current = 0;
        setCombo(0);
      }
    }, 30);
    return () => clearInterval(tick);
  }, [running]);

  // Keyboard handler (ignores Shift/Ctrl/Alt modifiers, prevents page scroll, avoids StrictMode double scoring)
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!running) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === ' ' || e.key.startsWith('Arrow')) {
      e.preventDefault();
      return;
    }
    if (e.key.length !== 1) return;

    const pressed = e.key.toUpperCase();
    const currentLetters = lettersRef.current;
    const matches = currentLetters.filter((l) => l.char === pressed).sort((a, b) => b.y - a.y);
    if (matches.length > 0) {
      const target = matches[0];
      const nextLetters = currentLetters.filter((l) => l.id !== target.id);
      lettersRef.current = nextLetters;
      setLetters(nextLetters);

      const nextScore = scoreRef.current + 10 + comboRef.current;
      scoreRef.current = nextScore;
      setScore(nextScore);

      const nextCombo = comboRef.current + 1;
      comboRef.current = nextCombo;
      setCombo(nextCombo);
      setMaxCombo((m) => Math.max(m, nextCombo));
    } else if (comboRef.current !== 0) {
      comboRef.current = 0;
      setCombo(0);
    }
  }, [running]);

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
              </>
            )}
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
