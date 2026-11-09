// สไลด์เขียนมือสำหรับวิชาเลือก "Python พื้นฐาน ม.1–ม.3"
//
// เนื้อหาเรียบเรียงจากสมุด Colab ของครูเจมส์ (ดู src/data/pythonCourse.ts)
// ทุกแผ่นที่มีโค้ดใช้ฟิลด์ code ให้เด็กอ่านและพิมพ์ตามได้ทันที
// ตัวอย่างที่ต้นฉบับคำนวณผิด แก้ให้ถูกแล้ว:
//   - เงินทอน: สินค้า 117 บาท จ่าย 200 บาท ทอน 83 บาท (ต้นฉบับพิมพ์เป็น 200 - 177)
//   - พื้นที่สี่เหลี่ยม = กว้าง × ยาว (ต้นฉบับเป็น w*1)
//   - ค่าเฉลี่ย 5 วิชา = ผลรวม ÷ 5 (ต้นฉบับหารด้วย 100)
//   - turtle ใช้ hideturtle() (ต้นฉบับสะกด hiddeturtle)
//
// ข้อกำหนดเดียวกับชุดอื่น: ห้ามอีโมจิช่วง U+1FA70–U+1FAFF, แผ่นแรกเป็นหน้าปก,
// แผ่นสุดท้ายเป็นการตรวจความเข้าใจ, บูลเล็ตห้ามลอกหัวข้อของแผ่น

import type { RichSlide } from './richSlides';
import { moveCorrectTo } from '../utils/answerOrder';

const py_1: RichSlide[] = [
  {
    title: 'เริ่มต้นกับ Python',
    emoji: '🐍',
    theme: 'green',
    layout: 'cover',
    body: 'Python เป็นภาษาโปรแกรมที่อ่านง่ายเหมือนภาษาอังกฤษ ใช้สร้างได้ตั้งแต่เกม เว็บไซต์ ไปจนถึง AI วันนี้เราจะสั่งให้คอมพิวเตอร์พูดและฟังเราเป็นครั้งแรก',
  },
  {
    title: 'เขียน Python ได้ที่ไหนบ้าง',
    emoji: '💻',
    theme: 'blue',
    layout: 'comparison',
    compareLeft: {
      title: 'ติดตั้งบนเครื่อง',
      emoji: '🖥️',
      items: ['ใช้โปรแกรม เช่น PyCharm', 'ทำงานได้แม้ไม่มีอินเทอร์เน็ต', 'เหมาะกับงานใหญ่หลายไฟล์'],
    },
    compareRight: {
      title: 'เขียนออนไลน์',
      emoji: '🌐',
      items: ['ใช้ Google Colab หรือห้องฝึก Python ในเว็บนี้', 'ไม่ต้องติดตั้งอะไรเลย', 'เปิดจากเครื่องไหนก็ได้'],
    },
  },
  {
    title: 'สองโหมดของการรันโปรแกรม',
    emoji: '▶️',
    theme: 'orange',
    bullets: [
      { emoji: '📄', text: 'โหมดสคริปต์ (Script mode)', sub: 'เขียนคำสั่งทั้งหมดลงไฟล์ แล้วรันทีเดียว แก้ไขและรันซ้ำได้' },
      { emoji: '💬', text: 'โหมดอินเทอร์แอกทีฟ (Interactive mode)', sub: 'พิมพ์ทีละคำสั่งแล้วเห็นผลทันที เหมาะกับการทดลอง' },
      { emoji: '🏃', text: '"รัน" ไม่ได้แปลว่าวิ่ง', sub: 'แต่หมายถึงสั่งให้คอมพิวเตอร์ทำงานตามโปรแกรมที่เขียน' },
    ],
  },
  {
    title: 'print() — สั่งให้คอมพิวเตอร์พูด',
    emoji: '📢',
    theme: 'yellow',
    body: 'print() แสดงข้อความหรือค่าออกทางหน้าจอ ข้อความต้องอยู่ในเครื่องหมายคำพูด " " หรือ \' \' ส่วนตัวเลขใส่ได้เลย',
    code: {
      lang: 'python',
      content: 'print("Hello World!")\nprint("สวัสดีชาวโลก")\nprint(2026)',
    },
    callout: { type: 'tip', emoji: '💡', text: 'ลืมปิดเครื่องหมายคำพูดเป็นข้อผิดพลาดที่พบบ่อยที่สุด ตรวจให้มีคู่เปิด-ปิดเสมอ' },
  },
  {
    title: 'input() — สั่งให้คอมพิวเตอร์ฟัง',
    emoji: '👂',
    theme: 'purple',
    body: 'input() แสดงคำถาม รอให้ผู้ใช้พิมพ์ แล้วส่งสิ่งที่พิมพ์กลับมาเป็นข้อความ เราเก็บไว้ในตัวแปรเพื่อใช้ต่อได้',
    code: {
      lang: 'python',
      content: 'name = input("Please enter your name: ")\nprint("สวัสดี", name)',
    },
    teachingNote: {
      explain: 'โปรแกรมหยุดรอที่ input() จนกว่าผู้ใช้จะกด Enter',
      example: 'ถ้าพิมพ์ มานะ จอจะแสดง สวัสดี มานะ',
      prompt: 'ลองเปลี่ยนคำถามให้ถามสีที่ชอบ แล้วตอบกลับว่า "ฉันก็ชอบสี..."',
    },
  },
  {
    title: 'ตรวจความเข้าใจ: แสดงผลและรับข้อมูล',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '📢', text: 'print() ใช้แสดงผลออกทางจอ' },
      { emoji: '👂', text: 'input() ใช้รับข้อมูลที่ผู้ใช้พิมพ์' },
      { emoji: '📄', text: 'โหมดสคริปต์เก็บโค้ดไว้ในไฟล์ รันซ้ำได้' },
    ],
    quickCheck: {
      question: 'โค้ด print("3+4") จะแสดงอะไรบนจอ?',
      choices: ['3+4', '7', 'เกิดข้อผิดพลาด'],
      answer: 0,
      feedback: 'ถูกต้อง! สิ่งที่อยู่ในเครื่องหมายคำพูดคือข้อความ Python จึงแสดง 3+4 ตามตัวอักษร ถ้าอยากได้ 7 ให้เขียน print(3+4)',
    },
  },
];

