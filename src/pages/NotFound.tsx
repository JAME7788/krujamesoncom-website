import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass, BookOpen } from 'lucide-react';

const NotFound: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: 560 }}
      >
        <div style={{ fontSize: '7rem', lineHeight: 1, marginBottom: '0.5rem' }}>🧭</div>
        <h1
          style={{
            fontSize: '5rem',
            fontWeight: 900,
            margin: '0',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          404
        </h1>
        <h2 style={{ marginTop: 0 }}>ไม่พบหน้าที่คุณเรียก</h2>
        <p style={{ color: '#6b7280', marginBottom: '2rem', fontSize: '1.05rem' }}>
          อาจเป็นเพราะลิงก์เปลี่ยน หน้าหายไป หรือพิมพ์ที่อยู่ผิด
          ลองกลับไปสำรวจคอร์สเรียนของเราดู มีอะไรน่าสนใจเยอะเลย!
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-secondary">
            <Home size={18} /> หน้าหลัก
          </Link>
          <Link to="/courses" className="btn-primary">
            <BookOpen size={18} /> คอร์สเรียนทั้งหมด
          </Link>
          <Link to="/resources" className="btn-secondary">
            <Compass size={18} /> แหล่งเรียนรู้
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
