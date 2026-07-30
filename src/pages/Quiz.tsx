import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Timer, Award } from 'lucide-react';
import './Quiz.css';
import { useAuth } from '../context/AuthContext';
import { saveQuizAttempt } from '../services/progressService';
import { syncStudentGradesFromProgress } from '../services/gameProgressService';
import { getDefaultProgressGradeIdForClassroom } from '../services/courseAccessService';
import { recordLearningEvidence } from '../services/learningEvidenceService';
import { getLinkedUnitsForSubject } from '../services/gradeService';
import { isInClassTime, loadSchedule } from '../data/schedule';
import { loadRoster } from '../services/rosterService';

const questions = [
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

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (!showScore || !user || savedRef.current) return;
    const gradeId = getDefaultProgressGradeIdForClassroom(user.classroom);
    if (!gradeId) return;
    savedRef.current = true;
    void saveQuizAttempt(user.id, gradeId, 1, score, questions.length, {})
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
          detail: `ตอบถูก ${score} จาก ${questions.length} ข้อ`,
          score,
          maxScore: questions.length,
          inClass: isInClassTime(Date.now(), user.classroom, loadSchedule()),
          occurredAt: Date.now(),
          dedupKey: `general-${new Date().toISOString().slice(0, 10)}`,
        });
      });
  }, [score, showScore, user]);

  const handleAnswerClick = (index: number) => {
    setSelectedAnswer(index);
    if (index === questions[currentQuestion].answer) {
      setScore(score + 1);
    }
    
    setTimeout(() => {
      const nextQuestion = currentQuestion + 1;
      if (nextQuestion < questions.length) {
        setCurrentQuestion(nextQuestion);
        setSelectedAnswer(null);
      } else {
        setShowScore(true);
      }
    }, 800);
  };

  return (
    <div className="quiz-container container section-padding">
      <AnimatePresence mode='wait'>
        {showScore ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="score-card glass"
          >
            <Award size={80} className="award-icon" />
            <h2>ทำแบบทดสอบเสร็จแล้ว!</h2>
            <p className="score-text">คุณได้คะแนน</p>
            <div className="score-badge">{score} / {questions.length}</div>
            <p className="feedback">
              {score === questions.length ? "ยอดเยี่ยมมาก! คุณเข้าใจบทเรียนนี้อย่างถ่องแท้" : "เก่งมาก! ลองทบทวนส่วนที่ผิดเพื่อคะแนนที่ดียิ่งขึ้น"}
            </p>
            <button className="btn-primary" onClick={() => navigate('/dashboard')}>
              กลับไปยังแดชบอร์ด
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="question-card glass"
          >
            <div className="quiz-header">
              <span className="q-count">คำถามที่ {currentQuestion + 1}/{questions.length}</span>
              <div className="q-timer"><Timer size={18} /> 05:00</div>
            </div>
            
            <div className="progress-bar">
               <div className="progress-fill" style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}></div>
            </div>

            <h2 className="q-text">{questions[currentQuestion].text}</h2>

            <div className="options-grid">
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  className={`option-btn ${selectedAnswer === index ? (index === questions[currentQuestion].answer ? 'correct' : 'wrong') : ''}`}
                  onClick={() => selectedAnswer === null && handleAnswerClick(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className="opt-label">{String.fromCharCode(65 + index)}</span>
                  <span className="opt-text">{option}</span>
                  {selectedAnswer === index && (
                    index === questions[currentQuestion].answer ? <CheckCircle2 size={24} /> : <XCircle size={24} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Quiz;
