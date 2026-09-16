import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, ShieldCheck } from 'lucide-react';
import ResearchGenerator from '../components/ResearchGenerator';

const ResearchPage: React.FC = () => {
  return (
    <div className="page-transition" style={{ minHeight: '100vh', padding: '2rem 1rem 4rem', background: '#f8fafc' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        {/* Navigation bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'white',
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              color: '#475569',
              fontWeight: 600,
              fontSize: '0.9rem',
              textDecoration: 'none',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            <ArrowLeft size={16} /> กลับหน้าหลัก
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#e0e7ff', color: '#4338ca', padding: '0.25rem 0.75rem', borderRadius: 9999, fontWeight: 600 }}>
              <ShieldCheck size={14} /> เอกสารทางการ ก.ค.ศ.
            </span>
            <span>โรงเรียนบ้านคลองมดแดง</span>
          </div>
        </div>

        {/* Page Title Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
            color: 'white',
            borderRadius: 16,
            padding: '2rem',
            marginBottom: '2rem',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.5rem', borderRadius: 10 }}>
              <BookOpen size={28} />
            </div>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>
              CLASSROOM ACTION RESEARCH & ว.PA AGREEMENT HUB
            </span>
          </div>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.3 }}>
            ระบบจัดทำเล่มวิจัยในชั้นเรียน ๕ บท & ข้อตกลงพัฒนางาน ว.PA
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '1.05rem', lineHeight: 1.5, maxWidth: 900 }}>
            เรื่อง: การพัฒนาทักษะปฏิบัติการใช้เมาส์ด้วยเกมมิฟิเคชัน (Gamification) ร่วมกับ Active Learning วิชาวิทยาการคำนวณและเทคโนโลยี ชั้นประถมศึกษาปีที่ ๑ (๑๑ คน)
          </p>
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.9rem', opacity: 0.95 }}>
            <span>👤 ผู้วิจัย/ผู้จัดทำ: <strong>นายอนันตชัย เพ็ชรรี่</strong></span>
            <span>🏷️ ตำแหน่ง: <strong>ครูผู้ช่วย</strong></span>
            <span>🏫 <strong>โรงเรียนบ้านคลองมดแดง</strong></span>
            <span>📅 ปีการศึกษา <strong>๒๕๖๙</strong></span>
          </div>
        </div>

        {/* Main Generator Component */}
        <div style={{ background: 'white', borderRadius: 16, padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}>
          <ResearchGenerator />
        </div>
      </div>
    </div>
  );
};

export default ResearchPage;
