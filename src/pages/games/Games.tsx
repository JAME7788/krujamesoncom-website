import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, ExternalLink, Globe, Volume2, VolumeX } from 'lucide-react';
import { isSfxMuted, setSfxMuted, playWinSound } from '../../utils/celebrate';
import { allResources, ALL_GRADES } from '../../data/learningResources';
import { gamesCatalog } from '../../data/gamesCatalog';
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

const Games: React.FC = () => {
  const { user, partner, getActiveIds } = useAuth();
  const toast = useToast();
  const [extGrade, setExtGrade] = useState<string>('all');
  const [muted, setMuted] = useState<boolean>(isSfxMuted());

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
      <div className="games-header">
        <span className="badge-yellow">
          <Sparkles size={16} /> Kru James Mini Games
        </span>
        <h1>🎮 เล่นและเรียนรู้</h1>
        <p>เกมที่สร้างขึ้นเพื่อฝึกทักษะคอมพิวเตอร์ — ไม่ต้องล็อกอิน เปิดเล่นได้เลย!</p>
        <button
          onClick={() => {
            const next = !muted;
            setMuted(next);
            setSfxMuted(next);
            if (!next) playWinSound();
          }}
          aria-label={muted ? 'เปิดเสียงฉลองเกม' : 'ปิดเสียงฉลองเกม'}
          title={muted ? 'เปิดเสียงฉลองเมื่อเล่นเกมจบ' : 'ปิดเสียงฉลองเมื่อเล่นเกมจบ'}
          style={{
            marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 999, cursor: 'pointer',
            border: `1.5px solid ${muted ? '#e5e7eb' : '#a5b4fc'}`,
            background: muted ? '#f9fafb' : '#eef2ff',
            color: muted ? '#9ca3af' : '#4f46e5', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
          }}
        >
          {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
          {muted ? 'เสียงฉลอง: ปิด' : 'เสียงฉลอง: เปิด'}
        </button>
      </div>

      <div className="games-grid">
        {games.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Link to={g.path} className="game-card-big" style={{ borderTopColor: g.color }}>
              <div className="gc-emoji" style={{ background: `${g.color}20`, color: g.color }}>
                {g.emoji}
              </div>
              <div className="gc-info">
                <div className="gc-tags">
                  <span className="gc-tag" style={{ background: `${g.color}20`, color: g.color }}>{g.level}</span>
                  <span className="gc-tag-skill">🎯 {g.skill}</span>
                </div>
                <h3>{g.title}</h3>
                <p>{g.desc}</p>
              </div>
              <div className="gc-cta">
                <span style={{ color: g.color }}>เริ่มเล่น</span>
                <ChevronRight size={18} style={{ color: g.color }} />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* ===== เกมออนไลน์จากเว็บภายนอก — แยกตามชั้น ===== */}
      <section style={{ marginTop: '3rem' }}>
        <div className="games-header" style={{ marginBottom: '1rem' }}>
          <span className="badge-yellow"><Globe size={14} /> External Games</span>
          <h2 style={{ marginTop: '0.5rem' }}>🌐 เกมโค้ดดิ้งจากเว็บภายนอก</h2>
          <p>คัดเลือกจาก CodingThailand, Code.org, MakeCode, Microsoft, micro:bit และอื่นๆ — กดเล่นแล้วจะนับเป็นคะแนน P อัตโนมัติ (ต้อง login)</p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: '1.25rem' }}>
          <button
            onClick={() => setExtGrade('all')}
            style={pillStyle(extGrade === 'all')}
          >
            🌍 ทุกชั้น
          </button>
          {ALL_GRADES.map((g) => (
            <button
              key={g.id}
              onClick={() => setExtGrade(g.id)}
              style={pillStyle(extGrade === g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>

        {externalGames.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <p>ไม่มีเกมในชั้นนี้</p>
          </div>
        ) : (
          <div className="games-grid">
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
                className="game-card-big"
                style={{ borderTopColor: '#6366f1', textDecoration: 'none', color: 'inherit' }}
              >
                <div className="gc-emoji" style={{ background: '#eef2ff', color: '#6366f1' }}>
                  {r.emoji}
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
                  <span style={{ color: '#6366f1' }}>เปิดเล่น</span>
                  <ExternalLink size={16} style={{ color: '#6366f1' }} />
                </div>
              </motion.a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

const pillStyle = (active: boolean): React.CSSProperties => ({
  padding: '6px 14px',
  borderRadius: 999,
  border: active ? '2px solid #6366f1' : '1px solid #e5e7eb',
  background: active ? '#eef2ff' : 'white',
  color: active ? '#6366f1' : '#374151',
  fontFamily: 'inherit',
  fontSize: '0.85rem',
  fontWeight: active ? 700 : 500,
  cursor: 'pointer',
});

export default Games;
