import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Timer,
  Award,
  BookOpen,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  ListChecks,
  CheckCircle,
} from 'lucide-react';
import './Quiz.css';
import { useAuth } from '../context/AuthContext';
import { saveQuizAttempt } from '../services/progressService';
import { syncStudentGradesFromProgress } from '../services/gameProgressService';
import { getDefaultProgressGradeIdForClassroom } from '../services/courseAccessService';
import { recordLearningEvidence } from '../services/learningEvidenceService';
import { getLinkedUnitsForSubject } from '../services/gradeService';
import { isInClassTime, loadSchedule } from '../data/schedule';
import { loadRoster } from '../services/rosterService';
import { isScoreEligibleUser } from '../services/userAccessService';
import { recordMissedQuestion } from '../services/spacedRepetitionService';
import {
  availableExamGrades,
  getExamSetsByGrade,
  getExamSetById,
  saveExamAttempt,
  getBestScoreForExamSet,
  type ExamSet,
  type ExamAttempt,
} from '../services/examService';

// ชุดคำถามเดิมสำหรับโหมดฝึกทบทวนทั่วไป (Backward Compatibility)
const defaultPracticeQuestions = [
  {
    text: "ข้อใดคือความหมายของ 'วิทยาการคำนวณ'?",
    options: ['การคำนวณเลขชั้นสูง', 'การแก้ปัญหาอย่างเป็นขั้นตอนและเป็นระบบ', 'การซ่อมคอมพิวเตอร์', 'การใช้อินเทอร์เน็ตเพื่อความบันเทิง'],
    answer: 1,
  },
  {
    text: "ใน Scratch บล็อกเหตุการณ์ใช้ทำอะไร?",
    options: ['กำหนดจุดเริ่มทำงาน', 'เปลี่ยนสีจอ', 'ลบตัวละคร', 'ปิดอินเทอร์เน็ต'],
    answer: 0,
  },
  {
    text: 'การเขียนโปรแกรมแบบ Unplugged หมายถึงอะไร?',
    options: ['เขียนโปรแกรมโดยไม่ใช้คอมพิวเตอร์', 'ถอดปลั๊กขณะใช้งาน', 'เขียน Python เท่านั้น', 'ใช้หุ่นยนต์ราคาแพง'],
    answer: 0,
  },
  {
    text: 'ก่อนลงมือแก้ปัญหา ควรทำสิ่งใดก่อน?',
    options: ['เดาคำตอบทันที', 'ทำความเข้าใจปัญหาและเป้าหมาย', 'ถามเพื่อนแล้วลอก', 'เปลี่ยนอุปกรณ์'],
    answer: 1,
  },
  {
    text: 'ข้อใดเป็นลำดับที่เหมาะสมในการสร้างผลงานดิจิทัล?',
    options: ['บันทึก-วางแผน-สร้าง', 'วางแผน-สร้าง-ตรวจสอบ-บันทึก', 'สร้าง-ลบ-เริ่มใหม่', 'เปิดเครื่อง-ปิดเครื่อง'],
    answer: 1,
  },
  {
    text: 'เมื่อโปรแกรมให้ผลลัพธ์ไม่ตรงเป้าหมาย ควรทำอย่างไร?',
    options: ['หยุดทำทันที', 'ตรวจคำสั่งทีละขั้นและแก้ไข', 'เปลี่ยนชื่อไฟล์', 'ปิดหน้าจอ'],
    answer: 1,
  },
  {
    text: 'ข้อมูลใดไม่ควรเผยแพร่ต่อคนแปลกหน้าบนอินเทอร์เน็ต?',
    options: ['สีที่ชอบ', 'วิชาที่ชอบ', 'รหัสผ่านและที่อยู่บ้าน', 'งานอดิเรก'],
    answer: 2,
  },
  {
    text: 'แหล่งข้อมูลใดน่าเชื่อถือที่สุดสำหรับทำรายงาน?',
    options: ['ข้อความที่ไม่ระบุผู้เขียน', 'เว็บไซต์หน่วยงานหรือหนังสือที่มีผู้จัดทำชัดเจน', 'ข่าวส่งต่อในกลุ่มแชต', 'ความคิดเห็นที่ไม่มีหลักฐาน'],
    answer: 1,
  },
  {
    text: 'เหตุใดจึงควรตั้งชื่อไฟล์ให้สื่อความหมาย?',
    options: ['เพื่อให้ไฟล์ใหญ่ขึ้น', 'เพื่อค้นหาและเรียกใช้ได้ง่าย', 'เพื่อให้อินเทอร์เน็ตเร็วขึ้น', 'เพื่อเปลี่ยนชนิดไฟล์'],
    answer: 1,
  },
  {
    text: 'พฤติกรรมใดแสดงถึงการใช้เทคโนโลยีอย่างรับผิดชอบ?',
    options: ['ใช้งานตามข้อตกลงและเคารพผลงานผู้อื่น', 'ใช้บัญชีเพื่อนโดยไม่ขอ', 'ส่งต่อข้อมูลทันที', 'ติดตั้งทุกโปรแกรมที่พบ'],
    answer: 0,
  },
];

