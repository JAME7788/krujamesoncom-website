import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type { GameInfo } from '../data/gamesCatalog';
import { gameMissions } from '../data/gameMissions';
import { gameChallenges } from '../data/gameChallenges';
import { useAuth } from '../context/AuthContext';
import { saveGameReflection } from '../services/gameReflectionService';
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
  const [reversed] = useState(() => Math.random() < 0.5);
  const reviewRef = useRef<HTMLElement>(null);
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
          <div className="gbl-mode-options" role="group" aria-label="เลือกภารกิจ">
            <button aria-pressed={!challengeMode} onClick={() => setChallengeMode(false)}><span>🌱 ฝึกพื้นฐาน</span><small>ลองทำทีละขั้น ใช้คำใบ้ได้</small></button>
            <button aria-pressed={challengeMode} onClick={() => setChallengeMode(true)}><span>🚀 ท้าทายตัวเอง</span><small>ทดลองเพิ่ม แล้วอธิบายวิธีคิด</small></button>
          </div>
          <p className="gbl-challenge" aria-live="polite">{activeChallenge}</p>
          <small>ตัวเลือกนี้เปลี่ยนภารกิจการเรียนรู้ ระดับความยากของเกมเลือกในเกม</small>
          <button className="gbl-launch" onClick={() => setStarted(true)}>รับภารกิจและเข้าเกม <span aria-hidden="true">→</span></button>
          <div className="gbl-route"><span>① ทดลองเล่น</span><span>② ไขคำถาม</span><span>③ เล่าวิธีคิด</span></div>
        </div>
      </> : <>
        <div className="gbl-strip">
          <span className="gbl-strip-icon" aria-hidden="true">{game.emoji}</span>
          <div><span className="gbl-label">{challengeMode ? 'ภารกิจท้าทาย' : 'ภารกิจฝึกพื้นฐาน'}</span><h2>{mission.objective}</h2></div>
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
        <label htmlFor={`reflection-${game.id}`}>ระหว่างเล่น ลองทำอะไร ผลเป็นอย่างไร และรอบหน้าจะปรับอะไร?</label>
        <textarea id={`reflection-${game.id}`} value={reflection} maxLength={1000} rows={3}
          placeholder="เล่าสั้น ๆ หรืออธิบายกับครูแล้วให้ครูช่วยพิมพ์"
          onChange={(event) => { setReflection(event.target.value); setReviewed(false); }} />
        <div className="gbl-actions">
          <button disabled={answer !== 0 || !reflection.trim()} onClick={() => {
            setReviewed(true);
            void saveGameReflection({
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
            });
          }}>สรุปการฝึกครั้งนี้</button>
          <button onClick={() => { setAnswer(null); setReviewed(false); setComplete(false); window.scrollTo({ top: 0 }); }}>กลับไปฝึกและปรับวิธี</button>
        </div>
        {reviewed && <div role="status" className="gbl-celebration"><span aria-hidden="true">🏅</span><div><strong>นักทดลองผู้ไม่หยุดเรียนรู้</strong><p>ทบทวนแล้ว และบันทึกเป็นร่องรอยการเรียนรู้เรียบร้อย ✓ นำวิธีที่อธิบายไปใช้ในรอบถัดไป</p></div></div>}
        <small>บันทึกทบทวนถูกจัดเก็บเป็นหลักฐานการเรียนรู้เชิงประจักษ์ (Portfolio) ของนักเรียน ใช้พูดคุยกับครู ไม่เพิ่มคะแนนวิชาอัตโนมัติ</small>
      </section>
    </>}
  </div>;
}
