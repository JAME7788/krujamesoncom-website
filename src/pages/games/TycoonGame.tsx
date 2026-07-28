import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, RotateCcw, Dices, Trophy, Users, Coins } from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useAuth } from '../../context/AuthContext';
import GameLearnCard from '../../components/GameLearnCard';
import { ageTierFromClassroom } from '../../data/gameLessons';
import { QUESTION_BANK, CT_PILLARS, PILLAR_ORDER } from '../../data/ctBoardGame';
import type { CTQuestion } from '../../data/ctBoardGame';
import {
  TYCOON_BOARD, CHANCE_CARDS, TYCOON_TOKENS, tileGridPos,
  START_MONEY, SALARY, REST_FINE,
} from '../../data/tycoonGame';
import type { ChanceCard } from '../../data/tycoonGame';
import './GameStyles.css';

type Phase = 'setup' | 'roll' | 'question' | 'buy' | 'chance' | 'info' | 'over';

interface P {
  idx: number;
  pos: number;
  money: number;
  owned: number[];
  skip: number;
  out: boolean;
}

const SIZE = TYCOON_BOARD.length;
const REST_TILE = TYCOON_BOARD.findIndex((t) => t.kind === 'rest');
const baht = (n: number) => n.toLocaleString('th-TH');

// สุ่มนอกคอมโพเนนต์ (กฎ React purity)
const rollDice = () => 1 + Math.floor(Math.random() * 6);
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const TycoonGame: React.FC = () => {
  const { user } = useAuth();
  const bank = QUESTION_BANK[ageTierFromClassroom(user?.classroom)];
  const recordGame = useGameProgress('tycoon', 'เกมเศรษฐีวิทยาการคำนวณ');

  const [count, setCount] = useState(3);
  const [ps, setPs] = useState<P[]>([]);
  const [turn, setTurn] = useState(0);
  const [phase, setPhase] = useState<Phase>('setup');
  const [dice, setDice] = useState<number | null>(null);
  const [q, setQ] = useState<CTQuestion | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const [chance, setChance] = useState<ChanceCard | null>(null);
  const [msg, setMsg] = useState('');
  const [buyTile, setBuyTile] = useState<number | null>(null);
  const [view3d, setView3d] = useState(true);

  const me = ps[turn];
  const alive = ps.filter((p) => !p.out);
  const worth = (p: P) => p.money + p.owned.reduce((s, i) => s + (TYCOON_BOARD[i].property?.price || 0), 0);

  const start = () => {
    setPs(Array.from({ length: count }, (_, i) => ({ idx: i, pos: 0, money: START_MONEY, owned: [], skip: 0, out: false })));
    setTurn(0); setPhase('roll'); setDice(null); setMsg(`เริ่มเกม! ทุกคนได้เงิน ${baht(START_MONEY)} บาท`);
  };
  const restart = () => { setPhase('setup'); setPs([]); setMsg(''); };

  const finish = (list: P[]) => {
    const live = list.filter((p) => !p.out);
    const winner = live.sort((a, b) => worth(b) - worth(a))[0];
    setPs(list); setPhase('over');
    void recordGame(winner ? Math.round(worth(winner) / 100) : 0);
  };

  /** ไปตาถัดไป (ข้ามคนที่ล้มละลาย/ต้องหยุดพัก) */
  const next = (list: P[]) => {
    const live = list.filter((p) => !p.out);
    if (live.length <= 1) { finish(list); return; }
    let t = turn;
    for (let i = 0; i < SIZE; i++) {
      t = (t + 1) % list.length;
      if (list[t].out) continue;
      if (list[t].skip > 0) {
        list = list.map((p) => (p.idx === t ? { ...p, skip: p.skip - 1 } : p));
        continue;
      }
      break;
    }
    setPs(list); setTurn(t); setPhase('roll');
    setDice(null); setQ(null); setPicked(null); setChance(null); setBuyTile(null);
    setMsg(`ถึงตา ${TYCOON_TOKENS[t].name}`);
  };

  /** ตรวจเงินติดลบ = ล้มละลาย */
  const settle = (list: P[]): P[] => list.map((p) => (p.money < 0 && !p.out ? { ...p, out: true, owned: [] } : p));

  const roll = () => {
    if (!me) return;
    const d = rollDice();
    setDice(d);
    const raw = me.pos + d;
    const pos = raw % SIZE;
    const passed = raw >= SIZE;
    let list = ps.map((p) => (p.idx === me.idx
      ? { ...p, pos, money: p.money + (passed ? SALARY : 0) }
      : p));
    if (passed) setMsg(`เดินครบรอบ! รับเงินเดือน ${baht(SALARY)} บาท`);
    list = settle(list);
    setPs(list);
    land(list, pos);
  };

  const land = (list: P[], pos: number) => {
    const tile = TYCOON_BOARD[pos];
    const cur = list[turn];

    if (tile.kind === 'property') {
      const owner = list.find((p) => !p.out && p.owned.includes(pos));
      if (!owner) { // ยังไม่มีเจ้าของ → ตอบคำถามให้ถูกก่อนจึงมีสิทธิ์ซื้อ
        setQ(pick(bank)); setPicked(null); setBuyTile(pos); setPhase('question');
        setMsg(`${tile.property!.emoji} ${tile.property!.name} ยังว่าง — ตอบถูกจึงมีสิทธิ์ซื้อ`);
        return;
      }
      if (owner.idx === cur.idx) { setPhase('info'); setMsg('ที่ดินของคุณเอง พักได้ตามสบาย'); return; }
      // จ่ายค่าเช่า (ถ้าเจ้าของถือครบทั้งกลุ่ม คิด 2 เท่า)
      const group = tile.property!.group;
      const inGroup = TYCOON_BOARD.map((t, i) => ({ t, i })).filter((x) => x.t.property?.group === group);
      const all = inGroup.every((x) => owner.owned.includes(x.i));
      const rent = tile.property!.rent * (all ? 2 : 1);
      const after = settle(list.map((p) => {
        if (p.idx === cur.idx) return { ...p, money: p.money - rent };
        if (p.idx === owner.idx) return { ...p, money: p.money + rent };
        return p;
      }));
      setPs(after); setPhase('info');
      setMsg(`จ่ายค่าเช่า ${baht(rent)} บาท ให้ ${TYCOON_TOKENS[owner.idx].name}${all ? ' (ถือครบกลุ่ม ×2)' : ''}`);
      return;
    }

    if (tile.kind === 'chance') {
      const c = pick(CHANCE_CARDS);
      setChance(c); setPhase('chance');
      let after = list.map((p) => (p.idx === cur.idx
        ? {
          ...p,
          money: p.money + (c.money || 0),
          pos: c.move ? (p.pos + c.move + SIZE) % SIZE : p.pos,
          out: c.bankrupt ? true : p.out,
          owned: c.bankrupt ? [] : p.owned,
        }
        : p));
      after = settle(after);
      setPs(after);
      return;
    }

    if (tile.kind === 'question' || tile.kind === 'learn') {
      setQ(pick(bank)); setPicked(null); setBuyTile(null); setPhase('question');
      setMsg(tile.kind === 'learn' ? '🎓 ศูนย์เรียนรู้ — ตอบถูกรับ 800 บาท' : '❓ ตอบถูกรับ 500 บาท');
      return;
    }

    if (tile.kind === 'rest') {
      const after = settle(list.map((p) => (p.idx === cur.idx ? { ...p, money: p.money - REST_FINE, skip: 1 } : p)));
      setPs(after); setPhase('info');
      setMsg(`🛌 หยุดพัก! จ่ายค่าปรับ ${baht(REST_FINE)} บาท และพัก 1 รอบ`);
      return;
    }

    if (tile.kind === 'gotoRest') {
      const after = list.map((p) => (p.idx === cur.idx ? { ...p, pos: REST_TILE, money: p.money - REST_FINE, skip: 1 } : p));
      setPs(settle(after)); setPhase('info');
      setMsg('💻 เครื่องพัง! ไปช่องหยุดพัก จ่าย 500 บาท และพัก 1 รอบ');
      return;
    }

    setPhase('info'); setMsg('🏁 ช่องเริ่มต้น');
  };

  const answer = (i: number) => {
    if (picked !== null || !q || !me) return;
    setPicked(i);
    const ok = i === q.answer;
    if (!ok) { setMsg(`❌ ยังไม่ถูก — ${q.why}`); return; }

    if (buyTile !== null) { setMsg(`✅ ถูกต้อง! ${q.why}`); return; } // ไปหน้าเลือกซื้อ
    const reward = TYCOON_BOARD[me.pos].kind === 'learn' ? 800 : 500;
    setPs(ps.map((p) => (p.idx === me.idx ? { ...p, money: p.money + reward } : p)));
    setMsg(`✅ ถูกต้อง! รับ ${baht(reward)} บาท — ${q.why}`);
  };

  const buy = (yes: boolean) => {
    if (buyTile === null || !me) { next(ps); return; }
    const info = TYCOON_BOARD[buyTile].property!;
    if (!yes) { next(ps); return; }
    if (me.money < info.price) { setMsg('เงินไม่พอซื้อที่ดินนี้'); next(ps); return; }
    const after = ps.map((p) => (p.idx === me.idx
      ? { ...p, money: p.money - info.price, owned: [...p.owned, buyTile] } : p));
    setPs(after);
    setMsg(`🎉 ซื้อ ${info.emoji} ${info.name} แล้ว!`);
    next(after);
  };

  // ---------- SETUP ----------
  if (phase === 'setup') {
    return (
      <div className="game-page">
        <div className="game-topbar">
          <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
          <h2>💰 เกมเศรษฐีวิทยาการคำนวณ</h2>
        </div>
        <div className="game-stats"><GameLearnCard gameKey="tycoon" /></div>
        <div className="binary-card tyc-setup">
          <h3>บอร์ดเกมเศรษฐี เล่นด้วยกัน 2-4 คน บนจอเดียว</h3>
          <p className="tyc-sub">
            ทอยลูกเต๋าเดินรอบกระดาน <b>ตอบคำถามวิทยาการคำนวณให้ถูกจึงมีสิทธิ์ซื้อที่ดิน</b><br />
            เก็บค่าเช่าจากเพื่อน ระวังบัตรดวงตก ใครล้มละลายก่อนแพ้!
          </p>
          <div className="tyc-rules">
            <span>💵 เริ่มต้นคนละ {baht(START_MONEY)} บาท</span>
            <span>🏁 ครบรอบรับ {baht(SALARY)} บาท</span>
            <span>🛌 หยุดพักปรับ {baht(REST_FINE)} บาท</span>
            <span>🏘️ ถือครบกลุ่ม ค่าเช่า ×2</span>
          </div>
          <div className="tyc-count">
            <Users size={17} /> เล่นกี่คน?
            {[2, 3, 4].map((n) => (
              <button key={n} className={count === n ? 'on' : ''} onClick={() => setCount(n)}>{n} คน</button>
            ))}
          </div>
          <button className="btn-game-start tyc-start" onClick={start}>💰 เริ่มเล่น</button>
        </div>
        <div className="game-tips">
          💡 <strong>เล่นในห้องเรียน:</strong> แบ่งกลุ่ม 2-4 กลุ่ม ผลัดกันมาทอยลูกเต๋าที่จอหน้าห้อง ช่วยกันคิดคำตอบก่อนกด
        </div>
        <TycoonStyles />
      </div>
    );
  }

  // ---------- GAME OVER ----------
  if (phase === 'over') {
    const rank = [...ps].sort((a, b) => (a.out === b.out ? worth(b) - worth(a) : a.out ? 1 : -1));
    return (
      <div className="game-page">
        <div className="game-topbar">
          <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
          <h2>💰 เกมเศรษฐีวิทยาการคำนวณ</h2>
        </div>
        <div className="binary-card tyc-win">
          <div className="tyc-win-emoji">{TYCOON_TOKENS[rank[0].idx].emoji}</div>
          <Trophy size={30} style={{ color: '#f59e0b' }} />
          <h2>{TYCOON_TOKENS[rank[0].idx].name} ชนะ!</h2>
          <p>ทรัพย์สินรวม {baht(worth(rank[0]))} บาท</p>
          <div className="tyc-rank">
            {rank.map((p, i) => (
              <div key={p.idx} className={p.out ? 'out' : ''}>
                <b>#{i + 1}</b> {TYCOON_TOKENS[p.idx].emoji} {TYCOON_TOKENS[p.idx].name}
                <span>{p.out ? 'ล้มละลาย' : `${baht(worth(p))} บาท`}</span>
              </div>
            ))}
          </div>
          <button className="btn-game-start" onClick={restart}><RotateCcw size={16} /> เล่นใหม่</button>
        </div>
        <TycoonStyles />
      </div>
    );
  }

  // ---------- PLAYING ----------
  return (
    <div className="game-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2>💰 เกมเศรษฐีวิทยาการคำนวณ</h2>
      </div>

      <div className="game-stats">
        <GameLearnCard gameKey="tycoon" />
        <div className="gstat">🎯 ตาของ: <strong>{TYCOON_TOKENS[turn].emoji} {TYCOON_TOKENS[turn].name}</strong></div>
        {dice !== null && <div className="gstat">🎲 <strong>{dice}</strong></div>}
        <div className="gstat">👥 เหลือ <strong>{alive.length}</strong> คน</div>
        <button className="gstat" onClick={() => setView3d((v) => !v)} title="สลับมุมมองกระดาน">
          {view3d ? '🧊 มุมมอง 3D' : '⬜ มุมมอง 2D'}
        </button>
      </div>

      <div className="tyc-wrap">
        {/* กระดานสี่เหลี่ยม — มุมมอง 3D เอียงเหมือนวางบนโต๊ะจริง */}
        <div className={`tyc-stage ${view3d ? 'is3d' : ''}`}>
        <div className="tyc-board">
          {TYCOON_BOARD.map((tile, i) => {
            const [r, c] = tileGridPos(i);
            const here = ps.filter((p) => !p.out && p.pos === i);
            const owner = ps.find((p) => !p.out && p.owned.includes(i));
            const pr = tile.property;
            return (
              <div
                key={i}
                className={`tyc-tile k-${tile.kind}`}
                style={{
                  gridRow: r, gridColumn: c,
                  ['--g' as string]: pr ? pr.groupColor : undefined,
                  boxShadow: owner ? `inset 0 0 0 2.5px ${TYCOON_TOKENS[owner.idx].color}` : undefined,
                }}
              >
                {pr ? (
                  <>
                    <span className="tyc-face">{pr.emoji}</span>
                    <span className="tyc-name">{pr.name}</span>
                    <span className="tyc-price">{baht(pr.price)}</span>
                    {owner && <span className="tyc-owner" style={{ background: TYCOON_TOKENS[owner.idx].color }}>{TYCOON_TOKENS[owner.idx].emoji}</span>}
                    {owner && (
                      <span className="tyc-house" style={{ '--h': TYCOON_TOKENS[owner.idx].color } as React.CSSProperties} aria-hidden="true">
                        <i /><i /><i />
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    <span className="tyc-face">
                      {tile.kind === 'start' ? '🏁' : tile.kind === 'chance' ? '🎴'
                        : tile.kind === 'question' ? '❓' : tile.kind === 'rest' ? '🛌'
                          : tile.kind === 'gotoRest' ? '💻' : '🎓'}
                    </span>
                    <span className="tyc-name">
                      {tile.kind === 'start' ? 'เริ่มต้น' : tile.kind === 'chance' ? 'เสี่ยงดวง'
                        : tile.kind === 'question' ? 'คำถาม' : tile.kind === 'rest' ? 'หยุดพัก'
                          : tile.kind === 'gotoRest' ? 'เครื่องพัง' : 'ศูนย์เรียนรู้'}
                    </span>
                  </>
                )}
                {here.length > 0 && (
                  <span className="tyc-tokens">{here.map((p) => <i key={p.idx}>{TYCOON_TOKENS[p.idx].emoji}</i>)}</span>
                )}
              </div>
            );
          })}
          <div className="tyc-center">
            <div className="tyc-logo">💰</div>
            <b>เศรษฐีวิทยาการคำนวณ</b>
            <small>ตอบถูก = ได้สิทธิ์ซื้อที่ดิน</small>
          </div>
        </div>
        </div>

        {/* แผงผู้เล่น */}
        <div className="tyc-side">
          {ps.map((p) => (
            <div key={p.idx} className={`tyc-p ${p.idx === turn ? 'active' : ''} ${p.out ? 'out' : ''}`} style={{ borderColor: TYCOON_TOKENS[p.idx].color }}>
              <span className="tyc-p-tok">{TYCOON_TOKENS[p.idx].emoji}</span>
              <div className="tyc-p-info">
                <b>{TYCOON_TOKENS[p.idx].name}{p.out && ' (ล้มละลาย)'}</b>
                <span className="tyc-money"><Coins size={13} /> {baht(p.money)} บาท</span>
                <span className="tyc-props">🏘️ ที่ดิน {p.owned.length} แปลง{p.skip > 0 ? ' · พัก 1 รอบ' : ''}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {msg && <div className="tyc-msg">{msg}</div>}

      {phase === 'roll' && (
        <div className="puzzle-actions">
          <button className="btn-game-start tyc-dice" onClick={roll}><Dices size={20} /> ทอยลูกเต๋า</button>
        </div>
      )}

      {phase === 'info' && (
        <div className="puzzle-actions"><button className="btn-game-start" onClick={() => next(ps)}>ตาถัดไป →</button></div>
      )}

      {phase === 'chance' && chance && (
        <div className="binary-card tyc-chance">
          <div className="tyc-chance-tag">🎴 บัตรเสี่ยงดวง</div>
          <div className="tyc-chance-emoji">{chance.emoji}</div>
          <p>{chance.text}</p>
          <div className="puzzle-actions"><button className="btn-game-start" onClick={() => next(ps)}>ตาถัดไป →</button></div>
        </div>
      )}

      {phase === 'question' && q && (
        <div className="binary-card tyc-q" style={{ borderTopColor: CT_PILLARS[q.pillar].color }}>
          <div className="tyc-q-tag" style={{ background: CT_PILLARS[q.pillar].color }}>
            {CT_PILLARS[q.pillar].emoji} {CT_PILLARS[q.pillar].name}
          </div>
          <p className="tyc-q-text">{q.q}</p>
          <div className="tyc-choices">
            {q.choices.map((ch, i) => {
              const st = picked === null ? '' : i === q.answer ? 'right' : picked === i ? 'wrong' : 'dim';
              return <button key={i} className={`tyc-choice ${st}`} onClick={() => answer(i)} disabled={picked !== null}>{ch}</button>;
            })}
          </div>
          {picked !== null && (
            <div className="puzzle-actions">
              {buyTile !== null && picked === q.answer ? (
                <>
                  <button className="btn-game-start" onClick={() => buy(true)}>
                    ซื้อ {TYCOON_BOARD[buyTile].property!.emoji} {baht(TYCOON_BOARD[buyTile].property!.price)} บาท
                  </button>
                  <button className="btn-secondary" onClick={() => buy(false)}>ไม่ซื้อ</button>
                </>
              ) : (
                <button className="btn-game-start" onClick={() => next(ps)}>ตาถัดไป →</button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="game-tips">
        🧠 <strong>4 ทักษะที่ใช้ในเกมนี้:</strong> {PILLAR_ORDER.map((k) => `${CT_PILLARS[k].emoji} ${CT_PILLARS[k].short}`).join(' · ')}
      </div>
      <TycoonStyles />
    </div>
  );
};

const TycoonStyles: React.FC = () => (
  <style>{`
    .tyc-setup, .tyc-win { max-width: 640px; text-align: center; }
    .tyc-setup h3 { margin: 0 0 8px; font-size: 1.25rem; }
    .tyc-sub { color: #475569; line-height: 1.75; margin: 0 0 16px; }
    .tyc-rules { display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 8px; margin-bottom: 18px; }
    .tyc-rules span { padding: 9px 12px; border-radius: 10px; background: #f8fafc; border: 1px solid #e2e8f0; font-size: 0.85rem; font-weight: 600; color: #334155; }
    .tyc-count { display: flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; font-weight: 700; color: #475569; }
    .tyc-count button { padding: 8px 16px; border-radius: 999px; border: 2px solid #e2e8f0; background: #fff; font-family: inherit; font-weight: 800; cursor: pointer; color: #64748b; }
    .tyc-count button.on { border-color: #f59e0b; background: #fffbeb; color: #b45309; }
    .tyc-start { width: 100%; justify-content: center; }

    .tyc-wrap { display: grid; grid-template-columns: 1fr 250px; gap: 14px; align-items: start; }
    @media (max-width: 900px) { .tyc-wrap { grid-template-columns: 1fr; } }

    /* ---------- เวทีกระดาน: เอียงแบบพอดี ไม่บิดเบี้ยว ---------- */
    .tyc-stage { padding: 6px 0 14px; }
    .tyc-stage.is3d {
      perspective: 2800px; perspective-origin: 50% 42%;
      padding: 26px 18px 34px;
      border-radius: 22px;
      background:
        radial-gradient(ellipse at 50% 30%, rgba(255,255,255,0.10), transparent 60%),
        linear-gradient(160deg, #7c5233 0%, #5b3a23 45%, #3a2416 100%);
      box-shadow: inset 0 0 90px rgba(0,0,0,0.5);
    }
    .tyc-stage.is3d .tyc-board {
      transform: rotateX(17deg);
      transform-style: preserve-3d;
      box-shadow: 0 34px 55px rgba(0,0,0,0.55);
    }
    .tyc-stage.is3d .tyc-tile { box-shadow: 0 5px 0 rgba(2,6,23,0.45), 0 8px 12px rgba(0,0,0,0.3); }
    .tyc-stage.is3d .tyc-tokens i { transform: translateZ(24px) scale(1.15); }

    /* ---------- กระดาน ---------- */
    .tyc-board {
      display: grid; grid-template-columns: repeat(8, 1fr); grid-template-rows: repeat(8, 1fr);
      gap: 5px; aspect-ratio: 1; padding: 12px; border-radius: 18px;
      background:
        radial-gradient(ellipse at 50% 45%, #1b3b34 0%, #122622 70%, #0c1a17 100%);
      border: 4px solid #d4a24c;
      box-shadow: 0 18px 34px rgba(0,0,0,0.28);
    }

    /* ---------- ช่องบนกระดาน ---------- */
    .tyc-tile {
      position: relative; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 2px;
      background: #ffffff; border-radius: 9px;
      padding: 3px 2px; overflow: hidden; min-height: 0;
      border: 1px solid rgba(15,23,42,0.10);
    }
    /* แถบสีกลุ่มที่ดิน — หนา สด อ่านจากไกลได้ */
    .tyc-tile.k-property::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0;
      height: 26%; background: var(--g, #94a3b8);
      box-shadow: inset 0 -2px 3px rgba(0,0,0,0.18);
    }
    .tyc-tile.k-start { background: linear-gradient(160deg, #bbf7d0, #86efac); }
    .tyc-tile.k-rest { background: linear-gradient(160deg, #fecdd3, #fda4af); }
    .tyc-tile.k-gotoRest { background: linear-gradient(160deg, #fed7aa, #fdba74); }
    .tyc-tile.k-learn { background: linear-gradient(160deg, #bae6fd, #7dd3fc); }
    .tyc-tile.k-chance { background: linear-gradient(160deg, #fde68a, #fcd34d); }
    .tyc-tile.k-question { background: linear-gradient(160deg, #ddd6fe, #c4b5fd); }

    .tyc-face { font-size: clamp(1rem, 2.3vw, 1.7rem); line-height: 1; position: relative; z-index: 1; margin-top: 12%; }
    .tyc-tile:not(.k-property) .tyc-face { margin-top: 0; }
    .tyc-name {
      position: relative; z-index: 1;
      font-size: clamp(0.44rem, 0.95vw, 0.68rem); font-weight: 800; color: #0f172a;
      text-align: center; line-height: 1.15; padding: 0 1px;
    }
    .tyc-price {
      position: relative; z-index: 1;
      font-size: clamp(0.4rem, 0.85vw, 0.6rem); font-weight: 900; color: #b45309;
      background: #fffbeb; border-radius: 999px; padding: 0 5px;
    }
    .tyc-owner {
      position: absolute; top: 2px; right: 2px; z-index: 2;
      width: 15px; height: 15px; border-radius: 50%; display: grid; place-items: center;
      font-size: 0.6rem; border: 1.5px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.35);
    }
    .tyc-tokens { position: absolute; bottom: 1px; z-index: 3; display: flex; gap: 1px; }
    .tyc-tokens i {
      font-style: normal; font-size: clamp(0.7rem, 1.5vw, 1.15rem);
      filter: drop-shadow(0 2px 2px rgba(0,0,0,0.45));
    }

    /* บ้านของเจ้าของที่ดิน */
    .tyc-house { position: absolute; top: 2px; left: 3px; z-index: 2; display: flex; gap: 1.5px; }
    .tyc-house i {
      width: 6px; height: 6px; border-radius: 1.5px; background: var(--h, #16a34a);
      border: 1px solid rgba(255,255,255,0.9); box-shadow: 0 1px 2px rgba(0,0,0,0.4);
    }

    /* ---------- กลางกระดาน ---------- */
    .tyc-center {
      grid-row: 2 / 8; grid-column: 2 / 8;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 6px; color: #fff; text-align: center;
    }
    .tyc-logo { font-size: clamp(2.2rem, 8vw, 4.6rem); filter: drop-shadow(0 6px 10px rgba(0,0,0,0.5)); }
    .tyc-center b {
      font-size: clamp(0.85rem, 2.4vw, 1.6rem); letter-spacing: 0.5px;
      background: linear-gradient(180deg, #fde68a, #f59e0b);
      -webkit-background-clip: text; background-clip: text; color: transparent;
      text-shadow: 0 2px 6px rgba(0,0,0,0.3);
    }
    .tyc-center small {
      font-size: clamp(0.55rem, 1.3vw, 0.9rem); color: #a7f3d0;
      background: rgba(0,0,0,0.28); padding: 3px 12px; border-radius: 999px;
    }

.tyc-side { display: flex; flex-direction: column; gap: 8px; }
    .tyc-p { display: flex; align-items: center; gap: 9px; padding: 9px 11px; border: 2px solid; border-radius: 12px; background: #fff; opacity: 0.6; }
    .tyc-p.active { opacity: 1; box-shadow: 0 4px 14px rgba(15,23,42,0.14); }
    .tyc-p.out { opacity: 0.35; filter: grayscale(1); }
    .tyc-p-tok { font-size: 1.7rem; }
    .tyc-p-info { display: flex; flex-direction: column; min-width: 0; }
    .tyc-p-info b { font-size: 0.83rem; }
    .tyc-money { display: inline-flex; align-items: center; gap: 4px; font-size: 0.86rem; font-weight: 900; color: #16a34a; }
    .tyc-props { font-size: 0.72rem; color: #64748b; font-weight: 600; }

    .tyc-msg { text-align: center; padding: 11px 14px; border-radius: 10px; background: #fffbeb; border: 1px solid #fcd34d; color: #92400e; font-weight: 700; margin: 12px 0; }
    .tyc-dice { font-size: 1.05rem; }

    .tyc-q, .tyc-chance { max-width: 640px; border-top: 6px solid #f59e0b; text-align: center; }
    .tyc-q-tag, .tyc-chance-tag { display: inline-block; padding: 4px 14px; border-radius: 999px; color: #fff; font-size: 0.76rem; font-weight: 800; background: #f59e0b; }
    .tyc-chance-emoji { font-size: 3rem; margin: 10px 0 4px; }
    .tyc-chance p { font-size: 1.02rem; font-weight: 700; color: #1e293b; line-height: 1.6; }
    .tyc-q-text { font-size: 1.06rem; font-weight: 700; color: #1e293b; line-height: 1.6; margin: 12px 0 14px; }
    .tyc-choices { display: flex; flex-direction: column; gap: 8px; }
    .tyc-choice { padding: 12px 14px; border-radius: 10px; border: 2px solid #e2e8f0; background: #fff; text-align: left; font-family: inherit; font-size: 0.95rem; color: #1f2937; cursor: pointer; }
    .tyc-choice:hover:not(:disabled) { border-color: #fcd34d; background: #fffbeb; }
    .tyc-choice.right { border-color: #22c55e; background: #dcfce7; }
    .tyc-choice.wrong { border-color: #ef4444; background: #fee2e2; }
    .tyc-choice.dim { opacity: 0.5; }

    .tyc-win-emoji { font-size: 3.4rem; }
    .tyc-rank { display: flex; flex-direction: column; gap: 6px; margin: 14px 0 16px; }
    .tyc-rank div { display: flex; align-items: center; gap: 8px; padding: 9px 12px; border-radius: 10px; background: #f8fafc; font-weight: 700; font-size: 0.9rem; }
    .tyc-rank div.out { opacity: 0.5; }
    .tyc-rank span { margin-left: auto; color: #16a34a; font-weight: 900; }
  `}</style>
);

export default TycoonGame;
