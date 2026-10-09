import { useEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { GameInfo } from '../data/gamesCatalog';
import { gameMissions } from '../data/gameMissions';
import { gameChallenges } from '../data/gameChallenges';
import { useAuth } from '../context/AuthContext';
import {
  fetchGameReflectionsFromFirebase,
  loadStudentReflections,
  saveGameReflection,
} from '../services/gameReflectionService';
import {
  getGameJourneyProfile,
  getLearningStarCount,
  getReflectionPrompts,
} from '../utils/gameLearningPersonalization';
import './GameLearningJourney.css';

export default function GameLearningJourney({ game, children }: { game: GameInfo; children: ReactNode }) {
  const { user } = useAuth();
  const mission = gameMissions[game.id];
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);
  const [hint, setHint] = useState(false);
  const [answer, setAnswer] = useState<number | null>(null);
  const [reflection, setReflection] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [challengeMode, setChallengeMode] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [teacherGuideOpen, setTeacherGuideOpen] = useState(false);
  const [historyVersion, setHistoryVersion] = useState(0);
  const [reversed] = useState(() => Math.random() < 0.5);
  const reviewRef = useRef<HTMLElement>(null);
  const history = useMemo(() => {
    // Refresh local learning history after a new reflection is saved.
    void historyVersion;
    const identity = user?.id || user?.studentCode;
    return identity ? loadStudentReflections(identity) : [];
  }, [historyVersion, user?.id, user?.studentCode]);
  const profile = getGameJourneyProfile(history, game.id);
  const starCount = getLearningStarCount(complete, answer === 0, reviewed ? reflection : '');
  const reflectionPrompts = getReflectionPrompts(game.level, challengeMode);
  useEffect(() => {
    const identity = user?.id || user?.studentCode;
    if (!identity) return;
    let active = true;
    void fetchGameReflectionsFromFirebase(identity)
      .then(() => { if (active) setHistoryVersion((version) => version + 1); })
      .catch(() => { /* ใช้ประวัติในเครื่องต่อเมื่อออฟไลน์ */ });
    return () => { active = false; };
  }, [user?.id, user?.studentCode]);
  useEffect(() => {
    const onComplete = (event: Event) => {
      const id = (event as CustomEvent<{ gameId: string }>).detail.gameId;
      if (({ 'coding-maze': 'maze', 'bug-catcher': 'bug' }[id] || id) === game.id) setComplete(true);
    };
    window.addEventListener('game-learning-complete', onComplete);
    return () => window.removeEventListener('game-learning-complete', onComplete);
  }, [game.id]);
  if (!mission) return <>{children}</>;
  const choices = reversed ? [1, 0] : [0, 1];
  const activeChallenge = challengeMode ? gameChallenges[game.id] : mission.challenge;
  return <div className={`gbl-journey ${started ? 'gbl-playing' : 'gbl-briefing'}`} style={{ '--quest-color': game.color } as CSSProperties}>
    <section className={`gbl-mission ${started ? 'gbl-compact' : 'gbl-hero'}`} aria-label="ภารกิจการเรียนรู้">
      {!started ? <>
        <div className="gbl-art">
          <img src={`/media/reports/games/${game.id}.webp`} alt={`ภาพการเล่น ${game.title}`} />
          <Link to="/games" className="gbl-back">← เลือกเกมอื่น</Link>
          <span className="gbl-art-label">{game.emoji} {game.skill}</span>
        </div>
        <div className="gbl-briefing-content">
          <span className="gbl-label">ภารกิจของคุณ · {game.level}</span>
          <h1>{game.title}</h1>
          <p className="gbl-objective">{mission.objective}</p>
          <div className={`gbl-personal gbl-personal-${profile.stage}`}>
            <span aria-hidden="true">{profile.stage === 'first' ? '🌱' : profile.stage === 'growing' ? '🚀' : '🏆'}</span>
            <div><strong>{profile.label}</strong><p>{profile.message}</p></div>
            <button type="button" onClick={() => setChallengeMode(profile.recommendedMode === 'challenge')}>
              ใช้คำแนะนำ
            </button>
          </div>
          <div className="gbl-mode-options" role="group" aria-label="เลือกภารกิจ">
            <button aria-pressed={!challengeMode} onClick={() => setChallengeMode(false)}><span>🌱 ฝึกพื้นฐาน {profile.recommendedMode === 'foundation' && <em>แนะนำ</em>}</span><small>ลองทำทีละขั้น ใช้คำใบ้ได้</small></button>
            <button aria-pressed={challengeMode} onClick={() => setChallengeMode(true)}><span>🚀 ท้าทายตัวเอง {profile.recommendedMode === 'challenge' && <em>แนะนำ</em>}</span><small>ทดลองเพิ่ม แล้วอธิบายวิธีคิด</small></button>
          </div>
          <p className="gbl-challenge" aria-live="polite">{activeChallenge}</p>
          <div className="gbl-success-rule">
            <span>⭐ เป้าหมาย 3 ดาว</span>
            <small>จบรอบเกม · ตอบคำถาม · เล่าวิธีคิด</small>
          </div>
          <button
            type="button"
            className="gbl-teacher-toggle"
            aria-expanded={teacherGuideOpen}
            onClick={() => setTeacherGuideOpen(!teacherGuideOpen)}
          >
            🧑‍🏫 {teacherGuideOpen ? 'ซ่อนแผนสอน 10 นาที' : 'เปิดแผนสอน 10 นาที'}
          </button>
          {teacherGuideOpen && <div className="gbl-teacher-guide">
            <h2>ใช้เกมนี้สอนในหนึ่งช่วงกิจกรรม</h2>
            <ol>
              <li><strong>ก่อนเล่น 2 นาที</strong><span>ถามนำ: {mission.question}</span></li>
              <li><strong>ทดลอง 5 นาที</strong><span>ให้นักเรียนทำภารกิจ “{activeChallenge}” และครูถามว่าเห็นอะไรเปลี่ยนไป</span></li>
              <li><strong>สรุป 3 นาที</strong><span>ให้นักเรียนตอบคำถามและเล่าวิธีคิด ระบบจะเก็บเป็นหลักฐานให้ครู</span></li>
            </ol>
          </div>}
          <button className="gbl-launch" onClick={() => setStarted(true)}>รับภารกิจและเข้าเกม <span aria-hidden="true">→</span></button>
          <div className="gbl-route"><span>① ทดลองเล่น</span><span>② ไขคำถาม</span><span>③ เล่าวิธีคิด</span></div>
        </div>
      </> : <>
        <div className="gbl-strip">
          <span className="gbl-strip-icon" aria-hidden="true">{game.emoji}</span>
          <div><span className="gbl-label">{challengeMode ? 'ภารกิจท้าทาย' : 'ภารกิจฝึกพื้นฐาน'}</span><h2>{mission.objective}</h2></div>
          <div className="gbl-star-meter" aria-label={`ได้ ${starCount} จาก 3 ดาว`}>
            {[0, 1, 2].map((star) => <span key={star} className={star < starCount ? 'earned' : ''}>★</span>)}
          </div>
          <button aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'ย่อภารกิจ' : 'ดูภารกิจ / คำใบ้'}</button>
        <button onClick={() => { reviewRef.current?.scrollIntoView({ behavior: 'auto' }); reviewRef.current?.focus(); }}>
          {complete ? 'จบรอบแล้ว · ทบทวนสิ่งที่เรียนรู้' : 'ทบทวนหลังเล่น'}
        </button>
        </div>
        {expanded && <div className="gbl-expanded"><p>{activeChallenge}</p><button aria-expanded={hint} onClick={() => setHint(!hint)}>คำใบ้ภารกิจ</button>{hint && <p role="status">💡 {mission.hint}</p>}</div>}
      </>}
    </section>
    {started && <>
      {children}
      <section className="gbl-review" ref={reviewRef} tabIndex={-1} aria-label="ทบทวนหลังเล่น"
        onKeyDown={(event) => event.stopPropagation()} onKeyUp={(event) => event.stopPropagation()}>
        <span className="gbl-label">หลังเล่น · อธิบายและนำไปใช้</span>
        <div className="gbl-review-reward"><strong>{starCount}/3 ดาวการเรียนรู้</strong><span>{profile.nextStep}</span></div>
        <ol className="gbl-progress" aria-label="ความคืบหน้าการเรียนรู้">
          <li className={complete ? 'is-done' : ''}>{complete ? '✓' : '○'} จบรอบเกม</li>
          <li className={answer === 0 ? 'is-done' : ''}>{answer === 0 ? '✓' : '○'} ไขคำถาม</li>
          <li className={reviewed ? 'is-done' : ''}>{reviewed ? '✓' : '○'} เล่าวิธีคิด</li>
        </ol>
        <h2>ลองใช้สิ่งที่เรียนรู้</h2>
        <p>{mission.question}</p>
        <div className="gbl-actions">{choices.map((index) => <button key={index} aria-pressed={answer === index}
          onClick={() => { setAnswer(index); setReviewed(false); }}>{mission.options[index]}</button>)}</div>
        {answer !== null && <p role="status" className={answer === 0 ? 'gbl-success' : 'gbl-feedback'}>
          {answer === 0 ? 'เข้าใจหลักการแล้ว — ' : 'ลองคิดอีกครั้ง — '}{mission.explanation}
        </p>}
        {answer !== null && answer !== 0 && <div className="gbl-retry-coach">
          <strong>🧩 ลองใหม่แบบนักแก้ปัญหา</strong>
          <span>1. อ่านเป้าหมายอีกครั้ง</span><span>2. เทียบสิ่งที่เลือกกับสิ่งที่เกิดในเกม</span><span>3. เลือกคำตอบใหม่พร้อมบอกเหตุผล</span>
        </div>}
        <label htmlFor={`reflection-${game.id}`}>ระหว่างเล่น ลองทำอะไร ผลเป็นอย่างไร และรอบหน้าจะปรับอะไร?</label>
        <div className="gbl-reflection-prompts" aria-label="ตัวช่วยเล่าวิธีคิด">
          {reflectionPrompts.map((prompt) => <button key={prompt} type="button" onClick={() => {
            setReflection((current) => current.includes(prompt) ? current : `${current}${current.trim() ? ' · ' : ''}${prompt}`);
            setReviewed(false);
          }}>+ {prompt}</button>)}
        </div>
        <textarea id={`reflection-${game.id}`} value={reflection} maxLength={1000} rows={3}
          placeholder="เล่าสั้น ๆ หรืออธิบายกับครูแล้วให้ครูช่วยพิมพ์"
          onChange={(event) => { setReflection(event.target.value); setReviewed(false); }} />
        <div className="gbl-actions">
          <button disabled={answer !== 0 || !reflection.trim()} onClick={async () => {
            await saveGameReflection({
              studentId: user?.id || 'guest',
              studentCode: user?.studentCode || user?.id || 'guest',
              studentName: user?.name || 'ผู้ทดลองเล่น',
              classroom: user?.classroom || game.level || 'ทั่วไป',
              gameId: game.id,
              gameTitle: game.title,
              objective: mission.objective,
              challengeMode,
              challengeText: activeChallenge,
              questionAnswered: answer === 0,
              reflectionText: reflection.trim(),
              learningStars: 3,
              learnerStage: profile.stage,
              recommendedNextStep: profile.nextStep,
              attemptNumber: history.filter((item) => item.gameId === game.id).length + 1,
            });
            setReviewed(true);
            setHistoryVersion((version) => version + 1);
          }}>สรุปการฝึกครั้งนี้</button>
          <button onClick={() => { setAnswer(null); setReviewed(false); setComplete(false); window.scrollTo({ top: 0 }); }}>กลับไปฝึกและปรับวิธี</button>
        </div>
        {reviewed && <div role="status" className="gbl-celebration"><span aria-hidden="true">🏅</span><div><strong>ครบ 3 ดาว · นักทดลองผู้ไม่หยุดเรียนรู้</strong><p>ทบทวนแล้ว และบันทึกเป็นร่องรอยการเรียนรู้เรียบร้อย ✓ {profile.nextStep}</p><div className="gbl-earned-stars" aria-label="ได้รับสามดาว">★ ★ ★</div></div></div>}
        <small>บันทึกทบทวนถูกจัดเก็บเป็นหลักฐานการเรียนรู้เชิงประจักษ์ (Portfolio) ของนักเรียน ใช้พูดคุยกับครู ไม่เพิ่มคะแนนวิชาอัตโนมัติ</small>
      </section>
    </>}
  </div>;
}
