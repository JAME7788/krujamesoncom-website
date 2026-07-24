import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';

type Part = 'input' | 'process' | 'output';
interface Device { name: string; emoji: string; input: string; process: string; output: string; }

const DEVICES: Device[] = [
  { name: 'หม้อหุงข้าวไฟฟ้า', emoji: '🍚', input: 'ข้าวสาร น้ำ และไฟฟ้า', process: 'ให้ความร้อนจนน้ำเดือดและถูกข้าวดูดซึม', output: 'ข้าวสุกพร้อมรับประทาน' },
  { name: 'พัดลม', emoji: '🌀', input: 'ไฟฟ้า และการกดปุ่มเลือกระดับ', process: 'มอเตอร์หมุนใบพัด', output: 'ลมเย็นพัดออกมา' },
  { name: 'เครื่องปิ้งขนมปัง', emoji: '🍞', input: 'ขนมปัง และไฟฟ้า', process: 'ขดลวดความร้อนแผ่ความร้อน', output: 'ขนมปังปิ้งกรอบ' },
  { name: 'เครื่องซักผ้า', emoji: '🧺', input: 'ผ้า น้ำ ผงซักฟอก และไฟฟ้า', process: 'ถังหมุนปั่นและซักทำความสะอาด', output: 'ผ้าสะอาด' },
  { name: 'ไฟฉาย', emoji: '🔦', input: 'แบตเตอรี่ และการกดสวิตช์', process: 'กระแสไฟทำให้หลอดไฟเปล่งแสง', output: 'แสงสว่าง' },
  { name: 'เครื่องปั่นน้ำผลไม้', emoji: '🥤', input: 'ผลไม้ น้ำ ไฟฟ้า และการกดสวิตช์', process: 'มอเตอร์หมุนใบมีดให้วัตถุดิบละเอียดและผสมกัน', output: 'น้ำผลไม้ปั่น' },
  { name: 'เครื่องปรับอากาศ', emoji: '❄️', input: 'ไฟฟ้า อุณหภูมิที่ตั้ง และอากาศในห้อง', process: 'ระบบทำความเย็นถ่ายเทความร้อนออกจากห้อง', output: 'อากาศในห้องเย็นลง' },
  { name: 'โทรศัพท์มือถือ', emoji: '📱', input: 'คำสั่งสัมผัส ข้อมูล และพลังงานจากแบตเตอรี่', process: 'หน่วยประมวลผลทำงานตามโปรแกรม', output: 'ภาพ เสียง หรือข้อมูลที่ผู้ใช้ต้องการ' },
  { name: 'เครื่องกรองน้ำ', emoji: '🚰', input: 'น้ำที่ต้องการกรอง', process: 'ไส้กรองดักตะกอน กลิ่น และสิ่งปนเปื้อน', output: 'น้ำที่สะอาดขึ้น' },
  { name: 'ระบบรดน้ำอัตโนมัติ', emoji: '🌿', input: 'ค่าความชื้นในดิน น้ำ และไฟฟ้า', process: 'ตัวควบคุมสั่งเปิดปั๊มเมื่อดินแห้ง', output: 'ดินได้รับน้ำในเวลาที่เหมาะสม' },
  { name: 'เครื่องคิดเลข', emoji: '🧮', input: 'ตัวเลขและเครื่องหมายการคำนวณ', process: 'วงจรประมวลผลตามกฎทางคณิตศาสตร์', output: 'ผลลัพธ์การคำนวณ' },
  { name: 'ประตูอัตโนมัติ', emoji: '🚪', input: 'สัญญาณจากเซนเซอร์ตรวจพบคนและไฟฟ้า', process: 'ตัวควบคุมสั่งมอเตอร์ให้เลื่อนบานประตู', output: 'ประตูเปิดหรือปิด' },
];

const SLOTS: { key: Part; label: string; en: string; color: string }[] = [
  { key: 'input', label: 'ตัวป้อน', en: 'Input', color: '#3b82f6' },
  { key: 'process', label: 'กระบวนการ', en: 'Process', color: '#f59e0b' },
  { key: 'output', label: 'ผลผลิต', en: 'Output', color: '#22c55e' },
];

const shuffle = <T,>(a: T[]): T[] => { const r = [...a]; for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };

