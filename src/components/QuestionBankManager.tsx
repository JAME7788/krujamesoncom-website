import React, { useEffect, useMemo, useState } from 'react';
import { FileQuestion, Plus, RefreshCw, Save, Trash2, BookOpen, Layers, Printer } from 'lucide-react';
import {
  deleteQuestionBankItem,
  drawQuestionSet,
  fetchQuestionBank,
  loadQuestionBank,
  saveQuestionBankItem,
  type QuestionBankItem,
  type QuestionDifficulty,
} from '../services/questionBankService';
import {
  getIndicators,
  getSubjectsForClassroom,
  type Subject,
} from '../services/gradeService';
import { allClassrooms2569 } from '../data/students2569';
import {
  availableExamGrades,
  getExamSetsByGrade,
} from '../services/examService';
import { useToast } from './Toast';
import './QuestionBankManager.css';

const blankQuestion = {
  question: '',
  options: ['', '', '', ''],
  answer: 0,
  explanation: '',
  difficulty: 'medium' as QuestionDifficulty,
  status: 'published' as 'draft' | 'published',
};

const QuestionBankManager: React.FC = () => {
  const [bankTab, setBankTab] = useState<'official' | 'custom'>('official');

  // State สำหรับ Official Exam Sets
  const [officialGrade, setOfficialGrade] = useState('ป.1');
  const officialSets = useMemo(() => getExamSetsByGrade(officialGrade), [officialGrade]);
  const [selectedSetId, setSelectedSetId] = useState<string>('');

  const activeOfficialSet = useMemo(() => {
    return officialSets.find((s) => s.id === selectedSetId) || officialSets[0];
  }, [officialSets, selectedSetId]);

  // State สำหรับ Custom Question Bank
  const [items, setItems] = useState<QuestionBankItem[]>(loadQuestionBank);
  const [classroom, setClassroom] = useState('ป.1');
  const [subject, setSubject] = useState<Subject>('main');
  const [indicatorId, setIndicatorId] = useState('');
  const [draft, setDraft] = useState(blankQuestion);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<QuestionBankItem[]>([]);
  const toast = useToast();

  const subjects = useMemo(() => getSubjectsForClassroom(classroom), [classroom]);
  const indicators = useMemo(() => getIndicators(classroom, subject), [classroom, subject]);
  const filtered = items.filter((item) => (
    item.classroom === classroom
    && item.subject === subject
    && (!indicatorId || item.indicatorId === indicatorId)
  ));

  useEffect(() => {
    void fetchQuestionBank().then(setItems);
  }, []);

  const reset = () => {
    setEditingId(undefined);
    setDraft(blankQuestion);
  };

  const save = async () => {
    const indicator = indicators.find((item) => item.id === indicatorId);
    if (!indicator || !draft.question.trim() || draft.options.some((option) => !option.trim())) {
      toast.show('กรอกตัวชี้วัด คำถาม และตัวเลือกทั้ง 4 ข้อให้ครบ', 'error');
      return;
    }
    setBusy(true);
    try {
      await saveQuestionBankItem({
        ...draft,
        id: editingId,
        classroom,
        subject,
        indicatorId: indicator.id,
        indicatorCode: indicator.code,
      });
      setItems(await fetchQuestionBank());
      reset();
      toast.show(editingId ? 'แก้ไขคำถามเรียบร้อย' : 'เพิ่มคำถามเรียบร้อย');
    } catch {
      toast.show('บันทึกคำถามไม่สำเร็จ', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('ต้องการลบคำถามข้อนี้ใช่หรือไม่')) return;
    setBusy(true);
    try {
      await deleteQuestionBankItem(id);
      setItems(await fetchQuestionBank());
      if (editingId === id) reset();
      toast.show('ลบคำถามเรียบร้อย');
    } catch {
      toast.show('ลบคำถามไม่สำเร็จ', 'error');
    } finally {
      setBusy(false);
    }
  };

  const edit = (item: QuestionBankItem) => {
    setEditingId(item.id);
    setClassroom(item.classroom);
    setSubject(item.subject);
    setIndicatorId(item.indicatorId);
    setDraft({
      question: item.question,
      options: [...item.options],
      answer: item.answer,
      explanation: item.explanation,
      difficulty: item.difficulty,
      status: item.status,
    });
  };

  const createPreview = () => {
    const result = drawQuestionSet(filtered, 10);
    setPreview(result);
    if (result.length < 10) {
      toast.show(`คลังที่เลือกมีข้อเผยแพร่เพียง ${result.length} ข้อ ควรเพิ่มให้ครบอย่างน้อย 10 ข้อ`, 'error');
    }
  };

  return (
    <div className="question-bank">
      <header>
        <div>
          <span>ระบบคลังข้อสอบและการประเมินมาตรฐาน</span>
          <h2><FileQuestion size={22} /> คลังข้อสอบวิทยาการคำนวณ</h2>
          <p>ข้อสอบมาตรฐาน 25 ชุดตามหลักสูตร และข้อสอบแบบกำหนดเองตามตัวชี้วัด</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              style={{
                background: bankTab === 'official' ? '#315fe8' : 'transparent',
                color: bankTab === 'official' ? '#fff' : '#475569',
                border: 0,
                borderRadius: '6px',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                width: 'auto',
                height: 'auto',
              }}
              onClick={() => setBankTab('official')}
            >
              <BookOpen size={15} /> คลังข้อสอบทางการ (25 ชุด)
            </button>
            <button
              type="button"
              style={{
                background: bankTab === 'custom' ? '#315fe8' : 'transparent',
                color: bankTab === 'custom' ? '#fff' : '#475569',
                border: 0,
                borderRadius: '6px',
                padding: '6px 12px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                width: 'auto',
                height: 'auto',
              }}
              onClick={() => setBankTab('custom')}
            >
              <Layers size={15} /> ข้อสอบกำหนดเอง
            </button>
          </div>
          <button type="button" title="รีเฟรช" onClick={() => void fetchQuestionBank().then(setItems)}>
            <RefreshCw size={17} />
          </button>
        </div>
      </header>

      {/* 1. แท็บคลังข้อสอบทางการ 25 ชุด */}
      {bankTab === 'official' && (
        <div style={{ display: 'grid', gap: '14px' }}>
          <section className="question-bank-filters" style={{ gridTemplateColumns: '150px 1fr auto' }}>
            <label>ระดับชั้น
              <select value={officialGrade} onChange={(e) => {
                const nextGrade = e.target.value;
                setOfficialGrade(nextGrade);
                setSelectedSetId(getExamSetsByGrade(nextGrade)[0]?.id || '');
              }}>
                {availableExamGrades.map((g) => (
                  <option key={g} value={g}>ชั้น {g}</option>
                ))}
              </select>
            </label>
            <label>เลือกชุดข้อสอบ
              <select value={activeOfficialSet?.id || ''} onChange={(e) => setSelectedSetId(e.target.value)}>
                {officialSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    ชุดที่ {s.setNumber}: {s.title} ({s.totalQuestions} ข้อ)
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="draw-questions"
              style={{ background: '#0284c7' }}
              onClick={() => window.print()}
            >
              <Printer size={16} style={{ marginRight: '6px' }} /> พิมพ์ชุดข้อสอบ
            </button>
          </section>

          {activeOfficialSet && (
            <div style={{ background: '#fff', border: '1px solid #dce3ee', borderRadius: '8px', padding: '20px' }}>
              <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '12px', marginBottom: '18px' }}>
                <span style={{ background: '#e0e7ff', color: '#3730a3', padding: '3px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                  ระดับชั้น {activeOfficialSet.grade} • ชุดที่ {activeOfficialSet.setNumber}
                </span>
                <h3 style={{ margin: '8px 0 4px', fontSize: '1.25rem', color: '#1e293b' }}>
                  {activeOfficialSet.title}
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                  กลุ่มสาระการเรียนรู้วิทยาศาสตร์และเทคโนโลยี • สาระที่ ๔ เทคโนโลยี ({activeOfficialSet.subject}) • จำนวน {activeOfficialSet.totalQuestions} ข้อ • เวลา {activeOfficialSet.timeLimitMinutes} นาที
                </p>
              </div>

              <div style={{ display: 'grid', gap: '14px' }}>
                {activeOfficialSet.questions.map((q, qIndex) => {
                  const labels = ['ก', 'ข', 'ค', 'ง'];
                  return (
                    <div
                      key={q.id}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '14px',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1e293b', marginBottom: '8px' }}>
                        ข้อ {qIndex + 1}. {q.text}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '6px', marginBottom: '8px' }}>
                        {q.options.map((opt, optIndex) => {
                          const isKey = optIndex === q.answerIndex;
                          return (
                            <div
                              key={optIndex}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '6px',
                                fontSize: '0.85rem',
                                background: isKey ? '#dcfce7' : '#fff',
                                border: isKey ? '1px solid #86efac' : '1px solid #e2e8f0',
                                color: isKey ? '#166534' : '#334155',
                                fontWeight: isKey ? 700 : 400,
                              }}
                            >
                              <strong>{labels[optIndex] || optIndex + 1}.</strong> {opt}
                              {isKey && ' ✓ (เฉลย)'}
                            </div>
                          );
                        })}
                      </div>
                      {q.explanation && (
                        <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', background: '#f1f5f9', padding: '4px 8px', borderRadius: '4px' }}>
                          คำอธิบาย: {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. แท็บข้อสอบกำหนดเองตามตัวชี้วัด (Custom Bank) */}
      {bankTab === 'custom' && (
        <>
          <section className="question-bank-filters">
            <label>ชั้น
              <select value={classroom} onChange={(event) => {
                const nextClassroom = event.target.value;
                setClassroom(nextClassroom);
                setSubject(getSubjectsForClassroom(nextClassroom)[0]?.id || 'main');
                setIndicatorId('');
              }}>
                {allClassrooms2569.map((item) => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label>วิชา
              <select value={subject} onChange={(event) => {
                setSubject(event.target.value as Subject);
                setIndicatorId('');
              }}>
                {subjects.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}
              </select>
            </label>
            <label>ตัวชี้วัด
              <select value={indicatorId} onChange={(event) => setIndicatorId(event.target.value)}>
                <option value="">ทุกตัวชี้วัด</option>
                {indicators.map((item) => <option value={item.id} key={item.id}>{item.code} {item.title}</option>)}
              </select>
            </label>
            <button type="button" className="draw-questions" onClick={createPreview}>สุ่มชุด 10 ข้อ</button>
          </section>

          <div className="question-bank-layout">
            <section className="question-editor">
              <h3><Plus size={17} /> {editingId ? 'แก้ไขคำถาม' : 'เพิ่มคำถาม'}</h3>
              {!indicatorId && <p className="question-warning">เลือกตัวชี้วัดก่อนสร้างคำถาม</p>}
              <label>ระดับความยาก
                <select value={draft.difficulty} onChange={(event) => setDraft({ ...draft, difficulty: event.target.value as QuestionDifficulty })}>
                  <option value="easy">ง่าย</option>
                  <option value="medium">ปานกลาง</option>
                  <option value="hard">ยาก</option>
                </select>
              </label>
              <label>คำถาม
                <textarea rows={3} value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} />
              </label>
              <label>ตัวเลือก (เลือกข้อที่ถูกต้อง)</label>
              {draft.options.map((option, index) => (
                <label className="question-option" key={index}>
                  <input
                    type="radio"
                    name="correct-answer"
                    checked={draft.answer === index}
                    onChange={() => setDraft({ ...draft, answer: index })}
                  />
                  <span>{['ก', 'ข', 'ค', 'ง'][index]}</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(event) => {
                      const next = [...draft.options];
                      next[index] = event.target.value;
                      setDraft({ ...draft, options: next });
                    }}
                  />
                </label>
              ))}
              <label>คำอธิบายเฉลย
                <textarea rows={2} value={draft.explanation} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} />
              </label>
              <div className="question-editor-actions">
                {editingId && <button type="button" onClick={reset}>ยกเลิก</button>}
                <button type="button" className="save-question" disabled={busy} onClick={save}>
                  <Save size={16} /> บันทึก
                </button>
              </div>
            </section>

            <section className="question-list">
              <div className="question-list-heading">
                <h3>รายการคำถาม ({filtered.length})</h3>
                <small>{items.filter((item) => item.status === 'published').length} ข้อเผยแพร่</small>
              </div>
              {filtered.length === 0 ? (
                <div className="question-empty">ยังไม่มีคำถามในหมวดนี้</div>
              ) : (
                filtered.map((item, index) => (
                  <article key={item.id} onClick={() => edit(item)}>
                    <div>
                      <span className={`difficulty ${item.difficulty}`}>{item.difficulty}</span>
                      <small>{item.indicatorCode}</small>
                    </div>
                    <strong>{index + 1}. {item.question}</strong>
                    <small>เฉลย: {['ก', 'ข', 'ค', 'ง'][item.answer]} • ตอบแล้ว {item.attempts} ครั้ง (ถูก {item.correct})</small>
                    <button
                      type="button"
                      title="ลบ"
                      onClick={(event) => {
                        event.stopPropagation();
                        void remove(item.id);
                      }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </article>
                ))
              )}
            </section>
          </div>

          {preview.length > 0 && (
            <section className="question-preview">
              <h3>ตัวอย่างชุดข้อสอบสุ่ม ({preview.length} ข้อ)</h3>
              <ol>
                {preview.map((item) => (
                  <li key={item.id}>
                    <strong>{item.question}</strong> <span>({item.indicatorCode})</span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default QuestionBankManager;
