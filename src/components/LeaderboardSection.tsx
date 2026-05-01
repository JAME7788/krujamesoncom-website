import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Crown, TrendingUp } from 'lucide-react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import './LeaderboardSection.css';

interface LeaderEntry {
  name: string;
  classroom: string;
  totalPoints: number;
  studentNumber: string;
}

const LeaderboardSection: React.FC = () => {
  const [leaders, setLeaders] = useState<LeaderEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        const q = query(
          collection(db, 'students'),
          orderBy('totalPoints', 'desc'),
          limit(5)
        );
        const querySnapshot = await getDocs(q);
        const results: LeaderEntry[] = [];
        querySnapshot.forEach((doc) => {
          results.push(doc.data() as LeaderEntry);
        });
        setLeaders(results);
      } catch (err) {
        console.error("Error fetching leaderboard", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  if (loading) return null;

  return (
    <section className="leaderboard-section section-padding">
      <div className="container">
        <div className="section-header">
          <div className="header-icon-box">
            <Trophy className="icon-trophy" />
          </div>
          <h2>ทำเนียบสุดยอด <span>นักคิดเชิงคำนวณ</span></h2>
          <p>เหล่านักเรียนที่ทำคะแนนสะสมสูงสุด 5 อันดับแรกของโรงเรียน</p>
        </div>

        <div className="leaderboard-container glass">
          <div className="leader-grid">
            {leaders.map((leader, i) => {
              const isFirst = i === 0;
              const isSecond = i === 1;
              const isThird = i === 2;
              
              return (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`leader-card ${isFirst ? 'rank-1' : ''}`}
                >
                  <div className="rank-badge">
                    {isFirst ? <Crown size={24} /> : i + 1}
                  </div>
                  <div className="leader-avatar">
                    {isFirst || isSecond || isThird ? <Award className={`medal-${i+1}`} /> : <div className="avatar-placeholder">{leader.name ? leader.name[0] : '?'}</div>}
                  </div>
                  <div className="leader-info">
                    <h3>{leader.name}</h3>
                    <p>ชั้น {leader.classroom} • เลขที่ {leader.studentNumber}</p>
                  </div>
                  <div className="leader-score">
                    <span className="score-val">{leader.totalPoints || 0}</span>
                    <span className="score-label">คะแนน K</span>
                  </div>
                  {isFirst && <div className="sparkle"></div>}
                </motion.div>
              );
            })}
          </div>
          
          <div className="leader-footer">
            <p><TrendingUp size={16} /> สู้ต่อไปนะเด็กๆ คะแนนอัปเดตแบบเรียลไทม์!</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LeaderboardSection;
