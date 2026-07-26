import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, CheckCircle2, XCircle, Lightbulb, Power } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';

type Gate = 'AND' | 'OR' | 'NOT' | 'XOR' | 'NAND' | 'NOR' | 'COMBO';
const SESSION_ROUNDS = 12;

const GATE_INFO: Record<Gate, { th: string; desc: string; inputs: number; formula: string }> = {
  AND: { th: 'AND (และ)', desc: 'ติดเมื่อ อินพุตเป็น 1 ทั้งคู่', inputs: 2, formula: 'A และ B' },
  OR: { th: 'OR (หรือ)', desc: 'ติดเมื่อ มีอินพุตเป็น 1 อย่างน้อยหนึ่ง', inputs: 2, formula: 'A หรือ B' },
  NOT: { th: 'NOT (ไม่)', desc: 'กลับค่า: 0 เป็น 1, 1 เป็น 0', inputs: 1, formula: 'ไม่ A' },
  XOR: { th: 'XOR (ต่างกัน)', desc: 'ติดเมื่ออินพุต A และ B มีค่าต่างกัน', inputs: 2, formula: 'A XOR B' },
  NAND: { th: 'NAND', desc: 'ดับเฉพาะเมื่อ A และ B เป็น 1 ทั้งคู่', inputs: 2, formula: 'ไม่ (A และ B)' },
  NOR: { th: 'NOR', desc: 'ติดเฉพาะเมื่อ A และ B เป็น 0 ทั้งคู่', inputs: 2, formula: 'ไม่ (A หรือ B)' },
  COMBO: { th: 'AND + OR', desc: '(A และ B) หรือ C', inputs: 3, formula: '(A และ B) หรือ C' },
};

const evaluate = (gate: Gate, s: number[]): number => {
  switch (gate) {
    case 'AND': return s[0] & s[1];
    case 'OR': return s[0] | s[1];
    case 'NOT': return s[0] === 0 ? 1 : 0;
    case 'XOR': return s[0] === s[1] ? 0 : 1;
    case 'NAND': return (s[0] & s[1]) === 1 ? 0 : 1;
    case 'NOR': return (s[0] | s[1]) === 1 ? 0 : 1;
    case 'COMBO': return (s[0] & s[1]) | s[2];
  }
};

const makeRound = (streak: number) => {
  const pool: Gate[] = streak >= 3
    ? ['AND', 'OR', 'NOT', 'XOR', 'NAND', 'NOR', 'COMBO']
    : ['AND', 'OR', 'NOT', 'XOR'];
  const gate = pool[Math.floor(Math.random() * pool.length)];
  const n = GATE_INFO[gate].inputs;
  let switches: number[];
  let target: number;
  do {
    switches = Array.from({ length: n }, () => Math.round(Math.random()));
    target = Math.round(Math.random());
  } while (evaluate(gate, switches) === target); // ไม่ให้เริ่มมาถูกเลย
  return { gate, switches, target };
};

