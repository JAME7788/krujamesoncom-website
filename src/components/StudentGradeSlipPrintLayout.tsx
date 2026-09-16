import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  type ClassroomExportSummary,
  type StudentExportRow,
  COURSE_TEACHER_NAME,
  SCHOOL_DIRECTOR_NAME,
} from '../services/gradeExportService';
import { examMaxScores } from '../services/gradeService';

interface StudentGradeSlipPrintLayoutProps {
  summary: ClassroomExportSummary;
  selectedStudentCode?: string; // ถ้ากำหนดจะพิมพ์เฉพาะคนนี้ ถ้าไม่กำหนดจะพิมพ์ทั้งห้อง
  onClose: () => void;
}

export const StudentGradeSlipPrintLayout: React.FC<StudentGradeSlipPrintLayoutProps> = ({
  summary,
  selectedStudentCode,
  onClose,
}) => {
  const studentsToPrint: StudentExportRow[] = selectedStudentCode
    ? summary.rows.filter((r) => r.studentCode === selectedStudentCode)
    : summary.rows;

  const exam = examMaxScores(summary.classroom);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="slip-print-container">
      {/* Toolbar */}
      <div className="slip-no-print slip-action-bar">
        <div className="slip-action-info">
          <strong>ใบแจ้งผลการเรียนรายบุคคล (ปพ.6) — {summary.classroom}</strong>
          <span>
            {selectedStudentCode ? `พิมพ์เฉพาะบุคคล (${studentsToPrint[0]?.fullName || ''})` : `พิมพ์ทั้งห้อง (${studentsToPrint.length} คน • 2 คน/แผ่น)`}
          </span>
        </div>
        <div className="slip-action-buttons">
          <button
            type="button"
            className="slip-btn slip-btn-primary"
            onClick={handlePrint}
          >
            <Printer size={16} /> สั่งพิมพ์ / บันทึก PDF
          </button>
          <button
            type="button"
            className="slip-btn slip-btn-close"
            onClick={onClose}
          >
            <X size={18} /> ปิด
          </button>
        </div>
      </div>

      {/* เอกสาร Slip พิมพ์ */}
      <div className="slip-pages-wrapper">
        {studentsToPrint.map((student, index) => (
          <div key={student.studentCode} className={`slip-card ${(index + 1) % 2 === 0 ? 'slip-page-break' : ''}`}>
            <div className="slip-card-inner">
              {/* Header */}
              <div className="slip-header">
                <div className="slip-school-badge">🏫 {summary.schoolName}</div>
                <h2 className="slip-doc-title">ใบแจ้งผลการเรียนรายบุคคลประจำวิชา</h2>
                <div className="slip-sub-info">
                  กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี • ภาคเรียนที่ 1 ปีการศึกษา {summary.academicYear}
                </div>
              </div>

              {/* Student info bar */}
              <div className="slip-student-info">
                <div><strong>เลขที่:</strong> {student.studentNo}</div>
                <div><strong>รหัสประจำตัว:</strong> {student.studentCode}</div>
                <div><strong>ชื่อ-สกุล:</strong> {student.fullName}</div>
                <div><strong>ชั้น:</strong> {summary.classroom}</div>
              </div>

              {/* Subject & Score Table */}
              <table className="slip-table">
                <thead>
                  <tr>
                    <th>รายวิชา</th>
                    <th>คะแนนเก็บ (70)</th>
                    {exam.midterm > 0 && <th>กลางภาค ({exam.midterm})</th>}
                    <th>ปลายภาค ({exam.final})</th>
                    <th>คะแนนรวม (100)</th>
                    <th>ระดับผลการเรียน</th>
                    <th>ผลการตัดสิน</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="text-left font-bold">
                      {summary.subjectTitle} ({summary.subjectCode})
                    </td>
                    <td>{student.totalCollected}</td>
                    {exam.midterm > 0 && <td>{student.midtermExam}</td>}
                    <td>{student.finalExam}</td>
                    <td className="font-bold font-large">{student.totalScore}</td>
                    <td className="font-bold font-large grade-badge">{student.grade}</td>
                    <td className={`font-bold ${student.isPassed ? 'text-pass' : 'text-fail'}`}>
                      {student.evaluationText}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Additional Assessments */}
              <div className="slip-attributes-grid">
                <div className="attr-item">
                  <span className="attr-label">คุณลักษณะอันพึงประสงค์:</span>
                  <span className="attr-val">
                    {student.characteristicsScore === 3 ? 'ดีเยี่ยม (3)' : student.characteristicsScore === 2 ? 'ดี (2)' : 'ผ่าน (1)'}
                  </span>
                </div>
                <div className="attr-item">
                  <span className="attr-label">การอ่าน คิดวิเคราะห์ และเขียน:</span>
                  <span className="attr-val">
                    {student.readingThinkingScore === 3 ? 'ดีเยี่ยม (3)' : student.readingThinkingScore === 2 ? 'ดี (2)' : 'ผ่าน (1)'}
                  </span>
                </div>
                <div className="attr-item">
                  <span className="attr-label">สมรรถนะสำคัญของผู้เรียน:</span>
                  <span className="attr-val">
                    {student.competencyScore === 3 ? 'ดีเยี่ยม (3)' : student.competencyScore === 2 ? 'ดี (2)' : 'ผ่าน (1)'}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="slip-footer">
                <div className="slip-sig-box">
                  <div className="slip-sig-line">ลงชื่อ........................................................</div>
                  <div className="slip-sig-name">({COURSE_TEACHER_NAME})</div>
                  <div className="slip-sig-role">ครูผู้สอน</div>
                </div>

                <div className="slip-sig-box">
                  <div className="slip-sig-line">ลงชื่อ........................................................</div>
                  <div className="slip-sig-name">({SCHOOL_DIRECTOR_NAME})</div>
                  <div className="slip-sig-role">ผู้อำนวยการโรงเรียน</div>
                </div>

                <div className="slip-sig-box">
                  <div className="slip-sig-line">ลงชื่อ........................................................</div>
                  <div className="slip-sig-name">(........................................................)</div>
                  <div className="slip-sig-role">ผู้ปกครองผู้รับทราบ</div>
                </div>
              </div>
            </div>

            {/* รอยปรุตัดกระดาษ */}
            <div className="slip-cut-line">
              <span>✂ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - ✂</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .slip-print-container {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #f1f5f9;
          z-index: 99999;
          overflow-y: auto;
          font-family: 'TH Sarabun New', 'Sarabun', -apple-system, sans-serif;
          color: #0f172a;
        }

        .slip-action-bar {
          position: sticky;
          top: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #1e293b;
          color: white;
          padding: 12px 24px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10;
        }

        .slip-action-info strong {
          font-size: 1.1rem;
          display: block;
        }

        .slip-action-info span {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .slip-action-buttons {
          display: flex;
          gap: 10px;
        }

        .slip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .slip-btn-primary { background: #22c55e; color: white; }
        .slip-btn-primary:hover { background: #16a34a; }

        .slip-btn-close { background: #ef4444; color: white; }
        .slip-btn-close:hover { background: #dc2626; }

        .slip-pages-wrapper {
          max-width: 210mm;
          margin: 20px auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .slip-card {
          background: white;
          padding: 15mm 15mm 5mm;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          box-sizing: border-box;
        }

        .slip-card-inner {
          border: 2px solid #334155;
          border-radius: 8px;
          padding: 14px 18px;
        }

        .slip-header {
          text-align: center;
          margin-bottom: 10px;
        }

        .slip-school-badge {
          font-size: 1rem;
          font-weight: bold;
          color: #334155;
        }

        .slip-doc-title {
          font-size: 1.35rem;
          font-weight: bold;
          margin: 2px 0;
          color: #0f172a;
        }

        .slip-sub-info {
          font-size: 0.9rem;
          color: #64748b;
        }

        .slip-student-info {
          display: grid;
          grid-template-columns: auto auto 1fr auto;
          gap: 16px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 0.95rem;
          margin-bottom: 10px;
        }

        .slip-table {
          width: 100%;
          border-collapse: collapse;
          text-align: center;
          font-size: 0.9rem;
          margin-bottom: 10px;
        }

        .slip-table th, .slip-table td {
          border: 1px solid #64748b;
          padding: 6px 8px;
        }

        .slip-table th {
          background: #f1f5f9;
          font-weight: bold;
        }

        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-large { font-size: 1.1rem; }
        .grade-badge { color: #16a34a; }
        .text-pass { color: #16a34a; }
        .text-fail { color: #dc2626; }

        .slip-attributes-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          font-size: 0.85rem;
          background: #fafafa;
          padding: 6px 10px;
          border: 1px dashed #cbd5e1;
          border-radius: 6px;
          margin-bottom: 14px;
        }

        .attr-label { color: #475569; }
        .attr-val { font-weight: bold; color: #0f172a; margin-left: 4px; }

        .slip-footer {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          text-align: center;
          font-size: 0.85rem;
          margin-top: 10px;
        }

        .slip-sig-box {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .slip-sig-name { font-weight: 600; margin-top: 2px; }
        .slip-sig-role { font-size: 0.8rem; color: #64748b; }

        .slip-cut-line {
          text-align: center;
          color: #94a3b8;
          font-size: 0.8rem;
          margin-top: 12px;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          .slip-no-print {
            display: none !important;
          }

          .slip-print-container {
            position: static;
            background: white;
            padding: 0;
            overflow: visible;
          }

          .slip-pages-wrapper {
            margin: 0 !important;
            gap: 0 !important;
          }

          .slip-card {
            box-shadow: none !important;
            padding: 4mm 0 10mm !important;
            page-break-inside: avoid;
          }

          .slip-page-break {
            page-break-after: always;
          }
        }
      `}</style>
    </div>
  );
};
