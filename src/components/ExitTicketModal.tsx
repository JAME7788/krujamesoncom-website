import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Send, CheckCircle, Award } from 'lucide-react';
import {
  submitExitTicket,
  MOOD_LABELS,
  type ExitMood,
  type ExitTicket,
} from '../services/exitTicketService';
import type { Subject } from '../services/gradeService';
import { sfxCoin } from '../utils/gameSounds';
import { fireConfetti } from '../utils/celebrate';
import { useToast } from './Toast';
import './ExitTicketModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  student: {
    id: string;
    name: string;
    classroom: string;
    studentNumber: string;
  };
  subject?: Subject;
  unitId?: string;
  unitTitle?: string;
  onSuccess?: (ticket: ExitTicket) => void;
}

const COMMON_CHIPS = [
  'เข้าใจขั้นตอนการทำงาน',
  'เขียนคำสั่งสำเร็จ',
  'จำสัญลักษณ์สำคัญได้',
  'สนุกกับการทดลอง',
  'ได้ช่วยเพื่อนในกลุ่ม',
  'แก้ปัญหาด้วยตนเองได้',
];

const STAR_LABELS: Record<number, string> = {
  1: 'หลุดบ่อย ยังตามไม่ทัน',
  2: 'พอทำได้บ้างบางส่วน',
  3: 'ตั้งใจปานกลาง พอเข้าใจ',
  4: 'ตั้งใจดีมาก ทำเสร็จตามเวลา',
  5: 'มีสมาธิตลอดคาบ สุดยอด!',
};

