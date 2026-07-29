import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Dices, Trophy, Users } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useAuth } from '../../context/AuthContext';
import GameLearnCard from '../../components/GameLearnCard';
import { ageTierFromClassroom } from '../../data/gameLessons';
import {
  BOARD, CT_PILLARS, PILLAR_ORDER, PLAYER_TOKENS, QUESTION_BANK,
} from '../../data/ctBoardGame';
import type { CTPillar, CTQuestion } from '../../data/ctBoardGame';
import { pickQuestionWithoutRecent } from '../../data/ctQuestionBank';
import { celebrateVictory } from '../../utils/victoryEffect';
import './GameStyles.css';

type Phase = 'setup' | 'roll' | 'card' | 'info' | 'won';

interface Player {
  idx: number;
  pos: number;
  stars: CTPillar[];
  score: number;
}

const LAST = BOARD.length - 1;
const newPlayer = (idx: number): Player => ({ idx, pos: 0, stars: [], score: 0 });
const hasAll = (p: Player) => PILLAR_ORDER.every((k) => p.stars.includes(k));

// สุ่มไว้นอกคอมโพเนนต์ — เรียกได้เฉพาะตอนผู้เล่นกด ไม่ใช่ตอน render
const rollDice = () => 1 + Math.floor(Math.random() * 6);

