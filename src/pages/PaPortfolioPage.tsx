import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ExternalLink, Globe, ShieldCheck, Sparkles,
  Maximize2, Minimize2, RotateCw, BookOpen, Award, CheckCircle2,
  Users, Monitor, Download, FileText, FileCheck
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
                    <Sparkles size={14} /> OFFICIAL PA PERFORMANCE PORTFOLIO (2569)
                  </span>
                  <h1 className="pa-hero-title">
                    แฟ้มสะสมงานและรายงานผล <span>ว.PA ครูเจมส์</span>
                  </h1>
                  <p className="pa-hero-subtitle">
                    รายงานผลการพัฒนางานตามข้อตกลง (PA) สำหรับข้าราชการครูและบุคลากรทางการศึกษา
                    ตำแหน่ง ครู (ยังไม่มีวิทยฐานะ) อันดับ คศ.๑ รอบการประเมิน ๑ ตุลาคม ๒๕๖๘ – ๓๐ กันยายน ๒๕๖๙
                  </p>

                  <div className="pa-meta-tags">
                    <span className="pa-meta-tag">
                      👤 <strong>นายอนันตชัย เพ็ชรรี่</strong> (ครู อันดับ คศ.๑)
                    </span>
                    <span className="pa-meta-tag">
                      🏫 <strong>โรงเรียนบ้านคลองมดแดง</strong>
                    </span>
                    <span className="pa-meta-tag">
                      📍 สพป.กำแพงเพชร เขต ๒
                    </span>
                    <span className="pa-meta-tag">
                      📅 ปีงบประมาณ <strong>๒๕๖๙ (๓๑ ชม./สัปดาห์)</strong>
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

            {/* Official 2569 Word Documents Download Hub */}
            <section
              style={{
                background: 'linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%)',
                border: '1.5px solid #bfdbfe',
                borderRadius: 16,
                padding: '1.25rem 1.5rem',
                marginBottom: '1.5rem',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ margin: '0 0 0.35rem', fontSize: '1.1rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileCheck size={20} color="#2563eb" /> คลังเอกสาร Word (.docx) ว.PA ประจำปีงบประมาณ ๒๕๖๙ (ฉบับสมบูรณ์)
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>
                    จัดทำตามเกณฑ์ ก.ค.ศ. ตำแหน่ง ครู (ยังไม่มีวิทยฐานะ) อันดับ คศ.๑ ครบ ๓ ด้าน ๑๕ ตัวชี้วัด (ร้อยเรียงคำเชื่อม Tasks ➔ Outcomes ➔ Indicators ไร้ร้อยละ) และประเด็นท้าทายการเขียนโปรแกรมแบบบล็อก ป.๕
                  </p>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem' }}>
                  <a
                    href="/docs/PA1_Agreement_2569_KruJames.docx"
                    download="แบบข้อตกลงในการพัฒนางาน_ไม่มีวิทยฐานะ_อนันตชัย_2569_ฉบับปรับปรุงใหม่.docx"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 10,
                      background: '#2563eb',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
                    }}
                  >
                    <Download size={15} /> ๑. แบบข้อตกลง PA 1/ส ปี ๒๕๖๙ (.docx)
                  </a>

                  <a
                    href="/docs/PA_Report_2569_KruJames.docx"
                    download="รูปเล่มรายงานPAครูคศ1_อนันตชัย_2569.docx"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 10,
                      background: '#4f46e5',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)',
                    }}
                  >
                    <FileText size={15} /> ๒. รูปเล่มรายงานผล PA ครู คศ.๑ (.docx)
                  </a>

                  <a
                    href="/docs/PA_Challenge_BlockCoding_P5_2569.docx"
                    download="ผลลัพธ์ประเด็นท้าทาย_การเขียนโปรแกรมแบบบล็อก_ป5_ครูอนันตชัย.docx"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 10,
                      background: '#059669',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(5, 150, 105, 0.25)',
                    }}
                  >
                    <Download size={15} /> ๓. ผลลัพธ์ประเด็นท้าทาย Block Coding ป.๕ (.docx)
                  </a>

                  <a
                    href="/docs/Media_Usage_Log_2569_KruJames.docx"
                    download="แบบบันทึกการใช้สื่อ_นวัตกรรม_และเทคโนโลยี_2569_ครูอนันตชัย.docx"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 10,
                      background: '#d97706',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                    }}
                  >
                    <FileCheck size={15} /> ๔. แบบบันทึกการใช้สื่อ นวัตกรรม & เทคโนโลยี ๒๕๖๙ (.docx)
                  </a>

                  <a
                    href="/docs/Lesson_Plan_P1_40Hours_With_Reflection_2569.docx"
                    download="แผนการจัดการเรียนรู้_ป1_40แผน_พร้อมบันทึกหลังแผน_2569_ครูอนันตชัย.docx"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 1rem',
                      borderRadius: 10,
                      background: '#0891b2',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: '0.85rem',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(8, 145, 178, 0.25)',
                    }}
                  >
                    <BookOpen size={15} /> ๕. แผนการสอน & บันทึกหลังสอน ๔๐ คาบ (.docx)
                  </a>
                </div>
              </div>
            </section>

            {/* 4 Pillars Summary */}
            <section className="pa-pillars-grid">
              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
                  <Monitor size={22} />
                </div>
                <h3>ด้านที่ ๑: การจัดการเรียนรู้ (๘ ตัวชี้วัด)</h3>
                <p>
                  ปรับประยุกต์หลักสูตรและแผนการสอน Active Learning, สื่อนวัตกรรมห้องเรียนออนไลน์ครูเจมส์ (Block-based Coding & Gamification) และประเมินผลตามสภาพจริง
                </p>
              </div>

              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
                  <Users size={22} />
                </div>
                <h3>ด้านที่ ๒: การส่งเสริม & สนับสนุน (๔ ตัวชี้วัด)</h3>
                <p>
                  ระบบสารสนเทศผู้เรียนและออกเอกสาร ปพ.๕ ดิจิทัล, ระบบดูแลช่วยเหลือนักเรียน (เยี่ยมบ้าน/SDQ/กสศ.), หัวหน้างาน ICT และงานสินทรัพย์ OBEC Asset
                </p>
              </div>

              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                  <Award size={22} />
                </div>
                <h3>ด้านที่ ๓: การพัฒนาตนเอง & วิชาชีพ (๓ ตัวชี้วัด)</h3>
                <p>
                  พัฒนาสมรรถนะด้านเทคโนโลยีดิจิทัลและ AI เพื่อการศึกษาอย่างต่อเนื่อง ร่วมแลกเปลี่ยนเรียนรู้ทางวิชาชีพ (PLC) และนำผลมาพัฒนานวัตกรรมการสอน
                </p>
              </div>

              <div className="pa-pillar-card">
                <div className="pa-pillar-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
                  <CheckCircle2 size={22} />
                </div>
                <h3>ประเด็นท้าทาย ๒๕๖๙ (ป.๕ & ป.๑)</h3>
                <p>
                  การพัฒนาทักษะการเขียนโปรแกรมแบบบล็อก (Block-based Coding) ชั้น ป.๕ ด้วย Active Learning และวิจัยชั้นเรียนทักษะการใช้เมาส์ด้วยเกมมิฟิเคชัน ชั้น ป.๑
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