export const ExitTicketModal: React.FC<Props> = ({
  isOpen,
  onClose,
  student,
  subject = 'cs',
  unitId,
  unitTitle,
  onSuccess,
}) => {
  const [mood, setMood] = useState<ExitMood>('great');
  const [learnedKeyword, setLearnedKeyword] = useState('');
  const [questions, setQuestions] = useState('');
  const [selfScore, setSelfScore] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<ExitTicket | null>(null);

  const toast = useToast();

  const handleChipClick = (chip: string) => {
    setLearnedKeyword((prev) => {
      if (!prev.trim()) return chip;
      if (prev.includes(chip)) return prev;
      return `${prev}, ${chip}`;
    });
  };

  const earnedScoreA = selfScore >= 4 ? 3 : selfScore >= 3 ? 2 : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learnedKeyword.trim()) {
      toast.show('กรุณาระบุสิ่งที่ได้เรียนรู้หรือเข้าใจในคาบนี้ (เลือกชิปด้านล่างได้เลย)', 'info');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const ticket = await submitExitTicket({
        studentId: student.id,
        studentName: student.name,
        classroom: student.classroom,
        studentNumber: student.studentNumber,
        subject,
        unitId,
        unitTitle,
        date: dateStr,
        mood,
        learnedKeyword: learnedKeyword.trim(),
        questions: questions.trim() || undefined,
        selfScore,
      });

      // SFX + Confetti
      try {
        sfxCoin();
        fireConfetti();
      } catch {
        // ignore audio/canvas error
      }

      setSubmittedTicket(ticket);
      toast.show(`🎉 ส่งตั๋วบอกลาสำเร็จ! ได้รับคะแนนจิตพิสัย +${ticket.earnedScoreA} คะแนน`, 'success');
      onSuccess?.(ticket);

      // Auto close after 2.5s
      setTimeout(() => {
        setSubmittedTicket(null);
        onClose();
      }, 2500);
    } catch (err) {
      toast.show(`ส่งตั๋วไม่สำเร็จ: ${err instanceof Error ? err.message : String(err)}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="exit-modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="exit-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="exit-modal-close-btn"
              onClick={onClose}
              title="ปิด"
            >
              <X size={20} />
            </button>

            {submittedTicket ? (
              <div className="exit-success-view">
                <div className="exit-success-icon">🎉</div>
                <h3 className="exit-success-title">ส่งตั๋วบอกลาคาบเรียนสำเร็จ!</h3>
                <p className="exit-success-desc">
                  ครูเจมส์ได้รับข้อความสะท้อนคิดของ {student.name} แล้ว ขอบคุณที่ตั้งใจเรียนในวันนี้นะครับ
                </p>

                <div className="exit-reward-box">
                  <strong>+ {submittedTicket.earnedScoreA} คะแนนจิตพิสัย (A) 🌟</strong>
                  <p>บันทึกลงสมุดคะแนนและหลักฐานการเรียนรู้อัตโนมัติแล้ว</p>
                </div>

                <button
                  type="button"
                  className="exit-btn-submit"
                  style={{ margin: '0 auto', maxWidth: 200 }}
                  onClick={onClose}
                >
                  <CheckCircle size={18} /> เยี่ยมมาก!
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="exit-modal-header">
                  <span className="exit-badge">
                    <Sparkles size={14} /> บันทึกสะท้อนคิดก่อนหมดคาบ
                  </span>
                  <h2>ตั๋วบอกลาคาบเรียน (Exit Ticket)</h2>
                  <p>
                    {student.name} • เลขที่ {student.studentNumber} • {student.classroom}
                    {unitTitle ? ` • ${unitTitle}` : ''}
                  </p>
                </div>

                {/* 1. MOOD SELECTION */}
                <div className="exit-form-group">
                  <label className="exit-form-label">
                    1. บรรยากาศและความรู้สึกในการเรียนคาบนี้ <span className="req">*</span>
                  </label>
                  <div className="exit-mood-grid">
                    {(Object.entries(MOOD_LABELS) as [ExitMood, typeof MOOD_LABELS[ExitMood]][]).map(([key, meta]) => {
                      const isSelected = mood === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={`exit-mood-btn ${isSelected ? 'selected' : ''}`}
                          style={{ '--mood-color': meta.color } as React.CSSProperties}
                          onClick={() => setMood(key)}
                        >
                          <span className="exit-mood-emoji">{meta.emoji}</span>
                          <span className="exit-mood-text">{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 2. WHAT WAS LEARNED */}
                <div className="exit-form-group">
                  <label className="exit-form-label">
                    2. วันนี้ได้เรียนรู้อะไร หรือเข้าใจคำไหนมากที่สุด? <span className="req">*</span>
                    <span className="exit-form-sublabel">คลิกปุ่มตัวเลือกด่วน หรือพิมพ์คำของตัวเองได้เลย</span>
                  </label>
                  <div className="exit-chips-wrap">
                    {COMMON_CHIPS.map((chip) => {
                      const isPicked = learnedKeyword.includes(chip);
                      return (
                        <button
                          key={chip}
                          type="button"
                          className={`exit-chip-btn ${isPicked ? 'selected' : ''}`}
                          onClick={() => handleChipClick(chip)}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                  <input
                    type="text"
                    className="exit-input-text"
                    placeholder="เช่น เข้าใจเรื่องอัลกอริทึม, รู้วิธีบันทึกไฟล์..."
                    value={learnedKeyword}
                    onChange={(e) => setLearnedKeyword(e.target.value)}
                    maxLength={150}
                  />
                </div>

                {/* 3. QUESTIONS FOR TEACHER */}
                <div className="exit-form-group">
                  <label className="exit-form-label">
                    3. มีอะไรอยากถามครูเจมส์ หรืออยากบอกไหม?
                    <span className="exit-form-sublabel">(ไม่บังคับ — ถามได้ทุกอย่างที่ยังสงสัย)</span>
                  </label>
                  <textarea
                    className="exit-textarea"
                    placeholder="เช่น ตรงเงื่อนไขถ้า-แล้วยังงงนิดหน่อยครับ, อยากให้มีเวลาลองทำเกมเยอะขึ้น..."
                    value={questions}
                    onChange={(e) => setQuestions(e.target.value)}
                    rows={2}
                    maxLength={200}
                  />
                </div>

                {/* 4. STAR SELF-ASSESSMENT */}
                <div className="exit-form-group">
                  <label className="exit-form-label">
                    4. ให้คะแนนสมาธิและความตั้งใจของตัวเองในคาบนี้ <span className="req">*</span>
                  </label>
                  <div className="exit-stars-wrap">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`exit-star-btn ${selfScore >= star ? 'active' : ''}`}
                        onClick={() => setSelfScore(star)}
                        title={`${star} ดาว`}
                      >
                        ⭐
                      </button>
                    ))}
                  </div>
                  <div className="exit-score-preview">
                    <span>{STAR_LABELS[selfScore] || ''}</span>
                    <span className="exit-score-badge">
                      <Award size={13} /> ได้คะแนนจิตพิสัย (A): +{earnedScoreA} คะแนน
                    </span>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="exit-modal-actions">
                  <button
                    type="button"
                    className="exit-btn-cancel"
                    onClick={onClose}
                    disabled={isSubmitting}
                  >
                    ไว้ทีหลัง
                  </button>
                  <button
                    type="submit"
                    className="exit-btn-submit"
                    disabled={isSubmitting || !learnedKeyword.trim()}
                  >
                    {isSubmitting ? (
                      'กำลังส่ง...'
                    ) : (
                      <>
                        <Send size={16} /> ส่งตั๋วบอกลา (+{earnedScoreA} คะแนน A)
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ExitTicketModal;
