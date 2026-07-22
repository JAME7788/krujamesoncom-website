import React, { useState } from 'react';
import { ClipboardCheck, Star } from 'lucide-react';
import { SURVEY_QUESTIONS, submitSurvey, hasSubmittedSurvey } from '../services/satisfactionSurveyService';
import { awardBonus } from '../services/progressService';
import { useToast } from './Toast';

interface Props {
  studentId: string;
  classroom: string;
}

const SCALE = [
  { v: 1, label: 'น้อยที่สุด', emoji: '😞' },
  { v: 2, label: 'น้อย', emoji: '😐' },
  { v: 3, label: 'ปานกลาง', emoji: '🙂' },
  { v: 4, label: 'มาก', emoji: '😃' },
  { v: 5, label: 'มากที่สุด', emoji: '🤩' },
];

const SatisfactionSurvey: React.FC<Props> = ({ studentId, classroom }) => {
  const [done, setDone] = useState(() => hasSubmittedSurvey(studentId));
  const [answers, setAnswers] = useState<number[]>(() => SURVEY_QUESTIONS.map(() => 0));
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (done) return null;

  const pick = (qi: number, v: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === qi ? v : a)));
  };

  const allAnswered = answers.every((a) => a > 0);

  const submit = async () => {
    if (!allAnswered) { toast.show('ตอบให้ครบทุกข้อก่อนนะ', 'info'); return; }
    setBusy(true);
    try {
      await submitSurvey(studentId, classroom, answers);
      // ให้รางวัลเล็กน้อยเป็นการขอบคุณ
      const stored = await awardBonus(studentId, { emoji: '📝', reason: 'ทำแบบสอบถามความพึงพอใจ', xp: 10 });
      if (!stored) throw new Error('บันทึก XP เข้า Firebase ไม่สำเร็จ');
      setDone(true);
      toast.show('ขอบคุณที่ทำแบบสอบถาม! +10 XP 🎉', 'success');
    } catch (e) {
      toast.show(`ส่งไม่สำเร็จ: ${e instanceof Error ? e.message : String(e)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      padding: '1.25rem 1.5rem', borderRadius: 18, marginBottom: 16,
      background: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 60%, #86efac 100%)',
      boxShadow: '0 4px 14px rgba(34, 197, 94, 0.2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10, background: 'rgba(255,255,255,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a',
        }}>
          <ClipboardCheck size={22} />
        </div>
        <div>
          <div style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 700 }}>
            <Star size={12} style={{ verticalAlign: 'middle' }} /> แบบสอบถามความพึงพอใจ (ตอบครั้งเดียว +10 XP)
          </div>
          <strong style={{ fontSize: '1rem', color: '#14532d' }}>ช่วยบอกความรู้สึกต่อการเรียนผ่านเว็บนี้หน่อย</strong>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SURVEY_QUESTIONS.map((q, qi) => (
          <div key={qi} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#14532d', marginBottom: 6 }}>
              {qi + 1}. {q}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SCALE.map((s) => (
                <button
                  key={s.v}
                  onClick={() => pick(qi, s.v)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                    padding: '6px 10px', borderRadius: 10, cursor: 'pointer',
                    background: answers[qi] === s.v ? '#16a34a' : 'white',
                    color: answers[qi] === s.v ? 'white' : '#374151',
                    border: answers[qi] === s.v ? '2px solid #15803d' : '1px solid #d1d5db',
                    fontFamily: 'inherit', fontSize: '0.72rem', minWidth: 58,
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{s.emoji}</span>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 12, textAlign: 'right' }}>
        <button
          onClick={submit}
          disabled={busy || !allAnswered}
          className="btn-primary"
          style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 0 }}
        >
          {busy ? 'กำลังส่ง...' : 'ส่งแบบสอบถาม'}
        </button>
      </div>
    </div>
  );
};

export default SatisfactionSurvey;
