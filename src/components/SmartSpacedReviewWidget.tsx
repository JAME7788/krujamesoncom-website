import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import {
  getPendingReviewQuestions,
  getSpacedReviewStats,
  resolveReviewAttempt,
  type MissedQuestionItem,
} from '../services/spacedRepetitionService';

interface SmartSpacedReviewWidgetProps {
  studentId: string;
}

export const SmartSpacedReviewWidget: React.FC<SmartSpacedReviewWidgetProps> = ({
  studentId,
}) => {
  const [pending, setPending] = useState<MissedQuestionItem[]>(() =>
    getPendingReviewQuestions(studentId)
  );
  const [stats, setStats] = useState(() => getSpacedReviewStats(studentId));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  useEffect(() => {
    setPending(getPendingReviewQuestions(studentId));
    setStats(getSpacedReviewStats(studentId));
  }, [studentId]);

  if (pending.length === 0) {
    if (stats.masteredCount > 0) {
      return (
        <div
          className="section-card glass"
          style={{
            marginBottom: 16,
            padding: '1rem 1.25rem',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
            border: '1.5px solid #a7f3d0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.6rem' }}>🧠</span>
            <div>
              <strong style={{ fontSize: '0.92rem', color: '#166534' }}>
                สมองแม่นยำตามเส้นโค้งการลืม (Ebbinghaus Retained)
              </strong>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#047857' }}>
                ยอดเยี่ยมมาก! ไม่มีข้อที่ต้องทบทวนในขณะนี้ • พิชิตจุดอ่อนสำเร็จแล้ว {stats.masteredCount} ข้อ
              </p>
            </div>
          </div>
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              padding: '3px 10px',
              borderRadius: 999,
              background: '#bbf7d0',
              color: '#14532d',
            }}
          >
            ✓ ความจำระยะยาว 100%
          </span>
        </div>
      );
    }
    return null;
  }

  const currentQ = pending[currentIndex] || pending[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOpt(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.answerIndex;
    resolveReviewAttempt(studentId, currentQ.id, isCorrect);
    setStats(getSpacedReviewStats(studentId));
  };

  const handleNext = () => {
    const updated = getPendingReviewQuestions(studentId);
    setPending(updated);
    setStats(getSpacedReviewStats(studentId));
    setSelectedOpt(null);
    setIsAnswered(false);
    if (currentIndex >= updated.length) {
      setCurrentIndex(0);
    }
  };

  const isCorrect = selectedOpt !== null && selectedOpt === currentQ.answerIndex;

  return (
    <div
      className="section-card glass spaced-review-widget"
      style={{
        marginBottom: 16,
        padding: '1.25rem 1.5rem',
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(254,242,242,0.95) 0%, rgba(255,247,237,0.95) 100%)',
        border: '1.5px solid #fecdd3',
        boxShadow: '0 4px 16px rgba(244, 63, 94, 0.06)',
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
            <span style={{ fontSize: '1.4rem' }}>🧠</span>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#9f1239' }}>
              ทบทวนความจำเว้นระยะห่าง (Ebbinghaus Spaced Repetition)
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', color: '#881337', fontSize: '0.82rem' }}>
            ทบทวนข้อที่เคยทำผิดตามจังหวะเวลา เพื่อเปลี่ยนเป็นความจำระยะยาว (Long-Term Memory)
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#ffe4e6',
              padding: '3px 8px',
              borderRadius: 999,
              fontSize: '0.75rem',
              color: '#be123c',
              fontWeight: 700,
            }}
          >
            ค้างทบทวน {pending.length} ข้อ
          </span>
          <span
            style={{
              background: '#fef3c7',
              padding: '3px 8px',
              borderRadius: 999,
              fontSize: '0.75rem',
              color: '#b45309',
              fontWeight: 700,
            }}
          >
            ขั้นทบทวน {currentQ.reviewStage + 1}/3
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 14,
          padding: '14px 16px',
          border: '1px solid #fed7aa',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
            ที่มา: {currentQ.source} {currentQ.grade ? `(${currentQ.grade})` : ''}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#dc2626', fontWeight: 600 }}>
            เคยผิด {currentQ.mistakeCount} ครั้ง
          </span>
        </div>

        <h4 style={{ margin: '0 0 12px', fontSize: '0.96rem', color: '#1e293b', lineHeight: 1.5 }}>
          {currentQ.questionText}
        </h4>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQ.options.map((opt, i) => {
            const isPicked = selectedOpt === i;
            const isRight = i === currentQ.answerIndex;

            let optBg = '#f8fafc';
            let optBorder = '#cbd5e1';
            let optColor = '#334155';

            if (isAnswered) {
              if (isRight) {
                optBg = '#dcfce7';
                optBorder = '#86efac';
                optColor = '#166534';
              } else if (isPicked) {
                optBg = '#fee2e2';
                optBorder = '#fca5a5';
                optColor = '#991b1b';
              }
            } else if (isPicked) {
              optBg = '#e0e7ff';
              optBorder = '#818cf8';
              optColor = '#3730a3';
            }

            return (
              <button
                key={i}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(i)}
                style={{
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: 10,
                  border: `1.5px solid ${optBorder}`,
                  background: optBg,
                  color: optColor,
                  fontWeight: isPicked || (isAnswered && isRight) ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: isAnswered ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 999,
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {['ก', 'ข', 'ค', 'ง'][i] || i + 1}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
                {isAnswered && isRight && <CheckCircle2 size={16} color="#16a34a" />}
                {isAnswered && isPicked && !isRight && <XCircle size={16} color="#dc2626" />}
              </button>
            );
          })}
        </div>

        {/* Answer Feedback & Explanation */}
        {isAnswered && (
          <div
            style={{
              marginTop: 12,
              padding: '10px 12px',
              borderRadius: 10,
              background: isCorrect ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${isCorrect ? '#bbf7d0' : '#fef3c7'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              {isCorrect ? (
                <>
                  <Sparkles size={16} color="#16a34a" />
                  <strong style={{ fontSize: '0.85rem', color: '#166534' }}>
                    ถูกต้อง! ความจำแน่นขึ้น +10 XP
                  </strong>
                </>
              ) : (
                <>
                  <RotateCcw size={16} color="#d97706" />
                  <strong style={{ fontSize: '0.85rem', color: '#b45309' }}>
                    ยังไม่ถูกต้อง — ข้อนี้จะถูกจัดคิวมาให้ทบทวนซ้ำอีกครั้ง
                  </strong>
                </>
              )}
            </div>
            {currentQ.explanation && (
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                💡 คำอธิบาย: {currentQ.explanation}
              </p>
            )}
            <div style={{ marginTop: 8, textAlign: 'right' }}>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                ข้อถัดไป <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SmartSpacedReviewWidget;
