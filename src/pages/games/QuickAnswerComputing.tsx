import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft, Clock, Lightbulb, Pause, Play, RotateCcw, Trophy, Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useGameProgress } from '../../hooks/useGameProgress';
import './GameStyles.css';
import './QuickAnswerComputing.css';

type QuickQuestion = {
  question: string;
  answer: string;
  note: string;
};

type QuickLevel = {
  key: string;
  name: string;
  shortName: string;
  description: string;
  researchFocus: string;
  questions: QuickQuestion[];
};

type GamePhase = 'setup' | 'playing' | 'finished';

type QuickResult = {
  levelName: string;
  score: number;
  wrong: number;
  skipped: number;
  totalSeconds: number;
  usedSeconds: number;
  finishedAt: number;
  studentId?: string;
  studentName?: string;
  classroom?: string;
};

const TOTAL_QUESTIONS = 25;
const RESULT_KEY = 'krujames_quick_answer_computing_results_v1';

const quickLevels: QuickLevel[] = [
  {
    key: 'primary_lower',
    name: 'ประถมต้น (ป.1-ป.3)',
    shortName: 'ป.1-ป.3',
    description: 'อุปกรณ์คอมพิวเตอร์ การใช้เมาส์ แฟ้มข้อมูล คำสั่ง และความปลอดภัยพื้นฐาน',
    researchFocus: 'วัดความพร้อมด้านคำศัพท์คอมพิวเตอร์พื้นฐานและการคิดตามลำดับขั้นตอน',
    questions: [
      { question: 'อุปกรณ์ใดใช้เลื่อนตัวชี้บนหน้าจอและคลิกเลือกสิ่งต่าง ๆ?', answer: 'เมาส์', note: 'เมาส์ช่วยควบคุมตัวชี้บนจอ เช่น คลิก เลือก และลากวาง' },
      { question: 'อุปกรณ์ใดใช้พิมพ์ตัวอักษร ตัวเลข และสัญลักษณ์ลงคอมพิวเตอร์?', answer: 'แป้นพิมพ์', note: 'แป้นพิมพ์เป็นอุปกรณ์รับข้อมูลจากการกดปุ่ม' },
      { question: 'อุปกรณ์ใดแสดงภาพ ตัวอักษร วิดีโอ และเกมให้เราดู?', answer: 'จอภาพ', note: 'จอภาพเป็นอุปกรณ์แสดงผลที่ช่วยให้เห็นข้อมูลจากคอมพิวเตอร์' },
      { question: 'อุปกรณ์ใดใช้ฟังเสียงเพลง เสียงครู หรือเสียงจากวิดีโอ?', answer: 'ลำโพง', note: 'ลำโพงเป็นอุปกรณ์แสดงผลด้านเสียง' },
      { question: 'อุปกรณ์ใดใช้พิมพ์งานหรือรูปภาพออกมาเป็นกระดาษ?', answer: 'เครื่องพิมพ์', note: 'เครื่องพิมพ์ช่วยเปลี่ยนไฟล์ดิจิทัลให้เป็นเอกสารบนกระดาษ' },
      { question: 'การกดปุ่มเมาส์หนึ่งครั้งเพื่อเลือกปุ่มหรือรูปภาพเรียกว่าอะไร?', answer: 'คลิก', note: 'คลิกใช้เลือกคำสั่ง เปิดปุ่ม หรือเลือกสิ่งที่ต้องการ' },
      { question: 'การกดเมาส์ซ้ายติดกันเร็ว ๆ สองครั้งเพื่อเปิดไฟล์เรียกว่าอะไร?', answer: 'ดับเบิลคลิก', note: 'ดับเบิลคลิกมักใช้เปิดไฟล์หรือเปิดโปรแกรมจากไอคอน' },
      { question: 'การกดค้างแล้วเลื่อนสิ่งของบนจอไปวางตำแหน่งใหม่เรียกว่าอะไร?', answer: 'ลากวาง', note: 'ลากวางช่วยย้ายรูปภาพ ไฟล์ หรือบล็อกคำสั่งในเกมเขียนโปรแกรม' },
      { question: 'สิ่งใดควรเก็บเป็นความลับและไม่บอกเพื่อนเพื่อป้องกันบัญชีของเรา?', answer: 'รหัสผ่าน', note: 'รหัสผ่านเป็นกุญแจเข้าสู่บัญชี จึงควรตั้งให้เดายากและไม่บอกผู้อื่น' },
      { question: 'เครือข่ายขนาดใหญ่ที่ช่วยให้ค้นข้อมูล ดูวิดีโอ และติดต่อกันออนไลน์คืออะไร?', answer: 'อินเทอร์เน็ต', note: 'อินเทอร์เน็ตเชื่อมคอมพิวเตอร์และอุปกรณ์จำนวนมากทั่วโลก' },
      { question: 'รูปเล็ก ๆ บนหน้าจอที่แทนโปรแกรม ไฟล์ หรือคำสั่งเรียกว่าอะไร?', answer: 'ไอคอน', note: 'ไอคอนช่วยให้เราจำและเลือกโปรแกรมหรือคำสั่งได้ง่ายขึ้น' },
      { question: 'ที่เก็บไฟล์หลาย ๆ ไฟล์รวมกันให้เป็นหมวดหมู่เรียกว่าอะไร?', answer: 'โฟลเดอร์', note: 'โฟลเดอร์ช่วยจัดระเบียบงานให้หาไฟล์ได้ง่าย' },
      { question: 'งาน รูปภาพ เพลง หรือเอกสารที่บันทึกไว้ในคอมพิวเตอร์เรียกว่าอะไร?', answer: 'ไฟล์', note: 'ไฟล์คือข้อมูลที่บันทึกไว้ เช่น รูปภาพ เอกสาร หรือวิดีโอ' },
      { question: 'ก่อนเลิกใช้คอมพิวเตอร์ควรกดคำสั่งปิดเครื่องผ่านสิ่งใด?', answer: 'ปุ่มเปิดปิด', note: 'ควรปิดเครื่องให้ถูกวิธีเพื่อป้องกันข้อมูลเสียหาย' },
      { question: 'ที่เก็บไฟล์ที่ลบแล้วชั่วคราวในคอมพิวเตอร์มักเรียกว่าอะไร?', answer: 'ถังขยะ', note: 'ถังขยะช่วยเก็บไฟล์ที่ลบไว้ก่อน หากลบผิดอาจกู้คืนได้' },
      { question: 'ชุดคำสั่งที่ทำให้คอมพิวเตอร์ทำงาน เช่น วาดรูปหรือพิมพ์งาน คืออะไร?', answer: 'โปรแกรม', note: 'โปรแกรมทำหน้าที่บอกคอมพิวเตอร์ให้ทำงานตามที่ผู้ใช้ต้องการ' },
      { question: 'ข้อความ ตัวเลข รูปภาพ หรือเสียงที่คอมพิวเตอร์เก็บและนำไปใช้เรียกว่าอะไร?', answer: 'ข้อมูล', note: 'ข้อมูลเป็นสิ่งที่คอมพิวเตอร์รับ เก็บ ประมวลผล และแสดงผล' },
      { question: 'สิ่งที่เราสั่งให้คอมพิวเตอร์ทำ เช่น เปิด บันทึก หรือพิมพ์ เรียกว่าอะไร?', answer: 'คำสั่ง', note: 'คำสั่งต้องชัดเจน คอมพิวเตอร์จึงจะทำงานได้ถูกต้อง' },
      { question: 'การทำงานทีละข้อจากข้อแรกไปข้อสุดท้ายเรียกว่าอะไร?', answer: 'ลำดับขั้นตอน', note: 'ลำดับขั้นตอนช่วยให้ทำงานเป็นระบบและตรวจหาข้อผิดพลาดได้ง่าย' },
      { question: 'คำสั่งที่ทำซ้ำหลายครั้งโดยไม่ต้องเขียนซ้ำหลายบรรทัดเรียกว่าอะไร?', answer: 'วนซ้ำ', note: 'วนซ้ำช่วยลดงานซ้ำ ๆ เช่น เดินหน้า 4 ครั้งในเกมบล็อกคำสั่ง' },
      { question: 'ถ้าหุ่นยนต์ต้องเลี้ยวไปทางมือซ้าย คำตอบคือทิศใด?', answer: 'ซ้าย', note: 'การเข้าใจทิศทางช่วยเขียนคำสั่งควบคุมตัวละครและหุ่นยนต์' },
      { question: 'ถ้าหุ่นยนต์ต้องเลี้ยวไปทางมือขวา คำตอบคือทิศใด?', answer: 'ขวา', note: 'คำสั่งซ้ายและขวาเป็นพื้นฐานของการเขียนโปรแกรมแบบบล็อก' },
      { question: 'ลูกศรที่ชี้ไปด้านบนมักใช้แทนการเคลื่อนที่ไปทิศใด?', answer: 'ขึ้น', note: 'สัญลักษณ์ลูกศรช่วยสื่อสารคำสั่งให้เข้าใจง่าย' },
      { question: 'ลูกศรที่ชี้ไปด้านล่างมักใช้แทนการเคลื่อนที่ไปทิศใด?', answer: 'ลง', note: 'การใช้ทิศขึ้น ลง ซ้าย ขวา ช่วยฝึกคิดเชิงตำแหน่ง' },
      { question: 'เมื่อต้องใช้อินเทอร์เน็ต ควรคิดถึงเรื่องใดเพื่อไม่ให้เกิดอันตราย?', answer: 'ความปลอดภัย', note: 'ความปลอดภัยดิจิทัลเริ่มจากไม่บอกข้อมูลส่วนตัวและถามครูก่อนเปิดสิ่งแปลก ๆ' },
    ],
  },
  {
    key: 'primary_upper',
    name: 'ประถมปลาย (ป.4-ป.6)',
    shortName: 'ป.4-ป.6',
    description: 'อัลกอริทึม ผังงาน การค้นข้อมูล ลิขสิทธิ์ ข้อมูลตาราง และกระบวนการออกแบบ',
    researchFocus: 'วัดความเข้าใจแนวคิดวิทยาการคำนวณและการใช้เทคโนโลยีแก้ปัญหาอย่างเหมาะสม',
    questions: [
      { question: 'ขั้นตอนแก้ปัญหาที่เรียงเป็นลำดับชัดเจนและทำตามได้เรียกว่าอะไร?', answer: 'อัลกอริทึม', note: 'อัลกอริทึมคือวิธีคิดเป็นขั้นตอนเพื่อแก้ปัญหาให้สำเร็จ' },
      { question: 'ภาพแสดงลำดับการทำงานด้วยสัญลักษณ์ เช่น เริ่ม ตัดสินใจ และสิ้นสุด เรียกว่าอะไร?', answer: 'ผังงาน', note: 'ผังงานช่วยให้เห็นภาพรวมของขั้นตอนก่อนลงมือเขียนโปรแกรม' },
      { question: 'คำสั่งที่ให้คอมพิวเตอร์ทำงานซ้ำจนกว่าจะครบเงื่อนไขเรียกว่าอะไร?', answer: 'ลูป', note: 'ลูปช่วยให้โปรแกรมสั้นลงเมื่อมีงานที่ต้องทำซ้ำ' },
      { question: 'การให้โปรแกรมเลือกทำงานตามกรณี เช่น ถ้าฝนตกให้กางร่ม เรียกว่าอะไร?', answer: 'เงื่อนไข', note: 'เงื่อนไขช่วยให้โปรแกรมตัดสินใจได้ตามข้อมูลที่ได้รับ' },
      { question: 'ที่เก็บค่าชั่วคราวในโปรแกรม เช่น คะแนนหรือชื่อผู้เล่น เรียกว่าอะไร?', answer: 'ตัวแปร', note: 'ตัวแปรช่วยเก็บข้อมูลที่เปลี่ยนแปลงได้ระหว่างโปรแกรมทำงาน' },
      { question: 'ข้อมูลที่ผู้ใช้ป้อนเข้าสู่ระบบ เช่น พิมพ์ชื่อหรือกดปุ่ม เรียกว่าอะไร?', answer: 'ข้อมูลเข้า', note: 'ข้อมูลเข้าคือสิ่งที่ระบบรับมาเพื่อนำไปประมวลผล' },
      { question: 'ผลที่ระบบแสดงออกมา เช่น คะแนน คำตอบ หรือรูปภาพ เรียกว่าอะไร?', answer: 'ข้อมูลออก', note: 'ข้อมูลออกคือผลลัพธ์ที่ผู้ใช้ได้รับหลังจากระบบทำงาน' },
      { question: 'การค้นหาและแก้ข้อผิดพลาดในโปรแกรมเรียกว่าอะไร?', answer: 'การดีบัก', note: 'การดีบักช่วยให้โปรแกรมทำงานถูกต้องและเป็นนิสัยสำคัญของนักพัฒนา' },
      { question: 'โปรแกรมตารางคำนวณที่ใช้จัดข้อมูลเป็นแถวและคอลัมน์เรียกว่าอะไร?', answer: 'สเปรดชีต', note: 'สเปรดชีตช่วยคำนวณ สรุปคะแนน และสร้างกราฟจากข้อมูล' },
      { question: 'การจัดข้อมูลเป็นช่อง ๆ มีแถวและคอลัมน์เรียกว่าอะไร?', answer: 'ตาราง', note: 'ตารางทำให้เปรียบเทียบข้อมูลหลายรายการได้ง่าย' },
      { question: 'ภาพที่ใช้แสดงข้อมูล เช่น กราฟแท่งหรือกราฟวงกลม เรียกว่าอะไร?', answer: 'แผนภูมิ', note: 'แผนภูมิช่วยให้เห็นแนวโน้มและเปรียบเทียบข้อมูลได้เร็ว' },
      { question: 'การหาข้อมูลจากหนังสือ เว็บไซต์ หรือแหล่งอื่น ๆ เรียกว่าอะไร?', answer: 'การค้นหา', note: 'การค้นหาที่ดีต้องเลือกคำค้นเหมาะสมและตรวจสอบแหล่งข้อมูล' },
      { question: 'คำสำคัญที่ใช้พิมพ์เพื่อค้นหาข้อมูลในอินเทอร์เน็ตเรียกว่าอะไร?', answer: 'คีย์เวิร์ด', note: 'คีย์เวิร์ดควรสั้น ชัด และตรงประเด็นที่ต้องการค้นหา' },
      { question: 'ที่มาของข้อมูล เช่น เว็บไซต์ หนังสือ หรือผู้เชี่ยวชาญ เรียกว่าอะไร?', answer: 'แหล่งข้อมูล', note: 'แหล่งข้อมูลที่น่าเชื่อถือช่วยลดความผิดพลาดในการเรียนรู้' },
      { question: 'สิทธิของผู้สร้างผลงาน เช่น รูป เพลง หรือบทความ เรียกว่าอะไร?', answer: 'ลิขสิทธิ์', note: 'ควรเคารพลิขสิทธิ์ ไม่คัดลอกผลงานผู้อื่นโดยไม่อ้างอิง' },
      { question: 'การบอกที่มาของข้อมูลหรือรูปภาพที่นำมาใช้เรียกว่าอะไร?', answer: 'อ้างอิง', note: 'การอ้างอิงทำให้ผู้อ่านตรวจสอบที่มาได้และเป็นมารยาททางวิชาการ' },
      { question: 'ร่องรอยการใช้งานออนไลน์ เช่น การโพสต์ คอมเมนต์ หรือกดไลก์ เรียกว่าอะไร?', answer: 'รอยเท้าดิจิทัล', note: 'รอยเท้าดิจิทัลอาจคงอยู่ได้นาน จึงควรคิดก่อนโพสต์' },
      { question: 'ซอฟต์แวร์ที่สร้างความเสียหายหรือขโมยข้อมูลในเครื่องเรียกว่าอะไร?', answer: 'มัลแวร์', note: 'มัลแวร์อาจมากับลิงก์หรือไฟล์แปลก ๆ จึงต้องระวังก่อนคลิก' },
      { question: 'การหลอกให้กรอกข้อมูลส่วนตัวหรือรหัสผ่านผ่านลิงก์ปลอมเรียกว่าอะไร?', answer: 'ฟิชชิง', note: 'ฟิชชิงมักใช้ข้อความเร่งด่วนหรือลิงก์ปลอมเพื่อหลอกเอาข้อมูล' },
      { question: 'การเก็บสำเนาไฟล์ไว้ที่อื่นเพื่อป้องกันไฟล์หายเรียกว่าอะไร?', answer: 'สำรองข้อมูล', note: 'การสำรองข้อมูลช่วยกู้คืนงานเมื่อเครื่องเสียหรือเผลอลบไฟล์' },
      { question: 'อุปกรณ์ที่ตรวจจับสิ่งต่าง ๆ เช่น แสง อุณหภูมิ หรือการเคลื่อนไหว เรียกว่าอะไร?', answer: 'เซนเซอร์', note: 'เซนเซอร์ช่วยให้อุปกรณ์รับรู้สภาพแวดล้อมและตอบสนองอัตโนมัติ' },
      { question: 'แบบจำลองชิ้นงานที่ทำขึ้นเพื่อทดลองแนวคิดก่อนผลิตจริงเรียกว่าอะไร?', answer: 'ต้นแบบ', note: 'ต้นแบบช่วยให้เห็นปัญหาและปรับงานก่อนทำชิ้นงานจริง' },
      { question: 'ข้อกำหนดที่ใช้ตัดสินว่างานสำเร็จดีหรือยัง เรียกว่าอะไร?', answer: 'เกณฑ์ประเมิน', note: 'เกณฑ์ประเมินช่วยให้รู้ว่าชิ้นงานตอบโจทย์ปัญหามากน้อยเพียงใด' },
      { question: 'การลองใช้ชิ้นงานหรือโปรแกรมเพื่อตรวจว่าทำงานได้จริงหรือไม่เรียกว่าอะไร?', answer: 'ทดสอบ', note: 'การทดสอบช่วยพบข้อผิดพลาดก่อนนำไปใช้จริง' },
      { question: 'การแก้ไขชิ้นงานจากผลทดสอบให้ดีขึ้นเรียกว่าอะไร?', answer: 'ปรับปรุง', note: 'งานออกแบบที่ดีมักผ่านการปรับปรุงหลายรอบจากข้อมูลจริง' },
    ],
  },
  {
    key: 'secondary_lower',
    name: 'มัธยมต้น (ม.1-ม.3)',
    shortName: 'ม.1-ม.3',
    description: 'แนวคิดเชิงคำนวณ โปรแกรม ข้อมูล เครือข่าย ความปลอดภัยดิจิทัล และออกแบบเทคโนโลยี',
    researchFocus: 'วัดการจำแนกแนวคิดหลักของวิทยาการคำนวณและกระบวนการออกแบบเชิงวิศวกรรม',
    questions: [
      { question: 'การแบ่งปัญหาใหญ่ให้เป็นปัญหาย่อยที่จัดการง่ายขึ้นเรียกว่าอะไร?', answer: 'การแยกปัญหา', note: 'การแยกปัญหาช่วยให้วางแผนแก้ปัญหาทีละส่วนได้ชัดเจนขึ้น' },
      { question: 'การสังเกตสิ่งที่ซ้ำหรือคล้ายกันในข้อมูลหรือปัญหาเรียกว่าอะไร?', answer: 'การหารูปแบบ', note: 'การหารูปแบบช่วยสร้างวิธีแก้ปัญหาที่ใช้ซ้ำได้' },
      { question: 'การเลือกเฉพาะข้อมูลสำคัญและตัดรายละเอียดที่ไม่จำเป็นออกเรียกว่าอะไร?', answer: 'การคิดเชิงนามธรรม', note: 'การคิดเชิงนามธรรมทำให้ปัญหาซับซ้อนเข้าใจง่ายขึ้น' },
      { question: 'ข้อความอธิบายขั้นตอนโปรแกรมด้วยภาษาคนก่อนเขียนโค้ดจริงเรียกว่าอะไร?', answer: 'รหัสลำลอง', note: 'รหัสลำลองช่วยวางแผนตรรกะโดยยังไม่ต้องสนใจไวยากรณ์ภาษาโปรแกรม' },
      { question: 'ภาษาที่ใช้เขียนคำสั่งให้คอมพิวเตอร์ทำงานเรียกว่าอะไร?', answer: 'ภาษาโปรแกรม', note: 'ภาษาโปรแกรมมีหลายภาษา เช่น Python, JavaScript และ Scratch' },
      { question: 'ชุดคำสั่งย่อยที่เรียกใช้ซ้ำได้ในโปรแกรมเรียกว่าอะไร?', answer: 'ฟังก์ชัน', note: 'ฟังก์ชันช่วยลดโค้ดซ้ำและทำให้โปรแกรมเป็นระเบียบ' },
      { question: 'โครงสร้างข้อมูลที่เก็บค่าหลายค่าไว้ในชื่อเดียวและเรียงตามลำดับเรียกว่าอะไร?', answer: 'อาร์เรย์', note: 'อาร์เรย์เหมาะกับข้อมูลหลายรายการ เช่น คะแนนนักเรียนทั้งห้อง' },
      { question: 'ระบบตัวเลขที่ใช้เพียง 0 และ 1 เรียกว่าอะไร?', answer: 'ฐานสอง', note: 'คอมพิวเตอร์ใช้เลขฐานสองแทนสถานะปิดและเปิดของวงจรไฟฟ้า' },
      { question: 'หน่วยข้อมูลที่เล็กที่สุด มีค่าได้เป็น 0 หรือ 1 เรียกว่าอะไร?', answer: 'บิต', note: 'บิตเป็นพื้นฐานของการแทนข้อมูลในคอมพิวเตอร์' },
      { question: 'ข้อมูล 8 บิตรวมกันมักเรียกว่าอะไร?', answer: 'ไบต์', note: 'ไบต์ใช้บอกขนาดข้อมูล เช่น ไฟล์รูปภาพหรือเอกสาร' },
      { question: 'การเชื่อมต่ออุปกรณ์หลายเครื่องให้สื่อสารแลกเปลี่ยนข้อมูลกันเรียกว่าอะไร?', answer: 'เครือข่าย', note: 'เครือข่ายช่วยให้อุปกรณ์แชร์ข้อมูล เครื่องพิมพ์ หรืออินเทอร์เน็ตได้' },
      { question: 'เครื่องหรือระบบที่ให้บริการข้อมูลแก่เครื่องอื่นในเครือข่ายเรียกว่าอะไร?', answer: 'เซิร์ฟเวอร์', note: 'เซิร์ฟเวอร์ให้บริการเว็บ ไฟล์ ฐานข้อมูล หรือระบบล็อกอิน' },
      { question: 'เครื่องของผู้ใช้ที่ร้องขอบริการจากเซิร์ฟเวอร์เรียกว่าอะไร?', answer: 'ไคลเอนต์', note: 'โทรศัพท์หรือคอมพิวเตอร์ของนักเรียนอาจเป็นไคลเอนต์เมื่อเปิดเว็บไซต์' },
      { question: 'ระบบจัดเก็บข้อมูลอย่างเป็นระเบียบเพื่อค้นหา เพิ่ม แก้ไข และลบได้เรียกว่าอะไร?', answer: 'ฐานข้อมูล', note: 'ฐานข้อมูลใช้เก็บข้อมูลนักเรียน คะแนน และประวัติการเรียน' },
      { question: 'การจัดโครงสร้างข้อมูลว่ามีฟิลด์ใดและสัมพันธ์กันอย่างไรเรียกว่าอะไร?', answer: 'แบบจำลองข้อมูล', note: 'แบบจำลองข้อมูลช่วยออกแบบฐานข้อมูลให้เก็บข้อมูลได้ถูกต้อง' },
      { question: 'เทคโนโลยีที่ทำให้เครื่องเรียนรู้จากข้อมูลและช่วยตัดสินใจบางอย่างได้เรียกว่าอะไร?', answer: 'ปัญญาประดิษฐ์', note: 'ปัญญาประดิษฐ์ควรใช้อย่างมีวิจารณญาณและตรวจสอบผลลัพธ์เสมอ' },
      { question: 'การแปลงข้อมูลให้อ่านไม่ออกหากไม่มีรหัสหรือกุญแจที่ถูกต้องเรียกว่าอะไร?', answer: 'การเข้ารหัส', note: 'การเข้ารหัสช่วยป้องกันข้อมูลสำคัญระหว่างส่งผ่านเครือข่าย' },
      { question: 'สิทธิในการควบคุมข้อมูลส่วนตัวและการเปิดเผยข้อมูลของตนเองเรียกว่าอะไร?', answer: 'สิทธิส่วนบุคคล', note: 'ควรเก็บข้อมูลส่วนตัวเท่าที่จำเป็นและใช้ตามวัตถุประสงค์ที่ชัดเจน' },
      { question: 'ขั้นตอนการสร้างแนวทางแก้ปัญหา ทดสอบ และปรับปรุงชิ้นงานเรียกว่าอะไร?', answer: 'กระบวนการออกแบบ', note: 'กระบวนการออกแบบช่วยแก้ปัญหาอย่างเป็นระบบและใช้ข้อมูลจริงประกอบ' },
      { question: 'ขั้นแรกที่ต้องทำให้ชัดก่อนออกแบบชิ้นงานหรือระบบคืออะไร?', answer: 'ระบุปัญหา', note: 'การระบุปัญหาที่ชัดทำให้เลือกวิธีแก้ได้ตรงจุด' },
      { question: 'การหาข้อมูลจากผู้ใช้ เอกสาร หรือสถานการณ์จริงก่อนออกแบบเรียกว่าอะไร?', answer: 'รวบรวมข้อมูล', note: 'ข้อมูลที่ดีช่วยให้การออกแบบตอบโจทย์ผู้ใช้มากขึ้น' },
      { question: 'การคิดวิธีแก้ปัญหามากกว่าหนึ่งแบบก่อนเลือกวิธีที่เหมาะสมเรียกว่าอะไร?', answer: 'แนวคิดหลายทาง', note: 'การมีหลายแนวคิดช่วยเปรียบเทียบข้อดีข้อจำกัดก่อนลงมือสร้าง' },
      { question: 'แบบจำลองหรือชิ้นงานทดลองที่ใช้สื่อสารแนวคิดก่อนสร้างจริงเรียกว่าอะไร?', answer: 'ต้นแบบ', note: 'ต้นแบบทำให้ผู้ใช้เห็นภาพ ทดลองใช้ และให้ข้อเสนอแนะได้เร็ว' },
      { question: 'การให้ผู้ใช้จริงลองใช้ต้นแบบเพื่อดูว่ายังติดปัญหาใดเรียกว่าอะไร?', answer: 'ทดสอบผู้ใช้', note: 'การทดสอบผู้ใช้ช่วยพบปัญหาที่ผู้ออกแบบอาจมองไม่เห็น' },
      { question: 'การแก้ไขงานจากผลทดสอบ ข้อเสนอแนะ และข้อจำกัดจริงเรียกว่าอะไร?', answer: 'ปรับปรุงชิ้นงาน', note: 'การปรับปรุงชิ้นงานทำให้เทคโนโลยีตอบโจทย์และใช้งานได้ดีขึ้น' },
    ],
  },
];

