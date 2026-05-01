import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink, PlayCircle, CheckCircle2, XCircle, RotateCcw, Sparkles, Video, Gamepad2, FileText, Award } from 'lucide-react';
import { findGrade } from '../data/curriculum';
import { unitContent } from '../data/unitContent';
import { unitExtras } from '../data/unitExtras';
import { useAuth } from '../context/AuthContext';
import { saveQuizResult } from '../services/studentService';
import './UnitDetail.css';

const UnitDetail: React.FC = () => {
  const { user } = useAuth();
  const { gradeId, unitNo } = useParams();
  const navigate = useNavigate();
  const grade = findGrade(gradeId || '');
  const unitNumber = parseInt(unitNo || '0', 10);
  const unit = grade?.units?.find((u) => u.no === unitNumber);
  const slidesData = (gradeId && unitContent[gradeId]) || [];
  const slidesEntry = slidesData.find((u) => u.no === unitNumber);
  const slides = slidesEntry?.slides || [];
  const extras = (gradeId && unitExtras[gradeId]?.[unitNumber]) || {};

  const [slideIdx, setSlideIdx] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Reset states when changing unit
  useEffect(() => {
    setQuizAnswers({});
    setQuizSubmitted(false);
    setAttempts(0);
  }, [gradeId, unitNo]);

  if (!grade || !unit) {
    return (
      <div className="container section-padding">
        <h1>ไม่พบหน่วยการเรียนนี้</h1>
        <Link to="/courses">← กลับ</Link>
      </div>
    );
  }

  const totalSlides = slidesEntry?.slideImages?.length || slides.length;
  const currentSlide = slides[slideIdx] || '';
  const currentSlideImage = slidesEntry?.slideImages?.[slideIdx];
  const progress = totalSlides > 0 ? ((slideIdx + 1) / totalSlides) * 100 : 0;

  // Parse a slide string into a title + body bullets
  const parseSlide = (text: string) => {
    const cleaned = text.replace(/\s+/g, ' ').trim();

    // Pick a thematic emoji based on keywords
    const emojiFor = (s: string): string => {
      const map: [RegExp, string][] = [
        [/ตัวชี้วัด|หน่วยการเรียน/, '🎯'],
        [/คีย์บอร์ด|แป้น/, '⌨️'],
        [/เมาส์|Mouse/i, '🖱️'],
        [/เปิด.?ปิด|Power/i, '🔌'],
        [/Word/i, '📝'],
        [/Paint/i, '🎨'],
        [/PowerPoint|เพาเวอร์/i, '📊'],
        [/Excel|เอ็กเซล/i, '📈'],
        [/Save|บันทึก/i, '💾'],
        [/Print|พิมพ์/i, '🖨️'],
        [/VDO|วิดีโอ|Video/i, '🎬'],
        [/อันตราย|ปลอดภัย|ระวัง/i, '⚠️'],
        [/รหัสผ่าน|Password/i, '🔐'],
        [/อินเทอร์เน็ต|Internet/i, '🌐'],
        [/อัลกอริทึม|Algorithm/i, '🧠'],
        [/โปรแกรม|Code|เขียน/i, '💻'],
        [/ลองผิดลองถูก/i, '🔄'],
        [/เปรียบเทียบ/i, '⚖️'],
        [/ข้อมูล|Data/i, '📊'],
        [/Scratch/i, '🐱'],
        [/Flowchart|ผังงาน/i, '📐'],
        [/ค้นหา|Search/i, '🔎'],
        [/พ\.ร\.บ\.|กฎหมาย/, '⚖️'],
        [/พลเมือง/i, '👥'],
        [/นำเสนอ|รายงาน/i, '📋'],
      ];
      for (const [re, e] of map) if (re.test(s)) return e;
      return '📌';
    };

    // Try to split into title + bullets
    let title = '';
    let body = cleaned;

    const m1 = cleaned.match(/^(หน่วยการเรียน[^]+?ตัวชี้วัด\s*)/);
    if (m1) {
      title = 'ตัวชี้วัด';
      body = cleaned.slice(m1[0].length).trim();
    } else {
      const parts = cleaned.split(/\s{2,}/);
      if (parts.length > 1) {
        title = parts[0];
        body = parts.slice(1).join(' ');
      } else {
        const idx = cleaned.search(/[.!?]\s|(?:\sคือ\s)|(?:\sได้แก่\s)/);
        if (idx > 0 && idx < 80) {
          title = cleaned.slice(0, idx).trim();
          body = cleaned.slice(idx + 1).trim();
        } else {
          const words = cleaned.split(' ');
          let t: string[] = [];
          let count = 0;
          for (const w of words) {
            count += w.length + 1;
            if (count > 45) break;
            t.push(w);
          }
          title = t.join(' ') || cleaned.slice(0, 45);
          body = cleaned.slice(title.length).trim();
        }
      }
    }

    const bullets: string[] = [];
    const numRe = /\s(\d+)[\.\)]\s/g;
    if (numRe.test(body)) {
      const items = body.split(/\s\d+[\.\)]\s/).filter((s) => s.trim().length > 2);
      bullets.push(...items.map((s) => s.trim()));
    } else if (body.includes(' • ')) {
      bullets.push(...body.split(' • ').filter((s) => s.trim().length > 2));
    } else {
      const segs = body.split(/(?<=[ฯ\?])\s|(?:\sซึ่ง\s)/).filter((s) => s.trim().length > 6);
      if (segs.length >= 2 && segs.length <= 8) {
        bullets.push(...segs.map((s) => s.trim()));
      } else {
        bullets.push(body);
      }
    }

    return { title, bullets, emoji: emojiFor(cleaned) };
  };

  const parsed = currentSlide ? parseSlide(currentSlide) : { title: '', bullets: [], emoji: '✨' };

  const score = extras.quiz
    ? extras.quiz.reduce((acc, q, i) => (quizAnswers[i] === q.answer ? acc + 1 : acc), 0)
    : 0;
  const maxScore = extras.quiz?.length || 0;


  return (
    <div className="unit-detail container section-padding">
      <button className="btn-back" onClick={() => navigate('/courses')}>
        <ChevronLeft size={20} /> กลับไปที่คอร์สเรียน
      </button>

      <header className="unit-hero">
        <div className="hero-bg-shapes">
          <div className="shape s1"></div>
          <div className="shape s2"></div>
          <div className="shape s3"></div>
        </div>
        <div className="unit-hero-emoji">{grade.emoji}</div>
        <div className="unit-hero-text">
          <span className="badge-light">{grade.title} · หน่วยที่ {unit.no}</span>
          <h1>{unit.title}</h1>
          {extras.intro && <p className="unit-intro">{extras.intro}</p>}
          <div className="unit-meta">
            {totalSlides > 0 && <span><FileText size={16} /> {totalSlides} สไลด์</span>}
            {extras.videos && <span><Video size={16} /> {extras.videos.length} วิดีโอ</span>}
            {extras.quiz && <span><Award size={16} /> {extras.quiz.length} ข้อสอบ</span>}
            {extras.fun && <span><Gamepad2 size={16} /> {extras.fun.length} กิจกรรม</span>}
          </div>
        </div>
      </header>

      {unit.topics && (
        <section className="unit-section">
          <h2><Sparkles size={22} /> สิ่งที่นักเรียนจะได้เรียน</h2>
          <div className="topics-grid">
            {unit.topics.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="topic-pill"
              >
                <span className="topic-num">{i + 1}</span>
                <span>{t}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {totalSlides > 0 && (
        <section className="unit-section">
          <h2><FileText size={22} /> เนื้อหาบทเรียน</h2>
          <div className="slide-viewer glass">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="slide-counter">
              สไลด์ {slideIdx + 1} จาก {totalSlides}
            </div>
            <AnimatePresence mode="wait">
              {currentSlideImage ? (
                <motion.div
                  key={`img-${slideIdx}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="slide-content-image-wrapper"
                >
                  <img src={currentSlideImage} alt={`Slide ${slideIdx + 1}`} className="slide-image" />
                </motion.div>
              ) : (
                <motion.div
                  key={slideIdx}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="slide-content-big"
                >
                  <div className="slide-emoji-big">{parsed.emoji}</div>
                  <h3 className="slide-title">{parsed.title}</h3>
                  {parsed.bullets.length > 1 ? (
                    <ul className="slide-bullets">
                      {parsed.bullets.map((b, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + i * 0.07 }}
                        >
                          {b}
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <p className="slide-body">{parsed.bullets[0]}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            <div className="slide-controls">
              <button
                disabled={slideIdx === 0}
                onClick={() => setSlideIdx((i) => Math.max(0, i - 1))}
                className="slide-btn"
              >
                <ChevronLeft size={18} /> ก่อนหน้า
              </button>
              <div className="slide-dots">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button
                    key={i}
                    className={`dot ${i === slideIdx ? 'active' : ''}`}
                    onClick={() => setSlideIdx(i)}
                  />
                ))}
              </div>
              <button
                disabled={slideIdx === totalSlides - 1}
                onClick={() => setSlideIdx((i) => Math.min(totalSlides - 1, i + 1))}
                className="slide-btn"
              >
                ถัดไป <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </section>
      )}

      {extras.videos && extras.videos.length > 0 && (
        <section className="unit-section">
          <h2><Video size={22} /> คลิปวิดีโอประกอบ</h2>
          <div className="video-grid">
            {extras.videos.map((v, i) => (
              <a
                key={i}
                href={`https://www.youtube.com/results?search_query=${encodeURIComponent(v.query)}`}
                target="_blank"
                rel="noreferrer"
                className="video-card"
              >
                <div className="video-thumb">
                  <PlayCircle size={48} />
                </div>
                <div className="video-info">
                  <h4>{v.title}</h4>
                  <span>คลิกเพื่อค้นหาบน YouTube ↗</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {extras.fun && extras.fun.length > 0 && (
        <section className="unit-section">
          <h2><Gamepad2 size={22} /> กิจกรรมสนุก & เกมเสริม</h2>
          <div className="fun-grid">
            {extras.fun.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noreferrer" className="fun-card">
                <div className="fun-emoji">{f.emoji}</div>
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
                <span className="fun-go">เริ่มเลย ↗</span>
              </a>
            ))}
          </div>
        </section>
      )}

      {extras.articles && extras.articles.length > 0 && (
        <section className="unit-section">
          <h2>📚 บทความอ่านเพิ่มเติม</h2>
          {unit.indicators && unit.indicators.length > 0 && (
            <div className="article-indicator-row">
              <span className="ai-label">เนื้อหาเสริมสำหรับตัวชี้วัด:</span>
              {unit.indicators.map((ii) => (
                <span key={ii} className="ind-badge">{grade.indicators[ii].code}</span>
              ))}
            </div>
          )}
          <div className="article-list">
            {extras.articles.map((a, i) => (
              <a key={i} href={a.url} target="_blank" rel="noreferrer" className="article-card">
                <div className="article-icon">📖</div>
                <div className="article-info">
                  <h4>{a.title}</h4>
                  {a.desc && <p>{a.desc}</p>}
                  <span className="article-source">ที่มา: {a.source} ↗</span>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {extras.quiz && extras.quiz.length > 0 && (
        <section className="unit-section quiz-section">
          <h2><Award size={22} /> แบบทดสอบหลังเรียน</h2>
          <div className="quiz-card glass">
            {extras.quiz.map((q, qi) => (
              <div key={qi} className="quiz-item">
                <h4>ข้อ {qi + 1}: {q.q}</h4>
                <div className="quiz-options">
                  {q.options.map((opt, oi) => {
                    const isPicked = quizAnswers[qi] === oi;
                    const isCorrect = q.answer === oi;
                    let cls = 'opt';
                    if (quizSubmitted) {
                      if (isCorrect) cls += ' correct';
                      else if (isPicked && !isCorrect) cls += ' wrong';
                    } else if (isPicked) cls += ' picked';
                    return (
                      <button
                        key={oi}
                        className={cls}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers((p) => ({ ...p, [qi]: oi }))}
                      >
                        {quizSubmitted && isCorrect && <CheckCircle2 size={16} />}
                        {quizSubmitted && isPicked && !isCorrect && <XCircle size={16} />}
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {quizSubmitted && q.explain && (
                  <div className="quiz-explain">💡 {q.explain}</div>
                )}
              </div>
            ))}
            <div className="quiz-actions">
              {!quizSubmitted ? (
                <button
                  className="btn-primary"
                  disabled={Object.keys(quizAnswers).length < extras.quiz.length || attempts >= 2}
                  onClick={async () => {
                    setQuizSubmitted(true);
                    setAttempts(prev => prev + 1);
                    
                    // บันทึกคะแนนลง Firebase
                    if (user) {
                      await saveQuizResult(
                        user.id,
                        unitNo ? parseInt(unitNo) : 1,
                        score,
                        maxScore
                      );
                    }
                  }}
                >
                  ส่งคำตอบ
                </button>
              ) : (
                <>
                  <div className="quiz-score">
                    คะแนน: <strong>{score} / {maxScore}</strong>
                    {score === maxScore && ' 🎉 เก่งมาก!'}
                    {score >= maxScore * 0.7 && score < maxScore && ' 👍 ดีมาก'}
                    {score < maxScore * 0.7 && ' 💪 ลองอีกครั้งนะ'}
                  </div>
                  <button 
                    className="btn-secondary" 
                    onClick={() => {
                      setQuizAnswers({});
                      setQuizSubmitted(false);
                    }}
                    disabled={attempts >= 2}
                  >
                    <RotateCcw size={16} /> {attempts >= 2 ? 'หมดสิทธิ์ทำใหม่' : 'ทำใหม่'}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      <section className="unit-section">
        <div className="link-row">
          <a href={grade.courseUrl} target="_blank" rel="noreferrer" className="btn-primary unit-cta">
            เปิดห้องเรียน {grade.title} <ExternalLink size={16} />
          </a>
          <Link to={`/curriculum/${grade.id}/0`} className="btn-secondary unit-cta">
            ดูตัวชี้วัดรายวิชา
          </Link>
        </div>
      </section>

      <nav className="unit-nav">
        {unit.no > 1 && (
          <Link to={`/curriculum/${grade.id}/unit/${unit.no - 1}`} className="ind-nav-btn">
            ← หน่วยที่ {unit.no - 1}
          </Link>
        )}
        {grade.units && unit.no < grade.units.length && (
          <Link to={`/curriculum/${grade.id}/unit/${unit.no + 1}`} className="ind-nav-btn next">
            หน่วยที่ {unit.no + 1} →
          </Link>
        )}
      </nav>
    </div>
  );
};

export default UnitDetail;
