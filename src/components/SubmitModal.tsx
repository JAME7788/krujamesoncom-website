import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Link as LinkIcon, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitAssignment } from '../services/assignmentService';
import './SubmitModal.css';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [linkContent, setLinkContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSubmitting(true);
    const result = await submitAssignment(
      user.id,
      user.name || 'Anonymous',
      assignmentTitle,
      'link',
      linkContent
    );

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setAssignmentTitle('');
        setLinkContent('');
      }, 2000);
    }
    setIsSubmitting(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="modal-card glass"
          >
            <button className="close-btn" onClick={onClose}><X size={24} /></button>
            
            {isSuccess ? (
              <div className="success-view">
                <CheckCircle size={60} color="#4CAF50" />
                <h2>ส่งงานสำเร็จแล้ว!</h2>
                <p>คุณครูจะได้รับงานของคุณในไม่ช้า</p>
              </div>
            ) : (
              <>
                <div className="modal-header">
                  <h2>ส่งงานใหม่ (ส่งเป็นลิงก์เท่านั้น)</h2>
                  <p>เพื่อประหยัดพื้นที่จัดเก็บและเพิ่มความรวดเร็ว กรุณาส่งงานเป็นลิงก์</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="input-group">
                    <label>หัวข้อวิชา/ชื่อใบงาน</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="เช่น ใบงานที่ 1 การเขียนโค้ด"
                      value={assignmentTitle}
                      onChange={(e) => setAssignmentTitle(e.target.value)}
                    />
                  </div>

                  <div className="submit-instructions">
                    💡 <strong>คำแนะนำในการส่งรูปภาพหรือ PDF:</strong>
                    <ol>
                      <li>อัปโหลดรูปภาพหรือไฟล์ PDF ของนักเรียนขึ้น <strong>Google Drive</strong> หรือ <strong>Canva</strong></li>
                      <li>ตั้งค่าให้ลิงก์เป็น <u>"ทุกคนที่มีลิงก์มีสิทธิ์อ่าน" (Anyone with the link can view)</u></li>
                      <li>คัดลอกลิงก์นั้นมาแปะลงในช่องด้านล่างนี้</li>
                    </ol>
                  </div>

                  <div className="input-group">
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <LinkIcon size={16} /> ลิงก์ผลงานของคุณ (Google Drive, Canva, Scratch)
                    </label>
                    <input 
                      type="url" 
                      required 
                      placeholder="https://drive.google.com/... หรือ https://canva.com/..."
                      value={linkContent}
                      onChange={(e) => setLinkContent(e.target.value)}
                    />
                  </div>

                  <button className="btn-submit" disabled={isSubmitting}>
                    {isSubmitting ? 'กำลังส่งงาน...' : <><Send size={18} /> ส่งงานให้คุณครู</>}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SubmitModal;

