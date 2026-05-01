import React from 'react';
import Curriculum from './Curriculum';
import './Courses.css';

const Courses: React.FC = () => {
  return (
    <div className="courses-page container section-padding">
      <div className="courses-header">
        <span className="badge">หลักสูตรวิชาเทคโนโลยี (วิทยาการคำนวณ)</span>
        <h1>คลังบทเรียน <span>ครูเจมส์</span></h1>
        <p>เลือกชั้นเรียนของคุณ เพื่อเข้าสู่หน่วยการเรียน ตัวชี้วัด และบทเรียนเต็มรูปแบบ</p>
      </div>

      <Curriculum />
    </div>
  );
};

export default Courses;
