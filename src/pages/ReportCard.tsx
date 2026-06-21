import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Printer, ChevronLeft, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  loadGrades, getIndicators, computeBreakdown, computeGrade,
  getSubjectsForClassroom, examMaxScores, SCORE_WEIGHT,
  fetchClassroomFromFirebase, saveGrades, COURSE_TEACHER_NAME,
  getGradingPeriodLabel, getExamPolicyLabel,
} from '../services/gradeService';
import type { Subject } from '../services/gradeService';
import { getSummary } from '../services/progressService';
import './ReportCard.css';

const ReportCard: React.FC = () => {
  const { user, partner } = useAuth();
  const [printableMode, setPrintableMode] = useState(false);
  const [loadingGrades, setLoadingGrades] = useState(true);
  const [localGradesVersion, setLocalGradesVersion] = useState(0);

  const stats = useMemo(() => (user ? getSummary(user.id) : null), [user]);

  useEffect(() => {
    if (!user) return;

    const syncGrades = async () => {
      setLoadingGrades(true);
      try {
        const subjects = getSubjectsForClassroom(user.classroom);
        let updated = false;
        for (const subj of subjects) {
          const remoteGrades = await fetchClassroomFromFirebase(user.classroom, subj.id);
          if (remoteGrades) {
            saveGrades(user.classroom, remoteGrades, subj.id);
            updated = true;
          }
        }
        if (updated) {
          setLocalGradesVersion((v) => v + 1);
        }
      } catch (e) {
        console.warn('Sync grades failed', e);
      } finally {
        setLoadingGrades(false);
      }
    };

    syncGrades();
  }, [user]);

  if (!user) {
    return (
      <div className="report-card-page container section-padding">
        <div className="rc-empty">
          <GraduationCap size={48} />
          <h2>กรุณาเข้าสู่ระบบ</h2>
          <p>เพื่อดูสมุดรายงานผลการเรียนของคุณ</p>
          <Link to="/login" className="btn-primary">เข้าสู่ระบบ</Link>
        </div>
      </div>
    );
  }

  const subjects = getSubjectsForClassroom(user.classroom);

  const findMyGrade = (subject: Subject) => {
    // Reference localGradesVersion to satisfy TypeScript compile checks and trigger updates
    void localGradesVersion;
    const grades = loadGrades(user.classroom, subject);
    return grades.find(
      (g) => g.studentNo === parseInt(user.studentNumber) || g.name === user.name
    );
  };

  const handlePrint = () => {
    setPrintableMode(true);
    setTimeout(() => {
      window.print();
      setPrintableMode(false);
    }, 100);
  };

  return (
    <div className={`report-card-page container ${printableMode ? 'print-mode' : ''}`}>
      {!printableMode && (
        <div className="rc-toolbar">
          <Link to="/dashboard" className="game-back">
            <ChevronLeft size={18} /> แดชบอร์ด
          </Link>
          <button className="btn-primary" onClick={handlePrint}>
            <Printer size={18} /> พิมพ์/ดาวน์โหลด PDF
          </button>
        </div>
      )}

      <div className="rc-paper">
        {/* Header */}
        <div className="rc-header">
          <div className="rc-school-logo">🎓</div>
          <div className="rc-school-info">
            <h1>โรงเรียนบ้านคลองมดแดง</h1>
            <p>สมุดรายงานผลการเรียน • {getGradingPeriodLabel(user.classroom)}</p>
            <p className="rc-subject">วิชาเทคโนโลยี • {getExamPolicyLabel(user.classroom)}</p>
          </div>
        </div>

        {/* Student info */}
        <div className="rc-student">
          <div className="rc-student-row">
            <div><strong>ชื่อ-นามสกุล:</strong> {user.name}</div>
            <div><strong>ชั้น:</strong> {user.classroom}</div>
            <div><strong>เลขที่:</strong> {user.studentNumber}</div>
          </div>
          {partner && (
            <div className="rc-partner">
              👯 เรียนคู่กับ: {partner.name} (เลข {partner.studentNumber})
            </div>
          )}
        </div>

        {/* Subjects */}
        {subjects.map((subj) => {
          const grade = findMyGrade(subj.id);
          if (!grade) {
            return (
              <div key={subj.id} className="rc-subject-block">
                <h2>{subj.emoji} {subj.title} ({subj.code})</h2>
                {loadingGrades ? (
                  <p style={{ color: '#6366f1', fontStyle: 'italic' }}>กำลังดึงข้อมูลคะแนนจากระบบ...</p>
                ) : (
                  <p style={{ color: '#9ca3af', fontStyle: 'italic' }}>ยังไม่มีข้อมูลคะแนน — เริ่มเรียนเพื่อสะสมคะแนน</p>
                )}
              </div>
            );
          }
          const indicators = getIndicators(user.classroom, subj.id);
          const breakdown = computeBreakdown(grade, user.classroom, subj.id);
          const finalGrade = computeGrade(grade, user.classroom, subj.id);
          const exam = examMaxScores(user.classroom);

          return (
            <div key={subj.id} className="rc-subject-block">
              <h2>{subj.emoji} {subj.title} ({subj.code})</h2>

              {/* Indicators table */}
              <table className="rc-table">
                <thead>
                  <tr>
                    <th>ตัวชี้วัด</th>
                    <th>K (ความรู้)</th>
                    <th>P (ทักษะ)</th>
                    <th>A (จิตพิสัย)</th>
                  </tr>
                </thead>
                <tbody>
                  {indicators.map((ind) => {
                    const s = grade.indicators[ind.id];
                    if (!s) return null;
                    return (
                      <tr key={ind.id}>
                        <td>
                          <strong>{ind.code}</strong><br/>
                          <small>{ind.title}</small>
                        </td>
                        <td className="rc-num">{s.k}/{ind.maxScore}</td>
                        <td className="rc-num">
                          <span className={`p-${s.p}`}>{s.p}</span>
                        </td>
                        <td className="rc-num">{s.a ? '✓' : '✗'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Score breakdown */}
              <table className="rc-summary-table">
                <tbody>
                  <tr>
                    <td>คะแนน K (ความรู้, จาก 40)</td>
                    <td className="rc-num">{breakdown.k.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td>คะแนน P (ทักษะ, จาก 20)</td>
                    <td className="rc-num">{breakdown.p.toFixed(1)}</td>
                  </tr>
                  <tr>
                    <td>คะแนน A (จิตพิสัย, จาก 10)</td>
                    <td className="rc-num">{breakdown.a.toFixed(1)}</td>
                  </tr>
                  <tr className="rc-subtotal">
                    <td><strong>รวมคะแนนเก็บ (จาก {SCORE_WEIGHT.COLLECTED})</strong></td>
                    <td className="rc-num"><strong>{breakdown.collected.toFixed(1)}</strong></td>
                  </tr>
                  {exam.midterm > 0 && (
                    <tr>
                      <td>สอบกลางภาค (จาก {exam.midterm})</td>
                      <td className="rc-num">{breakdown.midterm}</td>
                    </tr>
                  )}
                  <tr>
                    <td>สอบปลายภาค (จาก {exam.final})</td>
                    <td className="rc-num">{breakdown.final}</td>
                  </tr>
                  <tr className="rc-total">
                    <td><strong>คะแนนรวม (จาก 100)</strong></td>
                    <td className="rc-num"><strong>{breakdown.total.toFixed(1)}</strong></td>
                  </tr>
                  <tr className="rc-grade">
                    <td><strong>เกรด</strong></td>
                    <td className="rc-num"><strong className={`grade-${finalGrade.replace('.', '_')}`}>{finalGrade}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        })}

        {/* Engagement summary */}
        {stats && (
          <div className="rc-engagement">
            <h3>📊 สถิติการเรียนในระบบ</h3>
            <div className="rc-stats-grid">
              <div className="rc-stat-cell">
                <strong>{stats.totalSlidesViewed}</strong>
                <small>สไลด์ที่อ่าน</small>
              </div>
              <div className="rc-stat-cell">
                <strong>{stats.totalActivities}</strong>
                <small>กิจกรรม/สื่อที่เล่น</small>
              </div>
              <div className="rc-stat-cell">
                <strong>{stats.recentAttempts.length}</strong>
                <small>แบบทดสอบที่ทำ</small>
              </div>
              <div className="rc-stat-cell">
                <strong>{stats.averageScore}%</strong>
                <small>คะแนนเฉลี่ยควิซ</small>
              </div>
            </div>
          </div>
        )}

        {/* Signatures */}
        <div className="rc-signatures">
          <div className="rc-sig-block">
            <div className="rc-sig-line"></div>
            <p>นักเรียน</p>
            <small>{user.name}</small>
          </div>
          <div className="rc-sig-block">
            <div className="rc-sig-line"></div>
            <p>ครูประจำวิชา</p>
            <small>{COURSE_TEACHER_NAME}</small>
          </div>
          <div className="rc-sig-block">
            <div className="rc-sig-line"></div>
            <p>ผู้ปกครอง</p>
            <small>(ลงนามรับทราบ)</small>
          </div>
        </div>

        <div className="rc-footer">
          <small>📅 พิมพ์เมื่อ: {new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })}</small>
        </div>
      </div>
    </div>
  );
};

export default ReportCard;
