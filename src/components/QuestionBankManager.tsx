import React, { useEffect, useMemo, useState } from 'react';
import { FileQuestion, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
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
      toast.show('บันทึกคำถามเข้าคลังกลางแล้ว', 'success');
    } catch (error) {
      toast.show(`บันทึกคำถามไม่สำเร็จ: ${error instanceof Error ? error.message : String(error)}`, 'error');
    } finally {
      setBusy(false);
    }
  };

  const edit = (item: QuestionBankItem) => {
    setClassroom(item.classroom);
    setSubject(item.subject);
    setIndicatorId(item.indicatorId);
    setEditingId(item.id);
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
          <span>ข้อสอบกลางตามตัวชี้วัด</span>
          <h2><FileQuestion size={22} /> คลังข้อสอบ</h2>
          <p>แยกระดับง่าย ปานกลาง ยาก สุ่มชุด 10 ข้อ และดูผลวิเคราะห์รายข้อ</p>
        </div>
        <button type="button" title="รีเฟรช" onClick={() => void fetchQuestionBank().then(setItems)}>
          <RefreshCw size={17} />
        </button>
      </header>

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
          {draft.options.map((option, index) => (
            <label className="question-option" key={index}>
              <input type="radio" checked={draft.answer === index} onChange={() => setDraft({ ...draft, answer: index })} />
              <span>{['ก', 'ข', 'ค', 'ง'][index]}</span>
              <input
                value={option}
                onChange={(event) => setDraft({
                  ...draft,
                  options: draft.options.map((value, optionIndex) => optionIndex === index ? event.target.value : value),
                })}
              />
            </label>
          ))}
          <label>คำอธิบายเฉลย
            <textarea rows={2} value={draft.explanation} onChange={(event) => setDraft({ ...draft, explanation: event.target.value })} />
          </label>
          <div className="question-editor-actions">
            {editingId && <button type="button" onClick={reset}>ยกเลิก</button>}
            <button type="button" className="save-question" onClick={() => void save()} disabled={busy || !indicatorId}>
              <Save size={16} /> บันทึก
            </button>
          </div>
        </section>

        <section className="question-list">
          <div className="question-list-heading">
            <h3>รายการคำถาม</h3>
            <span>{filtered.length} ข้อ</span>
          </div>
          {filtered.length === 0 ? (
            <p className="question-empty">ยังไม่มีคำถามในตัวชี้วัดที่เลือก</p>
          ) : filtered.map((item) => {
            const correctRate = item.attempts > 0 ? Math.round((item.correct / item.attempts) * 100) : null;
            return (
              <article key={item.id} onClick={() => edit(item)}>
                <div>
                  <span className={`difficulty ${item.difficulty}`}>
                    {item.difficulty === 'easy' ? 'ง่าย' : item.difficulty === 'medium' ? 'ปานกลาง' : 'ยาก'}
                  </span>
                  <b>{item.indicatorCode}</b>
                </div>
                <strong>{item.question}</strong>
                <small>
                  {correctRate === null
                    ? 'ยังไม่มีข้อมูลการตอบ'
                    : `ตอบถูก ${correctRate}% จาก ${item.attempts} ครั้ง`}
                </small>
                <button type="button" title="ลบ" onClick={(event) => {
                  event.stopPropagation();
                  if (!confirm('ลบคำถามนี้?')) return;
                  void deleteQuestionBankItem(item.id).then(() => fetchQuestionBank()).then(setItems);
                }}>
                  <Trash2 size={15} />
                </button>
              </article>
            );
          })}
        </section>
      </div>

      {preview.length > 0 && (
        <section className="question-preview">
          <h3>ตัวอย่างชุดข้อสอบ 10 ข้อ</h3>
          <ol>
            {preview.map((item) => <li key={item.id}>{item.question} <span>{item.indicatorCode}</span></li>)}
          </ol>
        </section>
      )}
    </div>
  );
};

export default QuestionBankManager;
