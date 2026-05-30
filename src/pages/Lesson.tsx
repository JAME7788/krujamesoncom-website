import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Play, BookOpen, Download, CheckCircle, Clock } from 'lucide-react';
import './Lesson.css';

const Lesson: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ข้อมูลสมมติสำหรับบทเรียน (ในอนาคตจะดึงจาก Firestore)
  const lessonData = {
    title: "บทที่ 1: การแก้ปัญหาอย่างเป็นขั้นตอน",
    level: "วิทยาการคำนวณ ป.1",
    duration: "45 นาที",
    description: "เรียนรู้การลำดับความคิดเพื่อแก้ปัญหาในชีวิตประจำวันอย่างเป็นระบบ",
    videoUrl: "https://www.youtube.com/embed/FjHGZj2IjBk",
    content: [
      "1. ความหมายของการแก้ปัญหา",
      "2. การลองผิดลองถูก",
      "3. การใช้รหัสภาพ (Unplugged Coding)",
      "4. กิจกรรมท้ายบทเรียน"
    ]
  };

  return (
    <div className="lesson-page container section-padding">
      <button className="btn-back" onClick={() => navigate('/courses')}>
        <ChevronLeft size={20} /> กลับไปที่คอร์สเรียน
      </button>

      <div className="lesson-grid">
        <div className="lesson-main">
          <div className="video-player-container glass">
             <iframe 
                width="100%" 
                height="450" 
                src={lessonData.videoUrl} 
                title="Lesson Video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
             ></iframe>
          </div>
          
          <div className="lesson-info-box glass">
             <h1>{lessonData.title}</h1>
             <div className="lesson-meta">
                <span><Clock size={18} /> {lessonData.duration}</span>
                <span><BookOpen size={18} /> {lessonData.level}</span>
             </div>
             <p className="lesson-desc">{lessonData.description}</p>
          </div>
        </div>

        <div className="lesson-sidebar">
           <div className="sidebar-card glass">
              <h3>หัวข้อการเรียนรู้</h3>
              <div className="lesson-list">
                 {lessonData.content.map((item, i) => (
                   <div key={i} className={`lesson-item-link ${i === 0 ? 'active' : ''}`}>
                      <span className="l-num">{i + 1}</span>
                      <span className="l-text">{item}</span>
                      {i === 0 ? <Play size={14} /> : <CheckCircle size={14} className="icon-pending" />}
                   </div>
                 ))}
              </div>
              <button className="btn-download-mat">
                 <Download size={18} /> ดาวน์โหลดใบงาน (.PDF)
              </button>
           </div>

           <div className="sidebar-card glass quiz-promo">
              <h3>พร้อมทดสอบหรือยัง?</h3>
              <p>ทำแบบทดสอบหลังเรียนเพื่อเก็บคะแนน</p>
              <button className="btn-primary-full" onClick={() => navigate(`/quiz/${id}`)}>
                 เริ่มทำแบบทดสอบ
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Lesson;
