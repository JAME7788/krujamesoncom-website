import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, TrendingUp, Sparkles, Medal } from 'lucide-react';
import { getLeaderboard, refreshLeaderboardFromCloud } from '../services/leaderboardService';
import type { LeaderboardEntry } from '../services/leaderboardService';
import { allClassrooms2569 } from '../data/students2569';
import { anonymizeStudentName } from '../utils/anonymize';
import './LeaderboardSection.css';

const LeaderboardSection: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    const reload = () => {
      const data = getLeaderboard({
        classroom: filter === 'all' ? undefined : filter,
        limit: 10,
      });
      setLeaders(data);
    };
    reload();
    // ดึง progress ข้ามเครื่องจาก Firebase ครั้งแรก แล้ว reload
    void refreshLeaderboardFromCloud().then(() => reload());
    const t = setInterval(reload, 30000); // refresh every 30s — เด็กไม่ต้องเห็นอันดับสดๆ
    return () => clearInterval(t);
  }, [filter]);

  return (
    <section className="leaderboard-section section-padding">
      <div className="container">
        <div className="section-header">
          <span className="badge-yellow"><Trophy size={14} /> Top Achievers</span>
          <h2>ทำเนียบสุดยอด <span>นักคิดเชิงคำนวณ</span></h2>
          <p>นักเรียนที่ทำคะแนนสะสมสูงสุดจากการเรียนในเว็บ • อัปเดตเรียลไทม์</p>
        </div>

        {/* Filter pills */}
        <div className="lb-filter">
          <button
            className={`lb-pill ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            🌍 ทุกห้อง
          </button>
          {allClassrooms2569.map((c) => (
            <button
              key={c}
              className={`lb-pill ${filter === c ? 'active' : ''}`}
              onClick={() => setFilter(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {leaders.length === 0 ? (
          <div className="lb-empty">
            <p>🎓 ยังไม่มีข้อมูล — ให้นักเรียน login + ทำกิจกรรมในเว็บ คะแนนจะปรากฏที่นี่</p>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="leaderboard-container"
          >
            <div className="leader-grid">
              {leaders.map((leader, i) => {
                const isFirst = i === 0;
                const isSecond = i === 1;
                const isThird = i === 2;
                return (
                  <motion.div
                    key={leader.studentId}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className={`leader-card ${isFirst ? 'rank-1' : isSecond ? 'rank-2' : isThird ? 'rank-3' : ''}`}
                  >
                    <div className="rank-badge">
                      {isFirst ? <Crown size={20} /> : isSecond || isThird ? <Medal size={18} /> : leader.rank}
                    </div>
                    <div className="leader-avatar">
                      <span style={{ fontSize: '1.8rem' }}>{leader.emoji}</span>
                    </div>
                    <div className="leader-info">
                      <h3>{anonymizeStudentName(leader.name, leader.studentNo, leader.classroom)}</h3>
                      <p>ชั้น {leader.classroom} • เลขที่ {leader.studentNo}</p>
                      <div className="leader-mini-stats">
                        📄 {leader.totalSlides} • 🎮 {leader.totalActivities} • ✓ {leader.unitsCompleted}
                      </div>
                    </div>
                    <div className="leader-score">
                      <span className="score-val">{leader.totalPoints}</span>
                      <span className="score-label">Points</span>
                    </div>
                    {isFirst && <div className="sparkle"><Sparkles size={16} /></div>}
                  </motion.div>
                );
              })}
            </div>

            <div className="leader-footer">
              <p><TrendingUp size={16} /> รวม {leaders.length} อันดับ • อัปเดตทุก 10 วินาที</p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
};

export default LeaderboardSection;
