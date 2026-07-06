import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';

interface Pattern {
  sequence: string[];
  options: string[];
  answer: string;
  hint: string;
}

const generatePattern = (level: number): Pattern => {
  const types = [
    () => {
      // Number sequence: +N
      const start = Math.floor(Math.random() * 10);
      const step = Math.floor(Math.random() * 5) + 1;
      const seq = [start, start + step, start + 2*step, start + 3*step].map(String);
      const correct = String(start + 4*step);
      return {
        sequence: seq,
        options: shuffle([correct, String(start + 5*step), String(start + 4*step + 1), String(start + 3*step)]),
        answer: correct,
        hint: `เพิ่มทีละ ${step}`,
      };
    },
    () => {
      // Multiplication: ×N
      const start = Math.max(1, Math.floor(Math.random() * 3));
      const mul = Math.floor(Math.random() * 2) + 2;
      const seq = [start, start*mul, start*mul*mul, start*mul*mul*mul].map(String);
      const correct = String(start * Math.pow(mul, 4));
      return {
        sequence: seq,
        options: shuffle([correct, String(start * Math.pow(mul, 5)), String(start * Math.pow(mul, 4) + 1), String(start * Math.pow(mul, 3))]),
        answer: correct,
        hint: `คูณทีละ ${mul}`,
      };
    },
    () => {
      // Color/emoji pattern: A B A B
      const symbols = [['🔴', '🔵'], ['⭐', '❤️'], ['🐶', '🐱'], ['☀️', '🌙']];
      const pair = symbols[Math.floor(Math.random() * symbols.length)];
      const seq = [pair[0], pair[1], pair[0], pair[1]];
      return {
        sequence: seq,
        options: shuffle([pair[0], pair[1], '🎨', '🎯']),
        answer: pair[0],
        hint: 'สลับไปมา',
      };
    },
    () => {
      // ABBA ABBA
      const symbols = [['🟢', '🔵'], ['🌸', '🌼'], ['🐯', '🦁']];
      const pair = symbols[Math.floor(Math.random() * symbols.length)];
      const seq = [pair[0], pair[1], pair[1], pair[0], pair[0]];
      return {
        sequence: seq,
        options: shuffle([pair[1], pair[0], '🎯', '⭐']),
        answer: pair[1],
        hint: 'ABBA AB?',
      };
    },
    () => {
      // Fibonacci-like
      const seq = ['1', '1', '2', '3', '5'];
      return {
        sequence: seq,
        options: shuffle(['8', '7', '6', '10']),
        answer: '8',
        hint: 'บวก 2 ตัวก่อนหน้า (Fibonacci)',
      };
    },
  ];
  // Higher level → harder patterns
  const fnIdx = Math.min(types.length - 1, Math.floor(Math.random() * (level + 1)));
  return types[fnIdx]();
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PatternGame: React.FC = () => {
  const [pattern, setPattern] = useState<Pattern>(() => generatePattern(0));
  const [picked, setPicked] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [level, setLevel] = useState(0);
  const [round, setRound] = useState(1);
  const [bestStreak, setBestStreak] = useState(() => parseInt(localStorage.getItem('kj_pat_best') || '0'));
  const recordGame = useGameProgress('pattern', 'หาแพทเทิร์น');

  const next = () => {
    const newLevel = Math.min(4, Math.floor(round / 3));
    setLevel(newLevel);
    setPattern(generatePattern(newLevel));
    setPicked(null);
    setShowResult(false);
    setRound((r) => r + 1);
  };

  const submit = (choice: string) => {
    setPicked(choice);
    setShowResult(true);
    recordGame(score);
    if (choice === pattern.answer) {
      setScore((s) => s + 20 + level * 5);
      setStreak((st) => {
        const ns = st + 1;
        if (ns > bestStreak) {
          setBestStreak(ns);
          localStorage.setItem('kj_pat_best', String(ns));
        }
        return ns;
      });
    } else {
      setStreak(0);
    }
  };

  const isCorrect = picked === pattern.answer;

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🔍 หาแพทเทิร์น</h2>
      </div>

      <div className="game-stats">
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">🔥 ติดต่อกัน: <strong>{streak}</strong></div>
        <div className="gstat">📊 รอบที่: <strong>{round}</strong></div>
        <div className="gstat">⚡ ระดับ: <strong>{['ง่าย', 'กลาง', 'กลาง', 'ยาก', 'โหด'][level]}</strong></div>
        <div className="gstat">🎯 ดีที่สุด: <strong>{bestStreak}</strong></div>
      </div>

      <div className="puzzle-card">
        <h3 style={{ textAlign: 'center', marginBottom: 16 }}>ทายตัวต่อไปในลำดับนี้</h3>

        <div className="pattern-sequence">
          {pattern.sequence.map((s, i) => (
            <div key={i} className="pattern-cell">{s}</div>
          ))}
          <div className="pattern-cell unknown">?</div>
        </div>

        <div className="pattern-options">
          {pattern.options.map((opt) => (
            <button
              key={opt}
              className={`pattern-opt ${picked === opt ? (isCorrect ? 'correct' : 'wrong') : ''} ${showResult && opt === pattern.answer ? 'correct' : ''}`}
              onClick={() => !showResult && submit(opt)}
              disabled={showResult}
            >
              {opt}
            </button>
          ))}
        </div>

        {showResult && (
          <div className={`puzzle-result ${isCorrect ? 'success' : 'fail'}`}>
            {isCorrect ? (
              <><CheckCircle2 size={20} /> ถูกต้อง! +{20 + level * 5} คะแนน • คำใบ้: {pattern.hint}</>
            ) : (
              <><XCircle size={20} /> ผิด — คำตอบคือ <strong>{pattern.answer}</strong> • {pattern.hint}</>
            )}
          </div>
        )}

        <div className="puzzle-actions">
          {showResult ? (
            <button className="btn-game-start" onClick={next}>
              <RotateCcw size={16} /> ข้อต่อไป →
            </button>
          ) : (
            <span style={{ color: '#6b7280' }}>เลือกคำตอบที่คิดว่าถูก</span>
          )}
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>Pattern Recognition</strong> = ทักษะการมองหาความสัมพันธ์ — ใช้ในการแก้โจทย์เลข, อัลกอริทึม, AI ทุกแบบ
      </div>
    </div>
  );
};

export default PatternGame;
