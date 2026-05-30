import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Link as LinkIcon, Send, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { submitAssignment } from '../services/assignmentService';
import './SubmitModal.css';

interface SubmitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SubmitModal: React.FC<SubmitModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [type, setType] = useState<'file' | 'link'>('link');
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [linkContent, setLinkContent] = useState('');
  const [fileContent, setFileContent] = useState<File | null>(null);
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
      type,
      type === 'link' ? linkContent : fileContent!
    );

    if (result.success) {
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setAssignmentTitle('');
        setLinkContent('');
        setFileContent(null);
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
                  <h2>ส่งงานใหม่</h2>
                  <p>เลือกประเภทงานที่คุณต้องการส่ง</p>
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

                  <div className="type-toggle">
                    <button 
                      type="button" 
                      className={type === 'link' ? 'active' : ''}
                      onClick={() => setType('link')}
                    >
                      <LinkIcon size={18} /> แปะลิงก์ (Scratch/Canva)
                    </button>
                    <button 
                      type="button" 
                      className={type === 'file' ? 'active' : ''}
                      onClick={() => setType('file')}
                    >
                      <Upload size={18} /> อัปโหลดไฟล์
                    </button>
                  </div>

                  {type === 'link' ? (
                    <div className="input-group">
                      <label>ลิงก์ผลงานของคุณ</label>
                      <input 
                        type="url" 
                        required 
                        placeholder="https://..."
                        value={linkContent}
                        onChange={(e) => setLinkContent(e.target.value)}
                      />
                    </div>
                  ) : (
                    <div className="file-upload">
                      <input 
                        type="file" 
                        id="file-input"
                        required
                        onChange={(e) => setFileContent(e.target.files?.[0] || null)}
                      />
                      <label htmlFor="file-input">
                        <Upload size={32} />
                        <span>{fileContent ? fileContent.name : 'คลิกเพื่อเลือกไฟล์ (PDF, PNG, JPG)'}</span>
                      </label>
                    </div>
                  )}

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
