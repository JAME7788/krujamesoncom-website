import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  X,
  Scale,
  ArrowRight,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { sfxCorrect, sfxWrong, sfxCoin } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './CyberCopGame.css';

interface CyberCase {
  id: number;
  badge: string;
  title: string;
  scenario: string;
  question: string;
  choices: string[];
  correctIdx: number;
  lawArticle: string;
  penalty: string;
  explanation: string;
}

const CASES: CyberCase[] = [
  {
    id: 1,
    badge: 'คดี #01: ลักลอบเข้าระบบ',
    title: 'แฮกเกอร์แอบเข้าเครื่องคอมพิวเตอร์โรงเรียน',
    scenario: 'มีนักเรียนคนหนึ่งแอบนำโปรแกรมดักจับรหัสผ่าน (Keylogger) มาติดตั้งที่เครื่องคอมพิวเตอร์ในห้องปฏิบัติการเพื่อแอบดูรหัสผ่านครูและเปลี่ยนเกรดของตนเอง',
    question: 'การลักลอบเข้าถึงระบบคอมพิวเตอร์ของผู้อื่นโดยไม่มีสิทธิ มีความผิดตาม พ.ร.บ.คอมพิวเตอร์ อย่างไร?',
    choices: [
      'มีความผิดตาม มาตรา 5 ฐานเข้าถึงระบบคอมพิวเตอร์โดยมิชอบ (จำคุกไม่เกิน 6 เดือน หรือปรับไม่เกิน 1 หมื่นบาท)',
      'ไม่ผิดกฎหมาย เพราะเครื่องคอมพิวเตอร์ตั้งอยู่ในห้องเรียนสาธารณะ ใครใช้งานก็ได้',
      'ผิดเฉพาะกฎระเบียบโรงเรียน ถูกทำทัณฑ์บน แต่ไม่มีผลทางกฎหมายอาญา',
      'มีความผิดเฉพาะกรณีขโมยอุปกรณ์กลับบ้านเท่านั้น',
    ],
    correctIdx: 0,
    lawArticle: 'พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ มาตรา 5',
    penalty: 'จำคุกไม่เกิน 6 เดือน หรือปรับไม่เกิน 10,000 บาท หรือทั้งจำทั้งปรับ',
    explanation: 'การเข้าถึงระบบคอมพิวเตอร์ที่มีมาตรการป้องกันการเข้าถึงโดยมิชอบ เป็นความผิดตามกฎหมาย แม้จะเป็นเครื่องคอมพิวเตอร์ของโรงเรียนก็ตาม',
  },
  {
    id: 2,
    badge: 'คดี #02: Cyberbullying',
    title: 'ตัดต่อภาพเพื่อนประจานลงในกลุ่มโซเชียล',
    scenario: 'นักเรียนกลุ่มหนึ่งนำภาพเพื่อนขณะเผลอหลับไปตัดต่อใส่ข้อความล้อเลียนหยาบคาย แล้วแชร์ลงในกลุ่มที่มีคนดูหลักพัน จนเพื่อนเกิดความอับอายและไม่กล้ามาเรียน',
    question: 'พฤติกรรมการกลั่นแกล้งบนเน็ต (Cyberbullying) ในกรณีนี้มีผลทางกฎหมายอย่างไร?',
    choices: [
      'เป็นการล้อเล่นกันในกลุ่มเพื่อน ไม่ถือเป็นความผิดทางอาญา',
      'ผิด พ.ร.บ.คอมพิวเตอร์ มาตรา 16 (ตัดต่อภาพทำให้ผู้อื่นเสียชื่อเสียง) และความผิดฐานหมิ่นประมาท',
      'ผิดเฉพาะกรณีที่มีการเรียกเก็บเงินจากเจ้าของภาพเท่านั้น',
      'ถ้าลบโพสต์ออกภายใน 24 ชั่วโมง จะพ้นผิดทันทีโดยอัตโนมัติ',
    ],
    correctIdx: 1,
    lawArticle: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 16 & กฎหมายอาญาฐานหมิ่นประมาท',
    penalty: 'จำคุกไม่เกิน 3 ปี และปรับไม่เกิน 200,000 บาท',
    explanation: 'การนำภาพตัดต่อ ดัดแปลง หรือภาพที่ทำให้ผู้อื่นเสียชื่อเสียง ถูกดูหมิ่น หรือได้รับความอับอาย เข้าสู่ระบบ มีโทษทั้งจำและปรับอย่างจริงจัง',
  },
  {
    id: 3,
    badge: 'คดี #03: Phishing Scam',
    title: 'SMS หลอกแจกไอเทมเกมฟรี 10,000 เพชร',
    scenario: 'ต้นได้รับข้อความ SMS แนบลิงก์ระบุว่า "ยินดีด้วย คุณได้รับสิทธิ์รับเพชรฟรีในเกม RoV 10,000 เพชร กดลิงก์เพื่อล็อกอินยืนยันตัวตนด่วนภายใน 1 ชั่วโมง"',
    question: 'หากกดลิงก์ดังกล่าวและกรอกรหัสผ่าน ต้นกำลังตกเป็นเหยื่อของการโจมตีรูปแบบใด?',
    choices: [
      'มัลแวร์เรียกค่าไถ่ (Ransomware)',
      'การโจมตีแบบฟิชชิ่ง (Phishing) หลอกขโมยบัญชีและรหัสผ่าน',
      'การแอบขุดเหรียญดิจิทัล (Crypto Mining)',
      'การสแปมข้อความธรรมดา ไม่มีความเสี่ยงใดๆ',
    ],
    correctIdx: 1,
    lawArticle: 'มาตรการความปลอดภัยไซเบอร์สากล & การหลอกลวงออนไลน์',
    penalty: 'คนร้ายมีความผิดฐานฉ้อโกงประชาชน และ พ.ร.บ.คอมฯ มาตรา 14',
    explanation: 'Phishing คือการสร้างหน้าเว็บปลอมที่เลียนแบบหน้าล็อกอินจริง เพื่อล่อลวงให้เหยื่อกรอก User/Password หรือข้อมูลส่วนตัว',
  },
  {
    id: 4,
    badge: 'คดี #04: Fake News',
    title: 'แชร์ข่าวปลอมน้ำประปาปนเปื้อนสารเคมี',
    scenario: 'มีการแชร์ข้อความลูกโซ่ใน LINE ว่า "น้ำประปาทั่วเมืองปนเปื้อนสารพิษ ห้ามดื่มเด็ดขาด" โดยไม่มีแหล่งอ้างอิงจากหน่วยงานรัฐ ส่งผลให้ประชาชนตื่นตระหนกแย่งซื้อน้ำดื่มจนหมดห้าง',
    question: 'การเผยแพร่หรือส่งต่อ (Share) ข้อมูลเท็จที่กระทบความมั่นคงหรือตื่นตระหนก มีความผิดตามมาตราใด?',
    choices: [
      'มาตรา 14 (2) หรือ (5) นำเข้าหรือส่งต่อข้อมูลคอมพิวเตอร์อันเป็นเท็จ ก่อให้เกิดความตื่นตระหนกแก่ประชาชน',
      'ไม่ผิด เพราะผู้แชร์มีเจตนาดีต้องการเตือนภัยเพื่อนร่วมชาติ',
      'ผิดเฉพาะคนที่เป็นผู้สร้างข้อความคนแรกเท่านั้น คนแชร์ต่อไม่ผิด',
      'ผิดเฉพาะกรณีที่มีการซื้อขายน้ำดื่มในราคาเกินจริง',
    ],
    correctIdx: 0,
    lawArticle: 'พ.ร.บ.คอมพิวเตอร์ มาตรา 14 วรรคสอง และวรรคห้า',
    penalty: 'จำคุกไม่เกิน 5 ปี หรือปรับไม่เกิน 100,000 บาท หรือทั้งจำทั้งปรับ (ทั้งผู้โพสต์และผู้แชร์)',
    explanation: 'กฎหมายระบุชัดเจนว่าผู้ที่เผยแพร่หรือส่งต่อข้อมูลเท็จที่ก่อให้เกิดความตื่นตระหนก โดยรู้อยู่แล้วว่าเป็นเท็จ มีโทษเท่ากับผู้สร้างข้อมูล',
  },
  {
    id: 5,
    badge: 'คดี #05: บัญชีอวตาร & PDPA',
    title: 'แอบนำรูปเพื่อนไปเปิดบัญชีปลอมหลอกยืมเงิน',
    scenario: 'นายเอกแคปรูปโปรไฟล์และชื่อของเพื่อนสนิท ไปสร้างบัญชี Facebook ปลอม แล้วทักแชตไปขอยืมเงินคนรู้จักของเพื่อน อ้างว่ากระเป๋าเงินหาย',
    question: 'การสวมรอยใช้ข้อมูลส่วนบุคคลของผู้อื่นเพื่อหลอกลวง ละเมิดกฎหมายข้อใดบ้าง?',
    choices: [
      'ละเมิด พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล (PDPA) และ พ.ร.บ.คอมพิวเตอร์ มาตรา 14 รวมถึงฉ้อโกงโดยแสดงตนเป็นคนอื่น',
      'ผิดเฉพาะกฎหมายลิขสิทธิ์ภาพถ่ายเท่านั้น',
      'ถ้ายังไม่มีคนโอนเงินให้ จะไม่ถือว่ามีความผิดทางกฎหมาย',
      'ไม่มีความผิด เพราะโซเชียลมีเดียเป็นพื้นที่เปิด ใครก็ใช้รูปใครก็ได้',
    ],
    correctIdx: 0,
    lawArticle: 'PDPA + พ.ร.บ.คอมพิวเตอร์ มาตรา 14 (1) + ประมวลกฎหมายอาญา มาตรา 342',
    penalty: 'โทษจำคุกสูงสุดถึง 5 ปี และปรับสูงสุดตามกฎหมาย',
    explanation: 'การสวมรอยใช้ตัวตนของผู้อื่นเพื่อทุจริตหลอกลวง เป็นความผิดอาญาร้ายแรง และละเมิดสิทธิข้อมูลส่วนบุคคล (PDPA) ชัดเจน',
  },
  {
    id: 6,
    badge: 'คดี #06: Ransomware',
    title: 'ไวรัสเรียกค่าไถ่ ล็อกไฟล์เอกสารสำคัญ',
    scenario: 'เจ้าหน้าที่การเงินโรงเรียนเปิดไฟล์แนบชื่อ "ใบเสนอราคา.exe" ที่ส่งมาจากอีเมลแปลกปลอม ทำให้ข้อมูลบัญชีและไฟล์งานทั้งหมดถูกเข้ารหัสลับ พร้อมมีข้อความเรียกเงิน 50,000 บาทเพื่อปลดล็อก',
    question: 'แนวทางป้องกันและรับมือกับมัลแวร์เรียกค่าไถ่ (Ransomware) ที่มีประสิทธิภาพสูงสุดคือข้อใด?',
    choices: [
      'รีบจ่ายเงินค่าไถ่ทันทีเพื่อให้ได้รหัสปลดล็อกอย่างแน่นอน',
      'สำรองข้อมูลสม่ำเสมอตามกฎ 3-2-1 (Backup ออฟไลน์) และไม่เปิดไฟล์แนบที่ไม่ทราบที่มา',
      'ปิดหน้าจอคอมพิวเตอร์ทิ้งไว้ 3 วัน ไวรัสจะสลายตัวไปเอง',
      'เปลี่ยนปลั๊กไฟและสายแลนใหม่เพื่อแก้ปัญหาไฟล์ล็อก',
    ],
    correctIdx: 1,
    lawArticle: 'หลักการความมั่นคงปลอดภัยสารสนเทศ (Data Backup & Security)',
    penalty: 'ผู้ปล่อยมัลแวร์ผิด พ.ร.บ.คอมฯ มาตรา 9, 10, 12 โทษจำคุกสูงสุดถึง 10 ปี',
    explanation: 'การจ่ายค่าไถ่ไม่การันตีว่าจะได้ไฟล์คืน การสำรองข้อมูลแยกเก็บแบบออฟไลน์ (Offline Backup) คือเกราะป้องกันที่ดีที่สุด',
  },
  {
    id: 7,
    badge: 'คดี #07: Password Security',
    title: 'รหัสผ่านหลุดง่าย เพราะใช้ 123456',
    scenario: 'นักเรียนใช้รหัสผ่านอีเมลเป็น "123456" และใช้รหัสนี้กับทุกเว็บไซต์ ส่งผลให้ผู้ไม่หวังดีสุ่มเดารหัสผ่านได้ภายในเวลาไม่ถึง 1 วินาที',
    question: 'หลักการตั้งรหัสผ่าน (Strong Password) ที่ปลอดภัยและได้มาตรฐานสากลคือข้อใด?',
    choices: [
      'ใช้เบอร์โทรศัพท์หรือวันเกิด เพราะจำง่ายและตัวเลขยาว',
      'ความยาวอย่างน้อย 8-12 ตัวอักษร ผสมตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ (@, #, $)',
      'ใช้ชื่อเล่นตนเองพิมพ์ซ้ำกัน 2 ครั้ง',
      'แชร์รหัสผ่านให้เพื่อนสนิทช่วยจำ เผื่อลืม',
    ],
    correctIdx: 1,
    lawArticle: 'มาตรฐานความปลอดภัยในการเข้าถึงข้อมูลสารสนเทศ',
    penalty: 'ป้องกันความเสียหายจากการถูกโจรกรรมข้อมูลส่วนบุคคล',
    explanation: 'รหัสผ่านที่ดีต้องมีความยาวและซับซ้อน ไม่ควรใช้วันเกิด เบอร์โทร หรือคำศัพท์ในพจนานุกรม และควรเปิดใช้งาน 2FA (การยืนยันตัวตน 2 ชั้น)',
  },
  {
    id: 8,
    badge: 'คดี #08: Netiquette',
    title: 'มารยาทการใช้อินเทอร์เน็ต 10 ประการ',
    scenario: 'ในห้องเรียนออนไลน์ มีนักเรียนคนหนึ่งเปิดไมค์เปิดเพลงเสียงดัง ก่อกวนครูขณะสอน และส่งสติกเกอร์รัวๆ ในช่องแชตจนเพื่อนอ่านบทเรียนไม่รู้เรื่อง',
    question: 'พฤติกรรมนี้ขัดต่อข้อใดใน "บัญญัติ 10 ประการของการใช้อินเทอร์เน็ต"?',
    choices: [
      'ต้องไม่ใช้คอมพิวเตอร์รบกวนการทำงานของผู้อื่น และต้องคำนึงถึงผลกระทบต่อสังคม',
      'ไม่ผิด เพราะทุกคนมีสิทธิเสรีภาพในการส่งสติกเกอร์เท่าเทียมกัน',
      'ผิดเฉพาะกรณีที่มีการพิมพ์คำหยาบคายเท่านั้น',
      'เป็นเรื่องปกติของการเรียนออนไลน์ ไม่จำเป็นต้องมีมารยาท',
    ],
    correctIdx: 0,
    lawArticle: 'จริยธรรมและมารยาทดิจิทัล (Computer Ethics 10 Commandments)',
    penalty: 'ละเมิดสิทธิการเรียนรู้ของผู้อื่น และถูกตัดสิทธิ์การใช้งานห้องเรียนออนไลน์',
    explanation: 'จริยธรรมการใช้คอมพิวเตอร์ข้อ 2 ระบุชัดเจนว่า "ต้องไม่รบกวนการทำงานของผู้อื่น" และต้องเคารพเวลา พื้นที่การเรียนรู้ร่วมกัน',
  },
  {
    id: 9,
    badge: 'คดี #09: Public Wi-Fi Risk',
    title: 'โอนเงินบน Free Wi-Fi ที่ไม่มีรหัสผ่าน',
    scenario: 'ส้มกำลังนั่งรอรถที่สถานีขนส่ง และต่อ Wi-Fi ฟรีที่ไม่มีรหัสผ่านชื่อ "Free-Station-WiFi" เพื่อเข้าไปทำธุรกรรมโอนเงินในแอปพลิเคชัน',
    question: 'ภัยคุกคามทางไซเบอร์ที่อาจเกิดขึ้นจากการใช้ Wi-Fi สาธารณะที่ไม่มีระบบความปลอดภัยคืออะไร?',
    choices: [
      'ไม่มีความเสี่ยง เพราะแอปทุกแอปป้องกันตัวเองได้ 100%',
      'การดักจับข้อมูลระหว่างทาง (Man-in-the-Middle Attack) จากเครือข่าย Wi-Fi ปลอมที่มิจฉาชีพสร้างขึ้น',
      'แบตเตอรี่โทรศัพท์จะหมดเร็วกว่าปกติ 10 เท่า',
      'หน้าจอโทรศัพท์จะแตกเองโดยอัตโนมัติ',
    ],
    correctIdx: 1,
    lawArticle: 'ความปลอดภัยการสื่อสารไร้สาย (Network Security)',
    penalty: 'มิจฉาชีพดักข้อมูลผิด พ.ร.บ.คอมฯ มาตรา 8 โทษจำคุกไม่เกิน 3 ปี',
    explanation: 'มิจฉาชีพมักตั้งชื่อ Wi-Fi เลียนแบบสถานที่จริงเพื่อดักจับข้อมูล (Sniffing) ผู้ใช้ไม่ควรทำธุรกรรมทางการเงินบน Wi-Fi สาธารณะที่ไม่ปลอดภัย',
  },
  {
    id: 10,
    badge: 'คดี #10: Spam Message',
    title: 'ส่งข้อความโฆษณารบกวนผู้รับ (สแปม)',
    scenario: 'บริษัทแห่งหนึ่งกว้านซื้อเบอร์โทรศัพท์และอีเมล แล้วส่งข้อความโฆษณาขายสินค้าส่งตรงเข้ามือถือประชาชนวันละหลายสิบข้อความ โดยที่ผู้รับไม่ได้ยินยอมและไม่มีช่องทางให้กดยกเลิก',
    question: 'การส่งข้อมูลคอมพิวเตอร์หรืออีเมลที่เป็นการรบกวนผู้รับโดยไม่มีทางปฏิเสธ มีความผิดตามมาตราใด?',
    choices: [
      'มีความผิดตาม มาตรา 11 ฐานส่งข้อมูลคอมพิวเตอร์รบกวน (Spam) ปรับไม่เกิน 200,000 บาท',
      'ไม่ผิด เพราะเป็นการค้าขายเสรีตามระบบเศรษฐกิจ',
      'ผิดเฉพาะกรณีที่สินค้าในโฆษณาชำรุดเสียหายเท่านั้น',
      'ผิดเฉพาะข้อความที่ส่งมาในเวลากลางคืนหลังเที่ยงคืน',
    ],
    correctIdx: 0,
    lawArticle: 'พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ มาตรา 11',
    penalty: 'โทษปรับไม่เกิน 200,000 บาท ต่อครั้งที่กระทำความผิด',
    explanation: 'การส่งข้อมูลคอมพิวเตอร์หรืออีเมลเพื่อประโยชน์ทางการค้า โดยไม่มีทางเลือกให้ผู้รับบอกเลิกหรือปฏิเสธ ถือเป็นสแปม (Spam) ที่มีโทษปรับตามกฎหมาย',
  },
];

