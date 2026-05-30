import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import './GameStyles.css';

interface Puzzle {
  title: string;
  emoji: string;
  steps: string[]; // ลำดับที่ถูกต้อง
}

const puzzles: Puzzle[] = [
  {
    title: 'ทำไข่เจียว',
    emoji: '🍳',
    steps: [
      'ตอกไข่ลงในชาม',
      'เติมเกลือและพริกไทย',
      'ตีไข่ให้เข้ากัน',
      'ตั้งกะทะใส่น้ำมัน',
      'เทไข่ลงในกะทะ',
      'พลิกกลับด้าน',
      'ยกขึ้นใส่จาน',
    ],
  },
  {
    title: 'ส่งอีเมล',
    emoji: '📧',
    steps: [
      'เปิดแอปอีเมล',
      'กดปุ่มเขียนใหม่',
      'พิมพ์ที่อยู่ผู้รับ',
      'พิมพ์หัวข้อเรื่อง',
      'พิมพ์เนื้อหา',
      'ตรวจคำผิด',
      'กดปุ่มส่ง',
    ],
  },
  {
    title: 'ปลูกต้นไม้',
    emoji: '🌱',
    steps: [
      'ขุดหลุมในดิน',
      'วางต้นไม้ลงในหลุม',
      'กลบดินรอบราก',
      'รดน้ำให้ชุ่ม',
      'ตั้งหลักไม้ค้ำ',
      'รดน้ำเป็นประจำ',
    ],
  },
  {
    title: 'แต่งตัวไปโรงเรียน',
    emoji: '🎒',
    steps: [
      'ตื่นนอน',
      'แปรงฟัน ล้างหน้า',
      'อาบน้ำ',
      'ใส่ชุดนักเรียน',
      'หวีผม',
      'ใส่ถุงเท้า รองเท้า',
      'แบกกระเป๋า',
      'ออกจากบ้าน',
    ],
  },
  {
    title: 'เขียนโปรแกรมเดิน',
    emoji: '🤖',
    steps: [
      'เริ่มต้น (Start)',
      'ตรวจสอบว่ามีกำแพงข้างหน้าหรือไม่',
      'ถ้าไม่มี → เดินไปข้างหน้า 1 ก้าว',
      'ถ้ามี → หมุนซ้าย 90 องศา',
      'ทำซ้ำจนถึงเป้าหมาย',
      'จบโปรแกรม (Stop)',
    ],
  },
];

// Fisher-Yates shuffle
const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const AlgorithmSorter: React.FC = () => {
  const [puzzleIdx, setPuzzleIdx] = useState(0);
  const [items, setItems] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);

  const puzzle = puzzles[puzzleIdx];

  useEffect(() => {
    setItems(shuffle(puzzle.steps));
    setChecked(false);
  }, [puzzleIdx]);

  const move = (idx: number, dir: -1 | 1) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= items.length) return;
    const next = [...items];
    [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
    setItems(next);
    setChecked(false);
  };

  const check = () => {
    setChecked(true);
    const correct = items.every((it, i) => it === puzzle.steps[i]);
    if (correct) {
      setScore((s) => s + 50);
      setSolvedCount((c) => c + 1);
    }
  };

  const next = () => {
    setPuzzleIdx((i) => (i + 1) % puzzles.length);
  };

  const reset = () => {
    setItems(shuffle(puzzle.steps));
    setChecked(false);
  };

  const isCorrect = checked && items.every((it, i) => it === puzzle.steps[i]);

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🧩 จัดอัลกอริทึม</h2>
      </div>

      <div className="game-stats">
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">✅ แก้ได้: <strong>{solvedCount}</strong> ปริศนา</div>
        <div className="gstat">📋 ปริศนา <strong>{puzzleIdx + 1} / {puzzles.length}</strong></div>
      </div>

      <div className="puzzle-card">
        <div className="puzzle-header">
          <span className="puzzle-emoji">{puzzle.emoji}</span>
          <h3>เรียงลำดับขั้นตอน: <strong>{puzzle.title}</strong></h3>
        </div>

        <div className="sortable-list">
          {items.map((item, i) => {
            const isWrong = checked && item !== puzzle.steps[i];
            const isOk = checked && item === puzzle.steps[i];
            return (
              <div
                key={item}
                className={`sortable-item ${isWrong ? 'wrong' : ''} ${isOk ? 'ok' : ''}`}
              >
                <span className="si-num">{i + 1}</span>
                <span className="si-text">{item}</span>
                <div className="si-controls">
                  <button onClick={() => move(i, -1)} disabled={i === 0} title="ขึ้น">
                    <ArrowUp size={14} />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} title="ลง">
                    <ArrowDown size={14} />
                  </button>
                </div>
                {isWrong && <XCircle size={18} className="si-icon wrong-c" />}
                {isOk && <CheckCircle2 size={18} className="si-icon ok-c" />}
              </div>
            );
          })}
        </div>

        {checked && (
          <div className={`puzzle-result ${isCorrect ? 'success' : 'fail'}`}>
            {isCorrect ? (
              <>🎉 ถูกต้องทั้งหมด! +50 คะแนน</>
            ) : (
              <>❌ ยังไม่ถูก ลองสลับลำดับใหม่ดูสิ — ดู ❌ ขึ้นจุดไหนแสดงว่าผิด</>
            )}
          </div>
        )}

        <div className="puzzle-actions">
          <button className="btn-secondary" onClick={reset}>
            <RotateCcw size={16} /> สุ่มใหม่
          </button>
          {!isCorrect && (
            <button className="btn-game-start" onClick={check}>
              ✓ ตรวจคำตอบ
            </button>
          )}
          <button className="btn-secondary" onClick={next}>
            ปริศนาถัดไป →
          </button>
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>คิดเป็นขั้นตอน</strong> = หัวใจของอัลกอริทึม — ก่อนเขียนโปรแกรมต้องวางลำดับให้ถูกก่อน
      </div>
    </div>
  );
};

export default AlgorithmSorter;
