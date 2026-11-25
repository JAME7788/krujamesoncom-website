import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Play,
  Book,
  BarChart3,
  ShieldCheck,
  Heart,
  Users,
  Target,
  Zap,
  Globe,
  Sparkles,
  Gamepad2,
  ClipboardCheck,
  Box,
  Radio,
} from 'lucide-react';
import LeaderboardSection from '../components/LeaderboardSection';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { useAuth } from '../context/AuthContext';
import { isAdminPortalUser, isScoreEligibleUser } from '../services/userAccessService';
import { getStudentWorkStatusOverview } from '../services/homeworkService';
import { getWorksheetTemplatesForClassroom } from '../data/interactiveWorksheetTemplates';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const scoreEligible = isScoreEligibleUser(user);
  const adminUser = isAdminPortalUser(user);

  const studentHubInfo = useMemo(() => {
    if (!scoreEligible || !user) return null;
    try {
      const overview = getStudentWorkStatusOverview(
        user.classroom,
        user.id,
        Number(user.studentNumber) || 1,
        user.name,
      );
      const templates = getWorksheetTemplatesForClassroom(user.classroom);
      return {
        missingTotal: overview.totalMissingCount,
        overdueCount: overview.overdueCount,
        worksheetCount: templates.length,
      };
    } catch {
      return { missingTotal: 0, overdueCount: 0, worksheetCount: 0 };
    }
  }, [scoreEligible, user]);

  const goals = [
    { title: 'พัฒนาการคิดเชิงคำนวณ', desc: 'เน้นการแก้ปัญหาอย่างเป็นขั้นตอนและเป็นระบบ เพื่อรากฐานที่แข็งแกร่ง', icon: <Zap /> },
    { title: 'ต่อยอดสู่อาชีพดิจิทัล', desc: 'เตรียมทักษะพื้นฐานสำหรับสายงานเทคโนโลยีในอนาคต', icon: <Target /> },
    { title: 'ทักษะศตวรรษที่ 21', desc: 'ส่งเสริมการคิดวิเคราะห์ และความคิดสร้างสรรค์ที่ไร้ขีดจำกัด', icon: <Users /> },
    { title: 'การรู้เท่าทันสื่อ', desc: 'คัดกรองข้อมูล และวิเคราะห์ความน่าเชื่อถือในโลกออนไลน์', icon: <Globe /> },
    { title: 'จริยธรรมความปลอดภัย', desc: 'เข้าใจกฎหมายคอมพิวเตอร์และมารยาทการใช้สื่อสังคมออนไลน์', icon: <ShieldCheck /> },
    { title: 'รับผิดชอบต่อส่วนรวม', desc: 'ตระหนักถึงผลกระทบของเทคโนโลยีที่มีต่อสิ่งแวดล้อมและโลก', icon: <Heart /> },
  ];

  return (
    <div className="home-page page-transition">
      <div className="container home-announcements">
        <AnnouncementBanner />
      </div>

      {/* 🎯 ศูนย์ภารกิจวันนี้สำหรับนักเรียนที่ล็อกอินแล้ว */}
      {scoreEligible && user && studentHubInfo && (
        <section className="container" style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
              border: '1.5px solid #93c5fd',
              borderRadius: 20,
              padding: '1.35rem 1.5rem',
              boxShadow: '0 10px 28px rgba(37, 99, 235, 0.08)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1d4ed8', background: '#dbeafe', padding: '3px 10px', borderRadius: 999 }}>
                  🎯 ศูนย์ภารกิจวันนี้ • ชั้น {user.classroom} เลขที่ {user.studentNumber}
                </span>
                <h2 style={{ margin: '6px 0 0', fontSize: '1.28rem', color: '#0f172a' }}>
                  สวัสดี {user.name}! พร้อมเริ่มเรียนตามลำดับ 4 ขั้นแล้วหรือยัง?
                </h2>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/live')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 700, borderColor: '#f59e0b', color: '#92400e', background: '#fffbeb' }}
                >
                  <Radio size={15} /> ⚡ เข้าร่วม Live Quiz
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => navigate('/world')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.84rem', fontWeight: 700 }}
                >
                  <Box size={15} /> 🏫 ห้องเรียน 3D
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              <button
                type="button"
                onClick={() => navigate('/courses')}
                style={{
                  textAlign: 'left',
                  padding: '14px',
                  borderRadius: 14,
                  border: '1.5px solid #bfdbfe',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#2563eb' }}>ขั้นที่ 1 • เรียนรู้</span>
                <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Book size={17} color="#2563eb" /> เข้าบทเรียน & สไลด์
                </strong>
                <span style={{ fontSize: '0.79rem', color: '#64748b' }}>เปิดหน่วยเรียนและสไลด์ประจำชั้น {user.classroom}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/games')}
                style={{
                  textAlign: 'left',
                  padding: '14px',
                  borderRadius: 14,
                  border: '1.5px solid #fde68a',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#b45309' }}>ขั้นที่ 2 • ฝึกทักษะ</span>
                <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Gamepad2 size={17} color="#d97706" /> เล่นเกมฝึกทักษะ
                </strong>
                <span style={{ fontSize: '0.79rem', color: '#64748b' }}>เกมตามหลักสูตร (เข้า ปพ.5) และโซนฝึกไหวพริบ</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/homework')}
                style={{
                  textAlign: 'left',
                  padding: '14px',
                  borderRadius: 14,
                  border: studentHubInfo.missingTotal > 0 ? '2px solid #f59e0b' : '1.5px solid #86efac',
                  background: studentHubInfo.missingTotal > 0 ? '#fffbeb' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: studentHubInfo.missingTotal > 0 ? '#b45309' : '#15803d' }}>
                  ขั้นที่ 3 • ส่งงานในเว็บ
                </span>
                <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ClipboardCheck size={17} color="#059669" /> ใบงานโต้ตอบ & การบ้าน
                </strong>
                <span style={{ fontSize: '0.79rem', color: studentHubInfo.missingTotal > 0 ? '#b45309' : '#64748b', fontWeight: studentHubInfo.missingTotal > 0 ? 700 : 400 }}>
                  {studentHubInfo.missingTotal > 0
                    ? `📌 มีงานค้างส่ง ${studentHubInfo.missingTotal} รายการ — กดทำในเว็บเลย!`
                    : `🧩 พร้อมฝึกทำ ${studentHubInfo.worksheetCount} ใบงานโต้ตอบ (ตรวจทันที)`}
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  textAlign: 'left',
                  padding: '14px',
                  borderRadius: 14,
                  border: '1.5px solid #c7d2fe',
                  background: '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#4f46e5' }}>ขั้นที่ 4 • ติดตามผล</span>
                <strong style={{ fontSize: '0.98rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <BarChart3 size={17} color="#4f46e5" /> คะแนนและพัฒนาการ
                </strong>
                <span style={{ fontSize: '0.79rem', color: '#64748b' }}>ดูคะแนน K/P/A ตั๋วบอกลา และสมุดรายงานผล</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* 🎯 ทางลัดสำหรับครูผู้สอน */}
      {adminUser && (
        <section className="container" style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
          <div
            className="card"
            style={{
              background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
              border: '1.5px solid #f59e0b',
              borderRadius: 16,
              padding: '1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 10,
            }}
          >
            <div>
              <strong style={{ fontSize: '1rem', color: '#78350f' }}>👩‍🏫 โหมดครูผู้สอน (Kru James Admin)</strong>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#92400e' }}>
                เข้าห้องควบคุมคาบเรียน สั่งใบงานโต้ตอบ หรือตัดคะแนนเข้า ปพ.5 ได้ทันที
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button type="button" className="btn-primary" onClick={() => navigate('/admin?tab=today')}>
                🎯 คาบเรียนวันนี้
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/admin?tab=homework')}>
                🧩 ใบงานโต้ตอบ
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/admin?tab=gradebook')}>
                📊 สมุดคะแนน ปพ.5
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/live/host')}>
                ⚡ เปิด Live Quiz
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-shape"></div>
        <div className="hero-shape-secondary"></div>
        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="hero-text"
          >
            <span className="badge-yellow"><Sparkles size={16} /> Kru James Soncom • ห้องเรียนเทคโนโลยีครบจบในเว็บเดียว</span>
            <h1>เรียนเทคโนโลยี <span>ไปทำไม?</span></h1>
            <p>
              &ldquo;การเรียนเทคโนโลยีไม่ใช่เพียงเพื่อการเป็นผู้ใช้งาน แต่เพื่อให้ผู้เรียน{' '}
              <strong>คิดเป็น ทำเป็น และใช้อย่างรู้เท่าทัน</strong> เพื่อพัฒนาคุณภาพชีวิตอย่างยั่งยืน&rdquo;
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => navigate('/courses')}>
                เริ่มเข้าสู่บทเรียน <ChevronRight size={20} />
              </button>
              <button className="btn-secondary" onClick={() => navigate(scoreEligible ? '/homework' : '/games')}>
                {scoreEligible ? '🧩 ใบงานโต้ตอบในเว็บ' : '🎮 คลังเกมฝึกทักษะ (38 เกม)'}
              </button>
              <button className="btn-secondary" onClick={() => window.open('https://www.youtube.com/watch?v=TJpkm-WDRHU', '_blank')}>
                <Play size={18} fill="currentColor" /> วิดีโอแนะนำ
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="hero-image"
          >
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600" alt="Technology Classroom" />
              <div className="card-badge">
                <div className="pulse"></div>
                Active Learning Mode
              </div>
              <div className="card-badge-top">
                <span>🚀</span> ใบงานโต้ตอบ + 38 เกมฝึกทักษะ ป.1–ม.3
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro Video Section */}
      <section className="video-section section-padding">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="video-container glass"
          >
            <iframe
              width="100%"
              height="550"
              src="https://www.youtube.com/embed/TJpkm-WDRHU"
              title="ทำไมต้องเรียนวิชา เทคโนโลยี"
              loading="lazy"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: 'var(--radius-lg)' }}
            ></iframe>
          </motion.div>
        </div>
      </section>

      {/* Educational Goals */}
      <section className="goals section-padding">
        <div className="container">
          <div className="section-header">
            <span className="badge-yellow">Our Vision</span>
            <h2>เป้าหมายการเรียนรู้ 6 ประการ</h2>
            <p>มุ่งเน้นการพัฒนาผู้เรียนให้มีความพร้อมและก้าวทันโลกอนาคตที่เปลี่ยนแปลงอย่างรวดเร็ว</p>
          </div>

          <div className="goals-grid">
            {goals.map((goal, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="goal-card"
              >
                <div className="goal-icon"><div className="f-icon">{goal.icon}</div></div>
                <h3>{goal.title}</h3>
                <p>{goal.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid — กดเข้าใช้งานได้จริงทุกการ์ด */}
      <section className="features section-padding" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div className="section-header">
            <span className="badge-yellow">Platform Features</span>
            <h2>ห้องเรียนครบวงจรในเว็บเดียว</h2>
            <p>เรียนสไลด์ เล่นเกม ทำใบงานโต้ตอบ และดูคะแนน ปพ.5 ต่อเนื่องครบในระบบเดียวไม่ต้องสลับหลายแอป</p>
          </div>

          <div className="features-grid">
            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/courses')}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/courses'); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="f-icon"><Book size={32} /></div>
              <h3>คลังบทเรียนและสไลด์ ป.1–ม.3</h3>
              <p>สไลด์ภาพ วิดีโอ เกมประจำหน่วย และแบบทดสอบครบทุกตัวชี้วัด ว 4.2 / ว 4.1 / IS</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/homework')}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/homework'); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="f-icon"><ClipboardCheck size={32} /></div>
              <h3>ใบงานโต้ตอบตรวจคะแนนทันที</h3>
              <p>ทำแบบฝึกหัด ถามต่อ ลากบล็อกต่อบล็อก และจัดหมวดหมู่ผ่านเว็บ ส่งครูตัดคะแนนลง ปพ.5 อัตโนมัติ</p>
            </motion.div>
            <motion.div
              whileHover={{ y: -8 }}
              className="feature-card"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/dashboard')}
              onKeyDown={(e) => { if (e.key === 'Enter') navigate('/dashboard'); }}
              style={{ cursor: 'pointer' }}
            >
              <div className="f-icon"><BarChart3 size={32} /></div>
              <h3>ระบบติดตามผลและคะแนน K/P/A</h3>
              <p>ดูงานค้าง คะแนนสะสม เกรดคาดการณ์ และประวัติการเรียนของตัวเองได้แบบเรียลไทม์</p>
            </motion.div>
          </div>
        </div>
      </section>

      <LeaderboardSection />

      {/* CTA Section */}
      <section className="cta section-padding">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="cta-box"
          >
            <h2>พร้อมเริ่มเรียนหรือยัง?</h2>
            <p>ใช้ชื่อและเลขที่ของคุณ เพื่อเข้าสู่ระบบและเริ่มเก็บคะแนนสะสมจากการเรียนได้ทันที</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => navigate(user ? '/dashboard' : '/login')}>
                {user ? 'ไปที่แดชบอร์ดของฉัน' : 'เข้าสู่ระบบ'}
              </button>
              <button className="btn-primary" style={{ background: 'var(--secondary)', color: 'white' }} onClick={() => navigate('/courses')}>
                ไปที่คอร์สเรียน
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
