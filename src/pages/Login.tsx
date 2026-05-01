import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { UserCircle, LogIn, GraduationCap } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const { user, loginAsStudent } = useAuth();
  const [name, setName] = useState('');
  const [classroom, setClassroom] = useState('ป.1');
  const [number, setNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !number) return;
    
    setIsSubmitting(true);
    await loginAsStudent(name, classroom, number);
    setIsSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-bg"></div>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="login-card glass"
      >
        <div className="login-header">
          <div className="auth-icon">
            <GraduationCap size={40} />
          </div>
          <h1>เข้าใช้งานห้องเรียน</h1>
          <p>กรอกข้อมูลของคุณเพื่อบันทึกคะแนน</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="input-group">
             <label>ชื่อ-นามสกุล</label>
             <input 
               type="text" 
               placeholder="ด.ช. สมชาย ใจดี" 
               required 
               value={name}
               onChange={(e) => setName(e.target.value)}
             />
          </div>
          
          <div className="input-row">
            <div className="input-group">
               <label>ชั้นเรียน</label>
               <select value={classroom} onChange={(e) => setClassroom(e.target.value)}>
                 <option>ป.1</option>
                 <option>ป.2</option>
                 <option>ป.3</option>
                 <option>ป.4</option>
                 <option>ป.5</option>
                 <option>ป.6</option>
                 <option>ม.1</option>
                 <option>ม.2</option>
                 <option>ม.3</option>
               </select>
            </div>
            <div className="input-group">
               <label>เลขที่</label>
               <input 
                 type="number" 
                 placeholder="1" 
                 required 
                 value={number}
                 onChange={(e) => setNumber(e.target.value)}
               />
            </div>
          </div>
          
          <button className="btn-login-submit" type="submit" disabled={isSubmitting}>
             {isSubmitting ? 'กำลังเข้าสู่ระบบ...' : <><LogIn size={18} /> เข้าเรียนเลย!</>}
          </button>
        </form>

        <p className="auth-footer">
          * ไม่ต้องใช้ Gmail ในการเข้าใช้งาน
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
