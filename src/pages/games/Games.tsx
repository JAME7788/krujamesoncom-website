import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Gamepad2,
  Play,
  Search,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSfxMuted, setSfxMuted, playWinSound } from '../../utils/celebrate';
import { gamesCatalog } from '../../data/gamesCatalog';
import {
  CT_PILLARS,
  calculateStudentCtProfile,
  type CtPillar,
} from '../../services/computationalThinkingService';
import {
  getUnifiedStudentLearningSnapshot,
  fetchGameCustomConfigsFromCloud,
  getAllUnifiedGames,
} from '../../services/unifiedDatabaseService';
import { speakThai, stopSpeech } from '../../utils/speechService';
import BloomTaxonomyBadge from '../../components/BloomTaxonomyBadge';
import { getActivityBloomLevel } from '../../services/bloomTaxonomyService';
import './Games.css';
import './GameStyles.css';

type GradeFilter = 'all' | 'lower-primary' | 'upper-primary' | 'secondary';
type CtFilter = 'all' | CtPillar;
type PlayStatusFilter = 'all' | 'played' | 'unplayed';

const gradeFilters: { id: GradeFilter; label: string; range: [number, number] }[] = [
  { id: 'all', label: 'ทั้งหมด', range: [1, 9] },
  { id: 'lower-primary', label: 'ป.1-3', range: [1, 3] },
  { id: 'upper-primary', label: 'ป.4-6', range: [4, 6] },
  { id: 'secondary', label: 'ม.1-3', range: [7, 9] },
];

const ctFilterOptions: { id: CtFilter; label: string; emoji: string }[] = [
  { id: 'all', label: 'ทุกทักษะ CT', emoji: '🌟' },
  { id: 'decomposition', label: 'การแยกย่อยปัญหา', emoji: CT_PILLARS.decomposition.emoji },
  { id: 'pattern', label: 'การหารูปแบบ', emoji: CT_PILLARS.pattern.emoji },
  { id: 'abstraction', label: 'การคิดเชิงนามธรรม', emoji: CT_PILLARS.abstraction.emoji },
  { id: 'algorithm', label: 'การออกแบบอัลกอริทึม', emoji: CT_PILLARS.algorithm.emoji },
];

const gameLevelRange = (level: string): [number, number] => {
  if (level.includes('ทุกระดับ')) return [1, 9];

  const crossLevel = level.match(/ป\.(\d)-ม\.(\d)/);
  if (crossLevel) return [Number(crossLevel[1]), 6 + Number(crossLevel[2])];

  const primaryLevel = level.match(/ป\.(\d)-(\d)/);
  if (primaryLevel) return [Number(primaryLevel[1]), Number(primaryLevel[2])];

  const secondaryLevel = level.match(/ม\.(\d)-(\d)/);
  if (secondaryLevel) return [6 + Number(secondaryLevel[1]), 6 + Number(secondaryLevel[2])];

  return [1, 9];
};

const gameMatchesGrade = (level: string, filter: GradeFilter): boolean => {
  if (filter === 'all') return true;
  const selected = gradeFilters.find((item) => item.id === filter)?.range || [1, 9];
  const gameRange = gameLevelRange(level);
  return gameRange[0] <= selected[1] && gameRange[1] >= selected[0];
};

