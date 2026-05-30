export type Lesson = { name: string; url?: string };

export type Indicator = {
  code: string;
  text: string;
  lessons: number[];
  activities?: string[];
};

export type Unit = {
  no: number;
  title: string;
  topics?: string[];
  indicators?: number[]; // indices into grade.indicators
};

export type Grade = {
  id: string;
  emoji: string;
  title: string;
  courseUrl: string;
  indicators: Indicator[];
  lessons: Lesson[];
  units?: Unit[];
};

const codeOrgBase = 'https://studio.code.org/s/coursea-2022';

export const grades: Grade[] = [
  {
    id: 'p1',
    emoji: '🧮',
    title: 'ประถมศึกษาปีที่ 1',
    courseUrl: 'https://codingthailand.org/courses/2022/p1',
    indicators: [
      {
        code: 'ว 4.2 ป.1/1',
        text: 'แก้ปัญหาอย่างง่ายโดยใช้การลองผิดลองถูก การเปรียบเทียบ',
        lessons: [2, 3, 4],
        activities: ['กิจกรรมเปรียบเทียบ-จัดกลุ่ม', 'เกม Maze ลองผิดลองถูก', 'Unplugged: เรียงลำดับการ์ด'],
      },
      {
        code: 'ว 4.2 ป.1/2',
        text: 'แสดงลำดับขั้นตอนการทำงานหรือการแก้ปัญหาอย่างง่าย โดยใช้ภาพ สัญลักษณ์ หรือข้อความ',
        lessons: [3, 4, 5],
        activities: ['Happy Maps วาดเส้นทาง', 'Unplugged: คำสั่งหุ่นยนต์', 'การ์ดสัญลักษณ์ลำดับขั้น'],
      },
      {
        code: 'ว 4.2 ป.1/3',
        text: 'เขียนโปรแกรมอย่างง่ายโดยใช้ซอฟต์แวร์หรือสื่อ',
        lessons: [2, 5, 6, 7, 8],
        activities: ['ScratchJr เริ่มต้น', 'Code.org Drag & Drop', 'Loops กับ Scrat'],
      },
      {
        code: 'ว 4.2 ป.1/4',
        text: 'ใช้เทคโนโลยีในการสร้าง จัดเก็บ เรียกใช้ข้อมูลตามวัตถุประสงค์',
        lessons: [9],
        activities: ['สร้างผลงานด้วย Sticker Art', 'จัดเก็บไฟล์ใน Google Drive', 'การถ่ายภาพและบันทึก'],
      },
      {
        code: 'ว 4.2 ป.1/5',
        text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ปฏิบัติตามข้อตกลงในการใช้งาน',
        lessons: [1, 10],
        activities: ['Safety in My Online Neighborhood', 'มารยาทการใช้อุปกรณ์', 'รหัสผ่านและความเป็นส่วนตัว'],
      },
    ],
    lessons: [
      { name: 'Safety in My Online Neighborhood', url: `${codeOrgBase}/lessons/1` },
      { name: 'Learn to Drag and Drop', url: `${codeOrgBase}/lessons/2` },
      { name: 'Happy Maps', url: `${codeOrgBase}/lessons/3` },
      { name: 'Move It, Move It', url: `${codeOrgBase}/lessons/4` },
      { name: 'Sequencing with Scrat', url: `${codeOrgBase}/lessons/5` },
      { name: 'Programming with Rey and BB-8', url: `${codeOrgBase}/lessons/6` },
      { name: 'Loops with Scrat', url: `${codeOrgBase}/lessons/7` },
      { name: 'Loops with Laurel', url: `${codeOrgBase}/lessons/8` },
      { name: 'Mini-Project: Sticker Art', url: `${codeOrgBase}/lessons/9` },
      { name: 'Going Places Safely', url: `${codeOrgBase}/lessons/10` },
      { name: 'End of Course Project', url: `${codeOrgBase}/lessons/11` },
    ],
    units: [
      { no: 1, title: 'การใช้งานเทคโนโลยีเบื้องต้น', indicators: [3], topics: [
        'การใช้งานคีย์บอร์ด (4 ส่วน: ฟังก์ชัน/ตัวอักษร/ควบคุม/ตัวเลข)',
        'แป้นสำคัญ: Esc, Backspace, Enter, Shift, Space Bar, Tab',
        'การใช้เมาส์ (Mouse) — คลิก ดับเบิลคลิก ลาก',
        'การเปิด-ปิดคอมพิวเตอร์ตั้งโต๊ะ / โน้ตบุ๊ก / เครื่องพิมพ์',
        'เริ่มต้น Microsoft Word, Paint, Microsoft PowerPoint',
        'ชุดคำสั่งพื้นฐาน: New, Open, Save, Print, Copy, Paste',
      ] },
      { no: 2, title: 'การแก้ปัญหาอย่างเป็นขั้นตอน', indicators: [0, 1], topics: [
        'การลองผิดลองถูก — ทดลองวางทรงกลม/สี่เหลี่ยมในช่อง',
        'การเปรียบเทียบ — เกมหาจุดต่างของภาพ',
        'แสดงลำดับขั้นตอนด้วยภาพ สัญลักษณ์ หรือข้อความ',
      ] },
      { no: 3, title: 'การเขียนโปรแกรมเบื้องต้น', indicators: [2], topics: [
        'หลักการเขียนโปรแกรม: วิเคราะห์ → ผังงาน → เขียนโค้ด → ทดสอบ-แก้ไข',
        'บัตรคำสั่ง (Program Card) และรหัสคำสั่ง',
        'การเขียนคำสั่งเดินตามแผนที่ (Unplugged)',
        'ScratchJr / Code.org — เริ่มต้นเขียนโปรแกรมด้วยบล็อก',
      ] },
      { no: 4, title: 'การใช้เทคโนโลยีสารสนเทศ', indicators: [4], topics: [
        'ข้อตกลงในการใช้คอมพิวเตอร์ร่วมกัน',
        'การดูแลรักษาอุปกรณ์เทคโนโลยีเบื้องต้น',
        'ไม่เปิดเผยข้อมูลส่วนตัวกับบุคคลอื่น',
        'อันตรายจากการเผยแพร่ข้อมูลส่วนตัว — ลักพาตัว สวมรอย',
      ] },
    ],
  },
  {
    id: 'p2',
    emoji: '🧱',
    title: 'ประถมศึกษาปีที่ 2',
    courseUrl: 'https://codingthailand.org/courses/2022/p2',
    indicators: [
      {
        code: 'ว 4.2 ป.2/1',
        text: 'แสดงลำดับขั้นตอนการทำงานหรือการแก้ปัญหาอย่างง่าย โดยใช้ภาพ สัญลักษณ์ หรือข้อความ',
        lessons: [2, 3, 4],
        activities: ['Move It Move It', 'Sequencing Angry Birds', 'Unplugged: เรียงลำดับ'],
      },
      {
        code: 'ว 4.2 ป.2/2',
        text: 'เขียนโปรแกรมอย่างง่าย โดยใช้ซอฟต์แวร์หรือสื่อ และตรวจหาข้อผิดพลาดของโปรแกรม',
        lessons: [4, 5, 6, 7, 8, 9],
        activities: ['Programming Angry Birds', 'Loops Harvester', 'Debugging โจทย์ผิด'],
      },
      {
        code: 'ว 4.2 ป.2/3',
        text: 'ใช้เทคโนโลยีในการสร้าง จัดหมวดหมู่ ค้นหา จัดเก็บ เรียกใช้ข้อมูล',
        lessons: [10, 11, 12],
        activities: ['The Right App', 'จัดหมวดหมู่ไฟล์', 'ค้นหาข้อมูลจาก Internet'],
      },
      {
        code: 'ว 4.2 ป.2/4',
        text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ปฏิบัติตามข้อตกลงในการใช้งาน',
        lessons: [1],
        activities: ['Digital Trails', 'มารยาทออนไลน์', 'รักษาข้อมูลส่วนตัว'],
      },
    ],
    lessons: [
      { name: 'Digital Trails' },
      { name: 'Move It, Move It' },
      { name: 'Sequencing with Angry Birds' },
      { name: 'Programming with Angry Birds' },
      { name: 'Programming with Harvester' },
      { name: 'Getting Loopy' },
      { name: 'Loops with Harvester' },
      { name: 'Loops with Laurel' },
      { name: 'Drawing Gardens with Loops' },
      { name: 'The Right App' },
      { name: 'The Big Event Jr.' },
      { name: 'Mini-Project: A Royal Battle with Events' },
      { name: 'End of Course Project' },
    ],
    units: [
      { no: 1, title: 'การแก้ปัญหาอย่างเป็นขั้นตอน', indicators: [0], topics: [
        'ขั้นตอนการแก้ปัญหา 4 ขั้น: พิจารณาปัญหา → วางแผน → ลงมือ → ตรวจสอบ',
        'พิจารณาและทำความเข้าใจปัญหา (ปัญหาคืออะไร, ข้อมูลเข้ามีอะไร)',
        'วางแผนการแก้ปัญหา (ผลลัพธ์ที่ต้องการ)',
        'สถานการณ์ตัวอย่าง: เลือกอุปกรณ์กันฝนให้เหมาะกับสภาพอากาศ',
      ] },
      { no: 2, title: 'การตรวจหาข้อผิดพลาดของโปรแกรม', indicators: [1], topics: [
        'การเขียนคำสั่งให้โปรแกรมทำงานซ้ำ (Loop)',
        'การตรวจสอบข้อผิดพลาด 2 วิธี: รูปแบบคำสั่ง / ขั้นตอนการทำงาน',
        'การเขียนโปรแกรมด้วย Code.org',
        'แบบฝึกบล็อกคำสั่ง: เก็บน้ำหวาน, ผลิตน้ำผึ้ง',
      ] },
      { no: 3, title: 'การจัดการไฟล์อย่างมีระบบ', indicators: [2], topics: [
        'การใช้งาน Paint, Microsoft Word เบื้องต้น',
        'การสร้างไฟล์ใหม่ (File → New หรือ Ctrl+N)',
        'ส่วนประกอบของหน้าต่างโปรแกรม: แถบชื่อ เมนู เครื่องมือ',
        'การจัดเก็บและจัดหมวดหมู่ไฟล์',
      ] },
      { no: 4, title: 'การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย', indicators: [3], topics: [
        'รู้จักข้อมูลส่วนตัว: เลขประชาชน, รหัสผ่าน, บัญชีธนาคาร, รูปถ่าย',
        'อันตรายจากการเผยแพร่ข้อมูลส่วนตัว',
        'การขอความช่วยเหลือเมื่อเกิดปัญหา (พ่อแม่/ครู, ผู้ดูแลเว็บ, ตำรวจ)',
        'การป้องกัน: ระวังการหลอกลวง "คุณคือผู้โชคดี"',
      ] },
    ],
  },
  {
    id: 'p3',
    emoji: '🔺',
    title: 'ประถมศึกษาปีที่ 3',
    courseUrl: 'https://codingthailand.org/courses/2022/p3',
    indicators: [
      {
        code: 'ว 4.2 ป.3/1',
        text: 'แสดงอัลกอริทึมในการทำงานหรือการแก้ปัญหาอย่างง่าย โดยใช้ภาพ สัญลักษณ์ หรือข้อความ',
        lessons: [2, 3],
        activities: ['My Robotic Friends Jr.', 'อัลกอริทึมการ์ด', 'เขียนผังขั้นตอน'],
      },
      {
        code: 'ว 4.2 ป.3/2',
        text: 'เขียนโปรแกรมอย่างง่าย โดยใช้ซอฟต์แวร์หรือสื่อ และตรวจหาข้อผิดพลาดของโปรแกรม',
        lessons: [3, 4, 5, 6, 7, 8, 9, 11, 12],
        activities: ['Debugging in Maze', 'Loops Rey & BB-8', 'Build a Flappy Game'],
      },
      {
        code: 'ว 4.2 ป.3/3',
        text: 'ใช้อินเทอร์เน็ตค้นหาความรู้',
        lessons: [14],
        activities: ['Picturing Data', 'การค้นหาด้วย Google', 'แหล่งข้อมูลที่น่าเชื่อถือ'],
      },
      {
        code: 'ว 4.2 ป.3/4',
        text: 'รวบรวม ประมวลผล และนำเสนอข้อมูลโดยใช้ซอฟต์แวร์ตามวัตถุประสงค์',
        lessons: [14, 15],
        activities: ['Binary Bracelets', 'นำเสนอข้อมูลด้วย Canva', 'Padlet รวบรวมความคิดเห็น'],
      },
      {
        code: 'ว 4.2 ป.3/5',
        text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ปฏิบัติตามข้อตกลงในการใช้งาน',
        lessons: [1],
        activities: ['Putting a STOP to Online Meanness', 'มารยาทดิจิทัล', 'การกลั่นแกล้งทางไซเบอร์'],
      },
    ],
    lessons: [
      { name: 'Putting a STOP to Online Meanness' },
      { name: 'My Robotic Friends Jr.' },
      { name: 'Programming with Angry Birds' },
      { name: 'Debugging in Maze' },
      { name: 'Collecting Treasure with Laurel' },
      { name: 'Creating Art with Code' },
      { name: 'My Loopy Robotic Friends Jr.' },
      { name: 'Loops with Rey and BB-8' },
      { name: 'Harvesting Crops with Loops' },
      { name: 'Mini-Project: Sticker Art' },
      { name: 'The Big Event' },
      { name: 'Build a Flappy Game' },
      { name: 'Mini-Project: Chase Game' },
      { name: 'Picturing Data' },
      { name: 'Binary Bracelets' },
      { name: 'End of Course Project' },
    ],
    units: [
      { no: 1, title: 'อัลกอริทึมกับการแก้ปัญหา', indicators: [0], topics: [
        'ปัญหาในชีวิตประจำวัน (การเรียน การทำงาน สุขภาพ)',
        '4 ขั้นตอนการแก้ปัญหา: พิจารณา → วางแผน → ลงมือ → ตรวจสอบ',
        'สถานการณ์ตัวอย่าง: แก้ปัญหากล้าเป็นโรคอ้วน',
        'การแสดงอัลกอริทึมด้วยภาพ สัญลักษณ์ ข้อความ',
      ] },
      { no: 2, title: 'การเขียนโปรแกรมอย่างง่าย', indicators: [1], topics: [
        'การเขียนโปรแกรมสั่งให้ตัวละครทำงาน',
        'ขั้นตอน: ออกแบบ → เขียนโปรแกรม → ตรวจสอบผลลัพธ์',
        'ใช้ Code.org กล่องคำสั่งแบบบล็อก',
        'สถานการณ์ตัวอย่าง: สั่งซอมบี้เดินไปเก็บดอกทานตะวัน',
      ] },
      { no: 3, title: 'อินเทอร์เน็ตและเทคโนโลยีสารสนเทศ', indicators: [2, 4], topics: [
        'อินเทอร์เน็ตคือเครือข่ายเชื่อมต่อทั่วโลก',
        'การสืบค้นข้อมูลผ่านเว็บไซต์',
        'รับ-ส่งอีเมล, ทำงานเอกสารต่าง ๆ',
        'ใช้อินเทอร์เน็ตอย่างปลอดภัย และมีมารยาท',
      ] },
      { no: 4, title: 'การรวบรวม ประมวลผล และนำเสนอข้อมูล', indicators: [3], topics: [
        'การรวบรวมข้อมูลจากแหล่งต่าง ๆ',
        'การประมวลผลข้อมูลเบื้องต้น',
        'การนำเสนอด้วยภาพ ตาราง หรือแผนภูมิ',
      ] },
      { no: 5, title: 'การใช้งานซอฟต์แวร์', indicators: [3], topics: [
        'ซอฟต์แวร์ประมวลคำ (Word) สำหรับเอกสาร โปสเตอร์',
        'สถานการณ์ตัวอย่าง: ออกแบบป้ายรณรงค์ทิ้งขยะ',
        'การจัดเค้าโครงหน้ากระดาษ (Page Layout)',
        'การพิมพ์ การจัดรูปแบบตัวอักษร',
      ] },
    ],
  },
  {
    id: 'p4',
    emoji: '🛣️',
    title: 'ประถมศึกษาปีที่ 4',
    courseUrl: 'https://codingthailand.org/courses/2022/p4',
    indicators: [
      {
        code: 'ว 4.2 ป.4/1',
        text: 'ใช้เหตุผลเชิงตรรกะในการแก้ปัญหา การอธิบายการทำงาน การคาดการณ์ผลลัพธ์',
        lessons: [2, 3, 4, 5],
        activities: ['Graph Paper Programming', 'Relay Programming', 'Debugging with Laurel'],
      },
      {
        code: 'ว 4.2 ป.4/2',
        text: 'ออกแบบและเขียนโปรแกรมอย่างง่ายโดยใช้ซอฟต์แวร์หรือสื่อ และตรวจหาข้อผิดพลาดของโปรแกรม',
        lessons: [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17],
        activities: ['Star Wars Game', 'Nested Loops', 'If/Else with Bee'],
      },
      {
        code: 'ว 4.2 ป.4/3',
        text: 'ใช้อินเทอร์เน็ตค้นหาความรู้และประเมินความน่าเชื่อถือของข้อมูล',
        lessons: [],
        activities: ['ตรวจสอบแหล่งข้อมูล', 'Fact-checking เบื้องต้น', 'Wikipedia vs ที่มาทางการ'],
      },
      {
        code: 'ว 4.2 ป.4/4',
        text: 'รวบรวม ประเมิน นำเสนอข้อมูลและสารสนเทศ โดยใช้ซอฟต์แวร์ที่หลากหลาย',
        lessons: [],
        activities: ['Google Sheets / Docs', 'นำเสนอด้วย Canva', 'แผนภูมิด้วย Diagrams.net'],
      },
      {
        code: 'ว 4.2 ป.4/5',
        text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย เข้าใจสิทธิและหน้าที่ของตน',
        lessons: [1],
        activities: ['Password Power-Up', 'สิทธิ์ความเป็นส่วนตัว', 'Interland (Be Internet Awesome)'],
      },
    ],
    lessons: [
      { name: 'Password Power-Up' },
      { name: 'Graph Paper Programming' },
      { name: 'Introduction to Online Puzzles' },
      { name: 'Relay Programming' },
      { name: 'Debugging with Laurel' },
      { name: 'Events in Bounce' },
      { name: 'Build a Star Wars Game' },
      { name: 'Dance Party' },
      { name: 'Loops in Ice Age' },
      { name: 'Drawing Shapes with Loops' },
      { name: 'Nested Loops in Maze' },
      { name: 'Conditionals with Cards' },
      { name: 'Looking Ahead with Minecraft' },
      { name: 'If/Else with Bee' },
      { name: 'While Loops in Farmer' },
      { name: 'Until Loops in Maze' },
      { name: 'End of Course Project' },
    ],
    units: [
      { no: 1, title: 'ขั้นตอนวิธีการแก้ปัญหา (Algorithm)', indicators: [0], topics: [
        'ความหมายของอัลกอริทึม — กระบวนการแก้ปัญหาที่มีขั้นตอนชัดเจน',
        'การแสดงอัลกอริทึมด้วยข้อความ (Natural Language)',
        'การแสดงด้วยรหัสจำลอง (Pseudocode)',
        'การแสดงด้วยผังงาน (Flowchart)',
      ] },
      { no: 2, title: 'การเขียนโปรแกรมอย่างง่ายด้วย Scratch', indicators: [1], topics: [
        'รู้จัก Scratch — โปรแกรมจาก MIT Media Lab (2007)',
        'การสมัครและเข้าใช้งานแบบออนไลน์',
        'การตั้งชื่อผู้ใช้และรหัสผ่านอย่างปลอดภัย',
        'การใช้บล็อกคำสั่งสร้างชิ้นงาน',
      ] },
      { no: 3, title: 'การใช้งานอินเทอร์เน็ต', indicators: [2], topics: [
        'อินเทอร์เน็ตและการแลกเปลี่ยนข้อมูล',
        'การค้นหาความรู้ผ่านเว็บไซต์',
        'การประเมินความน่าเชื่อถือของข้อมูล',
        'การใช้บริการต่าง ๆ บนอินเทอร์เน็ต',
      ] },
      { no: 4, title: 'การนำเสนอข้อมูลด้วยซอฟต์แวร์', indicators: [3], topics: [
        'ซอฟต์แวร์ระบบ vs ซอฟต์แวร์ประยุกต์',
        'Microsoft Word — รายงาน, โปสเตอร์',
        'Microsoft Excel — ตารางข้อมูล, แผนภูมิ',
        'Microsoft PowerPoint — สไลด์นำเสนอ',
      ] },
      { no: 5, title: 'การใช้เทคโนโลยีอย่างปลอดภัย', indicators: [4], topics: [
        'ความหมายของเทคโนโลยีสารสนเทศ (IT)',
        'ความรับผิดชอบของพลเมืองดิจิทัล',
        'รับผิดชอบต่อตนเอง ครอบครัว และชุมชน',
        'รักษาความปลอดภัยทั้งร่างกาย ทรัพย์สิน และข้อมูลส่วนบุคคล',
      ] },
    ],
  },
  {
    id: 'p5',
    emoji: '🌀',
    title: 'ประถมศึกษาปีที่ 5',
    courseUrl: 'https://codingthailand.org/courses/2022/p5',
    indicators: [
      {
        code: 'ว 4.2 ป.5/1',
        text: 'ใช้เหตุผลเชิงตรรกะในการแก้ปัญหา การอธิบายการทำงาน การคาดการณ์ผลลัพธ์ จากปัญหาอย่างง่าย',
        lessons: [2, 3, 4, 5],
        activities: ['Hello World', 'Drawing with Loops', 'Fancy Shapes Nested Loops'],
      },
      {
        code: 'ว 4.2 ป.5/2',
        text: 'ออกแบบและเขียนโปรแกรมที่มีการใช้เหตุผลเชิงตรรกะอย่างง่าย ตรวจหาข้อผิดพลาดและแก้ไข',
        lessons: [6, 7, 8, 9, 10, 11, 12, 15],
        activities: ['Functions in Minecraft', 'Conditionals with Farmer', 'End of Course Project'],
      },
      {
        code: 'ว 4.2 ป.5/3',
        text: 'ใช้อินเทอร์เน็ตค้นหาข้อมูล ติดต่อสื่อสารและทำงานร่วมกัน ประเมินความน่าเชื่อถือของข้อมูล',
        lessons: [14],
        activities: ['Digital Sharing', 'Google Workspace', 'การประเมินข้อมูล'],
      },
      {
        code: 'ว 4.2 ป.5/4',
        text: 'รวบรวม ประเมิน นำเสนอข้อมูลและสารสนเทศตามวัตถุประสงค์ โดยใช้ซอฟต์แวร์',
        lessons: [3],
        activities: ['Mini-Project: About Me', 'Infographic ด้วย Canva', 'แผนภูมิข้อมูล'],
      },
      {
        code: 'ว 4.2 ป.5/5',
        text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีมารยาท เข้าใจสิทธิและหน้าที่',
        lessons: [13, 14],
        activities: ['Designing for Accessibility', 'Digital Citizenship', 'พลเมืองดิจิทัลที่ดี'],
      },
    ],
    lessons: [
      { name: 'Swimming Fish with Sprite Lab' },
      { name: 'Hello World' },
      { name: 'Mini-Project: About Me' },
      { name: 'Drawing with Loops' },
      { name: 'Fancy Shapes using Nested Loops' },
      { name: 'Mini-Project: Design a Snowflake' },
      { name: 'Songwriting' },
      { name: 'Functions in Minecraft' },
      { name: 'Functions with Artist' },
      { name: 'Conditionals in Minecraft: Voyage Aquatic' },
      { name: 'Conditionals with the Farmer' },
      { name: 'Functions with Harvester' },
      { name: 'Designing for Accessibility' },
      { name: 'Digital Sharing' },
      { name: 'End of Course Project' },
    ],
    units: [
      { no: 1, title: 'เหตุผลเชิงตรรกะกับการแก้ปัญหา', indicators: [0], topics: [
        'การหารูปแบบของปัญหา และแยกย่อยเป็นส่วน ๆ',
        'การคัดแยกส่วนสำคัญของปัญหา',
        'การแสดงลำดับขั้นตอนการแก้ปัญหา',
        'ตัวอย่าง: จัดตารางดูภาพยนตร์ในเทศกาลให้ครบทุกเรื่อง',
      ] },
      { no: 2, title: 'การเขียนโปรแกรมโดยใช้เหตุผลเชิงตรรกะ', indicators: [1], topics: [
        'การออกแบบและเขียนโปรแกรมเชิงเหตุผล',
        'เงื่อนไข if/else, การวนซ้ำ',
        'ตรวจหาข้อผิดพลาดและแก้ไข (Debugging)',
        'ใช้ Scratch หรือ Code.org เป็นเครื่องมือ',
      ] },
      { no: 3, title: 'ข้อมูลสารสนเทศ', indicators: [2, 3], topics: [
        'รู้จักข้อมูล: ตัวอักขระ ตัวเลข ภาพ',
        'ลักษณะข้อมูลที่ดี: ถูกต้อง สมบูรณ์ สอดคล้อง ทันสมัย',
        'ประโยชน์ของข้อมูล: การตัดสินใจ การสื่อสาร การเรียน',
        'การประเมินความน่าเชื่อถือ',
      ] },
      { no: 4, title: 'การใช้อินเทอร์เน็ตอย่างปลอดภัย', indicators: [4], topics: [
        'ใช้อินเทอร์เน็ตค้นหาข้อมูล ติดต่อสื่อสาร ทำงานร่วมกัน',
        'ประเมินความน่าเชื่อถือของแหล่งข้อมูล',
        'มีมารยาท เข้าใจสิทธิและหน้าที่',
        'รักษาความปลอดภัยของข้อมูลส่วนบุคคล',
      ] },
    ],
  },
  {
    id: 'p6',
    emoji: '🦔',
    title: 'ประถมศึกษาปีที่ 6',
    courseUrl: 'https://codingthailand.org/courses/2022/p6',
    indicators: [
      {
        code: 'ว 4.2 ป.6/1',
        text: 'ใช้เหตุผลเชิงตรรกะในการอธิบายและออกแบบวิธีการแก้ปัญหาที่พบในชีวิตประจำวัน',
        lessons: [2, 3, 4, 12, 13],
        activities: ['Sprites in Action', 'Simulating Experiments', 'Outbreak Simulation'],
      },
      {
        code: 'ว 4.2 ป.6/2',
        text: 'ออกแบบและเขียนโปรแกรมอย่างง่าย เพื่อแก้ปัญหาในชีวิตประจำวัน ตรวจหาข้อผิดพลาดและแก้ไข',
        lessons: [5, 6, 7, 8, 9, 10, 11, 16],
        activities: ['Virtual Pet', 'Counting Variables', 'Collector Game', 'AI for Oceans'],
      },
      {
        code: 'ว 4.2 ป.6/3',
        text: 'ใช้อินเทอร์เน็ตในการค้นหาข้อมูลอย่างมีประสิทธิภาพ',
        lessons: [15],
        activities: ['The Internet (How it works)', 'การค้นหาขั้นสูง', 'Boolean search'],
      },
      {
        code: 'ว 4.2 ป.6/4',
        text: 'ใช้เทคโนโลยีสารสนเทศทำงานร่วมกันอย่างปลอดภัย เข้าใจสิทธิและหน้าที่ เคารพในสิทธิของผู้อื่น',
        lessons: [1],
        activities: ['The Power of Words', 'Cyberbullying Prevention', 'ลิขสิทธิ์และเครดิต'],
      },
    ],
    lessons: [
      { name: 'The Power of Words' },
      { name: 'Introducing Sprite Lab' },
      { name: 'Making Sprites' },
      { name: 'Sprites in Action' },
      { name: 'Mini-Project: Virtual Pet' },
      { name: 'Blank Space Stories' },
      { name: 'Text and Prompts' },
      { name: 'Mini-Project: User Input Programs' },
      { name: 'Lots of Sprites' },
      { name: 'Counting with Variables' },
      { name: 'Mini-Project: Collector Game' },
      { name: 'Simulating Experiments' },
      { name: 'Outbreak' },
      { name: 'AI For Oceans' },
      { name: 'The Internet' },
      { name: 'End of Course Project' },
    ],
    units: [
      { no: 1, title: 'การแก้ปัญหาโดยใช้เหตุผลเชิงตรรกะ', indicators: [0], topics: [
        'นำกฎเกณฑ์/เงื่อนไขมาใช้พิจารณาความสมเหตุสมผล',
        'ใช้การให้เหตุผลคาดการณ์ผลลัพธ์',
        'ตัวอย่าง: จัดอันดับผลการแข่งขันจากเงื่อนไขที่กำหนด',
        'การแก้ปัญหาในชีวิตประจำวัน',
      ] },
      { no: 2, title: 'การออกแบบและเขียนโปรแกรมอย่างง่าย', indicators: [1], topics: [
        'การออกแบบโปรแกรมโดยใช้ผังงาน (Flowchart)',
        'สัญลักษณ์ผังงาน: Start/End, Process, Decision',
        'ตัวอย่าง: ตรวจสอบเลขน้อยกว่า 20',
        'เขียนด้วย Scratch — บล็อกคำสั่ง, สร้างเกม/นิทาน',
      ] },
      { no: 3, title: 'การใช้งานอินเทอร์เน็ตอย่างมีประสิทธิภาพ', indicators: [2], topics: [
        'เทคนิคการค้นหาด้วยคำสำคัญ (Keyword)',
        'ค้นหาโดยระบุชนิดของไฟล์ (.pdf, .jpg)',
        'ค้นหาโดยระบุประเภทเว็บไซต์ (Site:co.th)',
        'การค้นหาขั้นสูงด้วย Google',
      ] },
      { no: 4, title: 'ความปลอดภัยในการใช้งานเทคโนโลยีสารสนเทศ', indicators: [3], topics: [
        'อันตรายจากอินเทอร์เน็ต: การล่อลวงเยาวชน, ฟิชชิง (Phishing)',
        'พ.ร.บ.คอมพิวเตอร์ — โทษและการกระทำผิด',
        'เคารพสิทธิและลิขสิทธิ์ของผู้อื่น',
        'แจ้งผู้เกี่ยวข้องเมื่อพบเนื้อหาไม่เหมาะสม',
      ] },
    ],
  },
  {
    id: 'm1-cs',
    emoji: '💻',
    title: 'ม.1 วิทยาการคำนวณ',
    courseUrl: '#',
    indicators: [
      { code: 'ว 4.2 ม.1/1', text: 'ออกแบบอัลกอริทึมที่ใช้แนวคิดเชิงนามธรรมเพื่อแก้ปัญหาในชีวิตประจำวัน', lessons: [0], activities: ['การพิจารณารูปแบบและคัดเลือกคุณลักษณะ', 'การถ่ายทอดรายละเอียดของปัญหา'] },
      { code: 'ว 4.2 ม.1/2', text: 'ออกแบบและเขียนโปรแกรมอย่างง่ายเพื่อแก้ปัญหาทางคณิตศาสตร์หรือวิทยาศาสตร์', lessons: [1], activities: ['เขียนรหัสจำลองและผังงาน', 'เขียน Scratch ที่มีตัวแปร เงื่อนไข วนซ้ำ'] },
      { code: 'ว 4.2 ม.1/3', text: 'รวบรวมข้อมูลปฐมภูมิ ประมวลผล ประเมินผล นำเสนอข้อมูล', lessons: [1], activities: ['การรวบรวมข้อมูล', 'ซอฟต์แวร์จัดการข้อมูล'] },
      { code: 'ว 4.2 ม.1/4', text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ใช้สื่อและแหล่งข้อมูลตามข้อกำหนด', lessons: [1], activities: ['ภัยคุกคามจากการใช้ ICT', 'การรู้เท่าทันสื่อ'] }
    ],
    lessons: [
      { name: 'หน่วย 1: แนวคิดเชิงนามธรรมและการแก้ปัญหา', url: '#' },
      { name: 'หน่วย 2: การเขียนโปรแกรม Scratch + ข้อมูล + ความปลอดภัย', url: '#' }
    ],
    units: [
      { no: 1, title: 'แนวคิดเชิงนามธรรมและการแก้ปัญหา', indicators: [0], topics: [
        'การพิจารณารูปแบบ (Pattern Recognition)',
        'การคัดเลือกคุณลักษณะที่จำเป็น (Abstraction)',
        'การถ่ายทอดรายละเอียดของปัญหา',
        'ขั้นตอนการแก้ปัญหา 4 ขั้น',
        'การเขียนรหัสลำลอง (Pseudocode)',
        'การเขียนผังงาน (Flowchart)',
      ] },
      { no: 2, title: 'Scratch + ข้อมูล + ความปลอดภัย', indicators: [1, 2, 3], topics: [
        'รู้จักโปรแกรม Scratch และหลักการทำงานแบบวนซ้ำ',
        'การสร้างตัวแปรใน Scratch',
        'การทำงานแบบมีทางเลือก (Conditional)',
        'การโปรแกรม Scratch เพื่อประยุกต์ใช้งาน',
        'ข้อมูลและการรวบรวมข้อมูล',
        'การประมวลผลข้อมูลด้วยซอฟต์แวร์',
        'ภัยคุกคามจากการใช้เทคโนโลยีและการป้องกัน',
        'การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย',
      ] },
    ],
  },
  {
    id: 'm1-design',
    emoji: '🛠️',
    title: 'ม.1 ออกแบบและเทคโนโลยี',
    courseUrl: '#',
    indicators: [
      { code: 'ว 4.1 ม.1/1', text: 'อธิบายแนวคิดหลักของเทคโนโลยีในชีวิตประจำวันและวิเคราะห์การเปลี่ยนแปลง', lessons: [0], activities: ['วิเคราะห์เทคโนโลยี', 'ระบบทางเทคโนโลยี'] },
      { code: 'ว 4.1 ม.1/2', text: 'ระบุปัญหาหรือความต้องการในชีวิตประจำวัน รวบรวมข้อมูล นำเสนอแนวทางการแก้ปัญหา', lessons: [1], activities: ['ออกแบบเชิงวิศวกรรม'] },
      { code: 'ว 4.1 ม.1/3', text: 'ออกแบบวิธีการแก้ปัญหา โดยวิเคราะห์เปรียบเทียบและตัดสินใจเลือกข้อมูล', lessons: [1], activities: ['สร้างต้นแบบ'] },
      { code: 'ว 4.1 ม.1/4', text: 'ทดสอบ ประเมินผล และระบุข้อบกพร่อง พร้อมแนวทางการปรับปรุงแก้ไข', lessons: [1], activities: ['การทดสอบและปรับปรุง'] },
      { code: 'ว 4.1 ม.1/5', text: 'ใช้ความรู้และทักษะเกี่ยวกับวัสดุ อุปกรณ์ เครื่องมือ กลไก ไฟฟ้า อิเล็กทรอนิกส์', lessons: [2], activities: ['ปฏิบัติงานช่างพื้นฐาน'] }
    ],
    lessons: [
      { name: 'หน่วย 1: เทคโนโลยีกับมนุษย์', url: '#' },
      { name: 'หน่วย 2: กระบวนการออกแบบเชิงวิศวกรรม', url: '#' },
      { name: 'หน่วย 3: วัสดุและเครื่องมือช่าง', url: '#' }
    ],
    units: [
      { no: 1, title: 'เทคโนโลยีกับมนุษย์', indicators: [0], topics: [
        'ความหมายและความสำคัญของเทคโนโลยี',
        'ระบบทางเทคโนโลยี (Input → Process → Output)',
        'การเปลี่ยนแปลงของเทคโนโลยี',
        'ผลกระทบของเทคโนโลยีต่อชีวิตและสิ่งแวดล้อม',
      ] },
      { no: 2, title: 'กระบวนการออกแบบเชิงวิศวกรรม', indicators: [1, 2, 3], topics: [
        'การระบุปัญหา (Problem Identification)',
        'การรวบรวมข้อมูลและแนวคิดที่เกี่ยวข้อง',
        'การออกแบบวิธีการแก้ปัญหา',
        'การวางแผนและสร้างต้นแบบ (Prototype)',
        'การทดสอบ ประเมินผล และปรับปรุง',
        'การนำเสนอวิธีการแก้ปัญหา',
      ] },
      { no: 3, title: 'วัสดุและเครื่องมือช่าง', indicators: [4], topics: [
        'ประเภทของวัสดุ (ไม้ โลหะ พลาสติก เซรามิก)',
        'สมบัติของวัสดุและการเลือกใช้',
        'เครื่องมือช่างพื้นฐานและการใช้งาน',
        'กลไกพื้นฐาน (คาน รอก ล้อและเพลา)',
        'ไฟฟ้าและอิเล็กทรอนิกส์เบื้องต้น',
        'ความปลอดภัยในการปฏิบัติงานช่าง',
      ] }
    ],
  },
  {
    id: 'm2-cs',
    emoji: '💻',
    title: 'ม.2 วิทยาการคำนวณ',
    courseUrl: '#',
    indicators: [
      { code: 'ว 4.2 ม.2/1', text: 'ออกแบบอัลกอริทึมที่ใช้แนวคิดเชิงคำนวณในการแก้ปัญหา', lessons: [0], activities: ['แนวคิดเชิงคำนวณ'] },
      { code: 'ว 4.2 ม.2/2', text: 'ออกแบบและเขียนโปรแกรมที่ใช้ตรรกะและฟังก์ชัน', lessons: [1], activities: ['การใช้ฟังก์ชัน Python'] },
      { code: 'ว 4.2 ม.2/3', text: 'อภิปรายองค์ประกอบและหลักการทำงานของระบบคอมพิวเตอร์', lessons: [2], activities: ['องค์ประกอบฮาร์ดแวร์'] },
      { code: 'ว 4.2 ม.2/4', text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีความรับผิดชอบ', lessons: [3], activities: ['จริยธรรมข้อมูล'] }
    ],
    lessons: [
      { name: 'การคิดเชิงคำนวณ', url: '#' },
      { name: 'ฟังก์ชันในโปรแกรม', url: '#' },
      { name: 'ระบบคอมพิวเตอร์', url: '#' },
      { name: 'กฎหมายคอมพิวเตอร์', url: '#' }
    ],
    units: [
      { no: 1, title: 'แนวคิดเชิงคำนวณ', indicators: [0], topics: [
        'แนวคิดเชิงคำนวณ (Computational Thinking) 1',
        'แนวคิดเชิงคำนวณ 2 — การคิดเชิงนามธรรม',
        'การแยกส่วนประกอบ (Decomposition)',
        'การหารูปแบบของปัญหา (Pattern Recognition)',
        'การออกแบบอัลกอริทึม (Algorithm Design)',
      ] },
      { no: 2, title: 'การเขียนโปรแกรม Python — ตรรกะและฟังก์ชัน', indicators: [1], topics: [
        'ตัวดำเนินการบูลีน (Boolean Operators) 1 และ 2',
        'การวนซ้ำด้วยคำสั่ง while 1 และ 2',
        'ฟังก์ชัน (Function) 1 และ 2',
        'การประยุกต์ใช้งานในโจทย์ปัญหา',
      ] },
      { no: 3, title: 'หลักการทำงานของระบบคอมพิวเตอร์ + เครือข่าย', indicators: [2], topics: [
        'หลักการทำงานของระบบคอมพิวเตอร์ 1 และ 2',
        'ซอฟต์แวร์ประยุกต์',
        'องค์ประกอบของการสื่อสาร',
        'เครือข่ายคอมพิวเตอร์',
        'อินเทอร์เน็ต',
        'บริการบนอินเทอร์เน็ตและคลาวด์คอมพิวติง',
      ] },
      { no: 4, title: 'การใช้ ICT อย่างปลอดภัยและมีจริยธรรม', indicators: [3], topics: [
        'แนวทางปฏิบัติเมื่อพบเนื้อหาไม่เหมาะสม',
        'ผลกระทบของการเผยแพร่ข้อมูลที่ไม่เหมาะสม',
        'การสร้างและแสดงสิทธิ์ความเป็นเจ้าของผลงาน',
        'มารยาทในการติดต่อสื่อสาร',
        'พ.ร.บ.คอมพิวเตอร์',
      ] }
    ],
  },
  {
    id: 'm2-design',
    emoji: '🛠️',
    title: 'ม.2 ออกแบบและเทคโนโลยี',
    courseUrl: '#',
    indicators: [
      { code: 'ว 4.1 ม.2/1', text: 'คาดการณ์แนวโน้มเทคโนโลยีที่จะเกิดขึ้น', lessons: [0], activities: ['วิเคราะห์แนวโน้ม'] },
      { code: 'ว 4.1 ม.2/2', text: 'ระบุปัญหาหรือความต้องการในชุมชน', lessons: [1], activities: ['โปรเจกต์แก้ปัญหาชุมชน'] },
      { code: 'ว 4.1 ม.2/3', text: 'ออกแบบวิธีการแก้ปัญหา', lessons: [1], activities: ['สร้างโมเดล'] },
      { code: 'ว 4.1 ม.2/4', text: 'ทดสอบ ประเมินผล และอธิบายปัญหาหรือข้อบกพร่อง', lessons: [1], activities: ['การทดสอบผลงาน'] },
      { code: 'ว 4.1 ม.2/5', text: 'ใช้ความรู้และทักษะเกี่ยวกับวัสดุ อุปกรณ์ กลไก ไฟฟ้า', lessons: [2], activities: ['ต่อวงจรเบื้องต้น'] }
    ],
    lessons: [
      { name: 'เทคโนโลยีในอนาคต', url: '#' },
      { name: 'การประเมินผล', url: '#' },
      { name: 'กลไกและไฟฟ้า', url: '#' }
    ],
    units: [
      { no: 1, title: 'เทคโนโลยีกับชีวิต', indicators: [0], topics: [
        'การเปลี่ยนแปลงและผลกระทบของเทคโนโลยี',
        'แนวโน้มเทคโนโลยีในอนาคต',
        'เทคโนโลยีในชีวิตประจำวัน',
        'ผลกระทบเชิงบวกและลบของเทคโนโลยี',
      ] },
      { no: 2, title: 'วัสดุ อุปกรณ์ทางเทคโนโลยี', indicators: [4], topics: [
        'ความรู้เกี่ยวกับวัสดุ (ไม้ โลหะ พลาสติก ฯลฯ)',
        'เครื่องกลและเครื่องมือในการสร้างชิ้นงาน',
        'เสียงและอุปกรณ์ที่ทำให้เกิดเสียง',
        'ไฟฟ้าและอุปกรณ์ที่ทำให้เกิดแสง',
      ] },
      { no: 3, title: 'กระบวนการออกแบบเชิงวิศวกรรม', indicators: [1, 2, 3], topics: [
        'กระบวนการทางวิทยาศาสตร์',
        'กระบวนการออกแบบเชิงวิศวกรรม 6 ขั้น',
        'การระบุปัญหาและรวบรวมข้อมูล',
        'การออกแบบ ทดสอบ และประเมินผล',
      ] },
      { no: 4, title: 'การคิดเชิงออกแบบ (Design Thinking)', indicators: [1, 2], topics: [
        'กระบวนการคิดเชิงออกแบบ 5 ขั้น (Empathize → Define → Ideate → Prototype → Test)',
        'การถอดความคิดเชิงออกแบบสู่การปฏิบัติ',
        'การทำความเข้าใจผู้ใช้',
        'การระดมความคิดและสร้างต้นแบบ',
      ] }
    ],
  },
  {
    id: 'm3-cs',
    emoji: '💻',
    title: 'ม.3 วิทยาการคำนวณ',
    courseUrl: '#',
    indicators: [
      { code: 'ว 4.2 ม.3/1', text: 'พัฒนาแอปพลิเคชันที่มีการบูรณาการกับวิชาอื่น', lessons: [0], activities: ['พัฒนาแอป'] },
      { code: 'ว 4.2 ม.3/2', text: 'รวบรวมข้อมูล ประมวลผล ประเมินผล นำเสนอข้อมูล', lessons: [1], activities: ['การทำข้อมูลสรุป'] },
      { code: 'ว 4.2 ม.3/3', text: 'ประเมินความน่าเชื่อถือของข้อมูล วิเคราะห์สื่อ', lessons: [2], activities: ['รู้ทันสื่อ'] },
      { code: 'ว 4.2 ม.3/4', text: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัยและมีจริยธรรม', lessons: [3], activities: ['ลิขสิทธิ์'] }
    ],
    lessons: [
      { name: 'การพัฒนาแอปพลิเคชัน', url: '#' },
      { name: 'วิทยาการข้อมูล', url: '#' },
      { name: 'เครือข่ายอินเทอร์เน็ต', url: '#' },
      { name: 'ทรัพย์สินทางปัญญา', url: '#' }
    ],
    units: [
      { no: 1, title: 'การพัฒนาแอปพลิเคชัน', indicators: [0], topics: [
        'การพัฒนาแอปพลิเคชัน 1 — แนวคิดและการออกแบบ',
        'การพัฒนาแอปพลิเคชัน 2 — การสร้าง UX/UI',
        'การสร้างส่วนต่อประสานกราฟิก (GUI) 1-4',
        'องค์ประกอบของไอโอที (IoT)',
        'กรณีศึกษาการพัฒนาแอปพลิเคชัน IoT',
      ] },
      { no: 2, title: 'การประมวลผลข้อมูลและสารสนเทศ', indicators: [1], topics: [
        'การประมวลผลสารสนเทศ 1 และ 2',
        'การประมวลผลข้อมูล 1 และ 2',
        'วิทยาการข้อมูลเบื้องต้น (Data Science)',
        'การนำเสนอข้อมูลด้วยภาพ',
      ] },
      { no: 3, title: 'การประเมินข้อมูลและการรู้เท่าทันสื่อ', indicators: [2], topics: [
        'การประเมินความน่าเชื่อถือของข้อมูล',
        'เหตุผลวิบัติ (Logical Fallacies) 1 และ 2',
        'การรู้เท่าทันสื่อและข่าวลวง',
        'ผลกระทบของข่าวลวงและสื่อปลอม',
      ] },
      { no: 4, title: 'การใช้เทคโนโลยีอย่างปลอดภัยและถูกกฎหมาย', indicators: [3], topics: [
        'การทำธุรกรรมอิเล็กทรอนิกส์อย่างปลอดภัย',
        'กฎหมายเกี่ยวกับคอมพิวเตอร์ (พ.ร.บ.คอมพิวเตอร์)',
        'การใช้ลิขสิทธิ์ที่เป็นธรรม (Fair Use)',
        'จริยธรรมในการใช้เทคโนโลยี',
      ] }
    ],
  },
  {
    id: 'm3-design',
    emoji: '🛠️',
    title: 'ม.3 ออกแบบและเทคโนโลยี',
    courseUrl: '#',
    indicators: [
      { code: 'ว 4.1 ม.3/1', text: 'วิเคราะห์สาเหตุหรือปัจจัยที่ส่งผลต่อการเปลี่ยนแปลงของเทคโนโลยี ความสัมพันธ์ของเทคโนโลยีกับศาสตร์อื่น', lessons: [0], activities: ['วิเคราะห์นวัตกรรม'] },
      { code: 'ว 4.1 ม.3/2', text: 'ระบุปัญหาหรือความต้องการของชุมชนหรือท้องถิ่นเพื่อพัฒนางานอาชีพ', lessons: [1], activities: ['สำรวจปัญหาในชุมชน'] },
      { code: 'ว 4.1 ม.3/3', text: 'ออกแบบวิธีการแก้ปัญหา โดยวิเคราะห์เปรียบเทียบและตัดสินใจเลือกข้อมูล', lessons: [3], activities: ['ออกแบบนวัตกรรม'] },
      { code: 'ว 4.1 ม.3/4', text: 'ทดสอบ ประเมินผล วิเคราะห์ และให้เหตุผลของปัญหาหรือข้อบกพร่อง', lessons: [3], activities: ['การประเมินผลเชิงลึก'] },
      { code: 'ว 4.1 ม.3/5', text: 'ใช้ความรู้และทักษะเกี่ยวกับวัสดุ อุปกรณ์ กลไก ไฟฟ้า และอิเล็กทรอนิกส์', lessons: [2], activities: ['การทำชิ้นงานและนวัตกรรม'] }
    ],
    lessons: [
      { name: 'หน่วย 1: เทคโนโลยีกับชีวิต', url: '#' },
      { name: 'หน่วย 2: เทคโนโลยีกับการพัฒนางานอาชีพ', url: '#' },
      { name: 'หน่วย 3: วัสดุ อุปกรณ์ เครื่องมือ', url: '#' },
      { name: 'หน่วย 4: การแก้ปัญหาชุมชนด้วยกระบวนการออกแบบ', url: '#' }
    ],
    units: [
      { no: 1, title: 'เทคโนโลยีกับชีวิต', indicators: [0], topics: [
        'สาเหตุหรือปัจจัยที่ส่งผลต่อการเปลี่ยนแปลงของเทคโนโลยี',
        'ความสัมพันธ์ของเทคโนโลยีกับศาสตร์อื่น (วิทยาศาสตร์ คณิตศาสตร์ ศิลปะ)',
        'การนำเทคโนโลยีไปสร้างนวัตกรรมใหม่',
        'แนวโน้มเทคโนโลยีในอนาคต',
      ] },
      { no: 2, title: 'เทคโนโลยีกับการพัฒนางานอาชีพในชุมชน', indicators: [1], topics: [
        'ปัญหาหรือความต้องการภายในชุมชนหรือท้องถิ่น',
        'การใช้เทคโนโลยีในการแก้ปัญหาของชุมชน',
        'นวัตกรรมเพื่อพัฒนาอาชีพ',
        'ตัวอย่างการประยุกต์ใช้เทคโนโลยีในชุมชน',
      ] },
      { no: 3, title: 'วัสดุ อุปกรณ์ เครื่องมือ และความรู้ในการแก้ปัญหา', indicators: [4], topics: [
        'การเลือกใช้วัสดุที่เหมาะสมกับงาน',
        'เครื่องมือและอุปกรณ์ในการสร้างชิ้นงาน',
        'ความรู้ทางกลไก ไฟฟ้า และอิเล็กทรอนิกส์',
        'ความปลอดภัยในการทำงาน',
      ] },
      { no: 4, title: 'การแก้ปัญหาชุมชนด้วยกระบวนการออกแบบเชิงวิศวกรรม', indicators: [2, 3], topics: [
        'ระบุปัญหาที่พบในชุมชน',
        'รวบรวมข้อมูลและแนวคิด',
        'ออกแบบวิธีการแก้ปัญหา',
        'สร้างต้นแบบและทดสอบ',
        'ประเมินผลและปรับปรุง',
        'นำเสนอผลงานสู่ชุมชน',
      ] }
    ],
  },

  // ===== AI Courses (เสริมหลักสูตร) =====
  {
    id: 'ai-p1-3',
    emoji: '🤖',
    title: 'AI สำหรับเด็กเล็ก (ป.1-3)',
    courseUrl: '#',
    indicators: [
      { code: 'AI-1', text: 'รู้จัก AI และตัวอย่าง AI ในชีวิตประจำวัน', lessons: [0], activities: ['ค้นหา AI รอบตัว'] },
      { code: 'AI-2', text: 'เข้าใจว่า AI เรียนรู้จากข้อมูลและตัวอย่าง', lessons: [1], activities: ['สอน AI จำแนกภาพ'] },
      { code: 'AI-3', text: 'ใช้ AI อย่างปลอดภัย เคารพและมีมารยาท', lessons: [2], activities: ['มารยาทการใช้ AI'] },
    ],
    lessons: [
      { name: 'รู้จัก AI', url: '#' },
      { name: 'AI เรียนรู้ได้', url: '#' },
      { name: 'AI กับเรา', url: '#' },
    ],
    units: [
      { no: 1, title: 'รู้จัก AI คืออะไร', indicators: [0], topics: [
        'AI = Artificial Intelligence (ปัญญาประดิษฐ์)',
        'AI ในของเล่นและของใช้รอบตัว (Siri, Google Assistant, ฟิลเตอร์)',
        'AI ทำงานเหมือนคนในเรื่องอะไรบ้าง',
        'AI vs คน — ใครเก่งกว่าด้านไหน',
      ] },
      { no: 2, title: 'AI เรียนรู้ได้อย่างไร', indicators: [1], topics: [
        'AI เรียนรู้จากตัวอย่างจำนวนมาก',
        'การจำแนกภาพ (เช่น แมว vs หมา)',
        'การวาดภาพแล้ว AI ทาย (Quick, Draw!)',
        'ทดลองสอน AI ผ่าน Teachable Machine',
      ] },
      { no: 3, title: 'AI กับเรา — ใช้ให้เป็น ใช้ให้ดี', indicators: [2], topics: [
        'AI ช่วยอะไรเราในชีวิตประจำวัน',
        'AI ไม่ได้ฉลาดทุกอย่าง — บางครั้งก็ผิด',
        'มารยาทการใช้ AI (พูดให้สุภาพ ไม่หลอก)',
        'อย่าให้ข้อมูลส่วนตัวกับ AI',
      ] },
    ],
  },
  {
    id: 'ai-p4-6',
    emoji: '🧠',
    title: 'AI ฉลาดยังไง? (ป.4-6)',
    courseUrl: '#',
    indicators: [
      { code: 'AI-1', text: 'อธิบายหลักการ Machine Learning เบื้องต้น', lessons: [0], activities: ['อธิบายหลักการ ML'] },
      { code: 'AI-2', text: 'สร้างโมเดล AI อย่างง่ายเพื่อจำแนกข้อมูล', lessons: [1], activities: ['Teachable Machine'] },
      { code: 'AI-3', text: 'ใช้ Generative AI อย่างเหมาะสม รู้ข้อจำกัด', lessons: [2], activities: ['ทดลอง Generative AI'] },
      { code: 'AI-4', text: 'เข้าใจจริยธรรม AI และอคติ (Bias)', lessons: [3], activities: ['วิเคราะห์อคติของ AI'] },
    ],
    lessons: [
      { name: 'AI กับ Machine Learning', url: '#' },
      { name: 'สร้างโมเดล AI ของตัวเอง', url: '#' },
      { name: 'Generative AI รู้ทันเครื่องมือ', url: '#' },
      { name: 'จริยธรรม AI', url: '#' },
    ],
    units: [
      { no: 1, title: 'AI กับ Machine Learning เบื้องต้น', indicators: [0], topics: [
        'AI คืออะไร แตกต่างจากโปรแกรมทั่วไปอย่างไร',
        'Machine Learning — เรียนรู้จากข้อมูล',
        'ประเภทการเรียนรู้: Supervised, Unsupervised, Reinforcement (อย่างง่าย)',
        'ตัวอย่าง: Netflix, YouTube แนะนำคลิป, Google Maps คาดการณ์รถติด',
        'เกม AI: AI for Oceans, Akinator, Quick Draw',
      ] },
      { no: 2, title: 'สร้างโมเดล AI ของตัวเอง', indicators: [1], topics: [
        'Teachable Machine — สอน AI จำแนกภาพ/เสียง/ท่าทาง',
        'ขั้นตอน: เก็บข้อมูล → Train โมเดล → ทดสอบ',
        'เข้าใจว่าทำไมต้องใช้ตัวอย่างเยอะ',
        'การปรับปรุงโมเดลให้แม่นยำขึ้น',
        'Project: สร้าง AI จำแนกอารมณ์/สิ่งของ',
      ] },
      { no: 3, title: 'Generative AI — รู้ทันเครื่องมือสร้างสรรค์', indicators: [2], topics: [
        'ChatGPT, Gemini — AI ช่วยเขียน/ตอบคำถาม',
        'AI สร้างภาพ (DALL-E, Midjourney เป็นต้น)',
        'AI สร้างเสียง/วิดีโอ',
        'ข้อดี-ข้อจำกัด: AI สามารถผิดได้ (Hallucination)',
        'การใช้ AI ช่วยเรียน — ตรวจคำตอบ ตั้งคำถาม',
      ] },
      { no: 4, title: 'จริยธรรม AI และอคติ (Bias)', indicators: [3], topics: [
        'อคติของ AI (Bias) เกิดจากข้อมูลที่ใช้ Train',
        'ลิขสิทธิ์ของ AI: ภาพ/ข้อความที่ AI สร้าง ใครเป็นเจ้าของ?',
        'Deepfake — ภาพ/วิดีโอปลอมจาก AI',
        'การใช้ AI อย่างมีจริยธรรม (อ้างอิง ไม่หลอก ไม่ทำร้าย)',
        'ความเป็นส่วนตัว — อย่าใส่ข้อมูลส่วนตัวใน AI',
      ] },
    ],
  },
  {
    id: 'ai-m1-3',
    emoji: '💡',
    title: 'AI ขั้นปฏิบัติ (ม.1-3)',
    courseUrl: '#',
    indicators: [
      { code: 'AI-1', text: 'อธิบาย Foundations ของ AI: ML, DL, Neural Networks', lessons: [0], activities: ['Neural Network Playground'] },
      { code: 'AI-2', text: 'ประยุกต์ใช้ AI: Computer Vision และ Natural Language Processing', lessons: [1], activities: ['สร้าง CV/NLP project'] },
      { code: 'AI-3', text: 'เขียน Prompt ที่มีประสิทธิภาพ (Prompt Engineering)', lessons: [2], activities: ['ฝึกเขียน Prompt'] },
      { code: 'AI-4', text: 'วิเคราะห์ผลกระทบ จริยธรรม และอคติของ AI', lessons: [3], activities: ['Case study AI ethics'] },
      { code: 'AI-5', text: 'พัฒนาโครงงาน AI เพื่อแก้ปัญหาในชีวิตจริง', lessons: [4], activities: ['สร้างโครงงาน AI'] },
    ],
    lessons: [
      { name: 'AI Foundations', url: '#' },
      { name: 'Computer Vision & NLP', url: '#' },
      { name: 'Prompt Engineering', url: '#' },
      { name: 'AI Ethics & Bias', url: '#' },
      { name: 'AI Project', url: '#' },
    ],
    units: [
      { no: 1, title: 'AI Foundations — รากฐานปัญญาประดิษฐ์', indicators: [0], topics: [
        'ประวัติและพัฒนาการของ AI',
        'AI vs ML vs Deep Learning — แตกต่างกันอย่างไร',
        'ประเภทการเรียนรู้: Supervised / Unsupervised / Reinforcement Learning',
        'Neural Networks เบื้องต้น (Input → Hidden Layer → Output)',
        'Dataset และความสำคัญของข้อมูลคุณภาพ',
        'Train/Test Split, Overfitting',
      ] },
      { no: 2, title: 'Computer Vision & NLP — AI เห็น/อ่าน/เขียน', indicators: [1], topics: [
        'Computer Vision: AI จำแนกภาพ ตรวจจับวัตถุ',
        'การประยุกต์: รถยนต์ขับเอง, ใบหน้าใน Smartphone, ตรวจมะเร็ง',
        'NLP: AI เข้าใจภาษา (Translation, Sentiment Analysis)',
        'Speech Recognition และ Text-to-Speech',
        'Project: ใช้ Teachable Machine สร้าง CV model',
        'Project: ใช้ Hugging Face Spaces ทดลอง NLP',
      ] },
      { no: 3, title: 'Prompt Engineering — ศาสตร์การสั่งงาน AI', indicators: [2], topics: [
        'หลักการเขียน Prompt ที่ดี (Clear, Specific, Context, Examples)',
        'เทคนิค: Zero-shot, Few-shot, Chain-of-Thought',
        'Role Prompting: "คุณเป็นครูสอนวิทย์..."',
        'การ Iterate และปรับปรุง Prompt',
        'การใช้ AI ช่วยทำการบ้าน — ใช้อย่างไรไม่ให้เป็นการลักลอก',
        'ข้อจำกัด: Hallucination, ความเป็นปัจจุบันของข้อมูล',
      ] },
      { no: 4, title: 'AI Ethics & Bias — จริยธรรมและอคติ', indicators: [3], topics: [
        'Bias ใน AI: เกิดจากข้อมูลและโมเดลอย่างไร',
        'กรณีศึกษา: AI HR คัดคนเอนเอียงเพศ, AI กฎหมายเอนเอียงเชื้อชาติ',
        'Deepfake และผลกระทบต่อสังคม',
        'ลิขสิทธิ์ผลงาน AI — ใครเป็นเจ้าของ? (กฎหมายปัจจุบัน)',
        'Privacy: ข้อมูลที่ AI เก็บ',
        'การใช้ AI อย่างมีความรับผิดชอบ (Responsible AI)',
      ] },
      { no: 5, title: 'โครงงาน AI — แก้ปัญหาในชีวิตจริง', indicators: [4], topics: [
        'กระบวนการ AI Project: ระบุปัญหา → เก็บข้อมูล → Train → Deploy → ประเมิน',
        'เลือกเครื่องมือ: Teachable Machine / Scratch + AI / ML for Kids',
        'ตัวอย่างโครงงาน: ระบบจำแนกขยะรีไซเคิล, ตรวจสอบสุขภาพพืช, แชตบอตช่วยเรียน',
        'การนำเสนอผลงาน — ปัญหา วิธีการ ผลลัพธ์ ข้อจำกัด',
        'AI กับอนาคตอาชีพ',
      ] },
    ],
  },
  {
    id: 'arduino-basic',
    emoji: '🔌',
    title: 'Arduino เบื้องต้นและไมโครคอนโทรลเลอร์',
    courseUrl: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/',
    indicators: [
      {
        code: 'ARD-1',
        text: 'อธิบายบทบาทของไมโครคอนโทรลเลอร์ Arduino และองค์ประกอบฮาร์ดแวร์/ซอฟต์แวร์ในการสร้างงานอิเล็กทรอนิกส์ได้',
        lessons: [0],
        activities: ['สำรวจบอร์ด Arduino UNO R3 และระบุหน้าที่ของขาใช้งานสำคัญ'],
      },
      {
        code: 'ARD-2',
        text: 'ติดตั้งและตั้งค่า Arduino IDE เลือกบอร์ด พอร์ต และอัปโหลดโปรแกรมตัวอย่างได้อย่างถูกต้อง',
        lessons: [1],
        activities: ['ตั้งค่า Board/Port/Programmer แล้วทดลองอัปโหลด Blink'],
      },
      {
        code: 'ARD-3',
        text: 'เขียนโปรแกรมควบคุมเอาต์พุตดิจิทัลและอ่านค่าอินพุตดิจิทัล/แอนาลอกเบื้องต้นได้',
        lessons: [2],
        activities: ['ควบคุม LED ปุ่มกด และอ่านค่าตัวต้านทานปรับค่า'],
      },
      {
        code: 'ARD-4',
        text: 'ใช้ Serial Monitor, PWM และไลบรารีพื้นฐานเพื่อสื่อสารและควบคุมอุปกรณ์ภายนอกได้',
        lessons: [3],
        activities: ['ส่งค่าผ่าน Serial ปรับความสว่าง LED และควบคุมเซอร์โว'],
      },
      {
        code: 'ARD-5',
        text: 'ออกแบบใบงานทดลอง Arduino ที่ใช้เซนเซอร์ มอเตอร์ หรือจอแสดงผล และทดสอบแก้ไขปัญหาอย่างเป็นขั้นตอนได้',
        lessons: [4],
        activities: ['ทำมินิโครงงานวัดระยะ/วัดอุณหภูมิ/แสดงผลบนจอ'],
      },
      {
        code: 'ARD-6',
        text: 'เข้าใจแนวคิดการจำลองวงจร บูตโหลดเดอร์ และการดูแลแก้ปัญหาบอร์ด Arduino ในระดับพื้นฐาน',
        lessons: [5],
        activities: ['วิเคราะห์สถานการณ์บอร์ดอัปโหลดไม่ได้และเลือกแนวทางตรวจสอบ'],
      },
    ],
    lessons: [
      { name: 'รู้จัก Arduino และไมโครคอนโทรลเลอร์', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/86-arduino-1' },
      { name: 'Arduino IDE และการเริ่มต้นใช้งาน', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/87-arduino-2-sketch' },
      { name: 'Arduino UNO R3 และตัวอย่าง Blink', url: 'https://praphas.com/index.php/2008-11-03-14-25-25/51-arduino/90-arduino-5-1-uno-r3.PROTEUS' },
      { name: 'สัญญาณดิจิทัล แอนาลอก Serial และ PWM', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/96-2-arduino' },
      { name: 'ใบงานเซนเซอร์ มอเตอร์ และจอแสดงผล', url: 'https://praphas.com/index.php/51-knowhow/arduino' },
      { name: 'Proteus บูตโหลดเดอร์ และซ่อมบอร์ด', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/91-arduino-6-2' },
    ],
    units: [
      {
        no: 1,
        title: 'รู้จัก Arduino และไมโครคอนโทรลเลอร์',
        indicators: [0],
        topics: [
          'Arduino เป็นแพลตฟอร์มอิเล็กทรอนิกส์ต้นแบบแบบโอเพนซอร์ส ใช้งานได้ทั้งฮาร์ดแวร์และซอฟต์แวร์',
          'ไมโครคอนโทรลเลอร์คือสมองขนาดเล็กที่รับข้อมูล ประมวลผล และสั่งงานอุปกรณ์ภายนอก',
          'ตัวอย่างงานจริง: ไฟอัตโนมัติ เครื่องวัดอุณหภูมิ เครื่องให้อาหาร ระบบเตือนภัย และหุ่นยนต์',
          'องค์ประกอบหลัก: บอร์ด Arduino, สาย USB, คอมพิวเตอร์, เซนเซอร์, อุปกรณ์แสดงผล และวงจรทดลอง',
        ],
      },
      {
        no: 2,
        title: 'ติดตั้ง Arduino IDE และเริ่มโปรแกรมแรก',
        indicators: [1],
        topics: [
          'Arduino IDE คือเครื่องมือเขียนโปรแกรมและอัปโหลดคำสั่งลงบอร์ด',
          'การตั้งค่าที่ต้องตรวจทุกครั้ง: Board, Port และ Programmer',
          'ตัวอย่างแรกคือ Blink เพื่อทดสอบว่าบอร์ด สาย USB ไดรเวอร์ และการอัปโหลดทำงานถูกต้อง',
          'รู้จักส่วนประกอบของโปรแกรม: setup() ทำครั้งแรก และ loop() ทำซ้ำตลอดเวลา',
        ],
      },
      {
        no: 3,
        title: 'Arduino UNO R3 และวงจรพื้นฐาน',
        indicators: [2],
        topics: [
          'Arduino UNO R3 ใช้ไมโครคอนโทรลเลอร์ ATmega328 มีขาดิจิทัล 14 ขา และขาแอนาลอก 6 ขา',
          'ขา digital ใช้ควบคุมสถานะเปิด/ปิด เช่น LED หรืออ่านสถานะปุ่มกด',
          'ขา analog input ใช้อ่านค่าที่เปลี่ยนต่อเนื่อง เช่น แสง เสียง อุณหภูมิ หรือแรงดันไฟฟ้า',
          'การต่อวงจรต้องคำนึงถึงไฟเลี้ยง GND ตัวต้านทาน และทิศทางการต่อ LED เพื่อความปลอดภัย',
        ],
      },
      {
        no: 4,
        title: 'เขียนโปรแกรมควบคุมสัญญาณ',
        indicators: [3],
        topics: [
          'digitalWrite() ใช้สั่งขา output ให้เป็น HIGH หรือ LOW',
          'digitalRead() ใช้อ่านค่าปุ่มกดหรือสวิตช์ที่ให้ผลเป็น 0/1',
          'analogRead() ใช้อ่านค่าจากเซนเซอร์เป็นช่วง 0-1023',
          'analogWrite() ใช้ PWM ปรับความสว่าง LED หรือความเร็วอุปกรณ์บางชนิด',
          'Serial Monitor ใช้ดูค่าที่บอร์ดส่งกลับมา ช่วยตรวจสอบและแก้ปัญหาโปรแกรม',
        ],
      },
      {
        no: 5,
        title: 'ใบงานเซนเซอร์ มอเตอร์ และจอแสดงผล',
        indicators: [4],
        topics: [
          'ใบงาน Arduino ช่วยให้เรียนจากการลงมือทดลองจริงและบันทึกผลอย่างเป็นขั้นตอน',
          'ตัวอย่างเซนเซอร์: เทอร์มิสเตอร์, DHT22, DS18B20, ultrasonic และปุ่มกด',
          'ตัวอย่างอุปกรณ์สั่งงาน: LED, buzzer, DC motor, stepper motor และ servo motor',
          'ตัวอย่างจอแสดงผล: LCD, LCD I2C, OLED และโมดูลตัวเลข MAX7219',
          'มินิโครงงานควรมีปัญหา วงจร โค้ด ผลการทดลอง ปัญหาที่พบ และแนวทางปรับปรุง',
        ],
      },
      {
        no: 6,
        title: 'จำลองวงจร บูตโหลดเดอร์ และแก้ปัญหาบอร์ด',
        indicators: [5],
        topics: [
          'Proteus ใช้จำลองวงจรบางส่วนก่อนต่อจริง ช่วยลดความเสี่ยงและช่วยวิเคราะห์การทำงาน',
          'บูตโหลดเดอร์คือโปรแกรมเล็ก ๆ ที่ช่วยให้บอร์ดรับโปรแกรมผ่าน USB ได้สะดวก',
          'Arduino UNO ที่ใช้งานได้สามารถใช้เป็น Arduino as ISP เพื่อช่วยเบิร์นบูตโหลดเดอร์ให้ชิปหรือบอร์ดอื่น',
          'แนวทางตรวจบอร์ดอัปโหลดไม่ได้: ตรวจสาย USB, Port, Board, Driver, Programmer, ไฟเลี้ยง และวงจรที่ต่ออยู่',
        ],
      },
    ],
  },
];

const arduinoCourse = grades.find((g) => g.id === 'arduino-basic');
const arduinoUnits = arduinoCourse ? (arduinoCourse.units ?? (arduinoCourse.units = [])) : [];
if (arduinoCourse && !arduinoUnits.some((u) => u.no === 7)) {
  arduinoCourse.indicators.push(
    {
      code: 'ARD-7',
      text: 'ใช้จอแสดงผล LCD/OLED และการสื่อสาร I2C เพื่อแสดงค่าจากเซนเซอร์หรือสถานะของระบบ Arduino ได้',
      lessons: [6],
      activities: ['ต่อ LCD I2C หรือจอจำลอง แสดงข้อความ ค่าตัวเลข และสถานะการทำงานของวงจร'],
    },
    {
      code: 'ARD-8',
      text: 'ออกแบบ สร้าง ทดสอบ และนำเสนอโครงงาน Arduino ขนาดเล็กโดยมีหลักฐานวงจร โค้ด ผลทดลอง และข้อปรับปรุงได้',
      lessons: [7],
      activities: ['ทำโครงงานปลายคอร์สจากปัญหาจริงในโรงเรียนหรือบ้าน พร้อมนำเสนอและประเมินตนเอง'],
    }
  );
  arduinoCourse.lessons.push(
    { name: 'จอแสดงผล LCD/OLED และการสื่อสาร I2C', url: 'https://docs.wokwi.com/parts/wokwi-lcd1602' },
    { name: 'โครงงาน Arduino ปลายคอร์สและการนำเสนอ', url: 'https://projecthub.arduino.cc/' }
  );
  arduinoUnits.push(
    {
      no: 7,
      title: 'จอแสดงผล LCD/OLED และการสื่อสาร I2C',
      indicators: [6],
      topics: [
        'จอ LCD 16x2 ใช้แสดงข้อความหรือตัวเลข เช่น อุณหภูมิ ระยะทาง คะแนน หรือสถานะเครื่อง',
        'การต่อแบบ I2C ใช้สายสัญญาณหลักเพียง SDA และ SCL จึงประหยัดขา Arduino มากกว่าการต่อ LCD แบบขนาน',
        'การใช้ไลบรารีช่วยให้โค้ดสั้นลง เช่น เริ่มต้นจอ ตั้งตำแหน่ง cursor และพิมพ์ข้อความ',
        'การแสดงผลที่ดีควรอ่านง่าย มีหน่วยกำกับ และอัปเดตเฉพาะเมื่อข้อมูลเปลี่ยนหรือถึงรอบเวลา',
      ],
    },
    {
      no: 8,
      title: 'โครงงาน Arduino ปลายคอร์ส',
      indicators: [7],
      topics: [
        'เริ่มจากปัญหาที่ชัด เช่น เตือนระยะใกล้ วัดอุณหภูมิ แจ้งเตือนแสงน้อย หรือช่วยประหยัดพลังงาน',
        'ออกแบบระบบด้วย input-process-output ก่อนเลือกอุปกรณ์และเขียนโค้ด',
        'สร้างต้นแบบ ทดสอบหลายรอบ บันทึกค่าที่ได้ และปรับ threshold หรือวงจรจากหลักฐาน',
        'นำเสนอด้วยภาพวงจร โค้ด ตารางผลทดลอง วิดีโอสั้น และข้อเสนอเพื่อพัฒนาต่อ',
      ],
    }
  );
}

if (!grades.some((g) => g.id === 'electronics-basic')) {
  grades.push({
    id: 'electronics-basic',
    emoji: '⚡',
    title: 'อิเล็กทรอนิกส์เบื้องต้น (ฉบับครูเจมส์)',
    courseUrl: '/curriculum/electronics-basic/unit/1',
    indicators: [
      {
        code: 'ELEC-1',
        text: 'อธิบายบทบาทของอิเล็กทรอนิกส์ในชีวิตประจำวัน และแยกแนวคิดระบบแอนะล็อก ดิจิทัล input process output ได้',
        lessons: [0],
        activities: ['สำรวจเครื่องใช้ไฟฟ้ารอบตัวและแยกส่วนรับข้อมูล ประมวลผล และแสดงผล'],
      },
      {
        code: 'ELEC-2',
        text: 'เลือกใช้แหล่งจ่ายไฟ ตัวต้านทาน LED และกฎของโอห์มเพื่อออกแบบวงจรพื้นฐานอย่างปลอดภัยได้',
        lessons: [1],
        activities: ['คำนวณค่าตัวต้านทานสำหรับ LED และทดลองเปรียบเทียบความสว่าง'],
      },
      {
        code: 'ELEC-3',
        text: 'ระบุหน้าที่ของอุปกรณ์อิเล็กทรอนิกส์พื้นฐาน เช่น ตัวเก็บประจุ ไดโอด ทรานซิสเตอร์ รีเลย์ เซนเซอร์ และมอเตอร์ได้',
        lessons: [2],
        activities: ['จับคู่อุปกรณ์กับหน้าที่และเลือกอุปกรณ์ให้เหมาะกับสถานการณ์'],
      },
      {
        code: 'ELEC-4',
        text: 'อธิบายวงจรแอนะล็อกพื้นฐาน เช่น RC filter วงจรเรียงกระแส วงจรขยาย และเรกูเลเตอร์ได้ในระดับภาพรวม',
        lessons: [3],
        activities: ['วาดเส้นทางไฟจาก AC เป็น DC และอธิบายหน้าที่ของแต่ละส่วน'],
      },
      {
        code: 'ELEC-5',
        text: 'ใช้เลขฐานสอง ตารางค่าความจริง และลอจิกเกตเพื่อออกแบบเงื่อนไขดิจิทัลอย่างง่ายได้',
        lessons: [4],
        activities: ['สร้าง truth table ของ AND OR NOT NAND และออกแบบเงื่อนไขเปิดประตูจำลอง'],
      },
      {
        code: 'ELEC-6',
        text: 'ใช้มัลติมิเตอร์และหลักการตรวจวงจรอย่างเป็นระบบเพื่อวัดแรงดัน ความต้านทาน ไดโอด และวิเคราะห์ความผิดปกติได้',
        lessons: [5],
        activities: ['ใช้ checklist วัดวงจร LED และอธิบายผลด้วยกฎของโอห์ม/เคอร์ชอฟฟ์'],
      },
    ],
    lessons: [
      { name: 'อิเล็กทรอนิกส์ในชีวิตประจำวัน', url: '/curriculum/electronics-basic/unit/1' },
      { name: 'แหล่งจ่ายไฟ ตัวต้านทาน LED และกฎของโอห์ม', url: '/curriculum/electronics-basic/unit/2' },
      { name: 'อุปกรณ์อิเล็กทรอนิกส์พื้นฐาน', url: '/curriculum/electronics-basic/unit/3' },
      { name: 'วงจรแอนะล็อกพื้นฐาน', url: '/curriculum/electronics-basic/unit/4' },
      { name: 'วงจรดิจิทัลและลอจิกเกต', url: '/curriculum/electronics-basic/unit/5' },
      { name: 'มัลติมิเตอร์และการตรวจวงจร', url: '/curriculum/electronics-basic/unit/6' },
    ],
    units: [
      {
        no: 1,
        title: 'อิเล็กทรอนิกส์ในชีวิตประจำวัน',
        indicators: [0],
        topics: [
          'อิเล็กทรอนิกส์คือความรู้เกี่ยวกับวงจรไฟฟ้าที่ใช้ควบคุม รับ ส่ง แปลง และประมวลผลสัญญาณ',
          'เครื่องใช้รอบตัว เช่น เครื่องคิดเลข โทรศัพท์ ลำโพง และไม้ตียุงไฟฟ้า ล้วนมีวงจรภายใน',
          'ระบบแอนะล็อกใช้สัญญาณต่อเนื่อง ส่วนระบบดิจิทัลใช้สถานะไม่ต่อเนื่อง เช่น 0 และ 1',
          'การมองอุปกรณ์เป็น input process output ช่วยให้เข้าใจการทำงานและต่อยอดเป็น Arduino ได้ง่าย',
        ],
      },
      {
        no: 2,
        title: 'แหล่งจ่ายไฟ ตัวต้านทาน LED และกฎของโอห์ม',
        indicators: [1],
        topics: [
          'วงจรอิเล็กทรอนิกส์ต้องมีแหล่งจ่ายไฟที่เหมาะสม ทั้งแรงดัน กระแส และขั้วไฟ',
          'ตัวต้านทานใช้จำกัดกระแส แบ่งแรงดัน และป้องกันอุปกรณ์ เช่น LED',
          'กฎของโอห์ม V = IR ใช้หาความสัมพันธ์ระหว่างแรงดัน กระแส และความต้านทาน',
          'การคำนวณกำลัง P = VI ช่วยเลือกพิกัดตัวต้านทานให้ไม่ร้อนหรือเสียหาย',
        ],
      },
      {
        no: 3,
        title: 'อุปกรณ์อิเล็กทรอนิกส์พื้นฐาน',
        indicators: [2],
        topics: [
          'ตัวเก็บประจุช่วยเก็บและจ่ายประจุในช่วงเวลาสั้น ๆ และใช้กรองสัญญาณได้',
          'ไดโอดยอมให้กระแสไหลทางเดียว ส่วน LED เปลี่ยนพลังงานไฟฟ้าเป็นแสง',
          'ทรานซิสเตอร์ใช้ขยายสัญญาณหรือทำหน้าที่เป็นสวิตช์อิเล็กทรอนิกส์',
          'รีเลย์ มอเตอร์ หม้อแปลง และเซนเซอร์เป็นสะพานเชื่อมวงจรกับโลกจริง',
        ],
      },
      {
        no: 4,
        title: 'วงจรแอนะล็อกและแหล่งจ่ายไฟ',
        indicators: [3],
        topics: [
          'วงจร RC filter ใช้ตัวต้านทานและตัวเก็บประจุเลือกให้สัญญาณบางย่านความถี่ผ่าน',
          'วงจรเรียงกระแสใช้ไดโอดแปลงไฟ AC เป็น DC สำหรับอุปกรณ์อิเล็กทรอนิกส์',
          'ตัวเก็บประจุกรองไฟช่วยลดความกระเพื่อมของแรงดันหลังวงจรเรียงกระแส',
          'เรกูเลเตอร์ เช่น 78xx ช่วยทำให้แรงดันเอาต์พุตคงที่ก่อนจ่ายให้วงจร',
        ],
      },
      {
        no: 5,
        title: 'วงจรดิจิทัล เลขฐานสอง และลอจิกเกต',
        indicators: [4],
        topics: [
          'ระบบดิจิทัลแทนข้อมูลด้วยสถานะ 0 และ 1 ทำให้วงจรตัดสินใจได้ชัดเจน',
          'เลขฐานสองและฐานสิบหกช่วยแทนข้อมูลภายในคอมพิวเตอร์และไมโครคอนโทรลเลอร์',
          'ลอจิกเกต AND OR NOT NAND เป็นพื้นฐานของเงื่อนไขและวงจรดิจิทัล',
          'วงจรคอมบิเนชันให้ output ตาม input ณ ขณะนั้น ส่วนวงจรซีเควนเชียลจำสถานะเดิมได้',
        ],
      },
      {
        no: 6,
        title: 'มัลติมิเตอร์ กฎของเคอร์ชอฟฟ์ และการตรวจวงจร',
        indicators: [5],
        topics: [
          'มัลติมิเตอร์ใช้วัดแรงดัน กระแส ความต้านทาน และตรวจไดโอด แต่ต้องเลือกโหมดให้ถูก',
          'การวัดไฟแรงสูงต้องมีครูควบคุมและหลีกเลี่ยงการสัมผัสส่วนที่มีไฟ',
          'กฎของเคอร์ชอฟฟ์ช่วยอธิบายแรงดันและกระแสในวงจรอย่างมีเหตุผล',
          'การตรวจวงจรควรทำเป็นขั้นตอน: แหล่งจ่ายไฟ สายไฟ ขั้วอุปกรณ์ ค่าอุปกรณ์ และผลวัด',
        ],
      },
    ],
  });
}

export const findGrade = (gradeId: string) => grades.find((g) => g.id === gradeId);
export const findIndicator = (gradeId: string, idx: number) => {
  const g = findGrade(gradeId);
  return g ? g.indicators[idx] : undefined;
};
