import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  Play,
  Trophy,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { useGameTimers } from '../../hooks/useGameTimers';
import { sfxCorrect, sfxWrong } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './SituationReactionGame.css';

interface Choice {
  text: string;
  isCorrect: boolean;
}

interface Situation {
  id: string;
  category: 'ความปลอดภัย' | 'ข้อมูลส่วนตัว' | 'ภัยหลอกลวง' | 'มารยาทดิจิทัล' | 'ลิขสิทธิ์และ AI' | 'ความปลอดภัยในห้องเรียน';
  icon: string;
  scenario: string;
  choices: Choice[];
  explanation: string;
}

const SITUATIONS: Situation[] = [
  {
    id: 's1',
    category: 'ภัยหลอกลวง',
    icon: '🎮',
    scenario: 'เพื่อนในไลน์ส่งลิงก์มาว่า "แจกสกินปืน/เพชรฟรีในเกม ROV คลิกแล้วกรอกเบอร์มือถือและรหัส OTP ด่วน!"',
    choices: [
      { text: 'รีบกรอกเบอร์และ OTP ทันทีเพื่อเอาเพชรฟรี', isCorrect: false },
      { text: 'ไม่คลิกลิงก์ และทักถามเพื่อนผ่านช่องทางอื่นว่าโดนแฮกไลน์หรือไม่', isCorrect: true },
      { text: 'แชร์ลิงก์ต่อให้เพื่อนคนอื่นในห้องเรียน', isCorrect: false },
    ],
    explanation: 'รหัส OTP เปรียบเสมือนกุญแจยืนยันตัวตน หากกรอกให้คนอื่น บัญชีอาจถูกขโมยหรือถูกสมัครบริการเสียเงินทันที!',
  },
  {
    id: 's2',
    category: 'ข้อมูลส่วนตัว',
    icon: '🪪',
    scenario: 'มีบัญชี TikTok ทักมาอ้างว่าเป็นแอดมินโครงการแจกทุนการศึกษา ขอให้ถ่ายรูป "บัตรประชาชนหน้า-หลัง" ส่งให้ดู',
    choices: [
      { text: 'ปฏิเสธทันที และไม่ส่งข้อมูลบัตรประชาชนให้บุคคลที่ไม่น่าเชื่อถือ', isCorrect: true },
      { text: 'ส่งให้ทันทีเพราะอยากได้ทุนการศึกษา', isCorrect: false },
      { text: 'ถ่ายรูปส่งให้ แต่บอกแอดมินว่าห้ามเอาไปบอกใคร', isCorrect: false },
    ],
    explanation: 'เลขประจำตัวประชาชนและรหัสหลังบัตร (Laser Code) สามารถนำไปสวมรอยเปิดบัญชีม้าหรือทำธุรกรรมผิดกฎหมายได้',
  },
  {
    id: 's3',
    category: 'ความปลอดภัย',
    icon: '💻',
    scenario: 'หน้าจอคอมพิวเตอร์ในห้องเรียนขึ้นหน้าต่างเตือนสีแดงกะพริบว่า "เครื่องติดไวรัสร้ายแรง โทรหาเบอร์ 02-xxx ทันที"',
    choices: [
      { text: 'รีบหยิบโทรศัพท์โทรหาเบอร์บนหน้าจอ', isCorrect: false },
      { text: 'ปิดแท็บเบราว์เซอร์นั้นทันที และแจ้งครูผู้สอนให้ตรวจสอบ', isCorrect: true },
      { text: 'กดปุ่ม Download Antivirus ที่ปุ่มบนหน้าจอ', isCorrect: false },
    ],
    explanation: 'นี่คือมุกหลอกลวงประเภท Tech Support Scam ที่สร้างหน้าต่างปลอมเพื่อหลอกให้ผู้ใช้โทรไปเสียเงินหรือลงโปรแกรมดักจับข้อมูล',
  },
  {
    id: 's4',
    category: 'มารยาทดิจิทัล',
    icon: '📱',
    scenario: 'เพื่อนแอบแคปภาพหน้าจอแชทที่เพื่อนอีกคนระบายเรื่องครอบครัว แล้วจะเอามาโพสต์ลงในกลุ่มห้อง',
    choices: [
      { text: 'กดไลก์และช่วยพิมพ์คอมเมนต์หัวเราะ', isCorrect: false },
      { text: 'ตักเตือนเพื่อนว่าเป็นการละเมิดความเป็นส่วนตัว และไม่ควรกระทำ', isCorrect: true },
      { text: 'เซฟรูปเก็บไว้ส่งต่อให้กลุ่มเพื่อนสนิท', isCorrect: false },
    ],
    explanation: 'การนำบทสนทนาส่วนตัวมาเผยแพร่ในที่สาธารณะผิดทั้งมารยาทดิจิทัล และอาจเข้าข่ายละเมิด พ.ร.บ.คอมพิวเตอร์',
  },
  {
    id: 's5',
    category: 'ลิขสิทธิ์และ AI',
    icon: '🎨',
    scenario: 'นักเรียนต้องทำโปสเตอร์ประชาสัมพันธ์งานโรงเรียน และต้องการภาพการ์ตูนมาประกอบ',
    choices: [
      { text: 'ค้นภาพจาก Google แล้วแคปมาใช้โดยไม่สนลายน้ำหรือที่มา', isCorrect: false },
      { text: 'ใช้ภาพจากเว็บไซต์ภาพฟรี (Creative Commons / Unsplash) หรือวาดด้วยตนเอง', isCorrect: true },
      { text: 'ดาวน์โหลดภาพมีลายน้ำมาแล้วใช้โปรแกรมลบลายน้ำออก', isCorrect: false },
    ],
    explanation: 'การสร้างสรรค์ผลงานต้องเคารพสิทธิในทรัพย์สินทางปัญญา โดยเลือกใช้ทรัพยากรที่อนุญาตอย่างถูกต้อง (CC License)',
  },
  {
    id: 's6',
    category: 'ความปลอดภัยในห้องเรียน',
    icon: '🔌',
    scenario: 'ขณะเรียนวิชาคอมพิวเตอร์ เพื่อนทำขวดน้ำกระเด็นหกใส่ปลั๊กพ่วงที่พื้นใกล้เคียง มีประกายไฟเล็กน้อย',
    choices: [
      { text: 'รีบวิ่งไปแจ้งครูผู้สอนทันที และห้ามเพื่อนคนอื่นเข้าใกล้บริเวณนั้น', isCorrect: true },
      { text: 'เอากระดาษทิชชู่วิ่งเข้าไปเช็ดที่ตัวปลั๊กไฟทันที', isCorrect: false },
      { text: 'ใช้เท้าเตะปลั๊กไฟให้ออกห่างจากน้ำ', isCorrect: false },
    ],
    explanation: 'น้ำเป็นตัวนำกระแสไฟฟ้า การเข้าใกล้หรือสัมผัสอาจทำให้ถูกไฟฟ้าดูดถึงชีวิต ต้องแจ้งคุณครูเพื่อตัดกระแสไฟหลักก่อน',
  },
  {
    id: 's7',
    category: 'ภัยหลอกลวง',
    icon: '☎️',
    scenario: 'มีเบอร์โทรศัพท์โทรเข้ามาอ้างว่า "พัสดุตกค้างที่ศุลกากร พบสิ่งผิดกฎหมาย ให้โอนเงินตรวจสอบ"',
    choices: [
      { text: 'รีบโอนเงินไปบัญชีที่เขาแจ้งเพื่อให้เรื่องจบ', isCorrect: false },
      { text: 'วางสายทันที ไม่คุยต่อ เพราะเป็นรูปแบบของแก๊งคอลเซ็นเตอร์', isCorrect: true },
      { text: 'บอกชื่อ นามสกุล และเลขบัญชีธนาคารเพื่อขอตรวจสอบ', isCorrect: false },
    ],
    explanation: 'หน่วยงานราชการและบริษัทขนส่งจริงไม่มีนโยบายโทรแจ้งให้โอนเงินเข้าบัญชีส่วนบุคคลเพื่อตรวจสอบคดี',
  },
  {
    id: 's8',
    category: 'ความปลอดภัย',
    icon: '💾',
    scenario: 'เจอกล่อง Flash Drive ไม่ทราบเจ้าของวางตกอยู่หน้าห้องคอมพิวเตอร์',
    choices: [
      { text: 'เสียบเข้ากับเครื่องคอมพิวเตอร์ทันทีเพื่อเปิดดูไฟล์ข้างใน', isCorrect: false },
      { text: 'นำไปส่งให้ครูผู้ดูแลห้องคอมพิวเตอร์เพื่อตามหาเจ้าของอย่างปลอดภัย', isCorrect: true },
      { text: 'นำกลับไปเสียบใช้ที่บ้านทันทีเพราะได้ของฟรี', isCorrect: false },
    ],
    explanation: 'Flash Drive แปลกหน้าอาจมีมัลแวร์ประเภท BadUSB หรือไวรัสฝังอยู่ การเสียบเครื่องอาจทำให้ระบบโดนโจมตี',
  },
  {
    id: 's9',
    category: 'ข้อมูลส่วนตัว',
    icon: '🔑',
    scenario: 'เพื่อนสนิทขอยืมรหัสผ่านบัญชี Google เพื่อเข้าไปดูการบ้านที่ส่งใน Google Classroom',
    choices: [
      { text: 'ให้รหัสผ่านไปเพราะเป็นเพื่อนสนิทกัน', isCorrect: false },
      { text: 'ปฏิเสธไม่ให้รหัส แต่แชร์เป็นลิงก์งานหรือเปิดหน้าจอให้เพื่อนดูแทน', isCorrect: true },
      { text: 'เขียนรหัสผ่านใส่กระดาษโน้ตแปะไว้บนโต๊ะเพื่อน', isCorrect: false },
    ],
    explanation: 'รหัสผ่านเป็นเรื่องส่วนตัวเฉพาะบุคคล ไม่ควรแชร์ให้ผู้อื่นแม้จะเป็นเพื่อนสนิท เพื่อป้องกันความเสี่ยงและความเข้าใจผิด',
  },
  {
    id: 's10',
    category: 'ลิขสิทธิ์และ AI',
    icon: '🤖',
    scenario: 'ครูสั่งให้เขียนเรียงความเรื่อง "ความประทับใจในโรงเรียน" นักเรียนคิดว่าจะทำอย่างไร',
    choices: [
      { text: 'ให้ ChatGPT เขียนให้ทั้งหมด แล้วคัดลอกมาส่งครูโดยไม่อ่าน', isCorrect: false },
      { text: 'ใช้ AI ช่วยระดมความคิดและคำศัพท์ แล้วเรียบเรียงเล่าเรื่องราวจากความรู้สึกจริงของตนเอง', isCorrect: true },
      { text: 'ไปก๊อปเรียงความของรุ่นพี่ในอินเทอร์เน็ตมาส่ง', isCorrect: false },
    ],
    explanation: 'การใช้ AI อย่างสร้างสรรค์และมีจริยธรรมคือการใช้เป็นเครื่องมือช่วยสนับสนุนการเรียนรู้ ไม่ใช่การลอกเลียนแบบผลงาน',
  },
  {
    id: 's11',
    category: 'มารยาทดิจิทัล',
    icon: '📸',
    scenario: 'ไปเที่ยวกับเพื่อน แล้วถ่ายภาพติดใบหน้าคนอื่นที่เดินอยู่ด้านหลังอย่างชัดเจน กำลังจะโพสต์ลง Facebook',
    choices: [
      { text: 'ใส่สติกเกอร์หรือเบลอใบหน้าบุคคลอื่นก่อนโพสต์ เพื่อเคารพความเป็นส่วนตัว', isCorrect: true },
      { text: 'โพสต์ลงทันทีโดยไม่ต้องสนใจคนอื่น', isCorrect: false },
      { text: 'แท็กชื่อคนแปลกหน้าในรูปเพื่อเพิ่มยอดแชร์', isCorrect: false },
    ],
    explanation: 'การเบลอหน้าคนที่ไม่เกี่ยวข้องเป็นการเคารพสิทธิความเป็นส่วนตัวตามแนวทางของกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA)',
  },
  {
    id: 's12',
    category: 'ความปลอดภัย',
    icon: '📶',
    scenario: 'ไปร้านกาแฟแล้วเจอบริการ Wi-Fi ฟรีชื่อ "Free_Public_Wifi_NoPassword" กำลังจะล็อกอินเข้าบัญชีธนาคาร',
    choices: [
      { text: 'เชื่อมต่อ Wi-Fi ฟรีนั้นแล้วทำธุรกรรมโอนเงินทันที', isCorrect: false },
      { text: 'ปิด Wi-Fi แล้วเปลี่ยนไปใช้เน็ตมือถือ 4G/5G ของตนเองในการทำธุรกรรมสำคัญ', isCorrect: true },
      { text: 'แชร์ Wi-Fi นั้นต่อให้คนอื่นในร้านใช้งาน', isCorrect: false },
    ],
    explanation: 'Public Wi-Fi ที่ไม่มีรหัสผ่านอาจเป็น Rogue AP ที่ผู้ไม่หวังดีตั้งขึ้นเพื่อดักจับรหัสผ่านและข้อมูลธุรกรรม (Man-in-the-middle)',
  },
  {
    id: 's13',
    category: 'ภัยหลอกลวง',
    icon: '🛒',
    scenario: 'เห็นโฆษณาใน IG ขาย iPhone รุ่นใหม่ล่าสุด ราคาเพียง 1,500 บาท โดยให้โอนเงินมัดจำก่อน 500 บาททันที',
    choices: [
      { text: 'สินค้าลดราคามากเกินจริงอย่างผิดปกติ มักเป็นมิจฉาชีพ ไม่ควรหลงเชื่อโอนเงิน', isCorrect: true },
      { text: 'รีบโอนมัดจำทันทีก่อนสินค้าจะหมด', isCorrect: false },
      { text: 'ชวนเพื่อนอีก 5 คนมาหารเงินเพื่อซื้อเครื่องนี้', isCorrect: false },
    ],
    explanation: 'หากข้อเสนอดูดีเกินจริง (Too good to be true) เช่น สินค้าหลักหมื่นขายพันกว่าบาท มักเป็นกลลวงของมิจฉาชีพ',
  },
  {
    id: 's14',
    category: 'ความปลอดภัยในห้องเรียน',
    icon: '🖥️',
    scenario: 'เลิกเรียนคาบคอมพิวเตอร์แล้ว และเตรียมตัวจะกลับบ้าน',
    choices: [
      { text: 'กดปุ่มปิดสวิตช์ปลั๊กไฟเลยทันทีขณะเครื่องยังเปิดอยู่', isCorrect: false },
      { text: 'ล็อกเอาต์ออกจากบัญชีทั้งหมด สั่ง Shut Down เครื่อง และเก็บเก้าอี้ให้เรียบร้อย', isCorrect: true },
      { text: 'เปิดโปรแกรมทิ้งไว้ แล้วลุกเดินออกจากห้องทันที', isCorrect: false },
    ],
    explanation: 'การล็อกเอาต์ช่วยป้องกันคนมาใช้บัญชีของเราต่อ และการ Shut Down ช่วยรักษาฮาร์ดแวร์และประหยัดพลังงาน',
  },
  {
    id: 's15',
    category: 'มารยาทดิจิทัล',
    icon: '💬',
    scenario: 'เห็นเพื่อนในห้องกำลังถูกกลุ่มเพื่อนพิมพ์ล้อเลียนเรื่องรูปร่างในแชทกลุ่มจนเริ่มร้องไห้',
    choices: [
      { text: 'พิมพ์ผสมโรงแซวเพิ่มเพื่อความสนุกสนาน', isCorrect: false },
      { text: 'ส่งข้อความให้กำลังใจเพื่อน และช่วยแจ้งคุณครูประจำชั้นให้เข้ามาระงับเหตุ', isCorrect: true },
      { text: 'ส่งรูปภาพสติกเกอร์หัวเราะลงในกลุ่ม', isCorrect: false },
    ],
    explanation: 'Cyberbullying สร้างบาดแผลทางใจให้เพื่อน การเป็นผู้ฟังที่ดีและแจ้งผู้ใหญ่ที่ไว้ใจได้คือทางออกที่ถูกต้อง',
  },
  {
    id: 's16',
    category: 'ความปลอดภัย',
    icon: '🛡️',
    scenario: 'กำลังตั้งรหัสผ่านใหม่สำหรับอีเมลโรงเรียน',
    choices: [
      { text: 'ใช้ 12345678 เพราะจำง่ายและพิมพ์เร็ว', isCorrect: false },
      { text: 'ใช้ชื่อจริงและวันเดือนปีเกิดของตนเอง', isCorrect: false },
      { text: 'ผสมผสานตัวอักษรพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และสัญลักษณ์อย่างน้อย 8-12 ตัว', isCorrect: true },
    ],
    explanation: 'รหัสผ่านที่รัดกุม (Strong Password) ต้องมีความยาวและซับซ้อน ป้องกันการถูกคาดเดาหรือโจมตีด้วย Brute Force',
  },
  {
    id: 's17',
    category: 'ภัยหลอกลวง',
    icon: '✉️',
    scenario: 'ได้รับอีเมลแจ้งว่า "บัญชี Netflix ของคุณถูกระงับ คลิกที่นี่เพื่ออัปเดตเลขบัตรเครดิต" จากอีเมล netflix-support@gmail.com',
    choices: [
      { text: 'สังเกตชื่อผู้ส่งที่เป็น @gmail.com จึงรู้ว่าเป็นอีเมล Phishing ปลอมแน่นอน และไม่คลิกลิงก์', isCorrect: true },
      { text: 'รีบคลิกเพื่อกรอกเลขบัตรเครดิตของพ่อแม่', isCorrect: false },
      { text: 'ส่งรหัสผ่าน Netflix ตอบกลับไปทางอีเมลนั้น', isCorrect: false },
    ],
    explanation: 'บริษัทระดับโลกจะไม่ใช้ฟรีอีเมลสาธารณะ เช่น @gmail.com ในการส่งจดหมายแจ้งเตือนทางการเงิน',
  },
  {
    id: 's18',
    category: 'ลิขสิทธิ์และ AI',
    icon: '🎵',
    scenario: 'ต้องการนำเพลงของศิลปินชื่อดังมาใส่ในวิดีโอโครงงานที่ต้องเผยแพร่บน YouTube สาธารณะ',
    choices: [
      { text: 'เลือกใช้เพลงที่ไม่มีลิขสิทธิ์ (No Copyright Music) หรือเพลงจาก YouTube Audio Library', isCorrect: true },
      { text: 'เอาเพลงมาเร่งความเร็ว 1.25 เท่าเพื่อหลบระบบตรวจจับลิขสิทธิ์', isCorrect: false },
      { text: 'ใส่เพลงไปเลย แล้วเขียนใต้คลิปว่า "ไม่ได้มีเจตนาละเมิดลิขสิทธิ์"', isCorrect: false },
    ],
    explanation: 'การระบุว่าไม่มีเจตนาละเมิดลิขสิทธิ์ไม่ช่วยให้พ้นผิดทางกฎหมาย ควรใช้เพลงที่เปิดให้ใช้ฟรีอย่างถูกต้อง',
  },
  {
    id: 's19',
    category: 'ข้อมูลส่วนตัว',
    icon: '📍',
    scenario: 'กำลังจะเช็กอินและโพสต์ภาพตั๋วเครื่องบินพร้อมบาร์โค้ดลง Facebook ก่อนออกเดินทางท่องเที่ยว',
    choices: [
      { text: 'ไม่ควรโพสต์รูปตั๋วที่มี Barcode/QR code เพราะมิจฉาชีพสามารถสแกนดึงข้อมูลส่วนตัวได้', isCorrect: true },
      { text: 'โพสต์รูปเต็มใบเพื่ออวดเพื่อนๆ ว่าได้ไปเที่ยว', isCorrect: false },
      { text: 'แท็กบอกที่อยู่บ้านว่าตอนนี้ไม่มีคนอยู่บ้านแล้วนะ', isCorrect: false },
    ],
    explanation: 'บาร์โค้ดบน Boarding Pass มีข้อมูลการจอง เลขพาสปอร์ต และข้อมูลส่วนบุคคลที่อาจถูกนำไปใช้ในทางที่ผิดได้',
  },
  {
    id: 's20',
    category: 'ความปลอดภัยในห้องเรียน',
    icon: '⚡',
    scenario: 'สังเกตเห็นสายชาร์จโน้ตบุ๊กในห้องเรียนมีรอยฉีกขาดจนเห็นลวดทองแดงด้านใน',
    choices: [
      { text: 'หยุดใช้งานทันที ไม่เสียบปลั๊ก และแจ้งครูผู้ดูแลเพื่อทำการเปลี่ยนสายใหม่', isCorrect: true },
      { text: 'เอามือเปล่าจับหมุนลวดทองแดงให้เข้าที่แล้วเสียบใช้ต่อ', isCorrect: false },
      { text: 'เอาสกอตเทปใสธรรมดามาพันรอบๆ แล้วเสียบใช้ตามปกติ', isCorrect: false },
    ],
    explanation: 'สายไฟที่ฉนวนชำรุดเสี่ยงต่อการเกิดไฟฟ้าลัดวงจร ไฟฟ้าดูด หรือประกายไฟลุกไหม้ได้',
  },
];

