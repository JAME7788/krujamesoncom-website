import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  ChevronRight,
  ExternalLink,
  Gamepad2,
  Globe,
  Play,
  Search,
  Sparkles,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { isSfxMuted, setSfxMuted, playWinSound } from '../../utils/celebrate';
import { allResources, ALL_GRADES } from '../../data/learningResources';
import { gamesCatalog } from '../../data/gamesCatalog';
import { kruComSheetItems, KRU_COM_CATEGORIES } from '../../data/kruComSheetData';
import { kruComMissions } from '../../data/kruComMissions';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { trackMediaClick } from '../../services/progressService';
import { syncStudentGradesFromProgress } from '../../services/gameProgressService';
import {
  filterTargetUnitsForCourseAccess,
  getCourseAccessSettings,
} from '../../services/courseAccessService';
import './Games.css';
import './GameStyles.css';

/** แปลง targetUnits → "ป.1-3" หรือ "ป.4-ม.3" — ภาษาเด็ก ไม่โชว์เลข unit */
const formatGradeRange = (targetUnits: { gradeId: string }[]): string => {
  const grades = new Set<string>();
  targetUnits.forEach((tu) => {
    if (tu.gradeId.startsWith('p')) {
      const m = tu.gradeId.match(/^p(\d)/);
      if (m) grades.add(`p${m[1]}`);
    } else if (tu.gradeId.startsWith('m')) {
      const m = tu.gradeId.match(/^m(\d)/);
      if (m) grades.add(`m${m[1]}`);
    }
  });
  const pNums = [1, 2, 3, 4, 5, 6].filter((n) => grades.has(`p${n}`));
  const mNums = [1, 2, 3].filter((n) => grades.has(`m${n}`));
  const fmt = (nums: number[], prefix: string): string => {
    if (nums.length === 0) return '';
    if (nums.length === 1) return `${prefix}${nums[0]}`;
    const consecutive = nums.every((n, i) => i === 0 || n === nums[i - 1] + 1);
    if (consecutive) return `${prefix}${nums[0]}-${nums[nums.length - 1]}`;
    return nums.map((n) => `${prefix}${n}`).join(', ');
  };
  return [fmt(pNums, 'ป.'), fmt(mNums, 'ม.')].filter(Boolean).join(' + ') || 'ทุกชั้น';
};

const games = gamesCatalog;

type GradeFilter = 'all' | 'lower-primary' | 'upper-primary' | 'secondary';