const py_2: RichSlide[] = [
  {
    title: 'ตัวแปรและชนิดข้อมูล',
    emoji: '📦',
    theme: 'blue',
    layout: 'cover',
    body: 'ตัวแปรเหมือนกล่องที่มีชื่อติดไว้ ใช้เก็บข้อมูลไว้เรียกใช้ภายหลัง ข้อมูลแต่ละอย่างมีชนิดต่างกัน และคอมพิวเตอร์จัดการแต่ละชนิดไม่เหมือนกัน',
  },
  {
    title: 'สร้างตัวแปรด้วยเครื่องหมาย =',
    emoji: '🏷️',
    theme: 'yellow',
    body: 'เครื่องหมาย = ในการเขียนโปรแกรมแปลว่า "เก็บค่าทางขวาไว้ในชื่อทางซ้าย" ไม่ใช่ "เท่ากับ" แบบคณิตศาสตร์ ค่าในตัวแปรเปลี่ยนได้ตลอด',
    code: {
      lang: 'python',
      content: 'c = 16\nname = "somchai"\n\nd = c      # d ได้ค่า 16 จาก c\nd = 15     # เปลี่ยนค่า d ใหม่ c ยังเป็น 16\nprint(c, d)  # 16 15',
    },
  },
  {
    title: 'กติกาตั้งชื่อตัวแปร',
    emoji: '📏',
    theme: 'orange',
    bullets: [
      { emoji: '🔤', text: 'ใช้ได้แค่ตัวอักษร ตัวเลข และขีดล่าง _', sub: 'เช่น send_email, number0844, _move' },
      { emoji: '🚫', text: 'ห้ามขึ้นต้นด้วยตัวเลข', sub: '1name ใช้ไม่ได้ แต่ name1 ใช้ได้' },
      { emoji: '🔠', text: 'ตัวพิมพ์เล็กและใหญ่ถือว่าต่างกัน', sub: 'Count กับ count เป็นคนละตัวแปร' },
      { emoji: '🔒', text: 'ห้ามใช้คำสงวน เช่น if, for, while, def, True', sub: 'และไม่ควรตั้งชื่อชนกับ print, input, type' },
    ],
  },
  {
    title: 'ชนิดข้อมูลพื้นฐาน 3 แบบ',
    emoji: '🧮',
    theme: 'purple',
    bullets: [
      { emoji: '💬', text: 'str (ข้อความ)', sub: 'อยู่ในเครื่องหมายคำพูด เช่น "สสวท." ถ้าหลายบรรทัดใช้ """ ครอบ' },
      { emoji: '🔢', text: 'int (จำนวนเต็ม)', sub: 'เช่น 16, -3, 0' },
      { emoji: '📐', text: 'float (จำนวนจริง/ทศนิยม)', sub: 'เช่น 12.14, -0.5' },
    ],
    code: {
      lang: 'python',
      content: 'print(type(16))       # <class \'int\'>\nprint(type("16"))     # <class \'str\'>\nprint(type(3 + 5))    # <class \'int\'>\nprint(type("3+5"))    # <class \'str\'>',
    },
  },
  {
    title: 'แปลงชนิดข้อมูลก่อนคำนวณ',
    emoji: '🔄',
    theme: 'red',
    body: 'สิ่งที่ได้จาก input() เป็นข้อความ (str) เสมอ แม้ผู้ใช้พิมพ์ตัวเลข ต้องแปลงด้วย int() หรือ float() ก่อนนำไปคำนวณ',
    code: {
      lang: 'python',
      content: 'totalPrice = int(input("ค่าอาหารทั้งหมด "))\nnumber = int(input("จำนวนผู้รับประทานอาหาร "))\navg = totalPrice / number\nprint("จ่ายค่าอาหารคนละ", avg, "บาท")',
    },
    callout: { type: 'warn', emoji: '⚠️', text: 'ถ้าลืม int() แล้วเอา "500" มาหาร จะเกิดข้อผิดพลาด TypeError' },
  },
  {
    title: 'ตรวจความเข้าใจ: ตัวแปรและชนิดข้อมูล',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '🏷️', text: 'ตัวแปรเก็บค่าด้วย = และเปลี่ยนค่าได้' },
      { emoji: '🧮', text: 'ชนิดข้อมูลหลักคือ str int float ตรวจด้วย type()' },
      { emoji: '🔄', text: 'ค่าจาก input() ต้องแปลงเป็นตัวเลขก่อนคำนวณ' },
    ],
    quickCheck: {
      question: 'ชื่อตัวแปรใดใช้ไม่ได้ใน Python?',
      choices: ['2score', 'score_2', '_score'],
      answer: 0,
      feedback: 'ถูกต้อง! ชื่อตัวแปรห้ามขึ้นต้นด้วยตัวเลข ส่วน score_2 และ _score ใช้ได้ตามกติกา',
    },
  },
];

