import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  RotateCcw,
  Play,
  Trophy,
  Heart,
  Zap,
  Shield,
  Volume2,
  VolumeX,
  Flame,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Award,
} from 'lucide-react';
import { useGameProgress } from '../../hooks/useGameProgress';
import { sfxCorrect, sfxWrong, sfxCoin } from '../../utils/gameSounds';
import GameLearnCard from '../../components/GameLearnCard';
import './GameStyles.css';
import './CyberRacerGame.css';

export interface QuizQuestion {
  id: string;
  question: string;
  choices: [string, string, string]; // [Lane 0, Lane 1, Lane 2]
  correctIndex: 0 | 1 | 2;
  explanation: string;
}

export type GradeLevel = 'lower' | 'upper' | 'middle';

export const QUESTIONS_BY_LEVEL: Record<GradeLevel, QuizQuestion[]> = {
  lower: [
    {
      id: 'l1',
      question: 'อุปกรณ์ใดใช้สำหรับคลิกเลือกคำสั่งบนหน้าจอ?',
      choices: ['คีย์บอร์ด', 'เมาส์', 'จอภาพ'],
      correctIndex: 1,
      explanation: 'เมาส์ใช้เลื่อนตัวชี้และคลิกเลือกสิ่งต่าง ๆ บนหน้าจอ',
    },
    {
      id: 'l2',
      question: 'อุปกรณ์ใดใช้สำหรับพิมพ์ตัวอักษรและตัวเลข?',
      choices: ['แป้นพิมพ์ (คีย์บอร์ด)', 'ลำโพง', 'เคส'],
      correctIndex: 0,
      explanation: 'แป้นพิมพ์ใช้ป้อนข้อมูลตัวอักษรและตัวเลขเข้าสู่คอมพิวเตอร์',
    },
    {
      id: 'l3',
      question: 'อุปกรณ์ใดใช้แสดงภาพและผลลัพธ์ให้เรามองเห็น?',
      choices: ['เมาส์', 'สแกนเนอร์', 'จอภาพ (Monitor)'],
      correctIndex: 2,
      explanation: 'จอภาพทำหน้าที่แสดงผลภาพ ตัวหนังสือ และวิดีโอ',
    },
    {
      id: 'l4',
      question: 'อุปกรณ์ใดใช้ส่งเสียงเพลงและเสียงเอฟเฟกต์ออกมา?',
      choices: ['ลำโพง', 'ไมโครโฟน', 'เว็บแคม'],
      correctIndex: 0,
      explanation: 'ลำโพงเป็นอุปกรณ์ส่งออกข้อมูลเสียง',
    },
    {
      id: 'l5',
      question: 'ขั้นตอนแรกในการแปรงฟันอย่างถูกต้องคือข้อใด?',
      choices: ['บ้วนปากด้วยน้ำสะอาด', 'บีบยาสีฟันลงบนแปรง', 'เช็ดปากให้แห้ง'],
      correctIndex: 1,
      explanation: 'ต้องบีบยาสีฟันลงบนแปรงก่อนจึงจะเริ่มแปรงฟันได้',
    },
    {
      id: 'l6',
      question: 'ถ้ามือเปียกน้ำ ควรทำอย่างไรกับปลั๊กไฟคอมพิวเตอร์?',
      choices: ['รีบเสียบปลั๊กทันที', 'ใช้ผ้าเปียกจับ', 'เช็ดมือให้แห้งสนิทก่อน'],
      correctIndex: 2,
      explanation: 'น้ำเป็นตัวนำไฟฟ้า การเช็ดมือให้แห้งช่วยป้องกันไฟดูด',
    },
    {
      id: 'l7',
      question: 'สัญลักษณ์ลูกศร ➡️ ในการเขียนโค้ดหมายถึงการเดินไปทางใด?',
      choices: ['เดินขึ้นข้างบน', 'เลี้ยวหรือเดินไปทางขวา', 'ถอยหลัง'],
      correctIndex: 1,
      explanation: 'ลูกศรชี้ไปทางขวาหมายถึงการเคลื่อนที่ไปทางขวา',
    },
    {
      id: 'l8',
      question: 'ข้อใดเป็นพฤติกรรมที่ไม่ควรทำขณะใช้คอมพิวเตอร์?',
      choices: ['วางแก้วน้ำใกล้คีย์บอร์ด', 'นั่งหลังตรง', 'กะพริบตาและพักสายตา'],
      correctIndex: 0,
      explanation: 'น้ำอาจหกใส่คีย์บอร์ดทำให้เครื่องลัดวงจรเสียหาย',
    },
    {
      id: 'l9',
      question: 'อุปกรณ์ใดใช้บันทึกเสียงของเราเข้าสู่เครื่องคอมพิวเตอร์?',
      choices: ['หูฟัง', 'ไมโครโฟน', 'เครื่องพิมพ์'],
      correctIndex: 1,
      explanation: 'ไมโครโฟนทำหน้าที่รับข้อมูลเสียงของเราเข้าสู่คอมพิวเตอร์',
    },
    {
      id: 'l10',
      question: 'ถ้าต้องการลบตัวอักษรที่พิมพ์ผิด ควรกดปุ่มใดบนแป้นพิมพ์?',
      choices: ['ปุ่ม Backspace', 'ปุ่ม Spacebar', 'ปุ่ม Enter'],
      correctIndex: 0,
      explanation: 'ปุ่ม Backspace ใช้ลบตัวอักษรที่อยู่หน้าเคอร์เซอร์',
    },
    {
      id: 'l11',
      question: 'ปุ่มยาวที่สุดบนคีย์บอร์ด (Spacebar) ใช้สำหรับทำอะไร?',
      choices: ['ขึ้นบรรทัดใหม่', 'ลบข้อความ', 'เว้นวรรคช่องว่าง'],
      correctIndex: 2,
      explanation: 'ปุ่ม Spacebar ใช้เคาะเว้นวรรคช่องว่างระหว่างคำ',
    },
    {
      id: 'l12',
      question: 'ข้อใดคือข้อมูลส่วนตัวที่ไม่ควรเปิดเผยให้คนแปลกหน้า?',
      choices: ['สีเสื้อที่ชอบ', 'รหัสผ่านโทรศัพท์/บัญชี', 'ชื่อการ์ตูนที่ชอบ'],
      correctIndex: 1,
      explanation: 'รหัสผ่านเป็นข้อมูลความลับส่วนบุคคล ห้ามบอกผู้อื่น',
    },
    {
      id: 'l13',
      question: 'โปรแกรมยอดนิยมที่ใช้ฝึกวาดภาพระบายสีคือโปรแกรมใด?',
      choices: ['โปรแกรม Paint', 'โปรแกรมคิดเลข', 'โปรแกรมฟังเพลง'],
      correctIndex: 0,
      explanation: 'โปรแกรม Paint เป็นซอฟต์แวร์ฝึกวาดและลงสีภาพพื้นฐาน',
    },
    {
      id: 'l14',
      question: 'เมื่อเลิกใช้งานคอมพิวเตอร์แล้ว ควรปฏิบัติอย่างไร?',
      choices: ['ดึงปลั๊กไฟออกทันที', 'ปิดเครื่องด้วย Shut Down', 'เปิดทิ้งไว้ตลอดคืน'],
      correctIndex: 1,
      explanation: 'คำสั่ง Shut Down ช่วยบันทึกข้อมูลและปิดระบบอย่างปลอดภัย',
    },
  ],
  upper: [
    {
      id: 'u1',
      question: 'อุปกรณ์ใดเปรียบเสมือน “สมองกล” ที่คอยประมวลผลคำสั่งทั้งหมด?',
      choices: ['RAM', 'CPU (ซีพียู)', 'Harddisk'],
      correctIndex: 1,
      explanation: 'CPU (Central Processing Unit) ทำหน้าที่ประมวลผลคำสั่งของคอมพิวเตอร์',
    },
    {
      id: 'u2',
      question: 'สัญลักษณ์รูปสี่เหลี่ยมขนมเปียกปูนในผังงาน (Flowchart) หมายถึงอะไร?',
      choices: ['การตัดสินใจ/เงื่อนไข', 'จุดเริ่มต้น/สิ้นสุด', 'การประมวลผลทั่วไป'],
      correctIndex: 0,
      explanation: 'สี่เหลี่ยมขนมเปียกปูน (Decision) ใช้ตรวจสอบเงื่อนไขที่มีทางเลือก',
    },
    {
      id: 'u3',
      question: 'สัญลักษณ์รูปสี่เหลี่ยมผืนผ้าในผังงาน (Flowchart) ใช้แทนสิ่งใด?',
      choices: ['การรับค่าจากแป้นพิมพ์', 'การประมวลผล/การปฏิบัติงาน', 'จุดเชื่อมต่อผังงาน'],
      correctIndex: 1,
      explanation: 'สี่เหลี่ยมผืนผ้า (Process) ใช้แทนขั้นตอนการคำนวณหรือการกระทำ',
    },
    {
      id: 'u4',
      question: 'ข้อใดจัดเป็นซอฟต์แวร์ระบบ (System Software)?',
      choices: ['Microsoft Word', 'Google Chrome', 'Windows 11'],
      correctIndex: 2,
      explanation: 'Windows เป็นระบบปฏิบัติการ (OS) จัดเป็นซอฟต์แวร์ระบบ',
    },
    {
      id: 'u5',
      question: 'รหัสผ่านที่ดีและปลอดภัยควรมีลักษณะตามข้อใด?',
      choices: ['12345678', 'ยาว 8 ตัวขึ้นไป ผสมพิมพ์ใหญ่ เล็ก และตัวเลข', 'ใช้วันเดือนปีเกิด'],
      correctIndex: 1,
      explanation: 'การผสมผสานอักขระหลายประเภทช่วยให้ยากต่อการสุ่มเดา',
    },
    {
      id: 'u6',
      question: 'รหัส OTP 6 หลักที่ส่งมาทาง SMS มีวัตถุประสงค์เพื่ออะไร?',
      choices: ['ยืนยันตัวตนความปลอดภัยชั่วคราว', 'รหัสส่วนลดซื้อของ', 'การอัปเดตระบบปฏิบัติการ'],
      correctIndex: 0,
      explanation: 'OTP (One-Time Password) ใช้ยืนยันตัวตนความปลอดภัยขั้นสูง',
    },
    {
      id: 'u7',
      question: 'การค้นหาข้อมูลบนอินเทอร์เน็ตให้ตรงประเด็นควรใช้สิ่งใด?',
      choices: ['พิมพ์ประโยคพรรณนายาว ๆ', 'พิมพ์คำค้น (Keyword) เฉพาะเจาะจง', 'สุ่มกดลิงก์ในหน้าเว็บ'],
      correctIndex: 1,
      explanation: 'Keyword ที่กระชับและตรงจุดช่วยให้บราวเซอร์ค้นหาได้แม่นยำ',
    },
    {
      id: 'u8',
      question: 'หน่วยความจำใดที่ข้อมูลจะสูญหายทันทีเมื่อปิดคอมพิวเตอร์?',
      choices: ['RAM (แรม)', 'ROM (รอม)', 'SSD / Harddisk'],
      correctIndex: 0,
      explanation: 'RAM เป็นหน่วยความจำชั่วคราว ข้อมูลจะหายไปเมื่อไม่มีกระแสไฟฟ้า',
    },
    {
      id: 'u9',
      question: 'ข้อใดคืออุปกรณ์หน่วยรับเข้า (Input Device) ทั้งหมด?',
      choices: ['จอภาพ, ลำโพง, เครื่องพิมพ์', 'เมาส์, คีย์บอร์ด, สแกนเนอร์', 'ซีพียู, แรม, การ์ดจอ'],
      correctIndex: 1,
      explanation: 'เมาส์ คีย์บอร์ด และสแกนเนอร์ ทำหน้าที่ป้อนข้อมูลเข้าสู่คอมพิวเตอร์',
    },
    {
      id: 'u10',
      question: 'โปรแกรม Scratch บล็อกคำสั่งประเภทใดใช้สั่งให้ทำซ้ำ (Loop)?',
      choices: ['Looks (รูปลักษณ์)', 'Sensing (การตรวจจับ)', 'Control (การควบคุม)'],
      correctIndex: 2,
      explanation: 'หมวด Control มีบล็อก Repeat และ Forever สำหรับการทำงานวนซ้ำ',
    },
    {
      id: 'u11',
      question: 'ไฟล์นามสกุลใดเป็นไฟล์เอกสารที่สร้างจาก Microsoft Word?',
      choices: ['.docx', '.xlsx', '.pptx'],
      correctIndex: 0,
      explanation: '.docx เป็นนามสกุลไฟล์เอกสารประมวลผลคำของ Word',
    },
    {
      id: 'u12',
      question: 'ข้อใดเป็นการป้องกันคอมพิวเตอร์จากไวรัสและมัลแวร์ที่ดีที่สุด?',
      choices: ['เปิดไฟล์แนบอีเมลแปลก ๆ เสมอ', 'ติดตั้งแอนติไวรัสและอัปเดตสม่ำเสมอ', 'ลบคีย์บอร์ดทิ้ง'],
      correctIndex: 1,
      explanation: 'การมีโปรแกรมป้องกันไวรัสและไม่อัปโหลดไฟล์แปลกช่วยลดความเสี่ยง',
    },
    {
      id: 'u13',
      question: 'ประโยชน์สำคัญของการใช้ลูป (Loop) ในการเขียนโปรแกรมคืออะไร?',
      choices: ['ลดการเขียนโค้ดซ้ำซ้อนและกระชับขึ้น', 'ทำให้โปรแกรมค้าง', 'เปลี่ยนสีไอคอนแอป'],
      correctIndex: 0,
      explanation: 'การวนลูปช่วยให้สั่งทำงานซ้ำ ๆ ได้โดยไม่ต้องเขียนคำสั่งเดิมซ้ำ',
    },
    {
      id: 'u14',
      question: 'หากพบลิงก์ข้อความส่งมาว่า "คุณได้รับรางวัล 1 ล้านบาท ให้กรอกรหัสผ่าน" ควรทำอย่างไร?',
      choices: ['รีบกรอกรหัสผ่านทันที', 'แชร์ให้เพื่อนทุกคน', 'ไม่กดลิงก์ ลบข้อความ และแจ้งผู้ปกครอง'],
      correctIndex: 2,
      explanation: 'เป็นข้อความหลอกลวง (Phishing) ห้ามคลิกหรือกรอกข้อมูลลับเด็ดขาด',
    },
  ],
  middle: [
    {
      id: 'm1',
      question: 'แนวคิดเชิงคำนวณข้อใดหมายถึงการแตกปัญหาใหญ่เป็นปัญหาย่อย?',
      choices: ['Pattern Recognition', 'Decomposition (การแยกย่อย)', 'Abstraction (นามธรรม)'],
      correctIndex: 1,
      explanation: 'Decomposition ช่วยย่อยปัญหาที่ซับซ้อนให้เล็กลงเพื่อให้จัดการได้ง่ายขึ้น',
    },
    {
      id: 'm2',
      question: 'แนวคิดการคิดเชิงนามธรรม (Abstraction) มุ่งเน้นกระบวนการใด?',
      choices: ['คัดกรองแก่นสำคัญและตัดสิ่งไม่จำเป็นออก', 'เขียนโค้ดภาษาเครื่อง', 'ตรวจสอบไวรัสในระบบ'],
      correctIndex: 0,
      explanation: 'Abstraction มุ่งเน้นเฉพาะสาระสำคัญที่ใช้แก้ปัญหา ละทิ้งรายละเอียดปลีกย่อย',
    },
    {
      id: 'm3',
      question: 'ตรรกะบูลีน: ผลลัพธ์ของนิพจน์ (TRUE AND FALSE) คือข้อใด?',
      choices: ['TRUE', 'FALSE', 'ERROR'],
      correctIndex: 1,
      explanation: 'ตัวดำเนินการ AND จะเป็นจริงได้เมื่อเงื่อนไขทั้งสองฝั่งเป็นจริงทั้งคู่',
    },
    {
      id: 'm4',
      question: 'ตรรกะบูลีน: ผลลัพธ์ของนิพจน์ (TRUE OR FALSE) คือข้อใด?',
      choices: ['FALSE', 'TRUE', 'NULL'],
      correctIndex: 1,
      explanation: 'ตัวดำเนินการ OR จะเป็นจริงหากมีฝั่งใดฝั่งหนึ่งเป็นจริง',
    },
    {
      id: 'm5',
      question: 'เลขฐานสอง 1010₂ แปลงเป็นเลขฐานสิบได้เท่ากับเท่าใด?',
      choices: ['8', '12', '10'],
      correctIndex: 2,
      explanation: '1010₂ = (1×8) + (0×4) + (1×2) + (0×1) = 8 + 2 = 10',
    },
    {
      id: 'm6',
      question: 'ขนาดข้อมูล 1 ไบต์ (Byte) ประกอบด้วยจำนวนกี่บิต (Bit)?',
      choices: ['8 บิต', '4 บิต', '16 บิต'],
      correctIndex: 0,
      explanation: '8 บิตรวมกันเป็น 1 ไบต์ สามารถแทนรหัสตัวอักขระได้ 1 ตัวอักษร',
    },
    {
      id: 'm7',
      question: 'ภัยคุกคามทางไซเบอร์แบบ "Phishing" มีลักษณะอย่างไร?',
      choices: ['การหลอกลวงด้วยอีเมลหรือเว็บปลอมเพื่อขโมยข้อมูล', 'การทำลายฮาร์ดแวร์ด้วยความร้อน', 'สายแลนขาดชำรุด'],
      correctIndex: 0,
      explanation: 'Phishing คือการตกเบ็ดทางไซเบอร์ หลอกให้เหยื่อกรอกข้อมูลสำคัญหรือรหัสผ่าน',
    },
    {
      id: 'm8',
      question: 'การแอบเข้าระบบคอมพิวเตอร์ของผู้อื่นโดยไม่ได้รับอนุญาต มีความผิดตามกฎหมายใด?',
      choices: ['พ.ร.บ.ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์', 'กฎหมายจราจร', 'ไม่มีความผิดถ้าไม่ลบไฟล์'],
      correctIndex: 0,
      explanation: 'การเข้าถึงระบบโดยมิชอบมีความผิดตาม พ.ร.บ.คอมพิวเตอร์ มีโทษจำคุกและปรับ',
    },
    {
      id: 'm9',
      question: 'สัญญาอนุญาตครีเอทีฟคอมมอนส์ (Creative Commons) คืออะไร?',
      choices: ['สัญญาอนุญาตให้ใช้ผลงานตามเงื่อนไขที่เจ้าของกำหนด', 'ลิขสิทธิ์ที่ห้ามดัดแปลงทุกกรณี', 'ซอฟต์แวร์เถื่อน'],
      correctIndex: 0,
      explanation: 'Creative Commons เป็นข้อตกลงเปิดให้ผู้อื่นนำผลงานไปใช้ต่อได้อย่างถูกต้อง',
    },
    {
      id: 'm10',
      question: 'การประมวลผลแบบกลุ่มเมฆ (Cloud Computing) มีจุดเด่นสำคัญตามข้อใด?',
      choices: ['ประมวลผลและจัดเก็บข้อมูลผ่านเครือข่ายอินเทอร์เน็ต', 'ต้องพกพาแฟลชไดรฟ์ตลอดเวลา', 'ใช้งานได้เมื่อฝนตกเท่านั้น'],
      correctIndex: 0,
      explanation: 'Cloud Computing ช่วยให้เข้าถึงข้อมูลและพลังประมวลผลได้จากทุกที่ผ่านเน็ต',
    },
    {
      id: 'm11',
      question: 'อินเทอร์เน็ตของสรรพสิ่ง (Internet of Things : IoT) หมายถึงสิ่งใด?',
      choices: ['อุปกรณ์ต่าง ๆ เชื่อมต่อและสื่อสารข้อมูลกันผ่านอินเทอร์เน็ต', 'หน้าเว็บขายของออนไลน์', 'ตู้เซฟเก็บเอกสาร'],
      correctIndex: 0,
      explanation: 'IoT คือการให้อุปกรณ์ เช่น เซนเซอร์ แอร์ กล้องวงจรปิด เชื่อมต่อส่งข้อมูลผ่านเน็ต',
    },
    {
      id: 'm12',
      question: 'การเข้ารหัสข้อมูล (Encryption) มีประโยชน์หลักในด้านใด?',
      choices: ['รักษาความลับและความปลอดภัยของข้อมูล', 'ลดขนาดของไฟล์รูปภาพ', 'เพิ่มความเร็วในการพิมพ์งาน'],
      correctIndex: 0,
      explanation: 'การเข้ารหัสแปลงข้อความเป็นรหัสลับ ผู้มีกุญแจถอดรหัสเท่านั้นที่อ่านได้',
    },
    {
      id: 'm13',
      question: 'ข้อใดคือหลักการทำงานของอัลกอริทึมการเรียงลำดับแบบ Bubble Sort?',
      choices: ['เปรียบเทียบข้อมูลคู่ติดกันและสลับที่หากเรียงผิด', 'สุ่มเลือกค่าที่น้อยที่สุดมาต่อท้าย', 'แบ่งครึ่งชุดข้อมูลซ้ำ ๆ'],
      correctIndex: 0,
      explanation: 'Bubble Sort เปรียบเทียบคู่ติดกันแล้วลอยค่าที่มากที่สุดไปไว้ด้านหลังทีละรอบ',
    },
    {
      id: 'm14',
      question: 'โปรโตคอล HTTPS แตกต่างจาก HTTP อย่างไร?',
      choices: ['HTTPS มีการเข้ารหัสข้อมูลความปลอดภัยผ่าน SSL/TLS', 'HTTPS ใช้เฉพาะบนมือถือ', 'HTTPS โหลดช้ากว่าเสมอ'],
      correctIndex: 0,
      explanation: 'S ย่อมาจาก Secure โดย HTTPS เข้ารหัสการสื่อสารระหว่างบราวเซอร์กับเซิร์ฟเวอร์',
    },
  ],
};

