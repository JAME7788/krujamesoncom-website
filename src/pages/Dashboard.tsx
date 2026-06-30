import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  PlayCircle,
  Gamepad2,
  FileText,
  ChevronRight,
  Activity,
  Flame,
  Target,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getSummary, fetchStudentProgress } from '../services/progressService';
import type { ActivityType } from '../services/progressService';
import { findGrade } from '../data/curriculum';
import AnnouncementBanner from '../components/AnnouncementBanner';
import TrendChart from '../components/TrendChart';
import MyGradeCard from '../components/MyGradeCard';
import GamificationCard from '../components/GamificationCard';
import AchievementShowcase from '../components/AchievementShowcase';
import DailyQuestionWidget from '../components/DailyQuestionWidget';
import { getUpcomingEvents, eventTypeInfo } from '../services/calendarService';
import { loadSchedule, dayNames, minutesOf, fetchScheduleFromFirebase } from '../data/schedule';
import type { ClassSlot } from '../data/schedule';
import './Dashboard.css';

const activityIcon: Record<ActivityType, React.ReactNode> = {
  slide: <FileText size={16} />,
  video: <PlayCircle size={16} />,
  fun: <Gamepad2 size={16} />,
  article: <BookOpen size={16} />,
  quiz: <Award size={16} />,
};

const activityLabel: Record<ActivityType, string> = {
  slide: 'อ่านสไลด์',
  video: 'ดูวิดีโอ',
  fun: 'เล่นกิจกรรม',
  article: 'อ่านบทความ',
  quiz: 'ทำแบบทดสอบ',
};