const py_3: RichSlide[] = [
  {
    title: 'ตัวดำเนินการและโจทย์คำนวณ',
    emoji: '➗',
    theme: 'orange',
    layout: 'cover',
    body: 'คอมพิวเตอร์คิดเลขได้เร็วมาก ถ้าเราบอกสูตรถูก บทนี้เราจะใช้เครื่องหมายคำนวณของ Python แก้โจทย์ที่เจอจริง เช่น ทอนเงิน หาพื้นที่ และแปลงหน่วย',
  },
  {
    title: 'เครื่องหมายคำนวณ 7 ตัว',
    emoji: '🔢',
    theme: 'blue',
    bullets: [
      { emoji: '➕', text: '+  -  *  /  บวก ลบ คูณ หาร', sub: '7 / 2 ได้ 3.5' },
      { emoji: '⚡', text: '**  ยกกำลัง', sub: '4 ** 3 ได้ 64' },
      { emoji: '✂️', text: '//  หารแล้วปัดเศษทิ้ง', sub: '7 // 3 ได้ 2' },
      { emoji: '🧩', text: '%  เศษที่เหลือจากการหาร', sub: '7 % 3 ได้ 1' },
    ],
  },
  {
    title: 'บวกและคูณกับข้อความ',
    emoji: '💬',
    theme: 'purple',
    body: 'เครื่องหมาย + ใช้ต่อข้อความเข้าด้วยกัน ส่วน * ระหว่างข้อความกับจำนวนเต็มจะทำซ้ำข้อความนั้น',
    code: {
      lang: 'python',
      content: 'print("Hello" + "World")      # HelloWorld\nprint("Hello" + " " + "World") # Hello World\nprint(3 * "Hi! ")              # Hi! Hi! Hi!',
    },
  },
  {
    title: 'โจทย์: ทอนเงินอย่างไร',
    emoji: '💰',
    theme: 'yellow',
    body: 'ซื้อแฟลชไดรฟ์ 117 บาท จ่ายด้วยแบงก์ร้อย 2 ใบ ร้านมีแต่ธนบัตร 20 บาทและเหรียญ 1 บาท ต้องทอนอย่างละเท่าไร? ใช้ // หาจำนวนแบงก์ และ % หาเศษที่เหลือเป็นเหรียญ',
    code: {
      lang: 'python',
      content: 'change = 200 - 117      # เงินทอน 83 บาท\nnote20 = change // 20   # ธนบัตร 20 บาท 4 ใบ\ncoin1 = change % 20     # เหรียญ 1 บาท 3 เหรียญ\n\nprint("เงินทอนทั้งหมด", change, "บาท")\nprint("ธนบัตรยี่สิบบาท", note20, "ใบ")\nprint("เหรียญหนึ่งบาท", coin1, "เหรียญ")',
    },
    callout: { type: 'tip', emoji: '🔍', text: 'ตรวจคำตอบเสมอ: 4 × 20 + 3 = 83 บาท ตรงกับเงินทอน' },
  },
  {
    title: 'สูตรที่ใช้บ่อยในชีวิตจริง',
    emoji: '📐',
    theme: 'green',
    code: {
      lang: 'python',
      content: 'year_be = 2569\nprint("ค.ศ.", year_be - 543)           # 2026\n\nf = 55\nprint("องศาเซลเซียส", round((f - 32) / 1.8, 2))  # 12.78\n\nscores = 80 + 75 + 90 + 65 + 70\nprint("ค่าเฉลี่ย", scores / 5)          # 76.0',
    },
    callout: { type: 'warn', emoji: '⚠️', text: 'ค่าเฉลี่ย 5 วิชาต้องหารด้วย 5 (จำนวนวิชา) ไม่ใช่หารด้วยคะแนนเต็ม' },
  },
  {
    title: 'ตรวจความเข้าใจ: ตัวดำเนินการ',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '✂️', text: '// ให้ผลหารแบบปัดเศษทิ้ง' },
      { emoji: '🧩', text: '% ให้เศษจากการหาร' },
      { emoji: '🔍', text: 'ตรวจผลลัพธ์ด้วยการคิดย้อนกลับทุกครั้ง' },
    ],
    quickCheck: {
      question: 'ถ้าเงินทอน 47 บาท ต้องใช้ธนบัตร 20 บาทกี่ใบ (change // 20)?',
      choices: ['2 ใบ', '7 ใบ', '2.35 ใบ'],
      answer: 0,
      feedback: 'ถูกต้อง! 47 // 20 ได้ 2 (ปัดเศษทิ้ง) และ 47 % 20 ได้ 7 คือเหรียญ 1 บาทอีก 7 เหรียญ',
    },
  },
];

