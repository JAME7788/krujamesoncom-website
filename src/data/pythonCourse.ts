// วิชาเลือก: Python พื้นฐาน ม.1–ม.3 (ฉบับสมบูรณ์ ลุงวิศวกร สอนคำนวณ & ครูเจมส์)
// สังเคราะห์จากหลักสูตร Basic Python (115 สไลด์) และ Class & OOP (69 สไลด์)
import type { Grade } from './curriculum';
import type { LearningFile, UnitExtras } from './unitExtras';
import { spreadAnswers } from '../utils/answerOrder';

export const PYTHON_COURSE_ID = 'python-basic';
export const PYTHON_COLAB_URL = 'https://colab.research.google.com/drive/1LX9m98_z61SltgFRQBMdOnVbuT6CrfwJ?usp=sharing';

export const pythonBasicCourse: Grade = {
  id: PYTHON_COURSE_ID,
  emoji: '🐍',
  title: 'Python พื้นฐาน ม.1–ม.3 (ฉบับครูเจมส์ & ลุงวิศวกร)',
  courseUrl: `/curriculum/${PYTHON_COURSE_ID}/unit/1`,
  indicators: [
    {
      code: 'PY-1',
      text: 'อธิบายประวัติและความสำคัญของภาษา Python ติดตั้ง Python และ VS Code ร่วมกับ Extensions สำคัญ อธิบายความต่างของโหมดสคริปต์กับอินเทอร์แอกทีฟ และเขียนคำสั่งแสดงผล print() และรับข้อมูล input() ได้',
      lessons: [0, 1],
      activities: ['ติดตั้ง Python 3 และ VS Code พร้อม Extensions และเขียนโปรแกรมทักทายแรก print("Hello World!")'],
    },
    {
      code: 'PY-2',
      text: 'ตั้งชื่อตัวแปรตามกติกาสากล จำแนก 4 ชนิดข้อมูลหลัก (int, float, str, bool) ตรวจสอบด้วยคำสั่ง type() และแปลงชนิดข้อมูล (Type Casting) เพื่อนำไปคำนวณได้ถูกต้อง',
      lessons: [1, 2],
      activities: ['จำแนกชื่อตัวแปรที่ถูกต้องตามกฎ และแปลงข้อความที่รับมาจาก input() เป็นตัวเลขเพื่อคำนวณ'],
    },
    {
      code: 'PY-3',
      text: 'ใช้ตัวดำเนินการทางคณิตศาสตร์ทั้ง 7 ตัว (+, -, *, /, //, %, **) ตามลำดับความสำคัญ PEMDAS และใช้ตัวดำเนินการเปรียบเทียบและตรรกะ (and, or, not) ในการแก้โจทย์ชีวิตจริงได้',
      lessons: [2],
      activities: ['เขียนโปรแกรมคำนวณเงินทอนเหรียญและธนบัตรด้วย // และ % และคำนวณแปลงอุณหภูมิ C เป็น F'],
    },
    {
      code: 'PY-4',
      text: 'ออกแบบและเขียนโปรแกรมที่มีทางเลือก (if, if-elif-else, match-case) และการวนซ้ำ (for, while) พร้อมใช้คำสั่งควบคุม break, continue และ enumerate ได้อย่างถูกต้อง',
      lessons: [3, 5],
      activities: ['เขียนโปรแกรมตัดเกรดด้วย if-elif-else และสร้างเกมทายตัวเลขปริศนาด้วย while loop'],
    },
    {
      code: 'PY-5',
      text: 'จัดการข้อความด้วย String Slicing และ f-string ใช้โครงสร้างข้อมูลชุด (List, Tuple, Dictionary, Set) และประยุกต์ใช้โมดูล turtle ในการเขียนโค้ดวาดรูปทรงเรขาคณิตได้',
      lessons: [4],
      activities: ['ตัดต่อข้อความด้วย Slicing สร้างลิสต์รายชื่อ และสั่งเต่าไพทอนวาดรูปหลายเหลี่ยมและบ้าน'],
    },
    {
      code: 'PY-6',
      text: 'สร้างฟังก์ชันด้วย def กำหนดพารามิเตอร์และส่งค่ากลับด้วย return เรียกใช้โมดูลมาตรฐาน (random, math, time) จัดการไฟล์ Text/CSV/JSON และดักจับข้อผิดพลาดด้วย try-except ได้',
      lessons: [6],
      activities: ['สร้างฟังก์ชันคำนวณพื้นที่ บันทึกผลลัพธ์ลงไฟล์ text และป้องกันโปรแกรมหยุดทำงานด้วย try-except'],
    },
    {
      code: 'PY-7',
      text: 'ใช้เครื่องมือ Data Science (NumPy, Pandas, Matplotlib) วิเคราะห์ข้อมูลและพล็อตกราฟ และเข้าใจพื้นฐานการเขียนโปรแกรมเชิงวัตถุ (OOP: Class, Object, __init__ และ 4 เสาหลัก) ได้',
      lessons: [7],
      activities: ['อ่านไฟล์ CSV ด้วย pandas พล็อตกราฟด้วย matplotlib และออกแบบพิมพ์เขียว Class สัตว์เลี้ยงหรือหุ่นยนต์'],
    },
  ],
  lessons: [
    { name: 'สมุด Colab ต้นฉบับของครู (เปิดรันโค้ดได้ทันที)', url: PYTHON_COLAB_URL },
    { name: 'ห้องฝึก Python ในเว็บ (รันโค้ดได้เลย ไม่ต้องติดตั้ง)', url: '/games/coding-studio' },
    { name: 'Google Colab — เขียน Python ออนไลน์ฟรี', url: 'https://colab.research.google.com/' },
    { name: 'คู่มือ Python ฉบับทางการ (python.org)', url: 'https://docs.python.org/3/tutorial/' },
    { name: 'ดาวน์โหลด Visual Studio Code สำหรับเขียนโค้ด', url: 'https://code.visualstudio.com/Download' },
    { name: 'คู่มือ pandas เริ่มต้นวิเคราะห์ข้อมูล', url: 'https://pandas.pydata.org/docs/getting_started/index.html' },
    { name: 'คู่มือ Matplotlib การสร้างกราฟและชาร์ต', url: 'https://matplotlib.org/stable/tutorials/index.html' },
  ],
  units: [
    {
      no: 1,
      title: 'เริ่มต้นกับ Python: รู้จัก ติดตั้ง และคำสั่งแรก',
      indicators: [0],
      topics: [
        'ประวัติ Python สร้างโดย Guido van Rossum (1990) ชื่อมาจากรายการ Monty Python เป็นภาษาระดับสูงที่คนทั่วโลกนิยมสูงสุด',
        'การติดตั้ง Python 3.14 จาก python.org: ต้องติ๊กถูก "Add python.exe to PATH" และติดตั้งไปที่ C:\\Python314',
        'การติดตั้ง Visual Studio Code (VS Code) และส่วนขยายที่จำเป็น: Python, Pylance, Material Icon',
        'โหมดการทำงาน: Interactive REPL (ทดสอบคำสั่งทีละบรรทัด) vs Script Mode (เขียนเป็นไฟล์ .py แล้วรันซ้ำได้)',
        'คำสั่งแสดงผล print("Hello World!") และการรับข้อความจากแป้นพิมพ์ด้วย input()',
      ],
      activities: [
        'ติดตั้ง Python และ VS Code บนเครื่อง หรือเปิด Google Colab เพื่อเริ่มเขียนโค้ด',
        'พิมพ์ print("Hello World!") และทดลองแสดงผลข้อความหลายบรรทัด',
        'เขียนโปรแกรมถามชื่อผู้ใช้ด้วย input() แล้วตอบกลับคำทักทายอย่างเป็นมิตร',
      ],
    },
    {
      no: 2,
      title: 'ตัวแปรและชนิดข้อมูลพื้นฐาน',
      indicators: [1],
      topics: [
        'ตัวแปร (Variables) เปรียบเสมือนกล่องเก็บข้อมูล กำหนดค่าด้วยเครื่องหมาย = เช่น score = 100',
        'กฎเหล็ก 5 ข้อในการตั้งชื่อตัวแปร: ใช้ตัวอักษร ตัวเลข และ _ ห้ามขึ้นต้นด้วยตัวเลข ตัวพิมพ์เล็ก-ใหญ่ต่างกัน (case-sensitive) และห้ามซ้ำคำสงวน',
        '4 ชนิดข้อมูลหลัก: ข้อความ (str), จำนวนเต็ม (int), ทศนิยม (float), และค่าความจริง (bool) ตรวจสอบด้วย type()',
        'การแปลงชนิดข้อมูล (Type Casting): ข้อมูลที่ได้จาก input() เป็น str เสมอ ต้องแปลงด้วย int() หรือ float() ก่อนคำนวณ',
      ],
      activities: [
        'ตรวจสอบและจำแนกชื่อตัวแปร 10 ชื่อว่าชื่อใดถูกต้องตามกฎสากล พร้อมบอกเหตุผล',
        'ใช้ฟังก์ชัน type() ตรวจสอบค่าต่าง ๆ เช่น 25, 3.14, "Hello", True และ "True"',
        'เขียนโปรแกรมรับอายุของผู้ใช้ แปลงเป็น int แล้วคำนวณว่าอีกกี่ปีจะอายุครบ 20 ปี',
      ],
    },
    {
      no: 3,
      title: 'ตัวดำเนินการทางคณิตศาสตร์และตรรกะ',
      indicators: [2],
      topics: [
        'ตัวดำเนินการคณิตศาสตร์ 7 ตัว: บวก (+), ลบ (-), คูณ (*), หาร (/), หารปัดเศษทิ้ง (//), เศษจากการหาร (%), และยกกำลัง (**)',
        'ลำดับการคำนวณ (PEMDAS): วงเล็บ () -> ยกกำลัง ** -> คูณ/หาร/ปัดเศษ/มอดุโล * / // % -> บวก/ลบ + -',
        'ตัวดำเนินการกับข้อความ: ใช้ + เชื่อมข้อความ และใช้ * ทำซ้ำข้อความ เช่น "55" * 3 ได้ "555555"',
        'ตัวดำเนินการเปรียบเทียบ (==, !=, >, <, >=, <=) และตรรกะ (and, or, not) ให้ผลลัพธ์เป็น True หรือ False',
        'การแก้โจทย์ชีวิตจริง: การคำนวณเงินทอนเหรียญและธนบัตร, การแปลงอุณหภูมิ, และการคำนวณค่า BMI',
      ],
      activities: [
        'เขียนโปรแกรมเครื่องคิดเงินทอน: แปลงจำนวนเงินทอนเป็นธนบัตร 20 บาท และเหรียญ 1 บาท ด้วย // และ %',
        'เขียนสูตรคำนวณแปลงอุณหภูมิจากเซลเซียสเป็นฟาเรนไฮต์: F = (C * 9/5) + 32',
        'ทดสอบเงื่อนไขทางตรรกะ and, or, not เพื่อตรวจว่าคะแนนสอบผ่านเกณฑ์หรือไม่',
      ],
    },
    {
      no: 4,
      title: 'การตัดสินใจและการวนซ้ำ (Control Flow)',
      indicators: [3],
      topics: [
        'คำสั่งเงื่อนไข if, if-else, และ if-elif-else สำหรับสร้างทางเลือกหลายเงื่อนไข เช่น การตัดเกรดคะแนนสอบ',
        'โครงสร้างทางเลือก match...case (Python 3.10+) ช่วยให้การเลือกคำสั่งมีความกระชับและอ่านง่าย',
        'การวนซ้ำด้วย for loop ร่วมกับฟังก์ชัน range(start, stop, step) สำหรับทำซ้ำตามจำนวนรอบที่แน่นอน',
        'การวนซ้ำด้วย while loop สำหรับทำซ้ำจนกว่าเงื่อนไขจะเป็นเท็จ และการป้องกัน Infinite Loop',
        'คำสั่งควบคุมการวนซ้ำ: break (หยุดลูปทันที), continue (ข้ามไปรอบถัดไป), และ enumerate() (นับลำดับรอบพร้อมสมาชิก)',
      ],
      activities: [
        'เขียนโปรแกรมตัดเกรด A, B, C, D, F จากคะแนน 0-100 ด้วยคำสั่ง if-elif-else',
        'เขียนโปรแกรมพิมพ์สูตรคูณแม่ 2 ถึงแม่ 12 ด้วยการวนซ้ำ for loop ซ้อนกัน',
        'สร้างเกมทายตัวเลขปริศนา 1-100 ด้วย while loop ที่บอกว่า "มากไป" หรือ "น้อยไป" จนกว่าจะทายถูก',
      ],
    },
    {
      no: 5,
      title: 'การจัดการข้อความ โครงสร้างข้อมูล และเต่าไพทอน',
      indicators: [4],
      topics: [
        'การจัดการข้อความ (String Slicing): การตัดข้อความด้วย [start:stop:step] และฟังก์ชันข้อความ len(), upper(), lower(), replace()',
        'การจัดรูปแบบข้อความสมัยใหม่: f-string เช่น f"สวัสดี {name} คุณมีคะแนน {score} แต้ม" อ่านง่ายและมีประสิทธิภาพสูง',
        'โครงสร้างข้อมูล Collection 4 แบบ: List (เรียงลำดับ ปรับเปลี่ยนได้ []), Tuple (คงที่ ห้ามแก้ ()), Dictionary (เก็บแบบคู่ Key:Value {}), และ Set (ข้อมูลไม่ซ้ำกัน {})',
        'เมธอดสำคัญของ List: append() เพิ่มท้าย, insert() แทรกตำแหน่ง, remove() ลบค่า, pop() เอาตัวท้ายออก',
        'โมดูลเต่าไพทอน (turtle): ฝึกคิดเชิงอัลกอริทึม สั่งเต่า forward(), backward(), left(), right() วาดรูปทรงเรขาคณิตและลวดลายสวยงาม',
      ],
      activities: [
        'ฝึกตัดตัวอักษรจากคำว่า "PYTHON PROGRAMMING" ด้วย String Slicing รูปแบบต่าง ๆ',
        'สร้างระบบจัดการสมุดรายชื่อเพื่อนและเบอร์โทรศัพท์ด้วย Dictionary และ List',
        'เขียนโค้ดสั่งเต่าไพทอนวาดรูปหกเหลี่ยมด้านเท่า และรูปดาว 5 แฉก ด้วยการวนซ้ำ for loop',
      ],
    },
    {
      no: 6,
      title: 'ฟังก์ชัน โมดูล และการดักจับข้อผิดพลาด',
      indicators: [5],
      topics: [
        'การสร้างฟังก์ชันด้วยคำสั่ง def ชื่อฟังก์ชัน(พารามิเตอร์): และการส่งผลลัพธ์กลับด้วย return',
        'ความต่างระหว่าง print() (แสดงออกจอ) กับ return (ส่งค่ากลับไปคำนวณต่อในโปรแกรม) และขอบเขตตัวแปร Local vs Global',
        'โมดูลมาตรฐานยอดนิยมใน Python: random (สุ่มตัวเลข), math (ฟังก์ชันคณิตศาสตร์), time (จัดการเวลา), webbrowser และ pyautogui',
        'การสร้าง Custom Module: แยกโค้ดเป็นไฟล์ .py แล้วเรียกใช้งานด้วย import หรือ from ... import ...',
        'การดักจับข้อผิดพลาด (Exception Handling): โครงสร้าง try...except...else...finally เพื่อป้องกันโปรแกรมแครชเมื่อพบ ZeroDivisionError หรือ FileNotFoundError',
      ],
      activities: [
        'สร้างฟังก์ชันคำนวณพื้นที่วงกลมและพื้นที่สามเหลี่ยมที่มีการ return ค่าออกมา',
        'สร้างเกมลูกเต๋าเสี่ยงทายโดยใช้โมดูล random.randint() และ time.sleep()',
        'เขียนโปรแกรมรับค่าตัวเลข 2 ตัวมาหารกัน พร้อมดักจับข้อผิดพลาด ZeroDivisionError และ ValueError',
      ],
    },
    {
      no: 7,
      title: 'การเขียนอ่านไฟล์และการจัดการข้อมูลเบื้องต้น',
      indicators: [5],
      topics: [
        'การเปิดและบันทึกไฟล์ข้อความ (.txt) ด้วย with open("file.txt", "w", encoding="utf-8") as f:',
        'โหมดการทำงานกับไฟล์: "r" (อ่านไฟล์), "w" (เขียนทับใหม่), และ "a" (เขียนต่อท้าย)',
        'การทำงานกับไฟล์ข้อมูลตาราง Comma-Separated Values (.csv) ด้วยโมดูล csv (csv.reader, csv.writer)',
        'การจัดการข้อมูลโครงสร้าง JSON (.json) ด้วยโมดูล json (json.dump, json.load)',
        'การเขียน Unit Testing เบื้องต้นด้วยโมดูล unittest เพื่อตรวจสอบความถูกต้องของฟังก์ชันอัตโนมัติ',
      ],
      activities: [
        'เขียนโปรแกรมบันทึกไดอารี่ประจำวันลงในไฟล์ข้อความ diary.txt ด้วยโหมด append',
        'เขียนโปรแกรมอ่านรายชื่อนักเรียนและคะแนนสอบจากไฟล์ student.csv มาคำนวณคะแนนเฉลี่ย',
        'เขียนเทสต์เคสแบบอัตโนมัติ 3 ข้อด้วย unittest เพื่อทดสอบฟังก์ชันคำนวณเกรด',
      ],
    },
    {
      no: 8,
      title: 'เครื่องมือ Data Science และการเขียนโปรแกรมเชิงวัตถุ (OOP)',
      indicators: [6],
      topics: [
        'แนะนำเครื่องมือ Data Science ระดับโลก: NumPy (คำนวณอาร์เรย์หลายมิติความเร็วสูง) และ Pandas (วิเคราะห์ตาราง Series & DataFrame)',
        'การสร้างชาร์ตและกราฟข้อมูลด้วย Matplotlib: พล็อตเส้น (plot), แท่ง (bar), และฮิสโทแกรม (hist)',
        'แนวคิดการเขียนโปรแกรมเชิงวัตถุ (OOP): Class คือแม่แบบ/พิมพ์เขียว และ Object คือสิ่งที่สร้างขึ้นจริงตามแม่แบบ',
        'ส่วนประกอบของคลาส: Attributes (คุณลักษณะ/ข้อมูล) และ Methods (พฤติกรรม/ฟังก์ชัน)',
        'ฟังก์ชัน Constructor __init__() และการใช้ตัวแปร self อ้างอิงตัวตนของวัตถุ',
        '4 เสาหลักของ OOP: Inheritance (การสืบทอด), Encapsulation (การห่อหุ้มซ่อนข้อมูล), Abstraction (การซ่อนรายละเอียด), และ Polymorphism (การพ้องรูป)',
      ],
      activities: [
        'ใช้ pandas อ่านไฟล์ studentData.csv สรุปค่าเฉลี่ยคะแนนและเรียงลำดับข้อมูล',
        'สร้างแผนภูมิแท่งแสดงคะแนนสอบของนักเรียนด้วย matplotlib.pyplot',
        'ออกแบบ Class รถยนต์ (Car) หรือ Class ตัวละครเกม (Player) พร้อม Constructor __init__ และเมธอดแสดงพลัง',
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// เนื้อหาเสริมรายหน่วย: บทนำ วิดีโอ แบบฝึกในเว็บ ไฟล์ และแบบทดสอบสั้น
// ---------------------------------------------------------------------------
const yt = (q: string) => ({ title: q, query: q });
const colabFile: LearningFile = {
  title: 'สมุด Colab ต้นฉบับของครูเจมส์',
  url: PYTHON_COLAB_URL,
  source: 'Google Colab',
  desc: 'เปิดแล้วกด "รัน" ทีละช่องเพื่อลองโค้ดตัวอย่างได้ทันที',
  kind: 'web',
};
const practiceRoom = {
  title: 'ห้องฝึก Python ในเว็บ',
  desc: 'เขียนและรันโค้ดได้ทันที พร้อมตรวจคำตอบอัตโนมัติ (โจทย์ชุด ipst)',
  url: '/games/coding-studio',
  emoji: '🐍',
  noLogin: true,
};

const rawUnitExtras: Record<number, UnitExtras> = {
  1: {
    intro: 'ก้าวแรกสู่อาณาจักรโปรแกรมเมอร์: รู้จักประวัติและพลังของ Python ติดตั้ง Python 3 + VS Code และสั่งคอมพิวเตอร์พิมพ์ข้อความแรก print("Hello World!")',
    videos: [yt('สอน Python เบื้องต้น print input ภาษาไทย'), yt('ติดตั้ง Python และ VS Code ภาษาไทย')],
    fun: [practiceRoom],
    files: [colabFile],
    quiz: [
      { q: 'คำสั่งใดใน Python ใช้แสดงผลข้อความออกทางหน้าจอ?', options: ['print()', 'input()', 'type()'], answer: 0, explain: 'print() คือคำสั่งมาตรฐานในการแสดงผลข้อความออกสู่หน้าจอ' },
      { q: 'ในการติดตั้ง Python บน Windows ข้อใดสำคัญที่สุดเพื่อให้พิมพ์คำสั่ง python ใน terminal ได้ทุกที่?', options: ['ติ๊กถูก Add python.exe to PATH', 'ปิดโปรแกรมแอนตี้ไวรัส', 'ติดตั้งลงไดรฟ์ D'], answer: 0, explain: 'Add to PATH ช่วยให้ระบบปฏิบัติการรู้จักคำสั่ง python จากทุกโฟลเดอร์' },
      { q: 'เมื่อผู้ใช้พิมพ์ข้อความผ่านคำสั่ง input() ค่าที่ได้จะถูกส่งกลับมาเป็นชนิดข้อมูลใดเสมอ?', options: ['ข้อความ (str)', 'จำนวนเต็ม (int)', 'จำนวนจริง (float)'], answer: 0, explain: 'input() จะรับข้อมูลเป็น string (str) เสมอ แม้ว่าเราจะพิมพ์ตัวเลขก็ตาม' },
    ],
  },
  2: {
    intro: 'ตัวแปรคือกล่องวิเศษเก็บข้อมูล: รู้จักกฎเหล็ก 5 ข้อในการตั้งชื่อตัวแปร เรียนรู้ 4 ชนิดข้อมูลหลัก และวิธีแปลงชนิดข้อมูล (Type Casting) เพื่อนำไปคำนวณอย่างถูกต้อง',
    videos: [yt('ตัวแปร Python ชนิดข้อมูล str int float'), yt('Python แปลงชนิดข้อมูล int() float()')],
    fun: [practiceRoom],
    files: [colabFile],
    quiz: [
      { q: 'ชื่อตัวแปรข้อใดตั้งชื่อถูกต้องตามกฎของ Python?', options: ['student_score', '2nd_score', 'for'], answer: 0, explain: 'ห้ามขึ้นต้นด้วยตัวเลข (2nd_score) และห้ามใช้คำสงวนของภาษา (for)' },
      { q: 'คำสั่ง type(3.14159) จะให้ผลลัพธ์ชนิดข้อมูลใด?', options: ['float', 'int', 'str'], answer: 0, explain: 'ตัวเลขที่มีจุดทศนิยมจัดเป็นชนิด float (Floating-point number)' },
      { q: 'หากต้องการนำข้อมูลตัวเลขที่รับมาจาก input() ไปคำนวณทางคณิตศาสตร์ ต้องใช้คำสั่งใดแปลงข้อมูล?', options: ['int() หรือ float()', 'str()', 'print()'], answer: 0, explain: 'ต้องแปลงจาก str เป็น int (จำนวนเต็ม) หรือ float (ทศนิยม) ก่อนนำไปบวกลบคูณหาร' },
    ],
  },
  3: {
    intro: 'ฝึกสมองประลองคำนวณ: ตัวดำเนินการ 7 ชนิด ลำดับความสำคัญ PEMDAS ตัวดำเนินการเปรียบเทียบและตรรกะ สู่การแก้โจทย์ชีวิตจริง เช่น เครื่องคิดเงินทอนและแปลงอุณหภูมิ',
    videos: [yt('ตัวดำเนินการ Python // % ** ภาษาไทย'), yt('Python PEMDAS ลำดับการคำนวณ')],
    fun: [practiceRoom],
    files: [colabFile],
    quiz: [
      { q: 'ผลลัพธ์ของคำสั่ง 17 // 5 ใน Python คือข้อใด?', options: ['3', '2', '3.4'], answer: 0, explain: '// คือตัวดำเนินการหารปัดเศษทิ้ง (Floor Division) 17 หาร 5 ได้ 3 เศษ 2 ปัดเศษทิ้งเหลือ 3' },
      { q: 'ผลลัพธ์ของคำสั่ง 17 % 5 คือข้อใด?', options: ['2', '3', '3.4'], answer: 0, explain: '% คือตัวดำเนินการ Modulo หาเศษจากการหาร 17 หาร 5 เหลือเศษ 2' },
      { q: 'ตามลำดับการคำนวณ (PEMDAS) ข้อใดทำงานก่อนเสมอ?', options: ['วงเล็บ ()', 'ยกกำลัง **', 'การคูณและหาร * /'], answer: 0, explain: 'การคำนวณในวงเล็บ () มีลำดับความสำคัญสูงสุดเสมอ' },
    ],
  },
  4: {
    intro: 'ควบคุมทิศทางโปรแกรมอย่างชาญฉลาด: สร้างทางเลือกด้วย if-elif-else และ match-case ทำซ้ำด้วย for และ while พร้อมใช้ break, continue และ enumerate อย่างมืออาชีพ',
    videos: [yt('Python if elif else สอนภาษาไทย'), yt('Python for loop range สอนภาษาไทย')],
    fun: [practiceRoom, { title: 'เกม Coding Maze', desc: 'ฝึกคิดแบบวนซ้ำและเงื่อนไขก่อนเขียนโค้ดจริง', url: '/games/coding-maze', emoji: '🧭', noLogin: true }],
    files: [colabFile],
    quiz: [
      { q: 'คำสั่ง for i in range(1, 6) จะวนซ้ำทั้งหมดกี่รอบ และ i มีค่าใดบ้าง?', options: ['5 รอบ (ค่า 1, 2, 3, 4, 5)', '6 รอบ (ค่า 1 ถึง 6)', '5 รอบ (ค่า 0 ถึง 4)'], answer: 0, explain: 'range(1, 6) เริ่มจาก 1 ถึงก่อน 6 (คือ 5) รวม 5 รอบ' },
      { q: 'คำสั่งใดใช้หยุดการทำงานของลูปทันทีโดยไม่ต้องรอให้ครบรอบ?', options: ['break', 'continue', 'pass'], answer: 0, explain: 'break สั่งให้หลุดออกจากลูปทันที ส่วน continue จะข้ามไปรอบถัดไป' },
      { q: 'เมื่อมีเงื่อนไขหลายทางเลือกซ้อนกัน เช่น การตัดเกรด A, B, C, D, F ควรใช้โครงสร้างใด?', options: ['if...elif...else', 'if...else', 'for loop'], answer: 0, explain: 'elif (else if) ใช้สำหรับตรวจสอบเงื่อนไขถัดไปเมื่อเงื่อนไขแรกเป็นเท็จ' },
    ],
  },
  5: {
    intro: 'จัดการข้อมูลเป็นชุดอย่างทรงพลัง: ตัดต่อข้อความด้วย Slicing ใช้ f-string ทันสมัย รู้จัก List, Tuple, Dictionary, Set และสั่งเต่าไพทอนวาดรูปเรขาคณิตสุดตระการตา',
    videos: [yt('Python String Slicing สอนภาษาไทย'), yt('Python List Dictionary ภาษาไทย')],
    fun: [{ title: 'Algorithm Runner 3D', desc: 'ฝึกสั่งตัวละครเดินและเลี้ยวตามลำดับ คล้ายเต่าไพทอน', url: '/games/algorithm-runner-3d', emoji: '🤖', noLogin: true }],
    files: [colabFile],
    quiz: [
      { q: 'หาก text = "PYTHON" คำสั่ง text[0:3] จะได้ข้อความใด?', options: ['PYT', 'PYTHON', 'PYTH'], answer: 0, explain: 'Slicing [0:3] จะตัดตัวอักษรตำแหน่ง 0, 1, 2 รวม 3 ตัว คือ "PYT"' },
      { q: 'โครงสร้างข้อมูลชนิดใดใน Python ที่เก็บข้อมูลแบบคู่ "Key: Value"?', options: ['Dictionary', 'List', 'Tuple'], answer: 0, explain: 'Dictionary ใช้วงเล็บปีกกา {} เก็บข้อมูลแบบคู่คีย์และค่า เช่น {"name": "James", "score": 95}' },
      { q: 'เมธอดใดของ List ใช้สำหรับเพิ่มสมาชิกใหม่ต่อท้ายลิสต์?', options: ['.append()', '.insert()', '.push()'], answer: 0, explain: 'append() เป็นคำสั่งเพิ่มข้อมูลใหม่ต่อท้ายลิสต์' },
    ],
  },
  6: {
    intro: 'สร้างโค้ดที่มีระเบียบและเสถียรภาพ: แยกฟังก์ชันด้วย def และ return นำเข้าโมดูลมาตรฐานระดับเทพ (random, math, time) และป้องกันโปรแกรมพังด้วย try-except',
    videos: [yt('Python function def return สอนภาษาไทย'), yt('Python try except สอนภาษาไทย')],
    fun: [practiceRoom],
    files: [colabFile],
    quiz: [
      { q: 'คำสั่งใดใช้ส่งค่าผลลัพธ์กลับมาจากฟังก์ชันเพื่อให้ส่วนอื่นนำไปใช้งานต่อ?', options: ['return', 'print()', 'def'], answer: 0, explain: 'return ส่งค่ากลับไปให้ตัวแปรหรือคำสั่งที่เรียกใช้ฟังก์ชัน' },
      { q: 'หากต้องการสุ่มตัวเลขจำนวนเต็มระหว่าง 1 ถึง 6 (ลูกเต๋า) ควรใช้โมดูลและคำสั่งใด?', options: ['random.randint(1, 6)', 'math.random(1, 6)', 'time.rand(1, 6)'], answer: 0, explain: 'random.randint(a, b) สุ่มตัวเลขจำนวนเต็มระหว่าง a ถึง b แบบรวมขอบเขต' },
      { q: 'บล็อกคำสั่งใดใน try-except จะทำงานเสมอไม่ว่าจะเกิด error หรือไม่ก็ตาม?', options: ['finally', 'except', 'else'], answer: 0, explain: 'finally จะทำงานเสมอเป็นขั้นตอนสุดท้าย ไม่ว่าโปรแกรมจะเกิดข้อผิดพลาดหรือไม่' },
    ],
  },
  7: {
    intro: 'บันทึกข้อมูลถาวรสู่อนาคต: จัดการไฟล์ Text (.txt) ไฟล์ตาราง CSV และ JSON ด้วย with open() พร้อมเขียน Unit Testing แบบอัตโนมัติด้วยโมดูล unittest',
    videos: [yt('Python เขียนอ่านไฟล์ with open สอนภาษาไทย'), yt('Python CSV JSON ภาษาไทย')],
    fun: [practiceRoom],
    files: [colabFile],
    quiz: [
      { q: 'โหมดใดในการเปิดไฟล์ด้วยคำสั่ง open() ใช้สำหรับการเขียนข้อมูลต่อท้ายไฟล์เดิมโดยไม่ลบข้อมูลเก่า?', options: ['"a" (append)', '"w" (write)', '"r" (read)'], answer: 0, explain: 'โหมด "a" ย่อมาจาก append ใช้เขียนต่อท้าย ส่วน "w" จะลบเขียนทับใหม่' },
      { q: 'ทำไมจึงควรใช้โครงสร้าง with open(...) ในการจัดการไฟล์ใน Python?', options: ['ระบบจะปิดไฟล์ให้อัตโนมัติเมื่อทำงานเสร็จ', 'ทำให้เขียนไฟล์เร็วขึ้น 10 เท่า', 'ช่วยบีบอัดขนาดไฟล์'], answer: 0, explain: 'with statement จะรับประกันการปิดไฟล์ (close) อัตโนมัติ ป้องกันข้อมูลสูญหาย' },
      { q: 'โมดูลมาตรฐานใดของ Python ที่ใช้อ่านและบันทึกไฟล์ตารางข้อมูลที่มีเครื่องหมายจุลภาคคั่น?', options: ['csv', 'json', 'excel'], answer: 0, explain: 'โมดูล csv ใช้สำหรับประมวลผลไฟล์ Comma-Separated Values โดยเฉพาะ' },
    ],
  },
  8: {
    intro: 'ก้าวสู่การเป็น Data Scientist & Software Architect: ใช้ NumPy, Pandas และ Matplotlib วิเคราะห์ข้อมูล พร้อมเข้าใจสถาปัตยกรรม OOP (Class, Object, Constructor และ 4 เสาหลัก)',
    videos: [yt('pandas วิเคราะห์ข้อมูล สอนภาษาไทย'), yt('Python OOP Class Object สอนภาษาไทย')],
    fun: [practiceRoom],
    files: [
      colabFile,
      { title: 'ไฟล์ข้อมูลนักเรียน studentData.csv', url: 'https://raw.githubusercontent.com/adminho/machine-learning/master/Datasets/studentData.csv', source: 'ไฟล์ฝึก (สสวท.)', kind: 'web' },
      { title: 'ไฟล์คะแนนวิทยาศาสตร์ sciScore.csv', url: 'https://raw.githubusercontent.com/adminho/machine-learning/master/Datasets/sciScore.csv', source: 'ไฟล์ฝึก (สสวท.)', kind: 'web' },
    ],
    quiz: [
      { q: 'ในโลกของการเขียนโปรแกรมเชิงวัตถุ (OOP) สิ่งใดเปรียบเสมือน "แม่แบบ" หรือ "พิมพ์เขียว"?', options: ['Class', 'Object / Instance', 'Method'], answer: 0, explain: 'Class คือแม่แบบหรือแบบพิมพ์เขียว ส่วน Object คือวัตถุจริงที่สร้างขึ้นจากคลาสนั้น' },
      { q: 'เมธอดพิเศษใดในคลาสของ Python ทำหน้าที่เป็น Constructor ถูกเรียกทำงานทันทีเมื่อสร้าง Object?', options: ['__init__()', '__main__()', '__build__()'], answer: 0, explain: '__init__() คือ Constructor ทำหน้าที่กำหนดค่าเริ่มต้นให้แก่ Object ทันทีที่ถูกสร้าง' },
      { q: 'หลักการใดของ OOP หมายถึงการที่คลาสลูกได้รับคุณลักษณะและเมธอดมาจากคลาสแม่?', options: ['Inheritance (การสืบทอด)', 'Encapsulation (การห่อหุ้ม)', 'Polymorphism (การพ้องรูป)'], answer: 0, explain: 'Inheritance ช่วยให้คลาสใหม่นำความสามารถของคลาสเดิมมาต่อยอดได้โดยไม่ต้องเขียนใหม่' },
    ],
  },
};

// ผู้เขียนใส่คำตอบที่ถูกไว้ตัวเลือกแรกเสมอ — กระจายตำแหน่งคำตอบก่อนส่งออก ไม่ให้เด็กเดาได้
export const pythonUnitExtras: Record<number, UnitExtras> = Object.fromEntries(
  Object.entries(rawUnitExtras).map(([no, extras]) => [
    Number(no),
    { ...extras, quiz: extras.quiz ? spreadAnswers(extras.quiz, Number(no)) : undefined },
  ]),
);
