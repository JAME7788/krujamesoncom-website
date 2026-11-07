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
import { playGameTone } from '../../utils/gameAudio';
import { getUnifiedGameRecord } from '../../data/unifiedGameRegistry';
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

const QUESTIONS_BY_LEVEL: Record<GradeLevel, QuizQuestion[]> = {
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
  const [activeLane, setActiveLane] = useState<0 | 1 | 2>(1);

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
  const feedbackTimerRef = useRef<number | null>(null);

  // Mutable simulation state to prevent 60fps React re-renders
  const simStatsRef = useRef({
    score: 0,
    distance: 0,
    lives: 3,
    combo: 1,
    maxCombo: 1,
    hasShield: false,
    isNitroActive: false,
    speedMultiplier: 1,
    lastHudSync: 0,
  });

  const showTransientFeedback = useCallback(
    (banner: { text: string; type: 'correct' | 'wrong' | 'info'; detail?: string }) => {
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
      setFeedbackBanner(banner);
      feedbackTimerRef.current = window.setTimeout(() => {
        setFeedbackBanner(null);
      }, 2200);
    },
    [],
  );

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

  // Singleton Web Audio Synth for engine and effects (zero AudioContext leak)
  const playSfxTone = useCallback((freq: number, duration: number, type: OscillatorType = 'sawtooth', gain = 0.09) => {
    if (isSoundMuted) return;
    playGameTone(freq, duration, type, gain);
  }, [isSoundMuted]);

  // Steer controls
  const steerTo = useCallback((lane: 0 | 1 | 2) => {
    if (gameState !== 'playing') return;
    const car = carStateRef.current;
    if (car.currentLane === lane) return;
    car.currentLane = lane;
    car.targetLane = lane;
    setActiveLane(lane);
    const laneOffsets = [1 / 6, 0.5, 5 / 6];
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
    simStatsRef.current.isNitroActive = true;
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

    const unified = getUnifiedGameRecord('cyber-racer');
    const speedMult = unified?.effectiveSpeedMultiplier ?? 1;

    simStatsRef.current = {
      score: 0,
      distance: 0,
      lives: 3,
      combo: 1,
      maxCombo: 1,
      hasShield: false,
      isNitroActive: false,
      speedMultiplier: speedMult,
      lastHudSync: performance.now(),
    };

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
    setActiveLane(1);

    carStateRef.current = {
      currentLane: 1,
      targetLane: 1,
      carX: 0.5,
      targetX: 0.5,
      tilt: 0,
      speedKmH: Math.round(180 * speedMult),
      maxSpeedKmH: Math.round(250 * speedMult),
      nitroDurationMs: 0,
      shieldDurationMs: 0,
      spinAngle: 0,
      invulnerableMs: 0,
    };

    roadEntitiesRef.current = [];
    questionGateRef.current = null;
    nextSpawnTimeRef.current = 1200;
    nextQuestionTimeRef.current = 4000; // 4s to first question
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

    const finalScore = Math.floor(simStatsRef.current.score);
    const finalDist = Math.floor(simStatsRef.current.distance);
    setScore(finalScore);
    setDistance(finalDist);

    if (finalScore > highScore) {
      setHighScore(finalScore);
      try {
        localStorage.setItem('kj_cyber_racer_best', finalScore.toString());
      } catch {
        // Ignore localStorage errors
      }
    }

    void recordGame(finalScore);
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

      // ----------------------------------------------------
      // CANVAS SIZE: ตามขนาดจริงบนจอ × devicePixelRatio (คมชัดทุกขนาดจอ)
      // ----------------------------------------------------
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = canvas.clientWidth || 720;
      const height = canvas.clientHeight || 440;
      const pxW = Math.round(width * dpr);
      const pxH = Math.round(height * dpr);
      if (canvas.width !== pxW || canvas.height !== pxH) {
        canvas.width = pxW;
        canvas.height = pxH;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const S = Math.max(0.6, Math.min(width / 720, height / 440)); // หน่วยสเกลของสไปรต์
      const horizonY = height * 0.34;
      const playerY = height * 0.8;
      const groundH = height - horizonY;

      const car = carStateRef.current;
      const sim = simStatsRef.current;

      // Update Timers & Nitro
      if (car.nitroDurationMs > 0) {
        car.nitroDurationMs -= dt * 1000;
        car.speedKmH = Math.round(280 * sim.speedMultiplier);
        if (car.nitroDurationMs <= 0) {
          sim.isNitroActive = false;
          setIsNitroActive(false);
          car.speedKmH = Math.round(185 * sim.speedMultiplier);
        }
      } else {
        // Natural speed progression
        car.speedKmH = Math.min(
          car.maxSpeedKmH,
          Math.round((180 + Math.floor(sim.distance / 400) * 8) * sim.speedMultiplier),
        );
      }

      if (car.invulnerableMs > 0) {
        car.invulnerableMs -= dt * 1000;
      }

      // Smooth horizontal interpolation for car
      const dx = car.targetX - car.carX;
      car.carX += dx * Math.min(1, dt * 14);
      car.tilt = -dx * 40; // car leans into turn (degrees)

      // Update Distance & Score in ref (throttled HUD sync every 180ms to prevent 60fps React re-renders)
      const speedScale = car.speedKmH / 180;
      sim.distance += car.speedKmH * dt * 0.28;
      sim.score += 10 * dt * speedScale;
      if (now - sim.lastHudSync >= 180) {
        sim.lastHudSync = now;
        setDistance(Math.floor(sim.distance));
        setScore(Math.floor(sim.score));
      }

      const nitro = sim.isNitroActive;
      const accent = nitro ? '#22d3ee' : '#ff2d95';
      const scroll = (now * speedScale * 0.0016) % 1; // 0..1 การเลื่อนของพื้นถนน

      // ----------------------------------------------------
      // SKY: ไล่สีพระอาทิตย์ตก + ดาว + ดวงอาทิตย์เรโทรมีแถบ
      // ----------------------------------------------------
      const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, '#0a0620');
      skyGrad.addColorStop(0.55, '#2b0f52');
      skyGrad.addColorStop(0.85, '#7a1f6e');
      skyGrad.addColorStop(1, '#ff4d8d');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, horizonY + 1);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      for (let i = 0; i < 46; i++) {
        const sx = ((i * 9301 + 49297) % 233280) / 233280 * width;
        const sy = ((i * 4271 + 1237) % 9973) / 9973 * horizonY * 0.62;
        const twinkle = 0.5 + 0.5 * Math.sin(now * 0.002 + i);
        ctx.globalAlpha = 0.25 + twinkle * 0.6;
        const r = i % 7 === 0 ? 1.6 : 1;
        ctx.fillRect(sx, sy, r, r);
      }
      ctx.globalAlpha = 1;

      const sunR = Math.min(width * 0.17, horizonY * 0.82);
      const sunX = width / 2;
      const sunCY = horizonY - sunR * 0.18;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, width, horizonY);
      ctx.clip();
      const halo = ctx.createRadialGradient(sunX, sunCY, sunR * 0.6, sunX, sunCY, sunR * 2.1);
      halo.addColorStop(0, 'rgba(255, 120, 160, 0.45)');
      halo.addColorStop(1, 'rgba(255, 60, 140, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, width, horizonY);
      const sunGrad = ctx.createLinearGradient(0, sunCY - sunR, 0, sunCY + sunR);
      sunGrad.addColorStop(0, '#ffe66d');
      sunGrad.addColorStop(0.5, '#ff9f43');
      sunGrad.addColorStop(1, '#ff2d95');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(sunX, sunCY, sunR, 0, Math.PI * 2);
      ctx.fill();
      // แถบตัดแนวนอนแบบซินธ์เวฟ
      ctx.fillStyle = '#7a1f6e';
      for (let k = 0; k < 6; k++) {
        const by = sunCY + sunR * (0.08 + k * 0.17);
        const bh = Math.max(1.5, sunR * (0.025 + k * 0.012));
        ctx.fillRect(sunX - sunR, by, sunR * 2, bh);
      }
      ctx.restore();

      // ภูเขาไกล (สีม่วงเข้ม) + เมืองไซเบอร์เต็มความกว้างจอ
      ctx.fillStyle = '#1d0b3a';
      ctx.beginPath();
      ctx.moveTo(0, horizonY);
      for (let i = 0; i <= 12; i++) {
        const mx = (i / 12) * width;
        const peak = horizonY - (14 + ((i * 53) % 37)) * S * (i % 2 === 0 ? 1.2 : 0.7);
        ctx.lineTo(mx, peak);
      }
      ctx.lineTo(width, horizonY);
      ctx.closePath();
      ctx.fill();

      const cityShift = (sim.distance * 0.02) % 60;
      let bX = -cityShift * S;
      let bi = 0;
      while (bX < width) {
        const bW = (26 + ((bi * 37) % 34)) * S;
        const bH = (22 + ((bi * 61) % 58)) * S;
        // เว้นช่องตรงกลางให้เห็นดวงอาทิตย์
        const center = bX + bW / 2;
        if (Math.abs(center - width / 2) > sunR * 0.75) {
          ctx.fillStyle = '#140728';
          ctx.fillRect(bX, horizonY - bH, bW, bH);
          ctx.fillStyle = bi % 3 === 0 ? 'rgba(34, 211, 238, 0.85)' : 'rgba(255, 45, 149, 0.8)';
          for (let wy = horizonY - bH + 5 * S; wy < horizonY - 4 * S; wy += 9 * S) {
            for (let wx = bX + 4 * S; wx < bX + bW - 5 * S; wx += 8 * S) {
              if (((wx * 7 + wy * 3 + bi) | 0) % 5 !== 0) ctx.fillRect(wx, wy, 2.5 * S, 3 * S);
            }
          }
        }
        bX += bW + 6 * S;
        bi++;
      }

      // ----------------------------------------------------
      // GROUND: ตารางนีออนเคลื่อนที่เต็มจอ (ไม่มีพื้นที่ดำค้างภาพเก่าอีก)
      // ----------------------------------------------------
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      groundGrad.addColorStop(0, '#1a0b33');
      groundGrad.addColorStop(1, '#07030f');
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, width, groundH);

      ctx.strokeStyle = nitro ? 'rgba(34, 211, 238, 0.32)' : 'rgba(255, 45, 149, 0.28)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        const t = Math.pow((i + scroll) / 14, 2.2);
        const gy = horizonY + groundH * t;
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
        ctx.stroke();
      }
      for (let i = -12; i <= 12; i++) {
        ctx.beginPath();
        ctx.moveTo(width / 2 + i * width * 0.03, horizonY);
        ctx.lineTo(width / 2 + i * width * 0.22, height);
        ctx.stroke();
      }
      // หมอกเส้นขอบฟ้า
      const fog = ctx.createLinearGradient(0, horizonY - 6, 0, horizonY + groundH * 0.18);
      fog.addColorStop(0, 'rgba(255, 77, 141, 0.55)');
      fog.addColorStop(1, 'rgba(255, 77, 141, 0)');
      ctx.fillStyle = fog;
      ctx.fillRect(0, horizonY - 6, width, groundH * 0.18 + 6);

      // ----------------------------------------------------
      // ROAD: ทางด่วน 3 เลนแบบเปอร์สเปกทีฟ
      // ----------------------------------------------------
      const roadTopWidth = width * 0.16;
      const roadBottomWidth = Math.min(width * 0.98, height * 1.9);
      const roadTopLeft = (width - roadTopWidth) / 2;
      const roadBottomLeft = (width - roadBottomWidth) / 2;

      // t = 0 ที่ขอบฟ้า, 1 ที่ขอบล่าง — ทุกอย่างบนถนนใช้ t เดียวกัน จึงอยู่ตรงเลนเสมอ
      const roadXAt = (ratio: number, t: number) => {
        const topX = roadTopLeft + roadTopWidth * ratio;
        const botX = roadBottomLeft + roadBottomWidth * ratio;
        return topX + (botX - topX) * t;
      };
      const yAt = (t: number) => horizonY + groundH * t;
      const tAtProgress = (p: number) => Math.pow(Math.max(0, p), 1.8);
      const laneRatios = [1 / 6, 3 / 6, 5 / 6];

      const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      roadGrad.addColorStop(0, '#1c1733');
      roadGrad.addColorStop(1, '#0d0a1c');
      ctx.fillStyle = roadGrad;
      ctx.beginPath();
      ctx.moveTo(roadXAt(0, 0), horizonY);
      ctx.lineTo(roadXAt(1, 0), horizonY);
      ctx.lineTo(roadXAt(1, 1), height);
      ctx.lineTo(roadXAt(0, 1), height);
      ctx.closePath();
      ctx.fill();

      // เลนที่รถอยู่ — พรมแสงบอกตำแหน่ง
      const lane = car.currentLane;
      const laneCarpet = ctx.createLinearGradient(0, horizonY, 0, height);
      laneCarpet.addColorStop(0, 'rgba(255, 255, 255, 0)');
      laneCarpet.addColorStop(1, nitro ? 'rgba(34, 211, 238, 0.22)' : 'rgba(250, 204, 21, 0.14)');
      ctx.fillStyle = laneCarpet;
      ctx.beginPath();
      ctx.moveTo(roadXAt(lane / 3, 0), horizonY);
      ctx.lineTo(roadXAt((lane + 1) / 3, 0), horizonY);
      ctx.lineTo(roadXAt((lane + 1) / 3, 1), height);
      ctx.lineTo(roadXAt(lane / 3, 1), height);
      ctx.closePath();
      ctx.fill();

      // ขอบถนนลายแดง-ขาว (rumble strip) เคลื่อนที่ตามความเร็ว
      const stripCount = 16;
      for (let i = 0; i < stripCount; i++) {
        const t1 = Math.pow((i + scroll) / stripCount, 2.2);
        const t2 = Math.pow((i + scroll + 1) / stripCount, 2.2);
        if (t1 > 1) continue;
        const t2c = Math.min(1, t2);
        ctx.fillStyle = i % 2 === 0 ? '#f8fafc' : accent;
        const edgeW = 0.022;
        for (const [a, b] of [[-edgeW, 0], [1, 1 + edgeW]] as const) {
          ctx.beginPath();
          ctx.moveTo(roadXAt(a, t1), yAt(t1));
          ctx.lineTo(roadXAt(b, t1), yAt(t1));
          ctx.lineTo(roadXAt(b, t2c), yAt(t2c));
          ctx.lineTo(roadXAt(a, t2c), yAt(t2c));
          ctx.closePath();
          ctx.fill();
        }
      }
      // เส้นนีออนขอบถนน
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(roadXAt(0, 0), horizonY);
      ctx.lineTo(roadXAt(0, 1), height);
      ctx.moveTo(roadXAt(1, 0), horizonY);
      ctx.lineTo(roadXAt(1, 1), height);
      ctx.stroke();

      // เส้นแบ่งเลนแบบประ
      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      const dashCount = 10;
      for (let i = 0; i < dashCount; i++) {
        const t1 = Math.pow((i + scroll) / dashCount, 2.2);
        const t2 = Math.pow((i + scroll + 0.45) / dashCount, 2.2);
        if (t2 > 1) continue;
        for (const ratio of [1 / 3, 2 / 3]) {
          const w1 = (1 + 5 * t1) * S * 0.5;
          const w2 = (1 + 5 * t2) * S * 0.5;
          ctx.beginPath();
          ctx.moveTo(roadXAt(ratio, t1) - w1, yAt(t1));
          ctx.lineTo(roadXAt(ratio, t2) - w2, yAt(t2));
          ctx.lineTo(roadXAt(ratio, t2) + w2, yAt(t2));
          ctx.lineTo(roadXAt(ratio, t1) + w1, yAt(t1));
          ctx.closePath();
          ctx.fill();
        }
      }

      // เส้นความเร็วตอนใช้ไนโตร
      if (nitro) {
        ctx.strokeStyle = 'rgba(165, 243, 252, 0.55)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 14; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const off = ((now * 0.9 + i * 137) % 1000) / 1000;
          const x0 = width / 2 + side * width * (0.12 + (i % 5) * 0.05) * (0.3 + off);
          const y0 = horizonY + groundH * off * 0.9;
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x0 + side * width * 0.08 * off, y0 + groundH * 0.12 * off);
          ctx.stroke();
        }
      }

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
        nextQuestionTimeRef.current = 12000; // interval between questions
      }

      // ห่อข้อความ (รองรับภาษาไทยที่ไม่มีช่องว่าง) ให้ไม่เกิน maxW และไม่เกิน maxLines บรรทัด
      const wrapText = (text: string, maxW: number, maxLines: number) => {
        const lines: string[] = [];
        let cur = '';
        for (const ch of Array.from(text)) {
          const next = cur + ch;
          if (ctx.measureText(next).width > maxW && cur) {
            lines.push(cur);
            cur = ch.trimStart();
            if (lines.length === maxLines) break;
          } else {
            cur = next;
          }
        }
        if (lines.length < maxLines && cur) lines.push(cur);
        if (lines.length === maxLines && lines.join('').length < text.length) {
          const last = lines[maxLines - 1];
          lines[maxLines - 1] = last.slice(0, Math.max(1, last.length - 1)) + '…';
        }
        return lines;
      };
      const roundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
      };

      // Update & Draw Question Gate
      if (questionGateRef.current) {
        const gate = questionGateRef.current;
        // Move gate forward based on speed
        gate.progress += dt * (car.speedKmH / 180) * 0.12;

        const p = gate.progress;
        const t = tAtProgress(p);
        const y = yAt(Math.min(t, 1.2));
        const k = 0.28 + 0.72 * Math.min(t, 1); // ขนาดตามระยะ
        const gateLeft = roadXAt(-0.02, t);
        const gateRight = roadXAt(1.02, t);
        const gateW = gateRight - gateLeft;
        const panelH = Math.max(30, 110 * S * k);
        const postTop = y - panelH - 18 * S * k;

        // เสาและคานของซุ้ม
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(gateLeft - 4 * S * k, postTop, 6 * S * k, y - postTop);
        ctx.fillRect(gateRight - 2 * S * k, postTop, 6 * S * k, y - postTop);
        ctx.fillStyle = accent;
        ctx.fillRect(gateLeft, postTop, gateW, Math.max(2, 5 * S * k));

        const laneColors = ['#38bdf8', '#facc15', '#c084fc'];
        const letters = ['A', 'B', 'C'];
        const panelW = (gateW / 3) * 0.9;
        for (let l = 0; l < 3; l++) {
          const cx = roadXAt(laneRatios[l], t);
          const px = cx - panelW / 2;
          const py = postTop + 8 * S * k;
          const isPlayerLane = car.currentLane === l;

          roundRect(px, py, panelW, panelH, Math.max(4, 10 * S * k));
          ctx.fillStyle = isPlayerLane ? 'rgba(12, 74, 110, 0.95)' : 'rgba(15, 23, 42, 0.92)';
          ctx.fill();
          ctx.lineWidth = Math.max(1.5, (isPlayerLane ? 4 : 2.5) * S * k);
          ctx.strokeStyle = laneColors[l];
          ctx.stroke();

          // ป้ายตัวอักษรเลนขนาดใหญ่
          const badgeR = Math.max(8, 15 * S * k);
          ctx.fillStyle = laneColors[l];
          ctx.beginPath();
          ctx.arc(cx, py + badgeR + 5 * S * k, badgeR, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#0f172a';
          ctx.font = `800 ${Math.round(badgeR * 1.25)}px "Prompt", sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(letters[l], cx, py + badgeR + 5 * S * k + 1);

          // ข้อความคำตอบ (แสดงเมื่อป้ายใหญ่พอให้อ่านออก)
          const fontPx = Math.round(Math.max(13, 18 * S * k));
          if (panelW > 64 && panelH > 44) {
            ctx.fillStyle = '#f8fafc';
            ctx.font = `600 ${fontPx}px "Prompt", sans-serif`;
            const lines = wrapText(gate.question.choices[l], panelW - 12 * S * k, 2);
            const textTop = py + badgeR * 2 + 10 * S * k;
            lines.forEach((ln, idx) => {
              ctx.fillText(ln, cx, textTop + fontPx * 0.6 + idx * fontPx * 1.2);
            });
          }
        }

        // Check if gate reaches player
        if (p >= 0.85 && !gate.passed) {
          gate.passed = true;
          setTotalQuestionsAsked((t) => t + 1);

          const isCorrect = car.currentLane === gate.question.correctIndex;
          if (isCorrect) {
            // Correct answer!
            sfxCorrect();
            setCorrectAnswersCount((c) => c + 1);
            const bonusPts = 100 * sim.combo;
            sim.combo += 1;
            sim.maxCombo = Math.max(sim.maxCombo, sim.combo);
            sim.score += bonusPts;
            setCombo(sim.combo);
            setMaxCombo(sim.maxCombo);
            setScore(Math.floor(sim.score));
            setNitroGauge((g) => Math.min(100, g + 25));
            showTransientFeedback({
              text: `🎉 ถูกต้อง! +${bonusPts} แต้ม (คอมโบ x${sim.combo})`,
              type: 'correct',
              detail: gate.question.explanation,
            });
          } else {
            // Wrong answer!
            sfxWrong();
            sim.combo = 1;
            setCombo(1);
            if (sim.hasShield) {
              sim.hasShield = false;
              setHasShield(false);
              showTransientFeedback({
                text: `🛡️ เกราะป้องกันช่วยรับดาเมจ!`,
                type: 'info',
                detail: `คำตอบที่ถูกคือ: ${gate.question.choices[gate.question.correctIndex]}`,
              });
            } else {
              sim.lives -= 1;
              setLives(sim.lives);
              if (sim.lives <= 0) {
                endGame();
              } else {
                showTransientFeedback({
                  text: `💥 ผิดเลน! เสีย 1 หัวใจ (คำตอบที่ถูก: ${gate.question.choices[gate.question.correctIndex]})`,
                  type: 'wrong',
                  detail: gate.question.explanation,
                });
              }
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

        const t = tAtProgress(p);
        const itemY = yAt(t);
        const itemX = roadXAt(laneRatios[entity.lane], t);
        const scale = (0.25 + 0.95 * t) * S;

        // Collision Check with Player
        if (p >= 0.78 && p <= 0.92 && entity.lane === car.currentLane) {
          // Collected or Hit!
          if (entity.type === 'coin') {
            sfxCoin();
            sim.score += 25;
            setScore(Math.floor(sim.score));
            setCoinsCollected((c) => c + 1);
            setNitroGauge((g) => Math.min(100, g + 8));
          } else if (entity.type === 'nitro') {
            sfxCoin();
            car.nitroDurationMs = 3500;
            sim.isNitroActive = true;
            setIsNitroActive(true);
            setNitroGauge(100);
            playSfxTone(520, 0.2, 'sawtooth', 0.12);
          } else if (entity.type === 'shield') {
            sfxCoin();
            sim.hasShield = true;
            setHasShield(true);
            sim.lives = Math.min(maxLives, sim.lives + 1);
            setLives(sim.lives);
          } else if (entity.type === 'cone') {
            if (car.invulnerableMs <= 0) {
              if (sim.hasShield) {
                sim.hasShield = false;
                setHasShield(false);
                car.invulnerableMs = 800;
              } else {
                sfxWrong();
                car.speedKmH = Math.max(100, car.speedKmH - 50);
                sim.lives -= 1;
                setLives(sim.lives);
                if (sim.lives <= 0) {
                  endGame();
                }
                car.invulnerableMs = 1000;
              }
            }
          }
          continue; // Remove collected entity
        }

        // เงาใต้ไอเท็ม
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(itemX, itemY + 2 * scale, 15 * scale, 4.5 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.translate(itemX, itemY - 16 * scale);
        ctx.scale(scale, scale);
        const bob = Math.sin(now * 0.006 + entity.id) * 2;
        ctx.translate(0, bob);

        if (entity.type === 'coin') {
          // เหรียญทองหมุน
          const spin = Math.abs(Math.cos(now * 0.005 + entity.id));
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.ellipse(0, 0, 14 * Math.max(0.25, spin), 14, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(0, 0, 11.5 * Math.max(0.2, spin), 11.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#fff7d6';
          ctx.fillRect(-1.5 * spin, -7, 3 * spin, 14);
        } else if (entity.type === 'nitro') {
          // ถังไนโตร + สายฟ้า
          roundRect(-10, -16, 20, 32, 5);
          ctx.fillStyle = '#0e7490';
          ctx.fill();
          roundRect(-8, -14, 16, 28, 4);
          ctx.fillStyle = '#22d3ee';
          ctx.fill();
          ctx.fillStyle = '#ecfeff';
          ctx.beginPath();
          ctx.moveTo(2, -10);
          ctx.lineTo(-5, 1);
          ctx.lineTo(0, 1);
          ctx.lineTo(-2, 10);
          ctx.lineTo(5, -2);
          ctx.lineTo(0, -2);
          ctx.closePath();
          ctx.fill();
        } else if (entity.type === 'shield') {
          // ฟองพลังงาน + โล่
          ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.strokeStyle = '#7dd3fc';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(0, 0, 16, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(8, -5);
          ctx.quadraticCurveTo(7, 6, 0, 10);
          ctx.quadraticCurveTo(-7, 6, -8, -5);
          ctx.closePath();
          ctx.fill();
        } else if (entity.type === 'cone') {
          // กรวยจราจร
          ctx.fillStyle = '#1f2937';
          ctx.fillRect(-14, 12, 28, 5);
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(-3, -18);
          ctx.lineTo(3, -18);
          ctx.lineTo(12, 13);
          ctx.lineTo(-12, 13);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.moveTo(-6.5, -2);
          ctx.lineTo(6.5, -2);
          ctx.lineTo(8.3, 4);
          ctx.lineTo(-8.3, 4);
          ctx.closePath();
          ctx.fill();
        }

        ctx.restore();
        activeEntities.push(entity);
      }
      roadEntitiesRef.current = activeEntities;

      // ----------------------------------------------------
      // DRAW PLAYER RACER CAR (อยู่กึ่งกลางเลนตามเปอร์สเปกทีฟจริง)
      // ----------------------------------------------------
      const tPlayer = (playerY - horizonY) / groundH;
      const playerLaneX = roadXAt(car.carX, tPlayer);
      const laneWidthAtPlayer = (roadBottomWidth - roadTopWidth) * tPlayer / 3 + roadTopWidth / 3;
      const carScale = Math.min(laneWidthAtPlayer / 112, 1.45 * S);

      // แสงนีออนใต้ท้องรถ
      const glow = ctx.createRadialGradient(playerLaneX, playerY + 18 * carScale, 4, playerLaneX, playerY + 18 * carScale, 52 * carScale);
      glow.addColorStop(0, nitro ? 'rgba(34, 211, 238, 0.55)' : 'rgba(255, 45, 149, 0.45)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.fillRect(playerLaneX - 60 * carScale, playerY - 20 * carScale, 120 * carScale, 80 * carScale);

      ctx.save();
      ctx.translate(playerLaneX, playerY);
      ctx.scale(carScale, carScale);
      ctx.rotate((car.tilt * Math.PI) / 180);

      // Invulnerability flicker
      if (car.invulnerableMs > 0 && Math.floor(now / 100) % 2 === 0) {
        ctx.globalAlpha = 0.4;
      }

      // Exhaust Boost Flames
      const flameLength = nitro ? 34 + Math.random() * 18 : 10 + Math.random() * 7;
      for (const fx of [-11, 11]) {
        const fg = ctx.createLinearGradient(0, 30, 0, 30 + flameLength);
        fg.addColorStop(0, nitro ? '#ecfeff' : '#fff7ed');
        fg.addColorStop(0.35, nitro ? '#22d3ee' : '#fb923c');
        fg.addColorStop(1, 'rgba(255, 0, 80, 0)');
        ctx.fillStyle = fg;
        ctx.beginPath();
        ctx.moveTo(fx - 5, 30);
        ctx.quadraticCurveTo(fx, 30 + flameLength * 1.1, fx + 5, 30);
        ctx.closePath();
        ctx.fill();
      }

      // เงารถ
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(0, 6, 34, 30, 0, 0, Math.PI * 2);
      ctx.fill();

      // ล้อ
      ctx.fillStyle = '#0b0f19';
      for (const [wx, wy] of [[-27, -20], [27, -20], [-28, 17], [28, 17]]) {
        roundRect(wx - 5, wy - 9, 10, 18, 3);
        ctx.fill();
      }

      // ตัวถัง
      const carGrad = ctx.createLinearGradient(-26, 0, 26, 0);
      carGrad.addColorStop(0, '#7f1d1d');
      carGrad.addColorStop(0.25, '#dc2626');
      carGrad.addColorStop(0.5, '#f87171');
      carGrad.addColorStop(0.75, '#dc2626');
      carGrad.addColorStop(1, '#7f1d1d');
      ctx.fillStyle = carGrad;
      ctx.beginPath();
      ctx.moveTo(0, -40);
      ctx.bezierCurveTo(16, -40, 22, -30, 23, -18);
      ctx.lineTo(25, 18);
      ctx.quadraticCurveTo(25, 30, 14, 31);
      ctx.lineTo(-14, 31);
      ctx.quadraticCurveTo(-25, 30, -25, 18);
      ctx.lineTo(-23, -18);
      ctx.bezierCurveTo(-22, -30, -16, -40, 0, -40);
      ctx.closePath();
      ctx.fill();

      // แถบลายกลางรถ
      ctx.fillStyle = nitro ? '#22d3ee' : '#facc15';
      ctx.fillRect(-3.5, -39, 7, 70);

      // กระจกห้องโดยสาร
      const glassGrad = ctx.createLinearGradient(0, -18, 0, 10);
      glassGrad.addColorStop(0, '#7dd3fc');
      glassGrad.addColorStop(0.45, '#0369a1');
      glassGrad.addColorStop(1, '#0b1220');
      ctx.fillStyle = glassGrad;
      ctx.beginPath();
      ctx.moveTo(-15, -12);
      ctx.quadraticCurveTo(0, -22, 15, -12);
      ctx.lineTo(13, 9);
      ctx.quadraticCurveTo(0, 12, -13, 9);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.moveTo(-10, -12);
      ctx.lineTo(-3, -15);
      ctx.lineTo(-7, 2);
      ctx.closePath();
      ctx.fill();

      // สปอยเลอร์ + ไฟท้าย
      ctx.fillStyle = '#111827';
      roundRect(-29, 25, 58, 7, 2);
      ctx.fill();
      ctx.fillStyle = '#ff1f5a';
      ctx.fillRect(-23, 31, 11, 3);
      ctx.fillRect(12, 31, 11, 3);

      // Shield Bubble Aura if active
      if (sim.hasShield) {
        ctx.strokeStyle = 'rgba(125, 211, 252, 0.9)';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(0, -2, 44, 48, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore();

      // ขอบมืดรอบจอ (vignette) ให้สายตาไปที่ถนน
      const vig = ctx.createRadialGradient(width / 2, height * 0.6, height * 0.35, width / 2, height * 0.6, Math.max(width, height) * 0.85);
      vig.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vig.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [gameState, maxLives, endGame, playSfxTone, showTransientFeedback]);

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

      {/* Quick Switch to Claw Empire Platformer */}

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

      {/* Docked Question Cockpit Bar (Non-overlapping! Never covers the 3D road/horizon) */}
      <div className="cr-question-dock" aria-live="polite">
        {currentQuestionHUD ? (
          <div className="cr-question-hud-card">
            <div className="cr-q-badge">
              <Sparkles size={15} /> โจทย์ซิ่งตอบคำถาม — เลี้ยวรถหรือกดเลือกเลนคำตอบที่ถูกต้อง!
            </div>
            <div className="cr-q-text">{currentQuestionHUD.question}</div>
            <div className="cr-q-lanes" role="group" aria-label="เลือกเลนคำตอบ">
              <button
                type="button"
                className={`cr-lane-hint ${activeLane === 0 ? 'selected' : ''}`}
                onClick={() => steerTo(0)}
              >
                <span className="cr-lane-key">⬅️ เลนซ้าย [A]:</span> {currentQuestionHUD.choices[0]}
              </button>
              <button
                type="button"
                className={`cr-lane-hint ${activeLane === 1 ? 'selected' : ''}`}
                onClick={() => steerTo(1)}
              >
                <span className="cr-lane-key">⬆️ เลนกลาง [B]:</span> {currentQuestionHUD.choices[1]}
              </button>
              <button
                type="button"
                className={`cr-lane-hint ${activeLane === 2 ? 'selected' : ''}`}
                onClick={() => steerTo(2)}
              >
                <span className="cr-lane-key">➡️ เลนขวา [C]:</span> {currentQuestionHUD.choices[2]}
              </button>
            </div>
          </div>
        ) : (
          <div className="cr-ready-hud-pill">
            <Zap size={15} className="text-cyan-400" />
            <span>
              {gameState === 'playing'
                ? 'ทางด่วนไซเบอร์... ซุ้มคำถามถัดไปกำลังพุ่งเข้ามา! (เก็บเหรียญ 🪙 ไนโตร ⚡ หลบกรวย 🚧)'
                : 'พร้อมซิ่ง! กดปุ่ม “เริ่มซิ่งเลย!” เพื่อเข้าสู่ทางด่วนไซเบอร์'}
            </span>
          </div>
        )}
      </div>

      {/* Main Game Screen Canvas Viewport */}
      <div className="cr-viewport">
        <canvas
          ref={canvasRef}
          width={720}
          height={440}
          className="cr-canvas"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        />

        {/* Quick Feedback Toast (Bottom-pinned, auto-clears in 2.2s, never blocks road horizon) */}
        {feedbackBanner && (
          <div className={`cr-viewport-toast ${feedbackBanner.type}`}>
            <div className="cr-fb-title">{feedbackBanner.text}</div>
            {feedbackBanner.detail && <div className="cr-fb-detail">{feedbackBanner.detail}</div>}
          </div>
        )}

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