const py_4: RichSlide[] = [
  {
    title: 'วนซ้ำด้วย for และทางเลือกด้วย if',
    emoji: '🔁',
    theme: 'purple',
    layout: 'cover',
    body: 'ถ้าต้องทำงานเดิม 100 ครั้ง เราไม่ต้องเขียน 100 บรรทัด ใช้ for สั่งให้วนซ้ำ และถ้าต้องตัดสินใจ ใช้ if ให้โปรแกรมเลือกทางเดินเอง',
  },
  {
    title: 'for — ทำซ้ำตามจำนวนรอบ',
    emoji: '🔁',
    theme: 'blue',
    body: 'range(5) สร้างตัวเลข 0 1 2 3 4 คำสั่งที่ย่อหน้าอยู่ใต้ for จะทำซ้ำทุกรอบ ส่วนบรรทัดที่ไม่ย่อหน้าจะทำหลังวนครบแล้ว',
    code: {
      lang: 'python',
      content: 'name = "มานะ"\nfor x in range(5):\n    print(x, name)\nprint("Bye bye!")',
    },
    callout: { type: 'tip', emoji: '📏', text: 'การย่อหน้าบอกว่าคำสั่งไหนอยู่ในลูป นิยมเว้น 4 ช่อง' },
  },
  {
    title: 'เครื่องหมายเปรียบเทียบ',
    emoji: '⚖️',
    theme: 'orange',
    bullets: [
      { emoji: '◀️', text: '<  น้อยกว่า  และ  >  มากกว่า' },
      { emoji: '🔣', text: '==  เท่ากับ (ใช้ = สองตัว)', sub: '= ตัวเดียวคือการเก็บค่าใส่ตัวแปร' },
      { emoji: '↔️', text: '<=  น้อยกว่าหรือเท่ากับ  และ  >=  มากกว่าหรือเท่ากับ' },
      { emoji: '🚫', text: '!=  ไม่เท่ากับ' },
    ],
  },
  {
    title: 'if และ else — ให้โปรแกรมตัดสินใจ',
    emoji: '🔀',
    theme: 'yellow',
    body: 'เกมทายใจ: ถ้าทายตรงกับเลขลับให้ชม ถ้าไม่ตรงให้บอกว่ายังไม่ถูก',
    code: {
      lang: 'python',
      content: 'puzzle = 3\nguess = int(input("เลขที่ทาย 1-10 คือ "))\n\nif puzzle == guess:\n    print("คุณทายถูกแล้ว")\nelse:\n    print("คุณยังทายไม่ถูก")',
    },
  },
  {
    title: 'ลองทำ: มากไปหรือน้อยไป',
    emoji: '🎯',
    theme: 'red',
    code: {
      lang: 'python',
      content: 'x = int(input("Enter a number: "))\n\nif x < 50:\n    print("Too small")\nif x > 50:\n    print("Too large")\nif x == 50:\n    print("Perfect")',
    },
    teachingNote: {
      explain: 'โปรแกรมตรวจเงื่อนไขทั้ง 3 ข้อทีละข้อ จะมีแค่ข้อเดียวที่เป็นจริง',
      example: 'ป้อน 70 จะได้ Too large',
      prompt: 'ใช้ for ครอบโปรแกรมนี้ ให้ผู้เล่นทายได้ 3 ครั้ง',
    },
  },
  {
    title: 'ตรวจความเข้าใจ: for และ if',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '🔁', text: 'for x in range(n) ทำซ้ำ n รอบ' },
      { emoji: '🔀', text: 'if/else เลือกทำตามเงื่อนไข' },
      { emoji: '🔣', text: 'เปรียบเทียบความเท่ากันใช้ ==' },
    ],
    quickCheck: {
      question: 'for i in range(3): print(i) จะแสดงตัวเลขอะไร?',
      choices: ['0 1 2', '1 2 3', '0 1 2 3'],
      answer: 0,
      feedback: 'ถูกต้อง! range(3) เริ่มนับจาก 0 และหยุดก่อนถึง 3 จึงได้ 0 1 2 ครบ 3 รอบพอดี',
    },
  },
];

