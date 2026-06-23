import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight, ExternalLink, Globe } from 'lucide-react';
import { allResources, ALL_GRADES } from '../../data/learningResources';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { trackMediaClick } from '../../services/progressService';
import { syncStudentGradesFromProgress } from '../../services/gameProgressService';
import './Games.css';
import './GameStyles.css';

interface GameInfo {
  id: string;
  title: string;
  desc: string;
  emoji: string;
  level: string;
  skill: string;
  color: string;
  path: string;
}

const games: GameInfo[] = [
  {
    id: 'mouse',
    title: 'ภารกิจเมาส์แม่นยำ',
    desc: 'ฝึกคลิก ดับเบิลคลิก ลากวาง — เป้าหมายเคลื่อนที่ได้!',
    emoji: '🖱️',
    level: 'ป.1-3',
    skill: 'ใช้เมาส์',
    color: '#3b82f6',
    path: '/games/mouse-practice',
  },
  {
    id: 'keyboard',
    title: 'นักสำรวจคีย์บอร์ด',
    desc: 'พิมพ์ตามตัวอักษรที่ตกลงมา — เร็วที่สุด!',
    emoji: '⌨️',
    level: 'ป.1-6',
    skill: 'พิมพ์',
    color: '#8b5cf6',
    path: '/games/keyboard-practice',
  },
  {
    id: 'algorithm',
    title: 'จัดอัลกอริทึม',
    desc: 'ลากขั้นตอนให้เรียงถูกลำดับ — ฝึกคิดเป็นขั้นตอน',
    emoji: '🧩',
    level: 'ป.4-ม.3',
    skill: 'อัลกอริทึม',
    color: '#22c55e',
    path: '/games/algorithm-sorter',
  },
  {
    id: 'binary',
    title: 'แปลงเลขฐานสอง',
    desc: 'แปลงเลข 0-255 เป็น binary — ฝึกคิดแบบคอมพิวเตอร์',
    emoji: '🔢',
    level: 'ม.1-3',
    skill: 'เลขฐาน',
    color: '#f59e0b',
    path: '/games/binary',
  },
  {
    id: 'memory',
    title: 'จับคู่ความจำ',
    desc: 'พลิกการ์ดหาคู่ที่เหมือนกัน — ฝึกความจำและสมาธิ',
    emoji: '🃏',
    level: 'ป.1-6',
    skill: 'ความจำ',
    color: '#ec4899',
    path: '/games/memory',
  },
  {
    id: 'pattern',
    title: 'หาแพทเทิร์น',
    desc: 'ทายตัวต่อไปในลำดับ — ฝึก Pattern Recognition',
    emoji: '🔍',
    level: 'ป.3-ม.3',
    skill: 'หาแพทเทิร์น',
    color: '#06b6d4',
    path: '/games/pattern',
  },
  {
    id: 'maze',
    title: '🤖 Coding Maze',
    desc: 'ลากบล็อก ↑↓←→ พาหุ่นยนต์ฝ่ามาเก็บดาวและหาเป้าหมาย — เริ่มต้นเขียนโปรแกรมแบบจริงจัง!',
    emoji: '🤖',
    level: 'ป.2-ม.3',
    skill: 'เขียนโปรแกรม',
    color: '#7c3aed',
    path: '/games/coding-maze',
  },
  {
    id: 'snake',
    title: '🐍 งูกินผลไม้',
    desc: 'เกมงูคลาสสิก! บังคับงูกินผลไม้ให้นานที่สุด — ฝึก Loop และ Conditional แบบเห็นภาพ',
    emoji: '🐍',
    level: 'ทุกระดับ',
    skill: 'การคิดเชิงตรรกะ',
    color: '#16a34a',
    path: '/games/snake',
  },
  {
    id: 'bug',
    title: '🐞 จับบั๊ก',
    desc: 'จับบั๊กให้ทันก่อนหนี! แต่ระวัง 🦋 ห้ามตี — สนุก ตื่นเต้น เร็วขึ้นเรื่อยๆ',
    emoji: '🐞',
    level: 'ทุกระดับ',
    skill: 'Debug + ตอบสนอง',
    color: '#dc2626',
    path: '/games/bug-catcher',
  },
];

const Games: React.FC = () => {
  const { user, partner, getActiveIds } = useAuth();
  const toast = useToast();
  const [extGrade, setExtGrade] = useState<string>('all');

  // กรอง resources ที่เป็นเกมโค้ดดิ้งภายนอก (category = programming หรือ computational)
  const externalGames = useMemo(() => {
    const list = allResources.filter((r) =>
      r.category === 'programming' || r.category === 'computational'
    );
    if (extGrade === 'all') return list.slice(0, 24);
    return list.filter((r) => r.targetUnits.some((tu) => tu.gradeId === extGrade));
  }, [extGrade]);

  const handleExternalClick = (
    resourceId: string,
    title: string,
    targetUnits: { gradeId: string; unitNo: number }[],
  ) => {
    if (!user) {
      toast.show('💡 ล็อกอินก่อนกดเข้าเล่น — ระบบจะบันทึกคะแนน P ให้คุณ', 'info');
      return;
    }
    const ids = getActiveIds();
    targetUnits.forEach((tu) => {
      ids.forEach((id) => {
        void trackMediaClick(id, tu.gradeId, tu.unitNo, 'fun', `[ExternalGame:${resourceId}] ${title}`);
      });
    });
    // sync grades
    syncStudentGradesFromProgress({ id: user.id, name: user.name, classroom: user.classroom, studentNumber: user.studentNumber });
    if (partner) {
      syncStudentGradesFromProgress({ id: partner.id, name: partner.name, classroom: partner.classroom, studentNumber: partner.studentNumber });
    }
    toast.show(`🎯 บันทึกกิจกรรม "${title}" ลงคะแนน P แล้ว`, 'success');
  };

  return (
    <div className="games-hub container section-padding">
      <div className="games-header">
        <span className="badge-yellow">
          <Sparkles size={16} /> Kru James Mini Games
        </span>
        <h1>🎮 เล่นและเรียนรู้</h1>
        <p>เกมที่สร้างขึ้นเพื่อฝึกทักษะคอมพิวเตอร์ — ไม่ต้องล็อกอิน เปิดเล่นได้เลย!</p>
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
                    <span className="gc-tag-skill">🎯 P: {r.targetUnits.length} หน่วย</span>
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
