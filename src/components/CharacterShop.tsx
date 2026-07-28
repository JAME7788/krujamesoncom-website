import React, { useState } from 'react';
import { Coins, Check, Lock, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';
import { SHOP_CHARACTERS, isCharacterUnlocked } from '../data/characterShop';
import type { ShopCharacter } from '../data/characterShop';
import { getCoins, getOwnedCharacters, buyCharacter } from '../services/coinService';

interface Props {
  /** เรียกเมื่อผู้เล่นเลือกตัวละครไปใช้ */
  onSelect?: (character: ShopCharacter) => void;
  /** id ตัวละครที่กำลังใช้อยู่ */
  selectedId?: string;
}

/** ร้านตัวละคร — ใช้เหรียญที่ได้จากการเล่นเกม/ทำกิจกรรมมาปลดล็อกพลังพิเศษ */
const CharacterShop: React.FC<Props> = ({ onSelect, selectedId }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [coins, setCoins] = useState(() => getCoins(user?.id));
  const [owned, setOwned] = useState<string[]>(() => getOwnedCharacters(user?.id));

  const isOwned = (c: ShopCharacter) => isCharacterUnlocked(c.id, owned);

  const handleBuy = (c: ShopCharacter) => {
    const result = buyCharacter(c.id, c.price, user?.id);
    setCoins(result.coins);
    if (result.ok) {
      setOwned((list) => [...list, c.id]);
      toast.show(`ปลดล็อก ${c.name} แล้ว! พลัง "${c.abilityName}" พร้อมใช้งาน`, 'success');
      return;
    }
    if (result.reason === 'not_enough') {
      toast.show(`เหรียญไม่พอ — ต้องใช้ ${c.price} เหรียญ เล่นเกมเพิ่มเพื่อสะสมนะ`, 'info');
    }
  };

  return (
    <div className="cshop">
      <div className="cshop-head">
        <div>
          <h3><Sparkles size={18} /> ร้านตัวละคร</h3>
          <p>เล่นเกมหรือทำกิจกรรมในเว็บเพื่อสะสมเหรียญ แล้วปลดล็อกตัวละครที่มีพลังพิเศษ</p>
        </div>
        <div className="cshop-wallet"><Coins size={18} /> {coins.toLocaleString('th-TH')}</div>
      </div>

      <div className="cshop-grid">
        {SHOP_CHARACTERS.map((c) => {
          const own = isOwned(c);
          const active = selectedId === c.id;
          return (
            <div key={c.id} className={`cshop-card ${own ? 'own' : 'locked'} ${active ? 'active' : ''}`} style={{ '--c': c.accent } as React.CSSProperties}>
              <div className="cshop-avatar">
                <img src={c.image} alt={c.name} loading="lazy" />
                {own && <span className="cshop-tick"><Check size={12} /></span>}
              </div>
              <b className="cshop-name">{c.name}</b>
              <span className="cshop-role">{c.role}</span>

              <div className="cshop-ability">
                <strong>{c.abilityName}</strong>
                <span>{c.abilityDesc}</span>
              </div>

              {own ? (
                <button
                  className={`cshop-btn use ${active ? 'on' : ''}`}
                  onClick={() => onSelect?.(c)}
                  disabled={!onSelect}
                >
                  {active ? '✓ กำลังใช้' : 'เลือกใช้'}
                </button>
              ) : (
                <button className="cshop-btn buy" onClick={() => handleBuy(c)}>
                  <Lock size={13} /> {c.price} เหรียญ
                </button>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .cshop { font-family: 'Prompt', sans-serif; }
        .cshop-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
        .cshop-head h3 { margin: 0; font-size: 1.05rem; display: flex; align-items: center; gap: 7px; }
        .cshop-head p { margin: 3px 0 0; font-size: 0.82rem; color: #64748b; line-height: 1.5; }
        .cshop-wallet { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: 999px; background: linear-gradient(135deg, #fde68a, #f59e0b); color: #78350f; font-weight: 900; box-shadow: 0 4px 12px rgba(245,158,11,0.35); }

        .cshop-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(168px, 1fr)); gap: 12px; }
        .cshop-card { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 14px 12px; border-radius: 16px; background: #fff; border: 2px solid #e2e8f0; border-bottom: 4px solid var(--c, #6366f1); text-align: center; transition: transform 0.12s ease, box-shadow 0.12s ease; }
        .cshop-card:hover { transform: translateY(-3px); box-shadow: 0 12px 24px rgba(15,23,42,0.14); }
        .cshop-card.locked { background: #f8fafc; }
        .cshop-card.active { border-color: var(--c, #6366f1); box-shadow: 0 0 0 3px var(--c, #6366f1); }

        .cshop-avatar { position: relative; width: 68px; height: 68px; border-radius: 18px; display: grid; place-items: center; background: #f1f5f9; overflow: hidden; }
        .cshop-avatar img { width: 100%; height: 100%; object-fit: contain; image-rendering: pixelated; }
        .cshop-avatar span { font-size: 2.2rem; }
        .cshop-card.locked .cshop-avatar { filter: grayscale(0.85); opacity: 0.7; }
        .cshop-tick { position: absolute; top: 3px; right: 3px; width: 18px; height: 18px; border-radius: 50%; background: #22c55e; color: #fff; display: grid; place-items: center; }

        .cshop-name { font-size: 0.9rem; color: #0f172a; }
        .cshop-role { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
        .cshop-ability { margin: 6px 0 8px; padding: 8px 10px; border-radius: 10px; background: #f8fafc; border: 1px dashed #cbd5e1; }
        .cshop-ability strong { display: block; font-size: 0.78rem; color: var(--c, #6366f1); }
        .cshop-ability span { font-size: 0.72rem; color: #475569; line-height: 1.45; }

        .cshop-btn { width: 100%; margin-top: auto; padding: 9px; border-radius: 10px; border: 0; cursor: pointer; font-family: inherit; font-weight: 800; font-size: 0.82rem; display: inline-flex; align-items: center; justify-content: center; gap: 5px; }
        .cshop-btn.buy { background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #78350f; }
        .cshop-btn.use { background: #eef2ff; color: #4338ca; }
        .cshop-btn.use.on { background: var(--c, #6366f1); color: #fff; }
        .cshop-btn:disabled { opacity: 0.6; cursor: default; }
      `}</style>
    </div>
  );
};

export default CharacterShop;
