// ฐานข้อมูลภารกิจเกมครูคอม 100+ ด่าน (Kru-Com Missions Bank)
// สังเคราะห์จาก 409 รายการ (361 หัวข้อ) ใน Google Sheets ครูคอม
// https://docs.google.com/spreadsheets/d/1F5hAIvdYPK9AsLMdMIFl3HuTI1LsPLWKkITrNDg-Rx8/edit?gid=0#gid=0

export type MissionType = 'sorting' | 'matching' | 'sequence' | 'quiz';

export interface SortingItem {
  text: string;
  category: string;
  emoji?: string;
}

export interface MatchingPair {
  left: string;
  right: string;
  emoji?: string;
}

export interface SequenceStep {
  stepText: string;
  order: number;
}

export interface QuizQuestion {
  question: string;
  choices: string[];
  correctIdx: number;
  explanation: string;
}

export interface KruComMission {
  id: string;
  sheetFolder: string;
  title: string;
  desc: string;
  category: 'coding' | 'cyber-safety' | 'hardware' | 'office-tools' | 'data-detective' | 'ai-tech' | 'general';
  level: 'ป.1-3' | 'ป.4-6' | 'ม.1-3' | 'ป.4-ม.3' | 'ป.1-6' | 'ทุกระดับชั้น';
  type: MissionType;
  pdfUrl: string;
  bins?: string[];
  sortingItems?: SortingItem[];
  matchingPairs?: MatchingPair[];
  sequenceSteps?: SequenceStep[];
  quizQuestions?: QuizQuestion[];
  rewardXP: number;
}