const py_5: RichSlide[] = [
  {
    title: 'เต่าไพทอน: วาดรูปด้วยโค้ด',
    emoji: '🐢',
    theme: 'green',
    layout: 'cover',
    body: 'โมดูล turtle มีเต่าตัวน้อยถือปากกาเดินไปตามคำสั่งของเรา ทุกก้าวที่เดินจะกลายเป็นเส้น เราจะใช้การวนซ้ำวาดรูปทรงสวย ๆ ได้ด้วยโค้ดไม่กี่บรรทัด',
  },
  {
    title: 'คำสั่งพื้นฐานของเต่า',
    emoji: '🎮',
    theme: 'blue',
    bullets: [
      { emoji: '⬆️', text: 'forward(100)', sub: 'เดินหน้า 100 ก้าว' },
      { emoji: '↩️', text: 'left(90) / right(90)', sub: 'หมุนซ้าย/ขวา 90 องศา' },
      { emoji: '✏️', text: 'penup() / pendown()', sub: 'ยกปากกา (เดินไม่ทิ้งเส้น) / วางปากกา' },
      { emoji: '🎨', text: 'color("red", "pink")', sub: 'สีเส้นและสีระบาย ใช้คู่กับ begin_fill() และ end_fill()' },
    ],
  },
  {
    title: 'วาดสี่เหลี่ยมด้วยการวนซ้ำ',
    emoji: '⬛',
    theme: 'yellow',
    body: 'สี่เหลี่ยมจัตุรัสคือ "เดินหน้าแล้วเลี้ยวซ้าย 90 องศา" ซ้ำ 4 ครั้ง เขียนด้วย for ได้สั้นกว่าเขียนทีละบรรทัดมาก',
    code: {
      lang: 'python',
      content: 'from turtle import *\nshape("turtle")\nspeed(1)\n\nfor i in range(4):\n    forward(100)\n    left(90)\n\nexitonclick()',
    },
    callout: { type: 'warn', emoji: '🖥️', text: 'turtle เปิดหน้าต่างวาดรูป จึงต้องรันบนคอมพิวเตอร์ (เช่น PyCharm/IDLE) ใน Colab จะไม่แสดงหน้าต่าง' },
  },
  {
    title: 'สูตรมุมของรูปหลายเหลี่ยม',
    emoji: '📐',
    theme: 'purple',
    body: 'เต่าต้องหมุนรวมครบ 360 องศาจึงกลับมาที่เดิม รูปที่มี n ด้านจึงหมุนครั้งละ 360 ÷ n องศา',
    code: {
      lang: 'python',
      content: 'from turtle import *\n\nsides = 6               # ลองเปลี่ยนเป็น 3, 5, 8\nangle = 360 / sides\nfor i in range(sides):\n    forward(80)\n    left(angle)\n\nexitonclick()',
    },
  },
  {
    title: 'ฟังก์ชันวาดบ้าน',
    emoji: '🏠',
    theme: 'orange',
    body: 'แยกงานใหญ่เป็นงานย่อย: ฟังก์ชันวาดสี่เหลี่ยม + ฟังก์ชันวาดสามเหลี่ยม แล้วรวมเป็นบ้าน',
    code: {
      lang: 'python',
      content: 'from turtle import *\n\ndef draw_square(size):\n    pendown()\n    for i in range(4):\n        forward(size)\n        left(90)\n    penup()\n\ndef draw_triangle(size):\n    pendown()\n    for i in range(3):\n        forward(size)\n        left(120)\n    penup()\n\ndef draw_house(size):\n    draw_square(size)\n    left(90)\n    forward(size)\n    right(90)\n    draw_triangle(size)\n\npensize(5)\ndraw_house(50)\nhideturtle()\nexitonclick()',
    },
  },
  {
    title: 'ตรวจความเข้าใจ: เต่าไพทอน',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '🐢', text: 'เต่าวาดเส้นตามทางที่เดิน' },
      { emoji: '🔁', text: 'ใช้ for วาดรูปหลายเหลี่ยมได้สั้น ๆ' },
      { emoji: '📐', text: 'มุมที่หมุน = 360 ÷ จำนวนด้าน' },
    ],
    quickCheck: {
      question: 'ถ้าจะวาดรูปห้าเหลี่ยมด้านเท่า เต่าต้องหมุนครั้งละกี่องศา?',
      choices: ['72 องศา', '90 องศา', '108 องศา'],
      answer: 0,
      feedback: 'ถูกต้อง! 360 ÷ 5 = 72 องศา (108 คือมุมภายในของรูปห้าเหลี่ยม แต่เต่าต้องหมุนตามมุมภายนอก)',
    },
  },
];

