import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Calculator,
  CheckCircle2,
  ChevronLeft,
  FileImage,
  FileKey,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Folder,
  FolderCheck,
  Heart,
  Image as ImageIcon,
  RefreshCw,
  ShieldAlert,
  Trophy,
  UserRoundCheck,
  Volume2,
  XCircle,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';
import './FileOrganizerGame.css';

type IconName =
  | 'image'
  | 'document'
  | 'audio'
  | 'sheet'
  | 'science'
  | 'math'
  | 'thai'
  | 'private'
  | 'person';

interface FolderChoice {
  id: string;
  label: string;
  hint: string;
  color: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}

interface FileChallenge {
  id: string;
  name: string;
  detail: string;
  folderId: string;
  icon: IconName;
  explanation: string;
}

interface GameLevel {
  title: string;
  mission: string;
  folders: FolderChoice[];
  files: FileChallenge[];
}

const ITEM_ICONS: Record<IconName, React.ComponentType<{ size?: number; strokeWidth?: number }>> = {
  image: FileImage,
  document: FileText,
  audio: Volume2,
  sheet: FileSpreadsheet,
  science: FlaskConical,
  math: Calculator,
  thai: BookOpen,
  private: FileKey,
  person: ImageIcon,
};

const LEVELS: GameLevel[] = [
  {
    title: 'แยกตามชนิดไฟล์',
    mission: 'เลือกโฟลเดอร์ให้ตรงกับชนิดของข้อมูล',
    folders: [
      { id: 'image', label: 'รูปภาพ', hint: 'ภาพถ่ายและภาพวาด', color: '#2563eb', icon: ImageIcon },
      { id: 'document', label: 'เอกสาร', hint: 'ข้อความและใบงาน', color: '#0f766e', icon: FileText },
      { id: 'audio', label: 'เสียง', hint: 'เพลงและเสียงบันทึก', color: '#b45309', icon: Volume2 },
    ],
    files: [
      { id: 'photo-jpg', name: 'ภาพกิจกรรม.jpg', detail: 'ภาพถ่ายจากกล้อง', folderId: 'image', icon: 'image', explanation: 'นามสกุล .jpg เป็นไฟล์รูปภาพ' },
      { id: 'report-docx', name: 'รายงานกลุ่ม.docx', detail: 'เอกสารจากโปรแกรมพิมพ์งาน', folderId: 'document', icon: 'document', explanation: 'นามสกุล .docx เป็นไฟล์เอกสาร' },
      { id: 'song-mp3', name: 'เพลงโรงเรียน.mp3', detail: 'ไฟล์เพลง', folderId: 'audio', icon: 'audio', explanation: 'นามสกุล .mp3 เป็นไฟล์เสียง' },
      { id: 'poster-png', name: 'โปสเตอร์.png', detail: 'ภาพประชาสัมพันธ์', folderId: 'image', icon: 'image', explanation: 'นามสกุล .png เป็นไฟล์รูปภาพ' },
      { id: 'notes-pdf', name: 'สรุปบทเรียน.pdf', detail: 'เอกสารสำหรับอ่าน', folderId: 'document', icon: 'document', explanation: 'นามสกุล .pdf ใช้เก็บเอกสารที่ต้องการคงรูปแบบ' },
      { id: 'interview-wav', name: 'เสียงสัมภาษณ์.wav', detail: 'เสียงที่บันทึกจากไมโครโฟน', folderId: 'audio', icon: 'audio', explanation: 'นามสกุล .wav เป็นไฟล์เสียง' },
    ],
  },
  {
    title: 'จัดแฟ้มตามรายวิชา',
    mission: 'อ่านชื่อไฟล์แล้วจัดเก็บให้ค้นหาได้ง่าย',
    folders: [
      { id: 'science', label: 'วิทยาศาสตร์', hint: 'ธรรมชาติและการทดลอง', color: '#15803d', icon: FlaskConical },
      { id: 'math', label: 'คณิตศาสตร์', hint: 'จำนวนและการคำนวณ', color: '#7c3aed', icon: Calculator },
      { id: 'thai', label: 'ภาษาไทย', hint: 'ภาษาและวรรณกรรม', color: '#be123c', icon: BookOpen },
    ],
    files: [
      { id: 'butterfly', name: 'วงจรชีวิตผีเสื้อ.jpg', detail: 'ภาพประกอบการเรียน', folderId: 'science', icon: 'science', explanation: 'วงจรชีวิตของสิ่งมีชีวิตเป็นเนื้อหาวิทยาศาสตร์' },
      { id: 'multiply', name: 'ตารางสูตรคูณ.pdf', detail: 'เอกสารทบทวน', folderId: 'math', icon: 'math', explanation: 'สูตรคูณเป็นเนื้อหาคณิตศาสตร์' },
      { id: 'rhyme', name: 'คำคล้องจอง.docx', detail: 'ใบงานภาษา', folderId: 'thai', icon: 'thai', explanation: 'คำคล้องจองเป็นเนื้อหาภาษาไทย' },
      { id: 'plant-table', name: 'ผลทดลองปลูกถั่ว.xlsx', detail: 'ตารางบันทึกผล', folderId: 'science', icon: 'sheet', explanation: 'ผลการทดลองปลูกถั่วควรอยู่ในแฟ้มวิทยาศาสตร์' },
      { id: 'fraction', name: 'แบบฝึกเศษส่วน.pdf', detail: 'ใบงานคำนวณ', folderId: 'math', icon: 'math', explanation: 'เศษส่วนเป็นเนื้อหาคณิตศาสตร์' },
      { id: 'story', name: 'นิทานพื้นบ้าน.docx', detail: 'เรื่องสำหรับอ่าน', folderId: 'thai', icon: 'thai', explanation: 'นิทานและการอ่านเป็นเนื้อหาภาษาไทย' },
    ],
  },
  {
    title: 'ข้อมูลปลอดภัย',
    mission: 'ตัดสินใจก่อนจัดเก็บหรือเผยแพร่ข้อมูล',
    folders: [
      { id: 'safe', label: 'จัดเก็บได้', hint: 'เป็นงานของเราและไม่เปิดเผยความลับ', color: '#15803d', icon: FolderCheck },
      { id: 'ask', label: 'ขออนุญาตก่อน', hint: 'เกี่ยวข้องกับบุคคลอื่น', color: '#b45309', icon: UserRoundCheck },
      { id: 'reject', label: 'ไม่ควรบันทึก', hint: 'เป็นข้อมูลลับหรือเสี่ยงอันตราย', color: '#dc2626', icon: ShieldAlert },
    ],
    files: [
      { id: 'own-work', name: 'ใบงานของฉัน', detail: 'ไม่มีข้อมูลส่วนตัวที่สำคัญ', folderId: 'safe', icon: 'document', explanation: 'งานของตนเองที่ไม่มีข้อมูลลับสามารถจัดเก็บเพื่อเรียนต่อได้' },
      { id: 'friend-photo', name: 'ภาพเพื่อนในห้อง', detail: 'เห็นใบหน้าของเพื่อนชัดเจน', folderId: 'ask', icon: 'person', explanation: 'ภาพของผู้อื่นต้องได้รับอนุญาตก่อนบันทึกหรือเผยแพร่' },
      { id: 'password', name: 'รหัสผ่านของฉัน', detail: 'ใช้เข้าสู่บัญชีส่วนตัว', folderId: 'reject', icon: 'private', explanation: 'ไม่ควรบันทึกรหัสผ่านไว้ในแฟ้มที่ผู้อื่นเปิดดูได้' },
      { id: 'summary', name: 'สรุปบทเรียนของฉัน', detail: 'ข้อความที่เขียนขึ้นเพื่อทบทวน', folderId: 'safe', icon: 'document', explanation: 'สรุปบทเรียนของตนเองจัดเก็บไว้ใช้เรียนต่อได้' },
      { id: 'id-card', name: 'สำเนาบัตรประชาชน', detail: 'มีเลขประจำตัวและที่อยู่', folderId: 'reject', icon: 'private', explanation: 'เอกสารสำคัญมีข้อมูลส่วนบุคคล ไม่ควรเก็บในพื้นที่ที่ไม่ปลอดภัย' },
      { id: 'teacher-audio', name: 'เสียงสัมภาษณ์ครู', detail: 'มีเสียงของบุคคลอื่น', folderId: 'ask', icon: 'audio', explanation: 'การบันทึกและนำเสียงของผู้อื่นไปใช้ต้องได้รับอนุญาต' },
    ],
  },
  {
    title: 'ตั้งชื่อไฟล์ให้ค้นพบ',
    mission: 'เลือกชื่อไฟล์ที่สื่อความหมายและแยกฉบับงานให้ชัดเจน',
    folders: [
      { id: 'clear', label: 'ชื่อชัดเจน', hint: 'รู้เนื้อหาและวันที่จากชื่อไฟล์', color: '#15803d', icon: FolderCheck },
      { id: 'draft', label: 'ฉบับร่าง', hint: 'งานที่ยังแก้ไขไม่เสร็จ', color: '#2563eb', icon: FileText },
      { id: 'unclear', label: 'ควรเปลี่ยนชื่อ', hint: 'ชื่อกว้างหรือเดาเนื้อหาไม่ได้', color: '#dc2626', icon: ShieldAlert },
    ],
    files: [
      { id: 'clear-report', name: 'รายงานพลังงาน_ป5_2569.pdf', detail: 'ชื่อบอกหัวข้อ ชั้น และปี', folderId: 'clear', icon: 'document', explanation: 'ชื่อไฟล์ระบุเนื้อหา ชั้น และปี จึงค้นหาและแยกงานได้ง่าย' },
      { id: 'draft-slide', name: 'นำเสนอระบบสุริยะ_ร่าง02.pptx', detail: 'ยังอยู่ระหว่างแก้ไข', folderId: 'draft', icon: 'document', explanation: 'คำว่า ร่าง02 ช่วยบอกว่ายังไม่ใช่ฉบับส่งจริงและเป็นฉบับแก้ไขครั้งที่ 2' },
      { id: 'bad-new', name: 'ใหม่ล่าสุดจริงๆ.docx', detail: 'ไม่บอกหัวข้อหรือวันที่', folderId: 'unclear', icon: 'document', explanation: 'ชื่อไฟล์ไม่บอกเนื้อหาและใช้คำว่า ล่าสุด ซึ่งอาจสับสนเมื่อมีหลายฉบับ' },
      { id: 'clear-photo', name: 'กิจกรรมวันวิทยาศาสตร์_2569-08-18.jpg', detail: 'ชื่อบอกกิจกรรมและวันที่', folderId: 'clear', icon: 'image', explanation: 'การใส่ชื่อกิจกรรมและวันที่แบบ ปี-เดือน-วัน ช่วยเรียงและค้นภาพได้ง่าย' },
      { id: 'draft-data', name: 'คะแนนสำรวจ_ร่าง01.xlsx', detail: 'ตารางที่ยังตรวจไม่ครบ', folderId: 'draft', icon: 'sheet', explanation: 'ระบุว่าเป็นฉบับร่างเพื่อไม่ให้นำข้อมูลที่ยังไม่ตรวจไปใช้เป็นผลจริง' },
      { id: 'bad-file', name: 'งาน1.pdf', detail: 'มีไฟล์ชื่อคล้ายกันหลายไฟล์', folderId: 'unclear', icon: 'document', explanation: 'คำว่า งาน1 ไม่บอกหัวข้อหรือเจ้าของ ควรเปลี่ยนเป็นชื่อที่สื่อความหมาย' },
    ],
  },
  {
    title: 'เลือกพื้นที่จัดเก็บ',
    mission: 'เลือกตำแหน่งเก็บข้อมูลให้เหมาะกับผู้ที่ควรเข้าถึง',
    folders: [
      { id: 'personal', label: 'พื้นที่ส่วนตัว', hint: 'เฉพาะเจ้าของบัญชี', color: '#7c3aed', icon: FileKey },
      { id: 'class', label: 'โฟลเดอร์ชั้นเรียน', hint: 'ครูและเพื่อนในห้องเข้าถึงได้', color: '#2563eb', icon: UserRoundCheck },
      { id: 'public', label: 'เผยแพร่สาธารณะ', hint: 'ทุกคนเปิดดูได้', color: '#15803d', icon: Folder },
    ],
    files: [
      { id: 'personal-score', name: 'บันทึกคะแนนรายบุคคล.xlsx', detail: 'มีชื่อและคะแนนของนักเรียน', folderId: 'personal', icon: 'sheet', explanation: 'คะแนนรายบุคคลเป็นข้อมูลที่ต้องจำกัดผู้เข้าถึงและจัดเก็บอย่างปลอดภัย' },
      { id: 'class-team', name: 'ชิ้นงานกลุ่มห้อง ป.5.docx', detail: 'สมาชิกในห้องต้องร่วมแก้ไข', folderId: 'class', icon: 'document', explanation: 'งานร่วมกันของห้องควรเก็บในพื้นที่ชั้นเรียนที่กำหนดสิทธิ์สมาชิกไว้' },
      { id: 'public-poster', name: 'โปสเตอร์ประหยัดพลังงาน.png', detail: 'สร้างเพื่อรณรงค์โดยไม่มีข้อมูลส่วนตัว', folderId: 'public', icon: 'image', explanation: 'สื่อรณรงค์ที่ไม่มีข้อมูลส่วนตัวและตรวจแล้วสามารถเผยแพร่ให้คนทั่วไปดูได้' },
      { id: 'personal-diary', name: 'บันทึกสะท้อนการเรียนรู้.docx', detail: 'มีความรู้สึกและข้อมูลของผู้เขียน', folderId: 'personal', icon: 'private', explanation: 'บันทึกส่วนตัวควรอยู่ในพื้นที่ที่เจ้าของควบคุมการเข้าถึงได้' },
      { id: 'class-audio', name: 'เสียงซ้อมนำเสนอกลุ่ม.wav', detail: 'ใช้ให้สมาชิกกลุ่มช่วยกันตรวจ', folderId: 'class', icon: 'audio', explanation: 'ไฟล์ซ้อมงานควรแชร์เฉพาะผู้เกี่ยวข้องในชั้นเรียนหรือกลุ่ม' },
      { id: 'public-guide', name: 'คู่มือแยกขยะของโรงเรียน.pdf', detail: 'ตรวจข้อมูลและได้รับอนุญาตให้เผยแพร่แล้ว', folderId: 'public', icon: 'document', explanation: 'เอกสารที่ตรวจแล้ว ไม่มีข้อมูลลับ และได้รับอนุญาต สามารถเผยแพร่สาธารณะได้' },
    ],
  },
];

