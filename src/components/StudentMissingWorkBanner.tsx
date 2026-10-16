import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ClipboardList, ExternalLink, Upload } from 'lucide-react';
import {
  fetchAssignmentsFromFirebase,
  fetchSubmissionsFromFirebase,
  getStudentWorkStatusOverview,
} from '../services/homeworkService';

interface Props {
  classroom: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
}

const StudentMissingWorkBanner: React.FC<Props> = ({
  classroom,
  studentId,
  studentNumber,
  studentName,
}) => {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchAssignmentsFromFirebase(), fetchSubmissionsFromFirebase()])
      .then(() => {
        if (!cancelled) setVersion((v) => v + 1);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [classroom, studentId]);

  const overview = useMemo(() => {
    void version;
    return getStudentWorkStatusOverview(
      classroom,
      studentId,
      parseInt(studentNumber),
      studentName,
    );
  }, [classroom, studentId, studentNumber, studentName, version]);

  const hasMissing = overview.totalMissingCount > 0;
  const hasOverdue = overview.overdueCount > 0;

  return (
    <div
      className="student-missing-work-card glass"
      style={{
        padding: '1.15rem 1.35rem',
        borderRadius: 18,
        marginBottom: 16,
        background: hasOverdue
          ? 'linear-gradient(135deg, rgba(254, 242, 242, 0.96) 0%, rgba(255, 241, 242, 0.92) 100%)'
          : hasMissing
            ? 'linear-gradient(135deg, rgba(255, 251, 235, 0.96) 0%, rgba(254, 243, 199, 0.9) 100%)'
            : 'linear-gradient(135deg, rgba(240, 253, 244, 0.96) 0%, rgba(220, 252, 231, 0.88) 100%)',
        border: hasOverdue
          ? '1.5px solid #f87171'
          : hasMissing
            ? '1.5px solid #f59e0b'
            : '1.5px solid #22c55e',
        boxShadow: '0 6px 20px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: hasOverdue ? '#fee2e2' : hasMissing ? '#fef3c7' : '#dcfce7',
              color: hasOverdue ? '#dc2626' : hasMissing ? '#d97706' : '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {hasMissing ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '1.02rem', color: '#0f172a' }}>
                {hasMissing
                  ? `📌 แจ้งเตือนงานค้างของฉัน (${overview.totalMissingCount} รายการ)`
                  : '🎉 สถานะการส่งงาน: ส่งงานครบทุกชิ้นแล้ว!'}
              </strong>
              {overview.overdueCount > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    background: '#dc2626',
                    color: '#ffffff',
                  }}
                >
                  🚨 เลยกำหนด {overview.overdueCount} ชิ้น
                </span>
              )}
              {overview.pendingCount > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    background: '#f59e0b',
                    color: '#ffffff',
                  }}
                >
                  ⏳ รอส่ง {overview.pendingCount} ชิ้น
                </span>
              )}
              {overview.waitingReviewCount > 0 && (
                <span
                  style={{
                    padding: '2px 8px',
                    borderRadius: 999,
                    fontSize: '0.73rem',
                    fontWeight: 800,
                    background: '#0284c7',
                    color: '#ffffff',
                  }}
                >
                  📋 รอครูตรวจ {overview.waitingReviewCount} ชิ้น
                </span>
              )}
            </div>
            <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: '#475569' }}>
              {hasMissing
                ? 'คลิกที่งานด้านล่างเพื่อเปิดส่งงานได้ทันที หรือไปที่หน้าการบ้านเพื่อดูคำใบ้ช่วยเหลือ'
                : `ส่งการบ้านแล้ว ${overview.completedCount} ชิ้น (ตรวจแล้ว ${overview.gradedCount} ชิ้น) • ไม่มีงานค้างในระบบ`}
            </p>
          </div>
        </div>

        <Link
          to={hasMissing ? '/homework?filter=missing' : '/homework'}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            fontSize: '0.85rem',
            background: hasOverdue
              ? 'linear-gradient(135deg, #ef4444, #dc2626)'
              : hasMissing
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
          }}
        >
          <ClipboardList size={16} /> {hasMissing ? 'ดูและส่งงานค้างทั้งหมด' : 'เปิดหน้าส่งงานของฉัน'}
        </Link>
      </div>

      {hasMissing && (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: '1px dashed rgba(15, 23, 42, 0.14)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {overview.missingTasks.slice(0, 5).map((item) => (
            <div
              key={item.assignment.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                padding: '7px 11px',
                borderRadius: 10,
                background: '#ffffff',
                border: item.isOverdue ? '1px solid #fca5a5' : '1px solid #fde68a',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: item.isOverdue ? '#fee2e2' : '#fef3c7',
                    color: item.isOverdue ? '#b91c1c' : '#92400e',
                  }}
                >
                  {item.isOverdue ? 'เลยกำหนด' : 'ค้างส่ง'}
                </span>
                <strong style={{ fontSize: '0.86rem', color: '#1e293b' }}>{item.assignment.title}</strong>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  • {item.dueLabel}
                </span>
              </div>
              <Link
                to={`/homework?id=${encodeURIComponent(item.assignment.id)}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: '#4f46e5',
                  color: '#ffffff',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                }}
              >
                <Upload size={12} /> ส่งงานนี้
              </Link>
            </div>
          ))}

          {overview.missingManualAssessments.slice(0, 3).map((ma) => (
            <div
              key={ma.assessmentId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                padding: '7px 11px',
                borderRadius: 10,
                background: '#ffffff',
                border: '1px dashed #fbbf24',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: '#fef3c7',
                    color: '#92400e',
                  }}
                >
                  ใบงานในชั้นเรียน
                </span>
                <strong style={{ fontSize: '0.86rem', color: '#1e293b' }}>{ma.title}</strong>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>
                  • วิชา{ma.subjectTitle} ({ma.indicatorCode}) • เต็ม {ma.maxScore} คะแนน
                </span>
              </div>
              {ma.resourceUrl ? (
                <a
                  href={ma.resourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '4px 10px',
                    borderRadius: 8,
                    background: '#0ea5e9',
                    color: '#ffffff',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                  }}
                >
                  <ExternalLink size={12} /> เปิดใบงาน
                </a>
              ) : (
                <Link
                  to="/homework"
                  style={{
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    color: '#b45309',
                  }}
                >
                  ดูรายละเอียด →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentMissingWorkBanner;