const py_6: RichSlide[] = [
  {
    title: 'เงื่อนไขซับซ้อนและการวนซ้ำด้วย while',
    emoji: '⚖️',
    theme: 'red',
    layout: 'cover',
    body: 'ชีวิตจริงมีเงื่อนไขหลายข้อพร้อมกัน และหลายงานไม่รู้ล่วงหน้าว่าต้องทำกี่รอบ บทนี้ใช้ and or not รวมเงื่อนไข, elif เลือกได้หลายทาง และ while วนจนกว่าจะเสร็จ',
  },
  {
    title: 'and or not รวมเงื่อนไข',
    emoji: '🔗',
    theme: 'blue',
    bullets: [
      { emoji: '🤝', text: 'and — จริงเมื่อทุกเงื่อนไขจริง', sub: 'age > 13 and age < 19 (เป็นวัยรุ่น)' },
      { emoji: '🙌', text: 'or — จริงเมื่อมีเงื่อนไขใดเงื่อนไขหนึ่งจริง' },
      { emoji: '🔃', text: 'not — กลับค่าจริงเป็นเท็จ เท็จเป็นจริง' },
    ],
    code: {
      lang: 'python',
      content: 'age = 12\nprint(age > 13 and age < 19)  # False\nprint(age > 13 or age < 19)   # True\nprint(not age > 13)           # True',
    },
  },
  {
    title: 'if-elif-else เมื่อมีหลายทางเลือก',
    emoji: '🚌',
    theme: 'yellow',
    body: 'ค่าโดยสาร: อายุ 60 ปีขึ้นไปจ่ายครึ่งราคา อายุไม่เกิน 3 ปีไม่เสียค่าโดยสาร นอกนั้นจ่ายเต็ม Python ตรวจทีละเงื่อนไขจากบนลงล่าง เจอข้อแรกที่จริงก็หยุด',
    code: {
      lang: 'python',
      content: 'age = int(input("อายุของท่าน คือ "))\n\nif age >= 60:\n    fare = 3.25\nelif age <= 3:\n    fare = 0\nelse:\n    fare = 6.50\n\nprint("ค่าโดยสารของท่าน คือ", fare)',
    },
  },
  {
    title: 'while — วนจนกว่าเงื่อนไขจะเป็นเท็จ',
    emoji: '🔄',
    theme: 'purple',
    body: 'รับตัวเลขบวกไปเรื่อย ๆ จนผู้ใช้ป้อน 0 แล้วสรุปผลรวมกับค่ามากที่สุด เราไม่รู้ล่วงหน้าว่าจะป้อนกี่ตัว จึงใช้ while แทน for',
    code: {
      lang: 'python',
      content: 'x = int(input("ป้อนจำนวนเต็มบวก (0 = จบ) "))\ntotal = 0\nbiggest = 0\nn = 0\n\nwhile x > 0:\n    n = n + 1\n    total = total + x\n    if x > biggest:\n        biggest = x\n    x = int(input("ป้อนจำนวนเต็มบวก (0 = จบ) "))\n\nif n > 0:\n    print("ผลรวม", total, "ค่ามากที่สุด", biggest)',
    },
    callout: { type: 'warn', emoji: '♾️', text: 'ถ้าไม่รับค่า x ใหม่ในลูป เงื่อนไขจะจริงตลอดและโปรแกรมวนไม่รู้จบ (ตั้งชื่อ total/biggest แทน sum/max เพื่อไม่ทับฟังก์ชันของ Python)' },
  },
  {
    title: 'โจทย์: เลือกสูตรพื้นที่ตามรูป',
    emoji: '🔷',
    theme: 'orange',
    code: {
      lang: 'python',
      content: 'from math import pi\n\nshape = input("วงกลม(c) สามเหลี่ยม(t) สี่เหลี่ยม(r): ")\n\nif shape == "c":\n    r = float(input("รัศมี: "))\n    area = pi * r * r\nelif shape == "t":\n    b = float(input("ฐาน: "))\n    h = float(input("สูง: "))\n    area = 0.5 * b * h\nelse:\n    w = float(input("กว้าง: "))\n    l = float(input("ยาว: "))\n    area = w * l\n\nprint("พื้นที่", round(area, 2), "ตารางหน่วย")',
    },
    callout: { type: 'tip', emoji: '🔍', text: 'ทดสอบทุกทางเลือก: กว้าง 4 ยาว 5 ต้องได้ 20 ถ้าได้ 4 แสดงว่าสูตรผิด' },
  },
  {
    title: 'ตรวจความเข้าใจ: เงื่อนไขและ while',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '🔗', text: 'and ต้องจริงทุกข้อ, or จริงข้อเดียวก็พอ' },
      { emoji: '🚌', text: 'elif ใช้เพิ่มทางเลือกระหว่าง if กับ else' },
      { emoji: '🔄', text: 'while เหมาะกับงานที่ไม่รู้จำนวนรอบล่วงหน้า' },
    ],
    quickCheck: {
      question: 'age = 70 โปรแกรมค่าโดยสารจะให้ fare เท่าไร?',
      choices: ['3.25', '0', '6.50'],
      answer: 0,
      feedback: 'ถูกต้อง! เงื่อนไขแรก age >= 60 เป็นจริง Python จึงทำบล็อกแรกแล้วข้าม elif กับ else ไปเลย',
    },
  },
];

