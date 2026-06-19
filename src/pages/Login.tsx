import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import {
  LogIn, GraduationCap, Sparkles, Users, ChevronLeft, ChevronRight,
  Search, Edit3, CheckCircle2, UserPlus,
} from 'lucide-react';
import { allClassrooms2569 } from '../data/students2569';
import type { StudentInfo } from '../data/students2569';
import { loadAllRosters } from '../services/rosterService';
import './Login.css';

// อ่าน roster (built-in + แก้ไขจาก admin)
const students2569 = loadAllRosters();

type Step = 'classroom' | 'student';

const Login: React.FC = () => {
  const { user, loginAsStudent, clearStudentSession } = useAuth();
  const [loginReady, setLoginReady] = useState(false);
  const [step, setStep] = useState<Step>('classroom');
  const [classroom, setClassroom] = useState<string>('');
  const [pairMode, setPairMode] = useState(false);                  // โหมดนั่งคู่
  const [selected, setSelected] = useState<string[]>([]);           // studentCode[] ที่เลือก (1 หรือ 2 คน)
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);

  // Manual mode (ถ้าไม่อยู่ในรายชื่อ)
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualNo, setManualNo] = useState('');

  // ⚠️ All hooks ต้องอยู่ก่อน early return เพื่อ rules-of-hooks
  const studentList: StudentInfo[] = useMemo(() => {
    if (!classroom) return [];
    const main = students2569[classroom] || [];
    if (!search.trim()) return main;
    const q = search.toLowerCase();
    return main.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentCode.includes(q) ||
        String(s.no).includes(q)
    );
  }, [classroom, search]);

  useEffect(() => {
    if (user && user.id !== 'admin_teacher_account') {
      clearStudentSession();
    }
    setLoginReady(true);
    // Run once on page entry. After a new login succeeds, user changes and should navigate to Dashboard.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loginReady) {
    return (
      <div className="login-page page-transition">
        <div className="login-bg"></div>
        <div className="login-card">
          <h1>กำลังเตรียมหน้าเลือกนักเรียน...</h1>
        </div>
      </div>
    );
  }
  if (user?.id === 'admin_teacher_account') return <Navigate to="/dashboard" />;
  if (user) return <Navigate to="/dashboard" />;

  // คลิก card นักเรียน
  const handleCardClick = (s: StudentInfo) => {
    if (!pairMode) {
      // โหมดเดี่ยว → login เลย
      loginSingle(s);
      return;
    }
    // โหมดคู่ — toggle selection (สูงสุด 2 คน)
    setSelected((prev) => {
      if (prev.includes(s.studentCode)) {
        return prev.filter((c) => c !== s.studentCode);
      }
      if (prev.length >= 2) {
        // ถ้าเลือกครบ 2 แล้ว แทนที่คนแรก
        return [prev[1], s.studentCode];
      }
      return [...prev, s.studentCode];
    });
  };

  const loginSingle = async (s: StudentInfo) => {
    setSubmitting(s.studentCode);
    await loginAsStudent(s.name, classroom, String(s.no));
    setSubmitting(null);
  };

  const loginPair = async () => {
    if (selected.length !== 2) return;
    const [code1, code2] = selected;
    const s1 = (students2569[classroom] || []).find((s) => s.studentCode === code1);
    const s2 = (students2569[classroom] || []).find((s) => s.studentCode === code2);
    if (!s1 || !s2) return;
    setSubmitting('pair');
    // login เป็นคู่ — ระบบจะบันทึกคะแนนให้ทั้ง 2 คน
    await loginAsStudent(
      s1.name,
      classroom,
      String(s1.no),
      { name: s2.name, classroom, studentNumber: String(s2.no) }
    );
    setSubmitting(null);
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualNo.trim()) return;
    setSubmitting('manual');
    await loginAsStudent(manualName.trim(), classroom, manualNo);
    setSubmitting(null);
  };

  return (
    <div className="login-page page-transition">
      <div className="login-bg"></div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="login-card login-card-wide"
      >
        <div className="login-header">
          <div className="auth-icon">
            <GraduationCap size={44} />
          </div>
          <span className="badge-yellow" style={{ marginBottom: '0.75rem' }}>
            <Sparkles size={14} /> Student Portal
          </span>
          <h1>เข้าใช้งานระบบเรียน</h1>
          <p>
            {step === 'classroom'
              ? 'เลือกห้องเรียนของคุณก่อน'
              : `เลือกชื่อของคุณ — ห้อง ${classroom}`}
          </p>
        </div>

        {/* STEPPER */}
        <div className="login-stepper">
          <div className={`step ${step === 'classroom' ? 'active' : 'done'}`}>
            <div className="step-num">1</div>
            <span>เลือกห้อง</span>
          </div>
          <div className="step-line" />
          <div className={`step ${step === 'student' ? 'active' : ''}`}>
            <div className="step-num">2</div>
            <span>เลือกชื่อ</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === 'classroom' && (
            <motion.div
              key="classroom"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 style={{ marginBottom: 12 }}>
                <Users size={20} style={{ verticalAlign: 'middle' }} /> ห้องเรียนของคุณ
              </h3>
              <div className="class-grid">
                {allClassrooms2569.map((c) => {
                  const count = students2569[c]?.length || 0;
                  return (
                    <button
                      key={c}
                      className={`class-card ${classroom === c ? 'selected' : ''}`}
                      onClick={() => setClassroom(c)}
                    >
                      <div className="class-name">{c}</div>
                      <div className="class-count">{count} คน</div>
                      {classroom === c && <CheckCircle2 size={18} className="class-check" />}
                    </button>
                  );
                })}
              </div>

              <button
                className="btn-login-submit"
                disabled={!classroom}
                onClick={() => setStep('student')}
                style={{ marginTop: '1.5rem' }}
              >
                ถัดไป — เลือกชื่อ <ChevronRight size={20} />
              </button>
            </motion.div>
          )}

          {step === 'student' && (
            <motion.div
              key="student"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <button className="back-btn" onClick={() => setStep('classroom')}>
                <ChevronLeft size={16} /> กลับไปเลือกห้อง
              </button>

              {!manualMode ? (
                <>
                  <div className="search-box">
                    <Search size={16} />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ หรือเลขที่..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                  </div>

                  {/* Toggle "นั่งคู่" — เปิดแล้วเลือก 2 คนจาก grid ตรงๆ */}
                  <div className="pair-mode-toggle">
                    <label className={`pair-switch ${pairMode ? 'on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={pairMode}
                        onChange={(e) => {
                          setPairMode(e.target.checked);
                          setSelected([]);
                        }}
                      />
                      <span className="switch-slider"></span>
                      <span className="switch-text">
                        <UserPlus size={16} /> โหมดนั่งคู่ <strong>(2 คน/เครื่อง)</strong>
                      </span>
                    </label>
                    {pairMode && (
                      <span className="pair-hint">
                        👆 กดเลือกชื่อ <strong>2 คน</strong>ที่นั่งด้วยกัน
                      </span>
                    )}
                  </div>

                  {studentList.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                      ไม่พบนักเรียน — ลองเปลี่ยนคำค้น
                    </p>
                  ) : (
                    <div className="student-grid">
                      {studentList.map((s) => {
                        const idx = selected.indexOf(s.studentCode);
                        const isSelected = idx !== -1;
                        return (
                          <button
                            key={s.studentCode}
                            className={`student-card ${isSelected ? 'selected-card' : ''}`}
                            onClick={() => handleCardClick(s)}
                            disabled={submitting !== null}
                          >
                            {isSelected && (
                              <div className="sc-pick-num">{idx + 1}</div>
                            )}
                            <div className="sc-emoji">{s.emoji}</div>
                            <div className="sc-info">
                              <div className="sc-no">เลข {s.no}</div>
                              <div className="sc-name">{s.name}</div>
                            </div>
                            {submitting === s.studentCode && (
                              <div className="sc-loading">⏳</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Pair confirm bar — โผล่เฉพาะตอน pairMode + เลือกครบ 2 คน */}
                  {pairMode && selected.length > 0 && (
                    <motion.div
                      initial={{ y: 50, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`pair-confirm-bar ${selected.length === 2 ? 'ready' : ''}`}
                    >
                      <div className="pcb-info">
                        <strong>เลือกแล้ว {selected.length}/2 คน:</strong>
                        <span>
                          {selected.map((code, i) => {
                            const s = (students2569[classroom] || []).find((x) => x.studentCode === code);
                            return s ? (
                              <span key={code} className="pcb-chip">
                                {i === 0 ? '👤' : '👥'} เลข {s.no} {s.name}
                              </span>
                            ) : null;
                          })}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-secondary" onClick={() => setSelected([])}>
                          ล้าง
                        </button>
                        {selected.length === 2 ? (
                          <button
                            className="btn-login-submit pcb-submit"
                            onClick={loginPair}
                            disabled={submitting !== null}
                          >
                            {submitting === 'pair' ? 'กำลังเข้า...' : (
                              <><LogIn size={18} /> เข้าสู่ระบบทั้งคู่</>
                            )}
                          </button>
                        ) : (
                          <span style={{ padding: '0.5rem 1rem', color: '#6b7280', fontSize: '0.85rem' }}>
                            เหลืออีก 1 คน
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )}

                  <button
                    className="manual-toggle"
                    onClick={() => setManualMode(true)}
                  >
                    <Edit3 size={14} /> ไม่อยู่ในรายชื่อ? — กรอกชื่อเอง
                  </button>
                </>
              ) : (
                <form onSubmit={handleManualLogin} className="manual-form">
                  <div className="input-group">
                    <label>ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      placeholder="ตัวอย่าง: ด.ช. สมชาย ใจดี"
                      required
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="input-group">
                    <label>เลขที่</label>
                    <input
                      type="number"
                      placeholder="01"
                      required
                      min="1"
                      max="99"
                      value={manualNo}
                      onChange={(e) => setManualNo(e.target.value)}
                    />
                  </div>
                  <button
                    className="btn-login-submit"
                    type="submit"
                    disabled={submitting !== null}
                  >
                    {submitting === 'manual' ? 'กำลังเข้าสู่ระบบ...' : (
                      <><LogIn size={20} /> เข้าสู่ห้องเรียน</>
                    )}
                  </button>
                  <button
                    type="button"
                    className="back-btn"
                    onClick={() => setManualMode(false)}
                  >
                    <ChevronLeft size={16} /> กลับไปเลือกจากรายชื่อ
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <p className="auth-footer" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center' }}>
          <span>* เครื่องห้องคอมจะไม่จำชื่อนักเรียนข้ามรอบใช้งาน • ครูเห็นคะแนนได้แบบเรียลไทม์</span>
          <Link 
            to="/admin" 
            style={{ 
              color: '#FAB005', 
              fontWeight: 700, 
              textDecoration: 'none', 
              fontSize: '0.85rem', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              padding: '0.45rem 1.25rem',
              borderRadius: '20px',
              border: '1px solid rgba(250, 176, 5, 0.3)',
              background: 'rgba(250, 176, 5, 0.06)',
              transition: 'all 0.2s',
            }}
            className="teacher-login-btn"
          >
            🔑 สำหรับคุณครู/ผู้ดูแลระบบ (Admin Login)
          </Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