const CTBoardGame: React.FC = () => {
  const { user } = useAuth();
  const tier = ageTierFromClassroom(user?.classroom);
  const bank = QUESTION_BANK[tier];
  const recentQuestionKeysRef = useRef<string[]>([]);
  const recordGame = useGameProgress('ct-board', 'บอร์ดเกมเส้นทางนักคิดเชิงคำนวณ');

  const [count, setCount] = useState(2);
  const [players, setPlayers] = useState<Player[]>([]);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [dice, setDice] = useState<number | null>(null);
  const [card, setCard] = useState<CTQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const me = players[turn];

  const start = () => {
    recentQuestionKeysRef.current = [];
    setPlayers(Array.from({ length: count }, (_, i) => newPlayer(i)));
    setTurn(0); setPhase('roll'); setDice(null); setCard(null); setPicked(null);
    setMessage('ผู้เล่นคนแรก ทอยลูกเต๋าได้เลย!');
  };

  const restart = () => {
    recentQuestionKeysRef.current = [];
    setPhase('setup');
    setPlayers([]);
    setMessage('');
  };

  const drawCard = (pillar: CTPillar) => {
    const result = pickQuestionWithoutRecent(
      bank,
      recentQuestionKeysRef.current,
      pillar,
    );
    recentQuestionKeysRef.current = result.recentKeys;
    return result.question;
  };

  const nextTurn = (updated: Player[]) => {
    setPlayers(updated);
    setPicked(null); setCard(null); setDice(null);
    const nt = (turn + 1) % updated.length;
    setTurn(nt);
    setPhase('roll');
    setMessage(`ถึงตา ${PLAYER_TOKENS[nt].name} ทอยลูกเต๋า`);
  };

  /** จบเกมด้วยชัยชนะ — เปลี่ยนหน้าจอพร้อมยิงเอฟเฟกต์พลุ */
  const win = () => {
    setPhase('won');
    celebrateVictory();
  };

  const roll = () => {
    if (!me) return;
    const value = rollDice();
    setDice(value);
    const pos = Math.min(LAST, me.pos + value);
    const updated = players.map((p) => (p.idx === me.idx ? { ...p, pos } : p));
    setPlayers(updated);
    resolveTile(updated, pos);
  };

  const resolveTile = (updated: Player[], pos: number) => {
    const tile = BOARD[pos];
    const current = updated[turn];

    if (pos === LAST) {
      if (hasAll(current)) { win(); setMessage(''); void recordGame(current.score); return; }
      const missing = PILLAR_ORDER.filter((k) => !current.stars.includes(k));
      setCard(drawCard(missing[0]));
      setPhase('card');
      setMessage('ถึงเส้นชัยแล้ว! ตอบให้ถูกเพื่อเก็บดาวที่ยังขาด');
      return;
    }
    if (tile.kind === 'bonus') {
      const next = updated.map((p) => (p.idx === current.idx ? { ...p, score: p.score + 5 } : p));
      setPhase('info'); setPlayers(next);
      setMessage('⭐ ช่องโบนัส! ได้ 5 คะแนน');
      return;
    }
    if (tile.kind === 'event') {
      const moved = Math.max(0, Math.min(LAST, current.pos + (tile.move || 0)));
      const next = updated.map((p) => (p.idx === current.idx ? { ...p, pos: moved } : p));
      setPhase('info'); setPlayers(next);
      setMessage(`⚡ ${tile.text}`);
      return;
    }
    if (tile.kind === 'start') { setPhase('info'); setMessage('ช่องเริ่มต้น — ทอยต่อได้เลย'); return; }

    setCard(drawCard(tile.kind as CTPillar));
    setPhase('card');
    setMessage('');
  };

  const answer = (i: number) => {
    if (picked !== null || !card || !me) return;
    setPicked(i);
    const correct = i === card.answer;
    if (correct) {
      const updated = players.map((p) => (p.idx === me.idx
        ? { ...p, score: p.score + 10, stars: p.stars.includes(card.pillar) ? p.stars : [...p.stars, card.pillar] }
        : p));
      setPlayers(updated);
      // ถ้าอยู่เส้นชัยและเก็บดาวครบแล้ว = ชนะทันที
      const after = updated[turn];
      if (after.pos === LAST && hasAll(after)) {
        setTimeout(() => { win(); void recordGame(after.score); }, 900);
      }
    }
  };

  const continueTurn = () => {
    if (!me) return;
    const after = players[turn];
    if (after.pos === LAST && hasAll(after)) { win(); void recordGame(after.score); return; }
    nextTurn(players);
  };

  // ---------- SETUP ----------
  if (phase === 'setup') {
    return (
      <div className="game-page">
        <div className="game-topbar">
          <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
          <h2>🎲 เส้นทางนักคิดเชิงคำนวณ</h2>
        </div>
        <div className="game-stats"><GameLearnCard gameKey="ct-board" /></div>

        <div className="binary-card ctb-setup">
          <h3>เกมกระดานสำหรับเล่นด้วยกัน 2-4 คน</h3>
          <p className="ctb-sub">ผลัดกันทอยลูกเต๋า เดินตามช่อง ตอบคำถามเก็บดาวให้ครบ <b>4 ทักษะ</b> แล้วไปให้ถึงเส้นชัย</p>

          <div className="ctb-pillars">
            {PILLAR_ORDER.map((k) => (
              <div key={k} className="ctb-pillar" style={{ borderColor: CT_PILLARS[k].color }}>
                <span>{CT_PILLARS[k].emoji}</span>
                <b style={{ color: CT_PILLARS[k].color }}>{CT_PILLARS[k].name}</b>
              </div>
            ))}
          </div>

          <div className="ctb-count">
            <Users size={17} /> เล่นกี่คน?
            {[2, 3, 4].map((n) => (
              <button key={n} className={count === n ? 'on' : ''} onClick={() => setCount(n)}>{n} คน</button>
            ))}
          </div>
          <button className="btn-game-start ctb-start" onClick={start}>🎲 เริ่มเล่น</button>
        </div>

        <div className="game-tips">
          💡 <strong>เล่นในห้องเรียนได้:</strong> แบ่งนักเรียนเป็นกลุ่ม ผลัดกันมาทอยลูกเต๋าและช่วยกันตอบคำถามที่หน้าจอเดียวกัน
        </div>
        <BoardStyles />
      </div>
    );
  }

  // ---------- WIN ----------
  if (phase === 'won') {
    const winner = players[turn];
    return (
      <div className="game-page">
        <div className="game-topbar">
          <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
          <h2>🎲 เส้นทางนักคิดเชิงคำนวณ</h2>
        </div>
        <div className="binary-card ctb-win">
          <div className="ctb-win-emoji">{PLAYER_TOKENS[winner.idx].emoji}</div>
          <Trophy size={30} style={{ color: '#f59e0b' }} />
          <h2>{PLAYER_TOKENS[winner.idx].name} ชนะ!</h2>
          <p>เก็บดาวครบทั้ง 4 ทักษะ และไปถึงเส้นชัย — ได้ {winner.score} คะแนน</p>
          <div className="ctb-star-row">
            {PILLAR_ORDER.map((k) => (
              <span key={k} style={{ background: CT_PILLARS[k].color }}>{CT_PILLARS[k].emoji} {CT_PILLARS[k].short}</span>
            ))}
          </div>
          <button className="btn-game-start" onClick={restart}><RotateCcw size={16} /> เล่นใหม่</button>
        </div>
        <BoardStyles />
      </div>
    );
  }

  // ---------- PLAYING ----------
  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>🎲 เส้นทางนักคิดเชิงคำนวณ</h2>
      </div>

      <div className="game-stats">
        <GameLearnCard gameKey="ct-board" />
        <div className="gstat">🎯 ตาของ: <strong>{PLAYER_TOKENS[turn].emoji} {PLAYER_TOKENS[turn].name}</strong></div>
        {dice !== null && <div className="gstat">🎲 ทอยได้: <strong>{dice}</strong></div>}
      </div>

      {/* แถบผู้เล่น + ดาวที่เก็บได้ */}
      <div className="ctb-players">
        {players.map((p) => (
          <div key={p.idx} className={`ctb-player ${p.idx === turn ? 'active' : ''}`} style={{ borderColor: PLAYER_TOKENS[p.idx].color }}>
            <span className="ctb-token">{PLAYER_TOKENS[p.idx].emoji}</span>
            <div>
              <b>{PLAYER_TOKENS[p.idx].name}</b>
              <div className="ctb-mini-stars">
                {PILLAR_ORDER.map((k) => (
                  <span key={k} className={p.stars.includes(k) ? 'got' : ''} title={CT_PILLARS[k].name}>{CT_PILLARS[k].emoji}</span>
                ))}
              </div>
            </div>
            <span className="ctb-score">{p.score}</span>
          </div>
        ))}
      </div>

      {/* กระดาน */}
      <div className="ctb-board">
        {BOARD.map((tile, i) => {
          const here = players.filter((p) => p.pos === i);
          const pillar = PILLAR_ORDER.includes(tile.kind as CTPillar) ? CT_PILLARS[tile.kind as CTPillar] : null;
          return (
            <div key={i} className={`ctb-tile k-${tile.kind}`} style={pillar ? { borderColor: pillar.color } : undefined}>
              <span className="ctb-tile-no">{i}</span>
              <span className="ctb-tile-face">
                {pillar ? pillar.emoji
                  : tile.kind === 'start' ? '🚩'
                    : tile.kind === 'finish' ? '🏁'
                      : tile.kind === 'bonus' ? '⭐' : '⚡'}
              </span>
              {here.length > 0 && (
                <span className="ctb-tile-players">
                  {here.map((p) => <i key={p.idx}>{PLAYER_TOKENS[p.idx].emoji}</i>)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {message && <div className="ctb-message">{message}</div>}

      {phase === 'roll' && (
        <div className="puzzle-actions">
          <button className="btn-game-start ctb-dice" onClick={roll}>
            <Dices size={20} /> ทอยลูกเต๋า
          </button>
        </div>
      )}

      {phase === 'info' && (
        <div className="puzzle-actions">
          <button className="btn-game-start" onClick={() => nextTurn(players)}>ตาถัดไป →</button>
        </div>
      )}

      {phase === 'card' && card && (
        <div className="binary-card ctb-card" style={{ borderTopColor: CT_PILLARS[card.pillar].color }}>
          <div className="ctb-card-tag" style={{ background: CT_PILLARS[card.pillar].color }}>
            {CT_PILLARS[card.pillar].emoji} การ์ด{CT_PILLARS[card.pillar].name}
          </div>
          <p className="ctb-q">{card.q}</p>
          <div className="ctb-choices">
            {card.choices.map((c, i) => {
              const state = picked === null ? '' : i === card.answer ? 'right' : picked === i ? 'wrong' : 'dim';
              return (
                <button key={i} className={`ctb-choice ${state}`} onClick={() => answer(i)} disabled={picked !== null}>
                  {c}
                </button>
              );
            })}
          </div>
          {picked !== null && (
            <>
              <div className={`puzzle-result ${picked === card.answer ? 'success' : 'fail'}`}>
                {picked === card.answer
                  ? `✅ ถูกต้อง! ได้ดาว ${CT_PILLARS[card.pillar].emoji} +10 คะแนน — ${card.why}`
                  : `❌ ยังไม่ใช่ — ${card.why}`}
              </div>
              <div className="puzzle-actions">
                <button className="btn-game-start" onClick={continueTurn}>ตาถัดไป →</button>
              </div>
            </>
          )}
        </div>
      )}

      <BoardStyles />
    </div>
  );
};

const BoardStyles: React.FC = () => (
  <style>{`
    .ctb-setup, .ctb-win { max-width: 620px; text-align: center; }
    .ctb-setup h3 { margin: 0 0 6px; font-size: 1.25rem; }
    .ctb-sub { color: #475569; line-height: 1.65; margin: 0 0 16px; }
    .ctb-pillars { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 8px; margin-bottom: 18px; }
    .ctb-pillar { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border: 2px solid; border-radius: 12px; background: #fff; font-size: 0.86rem; }
    .ctb-pillar span { font-size: 1.4rem; }
    .ctb-count { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; font-weight: 700; color: #475569; }
    .ctb-count button { padding: 8px 16px; border-radius: 999px; border: 2px solid #e2e8f0; background: #fff; font-family: inherit; font-weight: 800; cursor: pointer; color: #64748b; }
    .ctb-count button.on { border-color: #6366f1; background: #eef2ff; color: #4f46e5; }
    .ctb-start { width: 100%; justify-content: center; }

    .ctb-players { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 8px; margin-bottom: 14px; }
    .ctb-player { display: flex; align-items: center; gap: 9px; padding: 9px 12px; border: 2px solid #e2e8f0; border-radius: 12px; background: #fff; opacity: 0.62; }
    .ctb-player.active { opacity: 1; box-shadow: 0 4px 14px rgba(15,23,42,0.12); transform: translateY(-2px); }
    .ctb-token { font-size: 1.7rem; }
    .ctb-player b { font-size: 0.86rem; }
    .ctb-mini-stars { display: flex; gap: 3px; margin-top: 2px; }
    .ctb-mini-stars span { font-size: 0.95rem; filter: grayscale(1); opacity: 0.35; }
    .ctb-mini-stars span.got { filter: none; opacity: 1; }
    .ctb-score { margin-left: auto; font-weight: 900; color: #4f46e5; }

    .ctb-board { display: grid; grid-template-columns: repeat(auto-fit, minmax(62px, 1fr)); gap: 6px; margin-bottom: 14px; }
    .ctb-tile { position: relative; aspect-ratio: 1; border: 2px solid #e2e8f0; border-radius: 10px; background: #f8fafc; display: grid; place-items: center; }
    .ctb-tile.k-start { background: #dcfce7; border-color: #22c55e; }
    .ctb-tile.k-finish { background: #fef3c7; border-color: #f59e0b; }
    .ctb-tile.k-bonus { background: #fffbeb; border-color: #fcd34d; }
    .ctb-tile.k-event { background: #f5f3ff; border-color: #c4b5fd; }
    .ctb-tile-no { position: absolute; top: 2px; left: 4px; font-size: 0.6rem; color: #94a3b8; font-weight: 700; }
    .ctb-tile-face { font-size: 1.5rem; }
    .ctb-tile-players { position: absolute; bottom: 1px; display: flex; gap: 1px; }
    .ctb-tile-players i { font-style: normal; font-size: 1rem; }

    .ctb-message { text-align: center; padding: 10px 14px; border-radius: 10px; background: #eef2ff; color: #3730a3; font-weight: 700; margin-bottom: 12px; }
    .ctb-dice { font-size: 1.05rem; }

    .ctb-card { max-width: 620px; border-top: 6px solid #6366f1; }
    .ctb-card-tag { display: inline-block; padding: 4px 14px; border-radius: 999px; color: #fff; font-size: 0.76rem; font-weight: 800; }
    .ctb-q { font-size: 1.08rem; font-weight: 700; color: #1e293b; line-height: 1.6; margin: 12px 0 14px; }
    .ctb-choices { display: flex; flex-direction: column; gap: 8px; }
    .ctb-choice { padding: 12px 14px; border-radius: 10px; border: 2px solid #e2e8f0; background: #fff; text-align: left; font-family: inherit; font-size: 0.95rem; color: #1f2937; cursor: pointer; }
    .ctb-choice:hover:not(:disabled) { border-color: #93c5fd; background: #f8fafc; }
    .ctb-choice.right { border-color: #22c55e; background: #dcfce7; }
    .ctb-choice.wrong { border-color: #ef4444; background: #fee2e2; }
    .ctb-choice.dim { opacity: 0.5; }

    .ctb-win-emoji { font-size: 3.4rem; }
    .ctb-star-row { display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; margin: 12px 0 16px; }
    .ctb-star-row span { padding: 4px 12px; border-radius: 999px; color: #fff; font-size: 0.78rem; font-weight: 800; }

    @media (max-width: 520px) {
      .ctb-board { grid-template-columns: repeat(auto-fit, minmax(48px, 1fr)); gap: 4px; }
      .ctb-tile-face { font-size: 1.15rem; }
    }
  `}</style>
);

export default CTBoardGame;
