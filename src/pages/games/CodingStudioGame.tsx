import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Blocks, CheckCircle2, ChevronLeft, Code2, Trophy } from 'lucide-react';
import PythonLab from '../../components/PythonLab';
import { useAuth } from '../../context/AuthContext';
import { useGameProgress } from '../../hooks/useGameProgress';
import './CodingStudioGame.css';
import './GameStyles.css';

const CodingStudioGame: React.FC = () => {
  const { user } = useAuth();
  const recordGame = useGameProgress(
    'coding-studio',
    'สตูดิโอเขียนโปรแกรม',
    { recordOnce: false },
  );

  const handleChallengeSolved = useCallback((solvedCount: number, challengeId: string) => {
    void recordGame(solvedCount, challengeId);
  }, [recordGame]);

  return (
    <main className="game-page coding-studio-page">
      <div className="game-topbar coding-studio-topbar">
        <Link to="/games" className="game-back">
          <ChevronLeft size={18} /> เกมทั้งหมด
        </Link>
        <div className="coding-studio-title">
          <span className="coding-studio-mark" aria-hidden="true"><Code2 size={24} /></span>
          <div>
            <h1>สตูดิโอเขียนโปรแกรม</h1>
            <p>ฝึกสร้างโปรแกรมด้วยบล็อกและภาษา Python จากโจทย์ที่ตรวจคำตอบได้</p>
          </div>
        </div>
      </div>

      <section className="coding-studio-summary" aria-label="ข้อมูลกิจกรรม">
        <span><Blocks size={17} /> Blockly และ Python</span>
        <span><CheckCircle2 size={17} /> 32 โจทย์พร้อมตรวจผลอัตโนมัติ</span>
        <span><Trophy size={17} /> แต่ละโจทย์ที่ผ่านครั้งแรกบันทึกคะแนน P</span>
      </section>

      <section className="coding-studio-workspace" aria-label="พื้นที่เขียนโปรแกรม">
        <PythonLab
          key={user?.id || 'guest'}
          onChallengeSolved={handleChallengeSolved}
        />
      </section>
    </main>
  );
};

export default CodingStudioGame;
