import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Shield, Video, Award, ChevronRight, ExternalLink, Gamepad2, Globe, ShieldCheck, Zap } from 'lucide-react';
import './Resources.css';

const Resources: React.FC = () => {
  const exams = [
    { name: 'ข้อสอบวิทยาการคำนวณ ป.1 - ป.6', desc: 'คลังข้อสอบท้ายบทและปลายภาค', icon: <FileText size={24} />, color: 'var(--primary)' },
    { name: 'ข้อสอบออกแบบและเทคโนโลยี ม.1 - ม.3', desc: 'ข้อสอบประเมินผลสัมฤทธิ์', icon: <FileText size={24} />, color: 'var(--secondary)' },
  ];



  return (
    <div className="resources-page page-transition container section-padding">
      <header className="resources-header">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <span className="badge-light">Kru James Library</span>
          <h1>แหล่งเรียนรู้เสริม & คลังข้อสอบ</h1>
          <p>รวมรวบเอกสาร แบบทดสอบ และกิจกรรมพิเศษเพื่อพัฒนาทักษะดิจิทัลของนักเรียน</p>
        </motion.div>
      </header>

      <div className="resources-grid">
        {/* คลังข้อสอบ */}
        <section className="resource-section">
          <div className="section-title">
            <FileText size={28} />
            <h2>ระบบคลังข้อสอบ (เร็วๆ นี้)</h2>
          </div>
          <div className="cards-list">
            {exams.map((exam, idx) => (
              <motion.div 
                key={idx} 
                className="resource-card glass"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="card-icon" style={{ backgroundColor: `${exam.color}20`, color: exam.color }}>
                  {exam.icon}
                </div>
                <div className="card-info">
                  <h3>{exam.name}</h3>
                  <p>{exam.desc}</p>
                </div>
                <div className="card-action">
                  <span className="coming-soon">กำลังพัฒนาระบบ</span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>


        {/* ศูนย์รวมเกมการศึกษา */}
        <section className="resource-section games">
          <div className="section-title">
            <Gamepad2 size={28} />
            <h2>ศูนย์รวมเกมการศึกษา</h2>
          </div>
          <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>เรียนรู้ผ่านการเล่นกับมินิเกมสุดสนุก</p>
          
          <div className="games-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem'
          }}>
            <motion.a 
              href="https://codingthailand.app/minigame/ramakien/" 
              target="_blank"
              whileHover={{ scale: 1.05 }}
              className="game-card glass"
              style={{ padding: '1rem', borderRadius: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div className="game-thumb ramakien" style={{ marginBottom: '1rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <img src="https://codingthailand.app/minigame/ramakien/img/logo.png" alt="Ramakien Game" style={{ maxHeight: '100%', maxWidth: '100%' }} />
              </div>
              <div className="game-info">
                 <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>Blocky Game (รามเกียรติ์)</h3>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>ฝึกเขียนโปรแกรมผ่านวรรณคดีไทย</p>
              </div>
            </motion.a>

            <motion.a 
              href="https://beinternetawesome.withgoogle.com/th_th/interland" 
              target="_blank"
              whileHover={{ scale: 1.05 }}
              className="game-card glass"
              style={{ padding: '1rem', borderRadius: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div className="game-thumb interland" style={{ marginBottom: '1rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34A853' }}>
                 <Globe size={50} />
              </div>
              <div className="game-info">
                 <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>Interland</h3>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>ท่องโลกดิจิทัลอย่างปลอดภัย</p>
              </div>
            </motion.a>

            <motion.a 
              href="https://think-digital.app/minigame/password" 
              target="_blank"
              whileHover={{ scale: 1.05 }}
              className="game-card glass"
              style={{ padding: '1rem', borderRadius: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div className="game-thumb password" style={{ marginBottom: '1rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA4335' }}>
                 <ShieldCheck size={50} />
              </div>
              <div className="game-info">
                 <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>The Password Game</h3>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>ทักษะความฉลาดทางดิจิทัล</p>
              </div>
            </motion.a>
            
            <motion.a
              href="https://codingthailand.app/minigame/cipher"
              target="_blank"
              whileHover={{ scale: 1.05 }}
              className="game-card glass"
              style={{ padding: '1rem', borderRadius: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div className="game-thumb cipher" style={{ marginBottom: '1rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9C27B0' }}>
                 <Zap size={50} />
              </div>
              <div className="game-info">
                 <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>Cipher Mini Game</h3>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>ถอดรหัสลับและตรรกะ</p>
              </div>
            </motion.a>

            <motion.a
              href="https://codingthailand.app/minigame/atbash-caesar"
              target="_blank"
              whileHover={{ scale: 1.05 }}
              className="game-card glass"
              style={{ padding: '1rem', borderRadius: '1rem', textAlign: 'center', textDecoration: 'none', color: 'inherit', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <div className="game-thumb cipher" style={{ marginBottom: '1rem', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#673AB7' }}>
                 <Zap size={50} />
              </div>
              <div className="game-info">
                 <h3 style={{ fontSize: '1rem', margin: '0 0 0.5rem' }}>Caesar & Atbash</h3>
                 <p style={{ fontSize: '0.85rem', color: 'var(--text-light)', margin: 0 }}>ฝึกตรรกะการแทนที่รหัส</p>
              </div>
            </motion.a>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Resources;