const Games: React.FC = () => {
  const { user } = useAuth();
  const [muted, setMuted] = useState<boolean>(isSfxMuted());
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [ctFilter, setCtFilter] = useState<CtFilter>('all');
  const [playStatusFilter, setPlayStatusFilter] = useState<PlayStatusFilter>('all');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [configVersion, setConfigVersion] = useState(0);

  useEffect(() => {
    void fetchGameCustomConfigsFromCloud().then(() => {
      setConfigVersion((v) => v + 1);
    });
    const onConfigUpdate = () => setConfigVersion((v) => v + 1);
    window.addEventListener('unified-game-config-updated', onConfigUpdate);
    return () => {
      window.removeEventListener('unified-game-config-updated', onConfigUpdate);
      stopSpeech();
    };
  }, []);

  const classroom = user?.classroom || 'ป.4';

  const unifiedSnapshot = useMemo(() => {
    void configVersion;
    return getUnifiedStudentLearningSnapshot(user?.id || 'guest', classroom);
  }, [user?.id, classroom, configVersion]);

  const unifiedGamesMap = useMemo(() => {
    void configVersion;
    const map = new Map<string, (typeof unifiedSnapshot.games)[number]>();
    unifiedSnapshot.games.forEach((entry) => {
      map.set(entry.record.id, entry);
      map.set(entry.record.rawId, entry);
    });
    return map;
  }, [unifiedSnapshot, configVersion]);

  const allUnifiedRecords = useMemo(() => {
    void configVersion;
    return getAllUnifiedGames(classroom);
  }, [classroom, configVersion]);

  const ctProfile = useMemo(() => {
    if (!user?.id || user.accountType !== 'student') return null;
    return calculateStudentCtProfile(user.id, user.classroom || '');
  }, [user]);

  const recommendedGame = useMemo(() => {
    if (!ctProfile) return null;
    return gamesCatalog.find((g) => g.id === ctProfile.recommendedGameId) || null;
  }, [ctProfile]);

  const playedCount = useMemo(
    () => unifiedSnapshot.games.filter((g) => g.played).length,
    [unifiedSnapshot],
  );
  const totalEarnedStars = useMemo(
    () => unifiedSnapshot.games.reduce((sum, g) => sum + g.earnedStars, 0),
    [unifiedSnapshot],
  );

  const featuredGame = gamesCatalog.find((game) => game.id === 'digital-city-quest') || gamesCatalog[0];
  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('th');
    return allUnifiedRecords.filter((rec) => {
      const game = rec.catalog;
      const snapEntry = unifiedGamesMap.get(rec.id);
      const matchesQuery =
        !normalizedQuery ||
        [rec.effectiveTitle, rec.effectiveDesc, game.skill, game.level, rec.ctPillar.name]
          .some((value) => value.toLocaleLowerCase('th').includes(normalizedQuery));
      const matchesGrade = gameMatchesGrade(game.level, gradeFilter);
      const matchesCt = ctFilter === 'all' || rec.ctPillar.id === ctFilter;
      const isPlayed = Boolean(snapEntry?.played);
      const matchesPlayStatus =
        playStatusFilter === 'all' ||
        (playStatusFilter === 'played' && isPlayed) ||
        (playStatusFilter === 'unplayed' && !isPlayed);
      return matchesQuery && matchesGrade && matchesCt && matchesPlayStatus;
    });
  }, [allUnifiedRecords, unifiedGamesMap, gradeFilter, ctFilter, playStatusFilter, query]);

  const handleToggleSpeak = (e: React.MouseEvent, gameId: string, title: string, level: string, desc: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (speakingId === gameId) {
      stopSpeech();
      setSpeakingId(null);
    } else {
      setSpeakingId(gameId);
      const success = speakThai(`${title} ระดับ ${level}. ${desc}`, () => {
        setSpeakingId((curr) => (curr === gameId ? null : curr));
      });
      if (!success) {
        setSpeakingId(null);
      }
    }
  };

  return (
    <div className="games-hub container section-padding">
      <section className="games-hero" aria-labelledby="featured-game-title">
        <img
          className="games-hero-image"
          src="/media/games/tycoon-theme/pixel-tech-campus.webp"
          alt="ฉากมหานครเทคโนโลยีพิกเซลของเกม Digital City Quest"
        />
        <div className="games-hero-shade" />
        <div className="games-hero-content">
          <span className="games-hero-kicker"><Trophy size={16} /> เกมเด่นประจำห้องเรียน</span>
          <h1 id="featured-game-title">Digital City Quest</h1>
          <p>{featuredGame.desc}</p>
          <div className="games-hero-meta">
            <span><BookOpen size={15} /> {featuredGame.level}</span>
            <span><Sparkles size={15} /> {featuredGame.skill}</span>
          </div>
          <Link to={featuredGame.path} className="games-featured-play">
            <Play size={18} fill="currentColor" /> เริ่มภารกิจ
          </Link>
        </div>
        <button
          type="button"
          className="games-sound-toggle"
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setSfxMuted(next);
            if (!next) playWinSound();
          }}
          aria-label={muted ? 'เปิดเสียงฉลองเกม' : 'ปิดเสียงฉลองเกม'}
          title={muted ? 'เปิดเสียงฉลองเมื่อเล่นเกมจบ' : 'ปิดเสียงฉลองเมื่อเล่นเกมจบ'}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
        </button>
      </section>

      <section className="games-library" aria-labelledby="games-library-title">
        <div className="games-section-heading">
          <div>
            <span className="games-section-kicker"><Gamepad2 size={15} /> เกมของครูเจมส์ (ฐานข้อมูลเชื่อมโยง 38 เกม)</span>
            <h2 id="games-library-title">คลังเกมฝึกทักษะ</h2>
          </div>
          <span className="games-result-count">{filteredGames.length} / {allUnifiedRecords.length} เกม</span>
        </div>

        {/* Unified Database Student Progress Bar */}
        <div className="unified-hub-summary" aria-label="สรุปความก้าวหน้าจากฐานข้อมูลเกมรวมศูนย์">
          <div className="uhs-stats">
            <div className="uhs-stat-pill">
              <span>🎮 พิชิตแล้ว</span>
              <strong>{playedCount} / {allUnifiedRecords.length} เกม</strong>
            </div>
            <div className="uhs-stat-pill">
              <span>⭐ ดาวการเรียนรู้สะสม</span>
              <strong>{totalEarnedStars} ดาว</strong>
            </div>
            <div className="uhs-stat-pill">
              <span>🪙 เหรียญรางวัล</span>
              <strong>{unifiedSnapshot.coins.toLocaleString()} เหรียญ</strong>
            </div>
          </div>
          <div className="uhs-status-filters" role="group" aria-label="กรองตามสถานะการเล่น">
            <button
              type="button"
              className={`uhs-filter-btn ${playStatusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setPlayStatusFilter('all')}
            >
              ทั้งหมด ({allUnifiedRecords.length})
            </button>
            <button
              type="button"
              className={`uhs-filter-btn ${playStatusFilter === 'played' ? 'active' : ''}`}
              onClick={() => setPlayStatusFilter('played')}
            >
              ✅ เล่นแล้ว ({playedCount})
            </button>
            <button
              type="button"
              className={`uhs-filter-btn ${playStatusFilter === 'unplayed' ? 'active' : ''}`}
              onClick={() => setPlayStatusFilter('unplayed')}
            >
              🆕 ยังไม่เคยเล่น ({allUnifiedRecords.length - playedCount})
            </button>
          </div>
        </div>

        {/* New Games Spotlight */}
        <div className="new-games-spotlight">
          <div className="new-games-header">
            <Sparkles size={16} className="text-amber-400" />
            <span>✨ แนะนำเกมใหม่ล่าสุดที่คุณครูสร้างให้ (ปรับแต่งความเร็ว/โจทย์ได้ในเกม):</span>
          </div>
          <div className="new-games-grid">
            <Link to="/games/cyber-racer" className="new-game-card racer-card">
              <div className="ng-icon">🏎️</div>
              <div className="ng-info">
                <span className="ng-badge">เกมแข่งรถตอบคำถาม 60 FPS</span>
                <strong>Cyber Racer Quiz</strong>
                <p>ขับรถซิ่งบนทางด่วนไซเบอร์ คลิกปุ่มเลนคำตอบ A/B/C หรือขับเปลี่ยนเลนได้ลื่นไหล</p>
              </div>
              <span className="ng-arrow">เล่นเลย →</span>
            </Link>

            <Link to="/games/claw-platformer" className="new-game-card claw-card">
              <div className="ng-icon">🦞</div>
              <div className="ng-info">
                <span className="ng-badge">2D Platformer สไตล์ Mario</span>
                <strong>Claw Empire: กู้เซิร์ฟเวอร์</strong>
                <p>เกมผจญภัยก้ามโต กระโดดเหยียบปราบไวรัสคอมพิวเตอร์ โหม่งกล่องคำถาม</p>
              </div>
              <span className="ng-arrow">เล่นเลย →</span>
            </Link>
          </div>
        </div>

        {ctProfile && recommendedGame && (
          <aside className="games-recommendation-banner" aria-label="คำแนะนำเกมเฉพาะบุคคล">
            <div className="rec-icon" aria-hidden="true">
              {CT_PILLARS[ctProfile.recommendedPillar].emoji}
            </div>
            <div className="rec-text">
              <strong>
                🎯 แนะนำสำหรับคุณ: เสริมทักษะ {CT_PILLARS[ctProfile.recommendedPillar].name}
              </strong>
              <p>
                ลองฝึกฝนกับเกม &ldquo;{recommendedGame.title}&rdquo; เพื่อยกระดับความเข้าใจด้าน{' '}
                {CT_PILLARS[ctProfile.recommendedPillar].nameEn}
              </p>
            </div>
            <Link to={recommendedGame.path} className="rec-action-btn">
              เล่นเกมแนะนำเลย →
            </Link>
          </aside>
        )}

        <div className="games-toolbar">
          <label className="games-search">
            <Search size={19} />
            <span className="sr-only">ค้นหาเกม</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="ค้นหาชื่อเกมหรือทักษะ"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="ล้างคำค้นหา" title="ล้างคำค้นหา">
                <X size={17} />
              </button>
            )}
          </label>
          <div className="games-grade-filter" aria-label="กรองตามระดับชั้น">
            {gradeFilters.map((filter) => (
              <button
                key={filter.id}
                type="button"
                aria-pressed={gradeFilter === filter.id}
                className={gradeFilter === filter.id ? 'active' : ''}
                onClick={() => setGradeFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* CT 4 Pillars Filter */}
        <div className="games-ct-filter" aria-label="กรองตามทักษะการคิดเชิงคำนวณ">
          {ctFilterOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className={`ct-filter-pill ${ctFilter === opt.id ? 'active' : ''}`}
              aria-pressed={ctFilter === opt.id}
              onClick={() => setCtFilter(opt.id)}
            >
              <span>{opt.emoji}</span> {opt.label}
            </button>
          ))}
        </div>

        {filteredGames.length > 0 ? (
          <div className="games-grid">
            {filteredGames.map((rec, index) => {
              const game = rec.catalog;
              const pillar = rec.ctPillar;
              const snapEntry = unifiedGamesMap.get(rec.id);
              const isSpeaking = speakingId === game.id;
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(index * 0.035, 0.35) }}
                >
                  <Link to={game.path} className="game-card-big" style={{ '--game-accent': game.color } as React.CSSProperties}>
                    <div className="gc-card-top">
                      <div className="gc-emoji" style={{ background: `${game.color}1f`, color: game.color }}>
                        {game.emoji}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {snapEntry?.played && (
                          <span className="gc-played-pill" title={`เล่นแล้ว ${snapEntry.playCount} ครั้ง`}>
                            {'⭐'.repeat(Math.max(1, snapEntry.earnedStars))} {snapEntry.bestScore > 0 ? `(${snapEntry.bestScore})` : 'เล่นแล้ว'}
                          </span>
                        )}
                        {rec.customOverride && (
                          <span className="gc-custom-pill" title="มีการปรับแต่งความเร็ว/โจทย์">
                            ⚙️ ปรับแต่งแล้ว
                          </span>
                        )}
                        <span className="gc-level">{game.level}</span>
                      </div>
                    </div>
                    <div className="gc-info">
                      <h3>{rec.effectiveTitle}</h3>
                      <p>{rec.effectiveDesc}</p>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                        <div
                          className="gc-ct-badge"
                          style={{
                            color: pillar.color,
                            backgroundColor: `${pillar.color}18`,
                            borderColor: `${pillar.color}35`,
                          }}
                          title={`ทักษะหลัก: ${pillar.name} (${pillar.nameEn})`}
                        >
                          <span>{pillar.emoji}</span>
                          <span>{pillar.name}</span>
                        </div>
                        <BloomTaxonomyBadge level={getActivityBloomLevel('fun', game.id)} size="sm" />
                        {rec.targetUnits.length > 0 && (
                          <span className="gc-unit-badge">
                            📚 หน่วยที่ {Array.from(new Set(rec.targetUnits.map((u) => u.unitNo))).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="gc-cta">
                      <span className="gc-skill"><Sparkles size={14} /> {game.skill}</span>
                      <button
                        type="button"
                        className={`gc-speak-btn ${isSpeaking ? 'speaking' : ''}`}
                        title={isSpeaking ? 'หยุดอ่าน' : 'ฟังเสียงอ่านคำอธิบายเกม'}
                        aria-label={isSpeaking ? 'หยุดอ่าน' : `ฟังเสียงอ่านเกม ${rec.effectiveTitle}`}
                        onClick={(e) => handleToggleSpeak(e, game.id, rec.effectiveTitle, game.level, rec.effectiveDesc)}
                      >
                        <Volume2 size={15} />
                      </button>
                      <span className="gc-play" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="games-empty-state">
            <Search size={28} />
            <h3>ไม่พบเกมที่ตรงกับคำค้นหา</h3>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setGradeFilter('all');
                setCtFilter('all');
                setPlayStatusFilter('all');
              }}
            >
              แสดงเกมทั้งหมด
            </button>
          </div>
        )}
      </section>
    </div>
  );
};

export default Games;