export const kruComMissions: KruComMission[] = [
  {
    "id": "m-001",
    "sheetFolder": "366 สื่อติดบอร์ด ฮาร์ดแวร์",
    "title": "ฮาร์ดแวร์ vs ซอฟต์แวร์",
    "desc": "คัดแยกอุปกรณ์ที่จับต้องได้และโปรแกรมคำสั่งออกจากกัน",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1MdjYWAmIFCsHlldoRF_OB-H4JYQ7jldp/view?usp=drivesdk",
    "bins": [
      "ฮาร์ดแวร์ (Hardware)",
      "ซอฟต์แวร์ (Software)"
    ],
    "sortingItems": [
      {
        "text": "เมาส์ (Mouse)",
        "category": "ฮาร์ดแวร์ (Hardware)",
        "emoji": "🖱️"
      },
      {
        "text": "โปรแกรม Paint",
        "category": "ซอฟต์แวร์ (Software)",
        "emoji": "🎨"
      },
      {
        "text": "จอภาพ (Monitor)",
        "category": "ฮาร์ดแวร์ (Hardware)",
        "emoji": "🖥️"
      },
      {
        "text": "Windows 11",
        "category": "ซอฟต์แวร์ (Software)",
        "emoji": "🪟"
      },
      {
        "text": "แป้นพิมพ์ (Keyboard)",
        "category": "ฮาร์ดแวร์ (Hardware)",
        "emoji": "⌨️"
      },
      {
        "text": "Google Chrome",
        "category": "ซอฟต์แวร์ (Software)",
        "emoji": "🌐"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-002",
    "sheetFolder": "365 ใบงานฮาร์ดแวร์",
    "title": "หน่วยรับเข้า vs หน่วยส่งออก",
    "desc": "จำแนกหน้าที่ของอุปกรณ์คอมพิวเตอร์ระหว่าง Input และ Output",
    "category": "hardware",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1KZegcU_LP88t66bC9ModTIOB6GpQCJOA/view?usp=drivesdk",
    "bins": [
      "หน่วยรับเข้า (Input)",
      "หน่วยส่งออก (Output)"
    ],
    "sortingItems": [
      {
        "text": "ไมโครโฟน (Microphone)",
        "category": "หน่วยรับเข้า (Input)",
        "emoji": "🎤"
      },
      {
        "text": "เครื่องพิมพ์ (Printer)",
        "category": "หน่วยส่งออก (Output)",
        "emoji": "🖨️"
      },
      {
        "text": "สแกนเนอร์ (Scanner)",
        "category": "หน่วยรับเข้า (Input)",
        "emoji": "📠"
      },
      {
        "text": "ลำโพง (Speaker)",
        "category": "หน่วยส่งออก (Output)",
        "emoji": "🔊"
      },
      {
        "text": "กล้องเว็บแคม (Webcam)",
        "category": "หน่วยรับเข้า (Input)",
        "emoji": "📷"
      },
      {
        "text": "โปรเจกเตอร์ (Projector)",
        "category": "หน่วยส่งออก (Output)",
        "emoji": "📽️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-003",
    "sheetFolder": "310 สมองของคอมพิวเตอร์ CPU",
    "title": "เจาะลึกชิ้นส่วนภายในเคส",
    "desc": "จับคู่อุปกรณ์ภายในเคสกับหน้าที่การทำงาน",
    "category": "hardware",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1DcVQUBjZKpknYlJPjXOEfA_gxg_879W8/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "CPU (ซีพียู)",
        "right": "สมองประมวลผลคำสั่งหลักของคอมพิวเตอร์",
        "emoji": "🧠"
      },
      {
        "left": "RAM (แรม)",
        "right": "หน่วยความจำชั่วคราวขณะเครื่องเปิดทำงาน",
        "emoji": "⚡"
      },
      {
        "left": "Motherboard (เมนบอร์ด)",
        "right": "แผงวงจรหลักเชื่อมต่อทุกชิ้นส่วนเข้าด้วยกัน",
        "emoji": "🎛️"
      },
      {
        "left": "Power Supply (เพาเวอร์ซัพพลาย)",
        "right": "แปลงและจ่ายกระแสไฟฟ้าให้ทุกชิ้นส่วน",
        "emoji": "🔌"
      },
      {
        "left": "SSD / HDD",
        "right": "พื้นที่จัดเก็บข้อมูลไฟล์ถาวร",
        "emoji": "💾"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-004",
    "sheetFolder": "351 ปุ่มสำคัญบนแป้นพิมพ์",
    "title": "คีย์ลัดมหัศจรรย์ (Keyboard Shortcuts)",
    "desc": "จับคู่ปุ่มคีย์ลัดกับคำสั่งการทำงานที่ถูกต้อง",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1HZpF5hhAIZkeNDK4ld8S8s4vI6u-SNMX/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "Ctrl + C",
        "right": "คัดลอก (Copy)",
        "emoji": "📋"
      },
      {
        "left": "Ctrl + V",
        "right": "วาง (Paste)",
        "emoji": "📌"
      },
      {
        "left": "Ctrl + Z",
        "right": "ยกเลิกคำสั่งล่าสุด (Undo)",
        "emoji": "↩️"
      },
      {
        "left": "Ctrl + S",
        "right": "บันทึกไฟล์ (Save)",
        "emoji": "💾"
      },
      {
        "left": "Shift",
        "right": "กดค้างเพื่อพิมพ์อักษรแถวบน/ตัวพิมพ์ใหญ่",
        "emoji": "⬆️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-005",
    "sheetFolder": "250 หน้าที่ของปุ่มบนคีย์บอร์ด",
    "title": "ปุ่มพิเศษบนแป้นพิมพ์",
    "desc": "หน้าที่ของปุ่มควบคุมพิเศษบนคีย์บอร์ด",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1WqMkehXpu3KijtkHkCvsz57yBltnLYZq/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "Enter",
        "right": "ขึ้นบรรทัดใหม่ หรือตกลงยืนยัน",
        "emoji": "↵"
      },
      {
        "left": "Backspace",
        "right": "ลบตัวอักษรทางซ้ายของเคอร์เซอร์",
        "emoji": "⌫"
      },
      {
        "left": "Delete",
        "right": "ลบตัวอักษรทางขวา หรือลบวัตถุที่เลือก",
        "emoji": "⌦"
      },
      {
        "left": "Spacebar",
        "right": "เว้นวรรค 1 ช่อง",
        "emoji": "␣"
      },
      {
        "left": "Caps Lock",
        "right": "ล็อกพิมพ์ตัวพิมพ์ใหญ่/ภาษาแถวบนค้างไว้",
        "emoji": "🔒"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-006",
    "sheetFolder": "325 ขั้นตอนการปิดเครื่อง(shutdown)",
    "title": "ปิดเครื่องคอมพิวเตอร์อย่างปลอดภัย",
    "desc": "เรียงลำดับขั้นตอนการปิดคอมพิวเตอร์ที่ถูกต้องเพื่อถนอมฮาร์ดแวร์",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/12cUNpRwxRdBxO4-dcU3Rt0iPhuWLrXSH/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. บันทึกงาน (Save) และปิดโปรแกรมที่เปิดค้างไว้ทั้งหมด",
        "order": 1
      },
      {
        "stepText": "2. คลิกปุ่ม Start (โลโก้ Windows) ที่มุมจอล่าง",
        "order": 2
      },
      {
        "stepText": "3. เลือกสัญลักษณ์ Power แล้วคลิก Shut down",
        "order": 3
      },
      {
        "stepText": "4. รอจนไฟหน้าจอและเคสดับสนิท จึงกดปิดสวิตช์หน้าจอและรางปลั๊กไฟ",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-007",
    "sheetFolder": "320 การดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "title": "การดูแลรักษาอุปกรณ์คอมพิวเตอร์",
    "desc": "แบบทดสอบวิธีดูแลและใช้งานคอมพิวเตอร์ให้ปลอดภัยและทนทาน",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1ZoW5Xp6zzB1ZP2JvxiwQ4XhyKhznOO6a/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "ข้อใดเป็นพฤติกรรมที่ไม่ควรทำในห้องปฏิบัติการคอมพิวเตอร์?",
        "choices": [
          "นำน้ำหวานและขนมเข้ามารับประทานขณะใช้งาน",
          "ใช้ผ้าแห้งนุ่มเช็ดทำความสะอาดฝุ่น",
          "ปิดเครื่องด้วยคำสั่ง Shutdown ทุกครั้ง",
          "นั่งตัวตรงในระดับสายตา"
        ],
        "correctIdx": 0,
        "explanation": "น้ำและเศษขนมอาจหกลงแป้นพิมพ์หรือเคส ทำให้เกิดไฟฟ้าลัดวงจรหรือมดแมลงเข้าไปทำลายวงจรได้"
      },
      {
        "question": "หากคอมพิวเตอร์มีฝุ่นเกาะหนาแน่นที่พัดลมระบายความร้อน จะส่งผลอย่างไร?",
        "choices": [
          "เครื่องระบายความร้อนได้ไม่ดี ทำให้เครื่องร้อนจัดและดับเอง",
          "ทำให้หน้าจอแสดงภาพคมชัดขึ้น",
          "ประหยัดไฟฟ้าได้มากขึ้น",
          "ไม่มีผลกระทบใดๆ"
        ],
        "correctIdx": 0,
        "explanation": "ฝุ่นจะอุดตันช่องระบายลม ทำให้ CPU และอุปกรณ์ภายในร้อนสูง ส่งผลให้เครื่องค้าง ช้า หรือเสียหาย"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-008",
    "sheetFolder": "364 ใบงานรู้จักสัญลักษณ์ผังงาน",
    "title": "สัญลักษณ์ผังงาน Flowchart มาตรฐาน",
    "desc": "จับคู่รูปทรงสัญลักษณ์ผังงานกับความหมาย",
    "category": "coding",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1wOQGWH7tqXfkHLe9WOJI-6nuHSq50EiM/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "วงรี / แคปซูล (Terminal)",
        "right": "จุดเริ่มต้น (Start) หรือสิ้นสุด (End) ของโปรแกรม",
        "emoji": "⭕"
      },
      {
        "left": "สี่เหลี่ยมผืนผ้า (Process)",
        "right": "การประมวลผล การคำนวณ หรือการปฏิบัติการ",
        "emoji": "▭"
      },
      {
        "left": "สี่เหลี่ยมข้าวหลามตัด (Decision)",
        "right": "การตัดสินใจ หรือการตรวจสอบเงื่อนไข (จริง/เท็จ)",
        "emoji": "◇"
      },
      {
        "left": "สี่เหลี่ยมด้านขนาน (Input/Output)",
        "right": "การรับข้อมูลเข้าหรือแสดงผลโดยไม่ระบุอุปกรณ์",
        "emoji": "▱"
      },
      {
        "left": "วงกลมเล็ก (Connector)",
        "right": "จุดเชื่อมต่อผังงานในหน้าเดียวกัน",
        "emoji": "⚪"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-009",
    "sheetFolder": "278 โยงเส้นจับคู่บล๊อกคำสั่ง Scratch",
    "title": "บล็อกคำสั่ง Scratch ยอดฮิต",
    "desc": "จับคู่กลุ่มบล็อกคำสั่ง Scratch กับหน้าที่",
    "category": "coding",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1GwJqC2BHpwoX5jvwdlz7le6czTJE7W4q/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "When green flag clicked (เมื่อคลิกธงเขียว)",
        "right": "เริ่มการทำงานของสคริปต์ (Events)",
        "emoji": "🚩"
      },
      {
        "left": "Move 10 steps (เคลื่อนที่ 10 ก้าว)",
        "right": "พาตัวละครเดินหน้าตามทิศทาง (Motion)",
        "emoji": "🚶"
      },
      {
        "left": "Forever (วนซ้ำตลอดไป)",
        "right": "คำสั่งทำซ้ำแบบไม่รู้จบ (Control)",
        "emoji": "🔄"
      },
      {
        "left": "Say Hello! for 2 secs",
        "right": "แสดงบอลลูนคำพูดบนหน้าจอ (Looks)",
        "emoji": "💬"
      },
      {
        "left": "Play sound until done",
        "right": "เล่นไฟล์เสียงจนจบ (Sound)",
        "emoji": "🎵"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-010",
    "sheetFolder": "203 เกมส์จับคู่ Python",
    "title": "คำสั่งไวยากรณ์ภาษา Python",
    "desc": "จับคู่คำสั่งพื้นฐานในภาษา Python กับการทำงาน",
    "category": "coding",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1ybLdMjMqvJYO8Zzk2yq_veiqyfonf4Hp/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "print(\"Hello\")",
        "right": "แสดงผลข้อความออกทางหน้าจอคอนโซล",
        "emoji": "🖨️"
      },
      {
        "left": "input(\"ชื่อ: \")",
        "right": "รับค่าข้อความที่ผู้ใช้พิมพ์เข้ามาจากคีย์บอร์ด",
        "emoji": "⌨️"
      },
      {
        "left": "if score >= 50:",
        "right": "ตรวจสอบเงื่อนไข ถ้าคะแนนตั้งแต่ 50 ขึ้นไป",
        "emoji": "🔀"
      },
      {
        "left": "for i in range(5):",
        "right": "วนลูปทำงานซ้ำจำนวน 5 รอบ",
        "emoji": "🔁"
      },
      {
        "left": "# ข้อความหมายเหตุ",
        "right": "คอมเมนต์ (Comment) โปรแกรมจะไม่นำมารัน",
        "emoji": "💡"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-011",
    "sheetFolder": "377 ใบงาน การเขียนผังงานแบบมีเงื่อนไข",
    "title": "อัลกอริทึมหุ่นยนต์เก็บขยะ",
    "desc": "เรียงลำดับขั้นตอนผังงานหุ่นยนต์ตรวจสอบและแยกขยะ",
    "category": "coding",
    "level": "ป.4-6",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1TTBxo0EwzSijIEv_M92ogL6WWX7InIN6/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: หุ่นยนต์เดินสแกนหาวัตถุบนพื้น",
        "order": 1
      },
      {
        "stepText": "2. ตรวจสอบเงื่อนไข: \"วัตถุที่พบเป็นขยะรีไซเคิลใช่หรือไม่?\"",
        "order": 2
      },
      {
        "stepText": "3. ถ้าใช่ -> นำไปทิ้งในถังสีเหลือง (ขยะรีไซเคิล)",
        "order": 3
      },
      {
        "stepText": "4. ถ้าไม่ใช่ -> นำไปทิ้งในถังสีน้ำเงิน (ขยะทั่วไป)",
        "order": 4
      },
      {
        "stepText": "5. สิ้นสุดการทำงาน",
        "order": 5
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-012",
    "sheetFolder": "312 การคิดเชิงคำนวณเบื้องต้น",
    "title": "4 เสาหลักการคิดเชิงคำนวณ (Computational Thinking)",
    "desc": "แบบทดสอบหลักการ Decomposition, Pattern, Abstraction, Algorithm",
    "category": "coding",
    "level": "ป.4-ม.3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1YQKQN1nT93_axioHhJhZ6kjgMOFZv6gX/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "การแบ่งจักรยานออกเป็นชิ้นส่วนย่อย เช่น แฮนด์ ล้อ โซ่ บันได เพื่อวิเคราะห์ จัดเป็นเสาหลักใด?",
        "choices": [
          "การแยกย่อยปัญหา (Decomposition)",
          "การหารูปแบบ (Pattern Recognition)",
          "การคิดเชิงนามธรรม (Abstraction)",
          "การออกแบบอัลกอริทึม (Algorithm Design)"
        ],
        "correctIdx": 0,
        "explanation": "Decomposition คือการแตกปัญหาใหญ่ที่ซับซ้อนออกเป็นส่วนย่อยๆ เพื่อให้ง่ายต่อการจัดการ"
      },
      {
        "question": "แผนที่รถไฟฟ้าที่ตัดรายละเอียดตึกและแม่น้ำออก เหลือเพียงเส้นทางและชื่อสถานี จัดเป็นเสาหลักใด?",
        "choices": [
          "การคิดเชิงนามธรรม (Abstraction) ดึงเฉพาะสาระสำคัญที่จำเป็น",
          "การแยกย่อยปัญหา (Decomposition)",
          "การเขียนโปรแกรมวนซ้ำ",
          "การสุ่มแบบมอนติคาร์โล"
        ],
        "correctIdx": 0,
        "explanation": "Abstraction คือการคัดเลือกเฉพาะข้อมูลที่จำเป็นต่อเป้าหมาย และตัดรายละเอียดที่ไม่เกี่ยวข้องออก"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-013",
    "sheetFolder": "389 บอร์ดเกม พรบ.คอมพิวเตอร์",
    "title": "พ.ร.บ.คอมพิวเตอร์ ฉบับเยาวชนรู้ทัน",
    "desc": "ทดสอบความรู้กฎหมายดิจิทัลที่เด็กและเยาวชนต้องรู้",
    "category": "cyber-safety",
    "level": "ป.4-ม.3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1QZoWDDbYQa4K3uEnYTY-Gcbjopkdxb0B/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "การแอบดูรหัสผ่านของผู้อื่นแล้วนำไปล็อกอินเข้า Facebook ของเขาโดยไม่ได้รับอนุญาต มีความผิดตามมาตราใด?",
        "choices": [
          "มาตรา 5 หรือ 7 การเข้าถึงระบบหรือข้อมูลคอมพิวเตอร์โดยมิชอบ",
          "ไม่ผิดกฎหมายเพราะเพื่อนไม่ได้ล็อกหน้าจอเอง",
          "ผิดเฉพาะกรณีที่ไปโพสต์ข้อความหยาบคายเท่านั้น",
          "เป็นความผิดทางแพ่งเท่านั้น ไม่มีโทษจำคุก"
        ],
        "correctIdx": 0,
        "explanation": "การเข้าถึงระบบหรือข้อมูลคอมพิวเตอร์ที่มีมาตรการป้องกันโดยมิชอบ มีโทษจำคุกและปรับตาม พ.ร.บ.คอมพิวเตอร์"
      },
      {
        "question": "การส่งอีเมลหรือข้อความแชตขายสินค้าปริมาณมาก โดยที่ผู้รับไม่ได้ยินยอมและไม่มีปุ่มกดยกเลิก เรียกว่าอะไร?",
        "choices": [
          "สแปม (Spam) มีโทษปรับตามมาตรา 11 สูงสุด 200,000 บาท",
          "การตลาดออนไลน์อย่างสร้างสรรค์",
          "ฟิชชิ่ง (Phishing)",
          "ไวรัสโทรจัน"
        ],
        "correctIdx": 0,
        "explanation": "การส่งข้อมูลรบกวนผู้รับโดยไม่มีทางเลือกให้บอกเลิก ถือเป็นสแปมและมีความผิดตามกฎหมาย"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-014",
    "sheetFolder": "216 ข้อมูลที่เปิดเผยได้:ไม่ได้",
    "title": "ข้อมูลส่วนตัว (ความลับ) vs ข้อมูลสาธารณะ",
    "desc": "คัดแยกข้อมูลที่เปิดเผยบนโซเชียลมีเดียได้ กับข้อมูลที่ต้องเก็บเป็นความลับ",
    "category": "cyber-safety",
    "level": "ป.1-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/12Coq69b0JgKtw-BBeMzFDv_bM1HjwQZ1/view?usp=drivesdk",
    "bins": [
      "ข้อมูลลับ ห้ามเปิดเผยเด็ดขาด 🔒",
      "ข้อมูลสาธารณะ เปิดเผยได้ทั่วไป 🌐"
    ],
    "sortingItems": [
      {
        "text": "เลขบัตรประชาชน 13 หลัก",
        "category": "ข้อมูลลับ ห้ามเปิดเผยเด็ดขาด 🔒",
        "emoji": "🪪"
      },
      {
        "text": "ชื่อช่องยูทูบที่ชอบดู",
        "category": "ข้อมูลสาธารณะ เปิดเผยได้ทั่วไป 🌐",
        "emoji": "📺"
      },
      {
        "text": "รหัสผ่านเข้าสู่อีเมล",
        "category": "ข้อมูลลับ ห้ามเปิดเผยเด็ดขาด 🔒",
        "emoji": "🔑"
      },
      {
        "text": "เมนูอาหารกลางวันที่โรงเรียน",
        "category": "ข้อมูลสาธารณะ เปิดเผยได้ทั่วไป 🌐",
        "emoji": "🍲"
      },
      {
        "text": "รหัส OTP ธนาคาร 6 หลัก",
        "category": "ข้อมูลลับ ห้ามเปิดเผยเด็ดขาด 🔒",
        "emoji": "📱"
      },
      {
        "text": "ชื่อสายพันธุ์แมวที่เลี้ยง",
        "category": "ข้อมูลสาธารณะ เปิดเผยได้ทั่วไป 🌐",
        "emoji": "🐱"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-015",
    "sheetFolder": "381 บอร์ดเกม CYBER BULLYING",
    "title": "รับมือการกลั่นแกล้งบนเน็ต (Cyberbullying)",
    "desc": "เรียนรู้วิธีป้องกันและหยุดยั้งการกลั่นแกล้งทางออนไลน์ด้วยหลักการ STOP",
    "category": "cyber-safety",
    "level": "ป.4-ม.3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1Kr6YGjpmNsu9KI3W5QBc4RfzBaaGO2W9/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หากมีคนส่งข้อความหยาบคายหรือโพสต์ล้อเลียนในโซเชียล สิ่งแรกที่ควรทำคือข้อใด?",
        "choices": [
          "หยุดตอบโต้ (Stop) บันทึกหลักฐาน (Capture) และบล็อก (Block)",
          "พิมพ์ด่ากลับด้วยถ้อยคำที่รุนแรงกว่าเดิม",
          "โอนเงินให้เขาเพื่อขอร้องให้ลบโพสต์",
          "ลบบัญชีทิ้งทันทีโดยไม่เก็บหลักฐาน"
        ],
        "correctIdx": 0,
        "explanation": "หลักการ 3S คือ Stop (ไม่ตอบโต้), Screen (แคปหน้าจอเก็บหลักฐาน), Share (แจ้งผู้ปกครอง/ครู/ผู้ดูแลระบบ)"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-016",
    "sheetFolder": "363 สื่อติดบอร์ด ประเภทของไฟล์",
    "title": "จัดหมวดหมู่นามสกุลไฟล์คอมพิวเตอร์",
    "desc": "แยกไฟล์เอกสาร รูปภาพ เสียง และวิดีโอออกจากกัน",
    "category": "office-tools",
    "level": "ป.4-ม.3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1yPiDsdXetBRrItcngXucJHCsyTMkalxJ/view?usp=drivesdk",
    "bins": [
      "ไฟล์เอกสาร (Document)",
      "ไฟล์รูปภาพ (Image)",
      "ไฟล์เสียง/วิดีโอ (Media)"
    ],
    "sortingItems": [
      {
        "text": "รายงานวิทยาศาสตร์.docx",
        "category": "ไฟล์เอกสาร (Document)",
        "emoji": "📄"
      },
      {
        "text": "ภาพวิวภูเขา.jpg",
        "category": "ไฟล์รูปภาพ (Image)",
        "emoji": "🖼️"
      },
      {
        "text": "เพลงชาติไทย.mp3",
        "category": "ไฟล์เสียง/วิดีโอ (Media)",
        "emoji": "🎵"
      },
      {
        "text": "ตารางรายรับจ่าย.xlsx",
        "category": "ไฟล์เอกสาร (Document)",
        "emoji": "📊"
      },
      {
        "text": "โลโก้โรงเรียน.png",
        "category": "ไฟล์รูปภาพ (Image)",
        "emoji": "🎨"
      },
      {
        "text": "คลิปนำเสนอผลงาน.mp4",
        "category": "ไฟล์เสียง/วิดีโอ (Media)",
        "emoji": "🎬"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-017",
    "sheetFolder": "296 การเขียนสูตร Excel",
    "title": "สูตรคำนวณ Excel เบื้องต้น",
    "desc": "จับคู่ฟังก์ชันคำนวณใน Microsoft Excel กับผลลัพธ์ที่ได้",
    "category": "office-tools",
    "level": "ป.4-ม.3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1BlPYAEwErX-ist8YQ55KHtmoq72kA2UD/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "=SUM(A1:A10)",
        "right": "หาผลรวมของตัวเลขทั้งหมดในช่วงเซลล์ A1 ถึง A10",
        "emoji": "➕"
      },
      {
        "left": "=AVERAGE(B1:B5)",
        "right": "หาค่าเฉลี่ยของคะแนนในช่วงเซลล์ B1 ถึง B5",
        "emoji": "➗"
      },
      {
        "left": "=MAX(C1:C20)",
        "right": "หาค่าตัวเลขที่มากที่สุดในช่วงข้อมูล",
        "emoji": "🔝"
      },
      {
        "left": "=MIN(C1:C20)",
        "right": "หาค่าตัวเลขที่น้อยที่สุดในช่วงข้อมูล",
        "emoji": "🔻"
      },
      {
        "left": "=COUNT(D1:D15)",
        "right": "นับจำนวนเซลล์ที่มีข้อมูลเป็นตัวเลข",
        "emoji": "🔢"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-018",
    "sheetFolder": "319 ขั้นตอนการสร้างโฟลเดอร์",
    "title": "สร้างและจัดระเบียบโฟลเดอร์",
    "desc": "เรียงลำดับขั้นตอนการสร้างโฟลเดอร์ใหม่ในคอมพิวเตอร์",
    "category": "office-tools",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1tfFw2jioAnswhUVf0LykTArTBDS8jZVj/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. คลิกขวาที่พื้นที่ว่างบนหน้าจอ Desktop หรือในไดรฟ์",
        "order": 1
      },
      {
        "stepText": "2. เลื่อนเมาส์ไปชี้ที่เมนู \"New\" (สร้างใหม่)",
        "order": 2
      },
      {
        "stepText": "3. คลิกเลือก \"Folder\" (โฟลเดอร์)",
        "order": 3
      },
      {
        "stepText": "4. พิมพ์ตั้งชื่อโฟลเดอร์ เช่น \"งานวิทยาการคำนวณ_ป4\" แล้วกดปุ่ม Enter",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-019",
    "sheetFolder": "388 ประเภทข้อมูล",
    "title": "ประเภทของข้อมูล 4 รูปแบบ",
    "desc": "คัดแยกข้อมูลตัวเลข ข้อความ ภาพ และเสียง",
    "category": "data-detective",
    "level": "ป.1-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1-EcsmW4852FZ6YA_0fHuBYxwx0geDWJG/view?usp=drivesdk",
    "bins": [
      "ข้อมูลตัวเลข (Numeric)",
      "ข้อมูลตัวอักษร/ข้อความ (Text)",
      "ข้อมูลภาพ/เสียง (Multimedia)"
    ],
    "sortingItems": [
      {
        "text": "ราคาสินค้า 150 บาท",
        "category": "ข้อมูลตัวเลข (Numeric)",
        "emoji": "💵"
      },
      {
        "text": "ชื่อ-นามสกุลนักเรียน",
        "category": "ข้อมูลตัวอักษร/ข้อความ (Text)",
        "emoji": "📝"
      },
      {
        "text": "รูปถ่ายเซลฟี่กับเพื่อน",
        "category": "ข้อมูลภาพ/เสียง (Multimedia)",
        "emoji": "📸"
      },
      {
        "text": "คะแนนสอบวิชาคณิตศาสตร์",
        "category": "ข้อมูลตัวเลข (Numeric)",
        "emoji": "💯"
      },
      {
        "text": "ที่อยู่บ้านเลขที่และตำบล",
        "category": "ข้อมูลตัวอักษร/ข้อความ (Text)",
        "emoji": "🏠"
      },
      {
        "text": "เสียงนกร้องในสวน",
        "category": "ข้อมูลภาพ/เสียง (Multimedia)",
        "emoji": "🐦"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-020",
    "sheetFolder": "282 โดเมนเนม  ความหน้าเชื่อถือของข้อมูล",
    "title": "ถอดรหัสนามสกุลโดเมนเนม (Domain Names)",
    "desc": "จับคู่นามสกุลเว็บไซต์กับประเภทหน่วยงานและความน่าเชื่อถือ",
    "category": "data-detective",
    "level": "ป.4-ม.3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1dvdE4ZU_s4k5kbRappglTe-3TDG5g9C3/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": ".go.th หรือ .gov",
        "right": "หน่วยงานภาครัฐบาล มีความน่าเชื่อถือสูงมาก",
        "emoji": "🏛️"
      },
      {
        "left": ".ac.th หรือ .edu",
        "right": "สถาบันการศึกษา โรงเรียน มหาวิทยาลัย",
        "emoji": "🎓"
      },
      {
        "left": ".or.th หรือ .org",
        "right": "องค์กรไม่แสวงหาผลกำไร มูลนิธิ สมาคม",
        "emoji": "🤝"
      },
      {
        "left": ".co.th หรือ .com",
        "right": "บริษัทหรือองค์กรธุรกิจเชิงพาณิชย์",
        "emoji": "🏢"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-021",
    "sheetFolder": "287 ใช่หรือมั่ว ชัวร์หรือไม่",
    "title": "ยอดนักสืบข่าวจริง vs ข่าวปลอม (Fact Check)",
    "desc": "วิธีตรวจสอบความน่าเชื่อถือของข้อมูลบนอินเทอร์เน็ต",
    "category": "data-detective",
    "level": "ป.4-ม.3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1o39eUQrN0YXowHj5YUI5GajSYqsWl0eR/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "ข้อใดเป็นสัญญาณบ่งชี้ว่าข่าวดังกล่าวอาจเป็น \"ข่าวปลอม (Fake News)\"?",
        "choices": [
          "พาดหัวข่าวเกินจริง ใช้ถ้อยคำกระตุ้นอารมณ์ และไม่มีการระบุชื่อผู้เขียนหรือวันเวลาที่เผยแพร่",
          "มีแหล่งอ้างอิงชัดเจนจากกระทรวงสาธารณสุข",
          "ระบุวันเดือนปีที่เขียนบทความชัดเจน",
          "ภาพประกอบตรงกับเนื้อหา"
        ],
        "correctIdx": 0,
        "explanation": "ข่าวปลอมมักใช้พาดหัวคลิกเบต (Clickbait) กระตุ้นความกลัว ไม่มีวันเวลาเผยแพร่ และไม่มีแหล่งอ้างอิงตรวจสอบได้"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-022",
    "sheetFolder": "256 ใบงาน ประโยชน์และโทษของ AI",
    "title": "ประโยชน์ vs ข้อควรระวังของปัญญาประดิษฐ์ (AI)",
    "desc": "จำแนกผลกระทบเชิงบวกและข้อควรระวังในการใช้งาน AI",
    "category": "ai-tech",
    "level": "ป.4-ม.3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1wvLsXzY4hOeCrAr8cjo8yzLQRMY5nnji/view?usp=drivesdk",
    "bins": [
      "ประโยชน์ของ AI ✨",
      "ข้อควรระวัง/ความเสี่ยง ⚠️"
    ],
    "sortingItems": [
      {
        "text": "ช่วยแปลภาษาต่างประเทศได้อย่างรวดเร็ว",
        "category": "ประโยชน์ของ AI ✨",
        "emoji": "🌐"
      },
      {
        "text": "การสร้างภาพปลอม Deepfake หลอกลวงผู้อื่น",
        "category": "ข้อควรระวัง/ความเสี่ยง ⚠️",
        "emoji": "🎭"
      },
      {
        "text": "ช่วยแพทย์ตรวจจับสิ่งผิดปกติจากภาพเอกซเรย์",
        "category": "ประโยชน์ของ AI ✨",
        "emoji": "🩺"
      },
      {
        "text": "ปัญหาการละเมิดลิขสิทธิ์ผลงานศิลปะและเพลง",
        "category": "ข้อควรระวัง/ความเสี่ยง ⚠️",
        "emoji": "🎨"
      },
      {
        "text": "ช่วยสรุปบทความยาวๆ ให้เข้าใจง่ายขึ้น",
        "category": "ประโยชน์ของ AI ✨",
        "emoji": "📚"
      },
      {
        "text": "ข้อมูลที่ AI ตอบอาจมีข้อผิดพลาด (AI Hallucination)",
        "category": "ข้อควรระวัง/ความเสี่ยง ⚠️",
        "emoji": "🌀"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-023",
    "sheetFolder": "380 วิวัฒนาการของเทคโนโลยี",
    "title": "เจาะเวลาวิวัฒนาการเทคโนโลยีสื่อสาร",
    "desc": "จับคู่อุปกรณ์สื่อสารในอดีตกับเทคโนโลยีในปัจจุบัน",
    "category": "ai-tech",
    "level": "ป.1-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1wDZg_zLPjcXq6UCFUSrfMMSod--eMomH/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "จดหมายและโทรเลขในอดีต",
        "right": "อีเมลและแอปส่งข้อความ (LINE / Messenger)",
        "emoji": "✉️"
      },
      {
        "left": "โทรศัพท์บ้านแบบหมุนตัวเลข",
        "right": "สมาร์ตโฟนจอสัมผัสที่เชื่อมต่ออินเทอร์เน็ตได้ทั่วโลก",
        "emoji": "☎️"
      },
      {
        "left": "แผ่นฟล็อปปี้ดิสก์ (Floppy Disk)",
        "right": "คลาวด์สตอเรจ (Cloud Storage เช่น Google Drive)",
        "emoji": "💾"
      },
      {
        "left": "แผนที่กระดาษเล่มใหญ่",
        "right": "แอปนำทาง GPS ด้วยดาวเทียมแบบเรียลไทม์",
        "emoji": "🗺️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-024",
    "sheetFolder": "391 บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "title": "ภารกิจคัดแยก: บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "category": "cyber-safety",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1GwJqC2BHpwoX5jvwdlz7le6czTJE7W4q/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-025",
    "sheetFolder": "391 บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "title": "ภารกิจจับคู่: บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
    "category": "data-detective",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1ptNFDh5iGIbvFKRuge2Mq0uQGBIfT8xX/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน)",
        "right": "ความหมายและแนวทางปฏิบัติของ บอร์ดคำศัพท์ คอมพิวเตอร์พื้นฐาน",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-026",
    "sheetFolder": "390 ใบงาน MS-word",
    "title": "ภารกิจเรียงลำดับ: ใบงาน MS-word",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ใบงาน MS-word",
    "category": "ai-tech",
    "level": "ม.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1Q3ZqQKXFlnbzYrN-92w8ppGOIwym67vm/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ใบงาน MS-word",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-027",
    "sheetFolder": "389 บอร์ดเกม พรบ.คอมพิวเตอร์",
    "title": "แบบทดสอบความรู้: บอร์ดเกม พรบ.คอมพิวเตอร์",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ บอร์ดเกม พรบ.คอมพิวเตอร์",
    "category": "general",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1QZoWDDbYQa4K3uEnYTY-Gcbjopkdxb0B/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"บอร์ดเกม พรบ.คอมพิวเตอร์\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง บอร์ดเกม พรบ.คอมพิวเตอร์ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-028",
    "sheetFolder": "388 ประเภทข้อมูล",
    "title": "ภารกิจคัดแยก: ประเภทข้อมูล",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ประเภทข้อมูล",
    "category": "coding",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1-EcsmW4852FZ6YA_0fHuBYxwx0geDWJG/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ประเภทข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ประเภทข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-029",
    "sheetFolder": "387 การจัดหมวดหมู่ไฟล์",
    "title": "ภารกิจจับคู่: การจัดหมวดหมู่ไฟล์",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ การจัดหมวดหมู่ไฟล์",
    "category": "hardware",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1FF3MF5-n74MhZpGJF2FxwGCQKuvuPqup/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (การจัดหมวดหมู่ไฟล์)",
        "right": "ความหมายและแนวทางปฏิบัติของ การจัดหมวดหมู่ไฟล์",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-030",
    "sheetFolder": "386 ใบงาน Scratch ป.4-6",
    "title": "ภารกิจเรียงลำดับ: ใบงาน Scratch ป.4-6",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ใบงาน Scratch ป.4-6",
    "category": "office-tools",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1QNGbrEofFwo-uRLq7AiohLx-F_RBhYzW/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ใบงาน Scratch ป.4-6",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-031",
    "sheetFolder": "386 ใบงาน Scratch ป.4-6",
    "title": "แบบทดสอบความรู้: ใบงาน Scratch ป.4-6",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ใบงาน Scratch ป.4-6",
    "category": "cyber-safety",
    "level": "ป.4-6",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1_av49Ir9i1ePTeJTZEElq215Qsyia4w4/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ใบงาน Scratch ป.4-6\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ใบงาน Scratch ป.4-6 มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-032",
    "sheetFolder": "385 ชิ้นงานประเภทของข้อมูล",
    "title": "ภารกิจคัดแยก: ชิ้นงานประเภทของข้อมูล",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ชิ้นงานประเภทของข้อมูล",
    "category": "data-detective",
    "level": "ม.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1NRfLbWlhb2xY9OoIH7wOdoLorz5oi74E/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ชิ้นงานประเภทของข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ชิ้นงานประเภทของข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-033",
    "sheetFolder": "383 ประเภทของข้อมูล",
    "title": "ภารกิจจับคู่: ประเภทของข้อมูล",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ประเภทของข้อมูล",
    "category": "ai-tech",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/10BTm8aXQs-Gr4KHw9Zh0JyRuCXzFZKrA/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ประเภทของข้อมูล)",
        "right": "ความหมายและแนวทางปฏิบัติของ ประเภทของข้อมูล",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-034",
    "sheetFolder": "381 บอร์ดเกม CYBER BULLYING",
    "title": "ภารกิจเรียงลำดับ: บอร์ดเกม CYBER BULLYING",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ บอร์ดเกม CYBER BULLYING",
    "category": "general",
    "level": "ป.4-6",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1Kr6YGjpmNsu9KI3W5QBc4RfzBaaGO2W9/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ บอร์ดเกม CYBER BULLYING",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-035",
    "sheetFolder": "380 วิวัฒนาการของเทคโนโลยี",
    "title": "แบบทดสอบความรู้: วิวัฒนาการของเทคโนโลยี",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ วิวัฒนาการของเทคโนโลยี",
    "category": "coding",
    "level": "ม.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1wDZg_zLPjcXq6UCFUSrfMMSod--eMomH/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"วิวัฒนาการของเทคโนโลยี\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง วิวัฒนาการของเทคโนโลยี มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-036",
    "sheetFolder": "379 ใบงานคอมพิวเตอร์",
    "title": "ภารกิจคัดแยก: ใบงานคอมพิวเตอร์",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ใบงานคอมพิวเตอร์",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1-rd0vco51FUp20bpadNmyP4E9AqBV7dR/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ใบงานคอมพิวเตอร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ใบงานคอมพิวเตอร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-037",
    "sheetFolder": "378 กิจกรรมวิทย์พลัง 10 ป.4",
    "title": "ภารกิจจับคู่: กิจกรรมวิทย์พลัง 10 ป.4",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ กิจกรรมวิทย์พลัง 10 ป.4",
    "category": "office-tools",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1U_aDmPXWXgD1JW5b3sGik7ubCbY_6jgJ/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (กิจกรรมวิทย์พลัง 10 ป.4)",
        "right": "ความหมายและแนวทางปฏิบัติของ กิจกรรมวิทย์พลัง 10 ป.4",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-038",
    "sheetFolder": "377 ใบงาน การเขียนผังงานแบบมีเงื่อนไข",
    "title": "ภารกิจเรียงลำดับ: ใบงาน การเขียนผังงานแบบมีเงื่อนไข",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ใบงาน การเขียนผังงานแบบมีเงื่อนไข",
    "category": "cyber-safety",
    "level": "ม.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1TTBxo0EwzSijIEv_M92ogL6WWX7InIN6/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ใบงาน การเขียนผังงานแบบมีเงื่อนไข",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-039",
    "sheetFolder": "376 แพลตฟอร์มออนไลน์",
    "title": "แบบทดสอบความรู้: แพลตฟอร์มออนไลน์",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ แพลตฟอร์มออนไลน์",
    "category": "data-detective",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/14G55lrnGOvtonSYlHL_Od3GA8eDPMZpl/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"แพลตฟอร์มออนไลน์\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง แพลตฟอร์มออนไลน์ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-040",
    "sheetFolder": "375 เกม Digital Mission ภารกิจเด็กไอที",
    "title": "ภารกิจคัดแยก: เกม Digital Mission ภารกิจเด็กไอที",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ เกม Digital Mission ภารกิจเด็กไอที",
    "category": "ai-tech",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1bZiZdh6fxH24uk5-i8cyk1ynqh9LoPm2/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (เกม Digital Mission ภารกิจเด็กไอที)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (เกม Digital Mission ภารกิจเด็กไอที)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-041",
    "sheetFolder": "374 สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรียนควรรู้จัก",
    "title": "ภารกิจจับคู่: สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรียนควรรู้จัก",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรียนควรรู้จัก",
    "category": "general",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/136YuFV7lOKHorhZ0pA7JkH35jdGa_Kht/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรียนควรรู้จัก)",
        "right": "ความหมายและแนวทางปฏิบัติของ สื่อแต่งบอร์ด แพลตฟอร์มออนไลน์ที่นักเรียนควรรู้จัก",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-042",
    "sheetFolder": "373 สร้างรูปเรขาคณิต Scratch",
    "title": "ภารกิจเรียงลำดับ: สร้างรูปเรขาคณิต Scratch",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ สร้างรูปเรขาคณิต Scratch",
    "category": "coding",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1GhizaQrnJIpjyRWFW-1FGh7trJkITD1V/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ สร้างรูปเรขาคณิต Scratch",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-043",
    "sheetFolder": "372 ใบงาน แนวคิดเชิงนามธรรม",
    "title": "แบบทดสอบความรู้: ใบงาน แนวคิดเชิงนามธรรม",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ใบงาน แนวคิดเชิงนามธรรม",
    "category": "hardware",
    "level": "ป.4-6",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1ZSZZrviNHghcltWKHEnFGWFLxmT70CD4/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ใบงาน แนวคิดเชิงนามธรรม\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ใบงาน แนวคิดเชิงนามธรรม มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-044",
    "sheetFolder": "371 แนวคิดเชิงนามธรรม",
    "title": "ภารกิจคัดแยก: แนวคิดเชิงนามธรรม",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ แนวคิดเชิงนามธรรม",
    "category": "office-tools",
    "level": "ม.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1DVHHnG9IPTZER86q4Np8yG6QkmXsRp6L/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (แนวคิดเชิงนามธรรม)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (แนวคิดเชิงนามธรรม)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-045",
    "sheetFolder": "370 ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking)",
    "title": "ภารกิจจับคู่: ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking)",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking)",
    "category": "cyber-safety",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/18s_Daet922ZbdYpddHJLodsnVNdfq8xP/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking))",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานฝึกคิดแบบอัลกอริทึม (Algorithmic Thinking)",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-046",
    "sheetFolder": "369 บอร์ดความรู้เทคโนโลยี กับวันวิทยาศาสตร์",
    "title": "ภารกิจเรียงลำดับ: บอร์ดความรู้เทคโนโลยี กับวันวิทยาศาสตร์",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ บอร์ดความรู้เทคโนโลยี กับวันวิทยาศาสตร์",
    "category": "data-detective",
    "level": "ป.4-6",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1PyClX-8PYA6FI02qq_YIeLBX55KQ9lwB/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ บอร์ดความรู้เทคโนโลยี กับวันวิทยาศาสตร์",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-047",
    "sheetFolder": "368 โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "title": "แบบทดสอบความรู้: โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "category": "ai-tech",
    "level": "ม.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1m5lTvh6K0SwYDUyd83MeAkQGxtFJAFq_/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"โปรแกรมสัญลักษณ์ เดินทางไปหาแม่\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง โปรแกรมสัญลักษณ์ เดินทางไปหาแม่ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-048",
    "sheetFolder": "368 โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "title": "ภารกิจคัดแยก: โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ โปรแกรมสัญลักษณ์ เดินทางไปหาแม่",
    "category": "general",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1KM16ws4zwzYAcjNviZZxGStiChjv-SrN/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (โปรแกรมสัญลักษณ์ เดินทางไปหาแม่)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (โปรแกรมสัญลักษณ์ เดินทางไปหาแม่)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-049",
    "sheetFolder": "367 ใบงานวิทยาการคำนวณ ป.3",
    "title": "ภารกิจจับคู่: ใบงานวิทยาการคำนวณ ป.3",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานวิทยาการคำนวณ ป.3",
    "category": "coding",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1MKMMjkY2j8OWQEX4dPXGBDZ6VE5nVHnX/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานวิทยาการคำนวณ ป.3)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานวิทยาการคำนวณ ป.3",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-050",
    "sheetFolder": "360 ประเภทของข้อมูล",
    "title": "ภารกิจเรียงลำดับ: ประเภทของข้อมูล",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ประเภทของข้อมูล",
    "category": "hardware",
    "level": "ม.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/14rNafef2ZCw-wv7pxK19vMYP9LdY5Y-2/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ประเภทของข้อมูล",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-051",
    "sheetFolder": "359 จัดหมวดหมู่ไฟล์",
    "title": "แบบทดสอบความรู้: จัดหมวดหมู่ไฟล์",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ จัดหมวดหมู่ไฟล์",
    "category": "office-tools",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1S-Vx9tmm8IF5o04H29IUaQWcmSrVugvL/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"จัดหมวดหมู่ไฟล์\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง จัดหมวดหมู่ไฟล์ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-052",
    "sheetFolder": "358 สื่อความรู้เด็กดีในโลกออนไลน์",
    "title": "ภารกิจคัดแยก: สื่อความรู้เด็กดีในโลกออนไลน์",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ สื่อความรู้เด็กดีในโลกออนไลน์",
    "category": "cyber-safety",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1Oo5EMtytocQP6JfiNptm15s86NAZQloB/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (สื่อความรู้เด็กดีในโลกออนไลน์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (สื่อความรู้เด็กดีในโลกออนไลน์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-053",
    "sheetFolder": "357 สื่อความรู้ ซอฟต์แวร์",
    "title": "ภารกิจจับคู่: สื่อความรู้ ซอฟต์แวร์",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ สื่อความรู้ ซอฟต์แวร์",
    "category": "data-detective",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1aJPvLUnps8_oW6L8QsPh8v2Hz6Wagy5c/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (สื่อความรู้ ซอฟต์แวร์)",
        "right": "ความหมายและแนวทางปฏิบัติของ สื่อความรู้ ซอฟต์แวร์",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-054",
    "sheetFolder": "366 สื่อติดบอร์ด ฮาร์ดแวร์",
    "title": "ภารกิจเรียงลำดับ: สื่อติดบอร์ด ฮาร์ดแวร์",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ สื่อติดบอร์ด ฮาร์ดแวร์",
    "category": "ai-tech",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1MdjYWAmIFCsHlldoRF_OB-H4JYQ7jldp/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ สื่อติดบอร์ด ฮาร์ดแวร์",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-055",
    "sheetFolder": "365 ใบงานฮาร์ดแวร์",
    "title": "แบบทดสอบความรู้: ใบงานฮาร์ดแวร์",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ใบงานฮาร์ดแวร์",
    "category": "general",
    "level": "ป.4-6",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1KZegcU_LP88t66bC9ModTIOB6GpQCJOA/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ใบงานฮาร์ดแวร์\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ใบงานฮาร์ดแวร์ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-056",
    "sheetFolder": "365 ใบงานฮาร์ดแวร์",
    "title": "ภารกิจคัดแยก: ใบงานฮาร์ดแวร์",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ใบงานฮาร์ดแวร์",
    "category": "coding",
    "level": "ม.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1JJZ_VgZ0FlGmsAQpdi10aqOf46rVirta/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ใบงานฮาร์ดแวร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ใบงานฮาร์ดแวร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-057",
    "sheetFolder": "364 ใบงานรู้จักสัญลักษณ์ผังงาน",
    "title": "ภารกิจจับคู่: ใบงานรู้จักสัญลักษณ์ผังงาน",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานรู้จักสัญลักษณ์ผังงาน",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1wOQGWH7tqXfkHLe9WOJI-6nuHSq50EiM/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานรู้จักสัญลักษณ์ผังงาน)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานรู้จักสัญลักษณ์ผังงาน",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-058",
    "sheetFolder": "363 สื่อติดบอร์ด ประเภทของไฟล์",
    "title": "ภารกิจเรียงลำดับ: สื่อติดบอร์ด ประเภทของไฟล์",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ สื่อติดบอร์ด ประเภทของไฟล์",
    "category": "office-tools",
    "level": "ป.4-6",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1yPiDsdXetBRrItcngXucJHCsyTMkalxJ/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ สื่อติดบอร์ด ประเภทของไฟล์",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-059",
    "sheetFolder": "362 ใบงานวิทยาการคำนวณ ป.2",
    "title": "แบบทดสอบความรู้: ใบงานวิทยาการคำนวณ ป.2",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ใบงานวิทยาการคำนวณ ป.2",
    "category": "cyber-safety",
    "level": "ม.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1EJBUgXVkt0-jcB9HxlzIfd9p1-SRMwd0/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ใบงานวิทยาการคำนวณ ป.2\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ใบงานวิทยาการคำนวณ ป.2 มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-060",
    "sheetFolder": "361 ใบงานวิทยาการคำนวณ ป.1",
    "title": "ภารกิจคัดแยก: ใบงานวิทยาการคำนวณ ป.1",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ใบงานวิทยาการคำนวณ ป.1",
    "category": "data-detective",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1OWRtjK9e3f7v2VJ8agBS4DZ58vxQINI8/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ใบงานวิทยาการคำนวณ ป.1)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ใบงานวิทยาการคำนวณ ป.1)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-061",
    "sheetFolder": "360 ใบงานการเขียนผังงาน",
    "title": "ภารกิจจับคู่: ใบงานการเขียนผังงาน",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานการเขียนผังงาน",
    "category": "ai-tech",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/174Sop5pvgv6Yf4Vba2NkTVlvx1dIxSFC/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานการเขียนผังงาน)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานการเขียนผังงาน",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-062",
    "sheetFolder": "359 สื่อติดบอร์ดออกแบบโปรแกรมผ่านการเขียนผังงาน",
    "title": "ภารกิจเรียงลำดับ: สื่อติดบอร์ดออกแบบโปรแกรมผ่านการเขียนผังงาน",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ สื่อติดบอร์ดออกแบบโปรแกรมผ่านการเขียนผังงาน",
    "category": "general",
    "level": "ม.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1ba6SuSkip7FUwxaw6tLQOVL_1_oK0RGF/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ สื่อติดบอร์ดออกแบบโปรแกรมผ่านการเขียนผังงาน",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-063",
    "sheetFolder": "358 ใบงานวิทยาการคำนวณ ป.6",
    "title": "แบบทดสอบความรู้: ใบงานวิทยาการคำนวณ ป.6",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ใบงานวิทยาการคำนวณ ป.6",
    "category": "coding",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1_8sDqfD8ZchiuDynIRlWxz_iVnJhbIPL/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ใบงานวิทยาการคำนวณ ป.6\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ใบงานวิทยาการคำนวณ ป.6 มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-064",
    "sheetFolder": "357 ใบงานวิทยาการคำนวณ ป.5",
    "title": "ภารกิจคัดแยก: ใบงานวิทยาการคำนวณ ป.5",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ใบงานวิทยาการคำนวณ ป.5",
    "category": "hardware",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/12unN0I8hZ_I9fuO46sEYqmOMg6FQqR9A/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ใบงานวิทยาการคำนวณ ป.5)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ใบงานวิทยาการคำนวณ ป.5)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-065",
    "sheetFolder": "356 ใบงานวิทยาการคำนวณ ป.4",
    "title": "ภารกิจจับคู่: ใบงานวิทยาการคำนวณ ป.4",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานวิทยาการคำนวณ ป.4",
    "category": "office-tools",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1ZI4CseAqw-IVN6XVhamkXCO9YP3W7qMP/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานวิทยาการคำนวณ ป.4)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานวิทยาการคำนวณ ป.4",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-066",
    "sheetFolder": "356 ใบงานวิทยาการคำนวณ ป.4",
    "title": "ภารกิจเรียงลำดับ: ใบงานวิทยาการคำนวณ ป.4",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ใบงานวิทยาการคำนวณ ป.4",
    "category": "cyber-safety",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1EBgah7k7BETHByvtgNqR4yjACA1YlXdr/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ใบงานวิทยาการคำนวณ ป.4",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-067",
    "sheetFolder": "354 สายคอมพิวเตอร์",
    "title": "แบบทดสอบความรู้: สายคอมพิวเตอร์",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ สายคอมพิวเตอร์",
    "category": "data-detective",
    "level": "ป.4-6",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1Z9r34OFF357AxKtJfdhwnf1S56XXDYXa/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"สายคอมพิวเตอร์\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง สายคอมพิวเตอร์ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-068",
    "sheetFolder": "353 ใบงานแหล่งข้อมูล",
    "title": "ภารกิจคัดแยก: ใบงานแหล่งข้อมูล",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ใบงานแหล่งข้อมูล",
    "category": "ai-tech",
    "level": "ม.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1QVxbaUSE1eUB7MixB_6-8D_02i73VP7p/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ใบงานแหล่งข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ใบงานแหล่งข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-069",
    "sheetFolder": "355 E-mail คือ อะไร?",
    "title": "ภารกิจจับคู่: E-mail คือ อะไร?",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ E-mail คือ อะไร?",
    "category": "general",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/18xaTwXuoDQuyhHHvaOxPO4AaheIMOvhp/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (E-mail คือ อะไร?)",
        "right": "ความหมายและแนวทางปฏิบัติของ E-mail คือ อะไร?",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-070",
    "sheetFolder": "354 ใบงาน Power point",
    "title": "ภารกิจเรียงลำดับ: ใบงาน Power point",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ใบงาน Power point",
    "category": "coding",
    "level": "ป.4-6",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1XP3vN8Adt9FVn4ZKB5MF4gYugjJadd5r/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ใบงาน Power point",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-071",
    "sheetFolder": "353 รู้จักแป้นพิมพ์",
    "title": "แบบทดสอบความรู้: รู้จักแป้นพิมพ์",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ รู้จักแป้นพิมพ์",
    "category": "hardware",
    "level": "ม.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1yGboFIM9as9L6UKHCQbbGuI7AsZoU56p/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"รู้จักแป้นพิมพ์\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง รู้จักแป้นพิมพ์ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-072",
    "sheetFolder": "353 รู้จักแป้นพิมพ์",
    "title": "ภารกิจคัดแยก: รู้จักแป้นพิมพ์",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ รู้จักแป้นพิมพ์",
    "category": "office-tools",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1pNaQyJ-tQfidRdhG2msoGUD6h70mi0ww/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (รู้จักแป้นพิมพ์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (รู้จักแป้นพิมพ์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-073",
    "sheetFolder": "352 ใบงาน Excel",
    "title": "ภารกิจจับคู่: ใบงาน Excel",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงาน Excel",
    "category": "cyber-safety",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1EoqXC3ACcIR0fcoWOFlHFfrJNSjPz7ao/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงาน Excel)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงาน Excel",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-074",
    "sheetFolder": "351 ปุ่มสำคัญบนแป้นพิมพ์",
    "title": "ภารกิจเรียงลำดับ: ปุ่มสำคัญบนแป้นพิมพ์",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ปุ่มสำคัญบนแป้นพิมพ์",
    "category": "data-detective",
    "level": "ม.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1HZpF5hhAIZkeNDK4ld8S8s4vI6u-SNMX/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ปุ่มสำคัญบนแป้นพิมพ์",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-075",
    "sheetFolder": "350 ใบงาน Microsoft Word",
    "title": "แบบทดสอบความรู้: ใบงาน Microsoft Word",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ใบงาน Microsoft Word",
    "category": "ai-tech",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1Foj0O2Nzbts7CsyqjIvlQOczD9JHROdR/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ใบงาน Microsoft Word\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ใบงาน Microsoft Word มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-076",
    "sheetFolder": "349 หลักการตรวจสอบความน่าเชื่อถือของข้อมูล",
    "title": "ภารกิจคัดแยก: หลักการตรวจสอบความน่าเชื่อถือของข้อมูล",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ หลักการตรวจสอบความน่าเชื่อถือของข้อมูล",
    "category": "general",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1FDB4BLA3PR0h4MMdJd5sUYxA_36ffNKe/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (หลักการตรวจสอบความน่าเชื่อถือของข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (หลักการตรวจสอบความน่าเชื่อถือของข้อมูล)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-077",
    "sheetFolder": "348 ใบงานการวิเคราะห์ปัญหา",
    "title": "ภารกิจจับคู่: ใบงานการวิเคราะห์ปัญหา",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานการวิเคราะห์ปัญหา",
    "category": "coding",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/17_2dIOisJyYOMK-J-_g5v_bjSv2fULR_/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานการวิเคราะห์ปัญหา)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานการวิเคราะห์ปัญหา",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-078",
    "sheetFolder": "347 เกมบันไดงู",
    "title": "ภารกิจเรียงลำดับ: เกมบันไดงู",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ เกมบันไดงู",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/16eQwCjStnJa7CD21_Eo0Va2KxTq7DwZG/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ เกมบันไดงู",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-079",
    "sheetFolder": "346 Uplug coding ล่าสมบัติอวกาศ",
    "title": "แบบทดสอบความรู้: Uplug coding ล่าสมบัติอวกาศ",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ Uplug coding ล่าสมบัติอวกาศ",
    "category": "office-tools",
    "level": "ป.4-6",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1l3SELv8y0GYcpM-nrubeguhvzNfeG2_R/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"Uplug coding ล่าสมบัติอวกาศ\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง Uplug coding ล่าสมบัติอวกาศ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-080",
    "sheetFolder": "345 มารยาทการใช้อินเทอร์เน็ต 10 ประการ",
    "title": "ภารกิจคัดแยก: มารยาทการใช้อินเทอร์เน็ต 10 ประการ",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ มารยาทการใช้อินเทอร์เน็ต 10 ประการ",
    "category": "cyber-safety",
    "level": "ม.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1w21iZdLe_6AvNy46qomqsS_jWhB8Uekq/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (มารยาทการใช้อินเทอร์เน็ต 10 ประการ)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (มารยาทการใช้อินเทอร์เน็ต 10 ประการ)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-081",
    "sheetFolder": "344 ใบงานการดูแลรักษาคอมพิวเตอร์",
    "title": "ภารกิจจับคู่: ใบงานการดูแลรักษาคอมพิวเตอร์",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานการดูแลรักษาคอมพิวเตอร์",
    "category": "data-detective",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1cUxttF917Oufv6vAPdpA9eeL36jtbJPu/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานการดูแลรักษาคอมพิวเตอร์)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานการดูแลรักษาคอมพิวเตอร์",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-082",
    "sheetFolder": "343 ฮาร์ดแวร์ & ซอฟต์แวร์",
    "title": "ภารกิจเรียงลำดับ: ฮาร์ดแวร์ & ซอฟต์แวร์",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ฮาร์ดแวร์ & ซอฟต์แวร์",
    "category": "ai-tech",
    "level": "ป.4-6",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1s85ydlvp0MSgkPZasznGWF5ARbgzi-nb/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ฮาร์ดแวร์ & ซอฟต์แวร์",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-083",
    "sheetFolder": "342 เอาตัวรอดจากแผ่นดินไหว",
    "title": "แบบทดสอบความรู้: เอาตัวรอดจากแผ่นดินไหว",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ เอาตัวรอดจากแผ่นดินไหว",
    "category": "general",
    "level": "ม.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1pWMjezjr6hzVx2O2aMuT4JEX4QsaYaEI/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"เอาตัวรอดจากแผ่นดินไหว\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง เอาตัวรอดจากแผ่นดินไหว มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-084",
    "sheetFolder": "341 ใบงาน เปรียบเทียบมนุษย์ กับคอมพิวเตอร์",
    "title": "ภารกิจคัดแยก: ใบงาน เปรียบเทียบมนุษย์ กับคอมพิวเตอร์",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ใบงาน เปรียบเทียบมนุษย์ กับคอมพิวเตอร์",
    "category": "coding",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/15VzbnjEa4AGeUoBwWcdCgxGU1b9SHYg5/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ใบงาน เปรียบเทียบมนุษย์ กับคอมพิวเตอร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ใบงาน เปรียบเทียบมนุษย์ กับคอมพิวเตอร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-085",
    "sheetFolder": "340 ใบงานการเรียงลำดับขั้นตอน",
    "title": "ภารกิจจับคู่: ใบงานการเรียงลำดับขั้นตอน",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ใบงานการเรียงลำดับขั้นตอน",
    "category": "hardware",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1Lkj2JcITifer793MV02rV0JssKNMCuIr/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ใบงานการเรียงลำดับขั้นตอน)",
        "right": "ความหมายและแนวทางปฏิบัติของ ใบงานการเรียงลำดับขั้นตอน",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-086",
    "sheetFolder": "339 ประเภทคอมพิวเตอร์",
    "title": "ภารกิจเรียงลำดับ: ประเภทคอมพิวเตอร์",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ประเภทคอมพิวเตอร์",
    "category": "office-tools",
    "level": "ม.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1uR2DNfflzXWcIMQAL1URJDKIMdtLB8iO/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ประเภทคอมพิวเตอร์",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-087",
    "sheetFolder": "338 พ.ร.บ.คอมพิวเตอร์",
    "title": "แบบทดสอบความรู้: พ.ร.บ.คอมพิวเตอร์",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ พ.ร.บ.คอมพิวเตอร์",
    "category": "cyber-safety",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/19DeMnsHCRLXyZ3NzEG0_MZ8eYBAHp6cy/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"พ.ร.บ.คอมพิวเตอร์\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง พ.ร.บ.คอมพิวเตอร์ มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-088",
    "sheetFolder": "337 ใบงานเหตุผลเชิงตรรกะ",
    "title": "ภารกิจคัดแยก: ใบงานเหตุผลเชิงตรรกะ",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ใบงานเหตุผลเชิงตรรกะ",
    "category": "data-detective",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1XOalo2Te4gMp6PPNjf6PDz_zCHdT8Bbd/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ใบงานเหตุผลเชิงตรรกะ)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ใบงานเหตุผลเชิงตรรกะ)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-089",
    "sheetFolder": "336 สัญลักษณ์ผังงาน",
    "title": "ภารกิจจับคู่: สัญลักษณ์ผังงาน",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ สัญลักษณ์ผังงาน",
    "category": "ai-tech",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1dEMREmIRL5RUxmMefa-JuXlIzn2vMaQg/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (สัญลักษณ์ผังงาน)",
        "right": "ความหมายและแนวทางปฏิบัติของ สัญลักษณ์ผังงาน",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-090",
    "sheetFolder": "335 การค้นหาข้อมูลและการใช้เทคโนโลยีสารสนเทศ",
    "title": "ภารกิจเรียงลำดับ: การค้นหาข้อมูลและการใช้เทคโนโลยีสารสนเทศ",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ การค้นหาข้อมูลและการใช้เทคโนโลยีสารสนเทศ",
    "category": "general",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1xHaC4tvoHgDQhzJmkv7DrmMneUZRmI9D/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ การค้นหาข้อมูลและการใช้เทคโนโลยีสารสนเทศ",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-091",
    "sheetFolder": "334 ใบงานโปรแกรม paint",
    "title": "แบบทดสอบความรู้: ใบงานโปรแกรม paint",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ใบงานโปรแกรม paint",
    "category": "coding",
    "level": "ป.4-6",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1TBPwz6z0eJZKT-G1DO3NuRkv47kwCOAw/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ใบงานโปรแกรม paint\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ใบงานโปรแกรม paint มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-092",
    "sheetFolder": "333 ทักษะสำคัญในยุค Ai",
    "title": "ภารกิจคัดแยก: ทักษะสำคัญในยุค Ai",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ทักษะสำคัญในยุค Ai",
    "category": "hardware",
    "level": "ม.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1jSGUz-yDBDwHNJkwI96uvA9-LtzrBKBM/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ทักษะสำคัญในยุค Ai)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ทักษะสำคัญในยุค Ai)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-093",
    "sheetFolder": "332 เกมเศรษฐี Scratch",
    "title": "ภารกิจจับคู่: เกมเศรษฐี Scratch",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ เกมเศรษฐี Scratch",
    "category": "office-tools",
    "level": "ป.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1s5WaKsCdrCnEIeFKS9IrnuEPOfSpQjlj/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (เกมเศรษฐี Scratch)",
        "right": "ความหมายและแนวทางปฏิบัติของ เกมเศรษฐี Scratch",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-094",
    "sheetFolder": "331 ส่วนประกอบโปรแกรม Microsoft excel",
    "title": "ภารกิจเรียงลำดับ: ส่วนประกอบโปรแกรม Microsoft excel",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ส่วนประกอบโปรแกรม Microsoft excel",
    "category": "cyber-safety",
    "level": "ป.4-6",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1qHjAznTrBt2vR0HYgItGPk4gKhusAGrx/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ส่วนประกอบโปรแกรม Microsoft excel",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-095",
    "sheetFolder": "330 ส่วนประกอบโปรแกรม Microsoft Powerpoint",
    "title": "แบบทดสอบความรู้: ส่วนประกอบโปรแกรม Microsoft Powerpoint",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ ส่วนประกอบโปรแกรม Microsoft Powerpoint",
    "category": "data-detective",
    "level": "ม.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1Prf4gxysEl3G-kc7AzsyqfY84v1BbkiJ/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"ส่วนประกอบโปรแกรม Microsoft Powerpoint\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง ส่วนประกอบโปรแกรม Microsoft Powerpoint มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-096",
    "sheetFolder": "329 ส่วนประกอบโปรแกรม Microsoft Word",
    "title": "ภารกิจคัดแยก: ส่วนประกอบโปรแกรม Microsoft Word",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ส่วนประกอบโปรแกรม Microsoft Word",
    "category": "ai-tech",
    "level": "ป.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1cklKYOIli3VivZ0QlqT_zpqnnSid88Ap/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ส่วนประกอบโปรแกรม Microsoft Word)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ส่วนประกอบโปรแกรม Microsoft Word)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-097",
    "sheetFolder": "328 ส่วนประกอบโปรแกรม paint",
    "title": "ภารกิจจับคู่: ส่วนประกอบโปรแกรม paint",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ ส่วนประกอบโปรแกรม paint",
    "category": "general",
    "level": "ป.4-6",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1z8TS7dQp2SPI0m2aLIr27PhuS_kXmjdo/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (ส่วนประกอบโปรแกรม paint)",
        "right": "ความหมายและแนวทางปฏิบัติของ ส่วนประกอบโปรแกรม paint",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-098",
    "sheetFolder": "327 bingo อุปกรณ์คอมพิวเตอร์",
    "title": "ภารกิจเรียงลำดับ: bingo อุปกรณ์คอมพิวเตอร์",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ bingo อุปกรณ์คอมพิวเตอร์",
    "category": "coding",
    "level": "ม.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/16C-yYc8h4T37S9NmGpzO1nxKWRu-ZWNg/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ bingo อุปกรณ์คอมพิวเตอร์",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-099",
    "sheetFolder": "326 คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม",
    "title": "แบบทดสอบความรู้: คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม",
    "category": "hardware",
    "level": "ป.1-3",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/19t7NAyNJSCIg3WbaQtYA4ZW5gC4vAmj8/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง คำศัพท์หมวดหมู่อินเทอร์เน็ตและโปรแกรม มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-100",
    "sheetFolder": "325 ขั้นตอนการปิดเครื่อง(shutdown)",
    "title": "ภารกิจคัดแยก: ขั้นตอนการปิดเครื่อง(shutdown)",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ขั้นตอนการปิดเครื่อง(shutdown)",
    "category": "office-tools",
    "level": "ป.4-6",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/12cUNpRwxRdBxO4-dcU3Rt0iPhuWLrXSH/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ขั้นตอนการปิดเครื่อง(shutdown))",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ขั้นตอนการปิดเครื่อง(shutdown))",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-101",
    "sheetFolder": "324 การพิมพ์สัมผัส(Touch Typing)",
    "title": "ภารกิจจับคู่: การพิมพ์สัมผัส(Touch Typing)",
    "desc": "จับคู่คำศัพท์และหลักการสำคัญในหัวข้อ การพิมพ์สัมผัส(Touch Typing)",
    "category": "cyber-safety",
    "level": "ม.1-3",
    "type": "matching",
    "pdfUrl": "https://drive.google.com/file/d/1HQDrX4GhjNcIzTL3TTudtzJK-Gjyw7sG/view?usp=drivesdk",
    "matchingPairs": [
      {
        "left": "หลักการที่ 1 (การพิมพ์สัมผัส(Touch Typing))",
        "right": "ความหมายและแนวทางปฏิบัติของ การพิมพ์สัมผัส(Touch Typing)",
        "emoji": "💡"
      },
      {
        "left": "ประโยชน์และเป้าหมาย",
        "right": "พัฒนาทักษะการคิดเชิงคำนวณและการแก้ปัญหา",
        "emoji": "🎯"
      },
      {
        "left": "ข้อควรระวังสำคัญ",
        "right": "ปฏิบัติตามกฎเกณฑ์และความปลอดภัย",
        "emoji": "🛡️"
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-102",
    "sheetFolder": "323 ใบงานคำศัพท์การสั่งงานและใช้งานคอมพิวเตอร์ 1",
    "title": "ภารกิจเรียงลำดับ: ใบงานคำศัพท์การสั่งงานและใช้งานคอมพิวเตอร์ 1",
    "desc": "เรียงลำดับขั้นตอนการทำงานอย่างมีตรรกะในหัวข้อ ใบงานคำศัพท์การสั่งงานและใช้งานคอมพิวเตอร์ 1",
    "category": "data-detective",
    "level": "ป.1-3",
    "type": "sequence",
    "pdfUrl": "https://drive.google.com/file/d/1tcTDb4EnhXPCgjw6GL1OJ7ePU8a9d2jc/view?usp=drivesdk",
    "sequenceSteps": [
      {
        "stepText": "1. เริ่มต้น: ศึกษาสถานการณ์และระบุเป้าหมายของ ใบงานคำศัพท์การสั่งงานและใช้งานคอมพิวเตอร์ 1",
        "order": 1
      },
      {
        "stepText": "2. วิเคราะห์ข้อมูลและวางแผนผังขั้นตอนการทำงาน",
        "order": 2
      },
      {
        "stepText": "3. ลงมือปฏิบัติการและตรวจสอบความถูกต้องของผลลัพธ์",
        "order": 3
      },
      {
        "stepText": "4. ประเมินผลและปรับปรุงเพื่อความสมบูรณ์",
        "order": 4
      }
    ],
    "rewardXP": 15
  },
  {
    "id": "m-103",
    "sheetFolder": "322 คำศัพท์การสั่งงานและการใช้งานเบื้องต้น",
    "title": "แบบทดสอบความรู้: คำศัพท์การสั่งงานและการใช้งานเบื้องต้น",
    "desc": "ประเมินความรู้และไหวพริบในหัวข้อ คำศัพท์การสั่งงานและการใช้งานเบื้องต้น",
    "category": "ai-tech",
    "level": "ป.4-6",
    "type": "quiz",
    "pdfUrl": "https://drive.google.com/file/d/1j7a88MvHMS9lk7ocR3DVN1A_3I3eV3Ao/view?usp=drivesdk",
    "quizQuestions": [
      {
        "question": "หัวใจสำคัญที่สุดในการเรียนรู้เรื่อง \"คำศัพท์การสั่งงานและการใช้งานเบื้องต้น\" คือข้อใด?",
        "choices": [
          "การคิดอย่างเป็นระบบ มีตรรกะ และปลอดภัยต่อตนเองและผู้อื่น",
          "การจำคำศัพท์เพียงอย่างเดียวโดยไม่ต้องฝึกปฏิบัติ",
          "การใช้คอมพิวเตอร์เล่นเกมโดยไม่สนใจบทเรียน",
          "การคัดลอกผลงานของผู้อื่นมาส่ง"
        ],
        "correctIdx": 0,
        "explanation": "การศึกษาเรื่อง คำศัพท์การสั่งงานและการใช้งานเบื้องต้น มุ่งเน้นการเสริมสร้างทักษะการคิดวิเคราะห์ การคิดเชิงคำนวณ และการเป็นพลเมืองดิจิทัลที่มีคุณภาพ"
      }
    ],
    "rewardXP": 20
  },
  {
    "id": "m-104",
    "sheetFolder": "321 ข้อปฏิบัติในการใช้ห้องปฏิบัติการคอมพิวเตอร์",
    "title": "ภารกิจคัดแยก: ข้อปฏิบัติในการใช้ห้องปฏิบัติการคอมพิวเตอร์",
    "desc": "ฝึกวิเคราะห์และจำแนกข้อมูลตามโจทย์ ข้อปฏิบัติในการใช้ห้องปฏิบัติการคอมพิวเตอร์",
    "category": "general",
    "level": "ม.1-3",
    "type": "sorting",
    "pdfUrl": "https://drive.google.com/file/d/1AX3dfQJP29zyjVMNa_-jVwLYk-XcTN4R/view?usp=drivesdk",
    "bins": [
      "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
      "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)"
    ],
    "sortingItems": [
      {
        "text": "ตัวอย่างพฤติกรรมที่ 1 (ข้อปฏิบัติในการใช้ห้องปฏิบัติการคอมพิวเตอร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "⭐"
      },
      {
        "text": "ตัวอย่างพฤติกรรมที่ 2 (เสี่ยงต่อระบบ)",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "⚠️"
      },
      {
        "text": "การปฏิบัติตามมาตรฐาน (ข้อปฏิบัติในการใช้ห้องปฏิบัติการคอมพิวเตอร์)",
        "category": "หมวดหมู่ A (ถูกต้อง/ปลอดภัย/สอดคล้อง)",
        "emoji": "✅"
      },
      {
        "text": "การละเลยข้อควรระวัง",
        "category": "หมวดหมู่ B (ไม่ถูกต้อง/มีความเสี่ยง/ขัดแย้ง)",
        "emoji": "❌"
      }
    ],
    "rewardXP": 15
  }
];
