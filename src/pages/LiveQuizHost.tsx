import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Users, Play, Award, X, Trophy } from 'lucide-react';
import {
  createRoom, generateRoomCode, startQuiz, revealAnswer, nextQuestion, closeRoom, subscribeRoom,
} from '../services/liveQuizService';
import type { LiveQuizRoom, LiveQuizQuestion } from '../services/liveQuizService';
import { grades as curriculumGrades } from '../data/curriculum';
import {
  drawQuestionSet,
  fetchQuestionBank,
  recordQuestionAnalysis,
  type QuestionBankItem,
} from '../services/questionBankService';

const LiveQuizHost: React.FC = () => {
  const [room, setRoom] = useState<LiveQuizRoom | null>(null);
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('Live Quiz');
  const [targetGradeId, setTargetGradeId] = useState('');
  const [targetUnitNo, setTargetUnitNo] = useState<number>(1);
  const [questions, setQuestions] = useState<LiveQuizQuestion[]>([
    { q: 'อัลกอริทึมคืออะไร?', options: ['สูตรอาหาร', 'ขั้นตอนการแก้ปัญหา', 'ภาษาโปรแกรม', 'ฮาร์ดแวร์'], answer: 1 },
  ]);
  const [bankQuestions, setBankQuestions] = useState<QuestionBankItem[]>([]);
  const recordedRoomRef = useRef('');

  const targetUnits = useMemo(() => {
    if (!targetGradeId) return [];
    const g = curriculumGrades.find((x) => x.id === targetGradeId);
    return g?.units || [];
  }, [targetGradeId]);

  useEffect(() => {
    if (!code) return;
    return subscribeRoom(code, (r) => setRoom(r));
  }, [code]);

  useEffect(() => {
    void fetchQuestionBank().then(setBankQuestions);
  }, []);

  useEffect(() => {
    if (!room || room.state !== 'finished' || recordedRoomRef.current === room.code) return;
    recordedRoomRef.current = room.code;
    const players = Object.values(room.players);
    void Promise.all(room.questions.map((question, index) => {
      if (!question.bankId) return Promise.resolve();
      const correct = players.filter((player) => player.answers[index]?.correct).length;
      return recordQuestionAnalysis(question.bankId, players.length, correct);
    }));
  }, [room]);

  const handleCreate = async () => {
    if (questions.length === 0) { alert('ต้องมีอย่างน้อย 1 คำถาม'); return; }
    const c = generateRoomCode();
    await createRoom({
      code: c,
      title,
      hostId: 'teacher',
      questions,
      targetGradeId: targetGradeId || undefined,
      targetUnitNo: targetGradeId ? targetUnitNo : undefined,
    });
    setCode(c);
  };

  const addQuestion = () => setQuestions([...questions, { q: '', options: ['', '', '', ''], answer: 0 }]);
  const removeQuestion = (i: number) => setQuestions(questions.filter((_, idx) => idx !== i));
  const updateQ = (i: number, patch: Partial<LiveQuizQuestion>) => {
    const next = [...questions]; next[i] = { ...next[i], ...patch }; setQuestions(next);
  };

  const importFromBank = () => {
    const classroom = targetGradeId.startsWith('p')
      ? `ป.${targetGradeId.slice(1)}`
      : targetGradeId.startsWith('m') ? `ม.${targetGradeId.slice(1, 2)}` : '';
    const subject = targetGradeId.includes('design') ? 'dt' : targetGradeId.startsWith('m') ? 'cs' : 'main';
    const filtered = bankQuestions.filter((item) => (
      (!classroom || item.classroom === classroom)
      && item.subject === subject
    ));
    const drawn = drawQuestionSet(filtered, 10);
    if (drawn.length === 0) {
      alert('ยังไม่มีคำถามที่เผยแพร่ในคลังสำหรับชั้นและวิชานี้');
      return;
    }
    setQuestions(drawn.map((item) => ({
      q: item.question,
      options: item.options,
      answer: item.answer,
      bankId: item.id,
    })));
    setTitle(`Live Quiz ${classroom || 'รวมชั้น'}`);
  };

  if (!room) {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', maxWidth: 800 }}>
        <h1>🎯 สร้าง Live Quiz</h1>
        <p style={{ color: '#6b7280' }}>นักเรียนเข้าด้วยรหัส 6 หลัก ตอบพร้อมกัน — แข่งคะแนนเรียลไทม์!</p>

        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem' }}>ชื่อ Quiz</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ width: '100%', padding: 10, border: '1px solid #e5e7eb', borderRadius: 8, fontFamily: 'inherit', marginTop: 4 }}
            />
          </div>

          <div style={{ marginBottom: 16, padding: 12, background: '#f0fdf4', borderRadius: 10, border: '1px dashed #86efac' }}>
            <label style={{ fontWeight: 700, fontSize: '0.9rem', display: 'block', marginBottom: 8 }}>
              📊 ผูกคะแนนเข้า K ของหน่วย (optional — ไม่เลือกจะใช้ unit 1 ของห้องนักเรียนเป็นค่าเริ่มต้น)
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select
                value={targetGradeId}
                onChange={(e) => { setTargetGradeId(e.target.value); setTargetUnitNo(1); }}
                style={{ flex: 1, minWidth: 200, padding: 8, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}
              >
                <option value="">(default — ตามห้องของนักเรียน)</option>
                {curriculumGrades.map((g) => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
              {targetGradeId && (
                <select
                  value={targetUnitNo}
                  onChange={(e) => setTargetUnitNo(parseInt(e.target.value, 10) || 1)}
                  style={{ padding: 8, border: '1px solid #d1d5db', borderRadius: 8, fontFamily: 'inherit' }}
                >
                  {targetUnits.map((u) => (
                    <option key={u.no} value={u.no}>หน่วยที่ {u.no} {u.title ? `— ${u.title}` : ''}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'space-between', gap: 8 }}>
            <h3>คำถาม</h3>
            <button type="button" onClick={importFromBank} className="btn-secondary">
              ดึง 10 ข้อจากคลัง
            </button>
          </div>
          {questions.map((q, i) => (
            <div key={i} style={{ padding: 12, background: '#f9fafb', borderRadius: 10, marginBottom: 10 }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <strong>ข้อ {i + 1}</strong>
                <input
                  value={q.q}
                  onChange={(e) => updateQ(i, { q: e.target.value })}
                  placeholder="พิมพ์คำถาม..."
                  style={{ flex: 1, padding: 6, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'inherit' }}
                />
                <button onClick={() => removeQuestion(i)} className="btn-ghost"><X size={14} /></button>
              </div>
              {q.options.map((opt, oi) => (
                <div key={oi} style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 4, minWidth: 80 }}>
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={q.answer === oi}
                      onChange={() => updateQ(i, { answer: oi })}
                    />
                    {['ก', 'ข', 'ค', 'ง'][oi]}
                  </label>
                  <input
                    value={opt}
                    onChange={(e) => { const next = [...q.options]; next[oi] = e.target.value; updateQ(i, { options: next }); }}
                    placeholder={`ตัวเลือกที่ ${oi + 1}`}
                    style={{ flex: 1, padding: 6, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'inherit' }}
                  />
                </div>
              ))}
            </div>
          ))}
          <button onClick={addQuestion} className="btn-secondary">+ เพิ่มคำถาม</button>

          <div style={{ marginTop: 20, textAlign: 'center' }}>
            <button onClick={handleCreate} className="btn-primary" style={{ padding: '14px 32px', fontSize: '1.1rem' }}>
              <Play size={20} /> สร้าง Quiz Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Lobby
  if (room.state === 'lobby') {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center', maxWidth: 700 }}>
        <h2>{room.title}</h2>
        <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', padding: '2rem', borderRadius: 20, margin: '1rem 0' }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>📱 ให้นักเรียนเข้าที่</p>
          <p style={{ margin: '4px 0', fontSize: '1.3rem' }}><strong>{window.location.origin}/live</strong></p>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>แล้วใส่รหัส</p>
          <h1 style={{ fontSize: '5rem', margin: '8px 0', letterSpacing: '0.5rem' }}>{room.code}</h1>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Users /> <strong>{Object.keys(room.players).length} คน</strong> เข้ามาแล้ว
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, flexWrap: 'wrap', maxWidth: 600, margin: '0 auto 2rem' }}>
          {Object.values(room.players).map((p) => (
            <div key={p.id} style={{ padding: '6px 12px', background: '#fef3c7', borderRadius: 999, fontSize: '0.85rem' }}>
              {p.emoji} {p.name}
            </div>
          ))}
        </div>

        <button
          onClick={() => startQuiz(room.code)}
          disabled={Object.keys(room.players).length === 0}
          className="btn-primary"
          style={{ padding: '14px 40px', fontSize: '1.2rem' }}
        >
          <Play size={20} /> เริ่มเลย!
        </button>
        <br />
        <button onClick={() => { closeRoom(room.code); setCode(''); }} className="btn-ghost" style={{ marginTop: 12 }}>
          ❌ ยกเลิก
        </button>
      </div>
    );
  }

  // Question / Reveal
  if (room.state === 'question' || room.state === 'reveal') {
    const q = room.questions[room.currentQuestion];
    const answered = Object.values(room.players).filter(p => p.answers[room.currentQuestion]).length;
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', maxWidth: 900 }}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <small>ข้อ {room.currentQuestion + 1} / {room.questions.length}</small>
          <h2 style={{ fontSize: '1.8rem' }}>{q.q}</h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
          {q.options.map((opt, i) => {
            const cls = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'][i];
            const isCorrect = room.state === 'reveal' && i === q.answer;
            const count = Object.values(room.players).filter(p => p.answers[room.currentQuestion]?.choice === i).length;
            return (
              <div key={i} style={{
                background: cls, color: 'white', padding: '1.5rem',
                borderRadius: 14, position: 'relative',
                opacity: room.state === 'reveal' && !isCorrect ? 0.4 : 1,
                outline: isCorrect ? '4px solid #22c55e' : 'none',
                outlineOffset: 4,
              }}>
                <div style={{ fontWeight: 800, fontSize: '1.4rem' }}>{['ก', 'ข', 'ค', 'ง'][i]}. {opt}</div>
                {isCorrect && <div style={{ marginTop: 8 }}>✅ คำตอบที่ถูก</div>}
                {room.state === 'reveal' && (
                  <div style={{ position: 'absolute', top: 8, right: 12, background: 'rgba(0,0,0,0.3)', padding: '2px 8px', borderRadius: 999, fontSize: '0.78rem' }}>
                    {count} คน
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <strong>{answered} / {Object.keys(room.players).length}</strong> ตอบแล้ว
        </div>

        <div style={{ textAlign: 'center' }}>
          {room.state === 'question' ? (
            <button onClick={() => revealAnswer(room.code)} className="btn-primary" style={{ padding: '12px 32px' }}>
              <Award size={16} /> เฉลย
            </button>
          ) : (
            <button onClick={() => nextQuestion(room.code)} className="btn-primary" style={{ padding: '12px 32px' }}>
              {room.currentQuestion + 1 < room.questions.length ? 'ข้อต่อไป →' : '🏆 ดูผลสุดท้าย'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // Finished
  const ranked = Object.values(room.players).sort((a, b) => b.score - a.score);
  return (
    <div className="container section-padding" style={{ paddingTop: '6rem', maxWidth: 700, textAlign: 'center' }}>
      <Trophy size={64} color="#f59e0b" />
      <h1>🏆 จบเกม!</h1>
      <div style={{ marginTop: 20 }}>
        {ranked.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '14px 20px', marginBottom: 8,
            background: i === 0 ? 'linear-gradient(135deg, #fde68a, #fbbf24)' : '#f9fafb',
            borderRadius: 12, fontSize: i < 3 ? '1.2rem' : '1rem',
          }}>
            <div>
              <strong>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`}</strong> {p.emoji} {p.name}
            </div>
            <strong>{p.score} pts</strong>
          </div>
        ))}
      </div>
      <button onClick={() => { closeRoom(room.code); setCode(''); }} className="btn-secondary" style={{ marginTop: 20 }}>
        เริ่มเกมใหม่
      </button>
    </div>
  );
};

export default LiveQuizHost;
