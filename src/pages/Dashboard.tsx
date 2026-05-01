import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Clock, AlertCircle, TrendingUp, BookOpen, Send, Database } from 'lucide-react';
import SubmitModal from '../components/SubmitModal';
import { db } from '../services/firebase';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const [isSubmitModalOpen, setIsSubmitModalOpen] = React.useState(false);
  const [dbStatus, setDbStatus] = React.useState<'checking' | 'connected' | 'error'>('checking');

  React.useEffect(() => {
    // ทดสอบการเชื่อมต่อฐานข้อมูล
    if (db) {
       setDbStatus('connected');
    } else {
       setDbStatus('error');
    }
  }, []);
  const stats = [
    { label: 'คะแนนเฉลี่ย', value: '85%', icon: <TrendingUp />, color: '#4CAF50' },
    { label: 'งานที่ส่งแล้ว', value: '18/20', icon: <CheckCircle />, color: '#2196F3' },
    { label: 'รอตรวจ', value: '2', icon: <Clock />, color: '#FF9800' },
  ];

  const recentGrades = [
    { task: 'ใบงานที่ 1: การเขียนโปรแกรม Block', grade: '10/10', date: '22 เม.ย. 69', status: 'ดีเยี่ยม' },
    { task: 'แบบทดสอบ: พื้นฐานเทคโนโลยี', grade: '8/10', date: '20 เม.ย. 69', status: 'ผ่าน' },
    { task: 'โปรเจกต์: Scratch Animation', grade: '18/20', date: '15 เม.ย. 69', status: 'ดีมาก' },
  ];

  return (
    <div className="dashboard container section-padding">
      <div className="dashboard-header">
        <div className="user-welcome">
           <h1>สวัสดี, <span>นักเรียนเจมส์</span></h1>
           <p>ติดตามความก้าวหน้าและการเรียนของคุณวันนี้</p>
           <div className={`db-status ${dbStatus}`}>
              <Database size={14} /> 
              {dbStatus === 'connected' ? 'เชื่อมต่อฐานข้อมูลใหม่แล้ว' : 'กำลังเชื่อมต่อ...'}
           </div>
        </div>
        <button className="btn-primary" onClick={() => setIsSubmitModalOpen(true)}>
          <Send size={18} /> ส่งงานชิ้นใหม่
        </button>
      </div>

      <SubmitModal isOpen={isSubmitModalOpen} onClose={() => setIsSubmitModalOpen(false)} />

      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card glass">
            <div className="stat-icon" style={{ color: stat.color }}>{stat.icon}</div>
            <div className="stat-info">
               <p>{stat.label}</p>
               <h3>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main">
        <div className="main-left">
           <section className="section-card glass">
              <div className="card-header">
                 <h3>คะแนนล่าสุด</h3>
                 <a href="#">ดูทั้งหมด</a>
              </div>
              <div className="grade-list">
                 {recentGrades.map((g, i) => (
                   <div key={i} className="grade-item">
                      <div className="g-info">
                         <h4>{g.task}</h4>
                         <p>{g.date}</p>
                      </div>
                      <div className="g-result">
                         <span className="grade-value">{g.grade}</span>
                         <span className="grade-status">{g.status}</span>
                      </div>
                   </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="main-right">
           <section className="section-card glass">
              <h3>งานที่กำลังจะถึง</h3>
              <div className="deadline-list">
                 <div className="deadline-item">
                    <div className="d-icon alert"><AlertCircle size={20} /></div>
                    <div className="d-info">
                       <h4>ใบงานที่ 5: Python Loop</h4>
                       <p>ส่งภายใน: 25 เม.ย. 69</p>
                    </div>
                 </div>
                 <div className="deadline-item">
                    <div className="d-icon info"><Clock size={20} /></div>
                    <div className="d-info">
                       <h4>โปรเจกต์: เว็บไซต์ส่วนตัว</h4>
                       <p>ส่งภายใน: 30 เม.ย. 69</p>
                    </div>
                 </div>
              </div>
           </section>

           <section className="section-card glass promo">
              <BookOpen size={40} />
              <h3>คอร์สเรียนแนะนำ</h3>
              <p>พื้นฐาน AI สำหรับน้องๆ ม.ต้น</p>
              <button className="btn-outline">ไปที่คอร์ส</button>
           </section>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
