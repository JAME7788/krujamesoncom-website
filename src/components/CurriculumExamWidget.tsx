import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ListChecks, ArrowRight } from 'lucide-react';
import {
  getExamSetsByGrade,
  getBestScoreForExamSet,
  type ExamSet,
} from '../services/examService';

interface CurriculumExamWidgetProps {
  studentId: string;
  classroom: string;
}

export const CurriculumExamWidget: React.FC<CurriculumExamWidgetProps> = ({
  studentId,
  classroom,
}) => {
  const sets: ExamSet[] = useMemo(() => {
    return getExamSetsByGrade(classroom);
  }, [classroom]);

  // สถิติภาพรวม
  const stats = useMemo(() => {
    let completedCount = 0;
    let passedCount = 0;
    let totalScorePct = 0;

    sets.forEach((set) => {
      const best = getBestScoreForExamSet(studentId, set.id);
      if (best) {
        completedCount++;
        totalScorePct += best.percentage;
        if (best.percentage >= 50) passedCount++;
      }
    });

    const avgScore = completedCount > 0 ? Math.round(totalScorePct / completedCount) : 0;
    return { completedCount, passedCount, avgScore, totalSets: sets.length };
  }, [sets, studentId]);

  if (sets.length === 0) return null;

  return (
    <div
      className="section-card glass curriculum-exam-widget"
      style={{
        marginBottom: 16,
        padding: '1.25rem 1.5rem',
        borderRadius: 18,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
        border: '1.5px solid #e0e7ff',
        boxShadow: '0 4px 20px rgba(99, 102, 241, 0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '1.5rem' }}>📚</span>
            <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1e293b' }}>
              คลังข้อสอบมาตรฐานหลักสูตร ว 4.2 (ชั้น {classroom})
            </h3>
          </div>
          <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.85rem' }}>
            แบบทดสอบวัดผลสัมฤทธิ์ทางการเรียนวิทยาการคำนวณ 25 ชุด ตามมาตรฐาน สพฐ.
          </p>
        </div>

        {/* Summary Badges & Link to Full Bank */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#e0e7ff',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: '0.8rem',
              color: '#3730a3',
              fontWeight: 700,
            }}
          >
            สอบแล้ว {stats.completedCount}/{stats.totalSets} ชุด
          </span>
          {stats.completedCount > 0 && (
            <span
              style={{
                background: stats.avgScore >= 70 ? '#dcfce7' : '#fef3c7',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: '0.8rem',
                color: stats.avgScore >= 70 ? '#166534' : '#92400e',
                fontWeight: 700,
              }}
            >
              คะแนนเฉลี่ย {stats.avgScore}%
            </span>
          )}
          <Link
            to="/quiz/all"
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#4f46e5',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            คลังข้อสอบทั้งหมด <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 12,
        }}
      >
        {sets.map((set) => {
          const best = getBestScoreForExamSet(studentId, set.id);
          const isPassed = best && best.percentage >= 50;

          return (
            <div
              key={set.id}
              style={{
                background: '#ffffff',
                border: best ? (isPassed ? '1.5px solid #86efac' : '1.5px solid #fed7aa') : '1.5px solid #e2e8f0',
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                transition: 'all 0.2s ease',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        background: '#e0e7ff',
                        color: '#4338ca',
                        padding: '2px 8px',
                        borderRadius: 6,
                      }}
                    >
                      {set.grade}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                      ชุดที่ {set.setNumber}
                    </span>
                  </div>

                  {best ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: isPassed ? '#dcfce7' : '#fee2e2',
                        color: isPassed ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {isPassed ? '✓ ผ่านเกณฑ์' : 'ทบทวนใหม่'} ({best.percentage}%)
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        borderRadius: 999,
                        background: '#f1f5f9',
                        color: '#64748b',
                      }}
                    >
                      ยังไม่ได้ทำ
                    </span>
                  )}
                </div>

                <h4 style={{ margin: '4px 0 6px', fontSize: '0.92rem', color: '#1e293b', lineHeight: 1.4 }}>
                  {set.title}
                </h4>

                <div style={{ display: 'flex', gap: 12, fontSize: '0.78rem', color: '#64748b', marginBottom: 12 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <ListChecks size={14} color="#6366f1" /> {set.totalQuestions} ข้อ
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={14} color="#6366f1" /> {set.timeLimitMinutes} นาที
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: 10,
                  borderTop: '1px solid #f1f5f9',
                }}
              >
                {best ? (
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#334155' }}>
                    🏆 สูงสุด: {best.score}/{best.total}
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    เกณฑ์ผ่าน 50%
                  </span>
                )}

                <Link
                  to={`/quiz/${set.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    borderRadius: 10,
                    background: best ? '#f8fafc' : 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                    color: best ? '#4338ca' : '#ffffff',
                    border: best ? '1px solid #c7d2fe' : 'none',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    textDecoration: 'none',
                    boxShadow: best ? 'none' : '0 2px 8px rgba(79, 70, 229, 0.25)',
                    cursor: 'pointer',
                  }}
                >
                  {best ? '🔄 สอบทบทวน' : '✍️ ทำข้อสอบ'}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CurriculumExamWidget;