const shuffle = <T,>(items: T[]): T[] => {
  const output = [...items];
  for (let i = output.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [output[i], output[j]] = [output[j], output[i]];
  }
  return output;
};

const formatTime = (seconds: number) => {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
};

const saveResult = (result: QuickResult) => {
  try {
    const raw = localStorage.getItem(RESULT_KEY);
    const list = raw ? JSON.parse(raw) as QuickResult[] : [];
    localStorage.setItem(RESULT_KEY, JSON.stringify([result, ...list].slice(0, 80)));
  } catch {
    // ignore localStorage write errors
  }
};

const QuickAnswerComputing: React.FC = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<GamePhase>('setup');
  const [levelKey, setLevelKey] = useState(quickLevels[0].key);
  const [minutes, setMinutes] = useState(5);
  const [seconds, setSeconds] = useState(0);
  const [shuffleQuestions, setShuffleQuestions] = useState(true);
  const [showFacts, setShowFacts] = useState(true);
  const [questions, setQuestions] = useState<QuickQuestion[]>([]);
  const [answerBoard, setAnswerBoard] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [remaining, setRemaining] = useState(300);
  const [totalSeconds, setTotalSeconds] = useState(300);
  const [paused, setPaused] = useState(false);
  const [usedAnswers, setUsedAnswers] = useState<string[]>([]);
  const [wrongAnswer, setWrongAnswer] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [fact, setFact] = useState('');
  const [result, setResult] = useState<QuickResult | null>(null);
  const recordGame = useGameProgress('quick-answer', 'เกมตอบไวคอมพิวเตอร์');

  const selectedLevel = useMemo(
    () => quickLevels.find((level) => level.key === levelKey) || quickLevels[0],
    [levelKey],
  );

  const currentQuestion = questions[currentIndex];
  const progressPct = Math.round((score / TOTAL_QUESTIONS) * 100);

  const buildResult = React.useCallback((finalScore: number, usedSeconds = totalSeconds - remaining): QuickResult => ({
    levelName: selectedLevel.name,
    score: finalScore,
    wrong,
    skipped,
    totalSeconds,
    usedSeconds,
    finishedAt: Date.now(),
    studentId: user?.id,
    studentName: user?.name,
    classroom: user?.classroom,
  }), [remaining, selectedLevel.name, skipped, totalSeconds, user?.classroom, user?.id, user?.name, wrong]);

  React.useEffect(() => {
    if (phase !== 'playing' || paused) return undefined;
    const timer = window.setInterval(() => {
      setRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          const finalResult = buildResult(score, totalSeconds);
           setResult(finalResult);
           saveResult(finalResult);
           setPhase('finished');
           if (score > 0) void recordGame(score);
           return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [buildResult, paused, phase, recordGame, score, totalSeconds]);

  const startGame = () => {
    const duration = Math.max(1, minutes * 60 + Math.min(59, seconds));
    const nextQuestions = shuffleQuestions ? shuffle(selectedLevel.questions) : [...selectedLevel.questions];
    setQuestions(nextQuestions);
    setAnswerBoard(shuffle(selectedLevel.questions.map((item) => item.answer)));
    setCurrentIndex(0);
    setScore(0);
    setWrong(0);
    setSkipped(0);
    setRemaining(duration);
    setTotalSeconds(duration);
    setPaused(false);
    setUsedAnswers([]);
    setWrongAnswer(null);
    setFeedback('');
    setFact('');
    setResult(null);
    setPhase('playing');
  };

  const finishWithScore = (finalScore: number) => {
    const finalResult = buildResult(finalScore);
    setResult(finalResult);
    saveResult(finalResult);
    setPhase('finished');
    setPaused(false);
    if (finalScore > 0) void recordGame(finalScore);
  };

  const answer = (choice: string) => {
    if (phase !== 'playing' || paused || !currentQuestion || usedAnswers.includes(choice)) return;
    if (choice === currentQuestion.answer) {
      const nextScore = score + 1;
      setScore(nextScore);
      setUsedAnswers((current) => [...current, choice]);
      setFeedback('+1 ถูกต้อง');
      if (showFacts) setFact(currentQuestion.note);
      if (nextScore >= TOTAL_QUESTIONS) {
        window.setTimeout(() => finishWithScore(nextScore), 420);
      } else {
        window.setTimeout(() => {
          setCurrentIndex((current) => current + 1);
          setFeedback('');
        }, 420);
      }
      return;
    }

    setWrong((current) => current + 1);
    setWrongAnswer(choice);
    setFeedback('ยังไม่ถูก ลองเลือกใหม่');
    window.setTimeout(() => setWrongAnswer(null), 360);
  };

  const skipQuestion = () => {
    if (phase !== 'playing' || paused || questions.length - currentIndex <= 1) return;
    setQuestions((current) => {
      const next = [...current];
      const [skippedQuestion] = next.splice(currentIndex, 1);
      next.push(skippedQuestion);
      return next;
    });
    setSkipped((current) => current + 1);
    setFeedback('ข้ามแล้ว คำถามจะวนกลับมาด้านท้าย');
  };

  const setPresetTime = (duration: number) => {
    setMinutes(Math.floor(duration / 60));
    setSeconds(duration % 60);
  };

  return (
    <div className="game-page quick-answer-page">
      <div className="game-topbar">
        <Link to="/games" className="game-back"><ChevronLeft size={18} /> เกมทั้งหมด</Link>
        <h2><Zap size={24} /> เกมตอบไวคอมพิวเตอร์</h2>
      </div>

      <div className="quick-research-strip">
        <Lightbulb size={18} />
        <span>ใช้เป็นกิจกรรมทบทวนเร็ว เก็บหลักฐานคะแนน 25 ข้อ เวลา และจำนวนตอบผิด เพื่อวิเคราะห์ก่อน-หลังเรียนได้</span>
      </div>

      {phase === 'setup' && (
        <section className="quick-setup-panel">
          <div>
            <span className="quick-kicker">Computing Quick Answer</span>
            <h1>ตอบคำถามให้ตรงกับคำตอบบนกระดาน</h1>
            <p>เลือกคำตอบจาก 25 ช่อง ตอบถูกได้ 1 คะแนน ตอบผิดไม่หักคะแนน และข้ามคำถามได้</p>
          </div>

          <div className="quick-form-grid">
            <label>
              ระดับชั้น
              <select value={levelKey} onChange={(e) => setLevelKey(e.target.value)}>
                {quickLevels.map((level) => (
                  <option key={level.key} value={level.key}>{level.name}</option>
                ))}
              </select>
            </label>
            <div className="quick-level-detail">
              <strong>{selectedLevel.description}</strong>
              <span>{selectedLevel.researchFocus}</span>
            </div>
          </div>

          <div className="quick-time-row">
            {[180, 300, 600].map((duration) => (
              <button
                key={duration}
                className={minutes * 60 + seconds === duration ? 'active' : ''}
                type="button"
                onClick={() => setPresetTime(duration)}
              >
                {duration / 60} นาที
              </button>
            ))}
          </div>

          <div className="quick-custom-time">
            <label>
              นาที
              <input
                type="number"
                min={0}
                max={60}
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <label>
              วินาที
              <input
                type="number"
                min={0}
                max={59}
                value={seconds}
                onChange={(e) => setSeconds(Math.min(59, Math.max(0, Number(e.target.value) || 0)))}
              />
            </label>
          </div>

          <div className="quick-options">
            <label><input type="checkbox" checked={shuffleQuestions} onChange={(e) => setShuffleQuestions(e.target.checked)} /> สุ่มคำถาม</label>
            <label><input type="checkbox" checked={showFacts} onChange={(e) => setShowFacts(e.target.checked)} /> แสดงเกร็ดความรู้</label>
          </div>

          <button className="btn-game-start" type="button" onClick={startGame}>
            <Play size={20} /> เริ่มเกม
          </button>
        </section>
      )}

      {(phase === 'playing' || phase === 'finished') && (
        <>
          <div className="quick-scorebar">
            <div className="quick-score-pill"><Trophy size={18} /> คะแนน <strong>{score}/{TOTAL_QUESTIONS}</strong></div>
            <div className={`quick-score-pill ${remaining <= 30 && phase === 'playing' ? 'danger' : ''}`}><Clock size={18} /> เวลา <strong>{formatTime(remaining)}</strong></div>
            <div className="quick-score-pill">ผิด <strong>{wrong}</strong></div>
            <div className="quick-score-pill">ข้าม <strong>{skipped}</strong></div>
            <button className="quick-icon-btn" type="button" onClick={() => setPaused((current) => !current)}>
              {paused ? <Play size={16} /> : <Pause size={16} />}
              {paused ? 'เล่นต่อ' : 'พัก'}
            </button>
            <button className="quick-icon-btn" type="button" onClick={() => setPhase('setup')}>
              <RotateCcw size={16} /> ตั้งค่าใหม่
            </button>
          </div>

          <div className="quick-progress-track">
            <div style={{ width: `${progressPct}%` }} />
          </div>

          <section className="quick-board-shell">
            <div className="quick-answer-grid" aria-label="กระดานคำตอบเกมตอบไว">
              {answerBoard.map((choice) => {
                const used = usedAnswers.includes(choice);
                const isWrong = wrongAnswer === choice;
                return (
                  <button
                    key={choice}
                    type="button"
                    disabled={used || phase !== 'playing' || paused}
                    className={`quick-answer-card ${used ? 'used' : ''} ${isWrong ? 'wrong' : ''}`}
                    onClick={() => answer(choice)}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>

            <div className="quick-question-panel">
              <div className="quick-q-number">{Math.min(score + 1, TOTAL_QUESTIONS)}</div>
              <div>
                <span>{selectedLevel.shortName}</span>
                <h3>{currentQuestion ? currentQuestion.question : 'ตอบครบแล้ว'}</h3>
                {feedback && <p className={feedback.startsWith('+') ? 'good' : ''}>{feedback}</p>}
              </div>
              <button type="button" onClick={skipQuestion} disabled={phase !== 'playing' || paused}>ข้าม</button>
            </div>
          </section>

          {paused && phase === 'playing' && (
            <div className="quick-pause-banner">หยุดชั่วคราว กด “เล่นต่อ” เพื่อทำเกมต่อ</div>
          )}

          {fact && showFacts && phase === 'playing' && (
            <div className="quick-fact"><Lightbulb size={16} /> {fact}</div>
          )}
        </>
      )}

      {phase === 'finished' && result && (
        <section className="quick-result-panel">
          <h2>{result.score >= 20 ? 'ยอดเยี่ยมมาก' : result.score >= 15 ? 'ทำได้ดีแล้ว' : 'ลองทบทวนอีกครั้ง'}</h2>
          <div className="quick-result-score">{result.score}<span>/{TOTAL_QUESTIONS}</span></div>
          <div className="quick-result-grid">
            <div><span>ระดับ</span><strong>{result.levelName}</strong></div>
            <div><span>ตอบผิด</span><strong>{result.wrong}</strong></div>
            <div><span>ข้าม</span><strong>{result.skipped}</strong></div>
            <div><span>เวลาใช้</span><strong>{formatTime(result.usedSeconds)}</strong></div>
          </div>
          <div className="quick-result-actions">
            <button type="button" className="btn-game-start" onClick={startGame}><RotateCcw size={18} /> เล่นอีกครั้ง</button>
            <button type="button" className="quick-icon-btn" onClick={() => setPhase('setup')}>เปลี่ยนระดับ/เวลา</button>
          </div>
        </section>
      )}
    </div>
  );
};

export default QuickAnswerComputing;