interface RoadEntity {
  id: number;
  type: 'coin' | 'nitro' | 'shield' | 'cone';
  lane: 0 | 1 | 2;
  progress: number; // 0.0 (horizon) to 1.0 (player position)
}

interface QuestionGate {
  id: number;
  question: QuizQuestion;
  progress: number; // 0.0 (horizon) to 1.0 (player position)
  passed: boolean;
}

const CyberRacerGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game States
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle');
  const [selectedLevel, setSelectedLevel] = useState<GradeLevel>('upper');
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0); // in meters
  const [lives, setLives] = useState(3);
  const [maxLives] = useState(3);
  const [combo, setCombo] = useState(1);
  const [maxCombo, setMaxCombo] = useState(1);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [totalQuestionsAsked, setTotalQuestionsAsked] = useState(0);
  const [nitroGauge, setNitroGauge] = useState(40); // 0 to 100
  const [isNitroActive, setIsNitroActive] = useState(false);
  const [hasShield, setHasShield] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);

  // UI feedback banners
  const [currentQuestionHUD, setCurrentQuestionHUD] = useState<QuizQuestion | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    text: string;
    type: 'correct' | 'wrong' | 'info';
    detail?: string;
  } | null>(null);

  // High score
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('kj_cyber_racer_best') || '0', 10);
    } catch {
      return 0;
    }
  });

  // Educational progress tracking hook
  const recordGame = useGameProgress('cyber-racer', '🏎️ ขับรถซิ่งตอบคำถาม (Cyber Racer Quiz)');

  // Game loop & physics refs
  const gameLoopRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const nextEntityIdRef = useRef<number>(1);

  // Car Physics
  const carStateRef = useRef({
    currentLane: 1 as 0 | 1 | 2, // 0: Left, 1: Middle, 2: Right
    targetLane: 1 as 0 | 1 | 2,
    carX: 0.5, // 0.0 to 1.0 horizontal position
    targetX: 0.5,
    tilt: 0, // Car tilt angle during steer
    speedKmH: 180, // Base speed
    maxSpeedKmH: 260,
    nitroDurationMs: 0,
    shieldDurationMs: 0,
    spinAngle: 0, // When bumped
    invulnerableMs: 0,
  });

  // Track & Road Environment
  const roadEntitiesRef = useRef<RoadEntity[]>([]);
  const questionGateRef = useRef<QuestionGate | null>(null);
  const nextSpawnTimeRef = useRef<number>(1000); // ms
  const nextQuestionTimeRef = useRef<number>(6000); // ms until first question
  const questionPoolRef = useRef<QuizQuestion[]>([]);
  const questionIndexRef = useRef<number>(0);

  // Prepare shuffled questions
  const prepareQuestions = useCallback((lvl: GradeLevel) => {
    const list = [...QUESTIONS_BY_LEVEL[lvl]];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    questionPoolRef.current = list;
    questionIndexRef.current = 0;
  }, []);

  // Web Audio Synth for engine and effects
  const playSfxTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sawtooth', gain = 0.1) => {
    if (isSoundMuted) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gainNode.gain.setValueAtTime(gain, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio context might be restricted before interaction
    }
  }, [isSoundMuted]);

  // Steer controls
  const steerTo = useCallback((lane: 0 | 1 | 2) => {
    if (gameState !== 'playing') return;
    const car = carStateRef.current;
    if (car.currentLane === lane) return;
    car.currentLane = lane;
    car.targetLane = lane;
    const laneOffsets = [0.22, 0.5, 0.78];
    car.targetX = laneOffsets[lane];
    playSfxTone(260 + lane * 40, 0.08, 'triangle', 0.08);
  }, [gameState, playSfxTone]);

  const steerLeft = useCallback(() => {
    const car = carStateRef.current;
    if (car.currentLane === 2) steerTo(1);
    else if (car.currentLane === 1) steerTo(0);
  }, [steerTo]);

  const steerRight = useCallback(() => {
    const car = carStateRef.current;
    if (car.currentLane === 0) steerTo(1);
    else if (car.currentLane === 1) steerTo(2);
  }, [steerTo]);

  // Nitro boost trigger
  const triggerNitro = useCallback(() => {
    if (gameState !== 'playing') return;
    const car = carStateRef.current;
    if (car.nitroDurationMs > 0 || nitroGauge < 25) return;

    setNitroGauge((prev) => Math.max(0, prev - 30));
    car.nitroDurationMs = 3800;
    setIsNitroActive(true);
    playSfxTone(440, 0.35, 'sawtooth', 0.15);
  }, [gameState, nitroGauge, playSfxTone]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'playing') return;

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        steerLeft();
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        steerRight();
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        triggerNitro();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        // Slow down slightly
        carStateRef.current.speedKmH = Math.max(120, carStateRef.current.speedKmH - 25);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, steerLeft, steerRight, triggerNitro]);

  // Start / Restart Game
  const startGame = useCallback((lvl = selectedLevel) => {
    setSelectedLevel(lvl);
    prepareQuestions(lvl);

    setScore(0);
    setDistance(0);
    setLives(3);
    setCombo(1);
    setMaxCombo(1);
    setCoinsCollected(0);
    setCorrectAnswersCount(0);
    setTotalQuestionsAsked(0);
    setNitroGauge(50);
    setIsNitroActive(false);
    setHasShield(false);
    setFeedbackBanner(null);
    setCurrentQuestionHUD(null);

    carStateRef.current = {
      currentLane: 1,
      targetLane: 1,
      carX: 0.5,
      targetX: 0.5,
      tilt: 0,
      speedKmH: 180,
      maxSpeedKmH: 260,
      nitroDurationMs: 0,
      shieldDurationMs: 0,
      spinAngle: 0,
      invulnerableMs: 0,
    };

    roadEntitiesRef.current = [];
    questionGateRef.current = null;
    nextSpawnTimeRef.current = 1200;
    nextQuestionTimeRef.current = 5000; // 5s to first question
    lastTimeRef.current = performance.now();

    setGameState('playing');
  }, [prepareQuestions, selectedLevel]);

  // Handle Game Over
  const endGame = useCallback(() => {
    setGameState('gameover');
    if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
      gameLoopRef.current = null;
    }

    setScore((currentScore) => {
      // Save high score
      if (currentScore > highScore) {
        setHighScore(currentScore);
        try {
          localStorage.setItem('kj_cyber_racer_best', currentScore.toString());
        } catch {
          // Ignore localStorage errors
        }
      }

      // Record progress into learning system
      void recordGame(currentScore);
      return currentScore;
    });
  }, [highScore, recordGame]);

  // Main Render & Simulation Loop
  useEffect(() => {
    if (gameState !== 'playing') return;

    let animId: number;

    const render = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1); // clamp delta
      lastTimeRef.current = now;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;
      const horizonY = height * 0.28;
      const playerY = height * 0.82;

      const car = carStateRef.current;

      // Update Timers & Nitro
      if (car.nitroDurationMs > 0) {
        car.nitroDurationMs -= dt * 1000;
        car.speedKmH = 290;
        if (car.nitroDurationMs <= 0) {
          setIsNitroActive(false);
          car.speedKmH = 190;
        }
      } else {
        // Natural speed progression
        car.speedKmH = Math.min(car.maxSpeedKmH, 180 + Math.floor(now / 15000) * 10);
      }

      if (car.invulnerableMs > 0) {
        car.invulnerableMs -= dt * 1000;
      }

      // Smooth horizontal interpolation for car
      const dx = car.targetX - car.carX;
      car.carX += dx * Math.min(1, dt * 14);
      car.tilt = -dx * 1.5; // car leans into turn

      // Update Distance & Score
      const speedScale = car.speedKmH / 180;
      setDistance((d) => d + Math.round(car.speedKmH * dt * 0.28));
      setScore((s) => s + Math.round(10 * dt * speedScale));

      // ----------------------------------------------------
      // DRAW BACKGROUND (Cyber Sunset Sky & Grid Horizon)
      // ----------------------------------------------------
      // Sky gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0f0c29');
      skyGrad.addColorStop(0.6, '#302b63');
      skyGrad.addColorStop(1, '#ff007f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY);

      // Distant Neon Sun / Horizon Glow
      ctx.save();
      const sunGrad = ctx.createRadialGradient(
        width / 2, horizonY, 5,
        width / 2, horizonY, width * 0.35,
      );
      sunGrad.addColorStop(0, 'rgba(255, 230, 0, 0.9)');
      sunGrad.addColorStop(0.4, 'rgba(255, 0, 128, 0.6)');
      sunGrad.addColorStop(1, 'rgba(255, 0, 128, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(width / 2, horizonY, width * 0.35, Math.PI, 0, false);
      ctx.fill();

      // Cyber City Silhouettes
      ctx.fillStyle = 'rgba(20, 15, 45, 0.85)';
      const buildingWidths = [45, 30, 60, 40, 50, 35, 70, 40, 55, 60];
      let bX = 10;
      for (let i = 0; i < buildingWidths.length; i++) {
        const bW = buildingWidths[i];
        const bH = 25 + ((i * 37) % 55);
        ctx.fillRect(bX, horizonY - bH, bW, bH);
        // glowing window dots
        ctx.fillStyle = (i % 2 === 0) ? '#00f7ff' : '#ff007f';
        for (let wy = horizonY - bH + 6; wy < horizonY - 4; wy += 12) {
          ctx.fillRect(bX + 8, wy, 4, 4);
          ctx.fillRect(bX + bW - 12, wy, 4, 4);
        }
        ctx.fillStyle = 'rgba(20, 15, 45, 0.85)';
        bX += bW + 12;
        if (bX > width) break;
      }
      ctx.restore();

      // ----------------------------------------------------
      // DRAW 3D PERSPECTIVE HIGHWAY (Road & Lanes)
      // ----------------------------------------------------
      const roadTopWidth = width * 0.28;
      const roadBottomWidth = width * 0.94;
      const roadTopLeft = (width - roadTopWidth) / 2;
      const roadTopRight = roadTopLeft + roadTopWidth;
      const roadBottomLeft = (width - roadBottomWidth) / 2;
      const roadBottomRight = roadBottomLeft + roadBottomWidth;

      // Road asphalt surface
      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#151329');
      roadGrad.addColorStop(0.5, '#1e1b38');
      roadGrad.addColorStop(1, '#0e0b1f');
      ctx.fillStyle = roadGrad;

      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, height);
      ctx.lineTo(roadBottomLeft, height);
      ctx.closePath();
      ctx.fill();

      // Glowing Road Borders (Left & Right curbs)
      ctx.strokeStyle = isNitroActive ? '#00f7ff' : '#ff007f';
      ctx.lineWidth = isNitroActive ? 5 : 3;
      ctx.shadowColor = isNitroActive ? '#00f7ff' : '#ff007f';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      ctx.moveTo(roadTopLeft, horizonY);
      ctx.lineTo(roadBottomLeft, height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(roadTopRight, horizonY);
      ctx.lineTo(roadBottomRight, height);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Animated Road Divider Stripes (3 Lanes -> 2 Dividers)
      const divider1TopX = roadTopLeft + roadTopWidth * (1 / 3);
      const divider1BottomX = roadBottomLeft + roadBottomWidth * (1 / 3);
      const divider2TopX = roadTopLeft + roadTopWidth * (2 / 3);
      const divider2BottomX = roadBottomLeft + roadBottomWidth * (2 / 3);

      const speedFactor = (now * (car.speedKmH / 180) * 0.002) % 1;
      const numStripes = 10;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      for (let i = 0; i < numStripes; i++) {
        // Perspective exponent for realistic depth
        const p1 = Math.pow((i + speedFactor) / numStripes, 2.2);
        const p2 = Math.pow((i + speedFactor + 0.45) / numStripes, 2.2);
        if (p1 > 1 || p2 > 1) continue;

        const y1 = horizonY + (height - horizonY) * p1;
        const y2 = horizonY + (height - horizonY) * p2;

        const d1x1 = divider1TopX + (divider1BottomX - divider1TopX) * p1;
        const d1x2 = divider1TopX + (divider1BottomX - divider1TopX) * p2;
        const d2x1 = divider2TopX + (divider2BottomX - divider2TopX) * p1;
        const d2x2 = divider2TopX + (divider2BottomX - divider2TopX) * p2;

        const stripeWidth = 2 + 6 * p1;
        // Lane 1 divider
        ctx.beginPath();
        ctx.moveTo(d1x1 - stripeWidth / 2, y1);
        ctx.lineTo(d1x2 - stripeWidth / 2, y2);
        ctx.lineTo(d1x2 + stripeWidth / 2, y2);
        ctx.lineTo(d1x1 + stripeWidth / 2, y1);
        ctx.fill();

        // Lane 2 divider
        ctx.beginPath();
        ctx.moveTo(d2x1 - stripeWidth / 2, y1);
        ctx.lineTo(d2x2 - stripeWidth / 2, y2);
        ctx.lineTo(d2x2 + stripeWidth / 2, y2);
        ctx.lineTo(d2x1 + stripeWidth / 2, y1);
        ctx.fill();
      }

      // Helper function: get X coordinate at a given lane and vertical progress (0 to 1)
      const getLaneXAtProgress = (lane: 0 | 1 | 2, p: number) => {
        const laneRatios = [1 / 6, 3 / 6, 5 / 6];
        const ratio = laneRatios[lane];
        const topX = roadTopLeft + roadTopWidth * ratio;
        const botX = roadBottomLeft + roadBottomWidth * ratio;
        return topX + (botX - topX) * p;
      };

      const getYAtProgress = (p: number) => {
        return horizonY + (height - horizonY) * Math.pow(p, 1.8);
      };

      // ----------------------------------------------------
      // SPAWN & UPDATE QUESTION GATES
      // ----------------------------------------------------
      nextQuestionTimeRef.current -= dt * 1000;
      if (nextQuestionTimeRef.current <= 0 && !questionGateRef.current) {
        // Fetch next question from pool
        const pool = questionPoolRef.current;
        if (pool.length > 0) {
          const q = pool[questionIndexRef.current % pool.length];
          questionIndexRef.current++;
          questionGateRef.current = {
            id: nextEntityIdRef.current++,
            question: q,
            progress: 0.05,
            passed: false,
          };
          setCurrentQuestionHUD(q);
        }
        nextQuestionTimeRef.current = 14000; // interval between questions
      }

      // Update & Draw Question Gate
      if (questionGateRef.current) {
        const gate = questionGateRef.current;
        // Move gate forward based on speed
        gate.progress += dt * (car.speedKmH / 180) * 0.12;

        const p = gate.progress;
        const y = getYAtProgress(p);
        const scale = 0.2 + 0.8 * p;
        const gateW = (roadTopWidth + (roadBottomWidth - roadTopWidth) * p);
        const gateLeft = (width - gateW) / 2;
        const gateH = 65 * scale;

        // Draw Overhead Truss Arch
        ctx.save();
        ctx.strokeStyle = '#00f7ff';
        ctx.lineWidth = 3 * scale;
        ctx.shadowColor = '#00f7ff';
        ctx.shadowBlur = 10 * scale;

        // Arch pillar left & right
        ctx.beginPath();
        ctx.moveTo(gateLeft, y);
        ctx.lineTo(gateLeft, y - gateH);
        ctx.lineTo(gateLeft + gateW, y - gateH);
        ctx.lineTo(gateLeft + gateW, y);
        ctx.stroke();

        // 3 Lane Answer Gate Panels
        const panelW = (gateW / 3) * 0.92;
        for (let l = 0; l < 3; l++) {
          const laneCenterX = getLaneXAtProgress(l as 0 | 1 | 2, p);
          const px = laneCenterX - panelW / 2;
          const py = y - gateH * 0.85;

          // Panel background
          const isCorrectLane = l === gate.question.correctIndex;
          ctx.fillStyle = isCorrectLane ? 'rgba(16, 185, 129, 0.45)' : 'rgba(30, 27, 75, 0.75)';
          ctx.strokeStyle = isCorrectLane ? '#10b981' : '#a855f7';
          ctx.lineWidth = 2 * scale;
          ctx.fillRect(px, py, panelW, gateH * 0.75);
          ctx.strokeRect(px, py, panelW, gateH * 0.75);

          // Panel choice label
          const choiceLetters = ['[A]', '[B]', '[C]'];
          const text = `${choiceLetters[l]} ${gate.question.choices[l]}`;
          ctx.fillStyle = '#ffffff';
          ctx.font = `bold ${Math.max(9, Math.round(12 * scale))}px "Prompt", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          // Truncate text if needed
          const displayText = text.length > 14 && scale < 0.8 ? text.slice(0, 12) + '..' : text;
          ctx.fillText(displayText, laneCenterX, py + (gateH * 0.75) / 2);
        }
        ctx.restore();

        // Check if gate reaches player
        if (p >= 0.85 && !gate.passed) {
          gate.passed = true;
          setTotalQuestionsAsked((t) => t + 1);

          const isCorrect = car.currentLane === gate.question.correctIndex;
          if (isCorrect) {
            // Correct answer!
            sfxCorrect();
            setCorrectAnswersCount((c) => c + 1);
            setCombo((c) => {
              const newCombo = c + 1;
              setMaxCombo((mc) => Math.max(mc, newCombo));
              return newCombo;
            });
            const bonusPts = 100 * combo;
            setScore((s) => s + bonusPts);
            setNitroGauge((g) => Math.min(100, g + 25));
            setFeedbackBanner({
              text: `🎉 ถูกต้อง! +${bonusPts} แต้ม (คอมโบ x${combo})`,
              type: 'correct',
              detail: gate.question.explanation,
            });
          } else {
            // Wrong answer!
            sfxWrong();
            setCombo(1);
            if (hasShield) {
              setHasShield(false);
              setFeedbackBanner({
                text: `🛡️ เกราะป้องกันช่วยรับดาเมจ!`,
                type: 'info',
                detail: `คำตอบที่ถูกคือ: ${gate.question.choices[gate.question.correctIndex]} (${gate.question.explanation})`,
              });
            } else {
              setLives((l) => {
                const nextLives = l - 1;
                if (nextLives <= 0) {
                  endGame();
                }
                return nextLives;
              });
              setFeedbackBanner({
                text: `💥 ผิดเลน! เสีย 1 หัวใจ`,
                type: 'wrong',
                detail: `คำตอบที่ถูกต้องคือ [${gate.question.choices[gate.question.correctIndex]}] : ${gate.question.explanation}`,
              });
            }
          }
        }

        if (p > 1.15) {
          questionGateRef.current = null;
          setCurrentQuestionHUD(null);
        }
      }

      // ----------------------------------------------------
      // SPAWN & UPDATE ROAD ITEMS (Coins, Nitro, Shield, Cones)
      // ----------------------------------------------------
      nextSpawnTimeRef.current -= dt * 1000;
      if (nextSpawnTimeRef.current <= 0 && !questionGateRef.current) {
        // Pick random lane and type
        const lanes: (0 | 1 | 2)[] = [0, 1, 2];
        const randomLane = lanes[Math.floor(Math.random() * lanes.length)];
        const rand = Math.random();
        let itemType: RoadEntity['type'] = 'coin';
        if (rand < 0.45) itemType = 'coin';
        else if (rand < 0.65) itemType = 'cone';
        else if (rand < 0.85) itemType = 'nitro';
        else itemType = 'shield';

        roadEntitiesRef.current.push({
          id: nextEntityIdRef.current++,
          type: itemType,
          lane: randomLane,
          progress: 0.05,
        });

        nextSpawnTimeRef.current = 800 + Math.random() * 800; // interval
      }

      // Update & Render Entities
      const activeEntities: RoadEntity[] = [];
      for (const entity of roadEntitiesRef.current) {
        entity.progress += dt * (car.speedKmH / 180) * 0.22;
        const p = entity.progress;
        if (p > 1.1) continue; // offscreen

        const itemY = getYAtProgress(p);
        const itemX = getLaneXAtProgress(entity.lane, p);
        const scale = 0.2 + 0.8 * p;

        // Collision Check with Player
        if (p >= 0.78 && p <= 0.92 && entity.lane === car.currentLane) {
          // Collected or Hit!
          if (entity.type === 'coin') {
            sfxCoin();
            setScore((s) => s + 25);
            setCoinsCollected((c) => c + 1);
            setNitroGauge((g) => Math.min(100, g + 8));
          } else if (entity.type === 'nitro') {
            sfxCoin();
            car.nitroDurationMs = 3500;
            setIsNitroActive(true);
            setNitroGauge(100);
            playSfxTone(520, 0.2, 'sawtooth', 0.12);
          } else if (entity.type === 'shield') {
            sfxCoin();
            setHasShield(true);
            setLives((l) => Math.min(maxLives, l + 1));
          } else if (entity.type === 'cone') {
            if (car.invulnerableMs <= 0) {
              if (hasShield) {
                setHasShield(false);
                car.invulnerableMs = 800;
              } else {
                sfxWrong();
                car.speedKmH = Math.max(100, car.speedKmH - 50);
                setLives((l) => {
                  const nl = l - 1;
                  if (nl <= 0) endGame();
                  return nl;
                });
                car.invulnerableMs = 1000;
              }
            }
          }
          continue; // Remove collected entity
        }

        // Draw Entity Sprite on Road
        ctx.save();
        ctx.translate(itemX, itemY);
        ctx.scale(scale, scale);

        if (entity.type === 'coin') {
          // Spinning Golden Coin
          ctx.fillStyle = '#f59e0b';
          ctx.shadowColor = '#fbbf24';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.ellipse(0, 0, 14, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fef3c7';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 1);
        } else if (entity.type === 'nitro') {
          // Neon Cyan Nitro Canister
          ctx.fillStyle = '#06b6d4';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 12;
          ctx.fillRect(-10, -14, 20, 28);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', 0, 0);
        } else if (entity.type === 'shield') {
          // Cyan Energy Bubble
          ctx.strokeStyle = '#38bdf8';
          ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 14px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🛡️', 0, 0);
        } else if (entity.type === 'cone') {
          // Orange Traffic Cone
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(0, -18);
          ctx.lineTo(12, 14);
          ctx.lineTo(-12, 14);
          ctx.closePath();
          ctx.fill();
          // White reflective strip
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-6, 2);
          ctx.lineTo(6, 2);
          ctx.lineTo(8, 8);
          ctx.lineTo(-8, 8);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
        activeEntities.push(entity);
      }
      roadEntitiesRef.current = activeEntities;

      // ----------------------------------------------------
      // DRAW PLAYER RACER CAR
      // ----------------------------------------------------
      const playerLaneX = roadBottomLeft + roadBottomWidth * (car.carX);
      const carScale = 1.05;

      ctx.save();
      ctx.translate(playerLaneX, playerY);
      ctx.rotate((car.tilt * Math.PI) / 180);

      // Invulnerability flicker
      if (car.invulnerableMs > 0 && Math.floor(now / 100) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Exhaust Boost Flames
      const flameLength = isNitroActive ? 35 + Math.random() * 20 : 12 + Math.random() * 8;
      const flameColor = isNitroActive ? '#00f7ff' : '#ff5500';
      ctx.fillStyle = flameColor;
      ctx.shadowColor = flameColor;
      ctx.shadowBlur = 15;

      // Left exhaust flame
      ctx.beginPath();
      ctx.moveTo(-16 * carScale, 30 * carScale);
      ctx.lineTo(-20 * carScale, (30 + flameLength) * carScale);
      ctx.lineTo(-12 * carScale, 30 * carScale);
      ctx.fill();

      // Right exhaust flame
      ctx.beginPath();
      ctx.moveTo(12 * carScale, 30 * carScale);
      ctx.lineTo(20 * carScale, (30 + flameLength) * carScale);
      ctx.lineTo(16 * carScale, 30 * carScale);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Car Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.ellipse(0, 26 * carScale, 32 * carScale, 14 * carScale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Car Wheels (4 black rubber tires with cyber rim)
      const wheels = [
        { x: -28, y: -18 },
        { x: 28, y: -18 },
        { x: -28, y: 16 },
        { x: 28, y: 16 },
      ];
      ctx.fillStyle = '#111827';
      for (const w of wheels) {
        ctx.fillRect((w.x - 4) * carScale, (w.y - 8) * carScale, 8 * carScale, 16 * carScale);
      }

      // Main Aerodynamic Chassis (Cyber Sports Car)
      const carGrad = ctx.createLinearGradient(0, -35 * carScale, 0, 30 * carScale);
      carGrad.addColorStop(0, '#ef4444');
      carGrad.addColorStop(0.5, '#dc2626');
      carGrad.addColorStop(1, '#991b1b');
      ctx.fillStyle = carGrad;

      ctx.beginPath();
      // Hood nose
      ctx.moveTo(0, -36 * carScale);
      ctx.lineTo(22 * carScale, -22 * carScale);
      ctx.lineTo(24 * carScale, 10 * carScale);
      ctx.lineTo(26 * carScale, 28 * carScale);
      // Rear spoiler
      ctx.lineTo(-26 * carScale, 28 * carScale);
      ctx.lineTo(-24 * carScale, 10 * carScale);
      ctx.lineTo(-22 * carScale, -22 * carScale);
      ctx.closePath();
      ctx.fill();

      // Cyber Neon Decal Lines
      ctx.strokeStyle = isNitroActive ? '#00f7ff' : '#facc15';
      ctx.lineWidth = 2 * carScale;
      ctx.beginPath();
      ctx.moveTo(-12 * carScale, -30 * carScale);
      ctx.lineTo(-14 * carScale, 20 * carScale);
      ctx.moveTo(12 * carScale, -30 * carScale);
      ctx.lineTo(14 * carScale, 20 * carScale);
      ctx.stroke();

      // Cockpit Windshield (Tinted glass with reflection)
      const glassGrad = ctx.createLinearGradient(0, -18 * carScale, 0, 4 * carScale);
      glassGrad.addColorStop(0, '#0284c7');
      glassGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(0, -18 * carScale);
      ctx.lineTo(14 * carScale, -8 * carScale);
      ctx.lineTo(12 * carScale, 6 * carScale);
      ctx.lineTo(-12 * carScale, 6 * carScale);
      ctx.lineTo(-14 * carScale, -8 * carScale);
      ctx.closePath();
      ctx.fill();

      // Rear Spoiler Wing
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(-28 * carScale, 24 * carScale, 56 * carScale, 6 * carScale);

      // Glowing Taillights
      ctx.fillStyle = '#ff0055';
      ctx.shadowColor = '#ff0055';
      ctx.shadowBlur = 10;
      ctx.fillRect(-24 * carScale, 28 * carScale, 10 * carScale, 3 * carScale);
      ctx.fillRect(14 * carScale, 28 * carScale, 10 * carScale, 3 * carScale);
      ctx.shadowBlur = 0;

      // Shield Bubble Aura if active
      if (hasShield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(0, 0, 42 * carScale, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, hasShield, isNitroActive, combo, maxLives, endGame, playSfxTone]);

  // Touch & Swipe handlers on Canvas
  const touchStartXRef = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - touchStartXRef.current;
    if (Math.abs(diff) > 30) {
      if (diff > 0) steerRight();
      else steerLeft();
    } else {
      // Direct lane tap
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const tapX = (endX - rect.left) / rect.width;
      if (tapX < 0.35) steerTo(0);
      else if (tapX > 0.65) steerTo(2);
      else steerTo(1);
    }
  };

  return (
    <div className="cyber-racer-container">
      {/* Top Header & Navigation */}
      <div className="cr-top-bar">
        <Link to="/games" className="cr-back-link">
          <ChevronLeft size={20} />
          <span>เกมฝึกทักษะ</span>
        </Link>
        <div className="cr-header-title">
          <span className="cr-icon">🏎️</span>
          <h1>Cyber Racer: ขับรถซิ่งตอบคำถาม</h1>
        </div>
        <button
          className="cr-mute-btn"
          onClick={() => setIsSoundMuted(!isSoundMuted)}
          aria-label={isSoundMuted ? 'เปิดเสียง' : 'ปิดเสียง'}
        >
          {isSoundMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Grade Level Selector */}
      <div className="cr-grade-selector">
        <span className="cr-level-label">ระดับชั้น:</span>
        <button
          className={`cr-level-btn ${selectedLevel === 'lower' ? 'active' : ''}`}
          onClick={() => {
            setSelectedLevel('lower');
            if (gameState === 'playing') startGame('lower');
          }}
        >
          ประถมต้น (ป.1 - ป.3)
        </button>
        <button
          className={`cr-level-btn ${selectedLevel === 'upper' ? 'active' : ''}`}
          onClick={() => {
            setSelectedLevel('upper');
            if (gameState === 'playing') startGame('upper');
          }}
        >
          ประถมปลาย (ป.4 - ป.6)
        </button>
        <button
          className={`cr-level-btn ${selectedLevel === 'middle' ? 'active' : ''}`}
          onClick={() => {
            setSelectedLevel('middle');
            if (gameState === 'playing') startGame('middle');
          }}
        >
          มัธยมต้น (ม.1 - ม.3)
        </button>
      </div>

      {/* HUD Info Bar */}
      <div className="cr-hud-bar">
        <div className="cr-hud-item cr-score">
          <Trophy size={18} className="text-amber-400" />
          <span>{score.toLocaleString()} แต้ม</span>
        </div>

        <div className="cr-hud-item cr-combo">
          <Flame size={18} className="text-orange-500" />
          <span>x{combo} คอมโบ</span>
        </div>

        <div className="cr-hud-item cr-lives">
          {Array.from({ length: maxLives }).map((_, i) => (
            <Heart
              key={i}
              size={18}
              className={i < lives ? 'text-rose-500 fill-rose-500' : 'text-slate-600'}
            />
          ))}
          {hasShield && <Shield size={18} className="text-cyan-400 fill-cyan-400 ml-1" />}
        </div>

        <div className="cr-hud-item cr-nitro">
          <Zap size={18} className="text-cyan-400" />
          <div className="cr-nitro-track">
            <div
              className={`cr-nitro-fill ${isNitroActive ? 'boosting' : ''}`}
              style={{ width: `${nitroGauge}%` }}
            />
          </div>
        </div>

        <div className="cr-hud-item cr-dist">
          <span>{distance} m</span>
        </div>
      </div>

      {/* Question HUD Banner (Floating clearly above road) */}
      {currentQuestionHUD && (
        <div className="cr-question-hud-card">
          <div className="cr-q-badge">
            <Sparkles size={16} /> ภารกิจซิ่งตอบคำถาม
          </div>
          <div className="cr-q-text">{currentQuestionHUD.question}</div>
          <div className="cr-q-lanes">
            <div className={`cr-lane-hint ${carStateRef.current.currentLane === 0 ? 'selected' : ''}`}>
              <span className="cr-lane-key">ซ้าย (A):</span> {currentQuestionHUD.choices[0]}
            </div>
            <div className={`cr-lane-hint ${carStateRef.current.currentLane === 1 ? 'selected' : ''}`}>
              <span className="cr-lane-key">กลาง (B):</span> {currentQuestionHUD.choices[1]}
            </div>
            <div className={`cr-lane-hint ${carStateRef.current.currentLane === 2 ? 'selected' : ''}`}>
              <span className="cr-lane-key">ขวา (C):</span> {currentQuestionHUD.choices[2]}
            </div>
          </div>
        </div>
      )}

      {/* Quick Feedback Toast */}
      {feedbackBanner && (
        <div className={`cr-feedback-toast ${feedbackBanner.type}`}>
          <div className="cr-fb-title">{feedbackBanner.text}</div>
          {feedbackBanner.detail && <div className="cr-fb-detail">{feedbackBanner.detail}</div>}
        </div>
      )}

      {/* Main Game Screen Canvas */}
      <div className="cr-viewport">
        <canvas
          ref={canvasRef}
          width={640}
          height={800}
          className="cr-canvas"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* Start / Idle Overlay */}
        {gameState === 'idle' && (
          <div className="cr-overlay cr-start-overlay">
            <div className="cr-modal-box">
              <div className="cr-modal-emoji">🏎️⚡</div>
              <h2>CYBER RACER QUIZ</h2>
              <p className="cr-modal-desc">
                ขับรถสปอร์ตซิ่งบนทางด่วนไซเบอร์ เลือกเลนคำตอบวิทยาการคำนวณที่ถูกต้อง หลบสิ่งกีดขวาง เก็บเหรียญและไนโตรเร่งความเร็ว!
              </p>

              <div className="cr-how-to-play">
                <div className="cr-rule-item">
                  <span className="cr-rule-icon">⬅️ ➡️</span>
                  <span>เลี้ยวซ้ายหรือขวาเพื่อเข้าเลนคำตอบที่ถูกต้อง</span>
                </div>
                <div className="cr-rule-item">
                  <span className="cr-rule-icon">🪙 ⚡</span>
                  <span>เก็บเหรียญทองและถังไนโตรชาร์จความเร็ว</span>
                </div>
                <div className="cr-rule-item">
                  <span className="cr-rule-icon">🚧 ⚠️</span>
                  <span>หลบกรวยจราจรและระวังขับผิดเลนจะเสียพลังชีวิต</span>
                </div>
              </div>

              <button className="cr-primary-btn" onClick={() => startGame()}>
                <Play size={20} /> เริ่มซิ่งเลย!
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState === 'gameover' && (
          <div className="cr-overlay cr-gameover-overlay">
            <div className="cr-modal-box">
              <div className="cr-modal-emoji">🏁</div>
              <h2>จบการแข่งขัน!</h2>
              <p className="cr-modal-desc">คุณทำผลงานได้อย่างยอดเยี่ยมบนทางด่วนไซเบอร์</p>

              <div className="cr-stats-grid">
                <div className="cr-stat-item">
                  <span className="cr-stat-label">คะแนนรวม</span>
                  <span className="cr-stat-val text-amber-400">{score.toLocaleString()}</span>
                </div>
                <div className="cr-stat-item">
                  <span className="cr-stat-label">คะแนนสูงสุด</span>
                  <span className="cr-stat-val text-cyan-400">{highScore.toLocaleString()}</span>
                </div>
                <div className="cr-stat-item">
                  <span className="cr-stat-label">ตอบถูก</span>
                  <span className="cr-stat-val text-emerald-400">
                    {correctAnswersCount} / {totalQuestionsAsked} ข้อ
                  </span>
                </div>
                <div className="cr-stat-item">
                  <span className="cr-stat-label">คอมโบสูงสุด</span>
                  <span className="cr-stat-val text-orange-400">x{maxCombo}</span>
                </div>
                <div className="cr-stat-item">
                  <span className="cr-stat-label">เหรียญที่เก็บได้</span>
                  <span className="cr-stat-val text-yellow-300">{coinsCollected} 🪙</span>
                </div>
                <div className="cr-stat-item">
                  <span className="cr-stat-label">ระยะทาง</span>
                  <span className="cr-stat-val text-purple-400">{distance} m</span>
                </div>
              </div>

              <div className="cr-modal-actions">
                <button className="cr-primary-btn" onClick={() => startGame()}>
                  <RotateCcw size={18} /> ซิ่งใหม่อีกรอบ
                </button>
                <Link to="/games" className="cr-secondary-btn">
                  <Award size={18} /> กลับหน้าเกม
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Touch Controls */}
      <div className="cr-touch-controls">
        <button
          className="cr-ctrl-btn cr-btn-steer"
          onClick={steerLeft}
          aria-label="เลี้ยวซ้าย"
        >
          <ArrowLeft size={24} />
          <span>ซ้าย</span>
        </button>

        <button
          className={`cr-ctrl-btn cr-btn-nitro ${nitroGauge >= 25 ? 'ready' : 'empty'}`}
          onClick={triggerNitro}
          aria-label="ไนโตร เร่งความเร็ว"
        >
          <Zap size={24} />
          <span>ไนโตร ⚡</span>
        </button>

        <button
          className="cr-ctrl-btn cr-btn-steer"
          onClick={steerRight}
          aria-label="เลี้ยวขวา"
        >
          <ArrowRight size={24} />
          <span>ขวา</span>
        </button>
      </div>

      {/* Keyboard Controls Guide */}
      <div className="cr-keys-hint">
        <span>🎮 คีย์บอร์ด:</span>
        <kbd>←</kbd> <kbd>A</kbd> เลี้ยวซ้าย &bull; <kbd>→</kbd> <kbd>D</kbd> เลี้ยวขวา &bull;{' '}
        <kbd>Space</kbd> <kbd>W</kbd> ไนโตร &bull; <kbd>S</kbd> เบรก
      </div>

      {/* Pedagogical Reflection Card */}
      <div className="cr-learn-card-wrap">
        <GameLearnCard gameKey="cyber-racer" />
      </div>
    </div>
  );
};

export default CyberRacerGame;
