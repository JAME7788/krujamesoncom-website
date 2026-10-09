import React, { useState } from 'react';
import { Sparkles, Edit3 } from 'lucide-react';
import {
  getActiveWeeklyGoal,
  changeWeeklyGoal,
  recordGoalReflection,
  weeklyGoalPresets,
} from '../services/srlService';

interface WeeklyGoalTrackerProps {
  studentId: string;
}

const WeeklyGoalTrackerContent: React.FC<WeeklyGoalTrackerProps> = ({ studentId }) => {
  const [data, setData] = useState(() => getActiveWeeklyGoal(studentId));
  const [showGoalPicker, setShowGoalPicker] = useState(false);
  const [reflectionInput, setReflectionInput] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);

  const handleSelectGoal = (goalId: string) => {
    changeWeeklyGoal(studentId, goalId);
    setData(getActiveWeeklyGoal(studentId));
    setShowGoalPicker(false);
  };

  const handleSaveReflection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflectionInput.trim()) return;
    setIsSavingReflection(true);
    recordGoalReflection(studentId, reflectionInput.trim());
    setData(getActiveWeeklyGoal(studentId));
    setReflectionInput('');
    setIsSavingReflection(false);
  };

  const { goal, record, currentCount, progressPct, achieved } = data;

  return (
    <div
      className="section-card glass weekly-goal-tracker"
      style={{
        marginBottom: 16,
        padding: '1.25rem 1.5rem',
        borderRadius: 18,
        background: achieved
          ? 'linear-gradient(135deg, rgba(236,253,245,0.95) 0%, rgba(240,253,250,0.95) 100%)'
          : 'linear-gradient(135deg, rgba(238,242,255,0.95) 0%, rgba(245,243,255,0.95) 100%)',
        border: achieved ? '1.5px solid #10b981' : '1.5px solid #818cf8',
        boxShadow: '0 4px 16px rgba(99, 102, 241, 0.05)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>{achieved ? '🏆' : '🎯'}</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>
              เป้าหมายการเรียนรู้สัปดาห์นี้ (Self-Regulated Learning)
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.82rem' }}>
            วงจรกำกับตนเอง: วางแผน (Plan) ➔ ปฏิบัติ (Monitor) ➔ สะท้อนคิด (Reflect)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              background: achieved ? '#d1fae5' : '#e0e7ff',
              color: achieved ? '#065f46' : '#3730a3',
            }}
          >
            {achieved ? '✓ บรรลุเป้าหมายแล้ว' : `สัปดาห์ ${record.weekKey}`}
          </span>
          {!achieved && (
            <button
              type="button"
              onClick={() => setShowGoalPicker(!showGoalPicker)}
              style={{
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#4f46e5',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '2px 6px',
              }}
            >
              <Edit3 size={13} /> {showGoalPicker ? 'ปิด' : 'เปลี่ยนเป้าหมาย'}
            </button>
          )}
        </div>
      </div>

      {/* Goal Selector Modal / Box */}
      {showGoalPicker && (
        <div
          style={{
            marginBottom: 14,
            padding: '12px',
            borderRadius: 12,
            background: '#ffffff',
            border: '1.5px solid #cbd5e1',
          }}
        >
          <strong style={{ fontSize: '0.85rem', color: '#334155', display: 'block', marginBottom: 8 }}>
            เลือกเป้าหมายที่ต้องการฝึกฝนในสัปดาห์นี้ (Plan):
          </strong>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
            {weeklyGoalPresets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectGoal(p.id)}
                style={{
                  textAlign: 'left',
                  padding: '10px 12px',
                  borderRadius: 10,
                  border: p.id === goal.id ? '2px solid #6366f1' : '1px solid #e2e8f0',
                  background: p.id === goal.id ? '#f5f3ff' : '#f8fafc',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <span style={{ fontSize: '1.4rem' }}>{p.icon}</span>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#1e293b', display: 'block' }}>
                    {p.title}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    เป้าหมาย {p.targetCount} {p.unit} • +{p.xpReward} XP
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Goal Progress Display (Monitor) */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '14px 16px',
          border: achieved ? '1px solid #a7f3d0' : '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.4rem' }}>{goal.icon}</span>
            <div>
              <strong style={{ fontSize: '0.92rem', color: '#1e293b' }}>{goal.title}</strong>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{goal.description}</p>
            </div>
          </div>
          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: achieved ? '#15803d' : '#4338ca' }}>
            {currentCount} / {goal.targetCount} {goal.unit}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          style={{
            height: 10,
            borderRadius: 999,
            background: '#e2e8f0',
            overflow: 'hidden',
            margin: '10px 0 6px',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPct}%`,
              borderRadius: 999,
              background: achieved
                ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                : 'linear-gradient(90deg, #6366f1 0%, #4f46e5 100%)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        {/* Reflection Section (Reflect) */}
        {achieved && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: '1px solid #f1f5f9',
            }}
          >
            {record.reflectionText ? (
              <div
                style={{
                  background: '#f0fdf4',
                  borderRadius: 10,
                  padding: '10px 12px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Sparkles size={15} color="#16a34a" />
                  <strong style={{ fontSize: '0.82rem', color: '#166534' }}>
                    ข้อความสะท้อนคิดของคุณ (Reflect):
                  </strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#15803d', fontStyle: 'italic' }}>
                  "{record.reflectionText}"
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveReflection}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: '#065f46',
                    marginBottom: 6,
                  }}
                >
                  🎉 คุณทำสำเร็จตามเป้าหมายแล้ว! สรุปความรู้สึกหรือสิ่งที่ได้เรียนรู้สั้นๆ 1 ประโยค (Reflect):
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    placeholder="เช่น รู้สึกภูมิใจที่ทำข้อสอบผ่าน หรือ ชอบการคิดเป็นขั้นตอนในเกม..."
                    value={reflectionInput}
                    onChange={(e) => setReflectionInput(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 10,
                      border: '1px solid #cbd5e1',
                      fontSize: '0.82rem',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={isSavingReflection || !reflectionInput.trim()}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 10,
                      border: 'none',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                    }}
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const WeeklyGoalTracker: React.FC<WeeklyGoalTrackerProps> = ({ studentId }) => (
  <WeeklyGoalTrackerContent key={studentId} studentId={studentId} />
);

export default WeeklyGoalTracker;
