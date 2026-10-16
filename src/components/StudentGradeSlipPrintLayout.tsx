import React, { useState } from 'react';
import { Printer, X, FileSpreadsheet, FileText, LayoutList, FileCheck2 } from 'lucide-react';
import {
  type ClassroomExportSummary,
  type StudentExportRow,
  COURSE_TEACHER_NAME,
  SCHOOL_DIRECTOR_NAME,
} from '../services/gradeExportService';
import {
  downloadClassroomPp6Excel,
  downloadClassroomPp6Docx,
} from '../services/pp5CompleteGeneratorService';
import { examMaxScores, getGradingPolicy } from '../services/gradeService';

interface StudentGradeSlipPrintLayoutProps {
  summary: ClassroomExportSummary;
  selectedStudentCode?: string; // ถ้ากำหนดจะพิมพ์เฉพาะคนนี้ ถ้าไม่กำหนดจะพิมพ์ทั้งห้อง
  onClose: () => void;
}

function formatQualLevel(score: 3 | 2 | 1 | 0 | null): string {
  if (score === 3) return 'ดีเยี่ยม (3)';
  if (score === 2) return 'ดี (2)';
  if (score === 1) return 'ผ่าน (1)';
  if (score === 0) return 'ไม่ผ่าน (0)';
  return 'ดีเยี่ยม (3)';
}