const makeSession = () => shuffle(DEVICES.map((_, deviceIdx) => deviceIdx)).map((deviceIdx) => ({
  deviceIdx,
  cards: shuffle<Part>(['input', 'process', 'output']),
}));

const TechSystemGame: React.FC = () => {
  const [session, setSession] = useState(makeSession);
  const [roundIndex, setRoundIndex] = useState(0);
  const [done, setDone] = useState(false);
  const round = session[roundIndex];
  const device = DEVICES[round.deviceIdx];
  const cards = round.cards;
  const [placed, setPlaced] = useState<Record<Part, Part | null>>({ input: null, process: null, output: null });
  const [selected, setSelected] = useState<Part | null>(null);
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null);
  const [showHelp, setShowHelp] = useState(true);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('kj_techsys_best') || '0', 10));
  const recordGame = useGameProgress('tech-system', 'ระบบทางเทคโนโลยี');

  const usedCards = Object.values(placed).filter(Boolean) as Part[];
  const cardText = (p: Part) => device[p];

  const clickCard = (p: Part) => {
    if (checked === 'correct' || usedCards.includes(p)) return;
    setSelected(selected === p ? null : p);
  };
  const clickSlot = (slot: Part) => {
    if (checked === 'correct') return;
    setChecked(null);
    if (placed[slot]) { // remove back to pool
      setPlaced((prev) => ({ ...prev, [slot]: null }));
      return;
    }
    if (selected) {
      setPlaced((prev) => ({ ...prev, [slot]: selected }));
      setSelected(null);
    }
  };

  const next = () => {
    if (roundIndex + 1 >= session.length) {
      setDone(true);
      void recordGame(score);
      return;
    }
    setRoundIndex((value) => value + 1);
    setPlaced({ input: null, process: null, output: null });
    setSelected(null); setChecked(null);
  };

  const restart = () => {
    setSession(makeSession());
    setRoundIndex(0);
    setPlaced({ input: null, process: null, output: null });
    setSelected(null);
    setChecked(null);
    setScore(0);
    setStreak(0);
    setDone(false);
  };

  const check = () => {
    recordGame(score);
    const win = SLOTS.every((s) => placed[s.key] === s.key);
    if (win) {
      setChecked('correct');
      setScore((s) => s + 10);
      setStreak((st) => { const ns = st + 1; if (ns > best) { setBest(ns); localStorage.setItem('kj_techsys_best', String(ns)); } return ns; });
    } else { setChecked('wrong'); setStreak(0); }
  };

  const allPlaced = usedCards.length === 3;

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>⚙️ ระบบทางเทคโนโลยี</h2>
      </div>

      <div className="game-stats">
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">⚙️ ระบบ: <strong>{Math.min(roundIndex + 1, session.length)}/{session.length}</strong></div>
        <div className="gstat">🔥 ติดต่อกัน: <strong>{streak}</strong></div>
        <div className="gstat">🎯 ดีที่สุด: <strong>{best}</strong></div>
        <button className="gstat" onClick={() => setShowHelp((s) => !s)}><Lightbulb size={16} /> {showHelp ? 'ซ่อนคำใบ้' : 'แสดงคำใบ้'}</button>
      </div>

      <div className="binary-card ts-card">
        <div className="ts-device">
          <span className="ts-emoji">{device.emoji}</span>
          <div><div className="ts-name">{device.name}</div><div className="ts-hint">ลากความหมายไปวางในช่อง ตัวป้อน → กระบวนการ → ผลผลิต ให้ถูก</div></div>
        </div>

        <div className="ts-slots">
          {SLOTS.map((s, i) => {
            const p = placed[s.key];
            const state = checked === 'correct' ? 'win' : checked === 'wrong' && p && p !== s.key ? 'bad' : p ? 'filled' : 'empty';
            return (
              <React.Fragment key={s.key}>
                {i > 0 && <div className="ts-arrow">→</div>}
                <button className={`ts-slot ${state}`} style={{ borderColor: p ? s.color : undefined }} onClick={() => clickSlot(s.key)}>
                  <div className="ts-slot-label" style={{ color: s.color }}>{s.label} <small>({s.en})</small></div>
                  <div className="ts-slot-body">{p ? cardText(p) : <span className="ts-slot-ph">แตะเพื่อวางการ์ด</span>}</div>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="ts-pool">
          {cards.map((p) => {
            const used = usedCards.includes(p);
            return (
              <button key={p} className={`ts-pcard ${selected === p ? 'sel' : ''} ${used ? 'used' : ''}`} onClick={() => clickCard(p)} disabled={used}>
                {cardText(p)}
              </button>
            );
          })}
        </div>

        {checked === 'correct' && <div className="puzzle-result success"><CheckCircle2 size={20} /> ถูกต้อง! เข้าใจระบบ Input–Process–Output แล้ว — +10 คะแนน</div>}
        {checked === 'wrong' && <div className="puzzle-result fail"><XCircle size={20} /> ยังไม่ถูกทุกช่อง ลองสลับการ์ดดูใหม่</div>}

        <div className="puzzle-actions">
          {done ? (
            <div className="puzzle-result success">
              <CheckCircle2 size={20} /> ทำครบ {session.length} ระบบ ได้ {score}/{session.length * 10} คะแนน
              <button className="btn-game-start" type="button" onClick={restart}><RotateCcw size={16} /> เล่นชุดใหม่</button>
            </div>
          ) : checked === 'correct' ? (
            <button className="btn-game-start" onClick={next}>
              <RotateCcw size={16} /> {roundIndex + 1 >= session.length ? 'ดูผลการเล่น' : 'อุปกรณ์ต่อไป →'}
            </button>
          ) : (
            <button className="btn-game-start" onClick={check} disabled={!allPlaced}>✓ ตรวจคำตอบ</button>
          )}
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>รู้ไหม?</strong> ทุกเทคโนโลยีทำงานเป็น “ระบบ” — มี <b>ตัวป้อน (Input)</b> สิ่งที่ใส่เข้าไป, <b>กระบวนการ (Process)</b> การทำงานข้างใน, และ <b>ผลผลิต (Output)</b> สิ่งที่ได้ออกมา บางระบบยังมี <b>ข้อมูลย้อนกลับ (Feedback)</b> เพื่อปรับปรุงการทำงานด้วย
      </div>

      <style>{`
        .ts-card { max-width: 640px; }
        .ts-device { display: flex; align-items: center; gap: 14px; background: #f8fafc; border-radius: 12px; padding: 12px 16px; margin-bottom: 16px; }
        .ts-emoji { font-size: 2.6rem; }
        .ts-name { font-weight: 800; font-size: 1.2rem; color: #1e293b; }
        .ts-hint { font-size: 0.8rem; color: #64748b; margin-top: 2px; }
        .ts-slots { display: flex; align-items: stretch; gap: 6px; margin-bottom: 16px; }
        .ts-arrow { align-self: center; color: #94a3b8; font-weight: 800; font-size: 1.2rem; }
        .ts-slot { flex: 1; min-height: 96px; border: 2px dashed #cbd5e1; border-radius: 12px; background: #fff; padding: 10px; cursor: pointer; text-align: center; font-family: inherit; display: flex; flex-direction: column; gap: 6px; }
        .ts-slot.filled { border-style: solid; background: #f8fafc; }
        .ts-slot.win { border-style: solid; background: #dcfce7; border-color: #22c55e !important; }
        .ts-slot.bad { border-style: solid; background: #fee2e2; border-color: #ef4444 !important; }
        .ts-slot-label { font-weight: 800; font-size: 0.9rem; }
        .ts-slot-body { font-size: 0.85rem; color: #334155; line-height: 1.4; }
        .ts-slot-ph { color: #cbd5e1; font-size: 0.8rem; }
        .ts-pool { display: flex; flex-direction: column; gap: 8px; }
        .ts-pcard { padding: 12px 14px; border-radius: 10px; border: 2px solid #e2e8f0; background: #fff; color: #1e293b; font-size: 0.92rem; font-family: inherit; cursor: pointer; text-align: left; transition: all 0.1s; }
        .ts-pcard.sel { border-color: #6366f1; background: #eef2ff; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .ts-pcard.used { opacity: 0.3; cursor: not-allowed; text-decoration: line-through; }
        @media (max-width: 560px) { .ts-slots { flex-direction: column; } .ts-arrow { transform: rotate(90deg); } }
      `}</style>
    </div>
  );
};

export default TechSystemGame;
