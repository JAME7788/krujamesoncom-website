import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Target, ChevronRight, X, ListChecks } from 'lucide-react';
import { grades } from '../data/curriculum';
import './Curriculum.css';

const Curriculum: React.FC = () => {
  const [selectedCourse, setSelectedCourse] = useState<any>(null);

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
      <div className="course-cards-grid">
        {grades.map((g, i) => (
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
                {/* Units List */}
                <div className="modal-section">
                  <h3><ListChecks size={20} className="text-primary" /> เนื้อหาที่จะได้เรียน</h3>
                  <div className="modal-units-list">
                    {selectedCourse.units?.map((u: any) => (
                      <div key={u.no} className="modal-unit-item">
                        <div className="unit-no-badge">หน่วยที่ {u.no}</div>
                        <div className="unit-info">
                          <h4>{u.title}</h4>
                          {u.topics && (
                            <ul className="unit-topics-mini">
                              {u.topics.map((t: string, i: number) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Indicators List */}
                <div className="modal-section">
                  <h3><Target size={20} className="text-primary" /> ตัวชี้วัดรายวิชา (ว 4.2)</h3>
                  <ul className="modal-indicators-list">
                    {selectedCourse.indicators.map((ind: any, i: number) => (
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
                <Link to={`/curriculum/${selectedCourse.id}/unit/1`} className="btn-enter-course-modal">
                  เข้าสู่ห้องเรียน <ChevronRight size={18} />
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
