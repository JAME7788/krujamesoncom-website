import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  ChevronUp,
  ChevronDown,
  Play,
} from 'lucide-react';
import { kruComMissions } from '../../data/kruComMissions';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useGameTimers } from '../../hooks/useGameTimers';
import { sfxCoin, sfxCorrect, sfxWrong } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './KruComArcadeGame.css';

// Helper to shuffle array
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const KruComArcadeGame: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const missionParam = searchParams.get('mission');
  const timers = useGameTimers(missionParam || 'catalog');
  const completedMission = useRef<string | null>(null);
  const matchingLocked = useRef(false);

  // Filters for dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  // Current active mission
  const activeMission = useMemo(() => {
    if (!missionParam) return null;
    return kruComMissions.find((m) => m.id === missionParam) || null;
  }, [missionParam]);

  // Hook for recording progress
  const recordGame = useGameProgress('krucom-arcade', 'Kru-Com 100+ Missions Arcade');

  // Gameplay states
  // 1. Sorting state
  const [sortIdx, setSortIdx] = useState(0);
  const [sortFeedback, setSortFeedback] = useState<'correct' | 'wrong' | null>(null);

  // 2. Matching state
  const [leftSelected, setLeftSelected] = useState<number | null>(null);
  const [rightSelected, setRightSelected] = useState<number | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<number[]>([]);
  const [shuffledRights, setShuffledRights] = useState<{ originalIdx: number; text: string }[]>([]);

  // 3. Sequence state
  const [currentSequence, setCurrentSequence] = useState<{ stepText: string; order: number }[]>([]);
  const [seqValidated, setSeqValidated] = useState<boolean | null>(null);

  // 4. Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [quizSelected, setQuizSelected] = useState<number | null>(null);
  const [quizAnswered, setQuizAnswered] = useState(false);

  // Shared completion state
  const [isCompleted, setIsCompleted] = useState(false);
  const [earnedStars, setEarnedStars] = useState(3);
  const [earnedXP, setEarnedXP] = useState(0);
  const [score, setScore] = useState(0);
  const [showKnowledge, setShowKnowledge] = useState(false);

  // Initialize or reset game when active mission changes
  useEffect(() => {
    completedMission.current = null;
    matchingLocked.current = false;
    if (!activeMission) return;

    // A URL mission change starts a new round while preserving catalog filters.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCompleted(false);
    setShowKnowledge(false);
    setScore(0);
    setEarnedStars(3);
    setEarnedXP(0);

    if (activeMission.type === 'sorting') {
      setSortIdx(0);
      setSortFeedback(null);
    } else if (activeMission.type === 'matching' && activeMission.matchingPairs) {
      setLeftSelected(null);
      setRightSelected(null);
      setMatchedPairs([]);
      const rights = activeMission.matchingPairs.map((p, idx) => ({
        originalIdx: idx,
        text: p.right,
      }));
      setShuffledRights(shuffleArray(rights));
    } else if (activeMission.type === 'sequence' && activeMission.sequenceSteps) {
      setSeqValidated(null);
      setCurrentSequence(shuffleArray(activeMission.sequenceSteps));
    } else if (activeMission.type === 'quiz') {
      setQuizIdx(0);
      setQuizSelected(null);
      setQuizAnswered(false);
    }
  }, [activeMission]);

  // Handle completion
  const handleMissionFinish = (stars = 3) => {
    if (!activeMission || completedMission.current === activeMission.id) return;
    completedMission.current = activeMission.id;
    const ratio = activeMission.type === 'quiz'
      ? Math.min(1, Math.max(0, score / Math.max(1, (activeMission.quizQuestions?.length || 0) * 20)))
      : 1;
    const xp = Math.round(activeMission.rewardXP * ratio);
    setEarnedXP(xp);
    setEarnedStars(activeMission.type === 'quiz' ? (ratio >= 0.8 ? 3 : ratio >= 0.5 ? 2 : ratio > 0 ? 1 : 0) : stars);
    setIsCompleted(true);
    sfxCoin();
    if (activeMission) {
      if (xp > 0) void recordGame(xp, activeMission.id, activeMission.rewardXP);
    }
  };

  // --- SORTING HANDLERS ---
  const handleSortChoice = (binName: string) => {
    if (!activeMission || !activeMission.sortingItems || sortFeedback) return;
    const currentItem = activeMission.sortingItems[sortIdx];
    const isCorrect = currentItem.category === binName;

    if (isCorrect) {
      sfxCorrect();
      setSortFeedback('correct');
      setScore((s) => s + 10);
      timers.schedule(() => {
        setSortFeedback(null);
        if (sortIdx + 1 < (activeMission.sortingItems?.length || 0)) {
          setSortIdx((prev) => prev + 1);
        } else {
          handleMissionFinish(3);
        }
      }, 550);
    } else {
      sfxWrong();
      setSortFeedback('wrong');
      timers.schedule(() => {
        setSortFeedback(null);
      }, 600);
    }
  };

  // --- MATCHING HANDLERS ---
  const handleLeftCardClick = (idx: number) => {
    if (isCompleted || matchingLocked.current || matchedPairs.includes(idx)) return;
    setLeftSelected(idx);

    if (rightSelected !== null) {
      checkMatching(idx, rightSelected);
    }
  };

  const handleRightCardClick = (shuffledIdx: number) => {
    const origIdx = shuffledRights[shuffledIdx].originalIdx;
    if (isCompleted || matchingLocked.current || matchedPairs.includes(origIdx)) return;
    setRightSelected(shuffledIdx);

    if (leftSelected !== null) {
      checkMatching(leftSelected, shuffledIdx);
    }
  };

  const checkMatching = (lIdx: number, rIdx: number) => {
    const origRIdx = shuffledRights[rIdx].originalIdx;
    if (lIdx === origRIdx) {
      sfxCorrect();
      const nextMatched = [...matchedPairs, lIdx];
      setMatchedPairs(nextMatched);
      setLeftSelected(null);
      setRightSelected(null);
      setScore((s) => s + 15);

      if (activeMission?.matchingPairs && nextMatched.length === activeMission.matchingPairs.length) {
        matchingLocked.current = true;
        timers.schedule(() => handleMissionFinish(3), 500);
      }
    } else {
      sfxWrong();
      matchingLocked.current = true;
      timers.schedule(() => {
        setLeftSelected(null);
        setRightSelected(null);
        matchingLocked.current = false;
      }, 500);
    }
  };

  // --- SEQUENCE HANDLERS ---
  const moveSequenceStep = (index: number, direction: 'up' | 'down') => {
    if (isCompleted || seqValidated === true) return;
    const newSeq = [...currentSequence];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSeq.length) return;
    [newSeq[index], newSeq[targetIdx]] = [newSeq[targetIdx], newSeq[index]];
    setCurrentSequence(newSeq);
    setSeqValidated(null);
  };

  const checkSequence = () => {
    if (isCompleted || seqValidated === true || !currentSequence.length) return;
    let isCorrect = true;
    for (let i = 0; i < currentSequence.length; i++) {
      if (currentSequence[i].order !== i + 1) {
        isCorrect = false;
        break;
      }
    }

    if (isCorrect) {
      sfxCorrect();
      setSeqValidated(true);
      setScore((s) => s + 30);
      timers.schedule(() => handleMissionFinish(3), 600);
    } else {
      sfxWrong();
      setSeqValidated(false);
    }
  };

  // --- QUIZ HANDLERS ---
  const handleQuizAnswer = (choiceIdx: number) => {
    if (quizAnswered || !activeMission?.quizQuestions) return;
    setQuizSelected(choiceIdx);
    setQuizAnswered(true);

    const q = activeMission.quizQuestions[quizIdx];
    if (choiceIdx === q.correctIdx) {
      sfxCorrect();
      setScore((s) => s + 20);
    } else {
      sfxWrong();
    }
  };

  const handleNextQuiz = () => {
    if (!quizAnswered || isCompleted || !activeMission?.quizQuestions) return;
    if (quizIdx + 1 < activeMission.quizQuestions.length) {
      setQuizIdx((prev) => prev + 1);
      setQuizSelected(null);
      setQuizAnswered(false);
    } else {
      handleMissionFinish(3);
    }
  };

  // Filtered mission list
  const filteredMissions = useMemo(() => {
    return kruComMissions.filter((m) => {
      if (selectedCategory !== 'all' && m.category !== selectedCategory) return false;
      if (selectedLevel !== 'all' && m.level !== selectedLevel) return false;
      if (selectedType !== 'all' && m.type !== selectedType) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = m.title.toLowerCase().includes(q);
        const matchFolder = m.sheetFolder.toLowerCase().includes(q);
        const matchDesc = m.desc.toLowerCase().includes(q);
        if (!matchTitle && !matchFolder && !matchDesc) return false;
      }
      return true;
    });
  }, [searchQuery, selectedCategory, selectedLevel, selectedType]);

  const nextMissionId = useMemo(() => {
    if (!activeMission) return null;
    const curIdx = kruComMissions.findIndex((m) => m.id === activeMission.id);
    if (curIdx >= 0 && curIdx + 1 < kruComMissions.length) {
      return kruComMissions[curIdx + 1].id;
    }
    return null;
  }, [activeMission]);

  return (
    <div className="kca-container">
      {/* Header */}
      <div className="kca-header">
        <Link to="/games" className="kca-back-btn">
          <ArrowLeft size={16} /> กลับหน้ารวมเกม
        </Link>
        <div className="kca-title-wrap">
          <h1 className="kca-title">🕹️ Kru-Com 100+ Missions Arcade</h1>
          <p className="kca-subtitle">คลังเกมวิทยาการคำนวณและเทคโนโลยี ครอบคลุม 104 ด่านจากชีตครูคอม</p>
        </div>
        <div style={{ width: 100 }}></div>
      </div>

      {/* DASHBOARD VIEW (When no mission is active) */}
      {!activeMission && (
        <>
          {/* Stats HUD */}
          <div className="kca-stats-hud">
            <div className="kca-stat-card">
              <div className="kca-stat-icon">🎯</div>
              <div className="kca-stat-info">
                <span className="kca-stat-label">ภารกิจทั้งหมด</span>
                <span className="kca-stat-val">104 ด่าน</span>
              </div>
            </div>
            <div className="kca-stat-card">
              <div className="kca-stat-icon">📁</div>
              <div className="kca-stat-info">
                <span className="kca-stat-label">สังเคราะห์จากสื่อ</span>
                <span className="kca-stat-val">409 ไฟล์ PDF</span>
              </div>
            </div>
            <div className="kca-stat-card">
              <div className="kca-stat-icon">⭐</div>
              <div className="kca-stat-info">
                <span className="kca-stat-label">โหมดการเล่น</span>
                <span className="kca-stat-val">4 โหมดเร้าใจ</span>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="kca-filter-bar">
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="kca-search-input"
                placeholder="ค้นหาชื่อภารกิจ, หัวข้อสื่อ, หรือโฟลเดอร์ครูคอม..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search
                size={18}
                style={{ position: 'absolute', right: 16, top: 14, color: '#94a3b8' }}
              />
            </div>

            {/* Category Chips */}
            <div className="kca-chip-row">
              {[
                { id: 'all', label: 'ทั้งหมด (104)' },
                { id: 'coding', label: '🚀 Coding & ผังงาน' },
                { id: 'cyber-safety', label: '🛡️ ไซเบอร์ & พ.ร.บ.' },
                { id: 'hardware', label: '🖥️ ฮาร์ดแวร์ & ไอที' },
                { id: 'office-tools', label: '💼 ออฟฟิศ & Google' },
                { id: 'data-detective', label: '🔍 ข้อมูล & กราฟิก' },
                { id: 'ai-tech', label: '🤖 ปัญญาประดิษฐ์ AI' },
              ].map((c) => (
                <button
                  key={c.id}
                  className={`kca-chip ${selectedCategory === c.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Level & Type Chips */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div className="kca-chip-row">
                {['all', 'ป.1-3', 'ป.4-6', 'ม.1-3'].map((lvl) => (
                  <button
                    key={lvl}
                    className={`kca-chip ${selectedLevel === lvl ? 'active' : ''}`}
                    onClick={() => setSelectedLevel(lvl)}
                  >
                    {lvl === 'all' ? 'ทุกระดับชั้น' : lvl}
                  </button>
                ))}
              </div>

              <div className="kca-chip-row">
                {[
                  { id: 'all', label: 'ทุกโหมด' },
                  { id: 'sorting', label: '🗂️ คัดแยกหมวดหมู่' },
                  { id: 'matching', label: '🧩 จับคู่ความสัมพันธ์' },
                  { id: 'sequence', label: '🔢 จัดเรียงลำดับ' },
                  { id: 'quiz', label: '⚡ ตอบคำถามท้าทาย' },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={`kca-chip ${selectedType === t.id ? 'active' : ''}`}
                    onClick={() => setSelectedType(t.id)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Missions Grid */}
          <div className="kca-missions-grid">
            {filteredMissions.map((mission) => (
              <div key={mission.id} className="kca-mission-card">
                <div>
                  <div className="kca-card-top">
                    <span className={`kca-type-badge ${mission.type}`}>
                      {mission.type === 'sorting' && '🗂️ แยกหมวดหมู่'}
                      {mission.type === 'matching' && '🧩 จับคู่คำศัพท์'}
                      {mission.type === 'sequence' && '🔢 เรียงลำดับ'}
                      {mission.type === 'quiz' && '⚡ ทายปัญหา'}
                    </span>
                    <span className="kca-card-level">{mission.level}</span>
                  </div>
                  <div className="kca-card-body">
                    <div className="kca-card-folder">📁 {mission.sheetFolder}</div>
                    <h3>{mission.title}</h3>
                    <p className="kca-card-desc">{mission.desc}</p>
                  </div>
                </div>

                <div className="kca-card-actions">
                  <button
                    className="kca-play-btn"
                    style={{ width: '100%', padding: '12px' }}
                    onClick={() => setSearchParams({ mission: mission.id })}
                  >
                    <Play size={16} /> เข้าเล่นด่านนี้
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredMissions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
              <p style={{ fontSize: '1.2rem' }}>ไม่พบภารกิจที่ตรงกับเงื่อนไขการค้นหา</p>
              <button
                className="kca-btn-secondary"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setSelectedLevel('all');
                  setSelectedType('all');
                }}
              >
                ล้างการค้นหา
              </button>
            </div>
          )}
        </>
      )}

      {/* GAMEPLAY ARENA VIEW (When a mission is active) */}
      {activeMission && (
        <div className="kca-play-arena">
          {/* Arena Top HUD */}
          <div className="kca-arena-hud">
            <div className="kca-arena-info">
              <div className="kca-arena-meta">
                <span>📁 {activeMission.sheetFolder}</span>
                <span>•</span>
                <span>ระดับ: {activeMission.level}</span>
                <span>•</span>
                <span>โบนัส: +{activeMission.rewardXP} XP</span>
              </div>
              <h2>{activeMission.title}</h2>
            </div>
            <div className="kca-hud-right">
              <span className="kca-score-pill">⭐ {score} แต้ม</span>
              <button
                className="kca-exit-btn"
                onClick={() => setShowKnowledge(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(245, 158, 11, 0.18)',
                  color: '#fbbf24',
                  borderColor: 'rgba(245, 158, 11, 0.4)',
                  fontWeight: 600,
                }}
              >
                💡 สาระความรู้
              </button>
              <button className="kca-exit-btn" onClick={() => setSearchParams({})}>
                ✕ ปิดด่าน
              </button>
            </div>
          </div>

          {/* Description banner */}
          <p style={{ color: '#cbd5e1', fontSize: '0.92rem', marginBottom: 16, textAlign: 'center' }}>
            🎯 <strong>เป้าหมาย:</strong> {activeMission.desc}
          </p>

          {/* MODE 1: SORTING */}
          {activeMission.type === 'sorting' && activeMission.sortingItems && (
            <div className="kca-sorting-box">
              {/* Progress bar */}
              <div className="kca-progress-track">
                <div
                  className="kca-progress-fill"
                  style={{
                    width: `${((sortIdx + 1) / activeMission.sortingItems.length) * 100}%`,
                  }}
                />
              </div>

              {sortIdx < activeMission.sortingItems.length && (
                <>
                  <div
                    className={`kca-target-card ${
                      sortFeedback === 'correct' ? 'card-correct' : sortFeedback === 'wrong' ? 'card-wrong' : ''
                    }`}
                    style={{
                      borderColor:
                        sortFeedback === 'correct'
                          ? '#10b981'
                          : sortFeedback === 'wrong'
                          ? '#ef4444'
                          : 'rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    <div className="kca-target-emoji">
                      {activeMission.sortingItems[sortIdx].emoji || '📦'}
                    </div>
                    <div className="kca-target-text">
                      {activeMission.sortingItems[sortIdx].text}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: 8 }}>
                      รายการที่ {sortIdx + 1} จาก {activeMission.sortingItems.length}
                    </div>
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: 14 }}>
                    👆 เลือกหมวดหมู่ที่ถูกต้องสำหรับรายการนี้:
                  </p>

                  <div className="kca-bins-grid">
                    {activeMission.bins?.map((bin) => (
                      <button
                        key={bin}
                        className="kca-bin-btn"
                        onClick={() => handleSortChoice(bin)}
                      >
                        📂 {bin}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* MODE 2: MATCHING */}
          {activeMission.type === 'matching' && activeMission.matchingPairs && (
            <div style={{ width: '100%' }}>
              <div className="kca-progress-track">
                <div
                  className="kca-progress-fill"
                  style={{
                    width: `${(matchedPairs.length / activeMission.matchingPairs.length) * 100}%`,
                  }}
                />
              </div>

              <p style={{ color: '#94a3b8', fontSize: '0.88rem', textAlign: 'center', marginBottom: 12 }}>
                แตะการ์ดฝั่งซ้าย แล้วแตะคู่ที่สัมพันธ์กันในฝั่งขวา ({matchedPairs.length} / {activeMission.matchingPairs.length} คู่)
              </p>

              <div className="kca-matching-grid">
                {/* Left Column */}
                <div className="kca-matching-col">
                  {activeMission.matchingPairs.map((pair, idx) => {
                    const isMatched = matchedPairs.includes(idx);
                    const isSelected = leftSelected === idx;
                    return (
                      <button
                        key={idx}
                        className={`kca-match-card ${isMatched ? 'matched' : ''} ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => handleLeftCardClick(idx)}
                        disabled={isMatched}
                      >
                        {pair.emoji ? `${pair.emoji} ` : '🔹 '} {pair.left}
                      </button>
                    );
                  })}
                </div>

                {/* Right Column */}
                <div className="kca-matching-col">
                  {shuffledRights.map((item, shuffledIdx) => {
                    const isMatched = matchedPairs.includes(item.originalIdx);
                    const isSelected = rightSelected === shuffledIdx;
                    return (
                      <button
                        key={shuffledIdx}
                        className={`kca-match-card ${isMatched ? 'matched' : ''} ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => handleRightCardClick(shuffledIdx)}
                        disabled={isMatched}
                      >
                        🔸 {item.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: SEQUENCE */}
          {activeMission.type === 'sequence' && activeMission.sequenceSteps && (
            <div style={{ width: '100%' }}>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', textAlign: 'center', marginBottom: 12 }}>
                กดปุ่ม ▲ หรือ ▼ เพื่อจัดเรียงลำดับขั้นตอนจากเริ่มต้นไปจนถึงสิ้นสุดให้ถูกต้อง
              </p>

              <div className="kca-sequence-list">
                {currentSequence.map((step, idx) => (
                  <div key={idx} className="kca-sequence-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: 'rgba(245, 158, 11, 0.2)',
                          color: '#f59e0b',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{step.stepText}</span>
                    </div>

                    <div className="kca-sequence-btns">
                      <button
                        className="kca-seq-btn"
                        onClick={() => moveSequenceStep(idx, 'up')}
                        disabled={idx === 0}
                        title="เลื่อนขึ้น"
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        className="kca-seq-btn"
                        onClick={() => moveSequenceStep(idx, 'down')}
                        disabled={idx === currentSequence.length - 1}
                        title="เลื่อนลง"
                      >
                        <ChevronDown size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {seqValidated === false && (
                <div
                  style={{
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#fca5a5',
                    textAlign: 'center',
                    fontSize: '0.88rem',
                    marginBottom: 16,
                  }}
                >
                  ❌ ลำดับขั้นตอนยังไม่ถูกต้อง ลองสังเกตขั้นตอนเริ่มต้นและขั้นตอนสุดท้ายใหม่ดูนะ!
                </div>
              )}

              <div className="kca-action-bar">
                <button className="kca-btn-primary" onClick={checkSequence}>
                  <CheckCircle2 size={16} /> ตรวจสอบลำดับคำตอบ
                </button>
              </div>
            </div>
          )}

          {/* MODE 4: QUIZ */}
          {activeMission.type === 'quiz' && activeMission.quizQuestions && (
            <div className="kca-quiz-box">
              {/* Progress bar */}
              <div className="kca-progress-track">
                <div
                  className="kca-progress-fill"
                  style={{
                    width: `${((quizIdx + 1) / activeMission.quizQuestions.length) * 100}%`,
                  }}
                />
              </div>

              {quizIdx < activeMission.quizQuestions.length && (
                <>
                  <div className="kca-quiz-q">
                    <div style={{ fontSize: '0.8rem', color: '#f59e0b', marginBottom: 6 }}>
                      คำถามข้อที่ {quizIdx + 1} จาก {activeMission.quizQuestions.length}
                    </div>
                    {activeMission.quizQuestions[quizIdx].question}
                  </div>

                  <div className="kca-quiz-choices">
                    {activeMission.quizQuestions[quizIdx].choices.map((choice, cIdx) => {
                      const isCorrect = cIdx === activeMission.quizQuestions![quizIdx].correctIdx;
                      const isChosen = quizSelected === cIdx;
                      let btnClass = 'kca-quiz-btn';
                      if (quizAnswered) {
                        if (isCorrect) btnClass += ' correct';
                        else if (isChosen) btnClass += ' wrong';
                      }
                      return (
                        <button
                          key={cIdx}
                          className={btnClass}
                          onClick={() => handleQuizAnswer(cIdx)}
                          disabled={quizAnswered}
                        >
                          <span style={{ opacity: 0.7 }}>{String.fromCharCode(65 + cIdx)}.</span>
                          <span>{choice}</span>
                        </button>
                      );
                    })}
                  </div>

                  {quizAnswered && (
                    <div
                      className={`kca-quiz-feedback ${
                        quizSelected === activeMission.quizQuestions[quizIdx].correctIdx
                          ? 'correct'
                          : 'wrong'
                      }`}
                    >
                      <strong>
                        {quizSelected === activeMission.quizQuestions[quizIdx].correctIdx
                          ? '🎉 ถูกต้องยอดเยี่ยม!'
                          : '💡 สาระน่ารู้:'}
                      </strong>
                      <p style={{ margin: 0 }}>
                        {activeMission.quizQuestions[quizIdx].explanation}
                      </p>
                      <div style={{ alignSelf: 'flex-end', marginTop: 8 }}>
                        <button className="kca-btn-primary" onClick={handleNextQuiz}>
                          {quizIdx + 1 < activeMission.quizQuestions.length
                            ? 'ข้อถัดไป ➔'
                            : 'สรุปผลภารกิจ 🏆'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* COMPLETION MODAL */}
      {isCompleted && (
        <div className="kca-complete-overlay">
          <div className="kca-complete-card">
            <div style={{ fontSize: '3.5rem', marginBottom: 10 }}>🏆</div>
            <h2 className="kca-complete-title">ผ่านภารกิจสำเร็จ!</h2>
            <p className="kca-complete-desc">
              ยอดเยี่ยมมาก! คุณพิชิตภารกิจ &quot;{activeMission?.title}&quot; สำเร็จ
            </p>

            <div className="kca-stars-row">
              {[1, 2, 3].map((star) => (
                <span
                  key={star}
                  className={`kca-star ${star <= earnedStars ? 'earned' : ''}`}
                >
                  ⭐
                </span>
              ))}
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                borderRadius: 14,
                padding: '12px 20px',
                marginBottom: 20,
                display: 'flex',
                justifyContent: 'space-around',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>คะแนนสะสม</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                  +{score} แต้ม
                </div>
              </div>
              <div style={{ width: 1, background: 'rgba(255, 255, 255, 0.1)' }}></div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>EXP ได้รับ</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#34d399' }}>
                  +{earnedXP} XP
                </div>
              </div>
            </div>

            <div className="kca-modal-btns">
              {nextMissionId && (
                <button
                  className="kca-btn-primary"
                  onClick={() => setSearchParams({ mission: nextMissionId })}
                >
                  ▶️ เล่นด่านถัดไป
                </button>
              )}
              <button
                className="kca-btn-secondary"
                onClick={() => setShowKnowledge(true)}
              >
                💡 ทบทวนสาระความรู้ประจำด่าน
              </button>
              <button
                className="kca-btn-secondary"
                onClick={() => setSearchParams({})}
              >
                📋 กลับหน้ารวม 104 ด่าน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KNOWLEDGE MODAL (Native in-app lesson insights extracted from content) */}
      {showKnowledge && activeMission && (
        <div className="kca-complete-overlay" onClick={() => setShowKnowledge(false)}>
          <div
            className="kca-complete-card"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: 520, textAlign: 'left' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 8 }}>
                💡 สาระความรู้: {activeMission.title}
              </h3>
              <button onClick={() => setShowKnowledge(false)} className="kca-exit-btn">
                ✕ ปิด
              </button>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: 14, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 4 }}>
                หัวข้อบทเรียน: {activeMission.sheetFolder} ({activeMission.level})
              </div>
              <div style={{ fontSize: '0.96rem', color: '#f8fafc', lineHeight: 1.6 }}>
                {activeMission.desc}
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.6, marginBottom: 20 }}>
              {activeMission.type === 'sorting' && '📌 สาระสำคัญ: การจัดหมวดหมู่ข้อมูลช่วยให้คอมพิวเตอร์และมนุษย์จัดเก็บ ค้นหา และประมวลผลข้อมูลได้อย่างเป็นระบบ'}
              {activeMission.type === 'matching' && '📌 สาระสำคัญ: สัญลักษณ์และคำศัพท์เฉพาะทางคอมพิวเตอร์เป็นพื้นฐานสำคัญในการสื่อสารคำสั่งและตรรกะ'}
              {activeMission.type === 'sequence' && '📌 สาระสำคัญ: การคิดเชิงคำนวณ (Computational Thinking) เริ่มต้นจากการแบ่งงานเป็นขั้นตอน (Decomposition) และเรียงลำดับคำสั่ง (Algorithm) ให้ถูกต้อง'}
              {activeMission.type === 'quiz' && '📌 สาระสำคัญ: การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัยและมีจริยธรรม จำเป็นต้องรู้เท่าทันกฎหมายและปฏิบัติตามมาตรฐานสากล'}
            </div>

            <button
              className="kca-btn-primary"
              style={{ width: '100%' }}
              onClick={() => setShowKnowledge(false)}
            >
              เข้าใจแล้ว ลุยต่อเลย! 🎮
            </button>
          </div>
        </div>
      )}

      {/* Game Learning Outcomes Card */}
      <div style={{ width: '100%', maxWidth: 820, marginTop: 32 }}>
        <GameLearnCard gameKey="krucom-arcade" />
      </div>
    </div>
  );
};

export default KruComArcadeGame;
