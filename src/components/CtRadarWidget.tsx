import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import {
  CT_PILLARS,
  calculateStudentCtProfile,
  type CtPillar,
} from '../services/computationalThinkingService';
import { gamesCatalog } from '../data/gamesCatalog';

interface CtRadarWidgetProps {
  studentId: string;
  classroom: string;
}

export const CtRadarWidget: React.FC<CtRadarWidgetProps> = ({ studentId, classroom }) => {
  const profile = calculateStudentCtProfile(studentId, classroom);
  const pillarsList: CtPillar[] = ['decomposition', 'pattern', 'abstraction', 'algorithm'];

  const recommendedGame = gamesCatalog.find((g) => g.id === profile.recommendedGameId);
  const recPillarInfo = CT_PILLARS[profile.recommendedPillar];

  // Radar chart SVG calculations (Center = 100, 100, Radius = 75)
  const cx = 100;
  const cy = 100;
  const r = 68;

  // 4 corners: top, right, bottom, left
  const angles = [-Math.PI / 2, 0, Math.PI / 2, Math.PI]; // 12h, 3h, 6h, 9h
  const points = pillarsList.map((p, idx) => {
    const val = profile.pillars[p].score / 100;
    const currentR = Math.max(10, r * val);
    const x = cx + currentR * Math.cos(angles[idx]);
    const y = cy + currentR * Math.sin(angles[idx]);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="card" style={{ padding: '1.25rem', marginTop: '1.25rem', background: '#ffffff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '1.2rem' }}>🧭</span>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>
              โปรไฟล์การคิดเชิงคำนวณ (Computational Thinking)
            </h3>
          </div>
          <small style={{ color: '#64748b' }}>วิเคราะห์ความสมดุล 4 เสาหลักจากเกมและกิจกรรมการเรียนรู้</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', padding: '4px 10px', borderRadius: 999, border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>คะแนนความเชี่ยวชาญรวม:</span>
          <strong style={{ color: '#0f766e', fontSize: '0.95rem' }}>{profile.overallScore}%</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, alignItems: 'center' }}>
        {/* Radar SVG Visualizer */}
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          <svg viewBox="0 0 200 200" style={{ width: '100%', maxWidth: 220, height: 'auto', overflow: 'visible' }}>
            {/* Background Grid Rings */}
            {gridLevels.map((lvl) => {
              const gridPoints = angles.map((a) => {
                const x = cx + r * lvl * Math.cos(a);
                const y = cy + r * lvl * Math.sin(a);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              return (
                <polygon
                  key={lvl}
                  points={gridPoints}
                  fill="none"
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  strokeDasharray={lvl < 1 ? '3,3' : 'none'}
                />
              );
            })}

            {/* Axis Lines */}
            {angles.map((a, i) => {
              const x2 = cx + r * Math.cos(a);
              const y2 = cy + r * Math.sin(a);
              return <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="#cbd5e1" strokeWidth="1" />;
            })}

            {/* Student Polygon */}
            <polygon
              points={points}
              fill="rgba(14, 165, 233, 0.25)"
              stroke="#0284c7"
              strokeWidth="2.5"
            />

            {/* Data Point Dots */}
            {pillarsList.map((p, idx) => {
              const val = profile.pillars[p].score / 100;
              const currentR = Math.max(10, r * val);
              const px = cx + currentR * Math.cos(angles[idx]);
              const py = cy + currentR * Math.sin(angles[idx]);
              return (
                <circle
                  key={p}
                  cx={px}
                  cy={py}
                  r="4.5"
                  fill={CT_PILLARS[p].color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              );
            })}

            {/* Labels around SVG */}
            <text x="100" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0284c7">🧩 ย่อยปัญหา</text>
            <text x="185" y="103" textAnchor="start" fontSize="9" fontWeight="700" fill="#8b5cf6">🔍 รูปแบบ</text>
            <text x="100" y="188" textAnchor="middle" fontSize="9" fontWeight="700" fill="#f59e0b">💡 นามธรรม</text>
            <text x="15" y="103" textAnchor="end" fontSize="9" fontWeight="700" fill="#10b981">⚡ ลำดับขั้นตอน</text>
          </svg>
        </div>

        {/* 4 Pillars Details & Progress Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pillarsList.map((key) => {
            const pillar = CT_PILLARS[key];
            const data = profile.pillars[key];
            return (
              <div key={key} style={{ background: '#f8fafc', padding: '8px 12px', borderRadius: 10, border: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{pillar.emoji}</span>
                    <strong style={{ fontSize: '0.85rem', color: '#334155' }}>{pillar.name}</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>({pillar.nameEn})</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.72rem', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: 999, fontWeight: 600 }}>
                      {data.level}
                    </span>
                    <strong style={{ fontSize: '0.82rem', color: pillar.color }}>{data.score}%</strong>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ width: '100%', height: 6, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${data.score}%`,
                      height: '100%',
                      background: pillar.color,
                      borderRadius: 999,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommended Next Quest */}
      {recommendedGame && (
        <div style={{
          marginTop: 14,
          padding: '10px 14px',
          background: 'linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%)',
          borderRadius: 12,
          border: '1px solid #ccfbf1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.4rem' }}>{recommendedGame.emoji}</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#0d9488" />
                <strong style={{ fontSize: '0.85rem', color: '#0f766e' }}>
                  ภารกิจแนะนำเพื่อเสริมทักษะ: {recPillarInfo.name} ({recPillarInfo.nameEn})
                </strong>
              </div>
              <small style={{ color: '#475569' }}>
                ลองฝึกเล่น <strong>{recommendedGame.title}</strong> เพื่อยกระดับความสมดุลด้านการคิดเชิงคำนวณ
              </small>
            </div>
          </div>
          <Link
            to={recommendedGame.path}
            className="btn-primary"
            style={{ padding: '5px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}
          >
            ไปฝึกเล่นเลย <ArrowRight size={13} />
          </Link>
        </div>
      )}
    </div>
  );
};

export default CtRadarWidget;