export const StudentGradeSlipPrintLayout: React.FC<StudentGradeSlipPrintLayoutProps> = ({
  summary,
  selectedStudentCode,
  onClose,
}) => {
  const [layoutMode, setLayoutMode] = useState<'official_pp6' | 'compact_slip'>('official_pp6');

  const studentsToPrint: StudentExportRow[] = selectedStudentCode
    ? summary.rows.filter((r) => r.studentCode === selectedStudentCode)
    : summary.rows;

  const exam = examMaxScores(summary.classroom);
  const weights = getGradingPolicy(summary.classroom);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="slip-print-container">
      {/* Toolbar */}
      <div className="slip-no-print slip-action-bar">
        <div className="slip-action-info">
          <strong>แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6) — {summary.classroom}</strong>
          <span>
            {selectedStudentCode
              ? `พิมพ์เฉพาะบุคคล (${studentsToPrint[0]?.fullName || ''})`
              : `พิมพ์ทั้งห้อง (${studentsToPrint.length} คน • ${layoutMode === 'official_pp6' ? '1 คน/แผ่น A4 มาตรฐานโรงเรียน' : '2 คน/แผ่น แบบย่อมีรอยปรุ'})`}
          </span>
        </div>

        <div className="slip-action-buttons">
          <div className="slip-mode-toggle">
            <button
              type="button"
              className={`slip-mode-btn ${layoutMode === 'official_pp6' ? 'active' : ''}`}
              onClick={() => setLayoutMode('official_pp6')}
            >
              <FileCheck2 size={15} /> ปพ.6 ทางการ (เต็มแผ่น A4)
            </button>
            <button
              type="button"
              className={`slip-mode-btn ${layoutMode === 'compact_slip' ? 'active' : ''}`}
              onClick={() => setLayoutMode('compact_slip')}
            >
              <LayoutList size={15} /> ใบเกรดย่อ (2 คน/แผ่น)
            </button>
          </div>

          <button
            type="button"
            className="slip-btn slip-btn-excel"
            onClick={() => downloadClassroomPp6Excel(summary)}
          >
            <FileSpreadsheet size={16} /> โหลด Excel ปพ.6 (4 ชีต)
          </button>
          <button
            type="button"
            className="slip-btn slip-btn-word"
            onClick={() => downloadClassroomPp6Docx(summary, selectedStudentCode)}
          >
            <FileText size={16} /> โหลด Word ปพ.6 (.doc)
          </button>
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

      {/* โหมดที่ 1: แบบฟอร์ม ปพ.6 ทางการเต็มแผ่น A4 (ตามแบบฟอร์มโรงเรียนบ้านคลองมดแดง) */}
      {layoutMode === 'official_pp6' ? (
        <div className="slip-pages-wrapper">
          {studentsToPrint.map((student, index) => (
            <div
              key={student.studentCode}
              className={`pp6-official-sheet ${index < studentsToPrint.length - 1 ? 'slip-page-break' : ''}`}
            >
              <div className="pp6-official-border">
                {/* Header */}
                <div className="pp6-header">
                  <div className="pp6-form-tag">แบบ ปพ.6</div>
                  <div className="pp6-garuda">🏫</div>
                  <h1 className="pp6-title">แบบรายงานผลการพัฒนาคุณภาพผู้เรียนรายบุคคล (ปพ.6)</h1>
                  <h2 className="pp6-school">{summary.schoolName} • {summary.affiliation}</h2>
                  <div className="pp6-sub">
                    ระดับชั้น {summary.classroom} • ภาคเรียนที่ {summary.term} ปีการศึกษา {summary.academicYear}
                  </div>
                </div>

                {/* ข้อมูลส่วนตัวนักเรียนตามทะเบียน DMC */}
                <table className="pp6-bio-table">
                  <tbody>
                    <tr>
                      <td><strong>เลขที่:</strong> {student.studentNo}</td>
                      <td><strong>รหัสประจำตัวนักเรียน:</strong> {student.studentCode}</td>
                      <td colSpan={2}><strong>เลขประจำตัวประชาชน:</strong> {student.citizenId || '-'}</td>
                    </tr>
                    <tr>
                      <td colSpan={2}><strong>ชื่อ - นามสกุล:</strong> {student.fullName}</td>
                      <td><strong>เพศ:</strong> {student.prefix.includes('หญิง') ? 'หญิง' : 'ชาย'}</td>
                      <td><strong>วันเดือนปีเกิด:</strong> {student.birthDate || '-'}</td>
                    </tr>
                    <tr>
                      <td colSpan={2}><strong>ชื่อบิดา:</strong> {student.fatherName || '-'}</td>
                      <td colSpan={2}><strong>ชื่อมารดา:</strong> {student.motherName || '-'}</td>
                    </tr>
                    <tr>
                      <td colSpan={4}><strong>ครูที่ปรึกษา / ครูประจำชั้น:</strong> {summary.advisorName}</td>
                    </tr>
                  </tbody>
                </table>

                {/* ส่วนที่ 1: ผลสัมฤทธิ์ทางการเรียน */}
                <div className="pp6-section-heading">1. ผลสัมฤทธิ์ทางการเรียนรายวิชา (กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี)</div>
                <table className="slip-table">
                  <thead>
                    <tr>
                      <th>รหัสวิชา</th>
                      <th>ชื่อรายวิชา</th>
                      <th>หน่วยกิต/ชม.</th>
                      <th>คะแนนเก็บ K ({weights.COLLECTED * weights.K_RATIO})</th>
                      <th>คะแนนเก็บ P ({weights.COLLECTED * weights.P_RATIO})</th>
                      <th>คะแนนเก็บ A ({weights.COLLECTED * weights.A_RATIO})</th>
                      <th>รวมเก็บ ({weights.COLLECTED})</th>
                      {exam.midterm > 0 && <th>กลางภาค ({exam.midterm})</th>}
                      <th>ปลายภาค ({exam.final})</th>
                      <th>รวม ({weights.TOTAL})</th>
                      <th>เกรด</th>
                      <th>ผลตัดสิน</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="font-bold">{summary.subjectCode}</td>
                      <td className="text-left font-bold">{summary.subjectTitle}</td>
                      <td>{summary.classroom.startsWith('ป.') ? `${summary.totalHours} ชม.` : `${summary.credit} นก.`}</td>
                      <td>{student.collectedK}</td>
                      <td>{student.collectedP}</td>
                      <td>{student.collectedA}</td>
                      <td className="font-bold">{student.totalCollected}</td>
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

                {/* ส่วนที่ 2: ผลการประเมินรายตัวชี้วัด */}
                <div className="pp6-section-heading">2. รายละเอียดผลการประเมินรายตัวชี้วัด (K / P / A)</div>
                <table className="slip-table pp6-ind-table">
                  <thead>
                    <tr>
                      <th style={{ width: '16%' }}>รหัสตัวชี้วัด</th>
                      <th>คำอธิบายตัวชี้วัด</th>
                      <th style={{ width: '12%' }}>ด้านความรู้ (K)</th>
                      <th style={{ width: '14%' }}>ด้านทักษะ (P)</th>
                      <th style={{ width: '12%' }}>เจตคติ (A)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.indicators.map((ind) => {
                      const s = student.indicatorScores[ind.id] || { k: 0, p: 'พอใช้', a: false };
                      return (
                        <tr key={ind.id}>
                          <td className="font-bold">{ind.code}</td>
                          <td className="text-left">{ind.title}</td>
                          <td>{s.k} / 100</td>
                          <td>{s.p}</td>
                          <td className={s.a ? 'text-pass font-bold' : 'text-fail font-bold'}>
                            {s.a ? 'ผ่าน' : 'ไม่ผ่าน'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* ส่วนที่ 3 และ 4: การประเมินคุณลักษณะ/อ่านคิด/สมรรถนะ และ เวลาเรียน */}
                <div className="pp6-two-col">
                  <div>
                    <div className="pp6-section-heading">3. การประเมินคุณลักษณะ อ่านคิดวิเคราะห์ และกิจกรรม</div>
                    <table className="slip-table">
                      <thead>
                        <tr>
                          <th>รายการประเมิน</th>
                          <th style={{ width: '32%' }}>ระดับคุณภาพ</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-left">1. คุณลักษณะอันพึงประสงค์ (8 ข้อ)</td>
                          <td className="font-bold">{formatQualLevel(student.characteristicsScore)}</td>
                        </tr>
                        <tr>
                          <td className="text-left">2. การอ่าน คิดวิเคราะห์ และเขียน (5 ข้อ)</td>
                          <td className="font-bold">{formatQualLevel(student.readingThinkingScore)}</td>
                        </tr>
                        <tr>
                          <td className="text-left">3. สมรรถนะสำคัญของผู้เรียน (5 ด้าน)</td>
                          <td className="font-bold">{formatQualLevel(student.competencyScore)}</td>
                        </tr>
                        <tr>
                          <td className="text-left">4. กิจกรรมพัฒนาผู้เรียน (แนะแนว/ลูกเสือ/ชุมนุม/เพื่อสังคม)</td>
                          <td className="font-bold text-pass">ผ่าน (ผ)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <div className="pp6-section-heading">4. สรุปเวลาเรียนประจำภาคเรียน</div>
                    <table className="slip-table">
                      <thead>
                        <tr>
                          <th>รายการเวลาเรียน</th>
                          <th style={{ width: '35%' }}>จำนวน / ผล</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="text-left">เวลาเรียนเต็มตลอดภาคเรียน</td>
                          <td className="font-bold">{student.attendanceTotalHours} ชั่วโมง</td>
                        </tr>
                        <tr>
                          <td className="text-left">เวลาเรียนที่มาเรียนจริง</td>
                          <td className="font-bold">{student.attendancePresent} ชั่วโมง</td>
                        </tr>
                        <tr>
                          <td className="text-left">ลา / ขาดเรียน</td>
                          <td>ลา {student.attendanceSick} • ขาด {student.attendanceAbsent} ชม.</td>
                        </tr>
                        <tr>
                          <td className="text-left">ร้อยละของเวลาเรียน (เกณฑ์ 80%)</td>
                          <td className={`font-bold ${student.attendanceStatus === 'ผ่าน' ? 'text-pass' : 'text-fail'}`}>
                            {student.attendancePercentage}% ({student.attendanceStatus})
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ข้อคิดเห็นครูประจำชั้น/ครูผู้สอน */}
                <div className="pp6-comment-box">
                  <strong>ข้อคิดเห็นและข้อเสนอแนะของครูผู้สอน / ครูประจำชั้น:</strong>{' '}
                  {student.isPassed
                    ? 'นักเรียนมีความตั้งใจเรียนและปฏิบัติกิจกรรมในรายวิชาได้ผ่านเกณฑ์มาตรฐานการเรียนรู้'
                    : 'ควรติดตามส่งชิ้นงานหรือสอบซ่อมเสริมตัวชี้วัดที่ยังไม่ผ่านเกณฑ์เพื่อพัฒนาผลการเรียน'}
                </div>

                {/* ลงนาม 4 ฝ่ายตามแบบ ปพ.6 โรงเรียน */}
                <div className="pp6-signatures-grid">
                  <div className="slip-sig-box">
                    <div className="slip-sig-line">ลงชื่อ..................................................</div>
                    <div className="slip-sig-name">({COURSE_TEACHER_NAME})</div>
                    <div className="slip-sig-role">ครูผู้สอน</div>
                  </div>
                  <div className="slip-sig-box">
                    <div className="slip-sig-line">ลงชื่อ..................................................</div>
                    <div className="slip-sig-name">({summary.advisorName.split(',')[0]?.trim() || COURSE_TEACHER_NAME})</div>
                    <div className="slip-sig-role">ครูประจำชั้น / ครูที่ปรึกษา</div>
                  </div>
                  <div className="slip-sig-box">
                    <div className="slip-sig-line">ลงชื่อ..................................................</div>
                    <div className="slip-sig-name">({SCHOOL_DIRECTOR_NAME})</div>
                    <div className="slip-sig-role">ผู้อำนวยการโรงเรียนบ้านคลองมดแดง</div>
                  </div>
                  <div className="slip-sig-box">
                    <div className="slip-sig-line">ลงชื่อ..................................................</div>
                    <div className="slip-sig-name">(..................................................)</div>
                    <div className="slip-sig-role">ผู้ปกครองผู้รับทราบ</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* โหมดที่ 2: ใบแจ้งเกรดแบบย่อ (2 คน/แผ่น A4) */
        <div className="slip-pages-wrapper">
          {studentsToPrint.map((student, index) => (
            <div key={student.studentCode} className={`slip-card ${(index + 1) % 2 === 0 ? 'slip-page-break' : ''}`}>
              <div className="slip-card-inner">
                {/* Header */}
                <div className="slip-header">
                  <div className="slip-school-badge">🏫 {summary.schoolName}</div>
                  <h2 className="slip-doc-title">ใบแจ้งผลการเรียนรายบุคคลประจำวิชา (ปพ.6 ย่อ)</h2>
                  <div className="slip-sub-info">
                    กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี • ภาคเรียนที่ {summary.term} ปีการศึกษา {summary.academicYear}
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
                      <th>คะแนนเก็บ ({weights.COLLECTED})</th>
                      {exam.midterm > 0 && <th>กลางภาค ({exam.midterm})</th>}
                      <th>ปลายภาค ({exam.final})</th>
                      <th>คะแนนรวม ({weights.TOTAL})</th>
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
                    <span className="attr-val">{formatQualLevel(student.characteristicsScore)}</span>
                  </div>
                  <div className="attr-item">
                    <span className="attr-label">การอ่าน คิดวิเคราะห์ และเขียน:</span>
                    <span className="attr-val">{formatQualLevel(student.readingThinkingScore)}</span>
                  </div>
                  <div className="attr-item">
                    <span className="attr-label">สมรรถนะสำคัญของผู้เรียน:</span>
                    <span className="attr-val">{formatQualLevel(student.competencyScore)}</span>
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
      )}

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
          flex-wrap: wrap;
          gap: 12px;
        }

        .slip-action-info strong {
          font-size: 1.05rem;
          display: block;
        }

        .slip-action-info span {
          font-size: 0.85rem;
          color: #94a3b8;
        }

        .slip-action-buttons {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .slip-mode-toggle {
          display: flex;
          background: #0f172a;
          padding: 3px;
          border-radius: 8px;
          margin-right: 4px;
        }

        .slip-mode-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.82rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          background: transparent;
          color: #94a3b8;
          transition: all 0.15s;
        }

        .slip-mode-btn.active {
          background: #3b82f6;
          color: white;
        }

        .slip-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 13px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
        }

        .slip-btn-excel { background: #10b981; color: white; }
        .slip-btn-excel:hover { background: #059669; }

        .slip-btn-word { background: #2563eb; color: white; }
        .slip-btn-word:hover { background: #1d4ed8; }

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

        /* Official PP6 Full A4 Sheet */
        .pp6-official-sheet {
          background: white;
          padding: 12mm 14mm;
          box-shadow: 0 4px 16px rgba(0,0,0,0.08);
          box-sizing: border-box;
        }

        .pp6-official-border {
          border: 2px solid #1e293b;
          border-radius: 8px;
          padding: 14px 18px;
          position: relative;
        }

        .pp6-header {
          text-align: center;
          margin-bottom: 10px;
          position: relative;
        }

        .pp6-form-tag {
          position: absolute;
          top: 0;
          right: 0;
          border: 1.5px solid #0f172a;
          padding: 2px 10px;
          font-weight: bold;
          font-size: 0.9rem;
          border-radius: 4px;
        }

        .pp6-garuda {
          font-size: 1.8rem;
          line-height: 1;
        }

        .pp6-title {
          font-size: 1.35rem;
          font-weight: bold;
          margin: 2px 0;
        }

        .pp6-school {
          font-size: 1.05rem;
          font-weight: bold;
          margin: 0;
          color: #1e293b;
        }

        .pp6-sub {
          font-size: 0.9rem;
          color: #475569;
          margin-top: 2px;
        }

        .pp6-bio-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 10px;
          font-size: 0.9rem;
          background: #f8fafc;
        }

        .pp6-bio-table td {
          border: 1px solid #94a3b8;
          padding: 4px 8px;
        }

        .pp6-section-heading {
          font-size: 0.95rem;
          font-weight: bold;
          background: #e2e8f0;
          padding: 4px 10px;
          border-left: 4px solid #1e3a8a;
          margin: 8px 0 6px;
        }

        .pp6-two-col {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 10px;
        }

        .pp6-comment-box {
          border: 1px dashed #64748b;
          background: #f8fafc;
          padding: 6px 10px;
          border-radius: 6px;
          font-size: 0.88rem;
          margin: 8px 0 12px;
        }

        .pp6-signatures-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 14px 24px;
          text-align: center;
          font-size: 0.88rem;
          margin-top: 10px;
        }

        /* Compact Slip */
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
          font-size: 0.85rem;
          margin-bottom: 6px;
        }

        .slip-table th, .slip-table td {
          border: 1px solid #475569;
          padding: 4px 6px;
        }

        .slip-table th {
          background: #f1f5f9;
          font-weight: bold;
        }

        .text-left { text-align: left; }
        .font-bold { font-weight: bold; }
        .font-large { font-size: 1.05rem; }
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
            margin: 8mm;
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
            max-width: 100% !important;
          }

          .pp6-official-sheet {
            box-shadow: none !important;
            padding: 0 !important;
            page-break-inside: avoid;
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
