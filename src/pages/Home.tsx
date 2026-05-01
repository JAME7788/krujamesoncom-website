import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Play, Book, BarChart3, UploadCloud, ShieldCheck, Heart, Users, Target, Zap, Globe } from 'lucide-react';
import LeaderboardSection from '../components/LeaderboardSection';
import './Home.css';

const Home: React.FC = () => {
  const goals = [
    { title: 'พัฒนาการคิดเชิงคำนวณ', desc: 'เน้นการแก้ปัญหาอย่างเป็นขั้นตอนและเป็นระบบ', icon: <Zap /> },
    { title: 'ต่อยอดสู่อาชีพดิจิทัล', desc: 'เตรียมทักษะพื้นฐานสำหรับอาชีพในอนาคต', icon: <Target /> },
    { title: 'ทักษะศตวรรษที่ 21', desc: 'ส่งเสริมการคิดวิเคราะห์ ความคิดสร้างสรรค์', icon: <Users /> },
    { title: 'การรู้เท่าทันสื่อ', desc: 'กรองข้อมูล วิเคราะห์ความน่าเชื่อถือ', icon: <Globe /> },
    { title: 'จริยธรรมและความปลอดภัย', desc: 'เข้าใจกฎหมายคอมพิวเตอร์และมารยาททางสังคม', icon: <ShieldCheck /> },
    { title: 'ตระหนักต่อสิ่งแวดล้อม', desc: 'รับรู้ผลกระทบของเทคโนโลยีต่อโลก', icon: <Heart /> },
  ];

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-shape"></div>
        <div className="container hero-content">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text"
          >
            <span className="badge">Kru James Soncom • ห้องเรียนครูเจมส์</span>
            <h1>เรียน เทคโนโลยี <span>ไปทำไม?</span></h1>
            <p>
              "การเรียนเทคโนโลยีไม่ใช่เพียงเพื่อการเป็นผู้ใช้งาน แต่เพื่อให้ผู้เรียน 
              <strong> คิดเป็น ทำเป็น และใช้อย่างรู้เท่าทัน</strong> เพื่อพัฒนาคุณภาพชีวิตและสังคมอย่างยั่งยืน"
            </p>
            <div className="hero-btns">
              <button className="btn-primary" onClick={() => window.location.href='/courses'}>
                เข้าสู่บทเรียน <ChevronRight size={20} />
              </button>
              <button className="btn-secondary" onClick={() => window.open('https://www.youtube.com/watch?v=TJpkm-WDRHU', '_blank')}>
                <Play size={18} /> ดูวงิดีโอแนะนำ
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="hero-image"
          >
            <div className="img-card glass">
              <img src="https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=600" alt="Technology Classroom" />
              <div className="card-badge">
                 <div className="pulse"></div>
                 Active Learning
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Intro Video Section */}
      <section className="video-section section-padding">
        <div className="container">
          <div className="video-container glass">
             <iframe 
                width="100%" 
                height="500" 
                src="https://www.youtube.com/embed/TJpkm-WDRHU" 
                title="ทำไมต้องเรียนวิชา เทคโนโลยี" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
             ></iframe>
          </div>
        </div>
      </section>

      {/* Educational Goals */}
      <section className="goals section-padding">
        <div className="container">
          <div className="section-header">
            <h2>เป้าหมายการเรียนรู้ 6 ประการ</h2>
            <p>มุ่งเน้นการพัฒนาผู้เรียนให้พร้อมสำหรับโลกอนาคต</p>
          </div>
          
          <div className="goals-grid">
            {goals.map((goal, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -5 }}
                className="goal-card glass"
              >
                <div className="goal-icon">{goal.icon}</div>
                <h3>{goal.title}</h3>
                <p>{goal.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Curriculum Detail */}
      <section className="curriculum section-padding">
        <div className="container">
          <div className="curriculum-split">
             <div className="curriculum-item glass">
                <div className="c-tag">ว 4.1</div>
                <h3>การออกแบบและเทคโนโลยี</h3>
                <p>เน้นความหมายของเทคโนโลยี ระบบเทคโนโลยี การเปลี่ยนแปลง ผลกระทบ และ <strong>กระบวนการออกแบบเชิงวิศวกรรม (6 ขั้นตอน)</strong></p>
                <ul>
                   <li>วัสดุ อุปกรณ์ และเครื่องมือพื้นฐาน</li>
                   <li>กลไก ไฟฟ้า และอิเล็กทรอนิกส์</li>
                </ul>
             </div>
             <div className="curriculum-item glass">
                <div className="c-tag">ว 4.2</div>
                <h3>วิทยาการคำนวณ</h3>
                <p>เน้น 3 เสาหลักสำคัญ เพื่อการแก้ปัญหาอย่างเป็นระบบ:</p>
                <div className="c-sub-grid">
                   <div className="c-sub">
                      <h4>Computer Science</h4>
                      <p>การคิดเชิงคำนวณ การเขียนโปรแกรม (Coding)</p>
                   </div>
                   <div className="c-sub">
                      <h4>ICT</h4>
                      <p>การจัดการข้อมูล การสืบค้น และระบบคอมพิวเตอร์</p>
                   </div>
                   <div className="c-sub">
                      <h4>Digital Literacy</h4>
                      <p>การใช้เทคโนโลยีอย่างปลอดภัย มีจริยธรรม</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features section-padding">
        <div className="container">
          <div className="section-header">
            <h2>ฟีเจอร์เด่นของห้องเรียนออนไลน์</h2>
            <p>ทุกเครื่องมือที่จำเป็นสำหรับการเรียนการสอนยุคใหม่</p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card glass">
               <div className="f-icon"><Book size={32} /></div>
               <h3>คลังสื่อการสอน</h3>
               <p>วิดีโอ ใบงาน และบทเรียนแบบ Interactive ครบทุกระดับชั้น</p>
            </div>
            <div className="feature-card glass">
               <div className="f-icon"><BarChart3 size={32} /></div>
               <h3>ระบบดูคะแนน</h3>
               <p>ติดตามผลการเรียนและความก้าวหน้าของตัวเองได้แบบเรียลไทม์</p>
            </div>
            <div className="feature-card glass">
               <div className="f-icon"><UploadCloud size={32} /></div>
               <h3>ส่งงานออนไลน์</h3>
               <p>ส่งการบ้านและโครงงานได้ง่ายๆ พร้อมระบบตรวจและให้คำแนะนำ</p>
            </div>
          </div>
        </div>
      </section>

      <LeaderboardSection />



      {/* CTA Section */}
      <section className="cta">
        <div className="container cta-box glass">
          <h2>พร้อมที่จะพัฒนาทักษะดิจิทัลหรือยัง?</h2>
          <p>เข้าใช้งานด้วยชื่อและเลขที่ เพื่อเริ่มเก็บคะแนนสะสมได้ทันที</p>
          <button className="btn-primary" onClick={() => window.location.href='/login'}>เข้าสู่ห้องเรียนเลย</button>
        </div>
      </section>
    </div>
  );
};

export default Home;
