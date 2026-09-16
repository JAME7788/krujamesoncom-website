import React, { useState, useEffect, useEffectEvent, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  Trophy,
  Timer,
  RotateCcw,
  Play,
  User,
  Zap,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useGameTimers } from '../../hooks/useGameTimers';
import { sfxCorrect, sfxWrong, sfxCoin, sfxBuy } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './StroopColorGame.css';

interface ColorDef {
  en: string;
  th: string;
  hex: string;
}

const COLORS: ColorDef[] = [
  { en: 'RED', th: 'สีแดง', hex: '#ef4444' },
  { en: 'BLUE', th: 'สีน้ำเงิน', hex: '#38bdf8' },
  { en: 'GREEN', th: 'สีเขียว', hex: '#22c55e' },
  { en: 'YELLOW', th: 'สีเหลือง', hex: '#facc15' },
  { en: 'PURPLE', th: 'สีม่วง', hex: '#c084fc' },
  { en: 'ORANGE', th: 'สีส้ม', hex: '#fb923c' },
  { en: 'PINK', th: 'สีชมพู', hex: '#f472b6' },
  { en: 'WHITE', th: 'สีขาว', hex: '#f8fafc' },
];

interface QuestionStage1 {
  word: string;
  fontColor: string;
  correctAnswer: string;
  choices: string[];
}

interface QuestionStage2 {
  word1: string;
  fontColor1: string;
  word2: string;
  fontColor2: string;
  correctAnswer: string;
  choices: string[];
}

interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  timeSpent: number;
  date: string;
}

const LEADERBOARD_KEY = 'kj_stroop_leaderboard';

const shuffle = <T,>(arr: T[]): T[] => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

// Generate 10 questions for Stage 1
const generateStage1Questions = (): QuestionStage1[] => {
  const questions: QuestionStage1[] = [];
  for (let i = 0; i < 10; i++) {
    const targetIndex = Math.floor(Math.random() * COLORS.length);
    const target = COLORS[targetIndex];

    // Pick font color different from target
    const fontColors = COLORS.filter((c) => c.en !== target.en);
    const fontColor = fontColors[Math.floor(Math.random() * fontColors.length)].hex;

    // Pick 3 distinct wrong choices
    const distractors = COLORS.filter((c) => c.en !== target.en);
    const shuffledDistractors = shuffle(distractors).slice(0, 3);
    const choices = shuffle([target.th, ...shuffledDistractors.map((d) => d.th)]);

    questions.push({
      word: target.en,
      fontColor,
      correctAnswer: target.th,
      choices,
    });
  }
  return questions;
};

// Generate 10 questions for Stage 2 (Two colors paired)
const generateStage2Questions = (): QuestionStage2[] => {
  const questions: QuestionStage2[] = [];
  for (let i = 0; i < 10; i++) {
    const shuffled = shuffle(COLORS);
    const target1 = shuffled[0];
    const target2 = shuffled[1];

    // Pick font color for word 1 (different from target1)
    const fonts1 = COLORS.filter((c) => c.en !== target1.en);
    const fontColor1 = fonts1[Math.floor(Math.random() * fonts1.length)].hex;

    // Pick font color for word 2 (different from target2)
    const fonts2 = COLORS.filter((c) => c.en !== target2.en);
    const fontColor2 = fonts2[Math.floor(Math.random() * fonts2.length)].hex;

    const correctAnswer = `${target1.th} และ ${target2.th}`;

    // Create 3 distractors
    const distractorPool: string[] = [
      `${target2.th} และ ${target1.th}`,
      `${target1.th} และ ${shuffled[2].th}`,
      `${shuffled[2].th} และ ${target2.th}`,
      `${shuffled[2].th} และ ${shuffled[3].th}`,
    ];
    const uniqueDistractors = shuffle(
      distractorPool.filter((d) => d !== correctAnswer)
    ).slice(0, 3);

    const choices = shuffle([correctAnswer, ...uniqueDistractors]);

    questions.push({
      word1: target1.en,
      fontColor1,
      word2: target2.en,
      fontColor2,
      correctAnswer,
      choices,
    });
  }
  return questions;
};