const ROUND_QUESTIONS_COUNT = 8;
const QUESTION_DURATION = 4.0; // seconds

const SituationReactionGame: React.FC = () => {
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const timers = useGameTimers(gameState);
  const answerLock = useRef(false);
  const [questions, setQuestions] = useState<Situation[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_DURATION);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; text: string } | null>(null);
  const [reactionTimes, setReactionTimes] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  // Hook for saving progress
  const recordGame = useGameProgress('situation-reaction', 'Situational Reaction');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionStartTimeRef = useRef<number>(0);

  // Start / Restart round
  const startRound = useCallback(() => {
    timers.clear();
    answerLock.current = false;
    // Shuffle and pick 8 situations
    const shuffled = [...SITUATIONS].sort(() => Math.random() - 0.5).slice(0, ROUND_QUESTIONS_COUNT);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setScore(0);
    setLives(3);
    setCorrectCount(0);
    setReactionTimes([]);
    setSelectedChoice(null);
    setIsAnswered(false);
    setFeedback(null);
    setTimeLeft(QUESTION_DURATION);
    setGameState('playing');
    questionStartTimeRef.current = performance.now();
  }, [timers]);

  // Handle player choice selection
  const handleSelectChoice = useCallback((choiceIndex: number, timedOut = false) => {
    if (answerLock.current || isAnswered || gameState !== 'playing') return;
    answerLock.current = true;

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const currentQ = questions[currentIndex];
    const reactionTime = Math.min(4000, Math.round(performance.now() - questionStartTimeRef.current));
    setReactionTimes((prev) => [...prev, reactionTime]);

    setIsAnswered(true);
    setSelectedChoice(timedOut ? -1 : choiceIndex);

    const isCorrect = !timedOut && currentQ.choices[choiceIndex].isCorrect;

    if (isCorrect) {
      sfxCorrect();
      setCorrectCount((prev) => prev + 1);
      // Speed bonus: faster answer = higher score!
      const speedBonus = Math.max(50, Math.round((QUESTION_DURATION - reactionTime / 1000) * 80));
      const roundScore = 150 + speedBonus;
      setScore((prev) => prev + roundScore);

      setFeedback({
        isCorrect: true,
        text: `ยอดเยี่ยม! ตอบได้ปลอดภัยและรวดเร็ว (+${roundScore} แต้ม) • ${currentQ.explanation}`,
      });
    } else {
      sfxWrong();
      setLives(lives - 1);

      setFeedback({
        isCorrect: false,
        text: timedOut
          ? `หมดเวลาตัดสินใจ! ในสถานการณ์ฉุกเฉินความล่าช้าอาจนำมาซึ่งความเสียหาย • ${currentQ.explanation}`
          : `การตัดสินใจนี้ยังมีความเสี่ยง! • ${currentQ.explanation}`,
      });
    }

    // Advance to next question or end after brief reading period
    timers.schedule(() => {
      setFeedback(null);
      setSelectedChoice(null);
      setIsAnswered(false);

      if (lives - (isCorrect ? 0 : 1) <= 0 || currentIndex + 1 >= questions.length) {
        setGameState('gameover');
      } else {
        answerLock.current = false;
        setCurrentIndex(currentIndex + 1);
        setTimeLeft(QUESTION_DURATION);
        questionStartTimeRef.current = performance.now();
      }
    }, 2800);
  }, [currentIndex, gameState, isAnswered, questions, lives, timers]);

  // Timer countdown loop
  useEffect(() => {
    if (gameState !== 'playing' || isAnswered) return;

    const interval = 50; // 50ms ticks
    timerRef.current = setInterval(() => {
      const next = QUESTION_DURATION - (performance.now() - questionStartTimeRef.current) / 1000;
      setTimeLeft(Math.max(0, next));
      if (next <= 0) handleSelectChoice(-1, true);
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, isAnswered, currentIndex, handleSelectChoice]);

  // Record score when game finishes
  useEffect(() => {
    if (gameState === 'gameover' && score > 0) {
      void recordGame(score);
    }
  }, [gameState, score, recordGame]);

  const currentQ = questions[currentIndex];
  const avgReactionTime = reactionTimes.length > 0
    ? (reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length / 1000).toFixed(2)
    : '0.00';
  const accuracyPct = questions.length > 0
    ? Math.round((correctCount / questions.length) * 100)
    : 0;

  return (
    <div className="reaction-game-container">
      {/* Educational Learning Card */}
      <GameLearnCard gameKey="situation-reaction" />

      {/* Header */}
      <div className="sr-header">
        <Link to="/games" className="sr-back-btn">
          <ChevronLeft size={18} />
          <span>เกมทั้งหมด</span>
        </Link>
        <div className="sr-title-wrap">
          <h1 className="sr-title">⚡ Situational Reaction</h1>
          <p className="sr-subtitle">การตัดสินใจและไหวพริบความปลอดภัยดิจิทัล</p>
        </div>
        <div style={{ width: 80 }} />
      </div>

      {/* HUD Bar */}
      <div className="sr-hud">
        <div className="sr-hud-card">
          <span className="sr-hud-label">หัวใจ / สิทธิ์ผิด</span>
          <div className="sr-hud-val" style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                size={18}
                fill={i < lives ? '#ef4444' : 'none'}
                color={i < lives ? '#ef4444' : '#475569'}
              />
            ))}
          </div>
        </div>

        <div className="sr-hud-card">
          <span className="sr-hud-label">คะแนนรวม</span>
          <span className="sr-hud-val gold">{score.toLocaleString()}</span>
        </div>

        <div className="sr-hud-card">
          <span className="sr-hud-label">เวลาที่เหลือ</span>
          <span className="sr-hud-val green">{timeLeft.toFixed(1)}s</span>
        </div>

        <div className="sr-hud-card">
          <span className="sr-hud-label">ข้อที่</span>
          <span className="sr-hud-val cyan">
            {gameState === 'playing' ? `${currentIndex + 1} / ${questions.length}` : '-'}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="sr-card-wrapper">
        {/* Start Screen */}
        {gameState === 'idle' && (
          <div className="sr-center-screen">
            <div className="sr-big-icon">🎯</div>
            <h2 className="sr-screen-title green">ฝึกไหวพริบและสติในโลกดิจิทัล</h2>
            <p className="sr-screen-desc">
              เผชิญหน้ากับเหตุการณ์เสี่ยงภัยไซเบอร์จริง 8 ข้อ! คุณมีเวลาเพียง <strong>4 วินาที</strong> ต่อข้อ
              ในการวิเคราะห์และตัดสินใจเลือกวิธีรับมือที่ถูกต้อง ปลอดภัย และมีจริยธรรม
            </p>
            <button
              type="button"
              className="sr-btn-primary"
              onClick={startRound}
            >
              <Play size={20} fill="#fff" />
              <span>เริ่มทดสอบไหวพริบ</span>
            </button>
          </div>
        )}

        {/* In-Game Playing Screen */}
        {gameState === 'playing' && currentQ && (
          <>
            {/* Top Timer Bar */}
            <div className="sr-timer-wrapper">
              <div
                className="sr-timer-bar"
                style={{ width: `${(timeLeft / QUESTION_DURATION) * 100}%` }}
              />
            </div>

            {/* Meta tags */}
            <div className="sr-top-meta">
              <span className="sr-badge">
                <AlertTriangle size={14} />
                หมวด: {currentQ.category}
              </span>
              <span className="sr-round-count">
                สถานการณ์ที่ {currentIndex + 1} จาก {questions.length}
              </span>
            </div>

            {/* Situation Card */}
            <div className="sr-situation-box">
              <div className="sr-situation-icon">{currentQ.icon}</div>
              <h3 className="sr-situation-title">{currentQ.scenario}</h3>
            </div>

            {/* Choices */}
            <div className="sr-choices-grid">
              {currentQ.choices.map((choice, idx) => {
                const letters = ['ก', 'ข', 'ค'];
                let btnClass = 'sr-choice-btn';

                if (isAnswered) {
                  if (choice.isCorrect) {
                    btnClass += ' correct';
                  } else if (selectedChoice === idx) {
                    btnClass += ' wrong';
                  }
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    className={btnClass}
                    disabled={isAnswered}
                    onClick={() => handleSelectChoice(idx)}
                  >
                    <span className="sr-choice-letter">{letters[idx]}</span>
                    <span>{choice.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Feedback Explanation */}
            {feedback && (
              <div className={`sr-feedback-box ${feedback.isCorrect ? 'correct' : 'wrong'}`}>
                <strong>{feedback.isCorrect ? '✅ ถูกต้อง:' : '❌ ยังไม่ถูกต้อง:'}</strong>{' '}
                {feedback.text}
              </div>
            )}
          </>
        )}

        {/* Game Over / Assessment Summary */}
        {gameState === 'gameover' && (
          <div className="sr-center-screen">
            <div className="sr-big-icon">{lives > 0 ? '🏆' : '⚠️'}</div>
            <h2 className="sr-screen-title gold">
              {lives > 0 ? 'ประเมินผลผ่านเกณฑ์!' : 'สิ้นสุดการประเมิน'}
            </h2>
            <p className="sr-screen-desc">
              สรุปทักษะการตัดสินใจและปฏิกิริยาตอบสนองในสถานการณ์ดิจิทัล:
            </p>

            {/* K-P-A Assessment Grid */}
            <div className="sr-kpa-grid">
              <div className="sr-kpa-card">
                <div className="sr-kpa-label">K - ความถูกต้อง (Knowledge)</div>
                <div className="sr-kpa-val" style={{ color: '#10b981' }}>
                  {accuracyPct}% ({correctCount}/{questions.length})
                </div>
              </div>

              <div className="sr-kpa-card">
                <div className="sr-kpa-label">P - ความเร็วเฉลี่ย (Reflex Time)</div>
                <div className="sr-kpa-val" style={{ color: '#38bdf8' }}>
                  {avgReactionTime} วิ
                </div>
              </div>

              <div className="sr-kpa-card">
                <div className="sr-kpa-label">คะแนนรวมทั้งหมด</div>
                <div className="sr-kpa-val" style={{ color: '#fbbf24' }}>
                  {score.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="sr-btn-group">
              <button
                type="button"
                className="sr-btn-primary"
                onClick={startRound}
              >
                <RotateCcw size={18} />
                <span>ทดสอบใหม่อีกครั้ง</span>
              </button>
              <Link to="/games" className="sr-btn-secondary">
                <Trophy size={18} />
                <span>เลือกเกมอื่น</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SituationReactionGame;
