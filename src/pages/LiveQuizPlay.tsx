import React, { useState, useEffect } from 'react';
import { Trophy, Users, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { joinRoom, subscribeRoom, submitAnswer } from '../services/liveQuizService';
import type { LiveQuizRoom } from '../services/liveQuizService';

const LiveQuizPlay: React.FC = () => {
  const { user } = useAuth();
  const [code, setCode] = useState('');
  const [room, setRoom] = useState<LiveQuizRoom | null>(null);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!joined || !code) return;
    return subscribeRoom(code, setRoom);
  }, [joined, code]);

  const handleJoin = () => {
    if (!user) { setError('ต้อง login ก่อน'); return; }
    if (code.length !== 6) { setError('รหัสต้องเป็น 6 หลัก'); return; }
    const ok = joinRoom(code, {
      id: user.id,
      name: user.name,
      emoji: '🧑‍🎓',
    });
    if (!ok) { setError('ไม่พบห้องนี้ หรือเริ่มไปแล้ว'); return; }
    setJoined(true);
    setError('');
  };

  if (!user) {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <AlertCircle size={48} color="#f59e0b" />
        <h2>กรุณา Login ก่อน</h2>
        <p>ต้องเข้าสู่ระบบเพื่อเข้าร่วม Live Quiz</p>
        <a href="/login" className="btn-primary">เข้าสู่ระบบ</a>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center', maxWidth: 500 }}>
        <h1>🎯 เข้าร่วม Live Quiz</h1>
        <p>ใส่รหัส 6 หลักจากครู</p>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          maxLength={6}
          style={{
            fontSize: '3rem', padding: '1rem',
            width: '100%', maxWidth: 360, textAlign: 'center',
            letterSpacing: '0.5rem', border: '2px solid #e5e7eb',
            borderRadius: 16, fontWeight: 800, fontFamily: 'monospace',
            margin: '1rem 0',
          }}
        />
        {error && <p style={{ color: '#dc2626' }}>{error}</p>}
        <br />
        <button onClick={handleJoin} className="btn-primary" style={{ padding: '14px 40px', fontSize: '1.1rem' }}>
          เข้าร่วม
        </button>
      </div>
    );
  }

  if (!room) {
    return <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>กำลังเชื่อมต่อ...</div>;
  }

  const me = room.players[user.id];

  if (room.state === 'lobby') {
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <h2>{room.title}</h2>
        <div style={{ fontSize: '4rem', margin: '1rem 0' }}>⏳</div>
        <p>กำลังรอครูเริ่มเกม...</p>
        <p style={{ color: '#6b7280' }}><Users size={16} /> {Object.keys(room.players).length} คนในห้อง</p>
      </div>
    );
  }

  if (room.state === 'question') {
    const q = room.questions[room.currentQuestion];
    const myAnswer = me?.answers[room.currentQuestion];
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', maxWidth: 700, textAlign: 'center' }}>
        <small>ข้อ {room.currentQuestion + 1} / {room.questions.length}</small>
        <h2 style={{ fontSize: '1.6rem' }}>{q.q}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginTop: 20 }}>
          {q.options.map((opt, i) => {
            const cls = ['#ef4444', '#3b82f6', '#facc15', '#22c55e'][i];
            const picked = myAnswer?.choice === i;
            return (
              <button
                key={i}
                onClick={() => !myAnswer && submitAnswer(room.code, user.id, i)}
                disabled={!!myAnswer}
                style={{
                  background: cls, color: 'white', padding: '1.5rem',
                  borderRadius: 14, border: picked ? '4px solid #1f2937' : 'none',
                  cursor: myAnswer ? 'default' : 'pointer',
                  fontSize: '1.2rem', fontWeight: 700, fontFamily: 'inherit',
                  opacity: myAnswer && !picked ? 0.4 : 1,
                }}
              >
                {['ก', 'ข', 'ค', 'ง'][i]}. {opt}
              </button>
            );
          })}
        </div>
        {myAnswer && <p style={{ marginTop: 20 }}>✓ ตอบแล้ว — รอเฉลย</p>}
      </div>
    );
  }

  if (room.state === 'reveal') {
    const q = room.questions[room.currentQuestion];
    const myAnswer = me?.answers[room.currentQuestion];
    const correct = myAnswer?.choice === q.answer;
    return (
      <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem' }}>{correct ? '✅' : '❌'}</h1>
        <h2>{correct ? 'ถูกต้อง!' : 'เสียดาย!'}</h2>
        <p>คำตอบที่ถูก: <strong>{q.options[q.answer]}</strong></p>
        <p>คะแนนของคุณ: <strong>{me?.score || 0}</strong></p>
      </div>
    );
  }

  // Finished
  const ranked = Object.values(room.players).sort((a, b) => b.score - a.score);
  const myRank = ranked.findIndex(p => p.id === user.id) + 1;
  return (
    <div className="container section-padding" style={{ paddingTop: '6rem', textAlign: 'center', maxWidth: 600 }}>
      <Trophy size={64} color="#f59e0b" />
      <h1>🏆 จบแล้ว!</h1>
      <p>อันดับของคุณ: <strong style={{ fontSize: '2rem', color: '#6366f1' }}>#{myRank}</strong></p>
      <p>คะแนน: <strong>{me?.score}</strong></p>
      <div style={{ marginTop: 20 }}>
        {ranked.slice(0, 5).map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', justifyContent: 'space-between',
            padding: '8px 14px', marginBottom: 4,
            background: p.id === user.id ? '#fef3c7' : '#f9fafb',
            borderRadius: 8,
          }}>
            <span>{['🥇', '🥈', '🥉'][i] || `${i + 1}.`} {p.emoji} {p.name}</span>
            <strong>{p.score}</strong>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LiveQuizPlay;
