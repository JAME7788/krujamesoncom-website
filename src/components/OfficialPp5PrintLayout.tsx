import React from 'react';
import { Printer, X, FileSpreadsheet, Download } from 'lucide-react';
import {
  type ClassroomExportSummary,
  COURSE_TEACHER_NAME,
  ACADEMIC_HEAD_NAME,
  SCHOOL_DIRECTOR_NAME,
  downloadClassroomExcelFile,
  downloadClassroomCsvFile,
} from '../services/gradeExportService';
import { examMaxScores } from '../services/gradeService';

interface OfficialPp5PrintLayoutProps {
  summary: ClassroomExportSummary;
  onClose: () => void;
}

export const OfficialPp5PrintLayout: React.FC<OfficialPp5PrintLayoutProps> = ({
  summary,
  onClose,
}) => {
  const exam = examMaxScores(summary.classroom);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="pp5-print-container">
      {/* Action Toolbar (ซ่อนเวลาพิมพ์) */}
      <div className="pp5-no-print pp5-action-bar">
        <div className="pp5-action-info">
          <strong>แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5) — {summary.classroom}</strong>
          <span>{summary.subjectTitle} ({summary.subjectCode}) • จำนวน {summary.stats.totalStudents} คน</span>
        </div>
        <div className="pp5-action-buttons">
          <button
            type="button"
            className="pp5-btn pp5-btn-secondary"
            onClick={() => downloadClassroomExcelFile(summary.classroom, summary.subject)}
          >
            <FileSpreadsheet size={16} /> ดาวน์โหลด Excel
          </button>
          <button
            type="button"
            className="pp5-btn pp5-btn-secondary"
            onClick={() => downloadClassroomCsvFile(summary.classroom, summary.subject)}
          >
            <Download size={16} /> ดาวน์โหลด CSV
          </button>
          <button
            type="button"
            className="pp5-btn pp5-btn-primary"
            onClick={handlePrint}
          >
            <Printer size={16} /> สั่งพิมพ์ / บันทึก PDF
          </button>
          <button
            type="button"
            className="pp5-btn pp5-btn-close"
            onClick={onClose}
          >
            <X size={18} /> ปิด
          </button>
        </div>
      </div>

      {/* เอกสาร ปพ.5 มาตรฐาน A4 (พิมพ์จริง) */}
      <div className="pp5-page">
        {/* หัวเอกสารราชการ */}
        <div className="pp5-header">
          <div className="pp5-emblem-space">
            <span className="pp5-thai-garuda">🏫</span>
          </div>
          <h1 className="pp5-title">{summary.schoolName}</h1>
          <h2 className="pp5-subtitle">แบบบันทึกผลการพัฒนาคุณภาพผู้เรียน (ปพ.5)</h2>
          <div className="pp5-meta-grid">
            <div><strong>กลุ่มสาระการเรียนรู้:</strong> วิทยาศาสตร์และเทคโนโลยี</div>
            <div><strong>รายวิชา:</strong> {summary.subjectTitle} ({summary.subjectCode})</div>
            <div><strong>ระดับชั้น:</strong> {summary.classroom}</div>
            <div><strong>ปีการศึกษา:</strong> {summary.academicYear}</div>
            <div><strong>ครูผู้สอน:</strong> {summary.teacherName}</div>
            <div><strong>สังกัด:</strong> {summary.affiliation}</div>
          </div>
        </div>

        {/* ตารางคะแนน */}
        <div className="pp5-table-wrap">
          <table className="pp5-table">
            <thead>
              <tr>
                <th rowSpan={2} className="w-no">เลขที่</th>
                <th rowSpan={2} className="w-code">รหัส</th>
                <th rowSpan={2} className="w-name">ชื่อ - นามสกุล</th>
                {summary.indicators.map((ind) => (
                  <th key={ind.id} colSpan={3} className="w-ind">
                    {ind.code}
                  </th>
                ))}
                <th colSpan={4} className="w-col-total">คะแนนเก็บ</th>
                {exam.midterm > 0 && <th rowSpan={2} className="w-exam">กลางภาค<br/>({exam.midterm})</th>}
                <th rowSpan={2} className="w-exam">ปลายภาค<br/>({exam.final})</th>
                <th rowSpan={2} className="w-exam">รวมสอบ<br/>(30)</th>
                <th rowSpan={2} className="w-total">รวม<br/>(100)</th>
                <th rowSpan={2} className="w-grade">เกรด</th>
                <th rowSpan={2} className="w-eval">ผล</th>
              </tr>
              <tr>
                {summary.indicators.map((ind) => (
                  <React.Fragment key={`sub_${ind.id}`}>
                    <th className="sub-th">K</th>
                    <th className="sub-th">P</th>
                    <th className="sub-th">A</th>
                  </React.Fragment>
                ))}
                <th className="sub-th">K (42)</th>
                <th className="sub-th">P (17.5)</th>
                <th className="sub-th">A (10.5)</th>
                <th className="sub-th">รวม (70)</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((r) => (
                <tr key={r.studentCode}>
                  <td className="text-center">{r.studentNo}</td>
                  <td className="text-center">{r.studentCode}</td>
                  <td className="text-left font-sarabun">{r.fullName}</td>
                  {summary.indicators.map((ind) => {
                    const s = r.indicatorScores[ind.id] || { k: 0, p: 'พอใช้', a: false };
                    return (
                      <React.Fragment key={`${r.studentCode}_${ind.id}`}>
                        <td className="text-center">{s.k}</td>
                        <td className="text-center font-small">{s.p}</td>
                        <td className="text-center">{s.a ? 'ผ' : 'มผ'}</td>
                      </React.Fragment>
                    );
                  })}
                  <td className="text-center">{r.collectedK}</td>
                  <td className="text-center">{r.collectedP}</td>
                  <td className="text-center">{r.collectedA}</td>
                  <td className="text-center font-bold">{r.totalCollected}</td>
                  {exam.midterm > 0 && <td className="text-center">{r.midtermExam}</td>}
                  <td className="text-center">{r.finalExam}</td>
                  <td className="text-center font-bold">{r.totalExam}</td>
                  <td className="text-center font-bold total-cell">{r.totalScore}</td>
                  <td className={`text-center font-bold grade-cell grade-${r.grade.replace('.', '_')}`}>
                    {r.grade}
                  </td>
                  <td className={`text-center eval-cell ${r.isPassed ? 'eval-pass' : 'eval-fail'}`}>
                    {r.evaluationText}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ส่วนสรุปผลสัมฤทธิ์ทางการเรียน */}
        <div className="pp5-summary-section">
          <div className="pp5-summary-box">
            <h3 className="pp5-summary-title">สรุปผลสัมฤทธิ์ทางการเรียน (จำนวนและร้อยละ)</h3>
            <table className="pp5-stat-table">
              <thead>
                <tr>
                  <th>ระดับผลการเรียน</th>
                  <th>4</th>
                  <th>3.5</th>
                  <th>3</th>
                  <th>2.5</th>
                  <th>2</th>
                  <th>1.5</th>
                  <th>1</th>
                  <th>0</th>
                  <th>รวม</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>จำนวน (คน)</strong></td>
                  <td>{summary.stats.gradeCounts['4']}</td>
                  <td>{summary.stats.gradeCounts['3.5']}</td>
                  <td>{summary.stats.gradeCounts['3']}</td>
                  <td>{summary.stats.gradeCounts['2.5']}</td>
                  <td>{summary.stats.gradeCounts['2']}</td>
                  <td>{summary.stats.gradeCounts['1.5']}</td>
                  <td>{summary.stats.gradeCounts['1']}</td>
                  <td>{summary.stats.gradeCounts['0']}</td>
                  <td><strong>{summary.stats.totalStudents}</strong></td>
                </tr>
                <tr>
                  <td><strong>ร้อยละ (%)</strong></td>
                  <td>{summary.stats.gradePercentages['4']}%</td>
                  <td>{summary.stats.gradePercentages['3.5']}%</td>
                  <td>{summary.stats.gradePercentages['3']}%</td>
                  <td>{summary.stats.gradePercentages['2.5']}%</td>
                  <td>{summary.stats.gradePercentages['2']}%</td>
                  <td>{summary.stats.gradePercentages['1.5']}%</td>
                  <td>{summary.stats.gradePercentages['1']}%</td>
                  <td>{summary.stats.gradePercentages['0']}%</td>
                  <td><strong>100%</strong></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="pp5-stat-indicators">
            <div className="stat-card">
              <span className="stat-label">คะแนนเฉลี่ย (X̄)</span>
              <span className="stat-value">{summary.stats.meanScore}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">ส่วนเบี่ยงเบน (S.D.)</span>
              <span className="stat-value">{summary.stats.sdScore}</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">ได้ระดับ 3 ขึ้นไป</span>
              <span className="stat-value">{summary.stats.qualityCount} คน ({summary.stats.qualityPercentage}%)</span>
            </div>
            <div className="stat-card">
              <span className="stat-label">อัตราการผ่านเกณฑ์</span>
              <span className="stat-value">{summary.stats.passCount} คน ({summary.stats.passPercentage}%)</span>
            </div>
          </div>
        </div>

        {/* ส่วนลงนาม 3 ฝ่าย */}
        <div className="pp5-signatures">
          <div className="signature-col">
            <div className="sig-line">ลงชื่อ........................................................</div>
            <div className="sig-name">({COURSE_TEACHER_NAME})</div>
            <div className="sig-role">ครูผู้สอน</div>
            <div className="sig-date">วันที่ ..... เดือน .................... พ.ศ. {summary.academicYear}</div>
          </div>

          <div className="signature-col">
            <div className="sig-line">ลงชื่อ........................................................</div>
            <div className="sig-name">({ACADEMIC_HEAD_NAME})</div>
            <div className="sig-role">หัวหน้างานวัดและประเมินผล</div>
            <div className="sig-date">วันที่ ..... เดือน .................... พ.ศ. {summary.academicYear}</div>
          </div>

          <div className="signature-col">
            <div className="sig-line">ลงชื่อ........................................................</div>
            <div className="sig-name">({SCHOOL_DIRECTOR_NAME})</div>
            <div className="sig-role">ผู้อำนวยการโรงเรียนบ้านคลองมดแดง</div>
            <div className="sig-date">วันที่ ..... เดือน .................... พ.ศ. {summary.academicYear}</div>
          </div>
        </div>
      </div>

      <style>{`
        .pp5-print-container {
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

        .pp5-action-bar {
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

        .pp5-action-info strong {
          font-size: 1.1rem;
          display: block;
        }

        .pp5-action-info span {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .pp5-action-buttons {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .pp5-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
        }

        .pp5-btn-primary {
          background: #22c55e;
          color: white;
        }
        .pp5-btn-primary:hover { background: #16a34a; }

        .pp5-btn-secondary {
          background: #334155;
          color: white;
        }
        .pp5-btn-secondary:hover { background: #475569; }

        .pp5-btn-close {
          background: #ef4444;
          color: white;
        }
        .pp5-btn-close:hover { background: #dc2626; }

        .pp5-page {
          background: white;
          width: 297mm;
          min-height: 210mm;
          margin: 20px auto;
          padding: 15mm 15mm;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          box-sizing: border-box;
        }

        .pp5-header {
          text-align: center;
          margin-bottom: 12px;
        }

        .pp5-emblem-space {
          font-size: 2rem;
          line-height: 1;
          margin-bottom: 4px;
        }

        .pp5-title {
          font-size: 1.6rem;
          font-weight: bold;
          margin: 0;
          color: #0f172a;
        }

        .pp5-subtitle {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 2px 0 10px;
          color: #334155;
        }

        .pp5-meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px 16px;
          font-size: 0.95rem;
          text-align: left;
          background: #f8fafc;
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
        }

        .pp5-table-wrap {
          margin-top: 10px;
          overflow-x: auto;
        }

        .pp5-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.85rem;
        }

        .pp5-table th, .pp5-table td {
          border: 1px solid #334155;
          padding: 3px 4px;
          line-height: 1.2;
        }

        .pp5-table th {
          background: #f1f5f9;
          font-weight: bold;
          text-align: center;
        }

        .sub-th {
          font-size: 0.75rem;
          background: #f8fafc !important;
        }

        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-small { font-size: 0.75rem; }

        .grade-cell {
          font-size: 1rem;
        }
        .grade-4 { color: #15803d; background: #f0fdf4; }
        .grade-0 { color: #b91c1c; background: #fef2f2; }

        .eval-pass { color: #15803d; font-weight: 600; }
        .eval-fail { color: #b91c1c; font-weight: 600; }

        .pp5-summary-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 16px;
          margin-top: 14px;
          page-break-inside: avoid;
        }

        .pp5-summary-box {
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          padding: 8px;
        }

        .pp5-summary-title {
          font-size: 0.95rem;
          font-weight: bold;
          margin: 0 0 6px;
          text-align: center;
        }

        .pp5-stat-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
          text-align: center;
        }

        .pp5-stat-table th, .pp5-stat-table td {
          border: 1px solid #94a3b8;
          padding: 4px;
        }

        .pp5-stat-table th {
          background: #f1f5f9;
        }

        .pp5-stat-indicators {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .stat-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #64748b;
        }

        .stat-value {
          font-size: 1.05rem;
          font-weight: bold;
          color: #0f172a;
          margin-top: 2px;
        }

        .pp5-signatures {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 24px;
          text-align: center;
          font-size: 0.9rem;
          page-break-inside: avoid;
        }

        .sig-line { margin-bottom: 4px; }
        .sig-name { font-weight: 600; }
        .sig-role { color: #475569; margin-top: 2px; }
        .sig-date { font-size: 0.8rem; color: #64748b; margin-top: 4px; }

        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          body {
            background: white !important;
          }

          .pp5-no-print {
            display: none !important;
          }

          .pp5-print-container {
            position: static;
            background: white;
            padding: 0;
            overflow: visible;
          }

          .pp5-page {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }

          .pp5-table th, .pp5-table td {
            border-color: #000 !important;
          }

          .pp5-meta-grid, .pp5-summary-box, .stat-card {
            border-color: #000 !important;
            background: white !important;
          }
        }
      `}</style>
    </div>
  );
};
