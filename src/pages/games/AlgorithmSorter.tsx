import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import GameLearnCard from '../../components/GameLearnCard';
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
      'ล้างแปรงสีฟันและทำขนแปรงให้เปียก',
      'บีบยาสีฟันใส่แปรงสีฟัน',
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
  {
    title: 'สำรองไฟล์งาน',
    emoji: '☁️',
    steps: [
      'ตรวจว่าไฟล์งานฉบับล่าสุดบันทึกแล้ว',
      'ตั้งชื่อไฟล์ให้บอกหัวข้อและวันที่',
      'เชื่อมต่อพื้นที่สำรองข้อมูลที่ปลอดภัย',
      'คัดลอกหรืออัปโหลดไฟล์ไปยังโฟลเดอร์สำรอง',
      'เปิดโฟลเดอร์สำรองเพื่อตรวจว่าไฟล์อยู่ครบ',
      'ออกจากระบบเมื่อใช้เครื่องส่วนกลาง',
    ],
  },
  {
    title: 'ค้นข้อมูลทำรายงาน',
    emoji: '🔎',
    steps: [
      'กำหนดคำถามหรือหัวข้อที่ต้องการค้น',
      'เลือกคำค้นที่เฉพาะเจาะจง',
      'เปิดผลการค้นจากแหล่งที่น่าเชื่อถือ',
      'ตรวจผู้เขียน วันที่ และหลักฐานอ้างอิง',
      'เปรียบเทียบข้อมูลมากกว่าหนึ่งแหล่ง',
      'สรุปด้วยภาษาของตนเองและบันทึกที่มา',
    ],
  },
  {
    title: 'สร้างโปรแกรม Scratch',
    emoji: '🐱',
    steps: [
      'กำหนดว่าตัวละครต้องทำอะไร',
      'เขียนลำดับขั้นตอนเป็นภาษาง่าย ๆ',
      'เลือกตัวละครและฉากที่ต้องใช้',
      'วางบล็อกคำสั่งตามลำดับ',
      'กดธงเขียวเพื่อทดสอบโปรแกรม',
      'หาข้อผิดพลาด แก้ไข และทดสอบซ้ำ',
    ],
  },
  {
    title: 'พิมพ์เอกสาร',
    emoji: '🖨️',
    steps: [
      'เปิดเอกสารที่ต้องการพิมพ์',
      'ตรวจคำผิดและรูปแบบของเอกสาร',
      'เปิดหน้าตัวอย่างก่อนพิมพ์',
      'เลือกเครื่องพิมพ์ ขนาดกระดาษ และจำนวนหน้า',
      'ตรวจว่ามีกระดาษและเครื่องพิมพ์พร้อม',
      'กดพิมพ์และตรวจเอกสารที่ออกมา',
    ],
  },
  {
    title: 'ส่งอีเมลอย่างปลอดภัย',
    emoji: '🛡️',
    steps: [
      'ตรวจที่อยู่อีเมลของผู้รับ',
      'เขียนหัวข้อให้บอกเรื่องชัดเจน',
      'พิมพ์ข้อความด้วยถ้อยคำสุภาพ',
      'แนบเฉพาะไฟล์ที่ต้องการส่ง',
      'ตรวจผู้รับ ข้อความ และไฟล์แนบอีกครั้ง',
      'กดส่งและออกจากระบบเมื่อใช้เครื่องส่วนกลาง',
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
  const [done, setDone] = useState(false);
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
    const correct = items.every((it, i) => it === puzzle.steps[i]);
    if (correct) {
      const nextScore = score + 50;
      setScore(nextScore);
      setSolvedCount((c) => c + 1);
      // บันทึกเมื่อเรียงถูกเท่านั้น พร้อมคะแนนจริง — ไม่ให้ฉลองตอนตอบผิด
      recordGame(nextScore);
    }
  };

  const next = () => {
    if (!isCorrect) return;
    if (puzzleIdx + 1 >= puzzles.length) {
      setDone(true);
      void recordGame(score);
      return;
    }
    setPuzzleIdx((i) => i + 1);
  };

  const reset = () => {
    setItems(shuffle(puzzle.steps));
    setChecked(false);
  };

  const isCorrect = checked && items.every((it, i) => it === puzzle.steps[i]);

  const restartGame = () => {
    setPuzzleIdx(0);
    setPrevPuzzleIdx(0);
    setItems(shuffle(puzzles[0].steps));
    setChecked(false);
    setScore(0);
    setSolvedCount(0);
    setDone(false);
  };

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🧩 จัดอัลกอริทึม</h2>
      </div>

      <div className="game-stats">
        <GameLearnCard gameKey="algorithm" />
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">✅ แก้ได้: <strong>{solvedCount}</strong> ปริศนา</div>
        <div className="gstat">📋 ปริศนา <strong>{puzzleIdx + 1} / {puzzles.length}</strong></div>
      </div>

      {done ? (
        <div className="puzzle-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem' }}>🏆</div>
          <h2>เรียงครบ {puzzles.length} ปริศนาแล้ว</h2>
          <p>ได้ {score}/{puzzles.length * 50} คะแนน</p>
          <button className="btn-game-start" type="button" onClick={restartGame}>
            <RotateCcw size={16} /> เล่นชุดใหม่
          </button>
        </div>
      ) : (
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
          {isCorrect && (
            <button className="btn-secondary" onClick={next}>
              {puzzleIdx + 1 >= puzzles.length ? 'ดูผลการเล่น' : 'ปริศนาถัดไป →'}
            </button>
          )}
        </div>
      </div>
      )}

      <div className="game-tips">
        💡 <strong>คิดเป็นขั้นตอน</strong> = หัวใจของอัลกอริทึม — ก่อนเขียนโปรแกรมต้องวางลำดับให้ถูกก่อน
      </div>
    </div>
  );
};

export default AlgorithmSorter;