const gradeFilters: { id: GradeFilter; label: string; range: [number, number] }[] = [
  { id: 'all', label: 'ทั้งหมด', range: [1, 9] },
  { id: 'lower-primary', label: 'ป.1-3', range: [1, 3] },
  { id: 'upper-primary', label: 'ป.4-6', range: [4, 6] },
  { id: 'secondary', label: 'ม.1-3', range: [7, 9] },
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
  const { user, partner, getActiveIds } = useAuth();
  const toast = useToast();
  const [extGrade, setExtGrade] = useState<string>('all');
  const [muted, setMuted] = useState<boolean>(isSfxMuted());
  const [query, setQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState<GradeFilter>('all');
  const [sheetCategory, setSheetCategory] = useState<string>('all');
  const [sheetQuery, setSheetQuery] = useState<string>('');
  const [sheetLimit, setSheetLimit] = useState<number>(12);

  const featuredGame = games.find((game) => game.id === 'digital-city-quest') || games[0];
  const filteredGames = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('th');
    return games.filter((game) => {
      const matchesQuery = !normalizedQuery || [
        game.title,
        game.desc,
        game.skill,
        game.level,
      ].some((value) => value.toLocaleLowerCase('th').includes(normalizedQuery));
      return matchesQuery && gameMatchesGrade(game.level, gradeFilter);
    });
  }, [gradeFilter, query]);

  // กรอง resources ที่เป็นเกมโค้ดดิ้งภายนอก (category = programming หรือ computational)
  const externalGames = useMemo(() => {
    const list = allResources.filter((r) =>
      r.category === 'programming' || r.category === 'computational'
    ).filter((r) => (
      !user ||
      r.targetUnits.length === 0 ||
      filterTargetUnitsForCourseAccess(user.classroom, r.targetUnits).length > 0
    ));
    if (extGrade === 'all') return list.slice(0, 24);
    return list.filter((r) => r.targetUnits.some((tu) => tu.gradeId === extGrade));
  }, [extGrade, user]);

  const filteredSheetItems = useMemo(() => {
    const q = sheetQuery.trim().toLowerCase();
    return kruComSheetItems.filter((item) => {
      const matchCat = sheetCategory === 'all' || item.category === sheetCategory;
      const matchQ =
        !q ||
        item.folder.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.cleanTitle.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [sheetCategory, sheetQuery]);

  const missionMapByFolder = useMemo(() => {
    const map = new Map<string, string>();
    kruComMissions.forEach((m) => {
      map.set(m.sheetFolder, m.id);
    });
    return map;
  }, []);

  const handleExternalClick = async (
    resourceId: string,
    title: string,
    targetUnits: { gradeId: string; unitNo: number }[],
  ) => {
    if (!user) {
      toast.show('💡 ล็อกอินก่อนกดเข้าเล่น — ระบบจะบันทึกคะแนน P ให้คุณ', 'info');
      return;
    }
    const ids = getActiveIds();
    const accessSettings = getCourseAccessSettings();
    const activeTargets = filterTargetUnitsForCourseAccess(
      user.classroom,
      targetUnits,
      accessSettings,
    );
    if (activeTargets.length === 0) {
      toast.show('กิจกรรมนี้อยู่ในคอร์สที่ยังไม่เปิดในเทอมนี้ จึงไม่บันทึกคะแนน', 'info');
      return;
    }
    // รอ trackMediaClick เสร็จก่อน sync — ไม่งั้น sync ใช้ data เก่า
    const writes: Promise<boolean>[] = [];
    activeTargets.forEach((tu) => {
      ids.forEach((id) => {
        writes.push(trackMediaClick(id, tu.gradeId, tu.unitNo, 'fun', `[ExternalGame:${resourceId}] ${title}`));
      });
    });
    const stored = await Promise.all(writes);
    if (!stored.every(Boolean)) {
      toast.show('บันทึกผลเกมลงฐานข้อมูลไม่สำเร็จ กรุณาตรวจอินเทอร์เน็ตแล้วลองใหม่', 'error');
      return;
    }
    await syncStudentGradesFromProgress({ id: user.id, name: user.name, classroom: user.classroom, studentNumber: user.studentNumber }, accessSettings);
    if (partner) {
      await syncStudentGradesFromProgress({ id: partner.id, name: partner.name, classroom: partner.classroom, studentNumber: partner.studentNumber }, accessSettings);
    }
    toast.show(`🎯 +5 XP · บันทึก "${title}" ลงคะแนน P แล้ว`, 'success');
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
            <span className="games-section-kicker"><Gamepad2 size={15} /> เกมของครูเจมส์</span>
            <h2 id="games-library-title">คลังเกมฝึกทักษะ</h2>
          </div>
          <span className="games-result-count">{filteredGames.length} เกม</span>
        </div>

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

        {filteredGames.length > 0 ? (
          <div className="games-grid">
            {filteredGames.map((g, i) => (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.035, 0.35) }}
              >
                <Link to={g.path} className="game-card-big" style={{ '--game-accent': g.color } as React.CSSProperties}>
                  <div className="gc-card-top">
                    <div className="gc-emoji" style={{ background: `${g.color}1f`, color: g.color }}>
                      {g.emoji}
                    </div>
                    <span className="gc-level">{g.level}</span>
                  </div>
                  <div className="gc-info">
                    <h3>{g.title}</h3>
                    <p>{g.desc}</p>
                  </div>
                  <div className="gc-cta">
                    <span className="gc-skill"><Sparkles size={14} /> {g.skill}</span>
                    <span className="gc-play" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="games-empty-state">
            <Search size={28} />
            <h3>ไม่พบเกมที่ตรงกับคำค้นหา</h3>
            <button type="button" onClick={() => { setQuery(''); setGradeFilter('all'); }}>แสดงเกมทั้งหมด</button>
          </div>
        )}
      </section>

      {/* ===== เกมออนไลน์จากเว็บภายนอก — แยกตามชั้น ===== */}
      <section className="external-games" aria-labelledby="external-games-title">
        <div className="games-section-heading external-heading">
          <div>
            <span className="games-section-kicker"><Globe size={15} /> แหล่งเรียนรู้เพิ่มเติม</span>
            <h2 id="external-games-title">เกมโค้ดดิ้งจากเว็บภายนอก</h2>
            <p>CodingThailand, Code.org, MakeCode, Microsoft และ micro:bit</p>
          </div>
          <ExternalLink size={24} />
        </div>

        <div className="external-grade-filter">
          <button
            type="button"
            onClick={() => setExtGrade('all')}
            className={extGrade === 'all' ? 'active' : ''}
          >
            ทุกชั้น
          </button>
          {ALL_GRADES.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => setExtGrade(g.id)}
              className={extGrade === g.id ? 'active' : ''}
            >
              {g.label}
            </button>
          ))}
        </div>

        {externalGames.length === 0 ? (
          <div className="games-empty-state compact">
            <p>ไม่มีเกมในชั้นนี้</p>
          </div>
        ) : (
          <div className="games-grid external-grid">
            {externalGames.map((r, i) => (
              <motion.a
                key={r.id}
                href={r.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => handleExternalClick(r.id, r.title, r.targetUnits)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                whileHover={{ y: -4 }}
                className="game-card-big external-game-card"
              >
                <div className="gc-card-top">
                  <div className="gc-emoji external-icon">{r.emoji}</div>
                  <ExternalLink size={17} className="external-link-icon" />
                </div>
                <div className="gc-info">
                  <div className="gc-tags">
                    {r.badge && (
                      <span className="gc-tag" style={{ background: '#fef3c7', color: '#92400e' }}>{r.badge}</span>
                    )}
                    <span className="gc-tag-skill">🎯 เหมาะกับ {formatGradeRange(r.targetUnits)}</span>
                  </div>
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </div>
                <div className="gc-cta">
                  <span className="gc-skill"><Globe size={14} /> เว็บไซต์ภายนอก</span>
                  <ChevronRight size={17} />
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>

      {/* ===== คลังสื่อใบงาน & บอร์ดเกมครูคอม (409 รายการจาก Google Sheets) ===== */}
      <section className="krucom-sheet-section" aria-labelledby="krucom-sheet-title" style={{ marginTop: 44 }}>
        <div className="games-section-heading external-heading">
          <div>
            <span className="games-section-kicker"><Sparkles size={15} /> คลังภารกิจเกมการเรียนรู้ 100+ ด่าน</span>
            <h2 id="krucom-sheet-title">มินิเกมดึงความรู้จากสื่อวิทยาการคำนวณ</h2>
            <p>ดึงโจทย์ สาระ และความรู้จากคลังสื่อกว่า 400 เรื่อง มาแปลงเป็นเกมฝึกทักษะบนเว็บให้นักเรียนกดเล่นได้จริงทุกด่าน</p>
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: 10,
              color: '#fbbf24',
              fontSize: '0.85rem',
              fontWeight: 700,
            }}
          >
            🎮 104 ด่านในระบบ
          </div>
        </div>

        {/* Arcade Feature Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(239, 68, 68, 0.12) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            margin: '16px 0 20px 0',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontWeight: 800, fontSize: '1.08rem' }}>
              <Sparkles size={18} /> 🕹️ Kru-Com 100+ Missions Arcade เปิดให้เล่นแล้ว!
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.84rem', marginTop: 4 }}>
              สังเคราะห์เป็น 104 ด่านเกม 4 โหมดการเรียนรู้ (คัดแยกหมวดหมู่, จับคู่คำศัพท์, เรียงลำดับขั้นตอน, ทายปัญหา) จากคลังสื่อ 409 ไฟล์
            </div>
          </div>
          <Link
            to="/games/krucom-arcade"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.9rem',
              borderRadius: 12,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Play size={16} /> เข้าสู่ Arcade 104 ด่าน ➔
          </Link>
        </div>

        {/* Filter categories & Search */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '18px 0' }}>
          <div className="games-search" style={{ maxWidth: 440 }}>
            <Search size={18} />
            <input
              type="text"
              placeholder="ค้นหาชื่อสื่อ, ใบงาน, บอร์ดเกม (เช่น Scratch, ผังงาน, พรบ, ป.4)..."
              value={sheetQuery}
              onChange={(e) => {
                setSheetQuery(e.target.value);
                setSheetLimit(12);
              }}
            />
            {sheetQuery && (
              <button type="button" onClick={() => setSheetQuery('')}>
                <X size={14} />
              </button>
            )}
          </div>

          <div className="external-grade-filter">
            <button
              type="button"
              onClick={() => { setSheetCategory('all'); setSheetLimit(12); }}
              className={sheetCategory === 'all' ? 'active' : ''}
            >
              ทั้งหมด (409)
            </button>
            {KRU_COM_CATEGORIES.map((cat) => {
              const count = kruComSheetItems.filter((i) => i.category === cat.key).length;
              return (
                <button
                  type="button"
                  key={cat.key}
                  onClick={() => { setSheetCategory(cat.key); setSheetLimit(12); }}
                  className={sheetCategory === cat.key ? 'active' : ''}
                >
                  {cat.icon} {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Grid of Sheet items */}
        {filteredSheetItems.length === 0 ? (
          <div className="games-empty-state compact">
            <p>ไม่พบสื่อที่ตรงกับคำค้นหาในหมวดนี้</p>
          </div>
        ) : (
          <>
            <div className="games-grid external-grid">
              {filteredSheetItems.slice(0, sheetLimit).map((item, i) => {
                const matchedMissionId = missionMapByFolder.get(item.folder);
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    whileHover={{ y: -3 }}
                    className="game-card-big external-game-card"
                    style={{ minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div className="gc-card-top">
                        <div className="gc-emoji external-icon">
                          {item.category === 'coding' && '🚀'}
                          {item.category === 'cyber-safety' && '🛡️'}
                          {item.category === 'hardware' && '🖥️'}
                          {item.category === 'office-tools' && '💼'}
                          {item.category === 'data-detective' && '🔍'}
                          {item.category === 'ai-tech' && '🤖'}
                          {item.category === 'general' && '📚'}
                        </div>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 6,
                            background: 'rgba(56, 189, 248, 0.15)',
                            color: '#38bdf8',
                          }}
                        >
                          {item.targetLevel}
                        </span>
                      </div>
                      <div className="gc-info">
                        <div className="gc-tags">
                          <span className="gc-tag" style={{ background: '#e0e7ff', color: '#3730a3' }}>
                            {item.folder}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '0.98rem', lineHeight: 1.4, margin: '6px 0' }}>
                          {item.title}
                        </h3>
                      </div>
                    </div>
                    <div className="gc-cta" style={{ marginTop: 12 }}>
                      <Link
                        to={matchedMissionId ? `/games/krucom-arcade?mission=${matchedMissionId}` : `/games/krucom-arcade`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          width: '100%',
                          padding: '8px 12px',
                          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                          color: '#fff',
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: '0.84rem',
                          textDecoration: 'none',
                          boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)',
                        }}
                      >
                        <Gamepad2 size={15} /> ▶️ เข้าเล่นเกมด่านนี้
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredSheetItems.length > sheetLimit && (
              <div style={{ textAlign: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  onClick={() => setSheetLimit((prev) => prev + 24)}
                  style={{
                    padding: '10px 24px',
                    borderRadius: 12,
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: '#f8fafc',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  แสดงสื่อเพิ่มเติม (เหลืออีก {filteredSheetItems.length - sheetLimit} รายการ)
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default Games;
