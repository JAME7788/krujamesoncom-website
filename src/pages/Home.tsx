import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Play,
  BookOpen,
  BarChart3,
  ShieldCheck,
  Heart,
  Users,
  Target,
  Zap,
  Globe,
  Gamepad2,
  ClipboardCheck,
  Box,
  Radio,
  Library,
  GraduationCap,
  Calendar,
  CheckCircle2,
  Presentation,
  Award,
} from 'lucide-react';
import LeaderboardSection from '../components/LeaderboardSection';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { useAuth } from '../context/AuthContext';
import { isAdminPortalUser, isScoreEligibleUser } from '../services/userAccessService';
import { getStudentWorkStatusOverview } from '../services/homeworkService';
import { getWorksheetTemplatesForClassroom } from '../data/interactiveWorksheetTemplates';
import { getSummary } from '../services/progressService';
import { findGrade } from '../data/curriculum';
import { dayNames, loadSchedule, minutesOf } from '../data/schedule';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, partner } = useAuth();
  const scoreEligible = isScoreEligibleUser(user);
  const adminUser = isAdminPortalUser(user);

  const studentWorkspace = useMemo(() => {
    if (!scoreEligible || !user) return null;
    try {
      const overview = getStudentWorkStatusOverview(
        user.classroom,
        user.id,
        Number(user.studentNumber) || 1,
        user.name,
      );
      const templates = getWorksheetTemplatesForClassroom(user.classroom);
      const summary = getSummary(user.id, user.classroom);
      const latestUnit = [...summary.units].sort((a, b) => b.updatedAt - a.updatedAt)[0] || null;
      let resumePath = '/courses';
      let resumeLabel = `เปิดบทเรียนชั้น ${user.classroom}`;
      if (latestUnit) {
        const [gId, uNo] = latestUnit.key.split('_');
        const g = findGrade(gId);
        const u = g?.units?.find((x) => x.no === Number(uNo));
        if (g && u) {
          resumePath = `/curriculum/${gId}/unit/${uNo}`;
          resumeLabel = `เรียนต่อ: หน่วย ${u.no} ${u.title}`;
        }
      }

      // หาคาบเรียนวันนี้ / ถัดไป
      const now = new Date();
      const todayDay = now.getDay();
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const slots = loadSchedule().filter((s) => s.classroom === user.classroom);
      const activeSlot = slots.find(
        (s) => s.day === todayDay && nowMin >= minutesOf(s.start) && nowMin < minutesOf(s.end),
      );
      const nextSlot =
        activeSlot ||
        slots
          .filter((s) => s.day === todayDay && minutesOf(s.start) > nowMin)
          .sort((a, b) => minutesOf(a.start) - minutesOf(b.start))[0] ||
        slots.sort((a, b) => ((a.day - todayDay + 7) % 7) - ((b.day - todayDay + 7) % 7))[0] ||
        null;

      return {
        overview,
        templates,
        summary,
        resumePath,
        resumeLabel,
        activeSlot,
        nextSlot,
      };
    } catch {
      return null;
    }
  }, [scoreEligible, user]);

  // =========================================================================
  // โหมด 1: STUDENT CLASSROOM WORKSPACE (เมื่อนักเรียนล็อกอินแล้ว)
  // =========================================================================
  if (scoreEligible && user && studentWorkspace) {
    const { overview, templates, summary, resumePath, resumeLabel, activeSlot, nextSlot } = studentWorkspace;
    return (
      <div className="home-page page-transition" style={{ paddingTop: '5.5rem', paddingBottom: '4rem' }}>
        <div className="container">
          <div style={{ marginBottom: '1rem' }}>
            <AnnouncementBanner />
          </div>

          {/* แถบต้อนรับ + สถานะคาบเรียน */}
          <section
            className="card"
            style={{
              padding: '1.5rem 1.75rem',
              borderRadius: 20,
              border: '1px solid #e2e8f0',
              background: '#ffffff',
              boxShadow: '0 8px 28px rgba(15, 23, 42, 0.05)',
              marginBottom: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(1.45rem, 2.6vw, 1.95rem)', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                  สวัสดี {user.name}
                  {partner ? ` และ ${partner.name.split(' ')[0]}` : ''}
                </h1>
                <p style={{ margin: 0, color: '#57606f', fontSize: '0.94rem', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span>ชั้น {user.classroom} • เลขที่ {user.studentNumber}</span>
                  {activeSlot ? (
                    <span style={{ padding: '2px 10px', borderRadius: 999, background: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.8rem' }}>
                      ● กำลังเรียนคาบวิชา{activeSlot.subject || 'เทคโนโลยี'} ({activeSlot.start}–{activeSlot.end} น.)
                    </span>
                  ) : nextSlot ? (
                    <span style={{ padding: '2px 10px', borderRadius: 999, background: '#f1f5f9', color: '#334155', fontWeight: 600, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Calendar size={13} /> คาบถัดไป: วัน{dayNames[nextSlot.day]} {nextSlot.start}–{nextSlot.end} น.
                    </span>
                  ) : null}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link to="/live" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem', borderColor: '#f59e0b', color: '#92400e', background: '#fffbeb' }}>
                  <Radio size={15} /> เข้าร่วมควิซสด
                </Link>
                <Link to="/world" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Box size={15} /> ห้องเรียน 3D
                </Link>
                <Link to="/resources" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <Library size={15} /> แหล่งเรียนรู้
                </Link>
                <Link to="/report-card" className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.85rem' }}>
                  <GraduationCap size={15} /> สมุดรายงานผล
                </Link>
              </div>
            </div>

            {/* เส้นทางเรียน 4 ขั้นในคาบเดียว */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
                gap: 12,
                marginTop: '1.25rem',
              }}
            >
              <Link
                to={resumePath}
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: 16,
                  border: '1.5px solid #bfdbfe',
                  background: '#eff6ff',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1d4ed8', fontWeight: 800, fontSize: '0.78rem' }}>
                  <span>ขั้นที่ 1 • เรียนบทเรียน</span>
                  <BookOpen size={17} />
                </div>
                <strong style={{ fontSize: '1.02rem', color: '#0f172a', lineHeight: 1.35 }}>{resumeLabel}</strong>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  อ่านสไลด์แล้ว {summary.totalSlidesViewed} หน้า • จบแล้ว {summary.unitsCompleted} หน่วย
                </span>
              </Link>

              <Link
                to="/homework"
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: 16,
                  border: overview.totalMissingCount > 0 ? '2px solid #f59e0b' : '1.5px solid #a7f3d0',
                  background: overview.totalMissingCount > 0 ? '#fffbeb' : '#ecfdf5',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: overview.totalMissingCount > 0 ? '#b45309' : '#047857', fontWeight: 800, fontSize: '0.78rem' }}>
                  <span>ขั้นที่ 2 • ใบงานโต้ตอบ & การบ้าน</span>
                  <ClipboardCheck size={17} />
                </div>
                <strong style={{ fontSize: '1.02rem', color: '#0f172a', lineHeight: 1.35 }}>
                  {overview.totalMissingCount > 0
                    ? `มีงานค้างรอส่ง ${overview.totalMissingCount} รายการ`
                    : 'ส่งงานครบแล้ว — ฝึกทำใบงานต่อได้'}
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  มีใบงานโต้ตอบชั้น {user.classroom} พร้อมตรวจทันที {templates.length} ชุด
                </span>
              </Link>

              <Link
                to="/games"
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: 16,
                  border: '1.5px solid #fde68a',
                  background: '#fefce8',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#92400e', fontWeight: 800, fontSize: '0.78rem' }}>
                  <span>ขั้นที่ 3 • เกมฝึกทักษะ</span>
                  <Gamepad2 size={17} />
                </div>
                <strong style={{ fontSize: '1.02rem', color: '#0f172a', lineHeight: 1.35 }}>คลังเกม 38 เกม (แยกโซนชัดเจน)</strong>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  เล่นกิจกรรมสะสมแล้ว {summary.totalActivities} ครั้ง
                </span>
              </Link>

              <Link
                to="/dashboard"
                style={{
                  padding: '1rem 1.15rem',
                  borderRadius: 16,
                  border: '1.5px solid #e2e8f0',
                  background: '#f8fafc',
                  textDecoration: 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#334155', fontWeight: 800, fontSize: '0.78rem' }}>
                  <span>ขั้นที่ 4 • คะแนนของฉัน</span>
                  <BarChart3 size={17} />
                </div>
                <strong className="tabular-nums" style={{ fontSize: '1.02rem', color: '#0f172a', lineHeight: 1.35 }}>
                  คะแนนสะสม {summary.totalPoints} • เฉลี่ย {summary.averageScore}%
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                  ดูคะแนน K/P/A และเขียนตั๋วบอกลาคาบเรียน
                </span>
              </Link>
            </div>
          </section>

          {/* ใบงานโต้ตอบประจำชั้นที่เปิดทำได้ทันทีใน 1 คลิก */}
          {templates.length > 0 && (
            <section
              className="card"
              style={{
                padding: '1.25rem 1.5rem',
                borderRadius: 18,
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                marginBottom: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.08rem', color: '#0f172a' }}>
                    ใบงานโต้ตอบประจำชั้น {user.classroom} (ตอบผ่านเว็บ • ตรวจคะแนนทันที)
                  </h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748b' }}>
                    กดเลือกใบงานเพื่อทำแบบฝึกหัด ถามต่อ ลากบล็อกต่อบล็อก และจัดหมวดหมู่ได้เลย
                  </p>
                </div>
                <Link to="/homework" style={{ fontSize: '0.84rem', fontWeight: 700, color: '#2563eb' }}>
                  ดูใบงานและการบ้านทั้งหมด →
                </Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 10 }}>
                {templates.slice(0, 3).map((tpl) => (
                  <Link
                    key={tpl.id}
                    to={`/homework?template=${encodeURIComponent(tpl.id)}`}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      background: '#faf9f6',
                      textDecoration: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                    }}
                  >
                    <span style={{ fontSize: '0.73rem', fontWeight: 700, color: '#2563eb' }}>
                      {tpl.subjectLabel} • {tpl.indicatorCode}
                    </span>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{tpl.title}</strong>
                    <span style={{ fontSize: '0.79rem', color: '#57606f', lineHeight: 1.4 }}>{tpl.description}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

        <LeaderboardSection />
      </div>
    );
  }

  // =========================================================================
  // โหมด 2: TEACHER COMMAND HOME (เมื่อครูผู้สอนล็อกอินแล้ว)
  // =========================================================================
  if (adminUser) {
    return (
      <div className="home-page page-transition" style={{ paddingTop: '5.5rem', paddingBottom: '4rem' }}>
        <div className="container">
          <div style={{ marginBottom: '1rem' }}>
            <AnnouncementBanner />
          </div>
          <section
            className="card"
            style={{
              padding: '1.75rem',
              borderRadius: 20,
              border: '1px solid #fde68a',
              background: '#ffffff',
              boxShadow: '0 8px 28px rgba(15, 23, 42, 0.05)',
              marginBottom: '1.5rem',
            }}
          >
            <h1 style={{ margin: '0 0 6px', fontSize: '1.7rem', color: '#0f172a' }}>
              ศูนย์ควบคุมการสอนครูเจมส์
            </h1>
            <p style={{ margin: '0 0 1.25rem', color: '#57606f', fontSize: '0.94rem' }}>
              โรงเรียนบ้านคลองมดแดง • เลือกงานประจำคาบเพื่อเข้าสู่หน้าจัดการได้ทันที
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12 }}>
              {[
                { title: 'คาบเรียนวันนี้', desc: 'เช็คชื่อ เปิดสไลด์ ปลดล็อกหน่วย และบันทึกหลังสอน', to: '/admin?tab=today', icon: <Presentation size={19} color="#d97706" />, bg: '#fffbeb', border: '#fde68a' },
                { title: 'ใบงานโต้ตอบ & ตัดคะแนน', desc: 'สั่งใบงาน ป.1–ม.3 และตัดคะแนนอัตโนมัติเข้า ปพ.5', to: '/admin?tab=homework', icon: <ClipboardCheck size={19} color="#059669" />, bg: '#ecfdf5', border: '#a7f3d0' },
                { title: 'เช็คชื่อด่วน', desc: 'เช็คมา/ขาด/ลา แยกห้องเรียนในหน้าเดียว', to: '/admin?tab=quick-att', icon: <CheckCircle2 size={19} color="#2563eb" />, bg: '#eff6ff', border: '#bfdbfe' },
                { title: 'สมุดคะแนน ปพ.5', desc: 'ตรวจคะแนน K/P/A และส่งออกเอกสารวัดผล', to: '/admin?tab=gradebook', icon: <Award size={19} color="#7c3aed" />, bg: '#f5f3ff', border: '#ddd6fe' },
                { title: 'เปิดห้อง Live Quiz', desc: 'ควิซสดแข่งขันทั้งห้องแบบเรียลไทม์', to: '/live/host', icon: <Radio size={19} color="#dc2626" />, bg: '#fef2f2', border: '#fecaca' },
                { title: 'รายชื่อ & ลิงก์ผู้ปกครอง', desc: 'จัดการนักเรียนและคัดลอกลิงก์พอร์ทัลผู้ปกครอง', to: '/admin?tab=roster', icon: <Users size={19} color="#0f766e" />, bg: '#f0fdfa', border: '#99f6e4' },
              ].map((card) => (
                <Link
                  key={card.to}
                  to={card.to}
                  style={{
                    padding: '1rem 1.1rem',
                    borderRadius: 14,
                    border: `1.5px solid ${card.border}`,
                    background: card.bg,
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, color: '#0f172a', fontSize: '0.96rem' }}>
                    {card.icon}
                    <span>{card.title}</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.45 }}>{card.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
        <LeaderboardSection />
      </div>
    );
  }

  // =========================================================================
  // โหมด 3: GUEST / PUBLIC LANDING PAGE (ยังไม่ล็อกอิน)
  // =========================================================================
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

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-shape"></div>
        <div className="hero-shape-secondary"></div>
        <div className="container hero-content">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className="hero-text"
          >
            <h1>เรียนเทคโนโลยี <span>ไปทำไม?</span></h1>
            <p>
              ห้องเรียนคอมพิวเตอร์ครบวงจร โรงเรียนบ้านคลองมดแดง (ป.1–ม.3) — เรียนสไลด์ เล่นเกมตามหลักสูตร ทำใบงานโต้ตอบ และดูคะแนน K/P/A ครบจบในเว็บเดียว
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => navigate('/login')}>
                เข้าสู่ระบบนักเรียน <ChevronRight size={20} />
              </button>
              <button className="btn-secondary" onClick={() => navigate('/games')}>
                ทดลองเล่นคลังเกม (38 เกม)
              </button>
              <button className="btn-secondary" onClick={() => window.open('https://www.youtube.com/watch?v=TJpkm-WDRHU', '_blank')}>
                <Play size={18} fill="currentColor" /> วิดีโอแนะนำ
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut' }}
            className="hero-image"
          >
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600" alt="ห้องเรียนเทคโนโลยีครูเจมส์" />
              <div className="card-badge">
                <div className="pulse"></div>
                Active Learning • ป.1–ม.3
              </div>
              <div className="card-badge-top">
                ใบงานโต้ตอบ + 38 เกมฝึกทักษะ
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features section-padding" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div className="section-header">
            <h2>ครบ 4 ขั้นการเรียนรู้ในเว็บเดียว</h2>
            <p>ออกแบบเพื่อห้องคอมพิวเตอร์โรงเรียนโดยเฉพาะ ไม่ต้องสมัครหลายแอปและไม่ต้องใช้ Gmail ของนักเรียน</p>
          </div>

          <div className="features-grid">
            <div className="feature-card" role="button" tabIndex={0} onClick={() => navigate('/courses')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/courses'); }} style={{ cursor: 'pointer' }}>
              <div className="f-icon"><BookOpen size={30} /></div>
              <h3>1. บทเรียนและสไลด์ ป.1–ม.3</h3>
              <p>สไลด์ภาพ วิดีโอ และแบบทดสอบตรงตามตัวชี้วัด ว 4.2, ว 4.1 และทักษะอาชีพ IS</p>
            </div>
            <div className="feature-card" role="button" tabIndex={0} onClick={() => navigate('/homework')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/homework'); }} style={{ cursor: 'pointer' }}>
              <div className="f-icon"><ClipboardCheck size={30} /></div>
              <h3>2. ใบงานโต้ตอบตรวจคะแนนทันที</h3>
              <p>ปรนัย ถามต่อ ลากบล็อกต่อบล็อก และจัดหมวดหมู่ ตอบในเว็บและตัดคะแนนลง ปพ.5 อัตโนมัติ</p>
            </div>
            <div className="feature-card" role="button" tabIndex={0} onClick={() => navigate('/games')} onKeyDown={(e) => { if (e.key === 'Enter') navigate('/games'); }} style={{ cursor: 'pointer' }}>
              <div className="f-icon"><Gamepad2 size={30} /></div>
              <h3>3. เกมหลักสูตรและห้องเรียน 3D</h3>
              <p>แยกชัดเจนระหว่างเกมตามหลักสูตร 29 เกม และโซนอาร์เคดฝึกไหวพริบ 9 เกม</p>
            </div>
          </div>
        </div>
      </section>

      {/* Intro Video Section */}
      <section className="video-section section-padding">
        <div className="container">
          <div className="video-container glass">
            <iframe
              width="100%"
              height="520"
              src="https://www.youtube.com/embed/TJpkm-WDRHU"
              title="ทำไมต้องเรียนวิชา เทคโนโลยี"
              loading="lazy"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ borderRadius: 'var(--radius-lg)' }}
            ></iframe>
          </div>
        </div>
      </section>

      {/* Educational Goals */}
      <section className="goals section-padding">
        <div className="container">
          <div className="section-header">
            <h2>เป้าหมายการเรียนรู้ 6 ประการ</h2>
            <p>พัฒนาผู้เรียนให้คิดเป็น ทำเป็น และใช้เทคโนโลยีอย่างปลอดภัยและสร้างสรรค์</p>
          </div>
          <div className="goals-grid">
            {goals.map((goal, i) => (
              <div key={i} className="goal-card">
                <div className="goal-icon"><div className="f-icon">{goal.icon}</div></div>
                <h3>{goal.title}</h3>
                <p>{goal.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LeaderboardSection />

      {/* CTA Section */}
      <section className="cta section-padding">
        <div className="container">
          <div className="cta-box">
            <h2>พร้อมเริ่มเรียนหรือยัง?</h2>
            <p>เลือกชั้นเรียนและชื่อของคุณเพื่อเข้าสู่ห้องเรียนออนไลน์และสะสมคะแนนได้ทันที</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => navigate('/login')}>เข้าสู่ระบบ</button>
              <button className="btn-primary" style={{ background: 'var(--secondary)', color: 'white' }} onClick={() => navigate('/courses')}>ไปที่บทเรียน</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
