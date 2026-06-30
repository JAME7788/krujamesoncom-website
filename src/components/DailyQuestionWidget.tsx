import React, { useEffect, useState } from 'react';
import { HelpCircle, CheckCircle2, Sparkles } from 'lucide-react';
import {
  fetchDailyQuestion, hasAnsweredToday, answerDailyQuestion, todayDateKey,
} from '../services/dailyQuestionService';
import type { DailyQuestion } from '../services/dailyQuestionService';
import { useToast } from './Toast';

interface Props {
  studentId: string;
}

const DailyQuestionWidget: React.FC<Props> = ({ studentId }) => {
  const [q, setQ] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [answered, setAnswered] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const date = todayDateKey();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const data = await fetchDailyQuestion(date);
      if (cancelled) return;
      setQ(data);
      setAnswered(hasAnsweredToday(studentId, date));
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [studentId, date]);

  if (loading || !q) return null;

  const handlePick = async (idx: number) => {
    if (answered || busy) return;
    setBusy(true);
    setPicked(idx);
    try {
      const result = await answerDailyQuestion(studentId, date, q, idx);
      setAnswered(true);
      if (result.correct) {
        toast.show(`✅ ตอบถูก! +${result.xpAwarded} XP`, 'success');
      } else {
        toast.show(`📝 ไม่ตรง แต่ +${result.xpAwarded} XP สำหรับความพยายาม! คำตอบ: ${q.options[q.correctIndex]}`, 'info');
      }
    } catch (e) {
      toast.show(`บันทึกไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`, 'error');
      setPicked(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      padding: '1.25rem 1.5rem', borderRadius: 18, marginBottom: 16,
      background: 'linear-gradient(135deg, #ddd6fe 0%, #c4b5fd 60%, #a78bfa 100%)',
      boxShadow: '0 4px 14px rgba(167, 139, 250, 0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: 'rgba(255, 255, 255, 0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6d28d9',
        }}>
          <HelpCircle size={22} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.78rem', color: '#5b21b6', fontWeight: 700 }}>
            <Sparkles size={12} style={{ verticalAlign: 'middle' }} /> คำถามประจำวัน — ตอบครั้งเดียว ได้ XP
          </div>
          <strong style={{ fontSize: '1rem', color: '#4c1d95' }}>{q.question}</strong>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: q.options.length > 2 ? '1fr 1fr' : '1fr', gap: 8 }}>
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isPicked = picked === i;
          const showResult = answered;
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={answered || busy}
              style={{
                padding: '12px 14px', borderRadius: 12,
                background: showResult
                  ? (isCorrect ? '#22c55e' : isPicked ? '#ef4444' : 'rgba(255,255,255,0.7)')
                  : 'white',
                color: showResult && (isCorrect || isPicked) ? 'white' : '#1f2937',
                border: showResult && isPicked ? '2px solid #1f2937' : '1px solid rgba(167,139,250,0.5)',
                fontWeight: showResult && (isCorrect || isPicked) ? 700 : 500,
                fontFamily: 'inherit', fontSize: '0.95rem', textAlign: 'left',
                cursor: answered ? 'default' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                opacity: showResult && !isCorrect && !isPicked ? 0.5 : 1,
                transition: 'all 0.2s',
              }}
            >
              {showResult && isCorrect && <CheckCircle2 size={16} />}
              <span style={{ fontWeight: 700 }}>{['ก', 'ข', 'ค', 'ง'][i]}.</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{ marginTop: 10, textAlign: 'center', fontSize: '0.82rem', color: '#5b21b6', fontWeight: 600 }}>
          ✓ ตอบแล้ว — กลับมาใหม่พรุ่งนี้สำหรับคำถามต่อไป
        </div>
      )}
    </div>
  );
};

export default DailyQuestionWidget;