export const StroopColorGame: React.FC = () => {
  const [playerName, setPlayerName] = useState<string>('');
  const [gameState, setGameState] = useState<'intro' | 'stage1' | 'stage1_interstitial' | 'stage2' | 'summary'>('intro');
  const timers = useGameTimers(gameState);
  const completed = useRef(false);
  const answerLock = useRef(false);

  // Stage 1 & Stage 2 Questions
  const [stage1Questions, setStage1Questions] = useState<QuestionStage1[]>([]);
  const [stage2Questions, setStage2Questions] = useState<QuestionStage2[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);

  // Scores
  const [stage1Score, setStage1Score] = useState<number>(0);
  const [stage2Score, setStage2Score] = useState<number>(0);

  // Timers (60 seconds countdown per stage)
  const [timeLeft, setTimeLeft] = useState<number>(60);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Choice selection state for feedback
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(LEADERBOARD_KEY) || '[]');
      return Array.isArray(stored) ? stored.filter((entry): entry is LeaderboardEntry =>
        !!entry && typeof entry.name === 'string' && Number.isFinite(entry.score) && Number.isFinite(entry.timeSpent)) : [];
    } catch {
      return [];
    }
  });

  // Hook for logging student achievement & K/P progress
  const recordGame = useGameProgress('stroop-color', 'สีลวงสมอง (Stroop Color Reflex)');

  // Save score to leaderboard
  const saveToLeaderboard = useCallback((finalScore: number, finalSeconds: number) => {
    const name = playerName.trim() || 'ผู้เล่นนิรนาม';
    const entry: LeaderboardEntry = {
      id: Date.now().toString(),
      name,
      score: finalScore,
      maxScore: 40,
      timeSpent: finalSeconds,
      date: new Date().toLocaleDateString('th-TH'),
    };

    setLeaderboard((prev) => {
      const updated = [...prev, entry]
        .sort((a, b) => b.score - a.score || a.timeSpent - b.timeSpent)
        .slice(0, 10);
      try {
        localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, [playerName]);

  // Stop Timer
  const clearCurrentTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // End stage 1
  const finishStage1 = useCallback(() => {
    timers.clear();
    clearCurrentTimer();
    sfxBuy();
    setGameState('stage1_interstitial');
  }, [timers]);

  // End stage 2 & game
  const finishGame = useCallback((finalS1: number, finalS2: number, timeSpent: number) => {
    if (completed.current) return;
    completed.current = true;
    timers.clear();
    clearCurrentTimer();
    const totalScore = finalS1 + finalS2;
    sfxCoin();
    saveToLeaderboard(totalScore, timeSpent);
    recordGame(totalScore, undefined, 40);
    setGameState('summary');
  }, [recordGame, saveToLeaderboard, timers]);

  // Start Stage 1
  const startStage1 = () => {
    timers.clear();
    completed.current = false;
    answerLock.current = false;
    const q1 = generateStage1Questions();
    setStage1Questions(q1);
    setCurrentQIndex(0);
    setStage1Score(0);
    setStage2Score(0);
    setTimeLeft(60);
    setTotalTimeSpent(0);
    setSelectedChoice(null);
    setIsAnswerLocked(false);
    setGameState('stage1');
  };

  // Start Stage 2
  const startStage2 = () => {
    timers.clear();
    answerLock.current = false;
    const q2 = generateStage2Questions();
    setStage2Questions(q2);
    setCurrentQIndex(0);
    setStage2Score(0);
    setTimeLeft(60);
    setSelectedChoice(null);
    setIsAnswerLocked(false);
    setGameState('stage2');
  };

  const tick = useEffectEvent(() => {
    const elapsed = totalTimeSpent + 1;
    setTimeLeft(Math.max(0, timeLeft - 1));
    setTotalTimeSpent(elapsed);
    if (timeLeft <= 1) {
      if (gameState === 'stage1') finishStage1();
      else finishGame(stage1Score, stage2Score, elapsed);
    }
  });

  // Keep the countdown independent from answer/feedback renders.
  useEffect(() => {
    if (gameState === 'stage1' || gameState === 'stage2') {
      timerRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      clearCurrentTimer();
    };
  }, [gameState]);

  // Handle choice in Stage 1
  const handleStage1Answer = (choice: string) => {
    if (answerLock.current || gameState !== 'stage1') return;
    answerLock.current = true;
    setIsAnswerLocked(true);
    setSelectedChoice(choice);

    const currentQ = stage1Questions[currentQIndex];
    const isCorrect = choice === currentQ.correctAnswer;

    if (isCorrect) {
      sfxCorrect();
      setStage1Score((prev) => prev + 2);
    } else {
      sfxWrong();
    }

    timers.schedule(() => {
      setSelectedChoice(null);
      answerLock.current = false;
      setIsAnswerLocked(false);
      if (currentQIndex + 1 < stage1Questions.length) {
        setCurrentQIndex((prev) => prev + 1);
      } else {
        finishStage1();
      }
    }, 450);
  };

  // Handle choice in Stage 2
  const handleStage2Answer = (choice: string) => {
    if (answerLock.current || gameState !== 'stage2') return;
    answerLock.current = true;
    setIsAnswerLocked(true);
    setSelectedChoice(choice);

    const currentQ = stage2Questions[currentQIndex];
    const isCorrect = choice === currentQ.correctAnswer;

    let newS2 = stage2Score;
    if (isCorrect) {
      sfxCorrect();
      newS2 = stage2Score + 2;
      setStage2Score(newS2);
    } else {
      sfxWrong();
    }

    timers.schedule(() => {
      setSelectedChoice(null);
      answerLock.current = false;
      setIsAnswerLocked(false);
      if (currentQIndex + 1 < stage2Questions.length) {
        setCurrentQIndex((prev) => prev + 1);
      } else {
        finishGame(stage1Score, newS2, totalTimeSpent);
      }
    }, 450);
  };

  const currentScore = stage1Score + stage2Score;

  return (
    <div className="stroop-container">
      {/* Header */}
      <div className="stroop-header">
        <Link to="/games" className="stroop-back-btn">
          <ChevronLeft size={18} />
          กลับคลังเกม
        </Link>
        <div className="stroop-title-wrap">
          <h1 className="stroop-title">🧠 สีลวงสมอง (Stroop Color Reflex)</h1>
          <p className="stroop-subtitle">ฝึกสมาธิ ไหวพริบ และการประมวลผลข้อมูลของสมอง (Stroop Effect)</p>
        </div>
        <div style={{ width: 90 }} />
      </div>

      {/* HUD Bar (Visible during gameplay) */}
      {(gameState === 'stage1' || gameState === 'stage2') && (
        <div className="stroop-hud">
          <div className="stroop-hud-card">
            <span className="stroop-hud-label">ด่านที่</span>
            <span className="stroop-hud-val pink">
              {gameState === 'stage1' ? '1 / 2 (คำเดี่ยว)' : '2 / 2 (คำคู่)'}
            </span>
          </div>
          <div className="stroop-hud-card">
            <span className="stroop-hud-label">ข้อที่</span>
            <span className="stroop-hud-val cyan">{currentQIndex + 1} / 10</span>
          </div>
          <div className="stroop-hud-card">
            <span className="stroop-hud-label">เวลาที่เหลือ</span>
            <span className={`stroop-hud-val ${timeLeft <= 10 ? 'time-alert' : ''}`}>
              <Timer size={16} style={{ display: 'inline', marginRight: 4 }} />
              {timeLeft} วินาที
            </span>
          </div>
          <div className="stroop-hud-card">
            <span className="stroop-hud-label">คะแนนรวม</span>
            <span className="stroop-hud-val gold">{currentScore} / 40</span>
          </div>
        </div>
      )}

      {/* Main Game Card */}
      <div className="stroop-card-wrapper">
        {/* Timer Bar */}
        {(gameState === 'stage1' || gameState === 'stage2') && (
          <div className="stroop-timer-bar-wrap">
            <div
              className="stroop-timer-bar-fill"
              style={{ width: `${(timeLeft / 60) * 100}%` }}
            />
          </div>
        )}

        {/* 1. Intro Screen */}
        {gameState === 'intro' && (
          <div className="stroop-auth-box">
            <div className="stroop-auth-icon">🧠🎨</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: '#f8fafc' }}>
              ทดสอบไหวพริบสีลวงสมอง
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.5, margin: '4px 0 16px 0' }}>
              อ่านตัวอักษรภาษาอังกฤษแล้ว <strong>ตอบความหมายเป็นภาษาไทย</strong> ให้ถูกต้อง
              <br />
              <span style={{ color: '#f43f5e', fontWeight: 600 }}>
                ระวังอย่าให้ "สีของตัวอักษร" มาหลอกสายตาคุณ!
              </span>
            </p>

            <label htmlFor="stroop-name" style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>
              <User size={14} style={{ display: 'inline', marginRight: 6 }} />
              ชื่อผู้เข้าแข่งขัน:
            </label>
            <input
              id="stroop-name"
              type="text"
              className="stroop-auth-input"
              placeholder="กรอกชื่อ-นามสกุล หรือชื่อเล่นนักเรียน..."
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={25}
            />

            <button
              className="stroop-btn-primary"
              onClick={startStage1}
              style={{ fontSize: '1.05rem', padding: '14px 36px' }}
            >
              <Play size={18} />
              เริ่มประลองสมอง (Start Game)
            </button>

            {/* Top 10 Leaderboard Preview */}
            <div className="stroop-lb-card">
              <div className="stroop-lb-header">
                <span>
                  <Trophy size={16} style={{ display: 'inline', marginRight: 6 }} />
                  ตารางคะแนนสูงสุด 10 อันดับแรก
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Top 10 Reflex</span>
              </div>
              {leaderboard.length === 0 ? (
                <div style={{ color: '#64748b', fontSize: '0.85rem', padding: '12px 0' }}>
                  ยังไม่มีสถิติ เป็นคนแรกที่พิชิตเกมนี้!
                </div>
              ) : (
                leaderboard.slice(0, 5).map((entry, idx) => (
                  <div key={entry.id || idx} className="stroop-lb-row">
                    <span className="stroop-lb-rank">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span className="stroop-lb-name">{entry.name}</span>
                    <span className="stroop-lb-score">{entry.score} คะแนน</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 2. Stage 1: Single Color (10 questions, 2 pts each, 60s) */}
        {gameState === 'stage1' && stage1Questions[currentQIndex] && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="stroop-signboard">
              <div
                className="stroop-target-word"
                style={{ color: stage1Questions[currentQIndex].fontColor }}
              >
                {stage1Questions[currentQIndex].word}
              </div>
              <div className="stroop-hint-text">
                ⚠️ คำศัพท์บนป้ายมีความหมายว่าสีอะไรในภาษาไทย? (มี 4 ตัวเลือก)
              </div>
            </div>

            <div className="stroop-choices-grid">
              {stage1Questions[currentQIndex].choices.map((choice, idx) => {
                let statusClass = '';
                if (isAnswerLocked) {
                  if (choice === stage1Questions[currentQIndex].correctAnswer) {
                    statusClass = 'correct';
                  } else if (choice === selectedChoice) {
                    statusClass = 'wrong';
                  }
                }
                return (
                  <button
                    key={idx}
                    className={`stroop-choice-btn ${statusClass}`}
                    onClick={() => handleStage1Answer(choice)}
                    disabled={isAnswerLocked}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. Stage 1 Interstitial / Pause */}
        {gameState === 'stage1_interstitial' && (
          <div className="stroop-auth-box">
            <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>🎉</div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '4px 0', color: '#f8fafc' }}>
              เสร็จสิ้นด่านที่ 1!
            </h2>
            <div style={{ margin: '14px 0', fontSize: '1.15rem' }}>
              คะแนนด่านที่ 1 ได้รับ:{' '}
              <strong style={{ color: '#fbbf24', fontSize: '1.4rem' }}>{stage1Score}</strong> / 20 คะแนน
            </div>
            <div
              style={{
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.4)',
                borderRadius: 14,
                padding: '14px 20px',
                marginBottom: 20,
                color: '#fbcfe8',
                fontSize: '0.9rem',
              }}
            >
              <Zap size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
              <strong>ด่านต่อไป: คำคู่ (2 คำพร้อมกัน)!</strong>
              <br />
              ป้ายจะแสดงสีภาษาอังกฤษ 2 คำพร้อมกัน มี 10 ข้อ เวลา 1 นาที ข้อละ 2 คะแนน รวม 20 คะแนน
            </div>
            <button className="stroop-btn-primary" onClick={startStage2}>
              <Play size={18} />
              เข้าสู่ด่านที่ 2 ทันที!
            </button>
          </div>
        )}

        {/* 4. Stage 2: Dual Colors (10 questions, 2 pts each, 60s) */}
        {gameState === 'stage2' && stage2Questions[currentQIndex] && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="stroop-signboard">
              <div className="stroop-target-word" style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
                <span style={{ color: stage2Questions[currentQIndex].fontColor1 }}>
                  {stage2Questions[currentQIndex].word1}
                </span>
                <span style={{ color: '#94a3b8', fontSize: '2rem', alignSelf: 'center' }}>&amp;</span>
                <span style={{ color: stage2Questions[currentQIndex].fontColor2 }}>
                  {stage2Questions[currentQIndex].word2}
                </span>
              </div>
              <div className="stroop-hint-text">
                ⚠️ คำศัพท์ทั้งสองคำแปลเป็นภาษาไทยว่าสีอะไร? (มี 4 ตัวเลือก)
              </div>
            </div>

            <div className="stroop-choices-grid">
              {stage2Questions[currentQIndex].choices.map((choice, idx) => {
                let statusClass = '';
                if (isAnswerLocked) {
                  if (choice === stage2Questions[currentQIndex].correctAnswer) {
                    statusClass = 'correct';
                  } else if (choice === selectedChoice) {
                    statusClass = 'wrong';
                  }
                }
                return (
                  <button
                    key={idx}
                    className={`stroop-choice-btn ${statusClass}`}
                    onClick={() => handleStage2Answer(choice)}
                    disabled={isAnswerLocked}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 5. Summary & Leaderboard Screen */}
        {gameState === 'summary' && (
          <div className="stroop-auth-box" style={{ maxWidth: 540 }}>
            <div style={{ fontSize: '3.8rem', marginBottom: 6 }}>🏆</div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: '#f8fafc' }}>
              สรุปผลการทดสอบไหวพริบ
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: '2px 0 16px 0' }}>
              ผู้แข่งขัน: <strong>{playerName || 'ผู้เล่นนิรนาม'}</strong>
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                width: '100%',
                marginBottom: 20,
              }}
            >
              <div className="stroop-hud-card">
                <span className="stroop-hud-label">ด่านที่ 1</span>
                <span className="stroop-hud-val pink">{stage1Score} / 20</span>
              </div>
              <div className="stroop-hud-card">
                <span className="stroop-hud-label">ด่านที่ 2</span>
                <span className="stroop-hud-val cyan">{stage2Score} / 20</span>
              </div>
              <div className="stroop-hud-card">
                <span className="stroop-hud-label">คะแนนรวม</span>
                <span className="stroop-hud-val gold">{currentScore} / 40</span>
              </div>
            </div>

            {/* Performance Badge */}
            <div
              style={{
                background: currentScore >= 34 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                border: `1px solid ${currentScore >= 34 ? '#10b981' : '#eab308'}`,
                borderRadius: 14,
                padding: '12px 18px',
                width: '100%',
                marginBottom: 20,
                textAlign: 'center',
                color: currentScore >= 34 ? '#6ee7b7' : '#fde047',
                fontSize: '0.92rem',
                fontWeight: 600,
              }}
            >
              {currentScore >= 34
                ? '🌟 ยอดเยี่ยมมาก! สมองประมวลผลคำศัพท์ได้เฉียบคมและแม่นยำสูง ไม่ถูกสีหลอก'
                : currentScore >= 24
                ? '👍 ทำได้ดีมาก! มีสมาธิและสามารถแยกแยะความหมายของคำศัพท์ได้อย่างดี'
                : '💪 ฝึกฝนอีกนิด! โดนสีหลอกสายตาไปบ้าง ลองเล่นใหม่อีกรอบเพื่อพัฒนาสมาธิ'}
            </div>

            {/* Top 10 Leaderboard */}
            <div className="stroop-lb-card" style={{ margin: '0 0 20px 0' }}>
              <div className="stroop-lb-header">
                <span>
                  <Trophy size={16} style={{ display: 'inline', marginRight: 6 }} />
                  ตารางคะแนนสูงสุด 10 อันดับแรก
                </span>
                <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Leaderboard</span>
              </div>
              {leaderboard.map((entry, idx) => {
                const isCurrent = entry.name === (playerName.trim() || 'ผู้เล่นนิรนาม') && entry.score === currentScore;
                return (
                  <div
                    key={entry.id || idx}
                    className="stroop-lb-row"
                    style={{
                      background: isCurrent ? 'rgba(236, 72, 153, 0.25)' : undefined,
                      border: isCurrent ? '1px solid rgba(236, 72, 153, 0.5)' : undefined,
                    }}
                  >
                    <span className="stroop-lb-rank">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                    </span>
                    <span className="stroop-lb-name">
                      {entry.name} {isCurrent && '👈 (คุณ)'}
                    </span>
                    <span className="stroop-lb-score">{entry.score} คะแนน</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button className="stroop-btn-primary" onClick={startStage1}>
                <RotateCcw size={18} />
                เล่นใหม่อีกครั้ง
              </button>
              <Link to="/games" className="stroop-btn-secondary">
                <ChevronLeft size={18} />
                กลับคลังเกม
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Educational Knowledge Card */}
      <GameLearnCard gameKey="stroop-color" />
    </div>
  );
};

export default StroopColorGame;
