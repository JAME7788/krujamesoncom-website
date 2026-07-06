import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
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
  {
    title: 'การแปรงฟัน',
    emoji: '🪥',
    steps: [
      'บีบยาสีฟันใส่แปรงสีฟัน',
      'บ้วนปากด้วยน้ำสะอาดรอบแรก',
      'แปรงฟันบนและล่างให้ทั่วทุกซี่',
      'แปรงลิ้นเบาๆ เพื่อขจัดสิ่งสกปรก',
      'บ้วนฟองยาสีฟันทั้งหมดทิ้ง',
      'ล้างแปรงสีฟันให้สะอาดเก็บเข้าที่',
    ],
  },
  {
    title: 'การล้างจาน',
    emoji: '🍽️',
    steps: [
      'กวาดเศษอาหารทิ้งลงถังขยะ',
      'เทน้ำยาล้างจานลงบนฟองน้ำ',
      'บีบฟองน้ำชุบน้ำให้เกิดฟอง',
      'ขัดถูทำความสะอาดจานให้ทั่ว',
      'ล้างจานด้วยน้ำเปล่าจนสะอาดไร้ฟอง',
      'คว่ำจานลงบนที่คว่ำจานเพื่อผึ่งลม',
    ],
  },
  {
    title: 'ทำผัดกะเพราไก่',
    emoji: '🌶️',
    steps: [
      'โขลกพริกกับกระเทียมให้พอหยาบ',
      'เจียวพริกกระเทียมในน้ำมันร้อนๆ',
      'ใส่เนื้อไก่ลงไปผัดจนเริ่มสุก',
      'ปรุงรสด้วยซอสหอยนางรมและน้ำปลา',
      'เด็ดใบกะเพราใส่แล้วผัดเร็วๆ จากนั้นปิดไฟ',
      'ตักราดข้าวสวยร้อนๆ พร้อมเสิร์ฟ',
    ],
  },
  {
    title: 'สมัครสมาชิกเว็บไซต์',
    emoji: '📝',
    steps: [
      'เปิดหน้าลงทะเบียนของเว็บไซต์',
      'กรอกชื่อผู้ใช้และตั้งรหัสผ่าน',
      'กรอกอีเมลติดต่อส่วนตัว',
      'กดยอมรับข้อตกลงและเงื่อนไข',
      'กดปุ่มยืนยันการสมัครสมาชิก',
      'เข้าไปกดยืนยันตัวตนในอีเมลที่ได้รับ',
    ],
  },
  {
    title: 'ตู้กดน้ำดื่มหยอดเหรียญ',
    emoji: '🪙',
    steps: [
      'เดินไปที่ตู้กดน้ำ',
      'เลือกเครื่องดื่มที่ต้องการ',
      'ดูหน้าจอแสดงราคาที่ต้องจ่าย',
      'หยอดเหรียญให้ครบถ้วนตามราคา',
      'รอให้เครื่องดื่มตกลงมาที่ช่องรับ',
      'หยิบขวดเครื่องดื่มและเงินทอน (ถ้ามี)',
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
  const [prevPuzzleIdx, setPrevPuzzleIdx] = useState(0);
  const [items, setItems] = useState<string[]>(() => shuffle(puzzles[0].steps));
  const [checked, setChecked] = useState(false);
  const [score, setScore] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const recordGame = useGameProgress('algorithm', 'จัดอัลกอริทึม');

  const puzzle = puzzles[puzzleIdx];

  if (puzzleIdx !== prevPuzzleIdx) {
    setPrevPuzzleIdx(puzzleIdx);
    setItems(shuffle(puzzle.steps));
    setChecked(false);
  }


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
    recordGame(score);
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