const findExamSetFromParam = (param?: string): ExamSet | null => {
  if (!param || param === 'all' || param === 'practice') return null;
  const direct = getExamSetById(param);
  if (direct) return direct;

  const normalized = param.toLowerCase();
  const gradeMap: Record<string, string> = {
    p1: 'ป.1', p2: 'ป.2', p3: 'ป.3', p4: 'ป.4', p5: 'ป.5', p6: 'ป.6',
    m1: 'ม.1', m2: 'ม.2', m3: 'ม.3',
  };
  const match = normalized.match(/(?:exam_)?([pm]\d)(?:_set|_)?(\d+)?/i);
  if (match) {
    const gradeKey = match[1];
    const targetGrade = gradeMap[gradeKey];
    const setNum = match[2] ? parseInt(match[2], 10) : 1;
    if (targetGrade) {
      const sets = getExamSetsByGrade(targetGrade);
      const found = sets.find((s) => s.setNumber === setNum) || sets[0];
      if (found) return found;
    }
  }
  return null;
};

const Quiz: React.FC = () => {
  const { id: paramId } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Mode Selection: 'exam_bank' (คลังข้อสอบ 25 ชุด) หรือ 'practice' (ฝึกทั่วไป)
  const [activeMode, setActiveMode] = useState<'exam_bank' | 'practice'>('exam_bank');
  const [selectedGrade, setSelectedGrade] = useState<string>(() => {
    if (paramId) {
      const found = findExamSetFromParam(paramId);
      if (found) return found.grade;
      const gMap: Record<string, string> = {
        p1: 'ป.1', p2: 'ป.2', p3: 'ป.3', p4: 'ป.4', p5: 'ป.5', p6: 'ป.6',
        m1: 'ม.1', m2: 'ม.2', m3: 'ม.3',
      };
      const directGrade = gMap[paramId.toLowerCase()] || (availableExamGrades.includes(paramId) ? paramId : null);
      if (directGrade) return directGrade;
    }
    if (user?.classroom && availableExamGrades.includes(user.classroom)) {
      return user.classroom;
    }
    return 'ป.1';
  });

  // State สำหรับ Exam Bank Mode
  const [activeExamSet, setActiveExamSet] = useState<ExamSet | null>(() => {
    if (paramId && paramId !== 'all' && paramId !== 'practice') {
      return findExamSetFromParam(paramId);
    }
    return null;
  });
  const [examQIndex, setExamQIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, number>>({});
  const [examStartTime, setExamStartTime] = useState(() => Date.now());
  const [examResult, setExamResult] = useState<ExamAttempt | null>(null);
  const [showReview, setShowReview] = useState(false);

  // Sync paramId if URL changes
  useEffect(() => {
    if (!paramId) return;
    if (paramId === 'practice') {
      setActiveMode('practice');
      setActiveExamSet(null);
      return;
    }
    if (paramId === 'all') {
      setActiveMode('exam_bank');
      setActiveExamSet(null);
      return;
    }
    const found = findExamSetFromParam(paramId);
    if (found) {
      setActiveMode('exam_bank');
      setSelectedGrade(found.grade);
      setActiveExamSet(found);
      setExamQIndex(0);
      setExamAnswers({});
      setExamStartTime(Date.now());
      setExamResult(null);
      setShowReview(false);
    }
  }, [paramId]);

  // State สำหรับ Practice Mode (ดั้งเดิม)
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const savedRef = useRef(false);

  // รายการชุดข้อสอบในชั้นที่เลือก
  const currentSets = useMemo(() => getExamSetsByGrade(selectedGrade), [selectedGrade]);

  // ซิงค์บันทึกคะแนนใน Practice Mode (ดั้งเดิม)
  useEffect(() => {
    if (activeMode !== 'practice' || !showScore || !user || savedRef.current) return;
    const gradeId = getDefaultProgressGradeIdForClassroom(user.classroom);
    if (!gradeId) return;
    savedRef.current = true;
    void saveQuizAttempt(user.id, gradeId, 1, score, defaultPracticeQuestions.length, {})
      .then(async (attempt) => {
        if (!attempt.saved) {
          savedRef.current = false;
          return;
        }
        await syncStudentGradesFromProgress({
          id: user.id,
          name: user.name,
          classroom: user.classroom,
          studentNumber: user.studentNumber,
        });
        const subject = gradeId.includes('design') ? 'dt' : gradeId.startsWith('m') ? 'cs' : 'main';
        const indicator = getLinkedUnitsForSubject(user.classroom, subject)
          .find((entry) => entry.units.some((unit) => unit.gradeId === gradeId && unit.unitNo === 1))
          ?.indicator;
        await recordLearningEvidence({
          studentId: user.id,
          studentCode: loadRoster(user.classroom).find((student) => (
            student.no === Number(user.studentNumber) || student.name === user.name
          ))?.studentCode,
          studentName: user.name,
          classroom: user.classroom,
          subject,
          indicatorId: indicator?.id,
          indicatorCode: indicator?.code,
          source: 'quiz',
          domain: 'K',
          title: 'แบบทดสอบวิทยาการคำนวณ',
          detail: `ตอบถูก ${score} จาก ${defaultPracticeQuestions.length} ข้อ`,
          score,
          maxScore: defaultPracticeQuestions.length,
          inClass: isInClassTime(Date.now(), user.classroom, loadSchedule()),
          occurredAt: Date.now(),
          dedupKey: `general-${new Date().toISOString().slice(0, 10)}`,
        });
      });
  }, [activeMode, score, showScore, user]);

  // เริ่มทำชุดข้อสอบ
  const startExam = (set: ExamSet) => {
    setActiveExamSet(set);
    setExamQIndex(0);
    setExamAnswers({});
    setExamStartTime(Date.now());
    setExamResult(null);
    setShowReview(false);
  };

  // ตอบคำถามใน Exam Bank Mode
  const handleSelectExamOption = (optionIndex: number) => {
    if (!activeExamSet) return;
    const currentQ = activeExamSet.questions[examQIndex];
    if (!currentQ) return;
    setExamAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionIndex,
    }));
  };

  // ส่งแบบทดสอบ Exam Bank
  const submitExam = async () => {
    if (!activeExamSet) return;
    let earned = 0;
    activeExamSet.questions.forEach((q) => {
      const selected = examAnswers[q.id];
      if (selected !== undefined && selected === q.answerIndex) {
        earned++;
      } else {
        // บันทึกข้อที่ตอบผิดลงคิวทบทวนความจำเว้นระยะห่าง (Ebbinghaus Spaced Repetition)
        if (user) {
          recordMissedQuestion(user.id, {
            id: q.id,
            text: q.text,
            options: q.options,
            answerIndex: q.answerIndex,
            explanation: q.explanation,
            source: activeExamSet.title,
            grade: activeExamSet.grade,
          });
        }
      }
    });

    const total = activeExamSet.questions.length;
    const pct = Math.round((earned / total) * 100);
    const passed = pct >= 50;
    const timeSpent = Math.max(1, Math.round((Date.now() - examStartTime) / 1000));

    const attempt: ExamAttempt = {
      id: `attempt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      studentId: user?.id || 'guest',
      studentName: user?.name || 'ผู้เรียน',
      classroom: user?.classroom || selectedGrade,
      examSetId: activeExamSet.id,
      examTitle: activeExamSet.title,
      score: earned,
      totalQuestions: total,
      percentage: pct,
      passed,
      answers: examAnswers,
      timeSpentSeconds: timeSpent,
      timestamp: Date.now(),
    };

    setExamResult(attempt);
    await saveExamAttempt(attempt);

    // ปลอดภัยและไม่ลบข้อมูลเดิม (Non-destructive): บันทึกลงร่องรอยหลักฐานการเรียนรู้ (Domain K)
    if (user && isScoreEligibleUser(user)) {
      try {
        await recordLearningEvidence({
          studentId: user.id,
          studentCode: loadRoster(user.classroom).find((student) => (
            student.no === Number(user.studentNumber) || student.name === user.name
          ))?.studentCode,
          studentName: user.name,
          classroom: user.classroom,
          subject: activeExamSet.id.includes('m') ? 'cs' : 'main',
          source: 'quiz',
          domain: 'K',
          title: `แบบทดสอบมาตรฐาน: ${activeExamSet.title}`,
          detail: `ทำได้ ${earned}/${total} ข้อ (${pct}%) - ${passed ? 'ผ่านเกณฑ์' : 'ทบทวนเพิ่มเติม'}`,
          score: earned,
          maxScore: total,
          inClass: isInClassTime(Date.now(), user.classroom, loadSchedule()),
          occurredAt: Date.now(),
          dedupKey: `exam-${activeExamSet.id}-${new Date().toISOString().slice(0, 10)}`,
        });
      } catch (err) {
        console.warn('Record exam evidence warning:', err);
      }
    }
  };

  // จัดการการตอบในโหมด Practice เดิม
  const handlePracticeAnswerClick = (index: number) => {
    setSelectedAnswer(index);
    if (index === defaultPracticeQuestions[currentQuestion].answer) {
      setScore(score + 1);
    }
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < defaultPracticeQuestions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
      } else {
        setShowScore(true);
      }
    }, 800);
  };

  const answeredExamCount = activeExamSet
    ? Object.keys(examAnswers).length
    : 0;

  return (
    <div className="quiz-container container section-padding">
      {/* 1. หน้ารายการชุดข้อสอบ (Exam Hub) */}
      {!activeExamSet && (
        <div className="quiz-hub-wrapper">
          <div className="quiz-hub-header">
            <h1 className="quiz-hub-title">คลังข้อสอบและการประเมินผลดิจิทัล</h1>
            <p className="quiz-hub-subtitle">
              แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียน กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี (วิทยาการคำนวณ ว 4.2)
            </p>
          </div>

          {/* แท็บสลับโหมด */}
          <div className="quiz-mode-tabs">
            <button
              className={`quiz-mode-tab ${activeMode === 'exam_bank' ? 'active' : ''}`}
              onClick={() => setActiveMode('exam_bank')}
            >
              <BookOpen size={18} />
              แบบทดสอบประจำชั้นเรียน (25 ชุด)
            </button>
            <button
              className={`quiz-mode-tab ${activeMode === 'practice' ? 'active' : ''}`}
              onClick={() => {
                setActiveMode('practice');
                setCurrentQuestion(0);
                setShowScore(false);
                setScore(0);
                setSelectedAnswer(null);
                savedRef.current = false;
              }}
            >
              <Sparkles size={18} />
              แบบฝึกทบทวนทั่วไป (10 ข้อ)
            </button>
          </div>

          {/* แสดงคลังข้อสอบตามระดับชั้น */}
          {activeMode === 'exam_bank' && (
            <div className="exam-bank-view">
              {/* ตัวเลือกชั้นเรียน */}
              <div className="grade-filter-bar">
                {availableExamGrades.map((g) => (
                  <button
                    key={g}
                    className={`grade-pill ${selectedGrade === g ? 'active' : ''}`}
                    onClick={() => setSelectedGrade(g)}
                  >
                    ระดับชั้น {g}
                  </button>
                ))}
              </div>

              {/* รายการการ์ดชุดข้อสอบ */}
              <div className="exam-sets-grid">
                {currentSets.map((set) => {
                  const best = user ? getBestScoreForExamSet(user.id, set.id) : null;
                  return (
                    <div key={set.id} className="exam-set-card">
                      <div>
                        <div className="set-header">
                          <span className="set-badge">{set.grade}</span>
                          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>ชุดที่ {set.setNumber}</span>
                        </div>
                        <h3 className="set-title">{set.title}</h3>
                        <div className="set-meta">
                          <span className="set-meta-item">
                            <ListChecks size={15} /> {set.totalQuestions} ข้อ
                          </span>
                          <span className="set-meta-item">
                            <Timer size={15} /> {set.timeLimitMinutes} นาที
                          </span>
                        </div>
                      </div>

                      <div>
                        {best && (
                          <div className="set-score-record">
                            <span>สถิติดีที่สุด:</span>
                            <span className="set-score-tag">
                              {best.score}/{best.total} ({best.percentage}%)
                            </span>
                          </div>
                        )}
                        <button className="start-exam-btn" onClick={() => startExam(set)}>
                          เริ่มทำแบบทดสอบ
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* โหมดแบบฝึกทบทวนทั่วไป */}
          {activeMode === 'practice' && !showScore && (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="question-card glass"
            >
              <div className="quiz-header">
                <span className="q-count">คำถามที่ {currentQuestion + 1}/{defaultPracticeQuestions.length}</span>
                <div className="q-timer"><Timer size={18} /> ฝึกทบทวน</div>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${((currentQuestion + 1) / defaultPracticeQuestions.length) * 100}%` }}></div>
              </div>
              <h2 className="q-text">{defaultPracticeQuestions[currentQuestion].text}</h2>
              <div className="options-grid">
                {defaultPracticeQuestions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    className={`option-btn ${selectedAnswer === index ? (index === defaultPracticeQuestions[currentQuestion].answer ? 'selected' : '') : ''}`}
                    onClick={() => selectedAnswer === null && handlePracticeAnswerClick(index)}
                    disabled={selectedAnswer !== null}
                  >
                    <span className="opt-label">{String.fromCharCode(65 + index)}</span>
                    <span className="opt-text">{option}</span>
                    {selectedAnswer === index && (
                      index === defaultPracticeQuestions[currentQuestion].answer ? <CheckCircle2 size={24} style={{ color: '#16a34a' }} /> : <XCircle size={24} style={{ color: '#dc2626' }} />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* แสดงคะแนนโหมดแบบฝึกทบทวนทั่วไป */}
          {activeMode === 'practice' && showScore && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="score-card glass"
            >
              <Award size={80} className="award-icon" />
              <h2>ทำแบบฝึกหัดเสร็จแล้ว!</h2>
              <p className="score-text">คุณได้คะแนน</p>
              <div className="score-badge">{score} / {defaultPracticeQuestions.length}</div>
              <p className="feedback">
                {score >= 7 ? 'ยอดเยี่ยมมาก! คุณเข้าใจแนวคิดวิทยาการคำนวณเป็นอย่างดี' : 'ทำได้ดีแล้ว! ลองฝึกฝนเพิ่มเติมเพื่อเสริมความเข้าใจให้แน่นยิ่งขึ้น'}
              </p>
              <div className="result-actions">
                <button
                  className="btn-primary"
                  onClick={() => {
                    setCurrentQuestion(0);
                    setShowScore(false);
                    setScore(0);
                    setSelectedAnswer(null);
                    savedRef.current = false;
                  }}
                >
                  <RotateCcw size={16} /> ทำอีกครั้ง
                </button>
                <button className="btn-secondary" onClick={() => navigate('/dashboard')}>
                  กลับหน้าแดชบอร์ด
                </button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* 2. หน้ากำลังทำแบบทดสอบประจำชั้นเรียน (Exam Runner) */}
      {activeExamSet && !examResult && (
        <div className="exam-runner-wrapper">
          <div className="question-card glass">
            <div className="quiz-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                  onClick={() => {
                    if (window.confirm('คุณต้องการออกจากการทำแบบทดสอบใช่หรือไม่? (คำตอบที่เลือกไว้จะไม่ถูกบันทึก)')) {
                      setActiveExamSet(null);
                    }
                  }}
                >
                  <ArrowLeft size={14} /> ออก
                </button>
                <span className="q-count">
                  ข้อที่ {examQIndex + 1} / {activeExamSet.questions.length}
                </span>
              </div>
              <div className="q-timer">
                <Timer size={16} /> {activeExamSet.title}
              </div>
            </div>

            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${((examQIndex + 1) / activeExamSet.questions.length) * 100}%` }}
              ></div>
            </div>

            {activeExamSet.questions[examQIndex] && (
              <>
                <h2 className="q-text">
                  {examQIndex + 1}. {activeExamSet.questions[examQIndex].text}
                </h2>

                <div className="options-grid">
                  {activeExamSet.questions[examQIndex].options.map((option, idx) => {
                    const qId = activeExamSet.questions[examQIndex].id;
                    const isSelected = examAnswers[qId] === idx;
                    const thaiLabel = ['ก', 'ข', 'ค', 'ง'][idx] || String.fromCharCode(65 + idx);
                    return (
                      <button
                        key={idx}
                        className={`option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectExamOption(idx)}
                      >
                        <span className="opt-label">{thaiLabel}</span>
                        <span className="opt-text">{option}</span>
                        {isSelected && <CheckCircle size={20} style={{ color: 'var(--primary)' }} />}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* แผงนำทางเลขข้อสอบ (Question Navigation Drawer) */}
            <div className="question-nav-drawer">
              <div className="nav-drawer-title">
                ตอบแล้ว {answeredExamCount} จาก {activeExamSet.questions.length} ข้อ
              </div>
              <div className="nav-pills-grid">
                {activeExamSet.questions.map((q, idx) => {
                  const isAnswered = examAnswers[q.id] !== undefined;
                  const isActive = examQIndex === idx;
                  return (
                    <button
                      key={q.id}
                      className={`nav-pill ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                      onClick={() => setExamQIndex(idx)}
                      title={`ข้อที่ ${idx + 1}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ปุ่มเปลี่ยนข้อ / ส่งข้อสอบ */}
            <div className="quiz-actions-footer">
              <button
                className="btn-secondary"
                disabled={examQIndex === 0}
                onClick={() => setExamQIndex((prev) => Math.max(0, prev - 1))}
              >
                <ArrowLeft size={16} /> ข้อก่อนหน้า
              </button>

              {examQIndex < activeExamSet.questions.length - 1 ? (
                <button
                  className="btn-primary"
                  onClick={() => setExamQIndex((prev) => Math.min(activeExamSet.questions.length - 1, prev + 1))}
                >
                  ข้อถัดไป <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={{ background: '#16a34a' }}
                  onClick={() => {
                    const unanswered = activeExamSet.questions.length - answeredExamCount;
                    const msg = unanswered > 0
                      ? `คุณยังไม่ได้ตอบ ${unanswered} ข้อ ต้องการส่งแบบทดสอบเลยหรือไม่?`
                      : 'คุณตอบครบทุกข้อแล้ว ต้องการส่งแบบทดสอบเพื่อตรวจคะแนนหรือไม่?';
                    if (window.confirm(msg)) {
                      void submitExam();
                    }
                  }}
                >
                  <CheckCircle2 size={16} /> ส่งแบบทดสอบ
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. หน้าสรุปผลการทดสอบ (Exam Results & Pedagogical Review) */}
      {activeExamSet && examResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="score-card glass"
        >
          <div className="result-header">
            <Award size={72} className="award-icon" />
            <h2>ผลการทดสอบ: {examResult.examTitle}</h2>
            <div className="score-badge">
              {examResult.score} / {examResult.totalQuestions}
            </div>
            <div className={`result-tag ${examResult.passed ? 'passed' : 'failed'}`}>
              {examResult.passed ? ' ผ่านเกณฑ์การประเมิน (≥ 50%)' : ' ควรทบทวนเนื้อหาเพิ่มเติม (< 50%)'}
              {' '}(ร้อยละ {examResult.percentage})
            </div>
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
              ใช้เวลาทำ: {Math.floor(examResult.timeSpentSeconds / 60)} นาที {examResult.timeSpentSeconds % 60} วินาที
            </p>
          </div>

          <div className="result-actions">
            <button className="btn-primary" onClick={() => startExam(activeExamSet)}>
              <RotateCcw size={16} /> ทำชุดนี้อีกครั้ง
            </button>
            <button className="btn-secondary" onClick={() => setShowReview((prev) => !prev)}>
              <BookOpen size={16} /> {showReview ? 'ซ่อนเฉลยและคำอธิบาย' : 'ดูเฉลยและคำอธิบายข้อสอบ'}
            </button>
            <button className="btn-secondary" onClick={() => setActiveExamSet(null)}>
              กลับหน้ารายการข้อสอบ
            </button>
          </div>

          {/* รายการเฉลยและคำอธิบายเชิงการเรียนรู้ */}
          {showReview && (
            <div className="review-section">
              <h3 style={{ marginBottom: '1.25rem', color: '#1e293b' }}>
                เฉลยและข้อเสนอแนะเชิงการเรียนรู้ (รายข้อ)
              </h3>
              {activeExamSet.questions.map((q, idx) => {
                const studentAnswer = examResult.answers[q.id];
                const isCorrect = studentAnswer === q.answerIndex;
                const labels = ['ก', 'ข', 'ค', 'ง'];

                return (
                  <div key={q.id} className={`review-item ${isCorrect ? 'is-correct' : 'is-wrong'}`}>
                    <div className="review-q-num">
                      ข้อที่ {idx + 1} {isCorrect ? ' (ถูกต้อง)' : ' (ตอบผิด)'}
                    </div>
                    <div className="review-q-text">{q.text}</div>
                    <div className="review-choices">
                      {q.options.map((opt, optIdx) => {
                        const isStudentChoice = studentAnswer === optIdx;
                        const isCorrectChoice = q.answerIndex === optIdx;
                        let choiceClass = 'review-choice';
                        if (isCorrectChoice) choiceClass += ' correct-choice';
                        else if (isStudentChoice) choiceClass += ' student-choice';

                        return (
                          <div key={optIdx} className={choiceClass}>
                            <strong>{labels[optIdx] || optIdx + 1}.</strong> {opt}
                            {isStudentChoice && !isCorrectChoice && ' (คำตอบของคุณ)'}
                            {isCorrectChoice && ' (คำตอบที่ถูกต้อง)'}
                          </div>
                        );
                      })}
                    </div>
                    <div className="review-explanation">
                      <strong>คำอธิบาย:</strong> {q.explanation}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Quiz;