const timeAgo = (ts: number): string => {
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} วินาทีที่แล้ว`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} นาทีที่แล้ว`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} ชั่วโมงที่แล้ว`;
  const day = Math.floor(hr / 24);
  return `${day} วันที่แล้ว`;
};

const Dashboard: React.FC = () => {
  const { user, partner, persistStudent } = useAuth();
  const [summary, setSummary] = useState(() =>
    user ? getSummary(user.id) : null
  );
  const [now, setNow] = useState(new Date());
  const [schedule, setSchedule] = useState<ClassSlot[]>(() => loadSchedule());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!user) return;

    const syncData = async () => {
      try {
        await persistStudent(user);
        if (partner) {
          await persistStudent(partner);
        }
        await fetchStudentProgress(user.id);
        if (partner) {
          await fetchStudentProgress(partner.id);
        }
        setSummary(getSummary(user.id));
        const remoteSlots = await fetchScheduleFromFirebase();
        if (remoteSlots) {
          setSchedule(remoteSlots);
        }
      } catch (e) {
        console.warn('Sync student progress/schedule failed', e);
      }
    };
    syncData();

    setTimeout(() => {
      if (user) setSummary(getSummary(user.id));
    }, 0);
    // refresh ทุก 15 วิ เผื่อมี activity ใหม่จากแท็บอื่น (ลดจาก 5 → 15 — เร็วพอ + ลด CPU)
    const id = setInterval(() => {
      if (user) setSummary(getSummary(user.id));
    }, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user || !summary) {
    return (
      <div className="dashboard container section-padding">
        <h1>กรุณาเข้าสู่ระบบก่อน</h1>
        <Link to="/login" className="btn-primary">เข้าสู่ระบบ</Link>
      </div>
    );
  }

  const stats = [
    {
      label: 'คะแนนเฉลี่ย',
      value: `${summary.averageScore}%`,
      sub: `จาก ${summary.units.filter((u) => u.bestQuizMax > 0).length} แบบทดสอบ`,
      icon: <TrendingUp />,
      color: '#22c55e',
    },
    {
      label: 'หน่วยที่เริ่มเรียน',
      value: `${summary.unitsStarted}`,
      sub: `เรียนจบแล้ว ${summary.unitsCompleted} หน่วย`,
      icon: <CheckCircle />,
      color: '#2196F3',
    },
    {
      label: 'สไลด์ที่อ่านแล้ว',
      value: `${summary.totalSlidesViewed}`,
      sub: 'หน้า รวมทุกหน่วย',
      icon: <FileText />,
      color: '#a855f7',
    },
    {
      label: 'กิจกรรม/สื่อที่เล่น',
      value: `${summary.totalActivities}`,
      sub: 'รายการ',
      icon: <Gamepad2 />,
      color: '#FF9800',
    },
    {
      label: 'คะแนนสะสม',
      value: `${summary.totalPoints}`,
      sub: 'คะแนน',
      icon: <Award />,
      color: '#ef4444',
    },
  ];

  // Trend data — คะแนนควิซต่อวัน
  const trendData = (() => {
    const byDay: Record<string, { total: number; count: number }> = {};
    summary.recentAttempts.forEach((a) => {
      const d = new Date(a.timestamp);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!byDay[k]) byDay[k] = { total: 0, count: 0 };
      byDay[k].total += a.percentage;
      byDay[k].count += 1;
    });
    return Object.entries(byDay)
      .map(([date, v]) => ({ date, value: Math.round(v.total / v.count) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  })();

  const upcomingEvents = getUpcomingEvents(user.classroom, 14);

  // Calculate schedule information for user
  const mySlots = schedule.filter((s) => s.classroom === user.classroom);
  const todayDay = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const activeSlot = mySlots.find(
    (s) =>
      s.day === todayDay &&
      currentMinutes >= minutesOf(s.start) &&
      currentMinutes < minutesOf(s.end)
  );

  const upcomingToday = mySlots
    .filter((s) => s.day === todayDay && minutesOf(s.start) > currentMinutes)
    .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))[0];

  let nextSlot: ClassSlot | null = null;
  let daysUntilNext = 0;
  if (!activeSlot && !upcomingToday && mySlots.length > 0) {
    const sortedSlots = [...mySlots].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return minutesOf(a.start) - minutesOf(b.start);
    });
    const laterSlot = sortedSlots.find((s) => s.day > todayDay);
    if (laterSlot) {
      nextSlot = laterSlot;
      daysUntilNext = laterSlot.day - todayDay;
    } else {
      nextSlot = sortedSlots[0];
      daysUntilNext = 7 - todayDay + nextSlot.day;
    }
  }

  const getCountdownSecs = () => {
    const nowSecs = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    if (activeSlot) {
      const [endH, endM] = activeSlot.end.split(':').map(Number);
      return endH * 3600 + endM * 60 - nowSecs;
    }
    if (upcomingToday) {
      const [startH, startM] = upcomingToday.start.split(':').map(Number);
      return startH * 3600 + startM * 60 - nowSecs;
    }
    return 0;
  };

  const countdownSecs = getCountdownSecs();
  const formatCountdown = (secs: number) => {
    if (secs <= 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    const hStr = h > 0 ? `${h}:` : '';
    const mStr = String(m).padStart(2, '0');
    const sStr = String(s).padStart(2, '0');
    return `${hStr}${mStr}:${sStr}`;
  };

  return (
    <div className="dashboard container section-padding page-transition">
      {/* ANNOUNCEMENTS */}
      <AnnouncementBanner />

      {/* HEADER */}
      <div className="dashboard-header">
        <div className="user-welcome">
          <h1>
            สวัสดี, <span>{user.name}</span> 👋
          </h1>
          <p>
            ชั้น {user.classroom} • เลขที่ {user.studentNumber}
            {summary.lastActive ? ` • ใช้งานล่าสุด ${timeAgo(summary.lastActive)}` : ''}
          </p>
          <div className="db-status connected">
            <Activity size={14} /> ระบบบันทึกการเรียนทำงานปกติ
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link to="/courses" className="btn-primary">
            <BookOpen size={18} /> ไปเรียนต่อ
          </Link>
          <Link to="/report-card" className="btn-secondary" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '0.65rem 1rem', background: 'white',
            border: '1px solid #e5e7eb', borderRadius: 10,
            fontWeight: 600, color: '#374151', textDecoration: 'none',
          }}>
            🎓 สมุดรายงานผลการเรียน
          </Link>
        </div>
      </div>

      {/* SCHEDULE INDICATOR BANNER */}
      {mySlots.length > 0 && (
        <div
          className="schedule-banner"
          style={{
            background: activeSlot
              ? 'linear-gradient(135deg, #ef4444 0%, #ec4899 100%)'
              : upcomingToday
              ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          }}
        >
          <div className="schedule-banner-content">
            <div className="schedule-badge">
              {activeSlot ? (
                <>
                  <span className="schedule-badge-pulse" />
                  กำลังเรียนอยู่ขณะนี้
                </>
              ) : upcomingToday ? (
                '⏳ คาบเรียนถัดไปวันนี้'
              ) : (
                '📅 ตารางเรียนถัดไป'
              )}
            </div>
            <div className="schedule-text">
              {activeSlot ? (
                <>
                  <h3>วิชา{activeSlot.subject || 'เทคโนโลยี'} (ชั้น {user.classroom})</h3>
                  <p>คาบเรียนกำลังดำเนินอยู่! กรุณาตั้งใจเรียนและเข้าทำกิจกรรม/แบบทดสอบ</p>
                </>
              ) : upcomingToday ? (
                <>
                  <h3>วิชา{upcomingToday.subject || 'เทคโนโลยี'} (ชั้น {user.classroom})</h3>
                  <p>เวลา {upcomingToday.start} - {upcomingToday.end} น. เตรียมตัวให้พร้อมสำหรับการเรียนรู้!</p>
                </>
              ) : nextSlot ? (
                <>
                  <h3>วิชา{nextSlot.subject || 'เทคโนโลยี'} (ชั้น {user.classroom})</h3>
                  <p>วัน{dayNames[nextSlot.day]} เวลา {nextSlot.start} - {nextSlot.end} น. (อีก {daysUntilNext} วัน)</p>
                </>
              ) : null}
            </div>
          </div>

          {(activeSlot || upcomingToday) && (
            <div className="schedule-countdown-box">
              <span className="schedule-countdown-val">{formatCountdown(countdownSecs)}</span>
              <span className="schedule-countdown-lbl">
                {activeSlot ? 'เหลือเวลาอีก' : 'จะเริ่มในอีก'}
              </span>
            </div>
          )}

          {activeSlot && (
            <div className="schedule-banner-actions">
              <Link to="/courses" className="schedule-btn">
                เข้าสู่บทเรียนทันที →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Daily Question — ครูตั้งคำถามวัน */}
      <DailyQuestionWidget studentId={user.id} />

      {/* XP / Level / Streak — Gamification */}
      <GamificationCard studentId={user.id} />

      {/* คะแนนของฉัน */}
      <MyGradeCard
        classroom={user.classroom}
        studentNumber={user.studentNumber}
        name={user.name}
      />

      {/* Achievement badges */}
      <AchievementShowcase studentId={user.id} />

      {/* STATS */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="stat-card glass"
          >
            <div className="stat-icon" style={{ color: stat.color }}>
              {stat.icon}
            </div>
            <div className="stat-info">
              <p>{stat.label}</p>
              <h3>{stat.value}</h3>
              <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                {stat.sub}
              </small>
            </div>
          </motion.div>
        ))}
      </div>

      {/* MAIN GRID */}
      <div className="dashboard-main">
        <div className="main-left">
          {/* PROGRESS PER UNIT */}
          <section className="section-card glass">
            <div className="card-header">
              <h3>
                <Target size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                ความก้าวหน้ารายหน่วย
              </h3>
              <Link to="/courses">ดูทั้งหมด</Link>
            </div>
            {summary.units.length === 0 ? (
              <div className="empty-state">
                <p>ยังไม่มีข้อมูลการเรียน เริ่มเรียนหน่วยแรกเลย!</p>
                <Link to="/courses" className="btn-primary">
                  เลือกคอร์สเรียน <ChevronRight size={16} />
                </Link>
              </div>
            ) : (
              <div className="unit-progress-list">
                {summary.units
                  .sort((a, b) => b.updatedAt - a.updatedAt)
                  .slice(0, 8)
                  .map((u) => {
                    const [gradeId, unitNoStr] = u.key.split('_');
                    const grade = findGrade(gradeId);
                    const unitNo = parseInt(unitNoStr);
                    const unit = grade?.units?.find((x) => x.no === unitNo);
                    return (
                      <Link
                        key={u.key}
                        to={`/curriculum/${gradeId}/unit/${unitNo}`}
                        className="unit-progress-item"
                      >
                        <div className="upi-emoji">{grade?.emoji || '📘'}</div>
                        <div className="upi-info">
                          <h4>
                            {grade?.title || gradeId} • หน่วย {unitNo}
                          </h4>
                          <p>{unit?.title || `หน่วยที่ ${unitNo}`}</p>
                          <div className="upi-stats">
                            <span>
                              <FileText size={12} /> {u.slidesViewed.length}/{u.totalSlides || '-'}
                            </span>
                            <span>
                              <PlayCircle size={12} /> {u.videosClicked.length}
                            </span>
                            <span>
                              <Gamepad2 size={12} /> {u.funClicked.length}
                            </span>
                            <span>
                              <Award size={12} /> {u.bestQuizScore}/{u.bestQuizMax || '-'}
                            </span>
                          </div>
                        </div>
                        <div className="upi-pct">
                          <div className="pct-ring">
                            <svg width="56" height="56" viewBox="0 0 56 56">
                              <circle cx="28" cy="28" r="24" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke={u.completionPct >= 80 ? '#22c55e' : u.completionPct >= 40 ? '#f59e0b' : '#3b82f6'}
                                strokeWidth="4"
                                fill="none"
                                strokeDasharray={`${(u.completionPct / 100) * 150.8} 150.8`}
                                strokeLinecap="round"
                                transform="rotate(-90 28 28)"
                              />
                            </svg>
                            <span className="pct-text">{u.completionPct}%</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
              </div>
            )}
          </section>

          {/* RECENT QUIZ ATTEMPTS */}
          <section className="section-card glass">
            <div className="card-header">
              <h3>
                <Award size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                ผลแบบทดสอบล่าสุด
              </h3>
            </div>
            {summary.recentAttempts.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>
                ยังไม่มีการทำแบบทดสอบ — ลองทำเพื่อสะสมคะแนนกันเลย!
              </p>
            ) : (
              <div className="grade-list">
                {summary.recentAttempts.map((a, i) => {
                  const grade = findGrade(a.gradeId);
                  const unit = grade?.units?.find((x) => x.no === a.unitNo);
                  return (
                    <div key={i} className="grade-item">
                      <div className="g-info">
                        <h4>
                          {grade?.title || a.gradeId} • หน่วย {a.unitNo}
                          {unit ? ` — ${unit.title}` : ''}
                        </h4>
                        <p>{timeAgo(a.timestamp)}</p>
                      </div>
                      <div className="g-result">
                        <span className="grade-value">
                          {a.score}/{a.maxScore}
                        </span>
                        <span
                          className="grade-status"
                          style={{
                            color:
                              a.percentage >= 80
                                ? '#22c55e'
                                : a.percentage >= 50
                                ? '#f59e0b'
                                : '#ef4444',
                          }}
                        >
                          {a.percentage >= 80
                            ? 'ดีเยี่ยม'
                            : a.percentage >= 50
                            ? 'ผ่าน'
                            : 'ต้องปรับปรุง'}{' '}
                          ({a.percentage}%)
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        <div className="main-right">
          {/* TREND CHART */}
          {trendData.length > 0 && (
            <section className="section-card glass">
              <h3>📈 พัฒนาการคะแนน (ตามวัน)</h3>
              <TrendChart data={trendData} title="" color="#6366f1" />
            </section>
          )}

          {/* UPCOMING EVENTS */}
          {upcomingEvents.length > 0 && (
            <section className="section-card glass">
              <h3>📅 กิจกรรมที่กำลังจะถึง</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {upcomingEvents.slice(0, 5).map((e) => {
                  const info = eventTypeInfo[e.type];
                  const days = Math.ceil((new Date(e.date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  return (
                    <div key={e.id} style={{
                      display: 'flex', gap: 10, padding: 10, borderRadius: 10,
                      background: '#fafafa', borderLeft: `3px solid ${info.color}`,
                    }}>
                      <div style={{ fontSize: '1.4rem' }}>{e.emoji || info.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <strong style={{ fontSize: '0.9rem' }}>{e.title}</strong>
                        <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                          {info.label} • {e.date}
                          {e.time && ` ${e.time}`}
                        </div>
                      </div>
                      <span style={{
                        fontSize: '0.72rem', fontWeight: 700,
                        color: days <= 1 ? '#ef4444' : days <= 3 ? '#f59e0b' : '#16a34a',
                        whiteSpace: 'nowrap',
                      }}>
                        {days === 0 ? 'วันนี้!' : days === 1 ? 'พรุ่งนี้' : `อีก ${days} วัน`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* RECENT ACTIVITY */}
          <section className="section-card glass">
            <h3>
              <Flame size={20} style={{ verticalAlign: 'middle', marginRight: 6 }} />
              กิจกรรมล่าสุด
            </h3>
            {summary.recentActivities.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>เริ่มเรียนเพื่อเก็บประวัติกิจกรรม</p>
            ) : (
              <div className="activity-feed">
                {summary.recentActivities.slice(0, 10).map((a, i) => {
                  const grade = findGrade(a.gradeId);
                  return (
                    <div key={i} className="activity-row">
                      <div
                        className="activity-icon"
                        style={{
                          background:
                            a.type === 'quiz'
                              ? '#fef3c7'
                              : a.type === 'slide'
                              ? '#dbeafe'
                              : a.type === 'fun'
                              ? '#fed7aa'
                              : a.type === 'video'
                              ? '#fce7f3'
                              : '#dcfce7',
                        }}
                      >
                        {activityIcon[a.type]}
                      </div>
                      <div className="activity-text">
                        <h5>
                          {activityLabel[a.type]}
                          {a.detail ? ` — ${a.detail}` : ''}
                          {a.type === 'slide' && a.index !== undefined ? ` หน้า ${a.index + 1}` : ''}
                        </h5>
                        <p>
                          {grade?.title || a.gradeId} • หน่วย {a.unitNo} • {timeAgo(a.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* TIPS */}
          <section className="section-card glass promo">
            <Clock size={36} />
            <h3>เคล็ดลับวันนี้</h3>
            <p>
              ทำแบบทดสอบทุกหน่วยเพื่อปลดล็อคคะแนน 100%! อ่านสไลด์ + ดูวิดีโอ + ลองเล่นกิจกรรม ก่อนทำควิซจะคะแนนดีขึ้น 🚀
            </p>
            <Link to="/courses" className="btn-outline">
              ไปที่คอร์สเรียน
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
