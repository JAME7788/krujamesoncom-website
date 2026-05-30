import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Play, Book, BarChart3, UploadCloud, ShieldCheck, Heart, Users, Target, Zap, Globe, Sparkles } from 'lucide-react';
import LeaderboardSection from '../components/LeaderboardSection';
import AnnouncementBanner from '../components/AnnouncementBanner';
import './Home.css';

const Home: React.FC = () => {
  const navigate = useNavigate();
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
      <div className="container" style={{ paddingTop: '5rem' }}>
        <AnnouncementBanner />
      </div>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-shape"></div>
        <div className="container hero-content">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="hero-text"
          >
            <span className="badge-yellow"><Sparkles size={16} /> Kru James Soncom • ห้องเรียนเทคโนโลยี</span>
            <h1>เรียนเทคโนโลยี <span>ไปทำไม?</span></h1>
            <p>
              "การเรียนเทคโนโลยีไม่ใช่เพียงเพื่อการเป็นผู้ใช้งาน แต่เพื่อให้ผู้เรียน 
              <strong> คิดเป็น ทำเป็น และใช้อย่างรู้เท่าทัน</strong> เพื่อพัฒนาคุณภาพชีวิตอย่างยั่งยืน"
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => navigate('/courses')}>
                เริ่มเข้าสู่บทเรียน <ChevronRight size={20} />
              </button>
              <button className="btn-secondary" onClick={() => window.open('https://www.youtube.com/watch?v=TJpkm-WDRHU', '_blank')}>
                <Play size={18} fill="currentColor" /> วิดีโอแนะนำ
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 3 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="hero-image"
          >
            <div className="img-card">
              <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600" alt="Technology Classroom" />
              <div className="card-badge">
                 <div className="pulse"></div>
                 Active Learning Mode
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

      {/* Features Grid */}
      <section className="features section-padding" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <div className="section-header">
            <span className="badge-yellow">Platform Features</span>
            <h2>ห้องเรียนออนไลน์ 4.0</h2>
            <p>เครื่องมือล้ำสมัยที่ช่วยให้การเรียนรู้วิชาเทคโนโลยีเป็นเรื่องสนุกและเข้าถึงง่าย</p>
          </div>
          
          <div className="features-grid">
            <motion.div 
              whileHover={{ y: -10 }}
              className="feature-card"
            >
               <div className="f-icon"><Book size={32} /></div>
               <h3>คลังสื่อการสอน</h3>
               <p>วิดีโอ ใบงาน และบทเรียนแบบ Interactive ครบทุกระดับชั้น ตั้งแต่ ป.1 - ม.3</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -10 }}
              className="feature-card"
            >
               <div className="f-icon"><BarChart3 size={32} /></div>
               <h3>ระบบติดตามผล</h3>
               <p>ดูคะแนนสะสม ความก้าวหน้า และอันดับของตัวเองได้แบบเรียลไทม์</p>
            </motion.div>
            <motion.div 
              whileHover={{ y: -10 }}
              className="feature-card"
            >
               <div className="f-icon"><UploadCloud size={32} /></div>
               <h3>Digital Sandbox</h3>
               <p>พื้นที่สำหรับส่งงานและโครงงานดิจิทัล พร้อมระบบ AI ช่วยให้คำแนะนำเบื้องต้น</p>
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
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn-secondary" onClick={() => navigate('/login')}>เข้าสู่ระบบ</button>
              <button className="btn-primary" style={{ background: 'var(--secondary)', color: 'white' }} onClick={() => navigate('/courses')}>ไปที่คอร์สเรียน</button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;
