import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';

export interface ScaffoldingTiers {
  observation: string; // ขั้น 1: สังเกตเป้าหมายและปัญหา
  strategy: string;    // ขั้น 2: กลยุทธ์และทิศทาง
  scaffold: string;    // ขั้น 3: โครงร่างขั้นตอนคำสั่ง
}

interface ScaffoldingHintLadderProps {
  tiers: ScaffoldingTiers;
  levelName?: string;
}

export const ScaffoldingHintLadder: React.FC<ScaffoldingHintLadderProps> = ({
  tiers,
  levelName,
}) => {
  const [open, setOpen] = useState(false);
  const [activeTier, setActiveTier] = useState<1 | 2 | 3>(1);

  return (
    <div
      className="scaffolding-hint-ladder"
      style={{
        margin: '10px 0 14px',
        background: '#ffffff',
        border: '1.5px solid #FEF3C7',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.05)',
        overflow: 'hidden',
      }}
    >
      {/* Toggle Bar */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 14px',
          background: open ? '#f8fafc' : 'linear-gradient(135deg, #FFF9E6 0%, #FEF3C7 100%)',
          border: 'none',
          cursor: 'pointer',
          color: '#92400E',
          fontWeight: 700,
          fontSize: '0.85rem',
          textAlign: 'left',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Lightbulb size={16} color="#B45309" />
          🪜 บันไดนั่งร้านตัวช่วย (Scaffolding Hint Ladder){levelName ? ` • ${levelName}` : ''}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.75rem' }}>
          {open ? 'ย่อเก็บ' : 'ขอคำใบ้ทีละขั้น'}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {/* Expanded Tiers View */}
      {open && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #FEF3C7' }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
            <button
              type="button"
              onClick={() => setActiveTier(1)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 8,
                border: activeTier === 1 ? '1.5px solid #B45309' : '1px solid #cbd5e1',
                background: activeTier === 1 ? '#FEF3C7' : '#ffffff',
                color: activeTier === 1 ? '#78350F' : '#64748b',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ขั้น 1: สังเกต
            </button>
            <button
              type="button"
              onClick={() => setActiveTier(2)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 8,
                border: activeTier === 2 ? '1.5px solid #B45309' : '1px solid #cbd5e1',
                background: activeTier === 2 ? '#FEF3C7' : '#ffffff',
                color: activeTier === 2 ? '#78350F' : '#64748b',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ขั้น 2: กลยุทธ์
            </button>
            <button
              type="button"
              onClick={() => setActiveTier(3)}
              style={{
                flex: 1,
                padding: '6px 8px',
                borderRadius: 8,
                border: activeTier === 3 ? '1.5px solid #B45309' : '1px solid #cbd5e1',
                background: activeTier === 3 ? '#FEF3C7' : '#ffffff',
                color: activeTier === 3 ? '#78350F' : '#64748b',
                fontWeight: 700,
                fontSize: '0.75rem',
                cursor: 'pointer',
              }}
            >
              ขั้น 3: โครงร่าง
            </button>
          </div>

          {/* Current Tier Content */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid #f1f5f9',
              minHeight: 50,
            }}
          >
            {activeTier === 1 && (
              <div>
                <strong style={{ fontSize: '0.8rem', color: '#0369a1', display: 'block', marginBottom: 3 }}>
                  👁️ ขั้นที่ 1: ชวนตั้งข้อสังเกต
                </strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#334155', lineHeight: 1.5 }}>
                  {tiers.observation}
                </p>
              </div>
            )}

            {activeTier === 2 && (
              <div>
                <strong style={{ fontSize: '0.8rem', color: '#0d9488', display: 'block', marginBottom: 3 }}>
                  🧭 ขั้นที่ 2: วางแนวทางและกลยุทธ์
                </strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#334155', lineHeight: 1.5 }}>
                  {tiers.strategy}
                </p>
              </div>
            )}

            {activeTier === 3 && (
              <div>
                <strong style={{ fontSize: '0.8rem', color: '#92400E', display: 'block', marginBottom: 3 }}>
                  🧱 ขั้นที่ 3: โครงร่างลำดับคำสั่ง
                </strong>
                <p style={{ margin: 0, fontSize: '0.83rem', color: '#334155', lineHeight: 1.5 }}>
                  {tiers.scaffold}
                </p>
              </div>
            )}
          </div>

          <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              💡 เสริมการเรียนรู้ตามแนวคิด Vygotsky ZPD
            </span>
            {activeTier < 3 && (
              <button
                type="button"
                onClick={() => setActiveTier((t) => (t + 1) as 1 | 2 | 3)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#92400E',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                ดูคำใบ้ขั้นที่ {activeTier + 1} ต่อ ➔
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScaffoldingHintLadder;
