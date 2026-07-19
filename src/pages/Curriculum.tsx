import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Target, ChevronRight, X, ListChecks, Eye, Lock, ClipboardCheck } from 'lucide-react';
import { grades } from '../data/curriculum';
import type { Grade, Unit, Indicator } from '../data/curriculum';
import { useAuth } from '../context/AuthContext';
import { isAdminAuthed } from '../services/authAdmin';
import { useToast } from '../components/Toast';
import {
  fetchUnlockedUnits,
  getUnlockedUnits,
  isUnitLocked,
  subscribeUnlockedUnits,
  type UnitUnlockMap,
} from '../services/unitLockService';
import {
  fetchCourseAccessSettings,
  getCourseIdsForClassroom,
  getCourseAccessSettings,
  isCourseOpenForClassroom,
  subscribeCourseAccessSettings,
  type CourseAccessSettings,
} from '../services/courseAccessService';
import './Curriculum.css';

const Curriculum: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = isAdminAuthed();
  const [selectedCourse, setSelectedCourse] = useState<Grade | null>(null);
  const [unlockedMap, setUnlockedMap] = useState<UnitUnlockMap>(() => getUnlockedUnits());
  const [courseAccessSettings, setCourseAccessSettings] = useState<CourseAccessSettings>(() => getCourseAccessSettings());
  const toast = useToast();

  // กรองคอร์สตามสิทธิ์
  const visibleGrades = useMemo(() => {
    if (isAdmin) return grades; // Admin เห็นทุกคอร์ส
    if (!user) return [];        // ไม่ login = ไม่เห็น
    const allowed = getCourseIdsForClassroom(user.classroom);
    return grades.filter((g) =>
      allowed.includes(g.id) &&
      isCourseOpenForClassroom(user.classroom, g.id, courseAccessSettings)
    );
  }, [user, isAdmin, courseAccessSettings]);

  // Stop scrolling when modal is open
  React.useEffect(() => {
    if (selectedCourse) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [selectedCourse]);

  React.useEffect(() => {
    let alive = true;

    fetchUnlockedUnits().then((data) => {
      if (alive) setUnlockedMap(data);
    });

    const unsubscribe = subscribeUnlockedUnits((data) => {
      if (alive) setUnlockedMap(data);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    let alive = true;

    fetchCourseAccessSettings().then((settings) => {
      if (alive) setCourseAccessSettings(settings);
    });

    const unsubscribe = subscribeCourseAccessSettings((settings) => {
      if (alive) setCourseAccessSettings(settings);
    });

    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

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

                {selectedCourse.technologyProfile && (
                  <div className="modal-section">
                    <h3><ClipboardCheck size={20} className="text-primary" /> กรอบรายวิชาเทคโนโลยี</h3>
                    <div className="technology-profile">
                      <div className="technology-profile-summary">
                        <span className="tech-hours">เวลาเรียน {selectedCourse.technologyProfile.hours} ชั่วโมง</span>
                        <p>{selectedCourse.technologyProfile.courseSummary}</p>
                        <small>อ้างอิงเอกสาร: {selectedCourse.technologyProfile.source}</small>
                      </div>

                      <div className="technology-profile-grid">
                        <section>
                          <h4>เน้นให้เด็กทำได้</h4>
                          <ul>
                            {selectedCourse.technologyProfile.focus.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </section>
                        <section>
                          <h4>ผลลัพธ์ปลายทาง</h4>
                          <ul>
                            {selectedCourse.technologyProfile.learningOutcomes.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </section>
                        <section>
                          <h4>หลักฐานการประเมิน</h4>
                          <ul>
                            {selectedCourse.technologyProfile.assessmentEvidence.map((item, i) => <li key={i}>{item}</li>)}
                          </ul>
                        </section>
                      </div>
                    </div>
                  </div>
                )}

                {/* Units List — แต่ละหน่วยกดได้ */}
                <div className="modal-section">
                  <h3><ListChecks size={20} className="text-primary" /> เนื้อหาที่จะได้เรียน ({selectedCourse.units?.length || 0} หน่วย)</h3>
                  <div className="modal-units-list">
                    {selectedCourse.units?.map((u: Unit) => {
                      const locked = isUnitLocked(selectedCourse.id, u.no, unlockedMap);
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
                            {u.activities?.length ? (
                              <div className="unit-activity-preview">
                                <strong>กิจกรรม:</strong> {u.activities.slice(0, 2).join(' • ')}
                              </div>
                            ) : null}
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
