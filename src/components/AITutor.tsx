import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Bot, X, Send, Trash2, Sparkles, Settings } from 'lucide-react';
import { askAI, loadHistory, clearHistory, loadSettings, saveSettings } from '../services/aiTutorService';
import type { ChatMessage, AISettings } from '../services/aiTutorService';
import { useAuth } from '../context/AuthContext';
import { trackMediaClick } from '../services/progressService';
import { syncStudentGradesFromProgress } from '../services/gameProgressService';
import { getDefaultProgressGradeIdForClassroom } from '../services/courseAccessService';
import './AITutor.css';

const AITutor: React.FC = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AISettings>(loadSettings());
  const scrollRef = useRef<HTMLDivElement>(null);

  const userId = user?.id || 'guest';

  useEffect(() => {
    if (open) setMessages(loadHistory(userId));
  }, [open, userId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const trackedRef = useRef(false);
  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    setLoading(true);
    // optimistic update
    setMessages([...messages, { id: 't', role: 'user', content: msg, timestamp: Date.now() }]);
    try {
      await askAI(userId, msg);
      setMessages(loadHistory(userId));
      // นับการใช้ AI Tutor เป็น "ทักษะ" (P skill points) — 1 ครั้งต่อ session
      if (!trackedRef.current && user && user.id !== 'admin_teacher_account') {
        const gradeId = getDefaultProgressGradeIdForClassroom(user.classroom);
        if (gradeId) {
          trackedRef.current = true;
          void trackMediaClick(user.id, gradeId, 1, 'fun', '[AI Tutor] คำถามถึง AI').then(() => {
            syncStudentGradesFromProgress({
              id: user.id,
              name: user.name,
              classroom: user.classroom,
              studentNumber: user.studentNumber,
            });
          });
        }
      }
    } catch (e) {
      console.warn('AI failed', e);
    }
    setLoading(false);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleClear = () => {
    if (!confirm('ล้างประวัติแชท?')) return;
    clearHistory(userId);
    setMessages([]);
  };

  const saveSettingsAndClose = () => {
    saveSettings(settings);
    setShowSettings(false);
    alert('บันทึกการตั้งค่าแล้ว ✓');
  };

  const examples = [
    'อัลกอริทึมคืออะไร?',
    'อธิบาย Loop ใน Scratch',
    'AI ทำงานยังไง?',
    'ช่วยแก้ปัญหาเรื่อง...',
  ];

  return (
    <>
      <button className="ai-tutor-trigger" onClick={() => setOpen(true)} title="ครู AI">
        <Bot size={20} />
      </button>

      {open && createPortal(
        <div className="ai-overlay" onClick={() => setOpen(false)}>
          <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ai-head">
              <div className="ai-head-info">
                <Bot size={20} />
                <strong>ครู AI</strong>
                <span className="ai-status">●</span>
                <small>{settings.apiKey ? 'API พร้อม' : 'โหมดทดลอง'}</small>
              </div>
              <div className="ai-head-actions">
                <button onClick={handleClear} title="ล้างประวัติ"><Trash2 size={16} /></button>
                <button onClick={() => setShowSettings(true)} title="ตั้งค่า"><Settings size={16} /></button>
                <button onClick={() => setOpen(false)}><X size={18} /></button>
              </div>
            </div>

            <div className="ai-messages" ref={scrollRef}>
              {messages.length === 0 && (
                <div className="ai-welcome">
                  <Sparkles size={32} color="#6366f1" />
                  <h3>สวัสดี! ฉันคือครู AI 🤖</h3>
                  <p>ถามอะไรเกี่ยวกับวิทยาการคำนวณ เทคโนโลยี หรือ AI ได้เลย</p>
                  <div className="ai-examples">
                    {examples.map((ex, i) => (
                      <button key={i} onClick={() => setInput(ex)}>{ex}</button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className={`ai-msg ai-msg-${m.role}`}>
                  <div className="ai-msg-avatar">
                    {m.role === 'user' ? '👤' : '🤖'}
                  </div>
                  <div className="ai-msg-bubble">{m.content}</div>
                </div>
              ))}
              {loading && (
                <div className="ai-msg ai-msg-assistant">
                  <div className="ai-msg-avatar">🤖</div>
                  <div className="ai-msg-bubble loading">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}
            </div>

            <div className="ai-input-row">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                placeholder="พิมพ์คำถาม..."
                rows={2}
                disabled={loading}
              />
              <button onClick={send} disabled={loading || !input.trim()} className="ai-send">
                <Send size={18} />
              </button>
            </div>
          </div>

          {/* Settings modal */}
          {showSettings && (
            <div className="ai-settings-overlay" onClick={() => setShowSettings(false)}>
              <div className="ai-settings-modal" onClick={(e) => e.stopPropagation()}>
                <h3>⚙️ ตั้งค่า AI Tutor</h3>
                <p style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  สำหรับครูเท่านั้น — ใส่ Anthropic API Key เพื่อใช้ AI ตอบจริง
                </p>
                <div className="ai-settings-field">
                  <label>Anthropic API Key</label>
                  <input
                    type="password"
                    value={settings.apiKey || ''}
                    onChange={(e) => setSettings({ ...settings, apiKey: e.target.value })}
                    placeholder="sk-ant-..."
                  />
                </div>
                <div className="ai-settings-field">
                  <label>Model</label>
                  <select value={settings.model} onChange={(e) => setSettings({ ...settings, model: e.target.value })}>
                    <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (เร็ว ราคาถูก)</option>
                    <option value="claude-sonnet-4-6">Claude Sonnet 4.6 (สมดุล)</option>
                    <option value="claude-opus-4-7">Claude Opus 4.7 (ฉลาดสุด)</option>
                  </select>
                </div>
                <div className="ai-settings-field">
                  <label>System Prompt</label>
                  <textarea
                    value={settings.systemPrompt}
                    onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
                    rows={6}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button className="btn-secondary" onClick={() => setShowSettings(false)}>ยกเลิก</button>
                  <button className="btn-primary" onClick={saveSettingsAndClose}>บันทึก</button>
                </div>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  );
};

export default AITutor;