export const CyberCopGame: React.FC = () => {
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [gameFinished, setGameFinished] = useState<boolean>(false);
  const [sheetModal, setSheetModal] = useState<boolean>(false);

  const currentCase = CASES[currentIdx];
  const recordGame = useGameProgress('cyber-cop', 'สายลับไอที พิทักษ์กฎหมาย (Cyber Cop & Law)');

  const handleSelectChoice = (choiceIdx: number) => {
    if (isAnswered) return;
    setSelectedChoice(choiceIdx);
    setIsAnswered(true);

    const isCorrect = choiceIdx === currentCase.correctIdx;
    if (isCorrect) {
      sfxCorrect();
      setScore((prev) => prev + 3);
    } else {
      sfxWrong();
    }
  };

  const handleNextCase = () => {
    if (currentIdx + 1 < CASES.length) {
      setCurrentIdx((prev) => prev + 1);
      setSelectedChoice(null);
      setIsAnswered(false);
    } else {
      // Finished all cases
      const finalScore = score + (selectedChoice === currentCase.correctIdx ? 0 : 0);
      sfxCoin();
      recordGame(finalScore);
      setGameFinished(true);
    }
  };

  const restartGame = () => {
    setCurrentIdx(0);
    setSelectedChoice(null);
    setIsAnswered(false);
    setScore(0);
    setGameFinished(false);
  };

  return (
    <div className="cyber-cop-container">
      {/* Header */}
      <div className="cc-header">
        <Link to="/games" className="cc-back-btn">
          <ChevronLeft size={18} />
          กลับคลังเกม
        </Link>
        <div className="cc-title-wrap">
          <h1 className="cc-title">🛡️ สายลับไอที พิทักษ์กฎหมาย (Cyber Cop &amp; Law)</h1>
          <p className="cc-subtitle">
            สืบสวน 10 คดีไซเบอร์ รู้ทันภัยคุกคาม กฎหมาย พ.ร.บ.คอมพิวเตอร์ และการป้องกันการบูลลี่
          </p>
        </div>
        <button className="cc-sheet-trigger" onClick={() => setSheetModal(true)}>
          <FileText size={15} />
          ดูสื่อใบงานครูคอม
        </button>
      </div>

      {/* HUD Bar */}
      <div className="cc-hud">
        <div className="cc-hud-card">
          <span className="cc-hud-label">แฟ้มคดีสืบสวน</span>
          <span className="cc-hud-val emerald">{currentIdx + 1} / {CASES.length}</span>
        </div>
        <div className="cc-hud-card">
          <span className="cc-hud-label">คะแนนสืบคดี</span>
          <span className="cc-hud-val gold">{score} / 30 คะแนน</span>
        </div>
        <div className="cc-hud-card">
          <span className="cc-hud-label">ระดับตำแหน่งสายลับ</span>
          <span className="cc-hud-val cyan">
            {score >= 24 ? '🥇 ผู้กำกับการไซเบอร์' : score >= 15 ? '🥈 นักสืบไซเบอร์' : '🥉 สายลับฝึกหัด'}
          </span>
        </div>
      </div>

      {/* Main Dossier Card */}
      {!gameFinished ? (
        <div className="cc-main-card">
          <div className="cc-dossier-tag">
            <Scale size={14} />
            {currentCase.badge}
          </div>
          <h2 className="cc-case-title">{currentCase.title}</h2>

          {/* Scenario Briefing */}
          <div className="cc-briefing-box">
            {currentCase.scenario}
          </div>

          {/* Question Prompt */}
          <div className="cc-question-prompt">
            ❓ {currentCase.question}
          </div>

          {/* Choices */}
          <div className="cc-choices-grid">
            {currentCase.choices.map((choice, idx) => {
              let btnClass = '';
              if (isAnswered) {
                if (idx === currentCase.correctIdx) {
                  btnClass = 'correct';
                } else if (idx === selectedChoice) {
                  btnClass = 'wrong';
                }
              }
              return (
                <button
                  key={idx}
                  className={`cc-choice-btn ${btnClass}`}
                  onClick={() => handleSelectChoice(idx)}
                  disabled={isAnswered}
                >
                  <span style={{ fontWeight: 700, minWidth: 20 }}>
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{choice}</span>
                </button>
              );
            })}
          </div>

          {/* Feedback & Law Advice Box (After answer) */}
          {isAnswered && (
            <div className={`cc-feedback-box ${selectedChoice !== currentCase.correctIdx ? 'is-wrong' : ''}`}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, marginBottom: 4, color: selectedChoice === currentCase.correctIdx ? '#10b981' : '#f43f5e' }}>
                {selectedChoice === currentCase.correctIdx ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <XCircle size={18} />
                )}
                <span>{selectedChoice === currentCase.correctIdx ? 'การวินิจฉัยถูกต้อง (+3 คะแนน)' : 'การวินิจฉัยยังไม่ถูกต้อง'}</span>
              </div>
              <div style={{ color: '#fbbf24', fontWeight: 600, fontSize: '0.82rem', marginBottom: 6 }}>
                ⚖️ ฐานความผิด: {currentCase.lawArticle}
              </div>
              <div style={{ color: '#f8fafc', marginBottom: 4 }}>
                <strong>📌 บทลงโทษ:</strong> {currentCase.penalty}
              </div>
              <div style={{ color: '#cbd5e1' }}>
                <strong>💡 คำอธิบายทางกฎหมาย:</strong> {currentCase.explanation}
              </div>

              <div style={{ marginTop: 14, textAlign: 'right' }}>
                <button className="cc-primary-btn" onClick={handleNextCase}>
                  <span>{currentIdx + 1 < CASES.length ? 'ไปยังคดีถัดไป' : 'สรุปผลการสืบสวน'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Summary & Badge Evaluation Card */
        <div className="cc-main-card" style={{ textAlign: 'center', maxWidth: 600 }}>
          <div style={{ fontSize: '3.8rem', marginBottom: 10 }}>🏆🕵️‍♂️</div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '4px 0', color: '#f8fafc' }}>
            สรุปภารกิจสายลับไอทีพิทักษ์กฎหมาย
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', marginBottom: 20 }}>
            คุณได้ทำการสืบสวนครบทั้ง 10 คดีสำคัญของ พ.ร.บ.คอมพิวเตอร์ และความปลอดภัยไซเบอร์
          </p>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-around',
              width: '100%',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 14,
              padding: '16px',
              marginBottom: 20,
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>คะแนนที่ทำได้</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>
                {score} / 30
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ความแม่นยำ</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399' }}>
                {Math.round((score / 30) * 100)}%
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>ตราประจำตัว</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
                {score >= 24 ? '🥇' : score >= 15 ? '🥈' : '🥉'}
              </div>
            </div>
          </div>

          <div
            style={{
              background: score >= 24 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(234, 179, 8, 0.15)',
              border: `1px solid ${score >= 24 ? '#10b981' : '#eab308'}`,
              borderRadius: 14,
              padding: '12px 18px',
              marginBottom: 24,
              color: score >= 24 ? '#6ee7b7' : '#fde047',
              fontSize: '0.92rem',
              fontWeight: 600,
            }}
          >
            {score >= 24
              ? '🌟 ยอดเยี่ยมมาก! คุณมีคุณสมบัติของ "ผู้กำกับการความมั่นคงดิจิทัล" รู้ลึกเรื่องกฎหมายและปกป้องสังคมออนไลน์ได้ดีเยี่ยม'
              : score >= 15
              ? '👍 ยอดเยี่ยม! มีความรู้ความเข้าใจเรื่อง พ.ร.บ.คอมพิวเตอร์และภัยไซเบอร์ในเกณฑ์ดีมาก'
              : '💪 ฝึกฝนเพิ่มเติม! ทบทวนข้อกฎหมายและสิทธิส่วนบุคคล แล้วมาประลองใหม่อีกครั้ง'}
          </div>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="cc-primary-btn" onClick={restartGame}>
              <RotateCcw size={18} />
              ทำภารกิจใหม่อีกครั้ง
            </button>
            <Link to="/games" className="cc-back-btn" style={{ padding: '12px 20px', borderRadius: 12 }}>
              <ChevronLeft size={18} />
              กลับคลังเกม
            </Link>
          </div>
        </div>
      )}

      {/* Kru-Com Sheet Resource References Modal */}
      {sheetModal && (
        <div className="cc-modal-overlay">
          <div className="cc-modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24' }}>
                📄 สื่อและบอร์ดเกมต้นฉบับ (Google Sheets ครูคอม)
              </h3>
              <button
                onClick={() => setSheetModal(false)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '8px 0 16px 0' }}>
              เกมนี้ดัดแปลงมาจากบอร์ดเกม พ.ร.บ.คอมพิวเตอร์ และบอร์ดเกม Cyberbullying ของครูคอม คุณครูสามารถกดลิงก์เพื่อเปิดดูหรือดาวน์โหลดไฟล์ PDF ต้นฉบับบน Google Drive ได้ทันที:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '16px 0', maxHeight: 280, overflowY: 'auto' }}>
              <a
                href="https://drive.google.com/file/d/1QZoWDDbYQa4K3uEnYTY-Gcbjopkdxb0B/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                <span>⚖️ [389] บอร์ดเกม พรบ.คอมพิวเตอร์.pdf</span>
                <ExternalLink size={16} color="#34d399" />
              </a>
              <a
                href="https://drive.google.com/file/d/1Kr6YGjpmNsu9KI3W5QBc4RfzBaaGO2W9/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                <span>🚫 [381] บอร์ดเกม CYBER BULLYING.pdf</span>
                <ExternalLink size={16} color="#34d399" />
              </a>
              <a
                href="https://drive.google.com/file/d/1TxpSEAnMJtqOtk6k2nHnp7D5hv12J10M/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                <span>🕵️‍♂️ [306] สายลับไอที…พิชิตภัยไซเบอร์.pdf</span>
                <ExternalLink size={16} color="#34d399" />
              </a>
              <a
                href="https://drive.google.com/file/d/1w21iZdLe_6AvNy46qomqsS_jWhB8Uekq/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                <span>📜 [345] มารยาทการใช้อินเทอร์เน็ต 10 ประการ.pdf</span>
                <ExternalLink size={16} color="#34d399" />
              </a>
              <a
                href="https://drive.google.com/file/d/1ufVrfGFWzcBqWR-RlcDvDR3lhvTDcP9E/view?usp=drivesdk"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 12,
                  textDecoration: 'none',
                  color: '#e2e8f0',
                  fontSize: '0.85rem',
                }}
              >
                <span>🛡️ [289] รู้ทันอาชญากรรมทางอินเทอร์เน็ต (Cybercrime).pdf</span>
                <ExternalLink size={16} color="#34d399" />
              </a>
            </div>

            <button
              className="cc-back-btn"
              onClick={() => setSheetModal(false)}
              style={{ width: '100%', padding: '10px', justifyContent: 'center' }}
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* Educational Knowledge Card */}
      <GameLearnCard gameKey="cyber-cop" />
    </div>
  );
};

export default CyberCopGame;
