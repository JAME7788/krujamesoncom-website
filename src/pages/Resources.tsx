import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ExternalLink, Search, Award, CheckCircle2, Info } from 'lucide-react';
import { allResources, categoryInfo, ALL_GRADES } from '../data/learningResources';
import type { LearningResource, ResourceCategory } from '../data/learningResources';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { trackMediaClick } from '../services/progressService';
import { syncFromProgress, loadGrades } from '../services/gradeService';
import './Resources.css';

/** แปลง targetUnits → "ป.1-3" หรือ "ป.4-ม.3" (ภาษาเด็ก ไม่โชว์เลข unit ของหลักสูตร) */
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
  const parts = [fmt(pNums, 'ป.'), fmt(mNums, 'ม.')].filter(Boolean);
  return parts.join(' + ') || 'ทุกชั้น';
};

const Resources: React.FC = () => {
  const { user, partner, getActiveIds } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<ResourceCategory | 'all'>('all');
  const [activeGrade, setActiveGrade] = useState<string>('all');

  const filtered = useMemo(() => {
    let list = allResources;
    if (activeCat !== 'all') list = list.filter((r) => r.category === activeCat);
    if (activeGrade !== 'all') {
      list = list.filter((r) => r.targetUnits.some((tu) => tu.gradeId === activeGrade));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.desc.toLowerCase().includes(q) ||
          r.category.includes(q)
      );
    }
    return list;
  }, [search, activeCat, activeGrade]);

  const handleClick = (r: LearningResource) => {
    if (r.targetUnits.length === 0) {
      toast.show(`เปิดแหล่งเรียนรู้: ${r.title}`, 'info');
      return;
    }

    if (!user) {
      toast.show('💡 ล็อกอินก่อนกดเข้าใช้งาน — ระบบจะบันทึกคะแนน P ให้คุณ', 'info');
      return;
    }

    const ids = getActiveIds();
    let totalAwards = 0;

    // บันทึก fun click ให้ทุก unit ที่ resource นี้ตรงกับ
    r.targetUnits.forEach((tu) => {
      ids.forEach((id) => {
        trackMediaClick(id, tu.gradeId, tu.unitNo, 'fun', `[Resource] ${r.title}`);
      });
      totalAwards += 1;
    });

    // sync K/P/A ให้ครบ (P จะอัปเดต)
    if (user) {
      try {
        const grades = loadGrades(user.classroom);
        const myGrade = grades.find(
          (g) => g.studentNo === parseInt(user.studentNumber) || g.name === user.name
        );
        if (myGrade) syncFromProgress(user.classroom, myGrade.studentCode, user.id);
      } catch (e) {
        console.warn('Sync student progress failed', e);
      }
      if (partner) {
        try {
          const pGrades = loadGrades(partner.classroom);
          const pg = pGrades.find(
            (g) => g.studentNo === parseInt(partner.studentNumber) || g.name === partner.name
          );
          if (pg) syncFromProgress(partner.classroom, pg.studentCode, partner.id);
        } catch (e) {
          console.warn('Sync partner progress failed', e);
        }
      }
    }

    toast.show(
      `🎯 +1 ทักษะ (P) ในตัวชี้วัดที่เกี่ยวข้อง ${totalAwards} หน่วย${partner ? ' (ทั้ง 2 คน)' : ''}`,
      'success'
    );
  };

  const cats: (ResourceCategory | 'all')[] = ['all', 'basic', 'programming', 'computational', 'data', 'safety', 'ai', 'design'];

  return (
    <div className="resources-page page-transition container section-padding">
      <header className="resources-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="badge-yellow"><Sparkles size={16} /> Kru James Library</span>
          <h1>แหล่งเรียนรู้เสริม & เครื่องมือดิจิทัล</h1>
          <p>
            รวมเครื่องมือ <strong>{allResources.length} รายการ</strong> สำหรับเขียนโปรแกรม
            คิดเชิงคำนวณ AI ออกแบบเทคโนโลยี และความปลอดภัยดิจิทัล
          </p>
          {user && (
            <div className="resources-info">
              <Award size={16} />
              <strong>ทุกครั้งที่กดเข้าใช้งาน</strong> ระบบจะบันทึกคะแนน <span className="p-badge">P (ทักษะ)</span>
              ให้กับตัวชี้วัดที่เกี่ยวข้องโดยอัตโนมัติ
            </div>
          )}
          {!user && (
            <div className="resources-info warn">
              <Info size={16} />
              <span>💡 <a href="/login">เข้าสู่ระบบ</a> ก่อน — ระบบจะได้บันทึกคะแนน P ให้คุณตามตัวชี้วัด</span>
            </div>
          )}
        </motion.div>
      </header>

      {/* Search + Category filter */}
      <div className="resources-toolbar">
        <div className="resources-search">
          <Search size={18} />
          <input
            type="text"
            placeholder="ค้นหาเครื่องมือ... เช่น เมาส์, Scratch, AI, micro:bit"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="cat-pills">
          {cats.map((c) => (
            <button
              key={c}
              className={`cat-pill ${activeCat === c ? 'active' : ''}`}
              onClick={() => setActiveCat(c)}
            >
              {c === 'all' ? '🌟 ทั้งหมด' : `${categoryInfo[c].emoji} ${categoryInfo[c].title.split(' ')[0]}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grade filter — แยกตามชั้น (เลือกชั้นเดียวเพื่อดูเฉพาะที่ตรง) */}
      <div className="resources-toolbar" style={{ marginTop: '0.5rem' }}>
        <strong style={{ fontSize: '0.85rem', color: 'var(--text-muted, #6b7280)', alignSelf: 'center' }}>
          📚 แยกตามชั้น:
        </strong>
        <div className="cat-pills">
          <button
            className={`cat-pill ${activeGrade === 'all' ? 'active' : ''}`}
            onClick={() => setActiveGrade('all')}
          >
            🌍 ทุกชั้น
          </button>
          {ALL_GRADES.map((g) => (
            <button
              key={g.id}
              className={`cat-pill ${activeGrade === g.id ? 'active' : ''}`}
              onClick={() => setActiveGrade(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {/* Group by category */}
      {activeCat === 'all' ? (
        Object.keys(categoryInfo).map((cat) => {
          const items = filtered.filter((r) => r.category === cat);
          if (items.length === 0) return null;
          const info = categoryInfo[cat as ResourceCategory];
          return (
            <section key={cat} className="resource-section">
              <div className="section-title">
                <span style={{ fontSize: '2rem' }}>{info.emoji}</span>
                <div>
                  <h2 style={{ color: info.color }}>{info.title}</h2>
                  <p style={{ margin: 0, color: 'var(--text-muted, #6b7280)', fontSize: '0.9rem' }}>{info.desc}</p>
                </div>
              </div>
              <ResourceGrid items={items} onClick={handleClick} />
            </section>
          );
        })
      ) : (
        <section className="resource-section">
          <div className="section-title">
            <span style={{ fontSize: '2rem' }}>{categoryInfo[activeCat].emoji}</span>
            <div>
              <h2 style={{ color: categoryInfo[activeCat].color }}>{categoryInfo[activeCat].title}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted, #6b7280)', fontSize: '0.9rem' }}>{categoryInfo[activeCat].desc}</p>
            </div>
          </div>
          <ResourceGrid items={filtered} onClick={handleClick} />
        </section>
      )}

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>ไม่พบเครื่องมือที่ค้นหา</p>
        </div>
      )}
    </div>
  );
};

const ResourceGrid: React.FC<{ items: LearningResource[]; onClick: (r: LearningResource) => void }> = ({ items, onClick }) => (
  <div className="resources-cards-grid">
    {items.map((r, i) => (
      <motion.a
        key={r.id}
        href={r.url}
        target="_blank"
        rel="noreferrer"
        onClick={() => onClick(r)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        whileHover={{ y: -4 }}
        className="lr-card"
      >
        <div className="lr-emoji">{r.emoji}</div>
        <div className="lr-body">
          <div className="lr-head">
            <h3>{r.title}</h3>
            {r.badge && <span className="lr-badge">{r.badge}</span>}
          </div>
          <p className="lr-desc">{r.desc}</p>
          {r.targetUnits.length > 0 && (
            <div className="lr-tags">
              <CheckCircle2 size={12} />
              <span>เหมาะกับ <strong>{formatGradeRange(r.targetUnits)}</strong></span>
              <span className="lr-tag" style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700 }}>
                🎯 +P
              </span>
            </div>
          )}
        </div>
        <ExternalLink size={16} className="lr-ext" />
      </motion.a>
    ))}
  </div>
);

export default Resources;
