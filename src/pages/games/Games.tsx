import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ChevronRight } from 'lucide-react';
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
    </div>
  );
};

export default Games;
