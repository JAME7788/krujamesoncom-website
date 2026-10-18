import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Globe, ShieldCheck, Sparkles,
  Maximize2, Minimize2, RotateCw, BookOpen, Award, CheckCircle2,
  Users, Monitor
} from 'lucide-react';
import './PaPortfolioPage.css';

export const PA_PORTFOLIO_URL = 'https://pa-krujames-portfolio.vercel.app/';

const PaPortfolioPage: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [frameKey, setFrameKey] = useState(0);

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  const handleRefresh = () => {
    setFrameKey((prev) => prev + 1);
  };

  return (
    <div className={`pa-portfolio-page page-transition ${isFullscreen ? 'pa-frame-fullscreen' : ''}`}>
      <div className="pa-portfolio-container">
        {!isFullscreen && (
          <>
            {/* Top Navigation */}
            <div className="pa-nav-bar">
              <Link to="/" className="pa-back-btn">
                <ArrowLeft size={16} /> กลับสู่หน้าหลัก
              </Link>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="pa-nav-badge">
                  <ShieldCheck size={14} /> แฟ้มสะสมงานทางการ ว.PA
                </span>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  โรงเรียนบ้านคลองมดแดง
                </span>
              </div>
            </div>

            {/* Executive Hero Banner */}
            <section className="pa-hero-banner">
              <div className="pa-hero-header">
                <div className="pa-hero-info">
                  <span className="pa-kicker">
                    <Sparkles size={14} /> OFFICIAL PA PERFORMANCE PORTFOLIO
                  </span>
                  <h1 className="pa-hero-title">
                    แฟ้มสะสมงานและรายงานผล <span>ว.PA ครูเจมส์</span>
                  </h1>
                  <p className="pa-hero-subtitle">
                    รายงานผลการพัฒนางานตามข้อตกลง (PA) สำหรับข้าราชการครูและบุคลากรทางการศึกษา
                    ตำแหน่ง ครูผู้ช่วย รอบการประเมิน ๑ ตุลาคม ๒๕๖๘ – ๓๐ กันยายน ๒๕๖๙
                  </p>

                  <div className="pa-meta-tags">
                    <span className="pa-meta-tag">
                      👤 <strong>นายอนันตชัย เพ็ชรรี่</strong> (ครูผู้ช่วย)
                    </span>
                    <span className="pa-meta-tag">
                      🏫 <strong>โรงเรียนบ้านคลองมดแดง</strong>
                    </span>
                    <span className="pa-meta-tag">
                      📍 สพป.กำแพงเพชร เขต ๒
                    </span>
                    <span className="pa-meta-tag">
                      📅 ปีงบประมาณ <strong>๒๕๖๙</strong>
                    </span>
                  </div>
                </div>

                <div className="pa-hero-actions">
                  <a
                    href={PA_PORTFOLIO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pa-btn-primary"
                  >
                    <ExternalLink size={18} /> เปิดเว็บไซต์เต็มรูปแบบ ↗
                  </a>
                  <Link to="/research" className="pa-btn-secondary">
                    <BookOpen size={16} /> ดูเล่มวิจัย ๕ บท & ข้อตกลง PA
                  </Link>
                </div>
              </div>
            </section>

            {/* 4 Pillars Summary */}
            <section className="pa-pillars-grid">
              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Monitor size={22} />
                </div>
                <h3>ด้านที่ ๑: การจัดการเรียนรู้</h3>
                <p>
                  หลักสูตร Active Learning, สื่อนวัตกรรมเว็บไซต์ krujames.com,
                  ระบบเกมมิฟิเคชัน (Gamification) และการวัดประเมินผล K/P/A ตามสภาพจริง
                </p>
              </div>

              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Users size={22} />
                </div>
                <h3>ด้านที่ ๒: การส่งเสริม & สนับสนุน</h3>
                <p>
                  ระบบสารสนเทศนักเรียน DMC, ระบบออกเอกสาร ปพ.๕/ปพ.๖ ดิจิทัล
                  และระบบดูแลช่วยเหลือนักเรียนรายบุคคล
                </p>
              </div>

              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                  <Award size={22} />
                </div>
                <h3>ด้านที่ ๓: การพัฒนาตนเอง</h3>
                <p>
                  การพัฒนาทักษะดิจิทัลและ AI ในการจัดการศึกษา พร้อมขับเคลื่อนชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC)
                </p>
              </div>

              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                  <CheckCircle2 size={22} />
                </div>
                <h3>ประเด็นท้าทาย (ป.๑)</h3>
                <p>
                  การพัฒนาทักษะปฏิบัติการใช้เมาส์ด้วยเกมมิฟิเคชันร่วมกับ Active Learning
                  (นักเรียน ป.๑ ผ่านเกณฑ์ครบ ๑๑ คน ร้อยละ ๑๐๐)
                </p>
              </div>
            </section>
          </>
        )}

        {/* Live Embed Window */}
        <section className="pa-frame-card">
          <div className="pa-frame-toolbar">
            <div className="pa-frame-address">
              <Globe size={16} />
              <span>{PA_PORTFOLIO_URL}</span>
            </div>

            <div className="pa-frame-controls">
              <button
                type="button"
                className="pa-frame-btn"
                onClick={handleRefresh}
                title="รีเฟรชหน้าเว็บ"
              >
                <RotateCw size={14} /> รีเฟรช
              </button>
              <button
                type="button"
                className="pa-frame-btn"
                onClick={toggleFullscreen}
                title={isFullscreen ? 'ย่อหน้าจอ' : 'ขยายเต็มจอ'}
              >
                {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                <span>{isFullscreen ? 'ย่อหน้าจอ' : 'เต็มจอ'}</span>
              </button>
              <a
                href={PA_PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pa-frame-btn"
                style={{ background: '#2563eb', color: '#ffffff', borderColor: '#1d4ed8' }}
              >
                <ExternalLink size={14} /> เปิดแท็บใหม่ ↗
              </a>
            </div>
          </div>

          <div className="pa-frame-wrapper" style={{ height: isFullscreen ? 'calc(100vh - 54px)' : '820px' }}>
            <iframe
              key={frameKey}
              src={PA_PORTFOLIO_URL}
              title="Kru James PA Portfolio"
              className="pa-frame"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
              loading="lazy"
            />
          </div>

          {!isFullscreen && (
            <div className="pa-fallback-banner">
              <h4>💡 ต้องการดูฉบับเต็มพร้อมลูกเล่นและการโต้ตอบสมบูรณ์แบบ?</h4>
              <p>
                สามารถคลิกเปิดหน้าเว็บไซต์พอร์ตโฟลิโอ ว.PA ได้โดยตรง เพื่อสัมผัสกราฟ Interactive
                และแกลเลอรีผลงานแบบเต็มจอ
              </p>
              <a
                href={PA_PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="pa-btn-primary"
                style={{ padding: '0.65rem 1.5rem', fontSize: '0.9rem' }}
              >
                <ExternalLink size={16} /> ไปที่ pa-krujames-portfolio.vercel.app ↗
              </a>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default PaPortfolioPage;