const py_7: RichSlide[] = [
  {
    title: 'ฟังก์ชัน ลิสต์ และโมดูล',
    emoji: '🧰',
    theme: 'purple',
    layout: 'cover',
    body: 'โปรแกรมใหญ่ต้องแบ่งเป็นชิ้นเล็ก ฟังก์ชันช่วยแยกงานและเรียกใช้ซ้ำ ลิสต์เก็บข้อมูลหลายค่าในที่เดียว และโมดูลให้เราใช้เครื่องมือสำเร็จรูปที่คนอื่นเขียนไว้แล้ว',
  },
  {
    title: 'สร้างฟังก์ชันด้วย def',
    emoji: '🛠️',
    theme: 'blue',
    body: 'ค่าที่ส่งเข้าไปตอนเรียกฟังก์ชันเรียกว่าอาร์กิวเมนต์ ส่วนชื่อที่รับค่าในวงเล็บตอนนิยามเรียกว่าพารามิเตอร์ ชุดคำสั่งในฟังก์ชันต้องย่อหน้า',
    code: {
      lang: 'python',
      content: 'def hello(fname, lname):\n    print("สวัสดี", fname, lname)\n\nhello("ประวิทย์", "โพธิ์ทอง")\nhello("มานี", "มีนา")',
    },
    callout: { type: 'fun', emoji: '🎁', text: 'print() และ input() ก็เป็นฟังก์ชัน เราใช้ได้โดยไม่ต้องรู้ข้างในทำงานอย่างไร นี่คือการคิดเชิงนามธรรม' },
  },
  {
    title: 'return — ส่งผลลัพธ์กลับมา',
    emoji: '↩️',
    theme: 'yellow',
    body: 'ฟังก์ชันที่ใช้ return ส่งค่าคำตอบกลับไปให้ผู้เรียก เราจึงนำผลไปคำนวณหรือแสดงต่อได้',
    code: {
      lang: 'python',
      content: 'from math import pi\n\ndef sphere_volume(r):\n    return (4 / 3) * pi * r ** 3\n\nvol = sphere_volume(3)\nprint("ปริมาตร", round(vol, 2))   # 113.1',
    },
  },
  {
    title: 'ลิสต์ — เก็บหลายค่าในตัวแปรเดียว',
    emoji: '📋',
    theme: 'orange',
    code: {
      lang: 'python',
      content: 'x = [1, 2, 4, 8, 12]\nprint(len(x))      # 5 สมาชิก\nprint(x[0], x[4])  # 1 12 (นับตำแหน่งจาก 0)\n\nx[2] = 100         # แก้ค่าตำแหน่งที่ 2\nx.append(-116)     # เพิ่ม 1 ตัวต่อท้าย\nx.extend([20, 30]) # เพิ่มหลายตัว\nprint(x)',
    },
    callout: { type: 'tip', emoji: '0️⃣', text: 'ตำแหน่งแรกของลิสต์คือ 0 ลิสต์ 5 ตัวจึงมีตำแหน่ง 0 ถึง 4' },
  },
  {
    title: 'เรียกใช้โมดูลด้วย import',
    emoji: '📦',
    theme: 'red',
    bullets: [
      { emoji: '📥', text: 'import math', sub: 'ใช้งานผ่านชื่อโมดูล เช่น math.pi, math.sqrt(16)' },
      { emoji: '🎯', text: 'from math import pi, sin', sub: 'ดึงเฉพาะที่ต้องการ เรียก pi ได้เลย' },
      { emoji: '🏷️', text: 'import math as m', sub: 'ตั้งชื่อย่อ เรียก m.pi' },
    ],
    code: {
      lang: 'python',
      content: 'import math\nx, y = 3, 4\nprint(math.sqrt(x ** 2 + y ** 2))   # 5.0  (ระยะทางจากจุดเริ่มต้น)',
    },
  },
  {
    title: 'ตรวจความเข้าใจ: ฟังก์ชัน ลิสต์ โมดูล',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '🛠️', text: 'def สร้างฟังก์ชัน และ return ส่งค่ากลับ' },
      { emoji: '📋', text: 'ลิสต์นับตำแหน่งจาก 0 และเพิ่มค่าด้วย append()' },
      { emoji: '📦', text: 'import นำเครื่องมือสำเร็จรูปมาใช้' },
    ],
    quickCheck: {
      question: 'x = [5, 10, 15] แล้ว print(x[1]) จะแสดงอะไร?',
      choices: ['10', '5', '15'],
      answer: 0,
      feedback: 'ถูกต้อง! ตำแหน่งเริ่มนับจาก 0 ดังนั้น x[0] คือ 5 และ x[1] คือ 10',
    },
  },
];