const LogicGatesGame: React.FC = () => {
  const [round, setRound] = useState(() => makeRound(0));
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null);
  const [showTable, setShowTable] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [roundNumber, setRoundNumber] = useState(1);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem('kj_logic_best') || '0', 10));
  const recordGame = useGameProgress('logic-gates', 'ประตูตรรกะ');

  const info = GATE_INFO[round.gate];
  const output = evaluate(round.gate, round.switches);
  const labels = ['A', 'B', 'C'];

  const flip = (i: number) => {
    if (checked === 'correct') return;
    setChecked(null);
    setRound((r) => ({ ...r, switches: r.switches.map((v, idx) => (idx === i ? (v === 0 ? 1 : 0) : v)) }));
  };

  const next = () => {
    if (roundNumber >= SESSION_ROUNDS) {
      setDone(true);
      void recordGame(score);
      return;
    }
    setRound(makeRound(streak));
    setRoundNumber((value) => value + 1);
    setChecked(null);
  };

  const restart = () => {
    setRound(makeRound(0));
    setChecked(null);
    setScore(0);
    setStreak(0);
    setRoundNumber(1);
    setDone(false);
  };

  const check = () => {
    if (output === round.target) {
      setChecked('correct');
      const nextScore = score + 10;
      setScore(nextScore);
      // บันทึกเมื่อ "ตอบถูก" เท่านั้น พร้อมคะแนนจริง — ไม่ให้ฉลองตอนตอบผิด
      recordGame(nextScore);
      setStreak((st) => { const ns = st + 1; if (ns > best) { setBest(ns); localStorage.setItem('kj_logic_best', String(ns)); } return ns; });
    } else {
      setChecked('wrong');
      setStreak(0);
    }
  };

  const truthRows = round.gate === 'NOT'
    ? [[0], [1]]
    : round.gate === 'COMBO'
      ? [[0, 0, 0], [1, 1, 0], [0, 0, 1], [1, 1, 1]]
      : [[0, 0], [0, 1], [1, 0], [1, 1]];

  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🔌 ประตูตรรกะ (Logic Gates)</h2>
      </div>

      <div className="game-stats">
        <GameLearnCard gameKey="logic-gates" />
        <div className="gstat">🏆 คะแนน: <strong>{score}</strong></div>
        <div className="gstat">🔌 ข้อ: <strong>{Math.min(roundNumber, SESSION_ROUNDS)}/{SESSION_ROUNDS}</strong></div>
        <div className="gstat">🔥 ติดต่อกัน: <strong>{streak}</strong></div>
        <div className="gstat">🎯 ดีที่สุด: <strong>{best}</strong></div>
        <button className="gstat" onClick={() => setShowTable((s) => !s)}>
          <Lightbulb size={16} /> {showTable ? 'ซ่อนตารางค่าความจริง' : 'ดูตารางค่าความจริง'}
        </button>
      </div>

      <div className="binary-card logic-card">
        <div className="logic-goal">
          เป้าหมาย: ตั้งสวิตช์ให้หลอดไฟ
          <span className={`logic-goal-bulb ${round.target === 1 ? 'on' : 'off'}`}>
            {round.target === 1 ? '💡 ติด' : '🌑 ดับ'}
          </span>
        </div>

        <div className="logic-gate-name">{info.th}</div>
        <div className="logic-gate-desc">{info.desc}</div>

        <div className="logic-circuit">
          <div className="logic-switches">
            {round.switches.map((v, i) => (
              <button key={i} className={`logic-switch ${v === 1 ? 'on' : 'off'}`} onClick={() => flip(i)}>
                <span className="ls-label">{labels[i]}</span>
                <Power size={18} />
                <span className="ls-val">{v}</span>
              </button>
            ))}
          </div>
          <div className="logic-arrow">→ <span className="logic-op">{info.formula}</span> →</div>
          <div className={`logic-bulb ${output === 1 ? 'on' : 'off'}`}>
            <span className="lb-emoji">{output === 1 ? '💡' : '🌑'}</span>
            <span className="lb-txt">{output === 1 ? 'ติด (1)' : 'ดับ (0)'}</span>
          </div>
        </div>

        {showTable && (
          <table className="logic-table">
            <thead>
              <tr>{Array.from({ length: info.inputs }, (_, i) => <th key={i}>{labels[i]}</th>)}<th>ผลลัพธ์</th></tr>
            </thead>
            <tbody>
              {truthRows.map((r, ri) => (
                <tr key={ri}>{r.map((v, ci) => <td key={ci}>{v}</td>)}<td className="tt-out">{evaluate(round.gate, r)}</td></tr>
              ))}
            </tbody>
          </table>
        )}

        {checked === 'correct' && (
          <div className="puzzle-result success"><CheckCircle2 size={20} /> ถูกต้อง! หลอดไฟตรงเป้าหมาย — +10 คะแนน</div>
        )}
        {checked === 'wrong' && (
          <div className="puzzle-result fail"><XCircle size={20} /> ยังไม่ตรง — ตอนนี้หลอดไฟ{output === 1 ? 'ติด' : 'ดับ'} แต่ต้องการให้{round.target === 1 ? 'ติด' : 'ดับ'}</div>
        )}

        <div className="puzzle-actions">
          {done ? (
            <div className="puzzle-result success">
              <CheckCircle2 size={20} /> จบเกมแล้ว ได้ {score}/{SESSION_ROUNDS * 10} คะแนน
              <button className="btn-game-start" type="button" onClick={restart}><RotateCcw size={16} /> เล่นชุดใหม่</button>
            </div>
          ) : checked === 'correct' ? (
            <button className="btn-game-start" onClick={next}>
              <RotateCcw size={16} /> {roundNumber >= SESSION_ROUNDS ? 'ดูผลการเล่น' : 'ข้อต่อไป →'}
            </button>
          ) : (
            <button className="btn-game-start" onClick={check}>✓ ตรวจคำตอบ</button>
          )}
        </div>
      </div>

      <div className="game-tips">
        💡 <strong>รู้ไหม?</strong> ประตูตรรกะ (Logic Gate) คือหน่วยพื้นฐานที่สร้างจากทรานซิสเตอร์ในซีพียู — คอมพิวเตอร์ทั้งเครื่องคิดเลขและตัดสินใจได้ด้วยการต่อ AND, OR, NOT นับล้านตัว!
      </div>

      <style>{`
        .logic-card { max-width: 560px; text-align: center; }
        .logic-goal { font-size: 1.05rem; font-weight: 700; color: #1e293b; margin-bottom: 14px; display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; }
        .logic-goal-bulb { padding: 3px 12px; border-radius: 999px; font-weight: 800; }
        .logic-goal-bulb.on { background: #fef3c7; color: #d97706; }
        .logic-goal-bulb.off { background: #e2e8f0; color: #475569; }
        .logic-gate-name { font-size: 1.4rem; font-weight: 900; color: #6366f1; }
        .logic-gate-desc { font-size: 0.85rem; color: #64748b; margin: 4px 0 20px; }
        .logic-circuit { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-bottom: 18px; }
        .logic-switches { display: flex; flex-direction: column; gap: 8px; }
        .logic-switch { display: flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px; border: 2px solid #cbd5e1; background: #f8fafc; color: #64748b; font-weight: 700; cursor: pointer; font-family: inherit; min-width: 92px; }
        .logic-switch.on { border-color: #22c55e; background: #dcfce7; color: #15803d; }
        .ls-label { background: #fff; border-radius: 5px; width: 20px; height: 20px; display: inline-flex; align-items: center; justify-content: center; font-size: 0.8rem; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
        .ls-val { font-size: 1.1rem; font-weight: 900; margin-left: auto; }
        .logic-arrow { color: #94a3b8; font-weight: 700; display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .logic-op { background: #eef2ff; color: #4f46e5; padding: 4px 10px; border-radius: 8px; font-size: 0.82rem; }
        .logic-bulb { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 10px 16px; border-radius: 14px; border: 2px solid #e2e8f0; min-width: 92px; }
        .logic-bulb.on { background: #fffbeb; border-color: #fcd34d; box-shadow: 0 0 20px rgba(251,191,36,0.4); }
        .logic-bulb.off { background: #f1f5f9; }
        .lb-emoji { font-size: 1.8rem; }
        .lb-txt { font-size: 0.78rem; font-weight: 700; color: #64748b; }
        .logic-table { margin: 0 auto 6px; border-collapse: collapse; font-size: 0.85rem; }
        .logic-table th, .logic-table td { border: 1px solid #e2e8f0; padding: 5px 14px; text-align: center; }
        .logic-table th { background: #f1f5f9; color: #475569; font-weight: 700; }
        .logic-table .tt-out { font-weight: 800; color: #6366f1; background: #f8fafc; }
        @media (max-width: 480px) { .logic-circuit { gap: 8px; } .logic-switch { min-width: 78px; padding: 7px 9px; } }
      `}</style>
    </div>
  );
};

export default LogicGatesGame;
