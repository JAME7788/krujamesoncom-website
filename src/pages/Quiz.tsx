import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Timer, Award } from 'lucide-react';
import './Quiz.css';

const Quiz: React.FC = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const questions = [
    {
      text: "ข้อใดคือความหมายของ 'วิทยาการคำนวณ'?",
      options: [
        "การคำนวณเลขคณิตศาสตร์ชั้นสูง",
        "การแก้ปัญหาอย่างเป็นขั้นตอนและเป็นระบบ",
        "การซ่อมแซมคอมพิวเตอร์ที่เสีย",
        "การใช้อินเทอร์เน็ตเพื่อความบันเทิง"
      ],
      answer: 1
    },
    {
      text: "ในโปรแกรม Scratch 'Block สีเหลือง' มักใช้สำหรับอะไร?",
      options: [
        "การเคลื่อนที่ (Motion)",
        "การแสดงเสียง (Sound)",
        "เหตุการณ์ (Events) เช่น เมื่อคลิกธงเขียว",
        "การวาดรูป (Pen)"
      ],
      answer: 2
    },
    {
      text: "การเขียนโปรแกรมแบบ Unplugged หมายถึงอะไร?",
      options: [
        "การเขียนโปรแกรมโดยไม่ใช้คอมพิวเตอร์",
        "การถอดปลั๊กคอมพิวเตอร์ขณะใช้งาน",
        "การเขียนโปรแกรมด้วยภาษา Python",
        "การใช้หุ่นยนต์ราคาแพง"
      ],
      answer: 0
    }
  ];

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