const py_8: RichSlide[] = [
  {
    title: 'วิเคราะห์ข้อมูลและสร้าง GUI (ม.3)',
    emoji: '📊',
    theme: 'blue',
    layout: 'cover',
    body: 'นักวิทยาศาสตร์ข้อมูลใช้ Python สรุปข้อมูลจำนวนมากเป็นข้อเท็จจริงและกราฟ ส่วนแอปที่เราใช้ทุกวันมีปุ่มและหน้าต่าง บทนี้จะใช้ pandas วิเคราะห์คะแนนสอบ และ tkinter สร้างหน้าต่างโปรแกรมของเราเอง',
  },
  {
    title: 'pandas: Series และ DataFrame',
    emoji: '🐼',
    theme: 'purple',
    layout: 'comparison',
    compareLeft: {
      title: 'Series',
      emoji: '📏',
      items: ['ข้อมูลหนึ่งมิติ คล้ายลิสต์', 'มีดัชนีกำกับเริ่มจาก 0', 'เช่น คะแนนสอบของ 20 คน'],
    },
    compareRight: {
      title: 'DataFrame',
      emoji: '🗂️',
      items: ['ข้อมูลแบบตาราง หลายคอลัมน์', 'แต่ละคอลัมน์มีชื่อ เช่น ID, Gender', 'อ่านจากไฟล์ CSV ได้'],
    },
  },
  {
    title: 'อ่านไฟล์ CSV แล้วสรุปข้อมูล',
    emoji: '📄',
    theme: 'yellow',
    body: 'ไฟล์ CSV คือตารางที่แต่ละช่องคั่นด้วยเครื่องหมายจุลภาค เปิดได้ทั้งใน Excel และ Python',
    code: {
      lang: 'python',
      content: 'import pandas as pd\n\ndata = pd.read_csv("studentData.csv")\nprint(data.count())                          # นับข้อมูล\nprint(data.CsScore.mean())                   # ค่าเฉลี่ยคะแนน\nprint(data.groupby("Gender").CsScore.mean()) # เฉลี่ยแยกตามเพศ\nprint(data.sort_values(by=["Height"], ascending=False))  # เรียงสูงไปต่ำ',
    },
  },
  {
    title: 'เชื่อมข้อมูลและวาดกราฟ',
    emoji: '📈',
    theme: 'green',
    body: 'merge นำตารางสองไฟล์มารวมกันด้วยคอลัมน์ที่ตรงกัน แล้วใช้ matplotlib วาดฮิสโทแกรมดูการกระจายของคะแนน',
    code: {
      lang: 'python',
      content: 'import pandas as pd\nimport matplotlib.pyplot as plt\n\nstd = pd.read_csv("studentData.csv")\nsci = pd.read_csv("sciScore.csv")\nboth = std.merge(sci, left_on="ID", right_on="เลขประจำตัว")\n\nboth.CsScore.hist(range=[0, 20], bins=21)\nplt.title("Computing Science Score")\nplt.xlabel("CsScore")\nplt.ylabel("Frequency")\nplt.show()',
    },
  },
  {
    title: 'tkinter: หน้าต่างโปรแกรมแรกของเรา',
    emoji: '🖱️',
    theme: 'orange',
    bullets: [
      { emoji: '1️⃣', text: 'นำเข้าโมดูล tkinter' },
      { emoji: '2️⃣', text: 'สร้างหน้าต่างหลักด้วย tk.Tk()' },
      { emoji: '3️⃣', text: 'วางวิดเจ็ต เช่น ปุ่ม (Button) ป้ายข้อความ (Label)' },
      { emoji: '4️⃣', text: 'ผูกเหตุการณ์ เช่น กดปุ่มแล้วเรียกฟังก์ชัน' },
    ],
    code: {
      lang: 'python',
      content: 'import tkinter as tk\n\ncount = 0\ndef counting():\n    global count\n    count += 1\n    label_text.set(str(count))\n\nm = tk.Tk()\nm.title("Counter")\nlabel_text = tk.StringVar(value="0")\ntk.Label(m, textvariable=label_text, width=20).pack()\ntk.Button(m, text="Counting", width=20, command=counting).pack()\ntk.Button(m, text="Stop", width=20, command=m.destroy).pack()\nm.mainloop()',
    },
    callout: { type: 'warn', emoji: '🖥️', text: 'tkinter เปิดหน้าต่างบนเครื่อง จึงต้องรันบนคอมพิวเตอร์ ไม่แสดงผลใน Colab' },
  },
  {
    title: 'ตรวจความเข้าใจ: ข้อมูลและ GUI',
    emoji: '✅',
    theme: 'green',
    bullets: [
      { emoji: '🐼', text: 'pandas อ่าน CSV และสรุปข้อมูลได้รวดเร็ว' },
      { emoji: '📈', text: 'กราฟช่วยให้เห็นรูปแบบของข้อมูล' },
      { emoji: '🖱️', text: 'tkinter สร้างหน้าต่าง ปุ่ม และป้ายข้อความ' },
    ],
    quickCheck: {
      question: 'ถ้าต้องการค่าเฉลี่ยคะแนนแยกชาย-หญิง ควรใช้คำสั่งใด?',
      choices: ['data.groupby("Gender").CsScore.mean()', 'data.sort_values(by=["Gender"])', 'data.count()'],
      answer: 0,
      feedback: 'ถูกต้อง! groupby แบ่งกลุ่มตามคอลัมน์ Gender ก่อน แล้ว mean() หาค่าเฉลี่ยของแต่ละกลุ่ม',
    },
  },
];

// คำตอบที่ถูกเขียนไว้ตัวเลือกแรกทุกชุด — สลับตำแหน่งให้ต่างกันในแต่ละหน่วย
const varyQuickCheckAnswers = (deck: RichSlide[], unitNo: number): RichSlide[] =>
  deck.map((slide) => {
    if (!slide.quickCheck) return slide;
    const { options, answer } = moveCorrectTo(slide.quickCheck.choices, slide.quickCheck.answer, unitNo);
    return { ...slide, quickCheck: { ...slide.quickCheck, choices: options, answer } };
  });

export const pythonRichSlides: Record<string, RichSlide[]> = Object.fromEntries(
  [py_1, py_2, py_3, py_4, py_5, py_6, py_7, py_8].map((deck, i) => [`python-basic_${i + 1}`, varyQuickCheckAnswers(deck, i + 1)]),
);
