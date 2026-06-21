import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Target, ChevronRight, X, ListChecks, Eye, Lock } from 'lucide-react';
import { grades } from '../data/curriculum';
import type { Grade, Unit, Indicator } from '../data/curriculum';
import { useAuth } from '../context/AuthContext';
import { isAdminAuthed } from '../services/authAdmin';
import { useToast } from '../components/Toast';
import { isUnitLocked } from '../services/unitLockService';
import './Curriculum.css';

/** map ห้องเรียน → gradeIds ใน curriculum ที่นักเรียนห้องนั้นมีสิทธิ์เข้า */
const classroomToAllowedGradeIds = (classroom: string): string[] => {
  const map: Record<string, string[]> = {
    'ป.1': ['p1', 'ai-p1-3'],
    'ป.2': ['p2', 'ai-p1-3'],
    'ป.3': ['p3', 'ai-p1-3'],
    'ป.4': ['p4', 'ai-p4-6'],
    'ป.5': ['p5', 'ai-p4-6'],
    'ป.6': ['p6', 'ai-p4-6'],
    'ม.1': ['m1-cs', 'm1-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
    'ม.2': ['m2-cs', 'm2-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
    'ม.3': ['m3-cs', 'm3-design', 'ai-m1-3', 'arduino-basic', 'electronics-basic'],
  };
  return map[classroom] || [];
};

const Curriculum: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = isAdminAuthed();
  const [selectedCourse, setSelectedCourse] = useState<Grade | null>(null);
  const toast = useToast();

  // กรองคอร์สตามสิทธิ์
  const visibleGrades = useMemo(() => {
    if (isAdmin) return grades; // Admin เห็นทุกคอร์ส
    if (!user) return [];        // ไม่ login = ไม่เห็น
    const allowed = classroomToAllowedGradeIds(user.classroom);
    return grades.filter((g) => allowed.includes(g.id));
  }, [user, isAdmin]);

  // Stop scrolling when modal is open
  React.useEffect(() => {
    if (selectedCourse) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedCourse]);

  return (
    <div className="curriculum-page">
      {isAdmin && (
        <div className="admin-view-banner">
          <Eye size={16} /> <strong>Admin View</strong> — ดูทุกคอร์ส ({grades.length} คอร์ส)
        </div>
      )}
      {user && !isAdmin && (
        <div className="student-view-banner">
          📚 <strong>คอร์สสำหรับชั้น {user.classroom}</strong> — แสดง {visibleGrades.length} คอร์ส
        </div>
      )}
      {visibleGrades.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
          <p>ไม่มีคอร์สสำหรับชั้นนี้</p>
        </div>
      )}
      <div className="course-cards-grid">
        {visibleGrades.map((g, i) => (
          <motion.div
            key={g.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="course-card"
            onClick={() => setSelectedCourse(g)}
          >
            <div className="course-card-header">
              <div className="course-emoji-wrapper">
                {g.emoji}
              </div>
            </div>
            
            <div className="course-card-content">
              <h2>{g.title}</h2>
              
              <div className="course-meta">
                <span className="meta-item">
                  <Target size={16} /> {g.indicators.length} ตัวชี้วัด
                </span>
                <span className="meta-item">
                  <BookOpen size={16} /> {g.units?.length || g.lessons.length} หน่วยการเรียน
                </span>
              </div>
              
              <div className="course-topics-preview">
                {g.units && g.units.slice(0, 3).map((u, idx) => (
                  <div key={idx} className="preview-topic">
                    <span className="topic-dot"></span> {u.title}
                  </div>
                ))}
                {g.units && g.units.length > 3 && (
                  <div className="preview-topic more">...และอื่นๆ</div>
                )}
              </div>
            </div>

            <div className="course-card-footer">
              <button className="btn-view-details">
                ดูรายละเอียดคอร์ส <ChevronRight size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div 
            className="course-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div 
              className="course-modal-container"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <button className="modal-close-btn" onClick={() => setSelectedCourse(null)}>
                <X size={24} />
              </button>

              <div className="modal-header">
                <div className="modal-emoji">{selectedCourse.emoji}</div>
                <div className="modal-title-area">
                  <h2>{selectedCourse.title}</h2>
                  <p>รายละเอียดเนื้อหาและตัวชี้วัดทั้งหมดของชั้นเรียนนี้</p>
                </div>
              </div>

              <div className="modal-content-scroll">
                {/* Quick start */}
                <div style={{
                  background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                  padding: '0.85rem 1rem', borderRadius: 12, marginBottom: 16,
                  fontSize: '0.88rem', color: '#78350f',
                }}>
                  💡 <strong>กดที่หน่วยใดก็ได้</strong>เพื่อเข้าเรียนหน่วยนั้นโดยตรง
                </div>

                {/* Units List — แต่ละหน่วยกดได้ */}
                <div className="modal-section">
                  <h3><ListChecks size={20} className="text-primary" /> เนื้อหาที่จะได้เรียน ({selectedCourse.units?.length || 0} หน่วย)</h3>
                  <div className="modal-units-list">
                    {selectedCourse.units?.map((u: Unit) => {
                      const locked = isUnitLocked(selectedCourse.id, u.no);
                      return (
                        <Link
                          key={u.no}
                          to={locked ? '#' : `/curriculum/${selectedCourse.id}/unit/${u.no}`}
                          className={`modal-unit-item modal-unit-link ${locked ? 'unit-locked' : ''}`}
                          onClick={(e) => {
                            if (locked) {
                              e.preventDefault();
                              toast.show(`🔒 บทเรียนที่ ${u.no} ยังไม่เปิดให้เข้าเรียนในขณะนี้ คุณครูจะค่อยๆ ปลดล็อกให้เรียนพร้อมกันในห้องเรียนนะคะ`, 'info');
                            } else {
                              setSelectedCourse(null);
                            }
                          }}
                        >
                          <div className={`unit-no-badge ${locked ? 'badge-locked' : ''}`}>
                            หน่วยที่ {u.no} {locked && '🔒'}
                          </div>
                          <div className="unit-info">
                            <h4>{u.title} {locked && <span className="locked-text">(ยังไม่เปิดเรียน)</span>}</h4>
                            {u.topics && (
                              <ul className="unit-topics-mini">
                                {u.topics.map((t: string, i: number) => (
                                  <li key={i}>{t}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                          {locked ? (
                            <Lock size={18} className="unit-lock-icon" />
                          ) : (
                            <ChevronRight size={20} className="unit-arrow" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Indicators List */}
                <div className="modal-section">
                  <h3><Target size={20} className="text-primary" /> ตัวชี้วัดรายวิชา</h3>
                  <ul className="modal-indicators-list">
                    {selectedCourse.indicators.map((ind: Indicator, i: number) => (
                      <li key={i} className="modal-indicator-item">
                        <span className="ind-code-badge">{ind.code}</span>
                        <span className="ind-text-desc">{ind.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setSelectedCourse(null)}>ปิดหน้าต่าง</button>
                <Link to={`/curriculum/${selectedCourse.id}/unit/1`} className="btn-enter-course-modal" onClick={() => setSelectedCourse(null)}>
                  เริ่มจากหน่วยที่ 1 <ChevronRight size={18} />
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Curriculum;