type Feedback = {
  correct: boolean;
  message: string;
  selectedFolderId: string;
};

const MAX_SCORE = LEVELS.reduce((sum, level) => sum + (level.files.length * 10), 0);

const FileOrganizerGame: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [fileIndex, setFileIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [attempts, setAttempts] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [completed, setCompleted] = useState(false);
  const recordGame = useGameProgress('file-organizer', 'จัดแฟ้มข้อมูล');

  const level = LEVELS[levelIndex];
  const currentFile = level.files[fileIndex];
  const CurrentIcon = ITEM_ICONS[currentFile.icon];
  const correctFolder = useMemo(
    () => level.folders.find((folder) => folder.id === currentFile.folderId),
    [currentFile.folderId, level.folders],
  );

  useEffect(() => {
    if (completed) void recordGame(score);
  }, [completed, recordGame, score]);

  const chooseFolder = (folderId: string) => {
    if (feedback || completed) return;
    const correct = folderId === currentFile.folderId;
    setAttempts((value) => value + 1);
    if (correct) {
      setScore((value) => value + 10);
      setFeedback({
        correct: true,
        selectedFolderId: folderId,
        message: currentFile.explanation,
      });
      return;
    }

    setLives((value) => Math.max(0, value - 1));
    setFeedback({
      correct: false,
      selectedFolderId: folderId,
      message: `ยังไม่ถูก ลองพิจารณา “${correctFolder?.label || ''}” จากชื่อและรายละเอียดของไฟล์`,
    });
  };

  const continueGame = () => {
    if (!feedback) return;
    if (!feedback.correct) {
      if (lives === 0) {
        setCompleted(true);
        return;
      }
      setFeedback(null);
      return;
    }

    const isLastFile = fileIndex === level.files.length - 1;
    const isLastLevel = levelIndex === LEVELS.length - 1;
    if (isLastFile && isLastLevel) {
      setCompleted(true);
      return;
    }
    if (isLastFile) {
      setLevelIndex((value) => value + 1);
      setFileIndex(0);
      setLives(3);
    } else {
      setFileIndex((value) => value + 1);
    }
    setFeedback(null);
  };

  const restart = () => {
    setLevelIndex(0);
    setFileIndex(0);
    setScore(0);
    setLives(3);
    setAttempts(0);
    setFeedback(null);
    setCompleted(false);
  };

  const correctAnswers = score / 10;
  const resultLabel = score >= MAX_SCORE * 0.8 ? 'ยอดเยี่ยม' : score >= MAX_SCORE * 0.6 ? 'ผ่านเกณฑ์' : 'ควรฝึกอีกครั้ง';

  return (
    <div className="game-page file-organizer-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2><Folder size={25} /> จัดแฟ้มข้อมูล</h2>
      </div>

      <div className="file-game-status">
        <div><span>ด่าน</span><strong>{levelIndex + 1}/{LEVELS.length}</strong></div>
        <div><span>รายการ</span><strong>{fileIndex + 1}/{level.files.length}</strong></div>
        <div><span>คะแนน</span><strong>{score}/{MAX_SCORE}</strong></div>
        <div className="file-lives" aria-label={`เหลือ ${lives} ชีวิต`}>
          <span>โอกาส</span>
          <strong>{[0, 1, 2].map((index) => <Heart key={index} size={18} fill={index < lives ? 'currentColor' : 'none'} className={index < lives ? 'active' : ''} />)}</strong>
        </div>
      </div>

      <main className="file-game-board">
        {completed && (
          <div className="file-game-complete">
            <Trophy size={54} />
            <h3>{resultLabel}</h3>
            <p>จัดแฟ้มถูก {correctAnswers} รายการ จากการเลือกทั้งหมด {attempts} ครั้ง</p>
            <strong>{score}/{MAX_SCORE} คะแนน</strong>
            <button type="button" className="btn-game-start" onClick={restart}><RefreshCw size={18} /> เล่นใหม่</button>
          </div>
        )}

        <header className="file-mission">
          <div>
            <span>ด่านที่ {levelIndex + 1}</span>
            <h3>{level.title}</h3>
            <p>{level.mission}</p>
          </div>
          <div className="file-progress" aria-label="ความคืบหน้าด่าน">
            {level.files.map((file, index) => (
              <span
                key={file.id}
                className={index < fileIndex ? 'done' : index === fileIndex ? 'current' : ''}
              />
            ))}
          </div>
        </header>

        <section className="file-workspace" aria-label="ไฟล์ที่ต้องจัดเก็บ">
          <div
            className="file-card"
            draggable={!feedback}
            onDragStart={(event) => event.dataTransfer.setData('text/plain', currentFile.id)}
          >
            <div className="file-icon"><CurrentIcon size={42} strokeWidth={1.7} /></div>
            <div>
              <span>ไฟล์ปัจจุบัน</span>
              <h4>{currentFile.name}</h4>
              <p>{currentFile.detail}</p>
            </div>
          </div>
        </section>

        <section className="folder-grid" aria-label="เลือกโฟลเดอร์">
          {level.folders.map((folder) => {
            const FolderIcon = folder.icon;
            const selected = feedback?.selectedFolderId === folder.id;
            const stateClass = selected ? (feedback.correct ? 'correct' : 'wrong') : '';
            return (
              <button
                type="button"
                className={`folder-choice ${stateClass}`}
                key={folder.id}
                style={{ '--folder-color': folder.color } as React.CSSProperties}
                onClick={() => chooseFolder(folder.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (event.dataTransfer.getData('text/plain') === currentFile.id) chooseFolder(folder.id);
                }}
                disabled={Boolean(feedback)}
              >
                <FolderIcon size={31} strokeWidth={1.8} />
                <strong>{folder.label}</strong>
                <span>{folder.hint}</span>
              </button>
            );
          })}
        </section>

        {feedback && (
          <div className={`file-feedback ${feedback.correct ? 'success' : 'fail'}`} role="status">
            {feedback.correct ? <CheckCircle2 size={23} /> : <XCircle size={23} />}
            <div><strong>{feedback.correct ? 'จัดเก็บถูกต้อง' : 'ยังไม่ถูกต้อง'}</strong><p>{feedback.message}</p></div>
            <button type="button" onClick={continueGame}>
              {feedback.correct ? 'รายการถัดไป' : lives === 0 ? 'ดูผลคะแนน' : 'ลองใหม่'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default FileOrganizerGame;
