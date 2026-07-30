import React from 'react';
import './OfficialLessonPlanHeader.css';

export interface OfficialLessonPlanHeaderData {
  planNo: number;
  courseName: string;
  courseCode: string;
  className: string;
  semester: number;
  academicYear: string;
  unitNo: number;
  unitName: string;
  unitHours: number;
  lessonTitle: string;
  lessonHours: number;
  teacherName: string;
  teachingDate?: string;
}

const hoursLabel = (hours: number) => `${hours} ชั่วโมง`;

const OfficialLessonPlanHeader: React.FC<OfficialLessonPlanHeaderData> = ({
  planNo,
  courseName,
  courseCode,
  className,
  semester,
  academicYear,
  unitNo,
  unitName,
  unitHours,
  lessonTitle,
  lessonHours,
  teacherName,
  teachingDate = '......./........./...........',
}) => (
  <header className="official-plan-header">
    <h1>แผนการจัดการเรียนรู้ที่ {planNo}</h1>
    <div className="official-plan-header-grid">
      <p>รายวิชา{courseName} รหัสวิชา {courseCode}</p>
      <p>{className}</p>
      <p>กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี</p>
      <p>ภาคเรียนที่ {semester} ปีการศึกษา {academicYear}</p>
      <p>หน่วยการเรียนรู้ที่ {unitNo} {unitName}</p>
      <p>เวลา {hoursLabel(unitHours)}</p>
      <p>เรื่อง {lessonTitle}</p>
      <p>เวลา {hoursLabel(lessonHours)}</p>
      <p>ครูผู้สอน {teacherName}</p>
      <p>วันที่สอน {teachingDate}</p>
    </div>
    <div className="official-plan-header-rule" />
  </header>
);

export default OfficialLessonPlanHeader;
