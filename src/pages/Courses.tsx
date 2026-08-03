import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, LogIn, Shield, Sparkles, Eye } from 'lucide-react';
import Curriculum from './Curriculum';
import { useAuth } from '../context/AuthContext';
import { isAdminAuthed } from '../services/authAdmin';
import { isExternalVisitor } from '../services/userAccessService';
import './Courses.css';

const Courses: React.FC = () => {
  const { user, partner } = useAuth();
  const isAdmin = isAdminAuthed();
  const externalVisitor = isExternalVisitor(user);

  // ถ้ายังไม่ login (ไม่ใช่นักเรียน + ไม่ใช่แอดมิน) → แสดงหน้า gate
  if (!user && !isAdmin) {
    return (
      <div className="courses-page container section-padding">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="course-gate"
        >
          <div className="gate-icon">
            <Lock size={48} />
          </div>
          <h1>🔒 คลังบทเรียนนี้สำหรับนักเรียนเท่านั้น</h1>
          <p>กรุณาเข้าสู่ระบบเพื่อดูบทเรียนของชั้นคุณ</p>

          <div className="gate-actions">
            <Link to="/login" className="gate-btn primary">
              <LogIn size={20} /> เข้าสู่ระบบนักเรียน
            </Link>
            <Link to="/admin" className="gate-btn secondary">
              <Shield size={20} /> เข้าสู่ระบบ Admin (ครู)
            </Link>
          </div>

          <div className="gate-info">
            <h3><Sparkles size={18} /> สิทธิ์การเข้าถึง</h3>
            <ul>
              <li>👨‍🎓 <strong>นักเรียน</strong> — เห็นเฉพาะคอร์สของชั้นตัวเอง (เช่น ป.5 → เห็น ป.5 + AI ป.4-6)</li>
              <li>👨‍🏫 <strong>Admin (ครู)</strong> — เห็นทุกคอร์สทั้งหมด พร้อมจัดการเนื้อหาและคะแนน</li>
              <li>👯 <strong>โหมดนั่งคู่</strong> — รองรับ 2 คนต่อ 1 เครื่อง บันทึกคะแนนให้ทั้งคู่</li>
            </ul>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="courses-page container section-padding">
      <div className="courses-header">
        <span className="badge">หลักสูตรวิชาเทคโนโลยี (วิทยาการคำนวณ)</span>
        <h1>คลังบทเรียน <span>ครูเจมส์</span></h1>
        {isAdmin && !user ? (
          <p>
            <Eye size={14} style={{ verticalAlign: 'middle' }} /> โหมด <strong>Admin</strong> —
            ดูคอร์สทุกชั้น (ครูสามารถเข้าทุกคอร์สเพื่อตรวจสอบเนื้อหา)
          </p>
        ) : externalVisitor && user ? (
          <p>
            <Eye size={14} style={{ verticalAlign: 'middle' }} /> สวัสดี <strong>{user.name}</strong>
            {' — '}โหมดทดลองเปิดให้เรียนได้ทุกชั้น โดยไม่บันทึกคะแนนหรือเช็กชื่อ
          </p>
        ) : user ? (
          <p>
            สวัสดี <strong>{user.name}</strong> ({user.classroom}/{user.studentNumber})
            {partner && <> + <strong>{partner.name}</strong> ({partner.studentNumber})</>}
            {' — '}คอร์สที่เปิดให้ชั้นของคุณอยู่ด้านล่าง
          </p>
        ) : (
          <p>เลือกชั้นเรียนของคุณ เพื่อเข้าสู่หน่วยการเรียน ตัวชี้วัด และบทเรียนเต็มรูปแบบ</p>
        )}
      </div>

      <Curriculum />
    </div>
  );
};

export default Courses;
