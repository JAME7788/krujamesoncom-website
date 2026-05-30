// เนื้อหาเสริม: คลิปวิดีโอ, ภาพประกอบ, แบบทดสอบ ต่อหน่วยการเรียน

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
};

export type Article = { title: string; url: string; source: string; desc?: string };
export type LearningFile = {
  title: string;
  url: string;
  source: string;
  desc?: string;
  kind?: 'pdf' | 'worksheet' | 'lesson-plan' | 'slides' | 'video' | 'web';
};

export type LessonNotes = {
  objectives?: string[];
  summary?: string[];
  activities?: string[];
  checkQuestions?: string[];
  vocabulary?: string[];
};

export type UnitExtras = {
  intro?: string;
  videos?: { title: string; query?: string; url?: string }[];
  fun?: { title: string; desc: string; url?: string; emoji: string; noLogin?: boolean }[];
  files?: LearningFile[];
  quiz?: QuizQuestion[];
  articles?: Article[];
  lessonNotes?: LessonNotes;
};

// บทความจาก สสวท. (scimath.org) — แหล่งอ้างอิงเนื้อหาเทคโนโลยี
const sm = (title: string, path: string, desc?: string): Article => ({
  title, url: `https://www.scimath.org${path}`, source: 'สสวท. (scimath.org)', desc,
});

export const scimathArticles = {
  dataScience: sm('หน่วยวิทยาการข้อมูล', '/lesson-technology/item/11677-2020-06-30-07-39-50', 'ยุคข้อมูลดิจิทัลและพื้นฐานวิทยาการข้อมูล'),
  technologyDesign: sm('การออกแบบเทคโนโลยี', '/lesson-technology/item/11313-2020-02-18-04-06-04', 'เทคโนโลยีรอบตัวในชีวิตประจำวัน'),
  computerProject: sm('โครงงานคอมพิวเตอร์', '/lesson-technology/item/11247-2019-12-19-07-37-36', 'การเรียนรู้ด้วยโครงงานคอมพิวเตอร์'),
  dataCommunication: sm('การสื่อสารข้อมูล', '/lesson-technology/item/10561-2019-08-28-02-44-55', 'ความสำคัญของการสื่อสารในชีวิต'),
  computerBasics: sm('ความรู้เบื้องต้นเกี่ยวกับคอมพิวเตอร์', '/lesson-technology/item/10519-2019-07-18-01-43-40', 'พื้นฐานความรู้เกี่ยวกับคอมพิวเตอร์'),
  network: sm('ระบบเครือข่ายคอมพิวเตอร์', '/lesson-technology/item/10324-2019-05-13-06-03-18', 'ประวัติและความสำคัญของระบบเครือข่าย'),
  dataProcessing: sm('การประมวลผลข้อมูล', '/lesson-technology/item/9797-1-9797', 'ความหมายและการประมวลผลข้อมูล'),
  mis: sm('ระบบสารสนเทศเพื่อการจัดการ', '/lesson-technology/item/9643-1_9643', 'ข้อมูล สารสนเทศ และความรู้ในการจัดการ'),
  os: sm('ความรู้เบื้องต้นเกี่ยวกับระบบปฏิบัติการ', '/lesson-technology/item/9437-2018-11-14-08-55-59-9437-9437', 'ระบบปฏิบัติการคอมพิวเตอร์'),
  software: sm('ความรู้เบื้องต้นเกี่ยวกับซอฟต์แวร์', '/lesson-technology/item/9435-2018-11-14-08-54-36', 'ความหมายและประเภทของซอฟต์แวร์'),
  algorithm: sm('อัลกอริทึมและผังงานเบื้องต้น', '/lesson-technology/item/8809-2018-09-21-02-51-34', 'พื้นฐานอัลกอริทึมและผังงาน'),
  virus: sm('ไวรัสคอมพิวเตอร์', '/lesson-technology/item/8806-1', 'ความหมายและภัยคุกคามจากไวรัส'),
};

const yt = (q: string) => ({ title: q, query: q });

export const unitExtras: Record<string, Record<number, UnitExtras>> = {
  p1: {
    1: {
      intro: 'มาทำความรู้จักกับคอมพิวเตอร์เพื่อนใหม่ของเรา! เรียนรู้การใช้งานคีย์บอร์ด เมาส์ และโปรแกรมพื้นฐาน เพื่อเริ่มต้นสร้างชิ้นงานสนุกๆ ด้วยตัวเอง 🎉',
      videos: [
        yt('การใช้งานคอมพิวเตอร์เบื้องต้นสำหรับเด็ก ป.1'),
        yt('สอนใช้เมาส์และคีย์บอร์ดเด็กประถม'),
        yt('สอน Microsoft Word เด็ก ป.1'),
      ],
      fun: [
        { title: 'เกมภารกิจเมาส์แม่นยำ', desc: 'ฝึกคลิก ดับเบิลคลิก และลากวางในเว็บนี้', url: '/games/mouse-practice', emoji: '🖱️', noLogin: true },
        { title: 'เกมนักสำรวจคีย์บอร์ด', desc: 'ฝึก Spacebar Enter Backspace และคำสั่ง Save', url: '/games/keyboard-practice', emoji: '⌨️', noLogin: true },
        { title: 'Code.org Learn to Drag and Drop', desc: 'ฝึกลากและวางก่อนเริ่มเขียนโปรแกรม', url: 'https://studio.code.org/s/pre-express-2023/lessons/1', emoji: '🧩', noLogin: true },
        { title: 'Dragon Drop', desc: 'เกมฝึกเมาส์ คลิก ดับเบิลคลิก ลากวาง', url: 'https://www.roomrecess.com/games/DragonDrop/play.html', emoji: '🎯', noLogin: true },
        { title: 'Poki Kids: Creative Puzzle', desc: 'ระบายสีและต่อภาพ ฝึกคลิก/ลากวาง', url: 'https://kids.poki.com/game/creative-puzzle', emoji: '🧩', noLogin: true },
        { title: 'Poki Kids: Happy Crayons', desc: 'ระบายสีออนไลน์ ฝึกใช้เมาส์และเลือกสี', url: 'https://kids.poki.com/game/happy-crayons', emoji: '🖍️', noLogin: true },
        { title: 'TypingClub', desc: 'ฝึกพิมพ์ดีด เล่นได้เลย', url: 'https://www.typingclub.com/', emoji: '⌨️', noLogin: true },
        { title: 'TypingStudy ภาษาไทย', desc: 'ฝึกพิมพ์ไทย ไม่ต้องสมัคร', url: 'https://www.typingstudy.com/th/', emoji: '🇹🇭', noLogin: true },
        { title: 'JS Paint', desc: 'โปรแกรม Paint ในเบราว์เซอร์', url: 'https://jspaint.app/', emoji: '🎨', noLogin: true },
        { title: 'Mouse-Run', desc: 'เกมขยับเมาส์ตามเส้น', url: 'https://www.helpkidzlearn.com/games/early-years', emoji: '🐭', noLogin: true },
      ],
      articles: [scimathArticles.computerBasics],
      quiz: [
        { q: 'แป้น Enter บนคีย์บอร์ดมีหน้าที่อะไร?', options: ['ลบตัวอักษร', 'รับคำสั่ง / ขึ้นบรรทัดใหม่', 'เว้นวรรค', 'สลับภาษา'], answer: 1 },
        { q: 'แป้น Backspace ใช้สำหรับ?', options: ['พิมพ์ตัวพิมพ์ใหญ่', 'ลบตัวอักษรที่พิมพ์ไว้', 'เปิดโปรแกรม', 'บันทึกไฟล์'], answer: 1 },
        { q: 'ก่อนเปิดคอมพิวเตอร์ตั้งโต๊ะ ต้องกดปุ่มเปิดที่ไหนก่อน?', options: ['จอภาพ', 'ซีพียู', 'เครื่องพิมพ์', 'ลำโพง'], answer: 1 },
        { q: 'โปรแกรมใดใช้สำหรับวาดภาพระบายสี?', options: ['Word', 'PowerPoint', 'Paint', 'Excel'], answer: 2 },
        { q: 'คำสั่ง Save ใช้ทำอะไร?', options: ['สร้างเอกสารใหม่', 'บันทึกเอกสาร', 'พิมพ์เอกสาร', 'คัดลอก'], answer: 1 },
        { q: 'อุปกรณ์ใดใช้สำหรับชี้ตำแหน่งบนหน้าจอ?', options: ['เมาส์', 'คีย์บอร์ด', 'ลำโพง', 'เคส'], answer: 0 },
        { q: 'ปุ่มที่มีตัวอักษร ก-ฮ เรียกว่าอะไร?', options: ['เมาส์', 'แป้นพิมพ์', 'หน้าจอ', 'ปลั๊กไฟ'], answer: 1 },
        { q: 'ถ้าต้องการพิมพ์เว้นวรรค ต้องกดปุ่มใด?', options: ['Enter', 'Shift', 'Spacebar', 'Ctrl'], answer: 2 },
        { q: 'เครื่องคอมพิวเตอร์ส่วนที่เหมือน "สมอง" คืออะไร?', options: ['จอภาพ', 'เมาส์', 'ซีพียู (CPU)', 'คีย์บอร์ด'], answer: 2 },
        { q: 'ข้อใดคือการดูแลคอมพิวเตอร์ที่ถูกต้อง?', options: ['กินน้ำหน้าคอม', 'เคาะคีย์บอร์ดแรงๆ', 'เช็ดฝุ่นด้วยผ้าแห้ง', 'ปิดเครื่องทันทีโดยไม่ Shutdown'], answer: 2 },
      ],
    },
    2: {
      intro: 'การแก้ปัญหาเป็นทักษะสำคัญที่ใช้ได้ทุกวัน! เรามาเรียนรู้วิธีคิดอย่างเป็นระบบ ผ่านเกมและกิจกรรมสนุกๆ กันเถอะ 🧩',
      videos: [
        yt('การแก้ปัญหาอย่างเป็นขั้นตอน วิทยาการคำนวณ ป.1'),
        yt('Unplugged coding สำหรับเด็ก'),
      ],
      fun: [
        { title: 'Blockly Maze', desc: 'เกมแก้ปัญหาด้วยบล็อก เล่นเลย', url: 'https://blockly.games/maze', emoji: '🧩', noLogin: true },
        { title: 'Blockly Puzzle', desc: 'จับคู่บล็อก ไม่ต้องสมัคร', url: 'https://blockly.games/puzzle', emoji: '🧠', noLogin: true },
        { title: 'Happy Maps (Code.org)', desc: 'วาดเส้นทาง — เล่นได้ ไม่ต้อง login', url: 'https://studio.code.org/s/coursea-2022/lessons/3', emoji: '🗺️', noLogin: true },
        { title: 'Poki Kids: Happy Kittens Puzzle', desc: 'เกมปริศนาฝึกสังเกตและแก้ปัญหา', url: 'https://kids.poki.com/game/happy-kittens-puzzle', emoji: '🐱', noLogin: true },
        { title: 'Poki Kids: BeeLine', desc: 'วางแผนเส้นทางให้ถึงเป้าหมาย', url: 'https://kids.poki.com/game/beeline', emoji: '🐝', noLogin: true },
        { title: 'Poki Kids: Draw Parking', desc: 'ลากเส้นทางให้รถไปจอด ฝึกวางแผน', url: 'https://kids.poki.com/game/draw-parking', emoji: '🚗', noLogin: true },
        { title: 'Spot the Difference', desc: 'เกมเปรียบเทียบจุดต่าง', url: 'https://www.spotthedifference.com/', emoji: '🔍', noLogin: true },
      ],
      quiz: [
        { q: 'การลองผิดลองถูก เหมาะกับการแก้ปัญหาแบบใด?', options: ['ปัญหาที่ทราบวิธีแก้แน่ชัด', 'ปัญหาที่ยังไม่ทราบวิธีแก้', 'ปัญหาคณิตศาสตร์', 'ไม่มีข้อใดถูก'], answer: 1 },
        { q: 'เกมหาจุดต่างของภาพ ใช้วิธีแก้ปัญหาแบบใด?', options: ['การลองผิดลองถูก', 'การเปรียบเทียบ', 'การคำนวณ', 'การจำ'], answer: 1 },
        { q: 'การแสดงลำดับขั้นตอน ทำได้กี่วิธี?', options: ['1 วิธี', '2 วิธี', '3 วิธี (ภาพ/สัญลักษณ์/ข้อความ)', 'ไม่มีวิธี'], answer: 2 },
      ],
    },
    3: {
      intro: 'มาเป็นโปรแกรมเมอร์ตัวน้อย! เริ่มเขียนโปรแกรมง่ายๆ ด้วยบล็อกคำสั่งและบัตรคำสั่ง ฝึกคิดเป็นระบบเหมือนหุ่นยนต์ 🤖',
      videos: [
        yt('สอนเขียนโปรแกรม Code.org ป.1'),
        yt('ScratchJr tutorial Thai'),
      ],
      fun: [
        { title: '🅱️ Code.org Course B (ป.1)', desc: 'หลักสูตรเขียนโค้ด ป.1 — events, sequence', url: 'https://studio.code.org/s/courseb-2023', emoji: '🅱️', noLogin: true },
        { title: '❄️ Frozen (Hour of Code)', desc: 'Anna+Elsa เล่นสเก็ต — เรียน loop วาดหิมะ', url: 'https://studio.code.org/s/frozen', emoji: '❄️', noLogin: true },
        { title: 'Scratch (Try It)', desc: 'เขียนโปรแกรมเลย ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Lightbot Hour', desc: 'เกมสั่งหุ่นยนต์ — เล่นได้เลย', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
        { title: 'Blockly Games', desc: '7 เกมเขียนโค้ด ไม่ต้อง login', url: 'https://blockly.games/', emoji: '🎮', noLogin: true },
        { title: 'Hour of Code', desc: 'เลือกบทเรียนเล่น 1 ชั่วโมง', url: 'https://hourofcode.com/th/learn', emoji: '⏰', noLogin: true },
      ],
      quiz: [
        { q: 'ขั้นตอนแรกของการเขียนโปรแกรมคืออะไร?', options: ['เขียนโค้ดเลย', 'วิเคราะห์งานหรือปัญหา', 'ทดสอบโปรแกรม', 'พิมพ์ผลลัพธ์'], answer: 1 },
        { q: 'บัตรคำสั่ง (Program Card) คืออะไร?', options: ['บัตรประชาชน', 'บัตรที่มีรหัสคำสั่ง', 'บัตรเครดิต', 'การ์ดเกม'], answer: 1 },
        { q: 'หลังเขียนโปรแกรมเสร็จ ต้องทำอะไร?', options: ['ปิดเครื่อง', 'ทดสอบและแก้ไข', 'นอน', 'ลบทิ้ง'], answer: 1 },
      ],
    },
    4: {
      intro: 'ใช้เทคโนโลยีอย่างปลอดภัย! เรียนรู้การปกป้องตัวเองและข้อมูลส่วนตัวจากภัยออนไลน์ 🛡️',
      videos: [
        yt('ความปลอดภัยในโลกออนไลน์ เด็กประถม'),
        yt('Be Internet Awesome Thai'),
      ],
      fun: [
        { title: 'Interland (Google)', desc: 'เกมความปลอดภัยภาษาไทย — เล่นเลย', url: 'https://beinternetawesome.withgoogle.com/th_th/interland', emoji: '🌐', noLogin: true },
        { title: 'Password Game', desc: 'ฝึกตั้งรหัสผ่าน', url: 'https://think-digital.app/minigame/password', emoji: '🔐', noLogin: true },
        { title: 'Think Digital', desc: 'พลเมืองดิจิทัล (เว็บไทย)', url: 'https://think-digital.app/', emoji: '💭', noLogin: true },
        { title: 'NetSmartz Kids', desc: 'การ์ตูนสอนความปลอดภัย', url: 'https://www.missingkids.org/netsmartz/home', emoji: '🛡️', noLogin: true },
      ],
      quiz: [
        { q: 'ข้อใดเป็นข้อมูลส่วนตัวที่ไม่ควรเปิดเผย?', options: ['สีที่ชอบ', 'เลขประจำตัวประชาชน', 'อาหารที่ชอบ', 'วิชาที่ชอบ'], answer: 1 },
        { q: 'เมื่อพบปัญหาออนไลน์ ควรทำอะไรเป็นอันดับแรก?', options: ['ลบบัญชี', 'แจ้งพ่อแม่หรือครู', 'เก็บไว้คนเดียว', 'ตอบโต้กลับ'], answer: 1 },
        { q: 'อันตรายจากการเผยแพร่ข้อมูลส่วนตัวคืออะไร?', options: ['ไม่มีอันตราย', 'ถูกลักพาตัว/สวมรอย', 'ได้รางวัล', 'มีเพื่อนเพิ่ม'], answer: 1 },
      ],
    },
  },

  p2: {
    1: {
      intro: 'การแก้ปัญหาแบบมีขั้นตอน 4 ข้อ! ใช้กับชีวิตจริงได้ทุกอย่าง ตั้งแต่เลือกอุปกรณ์กันฝน ไปจนถึงการแก้โจทย์ยากๆ 🎯',
      videos: [yt('การแก้ปัญหา 4 ขั้นตอน วิทยาการคำนวณ ป.2'), yt('Problem solving for kids')],
      fun: [
        { title: 'Blockly Maze', desc: 'เกมเขาวงกต ไม่ต้องสมัคร', url: 'https://blockly.games/maze', emoji: '🧩', noLogin: true },
        { title: 'Lightbot Hour', desc: 'แก้ปัญหาด้วยลำดับคำสั่ง', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
        { title: 'Hour of Code', desc: 'บทเรียนสั้น 1 ชั่วโมง', url: 'https://hourofcode.com/th/learn', emoji: '⏰', noLogin: true },
      ],
      quiz: [
        { q: 'ขั้นตอนการแก้ปัญหาขั้นแรกคืออะไร?', options: ['ตรวจสอบ', 'พิจารณาและทำความเข้าใจปัญหา', 'ลงมือ', 'วางแผน'], answer: 1 },
        { q: 'ขั้นตอนสุดท้ายของการแก้ปัญหาคือ?', options: ['วางแผน', 'ลงมือ', 'ตรวจสอบผลลัพธ์', 'พิจารณา'], answer: 2 },
        { q: 'ถ้าฝนตกหนักและลมแรง ควรเลือกอุปกรณ์ใด?', options: ['ร่ม', 'เสื้อกันฝน', 'หมวก', 'แว่นตา'], answer: 1 },
      ],
    },
    2: {
      intro: 'นักเขียนโปรแกรมที่ดีต้องตรวจหาข้อผิดพลาดเป็น (Debugging)! มาฝึกหา Bug กันสนุกๆ 🐛',
      videos: [yt('Debugging programming for kids'), yt('Code.org loops Thai')],
      fun: [
        { title: '🔠 Code.org Course C (ป.2)', desc: 'เน้น Debug + Loop พื้นฐาน — เหมาะกับ ป.2', url: 'https://studio.code.org/s/coursec-2023', emoji: '🔠', noLogin: true },
        { title: '⭐ Star Wars Blockly', desc: 'BB-8 ผจญภัย ฝึก loop รวบรวมเศษโลหะ', url: 'https://studio.code.org/s/starwarsblocks-2018', emoji: '⭐', noLogin: true },
        { title: '🐞 Bug Catcher (ในเว็บนี้)', desc: 'จับบั๊กให้ทัน — ฝึกความเร็วและสมาธิ', url: '/games/bug-catcher', emoji: '🐞', noLogin: true },
        { title: 'Scratch Try It', desc: 'เขียนโค้ดเลย ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Blockly Bird', desc: 'ฝึก if/else กับนก', url: 'https://blockly.games/bird', emoji: '🐦', noLogin: true },
        { title: 'Blockly Maze', desc: 'หา bug ในเขาวงกต', url: 'https://blockly.games/maze', emoji: '🐛', noLogin: true },
      ],
      quiz: [
        { q: 'การ Debug คืออะไร?', options: ['เขียนโค้ดใหม่', 'ตรวจหาข้อผิดพลาดและแก้ไข', 'ลบโปรแกรม', 'ปิดคอมพิวเตอร์'], answer: 1 },
        { q: 'การวนซ้ำคำสั่ง (Loop) มีประโยชน์อย่างไร?', options: ['เขียนสั้นลง', 'ทำงานซ้ำๆ ได้โดยไม่ต้องเขียนซ้ำ', 'ทั้ง 2 ข้อ', 'ไม่มีประโยชน์'], answer: 2 },
      ],
    },
    3: {
      intro: 'จัดเก็บไฟล์ให้เป็นระเบียบเหมือนตู้หนังสือสะอาดๆ! 📁',
      videos: [yt('การจัดการไฟล์และโฟลเดอร์ Windows')],
      fun: [
        { title: 'JS Paint', desc: 'Paint บนเว็บ ไม่ต้องสมัคร', url: 'https://jspaint.app/', emoji: '🎨', noLogin: true },
        { title: 'Photopea', desc: 'แต่งรูปคล้าย Photoshop', url: 'https://www.photopea.com/', emoji: '🖼️', noLogin: true },
        { title: 'Etherpad', desc: 'พิมพ์เอกสารร่วมกัน ไม่ต้องสมัคร', url: 'https://etherpad.wikimedia.org/', emoji: '📝', noLogin: true },
      ],
      quiz: [
        { q: 'คำสั่ง Ctrl+N ใช้ทำอะไร?', options: ['บันทึก', 'สร้างไฟล์ใหม่', 'เปิดไฟล์', 'ปิดโปรแกรม'], answer: 1 },
        { q: 'ส่วนใดของหน้าต่างโปรแกรมที่แสดงชื่อไฟล์?', options: ['แถบเครื่องมือ', 'แถบแสดงชื่อเรื่อง', 'พื้นที่ทำงาน', 'แถบสถานะ'], answer: 1 },
      ],
    },
    4: {
      intro: 'ระวัง! โลกออนไลน์มีคนไม่ดีหลอกล่อเรา มาเรียนรู้วิธีป้องกันตัวกันเถอะ 🛡️',
      videos: [yt('Cyber Safety for Kids Thai')],
      fun: [
        { title: 'Interland (ไทย)', desc: 'เกมพลเมืองดิจิทัล', url: 'https://beinternetawesome.withgoogle.com/th_th/interland', emoji: '🌐', noLogin: true },
        { title: 'Password Game', desc: 'ตั้งรหัสผ่านปลอดภัย', url: 'https://think-digital.app/minigame/password', emoji: '🔐', noLogin: true },
        { title: 'Think Digital', desc: 'พลเมืองดิจิทัล (ไทย)', url: 'https://think-digital.app/', emoji: '💭', noLogin: true },
      ],
      quiz: [
        { q: 'ข้อใดเป็นข้อมูลส่วนตัว?', options: ['ชื่อสุนัข', 'เลขบัญชีธนาคาร', 'อาหารที่ชอบ', 'ทีมที่เชียร์'], answer: 1 },
        { q: '"คุณคือผู้โชคดี! ส่งเลขบัญชีมา" — เป็นการหลอกแบบใด?', options: ['ปกติ', 'ใช้ผลประโยชน์ล่อลวง', 'ความจริง', 'การโฆษณา'], answer: 1 },
      ],
    },
  },

  p3: {
    1: {
      intro: 'อัลกอริทึมคือสูตรลับการแก้ปัญหา! 4 ขั้นตอนช่วยให้แก้ทุกปัญหาในชีวิตได้ 🎓',
      videos: [yt('อัลกอริทึม วิทยาการคำนวณ ป.3'), yt('Algorithm for kids')],
      fun: [
        { title: 'Blockly Maze', desc: 'อัลกอริทึมเขาวงกต ไม่ต้องสมัคร', url: 'https://blockly.games/maze', emoji: '🧩', noLogin: true },
        { title: 'Diagrams.net', desc: 'วาด Flowchart ไม่ต้อง login', url: 'https://app.diagrams.net/', emoji: '📐', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดแผนภาพง่ายๆ', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
      ],
      articles: [scimathArticles.algorithm],
      quiz: [
        { q: 'อัลกอริทึมคืออะไร?', options: ['ภาษาต่างประเทศ', 'ขั้นตอนวิธีการแก้ปัญหา', 'โปรแกรมคอมพิวเตอร์', 'ฮาร์ดแวร์'], answer: 1 },
        { q: 'การแก้ปัญหาในชีวิตประจำวันมีกี่ขั้นตอน?', options: ['2', '3', '4', '5'], answer: 2 },
      ],
    },
    2: {
      intro: 'มาสั่งซอมบี้เก็บดอกทานตะวันด้วยโค้ด! สนุกกับการเขียนโปรแกรมแบบบล็อก 🌻',
      videos: [yt('Scratch programming for kids Thai'), yt('Code.org Plants vs Zombies')],
      fun: [
        { title: '🇩 Code.org Course D (ป.3)', desc: 'Nested loops + Functions — เหมาะกับ ป.3', url: 'https://studio.code.org/s/coursed-2023', emoji: '🇩', noLogin: true },
        { title: '⛏️ Minecraft Hour of Code', desc: 'เขียนโค้ดสำรวจโลก Minecraft', url: 'https://code.org/minecraft', emoji: '⛏️', noLogin: true },
        { title: '🎨 Artist (Code.org)', desc: 'เขียนโค้ดให้ตัวละครวาดรูป', url: 'https://studio.code.org/s/artist-2018', emoji: '🎨', noLogin: true },
        { title: '🎮 Play Lab', desc: 'สร้างเกม + เล่าเรื่องของตัวเอง', url: 'https://studio.code.org/s/playlab-2018', emoji: '🎮', noLogin: true },
        { title: 'Scratch Try It', desc: 'เขียนโปรแกรมเลย ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Blockly Games', desc: '7 เกมเขียนโค้ด', url: 'https://blockly.games/', emoji: '🎮', noLogin: true },
      ],
      quiz: [
        { q: 'การเขียนโปรแกรมเริ่มจาก?', options: ['การออกแบบขั้นตอนวิธี', 'การเขียนโค้ด', 'การพิมพ์', 'การ Print'], answer: 0 },
      ],
    },
    3: {
      intro: 'อินเทอร์เน็ตคือโลกใบใหญ่ที่เชื่อมต่อทุกคนเข้าด้วยกัน! 🌐',
      videos: [yt('อินเทอร์เน็ตคืออะไร เด็กประถม')],
      fun: [
        { title: 'Google Search', desc: 'ค้นหาข้อมูล ไม่ต้องสมัคร', url: 'https://www.google.com', emoji: '🔎', noLogin: true },
        { title: 'Wikipedia ภาษาไทย', desc: 'สารานุกรมออนไลน์', url: 'https://th.wikipedia.org/', emoji: '📖', noLogin: true },
        { title: 'DLTV', desc: 'การเรียนทางไกล (ไทย)', url: 'https://www.dltv.ac.th/', emoji: '📺', noLogin: true },
        { title: 'DuckDuckGo Kids', desc: 'ค้นหาเป็นมิตรกับเด็ก', url: 'https://duckduckgo.com/', emoji: '🦆', noLogin: true },
      ],
      quiz: [
        { q: 'อินเทอร์เน็ตคือ?', options: ['คอมพิวเตอร์เครื่องเดียว', 'เครือข่ายเชื่อมต่อทั่วโลก', 'โปรแกรม', 'เว็บไซต์'], answer: 1 },
      ],
    },
    4: {
      intro: 'รวบรวมข้อมูล นำเสนอด้วยภาพและตารางสวยๆ! 📊',
      videos: [yt('การนำเสนอข้อมูลด้วย Canva')],
      fun: [
        { title: 'Photopea', desc: 'แต่งรูป Photoshop ออนไลน์', url: 'https://www.photopea.com/', emoji: '🖼️', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดภาพ/แผนภูมิ ไม่ต้องสมัคร', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
        { title: 'JS Paint', desc: 'โปรแกรม Paint บนเว็บ', url: 'https://jspaint.app/', emoji: '🎨', noLogin: true },
      ],
      quiz: [
        { q: 'การนำเสนอข้อมูลที่ดี ควรมีอะไรประกอบ?', options: ['ตัวอักษรเล็กๆ เต็มหน้า', 'ภาพและข้อความที่ชัดเจน', 'ไม่ต้องมีรูป', 'มีแต่สี'], answer: 1 },
      ],
    },
    5: {
      intro: 'ใช้ Word สร้างป้ายรณรงค์ลดโลกร้อนกันเถอะ! 🌍',
      videos: [yt('สอน Microsoft Word เด็กประถม')],
      fun: [
        { title: 'Etherpad', desc: 'เอกสารออนไลน์ ไม่ต้องสมัคร', url: 'https://etherpad.wikimedia.org/', emoji: '📝', noLogin: true },
        { title: 'JS Paint', desc: 'วาดและแต่งภาพประกอบ', url: 'https://jspaint.app/', emoji: '🎨', noLogin: true },
        { title: 'Photopea', desc: 'แก้ไขรูปภาพ', url: 'https://www.photopea.com/', emoji: '🖼️', noLogin: true },
      ],
      quiz: [
        { q: 'Page Layout ใช้สำหรับ?', options: ['ตั้งค่าหน้ากระดาษ', 'พิมพ์', 'บันทึก', 'แทรกภาพ'], answer: 0 },
      ],
    },
  },

  p4: {
    1: {
      intro: 'อัลกอริทึมขั้นสูง! เรียนรู้ Pseudocode และ Flowchart เพื่อออกแบบโปรแกรมระดับเทพ 🚀',
      videos: [yt('Flowchart and Pseudocode Thai'), yt('Algorithm ป.4')],
      fun: [
        { title: 'Diagrams.net', desc: 'วาด Flowchart ไม่ต้อง login', url: 'https://app.diagrams.net/', emoji: '📊', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดแผนภาพมือเปล่า', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
        { title: 'Blockly Games', desc: 'ฝึกอัลกอริทึม', url: 'https://blockly.games/', emoji: '🧩', noLogin: true },
      ],
      articles: [scimathArticles.algorithm],
      quiz: [
        { q: 'Pseudocode คืออะไร?', options: ['ภาษาคอมพิวเตอร์', 'รหัสจำลองที่กำหนดเอง', 'โปรแกรม', 'ฮาร์ดแวร์'], answer: 1 },
        { q: 'Flowchart ใช้สัญลักษณ์อะไร?', options: ['ตัวเลข', 'รูปทรงเรขาคณิต', 'ตัวอักษร', 'สี'], answer: 1 },
      ],
    },
    2: {
      intro: 'Scratch — เครื่องมือสร้างเกมและการ์ตูนของเด็กเก่ง! 🎮',
      videos: [yt('Scratch tutorial Thai for kids'), yt('Scratch สร้างเกม')],
      fun: [
        { title: '🎯 Code.org Course E (ป.5)', desc: 'Variables + For loops — เหมาะกับ ป.4-5', url: 'https://studio.code.org/s/coursee-2023', emoji: '🇪', noLogin: true },
        { title: '💃 Dance Party', desc: 'เขียนโค้ดให้ตัวละครเต้น K-Pop', url: 'https://studio.code.org/s/dance-2019', emoji: '💃', noLogin: true },
        { title: '🐤 Flappy Code', desc: 'สร้างเกม Flappy ใน 1 ชั่วโมง', url: 'https://studio.code.org/s/flappy', emoji: '🐤', noLogin: true },
        { title: '🐠 Minecraft AI for Good', desc: 'ใช้ AI ใน Minecraft แก้ปัญหาสิ่งแวดล้อม', url: 'https://studio.code.org/s/aquatic', emoji: '🐠', noLogin: true },
        { title: 'Scratch Try It', desc: 'แพลตฟอร์มหลัก ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Lightbot', desc: 'เกมเขียนโค้ดสั่งหุ่นยนต์', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
      ],
      quiz: [
        { q: 'Scratch พัฒนาขึ้นที่ไหน?', options: ['Google', 'MIT Media Lab', 'Microsoft', 'Apple'], answer: 1 },
        { q: 'รหัสผ่าน Scratch ควรมีกี่ตัว?', options: ['ไม่น้อยกว่า 6', 'แค่ 3', 'แค่ 1', 'ไม่จำเป็น'], answer: 0 },
      ],
    },
    3: {
      intro: 'ค้นหาข้อมูลให้เป็น และประเมินว่าน่าเชื่อถือไหม! 🔍',
      videos: [yt('การประเมินข้อมูลออนไลน์'), yt('Fact checking for kids')],
      fun: [
        { title: 'Google Search', desc: 'ค้นหาข้อมูล', url: 'https://www.google.com', emoji: '🔎', noLogin: true },
        { title: 'Wikipedia ไทย', desc: 'สารานุกรมเสรี', url: 'https://th.wikipedia.org/', emoji: '📖', noLogin: true },
        { title: 'AntiFakeNews TH', desc: 'ตรวจสอบข่าวปลอมไทย', url: 'https://www.antifakenewscenter.com/', emoji: '📰', noLogin: true },
        { title: 'DuckDuckGo', desc: 'ค้นหาที่ไม่เก็บประวัติ', url: 'https://duckduckgo.com/', emoji: '🦆', noLogin: true },
      ],
      quiz: [
        { q: 'แหล่งข้อมูลที่น่าเชื่อถือคือ?', options: ['เว็บไม่มีที่มา', 'เว็บราชการ/สถาบันการศึกษา', 'โซเชียลมีเดียทั่วไป', 'ข่าวลือ'], answer: 1 },
      ],
    },
    4: {
      intro: 'นำเสนอข้อมูลด้วย Word, Excel, PowerPoint! 📊',
      videos: [yt('Microsoft Office Tutorial Thai')],
      fun: [
        { title: 'Etherpad', desc: 'เอกสารออนไลน์ ไม่ต้องสมัคร', url: 'https://etherpad.wikimedia.org/', emoji: '📝', noLogin: true },
        { title: 'JS Paint', desc: 'วาดประกอบเอกสาร', url: 'https://jspaint.app/', emoji: '🎨', noLogin: true },
        { title: 'Photopea', desc: 'แต่งภาพคล้าย Photoshop', url: 'https://www.photopea.com/', emoji: '🖼️', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดแผนภูมิ/Diagram', url: 'https://excalidraw.com/', emoji: '📊', noLogin: true },
      ],
      quiz: [
        { q: 'โปรแกรมใดเหมาะนำเสนอตารางข้อมูล?', options: ['Word', 'Excel', 'Paint', 'Notepad'], answer: 1 },
        { q: 'PowerPoint เหมาะกับ?', options: ['คำนวณ', 'การนำเสนอสไลด์', 'วาดภาพ', 'พิมพ์เอกสารยาว'], answer: 1 },
      ],
    },
    5: {
      intro: 'พลเมืองดิจิทัลที่ดีต้องรับผิดชอบและปลอดภัย! 🛡️',
      videos: [yt('Digital Citizenship for kids Thai')],
      fun: [
        { title: 'Be Internet Awesome', desc: 'พลเมืองดิจิทัล (Google)', url: 'https://beinternetawesome.withgoogle.com/th_th', emoji: '🦸', noLogin: true },
        { title: 'Interland', desc: 'เกม 4 โลก ความปลอดภัย', url: 'https://beinternetawesome.withgoogle.com/th_th/interland', emoji: '🌐', noLogin: true },
        { title: 'Think Digital', desc: 'พลเมืองดิจิทัล (ไทย)', url: 'https://think-digital.app/', emoji: '💭', noLogin: true },
      ],
      quiz: [
        { q: 'พลเมืองดิจิทัลที่ดีรับผิดชอบต่ออะไรบ้าง?', options: ['ตนเอง', 'ครอบครัว/เพื่อน', 'ชุมชน', 'ทุกข้อ'], answer: 3 },
      ],
    },
  },

  p5: {
    1: {
      intro: 'ใช้เหตุผลเชิงตรรกะแก้ปัญหา จัดตารางหนัง คาดการณ์ผลลัพธ์! 🎬',
      videos: [yt('Logical reasoning for kids Thai'), yt('เหตุผลเชิงตรรกะ ป.5')],
      fun: [
        { title: 'Blockly Games', desc: 'ฝึกตรรกะ 7 ระดับ', url: 'https://blockly.games/', emoji: '🧩', noLogin: true },
        { title: 'Caesar & Atbash', desc: 'เกมรหัสลับตรรกะ', url: 'https://codingthailand.app/minigame/atbash-caesar', emoji: '🔐', noLogin: true },
        { title: 'Cipher Game', desc: 'ถอดรหัสด้วยตรรกะ', url: 'https://codingthailand.app/minigame/cipher', emoji: '🗝️', noLogin: true },
        { title: 'Lightbot', desc: 'แก้ปัญหาด้วยลำดับ', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
      ],
      quiz: [
        { q: 'การแก้ปัญหาด้วยเหตุผลเชิงตรรกะเริ่มจาก?', options: ['ลงมือ', 'หารูปแบบของปัญหา', 'คิดสูตร', 'ลองสุ่ม'], answer: 1 },
      ],
    },
    2: {
      intro: 'เขียนโปรแกรมที่มี Logic — if/else, Loop, Conditional! 🧠',
      videos: [yt('Scratch conditionals Thai'), yt('if else programming for kids')],
      fun: [
        { title: '🇫 Code.org Course F (ป.6)', desc: 'Variables ในเกม + Sprite Lab — เหมาะกับ ป.6', url: 'https://studio.code.org/s/coursef-2023', emoji: '🇫', noLogin: true },
        { title: '🚄 Code.org Express', desc: 'หลักสูตรรวม A-F เริ่มได้ทุกระดับ', url: 'https://studio.code.org/s/express-2023', emoji: '🚄', noLogin: true },
        { title: '✨ Sprite Lab', desc: 'สร้างเกม + แอนิเมชัน sprite', url: 'https://studio.code.org/projects/spritelab', emoji: '✨', noLogin: true },
        { title: '🌊 AI for Oceans', desc: 'อัลกอริทึม classification — สอน AI คัดแยกขยะ', url: 'https://code.org/oceans', emoji: '🌊', noLogin: true },
        { title: 'Scratch Try It', desc: 'สร้างเกมตรรกะ ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Blockly Bird', desc: 'ฝึก if/else กับนก', url: 'https://blockly.games/bird', emoji: '🐦', noLogin: true },
      ],
      quiz: [
        { q: 'if/else ใช้สำหรับ?', options: ['การวนซ้ำ', 'การตัดสินใจตามเงื่อนไข', 'การคำนวณ', 'การพิมพ์'], answer: 1 },
      ],
    },
    3: {
      intro: 'ข้อมูลที่ดีต้องถูกต้อง สมบูรณ์ และทันสมัย! 📊',
      videos: [yt('ลักษณะข้อมูลที่ดี วิทยาการคำนวณ')],
      fun: [
        { title: 'Etherpad', desc: 'รวบรวมข้อมูลร่วมกัน ไม่ต้องสมัคร', url: 'https://etherpad.wikimedia.org/', emoji: '📝', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดแผนภูมิข้อมูล', url: 'https://excalidraw.com/', emoji: '📊', noLogin: true },
        { title: 'Diagrams.net', desc: 'แผนผังประมวลผลข้อมูล', url: 'https://app.diagrams.net/', emoji: '📐', noLogin: true },
      ],
      articles: [scimathArticles.dataProcessing, scimathArticles.mis],
      quiz: [
        { q: 'ข้อมูลที่ดีไม่ควรขาดคุณสมบัติใด?', options: ['ความถูกต้อง', 'ความสมบูรณ์', 'ความทันสมัย', 'ทุกข้อสำคัญ'], answer: 3 },
      ],
    },
    4: {
      intro: 'ใช้อินเทอร์เน็ตทำงานร่วมกันอย่างปลอดภัย — Google Workspace! 🌐',
      videos: [yt('Google Drive collaboration Thai')],
      fun: [
        { title: 'Etherpad', desc: 'พิมพ์งานร่วมกัน ไม่ต้องสมัคร', url: 'https://etherpad.wikimedia.org/', emoji: '👥', noLogin: true },
        { title: 'Be Internet Awesome', desc: 'พลเมืองดิจิทัล', url: 'https://beinternetawesome.withgoogle.com/th_th', emoji: '🦸', noLogin: true },
        { title: 'AntiFakeNews TH', desc: 'ตรวจสอบข่าวปลอม', url: 'https://www.antifakenewscenter.com/', emoji: '📰', noLogin: true },
        { title: 'Interland', desc: 'เกมความปลอดภัยออนไลน์', url: 'https://beinternetawesome.withgoogle.com/th_th/interland', emoji: '🌐', noLogin: true },
      ],
      quiz: [
        { q: 'การประเมินข้อมูลก่อนใช้คืออะไร?', options: ['การปฏิเสธ', 'การตรวจสอบความน่าเชื่อถือ', 'การแชร์ทันที', 'ไม่จำเป็น'], answer: 1 },
      ],
    },
  },

  p6: {
    1: {
      intro: 'ตรรกะระดับเทพ! แก้ปัญหาด้วยเงื่อนไขซับซ้อน เรียงลำดับ คาดการณ์ผล 🎯',
      videos: [yt('Logical reasoning ป.6'), yt('การให้เหตุผลเชิงตรรกะ')],
      fun: [
        { title: 'Cipher Mini Game', desc: 'เกมถอดรหัสตรรกะ', url: 'https://codingthailand.app/minigame/cipher', emoji: '🔐', noLogin: true },
        { title: 'Caesar & Atbash', desc: 'เกมรหัสตรรกะแบบโบราณ', url: 'https://codingthailand.app/minigame/atbash-caesar', emoji: '🗝️', noLogin: true },
        { title: 'Blockly Games', desc: 'ปริศนาตรรกะ 7 ระดับ', url: 'https://blockly.games/', emoji: '🧩', noLogin: true },
        { title: 'Lightbot', desc: 'เกมตรรกะการเดินทาง', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
      ],
      quiz: [
        { q: 'การให้เหตุผลเชิงตรรกะใช้เพื่อ?', options: ['ตัดสินความสมเหตุสมผล', 'ความบันเทิง', 'ความสวยงาม', 'การเล่นเกม'], answer: 0 },
      ],
    },
    2: {
      intro: 'สร้างเกม Virtual Pet, Collector Game ด้วย Scratch + ออกแบบ Flowchart! 🎮',
      videos: [yt('Scratch สร้างเกม Virtual Pet'), yt('Flowchart programming Thai')],
      fun: [
        { title: 'Scratch Try It', desc: 'สร้างเกมเอง ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Diagrams.net', desc: 'วาด Flowchart', url: 'https://app.diagrams.net/', emoji: '📐', noLogin: true },
        { title: 'AI for Oceans', desc: 'เรียน AI สนุกๆ', url: 'https://code.org/oceans', emoji: '🤖', noLogin: true },
        { title: 'Lightbot', desc: 'เกมเขียนโค้ดสั่งหุ่นยนต์', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
      ],
      quiz: [
        { q: 'สัญลักษณ์ Flowchart รูปสี่เหลี่ยมข้าวหลามตัดใช้สำหรับ?', options: ['เริ่ม/จบ', 'การประมวลผล', 'การตัดสินใจ', 'การรับข้อมูล'], answer: 2 },
      ],
    },
    3: {
      intro: 'ค้นหาข้อมูลแบบโปร! เทคนิค Site:, filetype:, เครื่องหมาย "" 🔍',
      videos: [yt('Google search techniques Thai'), yt('การค้นหาขั้นสูง Google')],
      fun: [
        { title: 'Google Advanced Search', desc: 'ค้นหาขั้นสูง', url: 'https://www.google.com/advanced_search', emoji: '🔎', noLogin: true },
        { title: 'Google Scholar', desc: 'ค้นหางานวิชาการ', url: 'https://scholar.google.com/', emoji: '🎓', noLogin: true },
        { title: 'Wikipedia ไทย', desc: 'สารานุกรมเสรี', url: 'https://th.wikipedia.org/', emoji: '📖', noLogin: true },
        { title: 'DuckDuckGo', desc: 'ค้นหาเป็นส่วนตัว', url: 'https://duckduckgo.com/', emoji: '🦆', noLogin: true },
      ],
      quiz: [
        { q: 'การค้นหา "ประเทศอาเซียน Site:co.th" หมายถึง?', options: ['ค้นหาในเว็บไทยเท่านั้น', 'ค้นหาในทุกเว็บ', 'ค้นหารูปภาพ', 'ค้นหาวิดีโอ'], answer: 0 },
        { q: 'การค้นหาโดยระบุชนิดไฟล์ใช้คำว่าอะไร?', options: ['Site:', 'filetype: หรือ .pdf', 'inurl:', 'intitle:'], answer: 1 },
      ],
    },
    4: {
      intro: 'พ.ร.บ.คอมพิวเตอร์ — กฎหมายที่ทุกคนต้องรู้! ⚖️',
      videos: [yt('พ.ร.บ.คอมพิวเตอร์ สำหรับนักเรียน'), yt('Phishing scam awareness Thai')],
      fun: [
        { title: 'Think Digital', desc: 'พลเมืองดิจิทัล (ไทย)', url: 'https://think-digital.app/', emoji: '🛡️', noLogin: true },
        { title: 'Password Game', desc: 'ฝึกตั้งรหัสผ่าน', url: 'https://think-digital.app/minigame/password', emoji: '🔐', noLogin: true },
        { title: 'Be Internet Awesome', desc: 'พลเมืองดิจิทัล (Google)', url: 'https://beinternetawesome.withgoogle.com/th_th', emoji: '🦸', noLogin: true },
        { title: 'AntiFakeNews TH', desc: 'ศูนย์ตรวจสอบข่าวปลอม', url: 'https://www.antifakenewscenter.com/', emoji: '📰', noLogin: true },
      ],
      articles: [scimathArticles.virus],
      quiz: [
        { q: 'การหลอกลวงแบบฟิชชิงคืออะไร?', options: ['ตกปลา', 'หลอกให้เปิดเผยข้อมูลผ่านอีเมล/เว็บ', 'การคุย', 'การโทรศัพท์'], answer: 1 },
        { q: 'แอบเข้าระบบคอมพิวเตอร์ของคนอื่นโดยไม่ได้รับอนุญาต ผิด พ.ร.บ. หรือไม่?', options: ['ไม่ผิด', 'ผิดและมีโทษ', 'ไม่แน่ใจ', 'ผิดเฉพาะผู้ใหญ่'], answer: 1 },
      ],
    },
  },
  
  "m1-cs": {
    1: {
      intro: 'แนวคิดเชิงนามธรรม (Abstraction) — พื้นฐานสำคัญของวิทยาการคำนวณที่ช่วยให้เราแก้ปัญหาที่ซับซ้อนได้อย่างมีประสิทธิภาพ โดยการคัดกรองเฉพาะข้อมูลที่จำเป็น 💡',
      videos: [yt('แนวคิดเชิงนามธรรม ม.1'), yt('Computational Thinking Thai')],
      fun: [
        { title: '🎓 Code.org CS Discoveries', desc: 'หลักสูตร CS เต็ม สำหรับ ม.ต้น (Web/App/Game)', url: 'https://studio.code.org/courses/csd-2023', emoji: '🎓', noLogin: true },
        { title: '🤖 Coding Maze (ในเว็บนี้)', desc: 'ลากบล็อกพาหุ่นยนต์ฝ่ามาผ่านอุปสรรค', url: '/games/coding-maze', emoji: '🤖', noLogin: true },
        { title: '🧩 Algorithm Sorter (ในเว็บนี้)', desc: 'ลากขั้นตอนเรียงตามลำดับที่ถูกต้อง', url: '/games/algorithm-sorter', emoji: '🧩', noLogin: true },
        { title: 'Blockly Games', desc: 'ปริศนาตรรกะ 7 ระดับ', url: 'https://blockly.games/', emoji: '🧩', noLogin: true },
        { title: 'Lightbot', desc: 'เกมตรรกะการเดินทาง', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
        { title: 'Cipher Mini Game', desc: 'เกมถอดรหัส', url: 'https://codingthailand.app/minigame/cipher', emoji: '🔐', noLogin: true },
      ],
      articles: [scimathArticles.algorithm],
      quiz: [
        { q: 'แนวคิดเชิงนามธรรม (Abstraction) คืออะไร?', options: ['การวาดภาพเหมือนจริง', 'การคัดเลือกเฉพาะส่วนที่สำคัญของปัญหา', 'การเขียนโปรแกรมด้วยภาษาอังกฤษ', 'การใช้คอมพิวเตอร์แก้ปัญหา'], answer: 1 },
        { q: 'ประโยชน์ของแนวคิดเชิงนามธรรมคืออะไร?', options: ['ทำให้ปัญหาซับซ้อนน้อยลง', 'ทำให้ภาพสวยขึ้น', 'ทำให้ประหยัดไฟฟ้า', 'ทำให้พิมพ์ได้เร็วขึ้น'], answer: 0 },
        { q: 'ถ้าต้องการวาดแผนที่เส้นทางจากบ้านไปโรงเรียน ข้อมูลใด "ไม่จำเป็น" ในเชิงนามธรรม?', options: ['ชื่อถนนหลัก', 'สีของหลังคาบ้านทุกหลังที่ขับผ่าน', 'จุดเลี้ยวสำคัญ', 'ระยะทางโดยประมาณ'], answer: 1 },
        { q: 'การแยกส่วนประกอบของปัญหา (Decomposition) คืออะไร?', options: ['การรวมปัญหาเข้าด้วยกัน', 'การแตกปัญหาย่อยๆ ออกมาเพื่อแก้ทีละส่วน', 'การลบปัญหาทิ้ง', 'การข้ามปัญหาที่ยาก'], answer: 1 },
        { q: 'ข้อใดคือการหารูปแบบ (Pattern Recognition)?', options: ['การสังเกตความเหมือนหรือต่างของปัญหา', 'การเขียนโค้ด', 'การวาดรูป', 'การคำนวณ'], answer: 0 },
        { q: 'ขั้นตอนการออกแบบอัลกอริทึม (Algorithm Design) คือ?', options: ['การหาคำตอบทันที', 'การกำหนดขั้นตอนการแก้ปัญหาเป็นลำดับ', 'การเดาสุ่ม', 'การใช้โปรแกรมวาดภาพ'], answer: 1 },
        { q: 'แนวคิดเชิงคำนวณมีกี่องค์ประกอบหลัก?', options: ['2', '3', '4', '5'], answer: 2 },
        { q: 'องค์ประกอบใดที่ไม่ใช่ของแนวคิดเชิงคำนวณ?', options: ['แนวคิดเชิงนามธรรม', 'การออกแบบอัลกอริทึม', 'การวาดภาพกราฟิก', 'การพิจารณารูปแบบ'], answer: 2 },
        { q: 'การนำสถานการณ์มาจำลองเป็นภาพวาดง่ายๆ เป็นแนวคิดใด?', options: ['เชิงนามธรรม', 'การคำนวณ', 'การวาดรูป', 'การสืบค้น'], answer: 0 },
        { q: 'แนวคิดเชิงคำนวณมีไว้เพื่ออะไร?', options: ['เพื่อให้คอมพิวเตอร์เก่งกว่าคน', 'เพื่อให้มนุษย์มีกระบวนการคิดแก้ปัญหาที่ชัดเจน', 'เพื่อความสนุก', 'เพื่อการแข่งขัน'], answer: 1 },
        { q: 'การเรียงลำดับขั้นตอนการซักผ้า คือแนวคิดใด?', options: ['อัลกอริทึม', 'นามธรรม', 'หารูปแบบ', 'แยกส่วนประกอบ'], answer: 0 },
        { q: 'การสังเกตว่ารถยนต์ทุกคันมี 4 ล้อ คือแนวคิดใด?', options: ['อัลกอริทึม', 'นามธรรม', 'การหารูปแบบ', 'แยกส่วนประกอบ'], answer: 2 },
        { q: 'การแกะชิ้นส่วนวิทยุออกมาดูว่ามีอะไรบ้าง คือแนวคิดใด?', options: ['แยกส่วนประกอบของปัญหา', 'นามธรรม', 'อัลกอริทึม', 'หารูปแบบ'], answer: 0 },
        { q: 'ถ้านักเรียนต้องวางแผนไปเที่ยวหลายสถานที่ใน 1 วัน ควรใช้แนวคิดใด?', options: ['อัลกอริทึม', 'นามธรรม', 'หารูปแบบ', 'ทุกข้อรวมกัน'], answer: 3 },
        { q: 'แนวคิดเชิงคำนวณเรียกเป็นภาษาอังกฤษว่าอะไร?', options: ['Computer Science', 'Computational Thinking', 'Algorithm', 'Digital Literacy'], answer: 1 },
        { q: 'การเขียนผังงาน (Flowchart) จัดอยู่ในส่วนใด?', options: ['การพิจารณารูปแบบ', 'การออกแบบอัลกอริทึม', 'แนวคิดเชิงนามธรรม', 'การแตกปัญหา'], answer: 1 },
        { q: 'สัญลักษณ์เริ่มต้นในผังงานคือรูปใด?', options: ['สี่เหลี่ยมผืนผ้า', 'วงรี หรือ สี่เหลี่ยมมุมมน', 'วงกลม', 'สามเหลี่ยม'], answer: 1 },
        { q: 'สัญลักษณ์การตัดสินใจในผังงานคือรูปใด?', options: ['วงรี', 'สี่เหลี่ยมขนมเปียกปูน', 'สี่เหลี่ยมผืนผ้า', 'วงกลม'], answer: 1 },
        { q: 'ทิศทางของลูกศรในผังงานควรเป็นอย่างไร?', options: ['จากล่างขึ้นบน', 'จากซ้ายไปขวาเท่านั้น', 'จากบนลงล่าง หรือ ตามลำดับขั้นตอน', 'ไม่มีกฎเกณฑ์'], answer: 2 },
        { q: 'การนำแนวคิดเชิงคำนวณไปใช้ไม่จำเป็นต้องใช้คอมพิวเตอร์เสมอไป ใช่หรือไม่?', options: ['ใช่ (Unplugged)', 'ไม่ใช่', 'ไม่แน่ใจ', 'ใช้เฉพาะคณิตศาสตร์'], answer: 0 },
      ]
    },
    2: {
      intro: 'ลงมือเขียนโปรแกรม Scratch! สร้างเกม นิทาน หรือชิ้นงานสนุกๆ พร้อมเรียนรู้ตัวแปร เงื่อนไข และการวนซ้ำ 🐱',
      videos: [
        yt('สอน Scratch ม.1 พื้นฐาน'),
        yt('Scratch ตัวแปรและเงื่อนไข'),
        yt('การประมวลผลข้อมูลด้วย Excel ม.1'),
        yt('ภัยคุกคามไซเบอร์ สำหรับนักเรียน'),
      ],
      fun: [
        { title: '📱 Code.org App Lab', desc: 'สร้าง Mobile App ด้วย JavaScript+Block', url: 'https://studio.code.org/projects/applab', emoji: '📱', noLogin: true },
        { title: '🕹️ Code.org Game Lab', desc: 'สร้างเกม 2D ด้วย sprite + animation', url: 'https://studio.code.org/projects/gamelab', emoji: '🕹️', noLogin: true },
        { title: '🤖 Dance Party AI', desc: 'AI แต่งท่าเต้นจากคำพูด — สนุก ม.ต้น', url: 'https://studio.code.org/s/dance-ai', emoji: '🤖', noLogin: true },
        { title: '✒️ Poetry with Code', desc: 'แต่งกลอนด้วยโค้ด — string + variables', url: 'https://studio.code.org/s/poetry', emoji: '✒️', noLogin: true },
        { title: 'Scratch Try It', desc: 'ลองเขียน Scratch ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Think Digital', desc: 'พลเมืองดิจิทัลสำหรับ ม.ต้น', url: 'https://think-digital.app/', emoji: '🛡️', noLogin: true },
      ],
      articles: [scimathArticles.virus, scimathArticles.dataProcessing],
      quiz: [
        { q: 'ตัวแปร (Variable) ใน Scratch ใช้ทำอะไร?', options: ['เก็บค่าเพื่อใช้ภายหลัง', 'แสดงรูปภาพ', 'เล่นเสียง', 'เปลี่ยนพื้นหลัง'], answer: 0 },
        { q: 'บล็อก "ทำซ้ำ 10 ครั้ง" ใน Scratch จัดเป็นโครงสร้างใด?', options: ['เงื่อนไข', 'การวนซ้ำ (Loop)', 'ฟังก์ชัน', 'ตัวแปร'], answer: 1 },
        { q: 'บล็อก "ถ้า...แล้ว..." คือโครงสร้างใด?', options: ['การวนซ้ำ', 'การตัดสินใจ (Conditional)', 'ตัวแปร', 'ฟังก์ชัน'], answer: 1 },
        { q: 'ข้อมูลปฐมภูมิ (Primary Data) คือข้อมูลแบบใด?', options: ['ข้อมูลที่เก็บเองโดยตรง', 'ข้อมูลที่ค้นจากเว็บ', 'ข้อมูลในหนังสือ', 'ข้อมูลจากเพื่อน'], answer: 0 },
        { q: 'ซอฟต์แวร์ใดเหมาะสำหรับการประมวลผลข้อมูลตัวเลข?', options: ['Word', 'Excel', 'Paint', 'PowerPoint'], answer: 1 },
        { q: 'ฟิชชิง (Phishing) คือภัยคุกคามแบบใด?', options: ['ไวรัสคอมพิวเตอร์', 'การหลอกขอข้อมูลผ่านอีเมล/เว็บปลอม', 'แฮกเกอร์เจาะระบบ', 'ระบบล่ม'], answer: 1 },
        { q: 'มัลแวร์ (Malware) คืออะไร?', options: ['โปรแกรมประยุกต์ทั่วไป', 'โปรแกรมที่ออกแบบมาทำลาย/ขโมยข้อมูล', 'ระบบปฏิบัติการ', 'อุปกรณ์ฮาร์ดแวร์'], answer: 1 },
        { q: 'ก่อนติดตั้งโปรแกรมใหม่ ควรทำอะไร?', options: ['ติดตั้งทันที', 'ตรวจสอบที่มาและความน่าเชื่อถือ', 'ปิดแอนตี้ไวรัสก่อน', 'แชร์ให้เพื่อน'], answer: 1 },
        { q: 'รหัสผ่านที่ดีควรมีลักษณะใด?', options: ['สั้น จำง่าย', 'ยาวอย่างน้อย 8 ตัว ผสมตัวเลข ตัวอักษรใหญ่/เล็ก สัญลักษณ์', 'ใช้วันเกิด', 'ใช้รหัสเดิมทุกที่'], answer: 1 },
        { q: 'ข้อมูลใดไม่ควรเปิดเผยทาง Social Media?', options: ['ความสนใจทั่วไป', 'รูปอาหาร', 'เลขบัตรประชาชน/บ้านเลขที่', 'ทีมกีฬาที่เชียร์'], answer: 2 },
      ]
    }
  },
  "m1-design": {
    1: {
      intro: 'เทคโนโลยีอยู่รอบตัวเรา! มาเข้าใจระบบทางเทคโนโลยีและผลกระทบของมันต่อชีวิตประจำวัน 💡',
      videos: [yt('ระบบทางเทคโนโลยี ม.1'), yt('ผลกระทบของเทคโนโลยี')],
      fun: [
        { title: 'Tinkercad', desc: 'ออกแบบ 3D บนเว็บ', url: 'https://www.tinkercad.com/', emoji: '🏗️', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดแผนภาพระบบ', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
      ],
      articles: [scimathArticles.technologyDesign],
      quiz: [
        { q: 'เทคโนโลยีคืออะไร?', options: ['คอมพิวเตอร์เท่านั้น', 'การประยุกต์ความรู้เพื่อแก้ปัญหา/ตอบสนองความต้องการ', 'อินเทอร์เน็ต', 'มือถือ'], answer: 1 },
        { q: 'ระบบทางเทคโนโลยีประกอบด้วยอะไรบ้าง?', options: ['Input → Process → Output', 'Run → Stop → Reset', 'Open → Save → Close', 'Start → Loop → End'], answer: 0 },
        { q: 'การเปลี่ยนแปลงของเทคโนโลยีเกิดจาก?', options: ['ความต้องการของมนุษย์', 'ความก้าวหน้าทางวิทยาศาสตร์', 'ปัญหาที่ต้องแก้', 'ทุกข้อ'], answer: 3 },
        { q: 'ผลกระทบเชิงบวกของเทคโนโลยี?', options: ['ทำงานสะดวกขึ้น', 'ติดต่อสื่อสารได้ทั่วโลก', 'การแพทย์ก้าวหน้า', 'ทุกข้อ'], answer: 3 },
        { q: 'ผลกระทบเชิงลบของเทคโนโลยี?', options: ['ขยะอิเล็กทรอนิกส์', 'การติดเทคโนโลยี', 'ความเป็นส่วนตัวลดลง', 'ทุกข้อ'], answer: 3 },
        { q: 'ตัวอย่าง Input ของระบบหุงข้าวอัตโนมัติ?', options: ['ข้าวสาร น้ำ', 'ข้าวสุก', 'หม้อหุงข้าว', 'ปลั๊กไฟ'], answer: 0 },
        { q: 'ตัวอย่าง Output ของระบบหุงข้าวอัตโนมัติ?', options: ['ข้าวสาร', 'ข้าวสุก', 'น้ำ', 'ไฟฟ้า'], answer: 1 },
      ]
    },
    2: {
      intro: 'กระบวนการออกแบบเชิงวิศวกรรม 6 ขั้น — เครื่องมือคิดของวิศวกรเพื่อแก้ปัญหาอย่างเป็นระบบ 📐',
      videos: [yt('กระบวนการออกแบบเชิงวิศวกรรม 6 ขั้น'), yt('Engineering Design Process')],
      fun: [
        { title: 'Excalidraw', desc: 'วาดแบบร่างไอเดีย', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
        { title: 'Tinkercad', desc: 'สร้างต้นแบบ 3D', url: 'https://www.tinkercad.com/', emoji: '🏗️', noLogin: true },
        { title: 'Diagrams.net', desc: 'วาดแผนผังกระบวนการ', url: 'https://app.diagrams.net/', emoji: '📊', noLogin: true },
      ],
      articles: [scimathArticles.technologyDesign],
      quiz: [
        { q: 'กระบวนการออกแบบเชิงวิศวกรรมมีกี่ขั้น?', options: ['3', '5', '6', '7'], answer: 2 },
        { q: 'ขั้นตอนแรกของกระบวนการออกแบบคือ?', options: ['สร้างต้นแบบ', 'ระบุปัญหา', 'ทดสอบ', 'นำเสนอ'], answer: 1 },
        { q: 'หลังจากออกแบบแล้วต้องทำอะไรต่อ?', options: ['นำเสนอเลย', 'สร้างต้นแบบและทดสอบ', 'ลบทิ้ง', 'รอดู'], answer: 1 },
        { q: 'การประเมินผลใช้ทำอะไร?', options: ['ตรวจสอบว่าได้ผลตรงตามต้องการหรือไม่', 'ประดับชิ้นงาน', 'ทำลายชิ้นงาน', 'ขายของ'], answer: 0 },
        { q: 'ถ้าทดสอบแล้วยังไม่ได้ผลตามต้องการ ควรทำอย่างไร?', options: ['ยอมแพ้', 'ปรับปรุงและทดสอบใหม่', 'ทิ้งโครงการ', 'เริ่มเรื่องใหม่'], answer: 1 },
        { q: 'ทำไมต้องรวบรวมข้อมูลก่อนออกแบบ?', options: ['เสียเวลา', 'เพื่อทราบข้อจำกัด ความต้องการ และทางเลือก', 'ไม่จำเป็น', 'ทำให้ช้า'], answer: 1 },
      ]
    },
    3: {
      intro: 'ลงมือทำชิ้นงาน! รู้จักวัสดุ อุปกรณ์ กลไก ไฟฟ้า และเครื่องมือช่างพื้นฐาน 🧰',
      videos: [yt('วัสดุและเครื่องมือช่างพื้นฐาน ม.1'), yt('ความปลอดภัยในงานช่าง'), yt('กลไกพื้นฐาน คานและรอก')],
      fun: [
        { title: 'Tinkercad Circuits', desc: 'จำลองวงจรไฟฟ้า', url: 'https://www.tinkercad.com/circuits', emoji: '🔌', noLogin: true },
        { title: 'PhET Simulation', desc: 'จำลองฟิสิกส์/กลไก', url: 'https://phet.colorado.edu/th/', emoji: '⚙️', noLogin: true },
        { title: 'Tinkercad 3D', desc: 'ออกแบบชิ้นงาน 3D', url: 'https://www.tinkercad.com/', emoji: '🏗️', noLogin: true },
      ],
      quiz: [
        { q: 'วัสดุประเภทใดเป็นโลหะ?', options: ['เหล็ก', 'พลาสติก', 'ไม้', 'แก้ว'], answer: 0 },
        { q: 'เครื่องมือใดใช้ตัดไม้?', options: ['ค้อน', 'เลื่อย', 'ไขควง', 'คีม'], answer: 1 },
        { q: 'รอก (Pulley) เป็นกลไกประเภทใด?', options: ['ผ่อนแรง', 'เพิ่มแรง', 'ไม่มีผล', 'ทำลายแรง'], answer: 0 },
        { q: 'ก่อนใช้งานเครื่องมือช่าง ควรทำอะไร?', options: ['ใช้ทันที', 'สวมอุปกรณ์ป้องกัน + ตรวจสภาพเครื่องมือ', 'หลับตา', 'พูดคุย'], answer: 1 },
        { q: 'ถ้าได้รับบาดเจ็บจากเครื่องมือ ควรทำอย่างไร?', options: ['ปกปิด', 'แจ้งครู/ผู้ปกครอง + ปฐมพยาบาล', 'ทำงานต่อ', 'หยุดเรียน'], answer: 1 },
        { q: 'แบตเตอรี่จัดเป็นแหล่งอะไร?', options: ['น้ำ', 'พลังงานไฟฟ้า', 'ความร้อน', 'แสง'], answer: 1 },
      ]
    }
  },
  
  "m2-cs": {
    1: {
      intro: 'แนวคิดเชิงคำนวณ (Computational Thinking) — กระบวนการคิดที่ใช้แก้ปัญหาทุกประเภทอย่างเป็นระบบ! 🧠',
      videos: [yt('แนวคิดเชิงคำนวณ ม.2'), yt('Computational Thinking ภาษาไทย')],
      fun: [
        { title: 'Blockly Games', desc: 'ฝึกแนวคิดเชิงคำนวณ', url: 'https://blockly.games/', emoji: '🧩', noLogin: true },
        { title: 'Lightbot', desc: 'แก้ปัญหาด้วยอัลกอริทึม', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
        { title: 'Code Combat', desc: 'ผจญภัยเขียนโค้ด', url: 'https://codecombat.com/play', emoji: '⚔️', noLogin: true },
      ],
      articles: [scimathArticles.algorithm],
      quiz: [
        { q: 'แนวคิดเชิงคำนวณ (Computational Thinking) ประกอบด้วยกี่องค์ประกอบหลัก?', options: ['2', '3', '4', '5'], answer: 2 },
        { q: 'การแยกย่อยปัญหา (Decomposition) หมายถึง?', options: ['รวมปัญหาทั้งหมด', 'แตกปัญหาออกเป็นส่วนเล็กๆ', 'ลบปัญหาทิ้ง', 'ข้ามปัญหา'], answer: 1 },
        { q: 'การหารูปแบบ (Pattern Recognition) คือ?', options: ['การวาดรูป', 'การหาความเหมือนระหว่างปัญหา', 'การเขียนโค้ด', 'การคำนวณ'], answer: 1 },
        { q: 'ตัวอย่างการคิดเชิงนามธรรม (Abstraction) คือ?', options: ['ใช้แผนที่ที่แสดงเฉพาะถนนหลัก', 'วาดทุกรายละเอียด', 'จดจำทุกอย่าง', 'ไม่กรองข้อมูล'], answer: 0 },
        { q: 'อัลกอริทึม (Algorithm) คือ?', options: ['ภาษาคอมพิวเตอร์', 'ลำดับขั้นตอนแก้ปัญหา', 'อุปกรณ์ฮาร์ดแวร์', 'ฟอนต์'], answer: 1 },
        { q: 'การจัดเรียงไพ่จากน้อยไปมาก ใช้แนวคิดใด?', options: ['Decomposition', 'Pattern', 'Abstraction', 'Algorithm'], answer: 3 },
        { q: 'การแบ่งงานทำรายงานออกเป็น "หาข้อมูล / เขียน / ตรวจสอบ" คือแนวคิดใด?', options: ['Decomposition', 'Pattern', 'Abstraction', 'Algorithm'], answer: 0 },
        { q: 'แนวคิดเชิงคำนวณช่วยอะไรในชีวิตจริง?', options: ['ช่วยแก้ปัญหาอย่างเป็นระบบ', 'เล่นเกมเก่งขึ้น', 'ทำให้คอมพิวเตอร์ฉลาดขึ้น', 'ไม่มีประโยชน์'], answer: 0 },
      ]
    },
    2: {
      intro: 'เขียน Python ด้วยตรรกะ — Boolean, while loop, function! สร้างโปรแกรมจริงจังได้แล้ว 🐍',
      videos: [yt('Python while loop ภาษาไทย'), yt('Python function สำหรับมือใหม่'), yt('Boolean operators Python')],
      fun: [
        { title: 'Python Tutor', desc: 'ดูการทำงาน Python ทีละขั้น', url: 'https://pythontutor.com/', emoji: '🐍', noLogin: true },
        { title: 'Trinket Python', desc: 'รัน Python บนเว็บ', url: 'https://trinket.io/python', emoji: '💻', noLogin: true },
        { title: 'Code Combat Python', desc: 'เล่นเกมเขียน Python', url: 'https://codecombat.com/play', emoji: '⚔️', noLogin: true },
      ],
      quiz: [
        { q: 'ตัวดำเนินการ Boolean ตัวใด หมายถึง "และ"?', options: ['or', 'and', 'not', 'xor'], answer: 1 },
        { q: '"not True" มีค่าเท่ากับ?', options: ['True', 'False', '0', 'None'], answer: 1 },
        { q: 'while loop ทำงานอย่างไร?', options: ['ทำซ้ำตราบเท่าที่เงื่อนไขเป็นจริง', 'ทำเพียง 1 ครั้ง', 'ไม่ทำงานเลย', 'ทำตามจำนวนคนใช้'], answer: 0 },
        { q: 'ฟังก์ชัน (Function) คือ?', options: ['กลุ่มคำสั่งที่นำกลับมาใช้ใหม่ได้', 'ตัวแปร', 'ภาษาคอมพิวเตอร์', 'อุปกรณ์'], answer: 0 },
        { q: 'คำสั่งใดในการสร้างฟังก์ชัน Python?', options: ['function', 'def', 'create', 'new'], answer: 1 },
        { q: 'parameter (พารามิเตอร์) คือ?', options: ['ชื่อตัวแปรที่รับค่าเข้าฟังก์ชัน', 'ผลลัพธ์ของฟังก์ชัน', 'ตัวเลขเสมอ', 'ตัวอักษรเสมอ'], answer: 0 },
        { q: 'คำสั่ง return ในฟังก์ชันใช้ทำอะไร?', options: ['ส่งค่ากลับ', 'พิมพ์ค่า', 'หยุดโปรแกรม', 'ลบฟังก์ชัน'], answer: 0 },
        { q: 'while True: จะเกิดอะไร?', options: ['ทำงาน 1 ครั้ง', 'วนซ้ำไม่สิ้นสุด (Infinite Loop)', 'ไม่ทำงาน', 'แสดง error'], answer: 1 },
      ]
    },
    3: {
      intro: 'รู้จักระบบคอมพิวเตอร์ ตั้งแต่ฮาร์ดแวร์ ซอฟต์แวร์ ไปจนถึงเครือข่ายอินเทอร์เน็ต! 🖥️',
      videos: [yt('องค์ประกอบคอมพิวเตอร์ ม.2'), yt('การทำงานของอินเทอร์เน็ต'), yt('คลาวด์คอมพิวติงคืออะไร')],
      fun: [
        { title: 'How does the Internet work', desc: 'วิดีโออธิบายการทำงาน', url: 'https://code.org/curriculum/course3/15/Teacher', emoji: '🌐', noLogin: true },
        { title: 'CPU Sim', desc: 'จำลองการทำงาน CPU', url: 'https://www.cs.colostate.edu/~cs270/.Spring16/recitation/2/CPUSim.html', emoji: '⚙️', noLogin: true },
        { title: 'Network Simulator', desc: 'จำลองเครือข่าย', url: 'https://www.netsim.online/', emoji: '🔗', noLogin: true },
      ],
      articles: [scimathArticles.computerBasics, scimathArticles.network, scimathArticles.os, scimathArticles.software, scimathArticles.dataCommunication],
      quiz: [
        { q: 'CPU ย่อมาจาก?', options: ['Central Processing Unit', 'Computer Power Unit', 'Core Programming Unit', 'Control Print Unit'], answer: 0 },
        { q: 'หน่วยความจำชั่วคราวเรียกว่า?', options: ['ROM', 'RAM', 'CPU', 'HDD'], answer: 1 },
        { q: 'ซอฟต์แวร์ระบบ (System Software) ตัวอย่างคือ?', options: ['Microsoft Word', 'Windows / macOS', 'Photoshop', 'Chrome'], answer: 1 },
        { q: 'อินเทอร์เน็ตคืออะไร?', options: ['คอมพิวเตอร์เครื่องเดียว', 'เครือข่ายคอมพิวเตอร์ทั่วโลก', 'โปรแกรม', 'อุปกรณ์'], answer: 1 },
        { q: 'IP Address คืออะไร?', options: ['ที่อยู่ของเครื่องในเครือข่าย', 'ชื่อเว็บไซต์', 'รหัสผ่าน', 'ชื่อผู้ใช้'], answer: 0 },
        { q: 'Cloud Computing คือ?', options: ['คอมพิวเตอร์ในก้อนเมฆ', 'การใช้บริการคอมพิวเตอร์ผ่านอินเทอร์เน็ต', 'พยากรณ์อากาศ', 'อุปกรณ์เก็บข้อมูล'], answer: 1 },
        { q: 'ตัวอย่างบริการ Cloud คือ?', options: ['Google Drive, Dropbox', 'Microsoft Word', 'Notepad', 'Calculator'], answer: 0 },
        { q: 'WWW ย่อมาจาก?', options: ['World Wide Web', 'Wireless Web World', 'Web Wide World', 'World Web Wave'], answer: 0 },
      ]
    },
    4: {
      intro: 'ใช้เทคโนโลยีอย่างมีจริยธรรม เคารพสิทธิ์ผู้อื่น และรู้กฎหมายไซเบอร์! ⚖️',
      videos: [yt('พ.ร.บ.คอมพิวเตอร์ ม.2'), yt('ลิขสิทธิ์และการใช้งานอย่างเป็นธรรม'), yt('มารยาทออนไลน์')],
      fun: [
        { title: 'Be Internet Awesome', desc: 'พลเมืองดิจิทัล (Google)', url: 'https://beinternetawesome.withgoogle.com/th_th', emoji: '🦸', noLogin: true },
        { title: 'Interland', desc: 'เกมพลเมืองดิจิทัล', url: 'https://beinternetawesome.withgoogle.com/th_th/interland', emoji: '🌐', noLogin: true },
        { title: 'AntiFakeNews TH', desc: 'ตรวจสอบข่าวปลอม', url: 'https://www.antifakenewscenter.com/', emoji: '📰', noLogin: true },
      ],
      articles: [scimathArticles.virus],
      quiz: [
        { q: 'การใช้ภาพจากอินเทอร์เน็ตโดยไม่ขออนุญาต อาจผิดเรื่องใด?', options: ['ลิขสิทธิ์', 'พ.ร.บ.จราจร', 'ภาษี', 'การศึกษา'], answer: 0 },
        { q: 'พ.ร.บ.คอมพิวเตอร์ ครอบคลุมเรื่องใด?', options: ['การกระทำผิดผ่านระบบคอมพิวเตอร์', 'การใช้รถยนต์', 'การทำอาหาร', 'การเล่นกีฬา'], answer: 0 },
        { q: 'การโพสต์ข้อความเท็จที่ทำให้คนอื่นเสียหาย ผิดอะไร?', options: ['ไม่ผิด', 'พ.ร.บ.คอมพิวเตอร์ มาตราการหมิ่นประมาท', 'กฎจราจร', 'ภาษี'], answer: 1 },
        { q: 'มารยาทในการสื่อสารออนไลน์ที่ดี?', options: ['ใช้คำหยาบ', 'แชร์ข้อมูลส่วนตัวคนอื่น', 'สุภาพ ไม่ใส่ร้าย', 'พิมพ์ตัวพิมพ์ใหญ่ทั้งหมด'], answer: 2 },
        { q: 'Fair Use คือ?', options: ['การใช้ผลงานอย่างเป็นธรรมเพื่อการศึกษา/วิจารณ์', 'การละเมิดลิขสิทธิ์', 'การขายของออนไลน์', 'การแชร์ข้อมูลส่วนตัว'], answer: 0 },
        { q: 'ถ้าพบเนื้อหาไม่เหมาะสมบนอินเทอร์เน็ต ควรทำอย่างไร?', options: ['แชร์ต่อ', 'แจ้งผู้ใหญ่/ผู้ดูแลระบบ', 'เก็บไว้คนเดียว', 'ลอกเลียน'], answer: 1 },
        { q: 'การ "ก๊อปปี้-วาง" งานคนอื่นโดยไม่อ้างอิง เรียกว่า?', options: ['การเรียนรู้', 'Plagiarism (การลักลอก)', 'การค้นคว้า', 'การวิจัย'], answer: 1 },
        { q: 'การส่งสแปม (Spam) ผิดกฎหมายหรือไม่?', options: ['ไม่ผิด', 'ผิด พ.ร.บ.คอมพิวเตอร์', 'ผิดกฎจราจร', 'ไม่แน่ใจ'], answer: 1 },
      ]
    }
  },
  "m2-design": {
    1: {
      intro: 'เทคโนโลยีกำลังเปลี่ยนโลกของเราอย่างรวดเร็ว! มาเข้าใจการเปลี่ยนแปลงและผลกระทบของเทคโนโลยี 🌍',
      videos: [yt('การเปลี่ยนแปลงและผลกระทบเทคโนโลยี ม.2'), yt('Future of Technology Thai')],
      fun: [
        { title: 'PhET Simulations', desc: 'จำลองปรากฏการณ์ฟิสิกส์', url: 'https://phet.colorado.edu/th/', emoji: '⚙️', noLogin: true },
        { title: 'Tinkercad', desc: 'ออกแบบ 3D บนเว็บ', url: 'https://www.tinkercad.com/', emoji: '🏗️', noLogin: true },
      ],
      articles: [scimathArticles.technologyDesign],
      quiz: [
        { q: 'การเปลี่ยนแปลงของเทคโนโลยีเกิดจากอะไร?', options: ['ความต้องการของมนุษย์', 'ความก้าวหน้าทางวิทยาศาสตร์', 'การแข่งขันทางธุรกิจ', 'ทุกข้อ'], answer: 3 },
        { q: 'ผลกระทบเชิงลบของเทคโนโลยีที่ใช้ในปัจจุบัน?', options: ['ขยะอิเล็กทรอนิกส์เพิ่มขึ้น', 'มลพิษจากโรงงาน', 'การติดมือถือ', 'ทุกข้อ'], answer: 3 },
        { q: 'AI (Artificial Intelligence) คือ?', options: ['ปัญญาประดิษฐ์', 'หุ่นยนต์', 'อินเทอร์เน็ต', 'แอปพลิเคชัน'], answer: 0 },
        { q: 'แนวโน้มเทคโนโลยีในอนาคต?', options: ['Internet of Things', 'AI / Machine Learning', 'Renewable Energy', 'ทุกข้อ'], answer: 3 },
        { q: 'การจัดการขยะอิเล็กทรอนิกส์ที่ดีคือ?', options: ['ทิ้งขยะรวม', 'นำไปรีไซเคิลโดยผู้เชี่ยวชาญ', 'เผาทิ้ง', 'ฝังดิน'], answer: 1 },
      ]
    },
    2: {
      intro: 'รู้จักวัสดุ เครื่องกล เสียง ไฟฟ้า และแสง — พื้นฐานของวิศวกรรมที่ใช้สร้างชิ้นงาน 🔧',
      videos: [yt('ความรู้เกี่ยวกับวัสดุ ม.2'), yt('เครื่องกลและเครื่องมือ'), yt('ไฟฟ้าและแสง ม.2')],
      fun: [
        { title: 'Tinkercad Circuits', desc: 'จำลองวงจรไฟฟ้า', url: 'https://www.tinkercad.com/circuits', emoji: '🔌', noLogin: true },
        { title: 'PhET Sound', desc: 'จำลองคลื่นเสียง', url: 'https://phet.colorado.edu/th/simulations/wave-on-a-string', emoji: '🔊', noLogin: true },
        { title: 'PhET Circuit', desc: 'สร้างวงจรไฟฟ้าจำลอง', url: 'https://phet.colorado.edu/th/simulations/circuit-construction-kit-dc', emoji: '⚡', noLogin: true },
      ],
      quiz: [
        { q: 'วัสดุประเภทใดเป็นฉนวนไฟฟ้า?', options: ['ทองแดง', 'อะลูมิเนียม', 'พลาสติก', 'เหล็ก'], answer: 2 },
        { q: 'เครื่องกลพื้นฐานข้อใดผ่อนแรง?', options: ['คาน', 'รอก', 'ลิ่ม', 'ทุกข้อ'], answer: 3 },
        { q: 'เสียงเดินทางผ่านอะไรได้บ้าง?', options: ['อากาศเท่านั้น', 'ของแข็ง ของเหลว และก๊าซ', 'น้ำเท่านั้น', 'สูญญากาศ'], answer: 1 },
        { q: 'หลอดไฟ LED มีข้อดีคืออะไร?', options: ['ประหยัดไฟ', 'อายุการใช้งานยาว', 'ร้อนน้อย', 'ทุกข้อ'], answer: 3 },
        { q: 'อุปกรณ์ที่เปลี่ยนพลังงานไฟฟ้าเป็นแสง?', options: ['มอเตอร์', 'หลอดไฟ', 'พัดลม', 'ลำโพง'], answer: 1 },
        { q: 'หน่วยของความถี่เสียงคือ?', options: ['Hz (Hertz)', 'm (meter)', 'kg (kilogram)', 'A (Ampere)'], answer: 0 },
      ]
    },
    3: {
      intro: 'กระบวนการทางวิทยาศาสตร์ + กระบวนการออกแบบเชิงวิศวกรรม = สูตรแก้ปัญหาอย่างมืออาชีพ! 🔬',
      videos: [yt('กระบวนการทางวิทยาศาสตร์ ม.2'), yt('กระบวนการออกแบบเชิงวิศวกรรม')],
      fun: [
        { title: 'Excalidraw', desc: 'วาดแบบร่างไอเดีย', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
        { title: 'Tinkercad', desc: 'สร้างต้นแบบ 3D', url: 'https://www.tinkercad.com/', emoji: '🏗️', noLogin: true },
        { title: 'Diagrams.net', desc: 'วาดแผนผังกระบวนการ', url: 'https://app.diagrams.net/', emoji: '📊', noLogin: true },
      ],
      quiz: [
        { q: 'กระบวนการทางวิทยาศาสตร์เริ่มจาก?', options: ['สรุปผล', 'สังเกตและตั้งคำถาม', 'ทดลอง', 'นำเสนอ'], answer: 1 },
        { q: 'สมมติฐาน (Hypothesis) คือ?', options: ['ผลการทดลอง', 'การคาดเดาเบื้องต้นที่ตอบคำถาม', 'การสรุปขั้นสุดท้าย', 'การวาดรูป'], answer: 1 },
        { q: 'หลังจากออกแบบแล้ว ขั้นต่อไปคือ?', options: ['นำเสนอ', 'สร้างต้นแบบ', 'ลบทิ้ง', 'รอ'], answer: 1 },
        { q: 'ถ้าผลทดสอบไม่ตรงตามต้องการ ควร?', options: ['ปรับปรุงและทดสอบใหม่', 'ยอมแพ้', 'เปลี่ยนปัญหา', 'ทำลายชิ้นงาน'], answer: 0 },
        { q: 'การประเมินผลใช้ทำอะไร?', options: ['ตรวจสอบความสำเร็จ', 'หาจุดบกพร่อง', 'หาแนวทางปรับปรุง', 'ทุกข้อ'], answer: 3 },
      ]
    },
    4: {
      intro: 'การคิดเชิงออกแบบ (Design Thinking) — แนวคิดที่ทำให้ Apple, Google สร้างสินค้าโดนใจผู้ใช้! 💡',
      videos: [yt('Design Thinking คืออะไร ภาษาไทย'), yt('5 ขั้นตอนการคิดเชิงออกแบบ')],
      fun: [
        { title: 'Excalidraw', desc: 'วาดไอเดียและต้นแบบ', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
        { title: 'Figma Community', desc: 'ดูตัวอย่างการออกแบบ', url: 'https://www.figma.com/community', emoji: '🎨', noLogin: true },
        { title: 'Stanford d.school', desc: 'แหล่งเรียน Design Thinking', url: 'https://dschool.stanford.edu/', emoji: '🎓', noLogin: true },
      ],
      quiz: [
        { q: 'Design Thinking มีกี่ขั้นตอน?', options: ['3', '4', '5', '6'], answer: 2 },
        { q: 'ขั้นตอนแรกของ Design Thinking คือ?', options: ['Test', 'Empathize (เข้าใจผู้ใช้)', 'Define', 'Prototype'], answer: 1 },
        { q: 'Empathize หมายถึง?', options: ['เห็นใจ/เข้าใจผู้ใช้', 'ออกแบบ', 'ทดสอบ', 'นำเสนอ'], answer: 0 },
        { q: 'Ideate คือขั้นตอนใด?', options: ['ระดมความคิดสร้างสรรค์', 'ทดสอบ', 'สร้างต้นแบบ', 'นิยามปัญหา'], answer: 0 },
        { q: 'Prototype หมายถึง?', options: ['ผลิตจริงทุกชิ้น', 'สร้างต้นแบบเพื่อทดสอบไอเดีย', 'ขายของ', 'นำเสนอ'], answer: 1 },
        { q: 'จุดเด่นของ Design Thinking คือ?', options: ['เน้นเทคนิค', 'เน้นผู้ใช้เป็นศูนย์กลาง (Human-Centered)', 'เน้นต้นทุน', 'เน้นความเร็ว'], answer: 1 },
      ]
    }
  },
  
  "m3-cs": {
    1: {
      intro: 'ก้าวสู่โลกแห่งการพัฒนาแอปพลิเคชันและ IoT! สร้างผลงานจริงที่ใช้ในชีวิตประจำวัน 🚀',
      videos: [yt('การพัฒนาแอปพลิเคชัน ม.3'), yt('App Inventor สอนภาษาไทย'), yt('IoT คืออะไร')],
      fun: [
        { title: 'MIT App Inventor', desc: 'สร้างแอปแบบลากบล็อก', url: 'https://appinventor.mit.edu/explore/ai2', emoji: '📱', noLogin: true },
        { title: 'Wokwi IoT Sim', desc: 'จำลอง IoT/Arduino บนเว็บ', url: 'https://wokwi.com/', emoji: '🤖', noLogin: true },
        { title: 'Tinkercad Circuits', desc: 'จำลองวงจร IoT', url: 'https://www.tinkercad.com/circuits', emoji: '🔌', noLogin: true },
      ],
      articles: [scimathArticles.computerProject],
      quiz: [
        { q: 'แอปพลิเคชัน (Application) คืออะไร?', options: ['อุปกรณ์', 'โปรแกรมที่ทำงานเฉพาะด้าน', 'เครือข่าย', 'ข้อมูล'], answer: 1 },
        { q: 'ขั้นตอนแรกของการพัฒนาแอปคือ?', options: ['เขียนโค้ด', 'วิเคราะห์ความต้องการ/ออกแบบ', 'ทดสอบ', 'เผยแพร่'], answer: 1 },
        { q: 'GUI ย่อมาจาก?', options: ['General User Interface', 'Graphical User Interface', 'Game User Interface', 'Generic Universal Internet'], answer: 1 },
        { q: 'IoT ย่อมาจาก?', options: ['Internet of Things', 'Input/Output Tool', 'Intelligence of Tech', 'Internal Online Tools'], answer: 0 },
        { q: 'ตัวอย่างอุปกรณ์ IoT ที่พบในบ้าน?', options: ['หลอดไฟอัจฉริยะ', 'ตู้เย็น/แอร์ที่ควบคุมผ่านมือถือ', 'กล้องวงจรปิดเชื่อมเน็ต', 'ทุกข้อ'], answer: 3 },
        { q: 'Sensor (เซนเซอร์) ใช้ทำอะไรในระบบ IoT?', options: ['เก็บข้อมูลจากสภาพแวดล้อม', 'แสดงผล', 'เชื่อมต่ออินเทอร์เน็ต', 'จ่ายไฟ'], answer: 0 },
        { q: 'การพัฒนาแอปข้ามแพลตฟอร์ม (Cross-platform) หมายถึง?', options: ['แอปสำหรับ iOS เท่านั้น', 'แอปทำงานได้ทั้ง Android และ iOS', 'แอปเฉพาะ Windows', 'ไม่มี'], answer: 1 },
      ]
    },
    2: {
      intro: 'วิทยาการข้อมูล (Data Science)! เก็บ-ประมวลผล-นำเสนอข้อมูล แปลข้อมูลเป็นความรู้ 📊',
      videos: [yt('วิทยาการข้อมูลคืออะไร'), yt('Data Visualization สำหรับนักเรียน')],
      fun: [
        { title: 'Datawrapper', desc: 'สร้างกราฟ/แผนที่ข้อมูล ไม่ต้องสมัคร', url: 'https://www.datawrapper.de/', emoji: '📊', noLogin: true },
        { title: 'Observable Plot', desc: 'วิเคราะห์ข้อมูลออนไลน์', url: 'https://observablehq.com/plot/', emoji: '📈', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดแผนภูมิข้อมูล', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
      ],
      articles: [scimathArticles.dataScience, scimathArticles.dataProcessing, scimathArticles.mis],
      quiz: [
        { q: 'วิทยาการข้อมูล (Data Science) คือ?', options: ['การศึกษาข้อมูลเพื่อหาความรู้และตัดสินใจ', 'การถ่ายภาพ', 'การเล่นเกม', 'การทำเว็บ'], answer: 0 },
        { q: 'ขั้นตอนการประมวลผลข้อมูลเริ่มจาก?', options: ['การเก็บรวบรวมข้อมูล', 'การลบข้อมูล', 'การพิมพ์', 'การแชร์'], answer: 0 },
        { q: 'การนำเสนอข้อมูลด้วยภาพช่วยอะไร?', options: ['ทำให้เข้าใจง่ายและเห็นแนวโน้ม', 'ทำให้ซับซ้อนขึ้น', 'ไม่จำเป็น', 'ทำให้ช้าลง'], answer: 0 },
        { q: 'Big Data หมายถึง?', options: ['ข้อมูลขนาดเล็ก', 'ข้อมูลขนาดใหญ่และซับซ้อน', 'ข้อมูลส่วนตัว', 'ข้อมูลที่หาไม่ได้'], answer: 1 },
        { q: 'ตัวอย่างการประยุกต์ Data Science?', options: ['คาดการณ์อากาศ', 'แนะนำสินค้าใน E-commerce', 'วินิจฉัยโรค', 'ทุกข้อ'], answer: 3 },
        { q: 'แผนภูมิแท่ง (Bar Chart) เหมาะกับข้อมูลแบบใด?', options: ['เปรียบเทียบจำนวน', 'แสดงสัดส่วน', 'แสดงแนวโน้มเวลา', 'แสดงตำแหน่ง'], answer: 0 },
        { q: 'แผนภูมิวงกลม (Pie Chart) เหมาะกับ?', options: ['การเปรียบเทียบจำนวน', 'การแสดงสัดส่วน/เปอร์เซ็นต์', 'การแสดงเวลา', 'การวัดระยะ'], answer: 1 },
      ]
    },
    3: {
      intro: 'ในยุคข่าวลวง! รู้ทันสื่อ ตรวจสอบความจริง และไม่ตกเป็นเหยื่อข่าวปลอม 🕵️',
      videos: [yt('การประเมินข้อมูลออนไลน์ ม.3'), yt('Fake News ดูยังไงให้รู้ทัน'), yt('Logical Fallacies เหตุผลวิบัติ')],
      fun: [
        { title: 'AntiFakeNews TH', desc: 'ศูนย์ตรวจสอบข่าวปลอมไทย', url: 'https://www.antifakenewscenter.com/', emoji: '📰', noLogin: true },
        { title: 'Snopes', desc: 'ตรวจสอบข่าวระดับโลก', url: 'https://www.snopes.com/', emoji: '🔍', noLogin: true },
        { title: 'Be Internet Awesome', desc: 'พลเมืองดิจิทัล', url: 'https://beinternetawesome.withgoogle.com/th_th', emoji: '🦸', noLogin: true },
        { title: 'AFP Fact Check Thai', desc: 'ตรวจข้อเท็จจริงโดยสำนักข่าว', url: 'https://factcheckthailand.afp.com/', emoji: '✅', noLogin: true },
      ],
      quiz: [
        { q: 'ก่อนเชื่อข่าว/ข้อมูลที่อ่าน ควรทำอะไร?', options: ['แชร์ทันที', 'ตรวจสอบที่มาและความน่าเชื่อถือ', 'ลบทิ้ง', 'ไม่สนใจ'], answer: 1 },
        { q: 'แหล่งข้อมูลที่น่าเชื่อถือมีลักษณะใด?', options: ['ระบุที่มา/ผู้เขียน', 'มีการอัปเดต', 'มาจากสถาบันที่น่าเชื่อถือ', 'ทุกข้อ'], answer: 3 },
        { q: 'เหตุผลวิบัติ (Logical Fallacy) คือ?', options: ['การให้เหตุผลที่ผิดพลาด/ไม่สมเหตุสมผล', 'การพูดความจริง', 'การคำนวณ', 'การวาดภาพ'], answer: 0 },
        { q: 'การโจมตีบุคคล (Ad Hominem) เป็นเหตุผลวิบัติแบบใด?', options: ['การวิจารณ์ตัวบุคคลแทนที่จะวิจารณ์ความคิดเห็น', 'การวิเคราะห์ข้อมูล', 'การหาหลักฐาน', 'การถามคำถาม'], answer: 0 },
        { q: 'พาดหัวข่าวที่เร้าอารมณ์เกินจริง (Clickbait) ควรทำอย่างไร?', options: ['คลิกทันที', 'แชร์เลย', 'ตรวจสอบเนื้อหาก่อน', 'เชื่อทันที'], answer: 2 },
        { q: 'ข่าวปลอม (Fake News) สร้างผลเสียอย่างไร?', options: ['ทำให้คนเข้าใจผิด', 'สร้างความแตกแยก', 'ทำลายชื่อเสียงคนอื่น', 'ทุกข้อ'], answer: 3 },
        { q: 'การหาแหล่งอ้างอิงข่าวจากหลายแหล่งช่วยอะไร?', options: ['ยืนยันความจริงและหลายมุมมอง', 'เสียเวลา', 'ไม่จำเป็น', 'ทำให้สับสน'], answer: 0 },
      ]
    },
    4: {
      intro: 'ใช้เทคโนโลยีอย่างปลอดภัย ทำธุรกรรมออนไลน์อย่างมั่นใจ และรู้จักใช้ลิขสิทธิ์อย่างถูกต้อง! 🛡️',
      videos: [yt('ทำธุรกรรมออนไลน์ปลอดภัย'), yt('พ.ร.บ.คอมพิวเตอร์ ม.3'), yt('ลิขสิทธิ์ Fair Use')],
      fun: [
        { title: 'Think Digital', desc: 'พลเมืองดิจิทัลไทย', url: 'https://think-digital.app/', emoji: '🛡️', noLogin: true },
        { title: 'Password Game', desc: 'ฝึกตั้งรหัสผ่านปลอดภัย', url: 'https://think-digital.app/minigame/password', emoji: '🔐', noLogin: true },
        { title: 'Have I Been Pwned', desc: 'ตรวจว่าอีเมลโดนแฮกหรือยัง', url: 'https://haveibeenpwned.com/', emoji: '🔓', noLogin: true },
        { title: 'Creative Commons', desc: 'หาภาพ/สื่อใช้ฟรีตามสัญญาอนุญาต', url: 'https://search.creativecommons.org/', emoji: '🎨', noLogin: true },
      ],
      articles: [scimathArticles.virus],
      quiz: [
        { q: 'ก่อนทำธุรกรรมออนไลน์ ควรตรวจสอบอะไร?', options: ['URL ขึ้นต้นด้วย https://', 'ชื่อร้านที่น่าเชื่อถือ', 'รีวิวจากผู้ใช้จริง', 'ทุกข้อ'], answer: 3 },
        { q: 'รหัส OTP คืออะไร?', options: ['One-Time Password ใช้ครั้งเดียว', 'รหัสผ่านถาวร', 'PIN ATM', 'รหัสบัตรเครดิต'], answer: 0 },
        { q: 'ไม่ควรเปิดเผย OTP ให้ใคร?', options: ['ใครก็ได้', 'ห้ามเปิดเผยให้ใครเลย', 'แม่บ้าน', 'พนักงานธนาคาร'], answer: 1 },
        { q: 'การใช้รูปภาพจากเว็บ ต้องคำนึงถึง?', options: ['ลิขสิทธิ์/Creative Commons', 'ขนาดไฟล์', 'สีของรูป', 'ความคมชัด'], answer: 0 },
        { q: 'Creative Commons CC-BY คืออะไร?', options: ['สัญญาที่ต้องอ้างอิงผู้สร้าง', 'ห้ามใช้ฟรี', 'ใช้เพื่อการค้าได้เสมอ', 'ไม่จำเป็นต้องอ้างอิง'], answer: 0 },
        { q: 'ฟิชชิง (Phishing) มาในรูปแบบใดได้บ้าง?', options: ['อีเมลปลอม', 'SMS หลอก', 'เว็บไซต์ปลอม', 'ทุกข้อ'], answer: 3 },
        { q: 'ถ้ากดลิงก์น่าสงสัยและถูกขอข้อมูลธนาคาร ควรทำอย่างไร?', options: ['กรอกข้อมูล', 'ปิดทันที + แจ้งธนาคาร', 'เชื่อมั่น', 'แชร์ให้เพื่อน'], answer: 1 },
        { q: 'การ "ลักลอก" (Plagiarism) คือ?', options: ['การคัดลอกผลงานคนอื่นโดยไม่อ้างอิง', 'การเขียนเอง', 'การวิจัย', 'การสรุปข้อมูล'], answer: 0 },
      ]
    }
  },
  "m3-design": {
    1: {
      intro: 'เทคโนโลยีเปลี่ยนแปลงตลอดเวลา! เข้าใจสาเหตุและความสัมพันธ์กับศาสตร์อื่น เพื่อสร้างนวัตกรรมใหม่ 💡',
      videos: [yt('เทคโนโลยีและนวัตกรรม ม.3'), yt('ปัจจัยที่ส่งผลต่อการเปลี่ยนแปลงเทคโนโลยี'), yt('STEM Education ภาษาไทย')],
      fun: [
        { title: 'Google Patents', desc: 'สืบค้นสิทธิบัตรนวัตกรรม', url: 'https://patents.google.com/', emoji: '📜', noLogin: true },
        { title: 'WIPO', desc: 'องค์กรทรัพย์สินทางปัญญาโลก', url: 'https://www.wipo.int/', emoji: '🌐', noLogin: true },
        { title: 'NSTDA Innovation', desc: 'นวัตกรรมไทย (สวทช.)', url: 'https://www.nstda.or.th/', emoji: '🇹🇭', noLogin: true },
      ],
      articles: [scimathArticles.technologyDesign],
      quiz: [
        { q: 'นวัตกรรม (Innovation) แตกต่างจาก "การประดิษฐ์" อย่างไร?', options: ['เหมือนกัน', 'นวัตกรรมต้องนำไปใช้ได้จริง สร้างคุณค่า', 'นวัตกรรมต้องใหม่เท่านั้น', 'ไม่มีความต่าง'], answer: 1 },
        { q: 'ปัจจัยที่ส่งผลต่อการเปลี่ยนแปลงเทคโนโลยี?', options: ['ความต้องการของมนุษย์', 'ทรัพยากร/สิ่งแวดล้อม', 'เศรษฐกิจ/สังคม', 'ทุกข้อ'], answer: 3 },
        { q: 'เทคโนโลยีสัมพันธ์กับศาสตร์ใดบ้าง?', options: ['วิทยาศาสตร์', 'คณิตศาสตร์', 'ศิลปะ', 'ทุกข้อ (STEAM)'], answer: 3 },
        { q: 'ทรัพย์สินทางปัญญาคุ้มครองอะไร?', options: ['ผลงานสร้างสรรค์/สิ่งประดิษฐ์', 'ที่ดิน', 'รถยนต์', 'อาหาร'], answer: 0 },
        { q: 'ตัวอย่างทรัพย์สินทางปัญญาที่นักเรียนควรรู้?', options: ['ลิขสิทธิ์', 'สิทธิบัตร', 'เครื่องหมายการค้า', 'ทุกข้อ'], answer: 3 },
        { q: 'ก่อนนำผลงานคนอื่นมาใช้ ควร?', options: ['ใช้เลย', 'ขออนุญาต/อ้างอิงให้ถูกต้อง', 'แก้ไขชื่อผู้สร้าง', 'ปิดบัง'], answer: 1 },
      ]
    },
    2: {
      intro: 'นำเทคโนโลยีไปแก้ปัญหาในชุมชน! รู้จักงานอาชีพในท้องถิ่นและพัฒนาให้ดีขึ้นด้วยนวัตกรรม 🏘️',
      videos: [yt('การพัฒนาอาชีพในชุมชนด้วยเทคโนโลยี'), yt('นวัตกรรมชุมชนไทย')],
      fun: [
        { title: 'OTOP Innovation', desc: 'นวัตกรรมสินค้า OTOP', url: 'https://www.thaitambon.com/', emoji: '🛍️', noLogin: true },
        { title: 'Excalidraw', desc: 'วาดแผนผังโครงการชุมชน', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
        { title: 'Padlet', desc: 'รวมไอเดียพัฒนาชุมชน', url: 'https://padlet.com/', emoji: '📌', noLogin: true },
      ],
      quiz: [
        { q: 'การสำรวจปัญหาในชุมชนควรเริ่มจาก?', options: ['ออกแบบเลย', 'พูดคุยกับคนในชุมชน', 'หาทุน', 'ขายของ'], answer: 1 },
        { q: 'ตัวอย่างการใช้เทคโนโลยีพัฒนาอาชีพในชุมชน?', options: ['แอปขายสินค้า OTOP', 'ระบบรดน้ำอัตโนมัติในไร่', 'ระบบจัดการสต็อก', 'ทุกข้อ'], answer: 3 },
        { q: 'นวัตกรรมที่ดีต้องเป็นอย่างไร?', options: ['ราคาแพง', 'ใช้ง่าย ตอบโจทย์จริง คุ้มค่า', 'ใช้เทคโนโลยีล้ำสุด', 'ตามแฟชั่น'], answer: 1 },
        { q: 'เกษตรกร 4.0 หมายถึง?', options: ['ใช้เทคโนโลยีในการเกษตร (เซนเซอร์ IoT)', 'ทำเกษตรแบบเดิม', 'ใช้แรงงานอย่างเดียว', 'ไม่ใช้เทคโนโลยี'], answer: 0 },
        { q: 'การประเมินความสำเร็จของโครงการชุมชน?', options: ['วัดผลที่ผู้ใช้/ชุมชนจริง', 'นับจำนวนคนชม', 'นับยอดไลก์', 'ไม่ต้องประเมิน'], answer: 0 },
      ]
    },
    3: {
      intro: 'ลงมือสร้างชิ้นงาน! รู้จักวัสดุ อุปกรณ์ กลไก ไฟฟ้า อิเล็กทรอนิกส์ ที่จำเป็นในการทำนวัตกรรม 🔧',
      videos: [yt('วัสดุและอุปกรณ์ในการทำนวัตกรรม'), yt('Arduino IoT พื้นฐาน'), yt('ความปลอดภัยในการทำงานช่าง')],
      fun: [
        { title: 'Tinkercad Circuits', desc: 'จำลองวงจร Arduino', url: 'https://www.tinkercad.com/circuits', emoji: '🔌', noLogin: true },
        { title: 'Wokwi IoT', desc: 'จำลอง IoT บนเว็บ', url: 'https://wokwi.com/', emoji: '🤖', noLogin: true },
        { title: 'PhET Simulations', desc: 'จำลองฟิสิกส์/วงจร', url: 'https://phet.colorado.edu/th/', emoji: '⚡', noLogin: true },
      ],
      quiz: [
        { q: 'วัสดุประเภท Composite คือ?', options: ['ไม้อย่างเดียว', 'วัสดุผสม เช่น ไฟเบอร์กลาส คาร์บอนไฟเบอร์', 'โลหะอย่างเดียว', 'พลาสติกอย่างเดียว'], answer: 1 },
        { q: 'Microcontroller เช่น Arduino ใช้ทำอะไร?', options: ['ควบคุมอุปกรณ์/อ่านเซนเซอร์', 'แสดงผลภาพ', 'จัดเก็บข้อมูลขนาดใหญ่', 'รันเกม 3D'], answer: 0 },
        { q: 'เซนเซอร์อุณหภูมิยอดนิยมในงาน DIY?', options: ['DHT11/DHT22', 'OLED', 'Buzzer', 'LED'], answer: 0 },
        { q: 'ความปลอดภัยในงานไฟฟ้า — สิ่งสำคัญ?', options: ['ตัดไฟก่อนทำงาน', 'ใส่อุปกรณ์ป้องกัน', 'ตรวจสอบสายไฟ', 'ทุกข้อ'], answer: 3 },
        { q: 'การประสานงาน (Soldering) ต้องระวังอะไร?', options: ['ความร้อน 300+ องศา', 'ไอควัน', 'ตะกั่วบัดกรี', 'ทุกข้อ'], answer: 3 },
      ]
    },
    4: {
      intro: 'แก้ปัญหาในชุมชนด้วยกระบวนการออกแบบเชิงวิศวกรรมแบบครบวงจร — ตั้งแต่ระบุปัญหาจนนำเสนอผลงาน! 🎯',
      videos: [yt('Design Thinking ในโรงเรียน'), yt('โครงงานวิทยาศาสตร์ระดับประเทศ')],
      fun: [
        { title: 'Excalidraw', desc: 'วาดผังโครงงาน', url: 'https://excalidraw.com/', emoji: '✏️', noLogin: true },
        { title: 'Tinkercad', desc: 'สร้างต้นแบบ 3D', url: 'https://www.tinkercad.com/', emoji: '🏗️', noLogin: true },
        { title: 'Diagrams.net', desc: 'วาด Flowchart โครงงาน', url: 'https://app.diagrams.net/', emoji: '📊', noLogin: true },
        { title: 'NSTDA Schools', desc: 'โครงการนวัตกรรมโรงเรียน', url: 'https://www.nstda.or.th/', emoji: '🎓', noLogin: true },
      ],
      quiz: [
        { q: 'ขั้นตอนแรกในการแก้ปัญหาชุมชน?', options: ['เริ่มลงมือสร้างเลย', 'ศึกษาและระบุปัญหาที่แท้จริง', 'หาทุน', 'นำเสนอ'], answer: 1 },
        { q: 'การรวบรวมข้อมูลปัญหาชุมชนทำได้อย่างไร?', options: ['สำรวจ/สัมภาษณ์', 'แบบสอบถาม', 'ศึกษาเอกสาร', 'ทุกข้อ'], answer: 3 },
        { q: 'ต้นแบบ (Prototype) ที่ดีควรเป็น?', options: ['สมบูรณ์แบบครั้งแรก', 'ทดสอบไอเดียได้ ปรับปรุงได้ง่าย', 'ใช้วัสดุแพง', 'เสร็จเรียบร้อย'], answer: 1 },
        { q: 'การทดสอบกับผู้ใช้จริงสำคัญอย่างไร?', options: ['ได้ feedback ที่ตรงจุด', 'พบจุดบกพร่องที่ไม่คาดคิด', 'ปรับปรุงให้เหมาะสม', 'ทุกข้อ'], answer: 3 },
        { q: 'การนำเสนอผลงานควรมีอะไร?', options: ['ที่มา/ปัญหา', 'แนวทางแก้ไข', 'ผลการทดสอบ', 'ทุกข้อ'], answer: 3 },
        { q: 'ตัวชี้วัดความสำเร็จของโครงงาน?', options: ['แก้ปัญหาได้จริง', 'ผู้ใช้พึงพอใจ', 'นำไปต่อยอดได้', 'ทุกข้อ'], answer: 3 },
      ]
    }
  },

  // ==================== AI Courses ====================

  'ai-p1-3': {
    1: {
      intro: 'มาทำความรู้จักกับ AI เพื่อนใหม่ของเรา! AI คืออะไร อยู่ตรงไหนบ้างรอบตัว และต่างจากมนุษย์ยังไง มาเรียนรู้แบบสนุกๆ กัน! 🤖',
      videos: [
        yt('AI คืออะไร สอนเด็ก อธิบายง่ายๆ'),
        yt('ปัญญาประดิษฐ์รอบตัวเรา สำหรับเด็ก'),
        yt('AI vs มนุษย์ ต่างกันยังไง'),
      ],
      fun: [
        { title: 'Quick, Draw!', desc: 'วาดรูปแข่งกับ AI ดูว่า AI จะทายได้ไหม!', url: 'https://quickdraw.withgoogle.com/', emoji: '🎨', noLogin: true },
        { title: 'AI for Oceans', desc: 'สอน AI คัดแยกขยะในทะเล จาก Code.org', url: 'https://code.org/oceans', emoji: '🌊', noLogin: true },
        { title: 'Emoji Scavenger Hunt', desc: 'ใช้กล้องหา Emoji ในชีวิตจริง!', url: 'https://emojiscavengerhunt.withgoogle.com/', emoji: '📱', noLogin: true },
      ],
      quiz: [
        { q: 'AI ย่อมาจากอะไร?', options: ['Automatic Internet', 'Artificial Intelligence', 'Amazing Invention', 'Android Intelligence'], answer: 1, explain: 'AI ย่อมาจาก Artificial Intelligence แปลว่า ปัญญาประดิษฐ์' },
        { q: 'ข้อใดเป็น AI ที่อยู่รอบตัวเรา?', options: ['พัดลม', 'ผู้ช่วยเสียง Siri', 'ดินสอ', 'จักรยาน'], answer: 1, explain: 'Siri เป็น AI ผู้ช่วยเสียงที่เข้าใจคำพูดของเรา' },
        { q: 'AI เก่งกว่ามนุษย์เรื่องอะไร?', options: ['ความคิดสร้างสรรค์', 'อารมณ์ความรู้สึก', 'คำนวณเร็วและจำข้อมูลเยอะ', 'วาดรูปด้วยมือ'], answer: 2 },
        { q: 'AI ช่วยมนุษย์หรือแทนที่มนุษย์?', options: ['แทนที่มนุษย์', 'ช่วยมนุษย์', 'ไม่เกี่ยวกัน', 'ทำลายมนุษย์'], answer: 1 },
        { q: 'ข้อใดไม่ใช่ AI?', options: ['กล้องจำหน้า', 'เครื่องคิดเลขธรรมดา', 'รถขับเอง', 'แอปแปลภาษา'], answer: 1, explain: 'เครื่องคิดเลขธรรมดาทำตามสูตรตายตัว ไม่ได้เรียนรู้เอง' },
      ]
    },
    2: {
      intro: 'AI เรียนรู้ได้ยังไง? มาลองสอน AI ด้วยตัวเองผ่าน Teachable Machine กัน! สนุกมากเลย 🧠',
      videos: [
        yt('Machine Learning สำหรับเด็ก อธิบายง่ายๆ'),
        yt('สอน AI จำรูปภาพ Teachable Machine'),
        yt('AI เรียนรู้จากข้อมูลอย่างไร'),
      ],
      fun: [
        { title: 'Teachable Machine', desc: 'สอน AI จำภาพ เสียง หรือท่าทางของเราเอง!', url: 'https://teachablemachine.withgoogle.com/', emoji: '🤖', noLogin: true },
        { title: 'AutoDraw', desc: 'วาดรูปแล้ว AI ช่วยเดาว่าวาดอะไร', url: 'https://www.autodraw.com/', emoji: '✏️', noLogin: true },
        { title: 'Rock Paper Scissors', desc: 'เล่นเป่ายิ้งฉุบกับ AI!', url: 'https://tenso.rs/demos/rock-paper-scissors/', emoji: '✊', noLogin: true },
      ],
      quiz: [
        { q: 'AI เรียนรู้จากอะไร?', options: ['จากครู', 'จากข้อมูล', 'จากหนังสือ', 'จากอากาศ'], answer: 1, explain: 'AI เรียนรู้จากข้อมูลที่เราให้ ยิ่งข้อมูลเยอะยิ่งเก่ง' },
        { q: 'ถ้าจะสอน AI จำแมว ต้องทำอย่างไร?', options: ['บอก AI ว่าแมวคืออะไร', 'ให้รูปแมวหลายๆ รูป', 'วาดรูปแมวให้ AI ดู', 'อ่านหนังสือเรื่องแมวให้ฟัง'], answer: 1 },
        { q: 'Teachable Machine ใช้ทำอะไร?', options: ['เล่นเกม', 'สอน AI จำรูปภาพ เสียง ท่าทาง', 'ดูหนัง', 'ส่งข้อความ'], answer: 1 },
        { q: 'ยิ่งให้ข้อมูล AI มากขึ้น จะเกิดอะไร?', options: ['AI พัง', 'AI เก่งขึ้น', 'ไม่มีอะไรเปลี่ยน', 'AI ช้าลง'], answer: 1 },
        { q: 'ข้อใดคือวิธีสอน AI ที่ถูกต้อง?', options: ['ให้ตัวอย่างข้อมูลแล้วให้ AI หาแพทเทิร์น', 'เขียนคำตอบทุกอย่างลงไป', 'บอก AI ด้วยเสียง', 'ไม่ต้องสอน AI เก่งเอง'], answer: 0 },
      ]
    },
    3: {
      intro: 'AI อยู่รอบตัวเราทุกวัน! มาดูว่า AI ช่วยอะไรได้บ้าง และต้องระวังอะไรเมื่อใช้ AI 🌍',
      videos: [
        yt('AI ช่วยหมอรักษาโรค'),
        yt('AI ในชีวิตประจำวัน สำหรับเด็ก'),
        yt('ข้อควรระวังในการใช้ AI เด็ก'),
      ],
      fun: [
        { title: 'Semantris', desc: 'เล่นเกมคำศัพท์กับ AI ของ Google', url: 'https://research.google.com/semantris/', emoji: '📝', noLogin: true },
        { title: 'Thing Translator', desc: 'ถ่ายรูปแล้ว AI บอกชื่อเป็นภาษาต่างๆ', url: 'https://thing-translator.appspot.com/', emoji: '🌐', noLogin: true },
        { title: 'AI Duet', desc: 'เล่นเปียโนคู่กับ AI!', url: 'https://experiments.withgoogle.com/ai/ai-duet/view/', emoji: '🎹', noLogin: true },
      ],
      quiz: [
        { q: 'AI ช่วยหมอทำอะไรได้?', options: ['ผ่าตัดแทนหมอ', 'ช่วยวินิจฉัยโรคจากภาพ', 'เขียนใบสั่งยา', 'ไม่มีข้อถูก'], answer: 1 },
        { q: 'ข้อใดควรระวังเมื่อใช้ AI?', options: ['ไม่บอกข้อมูลส่วนตัว', 'ตรวจสอบคำตอบ AI เสมอ', 'ใช้ AI เป็นผู้ช่วย', 'ถูกทุกข้อ'], answer: 3 },
        { q: 'AI ตอบผิดได้ไหม?', options: ['ไม่ได้เลย', 'ได้ ต้องตรวจสอบเสมอ', 'ผิดเฉพาะเรื่องคณิต', 'ผิดเฉพาะเรื่องภาษา'], answer: 1 },
        { q: 'ในอนาคต AI จะช่วยอะไรได้?', options: ['รถขับเอง', 'รักษาสิ่งแวดล้อม', 'ช่วยผ่าตัด', 'ทุกข้อ'], answer: 3 },
        { q: 'ทำไมต้องตรวจสอบข้อมูลจาก AI?', options: ['เพราะ AI ฉลาดเสมอ', 'เพราะ AI อาจตอบผิดได้', 'ไม่จำเป็นต้องตรวจ', 'เพราะ AI ช้า'], answer: 1 },
      ]
    }
  },

  'ai-p4-6': {
    1: {
      intro: 'Machine Learning คืออะไร? มาเรียนรู้ว่า AI เรียนรู้จากข้อมูลได้อย่างไร พร้อมตัวอย่างในชีวิตจริงที่น่าตื่นเต้น! 📊',
      videos: [
        yt('Machine Learning คืออะไร อธิบายง่ายๆ'),
        yt('Supervised vs Unsupervised Learning ภาษาไทย'),
        yt('AI กรองอีเมลขยะทำงานยังไง'),
      ],
      fun: [
        { title: 'Teachable Machine', desc: 'สร้างโมเดล ML จำแนกรูปภาพด้วยตัวเอง', url: 'https://teachablemachine.withgoogle.com/', emoji: '🧠', noLogin: true },
        { title: 'Quick, Draw!', desc: 'วาดรูป 20 วินาที ให้ AI ทาย — เห็น ML ทำงานจริง!', url: 'https://quickdraw.withgoogle.com/', emoji: '🎨', noLogin: true },
        { title: 'AI for Oceans', desc: 'ฝึก ML คัดแยกสิ่งมีชีวิตในทะเล', url: 'https://code.org/oceans', emoji: '🐠', noLogin: true },
      ],
      quiz: [
        { q: 'ML ย่อมาจากอะไร?', options: ['Main Logic', 'Machine Learning', 'Modern Language', 'Mega Link'], answer: 1 },
        { q: 'Supervised Learning คืออะไร?', options: ['AI เรียนรู้เอง', 'สอนด้วยตัวอย่างที่มีคำตอบ', 'ลองผิดลองถูก', 'จำทุกอย่าง'], answer: 1, explain: 'Supervised Learning ใช้ข้อมูลที่มี label (คำตอบ) สอน AI' },
        { q: 'ข้อใดเป็นตัวอย่าง ML ในชีวิตจริง?', options: ['เครื่องคิดเลข', 'แนะนำหนังที่ชอบ', 'นาฬิกาปลุก', 'พัดลม'], answer: 1 },
        { q: 'Reinforcement Learning เรียนรู้แบบไหน?', options: ['ท่องจำ', 'ลองผิดลองถูก', 'อ่านหนังสือ', 'ดูวิดีโอ'], answer: 1 },
        { q: 'ทำไม ML ถึงต้องการข้อมูลมาก?', options: ['เพราะ AI ชอบข้อมูล', 'ยิ่งมีข้อมูลยิ่งหาแพทเทิร์นได้ดี', 'เพื่อใช้พื้นที่', 'ไม่จำเป็น'], answer: 1 },
      ]
    },
    2: {
      intro: 'ลองสร้างโมเดล AI ด้วยตัวเอง! เรียนรู้ขั้นตอนเก็บข้อมูล ฝึกสอน ทดสอบ และปรับปรุง พร้อมเข้าใจว่าทำไมข้อมูลถึงสำคัญที่สุด 🔬',
      videos: [
        yt('สร้างโมเดล AI Teachable Machine สอนมือใหม่'),
        yt('ข้อมูลสำคัญกับ AI อย่างไร'),
        yt('AI Bias คืออะไร อคติ AI'),
      ],
      fun: [
        { title: 'Teachable Machine', desc: 'สร้างโมเดลจำแนกรูปภาพ/เสียง/ท่าทาง', url: 'https://teachablemachine.withgoogle.com/', emoji: '🤖', noLogin: true },
        { title: 'Machine Learning for Kids', desc: 'สร้างโปรเจกต์ ML สนุกๆ สำหรับเด็ก', url: 'https://machinelearningforkids.co.uk/scratch3/', emoji: '🧒', noLogin: true },
        { title: 'AutoDraw', desc: 'วาดรูปแล้ว AI เดาให้ — เห็นการจำแนกทำงาน', url: 'https://www.autodraw.com/', emoji: '✏️', noLogin: true },
      ],
      quiz: [
        { q: 'ขั้นตอนแรกของการสร้างโมเดล AI คือ?', options: ['ทดสอบ', 'ฝึกสอน', 'เก็บข้อมูล', 'ปรับปรุง'], answer: 2 },
        { q: 'ถ้าข้อมูลน้อยเกินไปจะเกิดอะไร?', options: ['AI เก่งมาก', 'AI ทายผิดบ่อย', 'ไม่มีผล', 'AI เร็วขึ้น'], answer: 1 },
        { q: 'AI Bias คืออะไร?', options: ['AI ทำงานเร็ว', 'AI มีอคติจากข้อมูลที่ไม่หลากหลาย', 'AI ฉลาดมาก', 'AI พัง'], answer: 1 },
        { q: 'ข้อมูลที่ดีสำหรับสอน AI ควรเป็นอย่างไร?', options: ['มีแค่ประเภทเดียว', 'หลากหลายและครอบคลุม', 'น้อยที่สุด', 'เฉพาะภาษาอังกฤษ'], answer: 1 },
        { q: 'หลังฝึกสอนโมเดลแล้ว ต้องทำอะไร?', options: ['จบเลย', 'ทดสอบและปรับปรุง', 'ลบข้อมูล', 'เริ่มใหม่'], answer: 1 },
      ]
    },
    3: {
      intro: 'Generative AI สร้างผลงานใหม่ได้! มาลองใช้ AI วาดรูป เขียนเรื่อง และเรียนรู้ Prompt Engineering 🎨✨',
      videos: [
        yt('Generative AI คืออะไร อธิบายง่ายๆ'),
        yt('Prompt Engineering เขียนคำสั่ง AI ยังไงให้ดี'),
        yt('AutoDraw วาดรูปด้วย AI'),
      ],
      fun: [
        { title: 'AutoDraw', desc: 'วาดรูปแล้ว AI ช่วยเปลี่ยนเป็นภาพสวยๆ', url: 'https://www.autodraw.com/', emoji: '🎨', noLogin: true },
        { title: 'AI Duet', desc: 'เล่นเปียโนแล้ว AI แต่งเพลงต่อให้', url: 'https://experiments.withgoogle.com/ai/ai-duet/view/', emoji: '🎵', noLogin: true },
        { title: 'Talk to Books', desc: 'ถามคำถาม AI ค้นคำตอบจากหนังสือจริง', url: 'https://books.google.com/talktobooks/', emoji: '📚', noLogin: true },
      ],
      quiz: [
        { q: 'Generative AI ทำอะไรได้?', options: ['สร้างผลงานใหม่ เช่น รูป เรื่อง เพลง', 'คำนวณเลข', 'เปิดปิดไฟ', 'ถ่ายรูป'], answer: 0 },
        { q: 'Prompt ที่ดีควรเป็นอย่างไร?', options: ['สั้นมากๆ', 'ชัดเจน มีรายละเอียด บอกเป้าหมาย', 'ใช้ภาษาอังกฤษเท่านั้น', 'เขียนยาวๆ ไม่ต้องชัดเจน'], answer: 1 },
        { q: 'AutoDraw เป็น AI ประเภทไหน?', options: ['Chatbot', 'Generative AI ที่ช่วยวาดรูป', 'หุ่นยนต์', 'เกม'], answer: 1 },
        { q: 'ข้อใดเป็น Prompt ที่ไม่ดี?', options: ['เขียนเรียงความ 300 คำ เรื่อง AI', 'เขียนอะไรก็ได้', 'วาดรูปแมวสีส้มนั่งบนเก้าอี้', 'แปลประโยคนี้เป็นอังกฤษ'], answer: 1 },
        { q: 'เมื่อใช้ AI ช่วยทำงาน ควรทำอย่างไร?', options: ['บอกว่าทำเองทั้งหมด', 'บอกที่มาว่าใช้ AI ช่วย', 'ไม่ต้องบอกใคร', 'ลบร่องรอยการใช้'], answer: 1 },
      ]
    },
    4: {
      intro: 'AI เก่งมาก แต่ต้องใช้อย่างรับผิดชอบ! มาเรียนรู้เรื่อง AI Bias, Deepfake, Privacy และแนวทางใช้ AI อย่างถูกต้อง ⚖️',
      videos: [
        yt('จริยธรรม AI สำหรับเด็ก'),
        yt('Deepfake คืออะไร อันตรายยังไง'),
        yt('AI Bias อคติ AI คืออะไร'),
      ],
      fun: [
        { title: 'Moral Machine', desc: 'ทดลองตัดสินใจทางจริยธรรมให้รถไร้คนขับ', url: 'https://www.moralmachine.net/', emoji: '🚗', noLogin: true },
        { title: 'Survival of the Best Fit', desc: 'เกมจำลอง AI Bias ในการรับสมัครงาน', url: 'https://www.survivalofthebestfit.com/', emoji: '⚖️', noLogin: true },
        { title: 'AI for Oceans', desc: 'เรียนรู้ผลกระทบของข้อมูลต่อ AI', url: 'https://code.org/oceans', emoji: '🌊', noLogin: true },
      ],
      quiz: [
        { q: 'AI Bias เกิดจากอะไร?', options: ['AI เจตนาเลือกปฏิบัติ', 'ข้อมูลที่ใช้สอนไม่หลากหลาย', 'AI ฉลาดเกินไป', 'ไม่มี Bias ใน AI'], answer: 1 },
        { q: 'Deepfake คืออะไร?', options: ['รูปถ่ายจริง', 'วิดีโอ/ภาพปลอมที่ AI สร้างขึ้น', 'เกมคอมพิวเตอร์', 'แอปถ่ายรูป'], answer: 1 },
        { q: 'AI Hallucination คืออะไร?', options: ['AI ฝันเหมือนมนุษย์', 'AI ตอบผิดอย่างมั่นใจ', 'AI หลับ', 'AI ไม่ตอบ'], answer: 1 },
        { q: 'ข้อใดเป็นการใช้ AI อย่างถูกต้อง?', options: ['คัดลอกงาน AI ส่งครูโดยไม่บอก', 'ตรวจสอบข้อมูลและบอกที่มา', 'ส่งข้อมูลส่วนตัวให้ AI', 'เชื่อ AI ทุกอย่าง'], answer: 1 },
        { q: 'ทำไมต้องมีจริยธรรม AI?', options: ['เพราะ AI อันตรายเสมอ', 'เพื่อให้ AI ถูกใช้อย่างเป็นธรรมและรับผิดชอบ', 'ไม่จำเป็น', 'เพราะกฎหมายบังคับเท่านั้น'], answer: 1 },
      ]
    }
  },

  'ai-m1-3': {
    1: {
      intro: 'ทำความเข้าใจรากฐาน AI ตั้งแต่ Turing Test จนถึง Deep Learning เรียนรู้สถาปัตยกรรม Neural Network และวิวัฒนาการที่เปลี่ยนโลก 🏗️',
      videos: [
        yt('ประวัติ AI จาก Turing ถึง ChatGPT'),
        yt('Neural Network คืออะไร อธิบายง่าย'),
        yt('Deep Learning vs Machine Learning ต่างกันอย่างไร'),
      ],
      fun: [
        { title: 'Neural Network Playground', desc: 'ทดลองสร้าง Neural Network แบบ interactive', url: 'https://playground.tensorflow.org/', emoji: '🧠', noLogin: true },
        { title: 'Elements of AI', desc: 'คอร์ส AI ฟรีจากมหาวิทยาลัยเฮลซิงกิ', url: 'https://www.elementsofai.com/', emoji: '📘', noLogin: true },
        { title: 'Teachable Machine', desc: 'สร้างโมเดล ML ง่ายๆ เห็น Neural Network ทำงาน', url: 'https://teachablemachine.withgoogle.com/', emoji: '🤖', noLogin: true },
      ],
      quiz: [
        { q: 'ใครเสนอ Turing Test?', options: ['Elon Musk', 'Alan Turing', 'Steve Jobs', 'Mark Zuckerberg'], answer: 1 },
        { q: 'AlphaGo ชนะมนุษย์ในเกมอะไร?', options: ['หมากรุก', 'โกะ', 'PokerStars', 'Tetris'], answer: 1 },
        { q: 'Neural Network เลียนแบบอะไร?', options: ['คอมพิวเตอร์', 'สมองมนุษย์', 'อินเทอร์เน็ต', 'โทรศัพท์'], answer: 1 },
        { q: 'Deep Learning ต่างจาก ML อย่างไร?', options: ['ไม่ต่างกัน', 'ใช้ Neural Network หลายชั้น', 'ไม่ต้องใช้ข้อมูล', 'ทำงานช้ากว่า'], answer: 1 },
        { q: 'ChatGPT เปิดตัวปีอะไร?', options: ['2020', '2021', '2022', '2023'], answer: 2 },
      ]
    },
    2: {
      intro: 'เจาะลึก Computer Vision และ NLP — สองสาขาหลักของ AI ที่ทำให้คอมพิวเตอร์มองเห็นและเข้าใจภาษามนุษย์ 👁️💬',
      videos: [
        yt('Computer Vision คืออะไร ภาษาไทย'),
        yt('NLP Natural Language Processing อธิบายง่าย'),
        yt('Face Recognition ทำงานยังไง'),
      ],
      fun: [
        { title: 'Teachable Machine', desc: 'สร้างโมเดล Image Classification ง่ายๆ', url: 'https://teachablemachine.withgoogle.com/', emoji: '📷', noLogin: true },
        { title: 'Quick, Draw!', desc: 'ดู AI จำแนกรูปวาดแบบ real-time', url: 'https://quickdraw.withgoogle.com/', emoji: '🎨', noLogin: true },
        { title: 'Semantris', desc: 'เกม NLP — AI เข้าใจความหมายคำศัพท์', url: 'https://research.google.com/semantris/', emoji: '📝', noLogin: true },
      ],
      quiz: [
        { q: 'Computer Vision ทำอะไรได้?', options: ['แปลภาษา', 'จำแนกรูปภาพ/ตรวจจับวัตถุ', 'แต่งเพลง', 'พิมพ์เอกสาร'], answer: 1 },
        { q: 'NLP ย่อมาจากอะไร?', options: ['Network Logic Program', 'Natural Language Processing', 'New Learning Platform', 'Neural Link Protocol'], answer: 1 },
        { q: 'ข้อใดเป็นงานของ NLP?', options: ['จำหน้าคน', 'แปลภาษาอัตโนมัติ', 'วาดรูป', 'ขับรถ'], answer: 1 },
        { q: 'Face Recognition ใช้ AI สาขาไหน?', options: ['NLP', 'Computer Vision', 'Robotics', 'Data Science'], answer: 1 },
        { q: 'Speech Recognition แปลงอะไรเป็นอะไร?', options: ['ข้อความเป็นเสียง', 'เสียงเป็นข้อความ', 'รูปเป็นข้อความ', 'เสียงเป็นรูป'], answer: 1 },
      ]
    },
    3: {
      intro: 'เรียนรู้ศิลปะการสื่อสารกับ AI — Prompt Engineering เทคนิค Zero-shot, Few-shot, Chain-of-Thought และ Role-playing 🎯',
      videos: [
        yt('Prompt Engineering เทคนิคเขียน Prompt ภาษาไทย'),
        yt('Zero-shot vs Few-shot prompting อธิบาย'),
        yt('Chain of Thought prompting คืออะไร'),
      ],
      fun: [
        { title: 'ChatGPT (Free)', desc: 'ฝึกเขียน Prompt กับ ChatGPT', url: 'https://chat.openai.com/', emoji: '💬', noLogin: true },
        { title: 'Claude.ai', desc: 'ฝึก Prompt กับ Claude AI', url: 'https://claude.ai/', emoji: '🤖', noLogin: true },
        { title: 'Learn Prompting', desc: 'คอร์ส Prompt Engineering ฟรี', url: 'https://learnprompting.org/', emoji: '📖', noLogin: true },
      ],
      quiz: [
        { q: 'Prompt คืออะไร?', options: ['ชื่อ AI', 'คำสั่งหรือคำถามที่ส่งให้ AI', 'โปรแกรม', 'ภาษาเขียนโค้ด'], answer: 1 },
        { q: 'Zero-shot Prompting คืออะไร?', options: ['ถามโดยไม่ให้ตัวอย่าง', 'ให้ตัวอย่างหลายข้อ', 'ให้ AI คิดทีละขั้น', 'กำหนดบทบาท'], answer: 0 },
        { q: 'Few-shot Prompting ทำอย่างไร?', options: ['ถามตรงๆ', 'ให้ตัวอย่าง 2-3 ข้อก่อนถามคำถามจริง', 'สั่งให้คิดทีละขั้น', 'ไม่ให้ข้อมูลเลย'], answer: 1 },
        { q: 'Chain-of-Thought ช่วยอะไร?', options: ['ทำให้ AI ตอบสั้น', 'ให้ AI แสดงขั้นตอนการคิด', 'ทำให้ AI วาดรูป', 'ไม่ช่วยอะไร'], answer: 1 },
        { q: 'Prompt ที่ดีควรมีอะไร?', options: ['สั้นที่สุด', 'ความชัดเจน บริบท และเป้าหมาย', 'ภาษาอังกฤษเท่านั้น', 'ไม่ต้องมีรายละเอียด'], answer: 1 },
      ]
    },
    4: {
      intro: 'สำรวจประเด็นจริยธรรม AI ระดับสากล — PDPA, UNESCO AI Ethics, AI Bias, Deepfake และความรับผิดชอบของนักพัฒนา ⚖️',
      videos: [
        yt('PDPA พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล อธิบายง่าย'),
        yt('AI Ethics จริยธรรมปัญญาประดิษฐ์'),
        yt('Deepfake อันตราย วิธีสังเกต'),
      ],
      fun: [
        { title: 'Moral Machine', desc: 'ทดลองตัดสินใจจริยธรรมรถไร้คนขับ', url: 'https://www.moralmachine.net/', emoji: '🚗', noLogin: true },
        { title: 'Survival of the Best Fit', desc: 'เกมจำลอง AI Bias ในกระบวนการรับสมัครงาน', url: 'https://www.survivalofthebestfit.com/', emoji: '⚖️', noLogin: true },
        { title: 'Data Detox Kit', desc: 'เรียนรู้วิธีปกป้องข้อมูลส่วนตัวออนไลน์', url: 'https://datadetoxkit.org/', emoji: '🔒', noLogin: true },
      ],
      quiz: [
        { q: 'PDPA คืออะไร?', options: ['กฎหมายลิขสิทธิ์', 'พ.ร.บ.คุ้มครองข้อมูลส่วนบุคคล', 'มาตรฐาน AI', 'ภาษาโปรแกรม'], answer: 1 },
        { q: 'AI Bias แก้ไขได้อย่างไร?', options: ['ปิด AI', 'ใช้ข้อมูลที่หลากหลายและตรวจสอบผลลัพธ์', 'ไม่ต้องแก้', 'เขียนโค้ดใหม่'], answer: 1 },
        { q: 'Transparency ในจริยธรรม AI หมายถึง?', options: ['AI มองทะลุ', 'โปร่งใส อธิบายการทำงานได้', 'AI ไม่มีสี', 'ซ่อนข้อมูล'], answer: 1 },
        { q: 'ใครควรรับผิดชอบเมื่อ AI ทำผิดพลาด?', options: ['AI เอง', 'ไม่มีใคร', 'ผู้พัฒนาและผู้ใช้งาน', 'รัฐบาลเท่านั้น'], answer: 2 },
        { q: 'Fairness ใน AI หมายถึง?', options: ['AI ทำงานเร็ว', 'ไม่เลือกปฏิบัติ ปฏิบัติอย่างเป็นธรรม', 'AI ฟรี', 'AI สวยงาม'], answer: 1 },
      ]
    },
    5: {
      intro: 'ถึงเวลาลงมือทำโปรเจกต์ AI จริงๆ! ตั้งแต่ระบุปัญหา รวบรวมข้อมูล สร้างโมเดล ทดสอบ จนถึงนำเสนอ 🚀',
      videos: [
        yt('ทำโปรเจกต์ AI เริ่มต้นยังไง'),
        yt('สร้างโมเดลจำแนกรูปภาพ Teachable Machine'),
        yt('นำเสนอโครงงาน AI อย่างมืออาชีพ'),
      ],
      fun: [
        { title: 'Teachable Machine', desc: 'สร้างโมเดลจำแนกรูป/เสียง/ท่าทาง สำหรับโปรเจกต์', url: 'https://teachablemachine.withgoogle.com/', emoji: '🤖', noLogin: true },
        { title: 'Hugging Face Spaces', desc: 'ลองเล่น AI Demo หลากหลายโมเดล', url: 'https://huggingface.co/spaces', emoji: '🤗', noLogin: true },
        { title: 'Excalidraw', desc: 'วาด diagram ออกแบบโปรเจกต์ไม่ต้องล็อกอิน', url: 'https://excalidraw.com/', emoji: '📐', noLogin: true },
      ],
      quiz: [
        { q: 'ขั้นตอนแรกของโปรเจกต์ AI คือ?', options: ['สร้างโมเดลเลย', 'ระบุปัญหาที่ต้องการแก้', 'นำเสนอ', 'เก็บข้อมูล'], answer: 1 },
        { q: 'Data Collection สำคัญอย่างไร?', options: ['ไม่สำคัญ', 'เป็นรากฐานของโมเดล AI ที่ดี', 'แค่ทำให้เสร็จ', 'ยิ่งน้อยยิ่งดี'], answer: 1 },
        { q: 'ข้อใดเป็นไอเดียโปรเจกต์ AI ที่ดี?', options: ['สร้าง AI ครองโลก', 'จำแนกพันธุ์พืชจากรูปใบ', 'ทำ AI ที่ทำทุกอย่าง', 'ไม่มีข้อถูก'], answer: 1 },
        { q: 'การทดสอบโมเดลใช้ข้อมูลแบบไหน?', options: ['ข้อมูลเดียวกับที่ฝึก', 'ข้อมูลใหม่ที่ไม่เคยเห็น', 'ไม่ต้องทดสอบ', 'ข้อมูลเก่าเท่านั้น'], answer: 1 },
        { q: 'การนำเสนอโปรเจกต์ AI ควรมีอะไร?', options: ['แค่ผลลัพธ์', 'ปัญหา วิธีการ ผลลัพธ์ และบทเรียน', 'แค่โค้ด', 'แค่ชื่อโปรเจกต์'], answer: 1 },
      ]
    }
  },

  'arduino-basic': {
    1: {
      intro: 'เริ่มจากภาพใหญ่ของ Arduino: บอร์ดเล็ก ๆ ที่รับข้อมูลจากโลกจริง ประมวลผลด้วยโปรแกรม แล้วสั่งไฟ เสียง มอเตอร์ หรือจอแสดงผลให้ทำงานได้',
      videos: [yt('Arduino คืออะไร ไมโครคอนโทรลเลอร์ เบื้องต้น'), yt('Arduino UNO R3 ส่วนประกอบของบอร์ด')],
      files: [
        { title: '[Arduino #1] แนะนำตัวก่อนนะ', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/86-arduino-1', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'บทนำ Arduino และเหตุผลที่เหมาะกับการสร้างชิ้นงานต้นแบบ' },
        { title: '[เอกสาร #5] เรียนรู้และลองเล่น Arduino เบื้องต้น', url: 'https://praphas.com/index.php/51-knowhow/arduino', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'เอกสารฉบับปรับปรุง มีใบงาน Arduino จำนวนมากสำหรับต่อยอดการทดลอง' },
      ],
      articles: [
        { title: 'Arduino: บทเรียนจากครูประภาส', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/', source: 'praphas.com', desc: 'หน้ารวมบทความ Arduino สำหรับใช้เป็นแหล่งอ้างอิงของคอร์ส' },
      ],
      lessonNotes: {
        objectives: ['อธิบายได้ว่า Arduino ใช้สร้างงานอิเล็กทรอนิกส์โต้ตอบกับโลกจริงได้อย่างไร', 'ระบุอุปกรณ์พื้นฐานที่ใช้เริ่มทดลอง Arduino ได้'],
        summary: ['Arduino เป็นแพลตฟอร์มต้นแบบแบบเปิดที่ใช้งานง่าย เหมาะกับผู้เริ่มต้น นักออกแบบ และผู้สนใจสร้างชิ้นงานโต้ตอบกับอุปกรณ์ภายนอก', 'งาน Arduino ต้องมองทั้งฮาร์ดแวร์ วงจร และซอฟต์แวร์ที่สั่งงานบอร์ด'],
        activities: ['ให้ผู้เรียนสำรวจอุปกรณ์จริงหรือภาพบอร์ด แล้วติดป้ายชื่อ USB, power, digital pins, analog pins และ GND', 'จับคู่ตัวอย่างชีวิตจริงกับแนวคิด input-process-output เช่น ปุ่มกด ไมโครคอนโทรลเลอร์ และ LED'],
        checkQuestions: ['ไมโครคอนโทรลเลอร์ต่างจากคอมพิวเตอร์ทั่วไปอย่างไร', 'Arduino รับข้อมูลจากอะไรและสั่งงานอะไรได้บ้าง'],
        vocabulary: ['Microcontroller: ชิปควบคุมขนาดเล็กที่รับข้อมูลและสั่งงานอุปกรณ์', 'Open-source: เปิดให้ศึกษา ปรับใช้ และพัฒนาต่อยอดได้'],
      },
      quiz: [
        { q: 'Arduino เหมาะกับงานประเภทใดมากที่สุด?', options: ['สร้างเอกสาร', 'สร้างวงจรโต้ตอบกับอุปกรณ์ภายนอก', 'ตัดต่อภาพเท่านั้น', 'ดูวิดีโอออนไลน์'], answer: 1 },
        { q: 'ส่วนใดทำหน้าที่เหมือนสมองของบอร์ด?', options: ['USB cable', 'ไมโครคอนโทรลเลอร์', 'LED', 'Breadboard'], answer: 1 },
        { q: 'ข้อใดคือ input ของระบบ Arduino?', options: ['LED', 'มอเตอร์', 'ปุ่มกดหรือเซนเซอร์', 'จอภาพที่แสดงผล'], answer: 2 },
      ],
    },
    2: {
      intro: 'ก่อนทำวงจรสนุก ๆ ต้องตั้งค่าเครื่องมือให้ถูก: ติดตั้ง Arduino IDE เลือกบอร์ด เลือกพอร์ต แล้วทดลองอัปโหลด Blink',
      videos: [yt('ติดตั้ง Arduino IDE เลือกบอร์ด เลือกพอร์ต'), yt('Arduino Blink อัปโหลดโปรแกรมแรก')],
      files: [
        { title: '[Arduino #2] เครื่องมือเขียนโปรแกรม Arduino IDE', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/87-arduino-2-sketch', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'แนะนำเครื่องมือเขียนโปรแกรมและการดาวน์โหลด Arduino IDE' },
        { title: '[Arduino #5] เริ่มต้น Arduino UNO R3 และ Blink', url: 'https://praphas.com/index.php/2008-11-03-14-25-25/51-arduino/90-arduino-5-1-uno-r3.PROTEUS', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'ขั้นตอนติดตั้งไดรเวอร์ เลือกบอร์ด เลือก COM Port และทดลอง Blink' },
        { title: 'ดาวน์โหลด Arduino IDE', url: 'https://www.arduino.cc/en/software', source: 'Arduino', kind: 'web', desc: 'หน้าดาวน์โหลดโปรแกรม Arduino IDE จากต้นทาง' },
      ],
      lessonNotes: {
        objectives: ['ติดตั้งและเปิด Arduino IDE ได้', 'เลือก Board, Port และ Programmer ได้ถูกต้องก่อนอัปโหลด'],
        summary: ['Arduino IDE ใช้เขียน ตรวจสอบ และอัปโหลดโปรแกรมลงบอร์ด', 'หากอัปโหลดไม่ได้ ให้ตรวจบอร์ด พอร์ต สาย USB ไดรเวอร์ และการตั้งค่าในเมนู Tools ก่อนเสมอ'],
        activities: ['ให้ผู้เรียนเปิดตัวอย่าง Blink แล้วอ่านโค้ดว่า setup() และ loop() ทำหน้าที่อะไร', 'ฝึกตรวจพอร์ตโดยเสียบและถอดบอร์ดแล้วดูรายการที่เปลี่ยนใน Device Manager หรือเมนู Port'],
        checkQuestions: ['ทำไมต้องเลือก Board ให้ตรงกับบอร์ดจริง', 'ถ้า Port ไม่ขึ้นควรตรวจอะไรบ้าง'],
        vocabulary: ['IDE: โปรแกรมสำหรับเขียนและอัปโหลดโค้ด', 'Port: ช่องทางสื่อสารระหว่างคอมพิวเตอร์กับบอร์ด'],
      },
      quiz: [
        { q: 'โปรแกรมที่ใช้เขียนโค้ด Arduino คืออะไร?', options: ['Arduino IDE', 'Excel', 'Paint', 'PowerPoint'], answer: 0 },
        { q: 'ก่อนอัปโหลดควรตั้งค่าอะไร?', options: ['Board และ Port', 'สีพื้นหลัง', 'ชื่อไฟล์เพลง', 'ความสว่างจอ'], answer: 0 },
        { q: 'Blink ใช้ทดสอบอะไร?', options: ['การพิมพ์งาน', 'การอัปโหลดและควบคุม LED พื้นฐาน', 'การต่ออินเทอร์เน็ต', 'การวาดภาพ'], answer: 1 },
      ],
    },
    3: {
      intro: 'รู้จักขาใช้งานของ Arduino UNO R3 แล้วต่อวงจรง่าย ๆ ให้ปลอดภัย ตั้งแต่ LED ปุ่มกด ไปจนถึงการอ่านค่าแอนาลอก',
      videos: [yt('Arduino digital input output LED button'), yt('Arduino analogRead potentiometer PWM LED')],
      files: [
        { title: '[Arduino #5] คุณสมบัติบอร์ด Arduino UNO R3', url: 'https://praphas.com/index.php/2008-11-03-14-25-25/51-arduino/90-arduino-5-1-uno-r3.PROTEUS', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'ข้อมูลบอร์ด UNO R3 เช่น ATmega328, 5V, digital pins, analog input และ clock speed' },
      ],
      fun: [
        { title: 'Tinkercad Circuits', desc: 'จำลองวงจร Arduino บนเว็บก่อนต่อจริง', url: 'https://www.tinkercad.com/circuits', emoji: '🔌', noLogin: true },
        { title: 'Wokwi Arduino Simulator', desc: 'จำลอง Arduino และเซนเซอร์หลายชนิด', url: 'https://wokwi.com/arduino', emoji: '🧪', noLogin: true },
      ],
      lessonNotes: {
        objectives: ['แยกหน้าที่ของ digital pin, analog input, 5V และ GND ได้', 'ต่อวงจร LED และปุ่มกดพื้นฐานโดยคำนึงถึงความปลอดภัยได้'],
        summary: ['บอร์ด Arduino UNO R3 มีขา digital สำหรับเปิด/ปิด และขา analog input สำหรับอ่านค่าต่อเนื่องจากเซนเซอร์', 'การต่อ LED ต้องใช้ตัวต้านทานและต่อขั้วให้ถูกเพื่อป้องกันอุปกรณ์เสียหาย'],
        activities: ['ต่อ LED พร้อมตัวต้านทาน แล้วสลับค่า HIGH/LOW เพื่อสังเกตผล', 'ต่อปุ่มกดแล้วเขียนโปรแกรมอ่านสถานะด้วย digitalRead()'],
        checkQuestions: ['GND สำคัญอย่างไรในวงจร', 'digital กับ analog ต่างกันอย่างไร'],
      },
      quiz: [
        { q: 'Arduino UNO R3 ใช้ไมโครคอนโทรลเลอร์ตระกูลใดในบทเรียนต้นทาง?', options: ['ATmega328', 'Core i7', 'Ryzen', 'ESP32 เท่านั้น'], answer: 0 },
        { q: 'ขา analog input ใช้ทำอะไร?', options: ['อ่านค่าที่เปลี่ยนต่อเนื่อง', 'พิมพ์เอกสาร', 'เปิดเว็บไซต์', 'บันทึกเสียงเท่านั้น'], answer: 0 },
        { q: 'ทำไมต่อ LED ต้องมีตัวต้านทาน?', options: ['เพื่อให้สวย', 'เพื่อจำกัดกระแสและป้องกัน LED เสีย', 'เพื่อเพิ่มเสียง', 'เพื่อเชื่อม Wi-Fi'], answer: 1 },
      ],
    },
    4: {
      intro: 'หน่วยนี้คือหัวใจของการเขียนโปรแกรม Arduino: อ่านค่า ส่งค่า ปรับความแรงสัญญาณ และใช้ Serial Monitor ช่วย debug',
      videos: [yt('Arduino Serial Monitor ภาษาไทย'), yt('Arduino PWM analogWrite สอน')],
      files: [
        { title: '[เอกสาร #2] เรียนรู้และลองเล่น Arduino เบื้องต้น', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/96-2-arduino', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'เอกสาร Arduino ที่มีบทพื้นฐานไมโครคอนโทรลเลอร์ การเขียน C และใบงานทดลองหลายหัวข้อ' },
      ],
      lessonNotes: {
        objectives: ['ใช้ digitalWrite(), digitalRead(), analogRead(), analogWrite() และ Serial Monitor ในงานพื้นฐานได้', 'อธิบายค่าที่อ่านได้และปรับแก้โค้ดตามผลการทดลองได้'],
        summary: ['setup() ใช้กำหนดค่าเริ่มต้น เช่น pinMode() และ Serial.begin()', 'loop() ทำงานซ้ำเพื่ออ่านค่า ประมวลผล และสั่งงานอุปกรณ์', 'Serial Monitor ช่วยมองเห็นค่าภายในโปรแกรม ทำให้แก้ปัญหาได้ง่ายขึ้น'],
        activities: ['อ่านค่าปุ่มกดแล้วแสดงผลใน Serial Monitor', 'อ่านค่า potentiometer แล้วใช้ PWM ปรับความสว่าง LED'],
        checkQuestions: ['Serial Monitor ช่วย debug อย่างไร', 'PWM แตกต่างจากการเปิด/ปิดธรรมดาอย่างไร'],
      },
      quiz: [
        { q: 'ฟังก์ชันใดใช้สั่งขา digital output?', options: ['digitalWrite()', 'analogRead()', 'Serial.begin()', 'delayMicrophone()'], answer: 0 },
        { q: 'analogRead() บน Arduino UNO มักให้ค่าช่วงใด?', options: ['0-1', '0-255', '0-1023', '0-10000'], answer: 2 },
        { q: 'Serial Monitor ใช้เพื่ออะไร?', options: ['ดูและส่งค่าระหว่างคอมพิวเตอร์กับบอร์ด', 'ล้างบอร์ด', 'วาดรูป', 'ชาร์จแบตเตอรี่'], answer: 0 },
      ],
    },
    5: {
      intro: 'ต่อยอดจากพื้นฐานสู่ใบงานจริง: เซนเซอร์ มอเตอร์ จอแสดงผล และมินิโครงงานที่มีการวัดผลและปรับปรุง',
      videos: [yt('Arduino ultrasonic sensor servo project'), yt('Arduino DHT22 LCD I2C ภาษาไทย')],
      files: [
        { title: '[เอกสาร #5] เรียนรู้และลองเล่น Arduino เบื้องต้น ฉบับปรับปรุงครั้งที่ 2', url: 'https://praphas.com/index.php/51-knowhow/arduino', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'หน้ารวมเอกสารฉบับปรับปรุงและใบงาน Arduino 33 ใบงาน' },
        { title: '[เอกสาร #3] เรียนรู้และลองเล่น Arduino เบื้องต้น ฉบับปรับปรุงครั้งที่ 1', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/97-2-arduino-1', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'รายการใบงาน เช่น ดิจิทัลอินพุต แอนาลอก PWM DHT22 Ultrasonic Motor LCD และ OLED' },
      ],
      fun: [
        { title: 'Wokwi Examples', desc: 'เลือกตัวอย่าง Arduino พร้อมวงจรจำลอง', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '🧰', noLogin: true },
      ],
      lessonNotes: {
        objectives: ['เลือกเซนเซอร์หรืออุปกรณ์สั่งงานให้เหมาะกับปัญหาที่ต้องการแก้ได้', 'สร้างมินิโครงงาน Arduino พร้อมบันทึกผลการทดลองและปรับปรุงได้'],
        summary: ['ใบงาน Arduino ที่ดีควรมีจุดประสงค์ อุปกรณ์ วงจร โค้ด วิธีทดลอง ผลลัพธ์ และคำถามสะท้อนคิด', 'โครงงานควรเริ่มจากปัญหาเล็ก ๆ ที่วัดผลได้ เช่น เตือนระยะใกล้ วัดอุณหภูมิ หรือแสดงค่าบนจอ'],
        activities: ['ออกแบบมินิโครงงาน 1 ชิ้นโดยระบุ input-process-output', 'ทำตารางบันทึกค่าที่เซนเซอร์อ่านได้และสรุปว่าระบบทำงานตรงตามเงื่อนไขหรือไม่'],
        checkQuestions: ['ถ้าค่าเซนเซอร์แกว่งมากควรตรวจอะไร', 'มินิโครงงานควรมีหลักฐานการทดสอบแบบใด'],
      },
      quiz: [
        { q: 'เซนเซอร์ ultrasonic ใช้วัดอะไร?', options: ['สี', 'ระยะทาง', 'น้ำหนัก', 'รหัสผ่าน'], answer: 1 },
        { q: 'DHT22 ใช้วัดค่าใด?', options: ['อุณหภูมิและความชื้น', 'เสียงดนตรี', 'ความเร็วรถ', 'ข้อความ'], answer: 0 },
        { q: 'โครงงานที่ดีควรมีอะไร?', options: ['วงจรและโค้ดอย่างเดียว', 'ปัญหา วิธีทดลอง ผลลัพธ์ และข้อปรับปรุง', 'ชื่อสวยเท่านั้น', 'รูปภาพอย่างเดียว'], answer: 1 },
      ],
    },
    6: {
      intro: 'ปิดท้ายด้วยมุมช่าง: จำลองวงจร ตรวจปัญหา และเข้าใจบูตโหลดเดอร์ในระดับที่ช่วยดูแลบอร์ด Arduino ได้',
      videos: [yt('Arduino as ISP bootloader ภาษาไทย'), yt('Proteus Arduino simulation เบื้องต้น')],
      files: [
        { title: '[Arduino #4] การสร้าง Arduino บน Proteus', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/89-arduino-4-arduino-proteus', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'บทความเกี่ยวกับไลบรารีและการจำลองวงจร Arduino ใน Proteus' },
        { title: '[Arduino #6] การทำบูตโหลดเดอร์', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/91-arduino-6-2', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'ขั้นตอนแนวคิด Arduino as ISP และการเบิร์นบูตโหลดเดอร์ให้ชิป' },
        { title: '[Arduino #8] การซ่อมบูตโหลดเดอร์', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/94-arduino-8', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'แนวทางใช้บอร์ด Arduino ที่ใช้งานได้เป็นเครื่องโปรแกรมเพื่อซ่อมบูตโหลดเดอร์' },
      ],
      lessonNotes: {
        objectives: ['อธิบายหน้าที่ของบูตโหลดเดอร์ได้ในระดับพื้นฐาน', 'วิเคราะห์อาการอัปโหลดไม่ได้และจัดลำดับการตรวจสอบได้'],
        summary: ['การจำลองวงจรช่วยทดสอบแนวคิดก่อนต่อจริง แต่ยังต้องตรวจข้อจำกัดของโมเดลและอุปกรณ์จริง', 'บูตโหลดเดอร์ช่วยให้บอร์ดรับโปรแกรมผ่าน USB ได้ ถ้าเสียหายอาจต้องใช้ Arduino as ISP ช่วยเบิร์นใหม่'],
        activities: ['ทำผังตรวจสอบเมื่ออัปโหลดไม่ได้: สาย USB, Driver, Port, Board, Programmer, วงจรภายนอก และบูตโหลดเดอร์', 'เปรียบเทียบข้อดีข้อจำกัดของการจำลองวงจรกับการต่อวงจรจริง'],
        checkQuestions: ['ทำไมการจำลองวงจรจึงไม่แทนการทดลองจริงทั้งหมด', 'บูตโหลดเดอร์ช่วยให้การใช้งาน Arduino สะดวกขึ้นอย่างไร'],
      },
      quiz: [
        { q: 'บูตโหลดเดอร์ช่วยเรื่องใด?', options: ['ทำให้บอร์ดรับโปรแกรมผ่าน USB ได้สะดวก', 'ทำให้ LED สว่างขึ้นเท่านั้น', 'เพิ่มความจุแบตเตอรี่', 'เปิดอินเทอร์เน็ต'], answer: 0 },
        { q: 'Arduino as ISP คืออะไรในบริบทนี้?', options: ['ใช้ Arduino ตัวหนึ่งเป็นเครื่องโปรแกรม', 'ใช้ Arduino เป็นลำโพง', 'ใช้ Arduino เป็นจอภาพ', 'ใช้ Arduino เป็นเมาส์'], answer: 0 },
        { q: 'เมื่ออัปโหลดไม่ได้ ควรตรวจอะไรก่อน?', options: ['ซื้อบอร์ดใหม่ทันที', 'สาย USB, Board, Port และ Driver', 'ลบโค้ดทั้งหมดเสมอ', 'เปลี่ยนจอคอม'], answer: 1 },
      ],
    },
  }
};

const mergeLessonNotes = (base: LessonNotes = {}, extra: LessonNotes = {}): LessonNotes => ({
  objectives: [...(base.objectives || []), ...(extra.objectives || [])],
  summary: [...(base.summary || []), ...(extra.summary || [])],
  activities: [...(base.activities || []), ...(extra.activities || [])],
  checkQuestions: [...(base.checkQuestions || []), ...(extra.checkQuestions || [])],
  vocabulary: [...(base.vocabulary || []), ...(extra.vocabulary || [])],
});

const extendArduinoUnit = (unitNo: number, extra: UnitExtras) => {
  const current = unitExtras['arduino-basic'][unitNo] || {};
  unitExtras['arduino-basic'][unitNo] = {
    ...current,
    files: [...(current.files || []), ...(extra.files || [])],
    fun: [...(current.fun || []), ...(extra.fun || [])],
    quiz: [...(current.quiz || []), ...(extra.quiz || [])],
    articles: [...(current.articles || []), ...(extra.articles || [])],
    videos: [...(current.videos || []), ...(extra.videos || [])],
    lessonNotes: extra.lessonNotes ? mergeLessonNotes(current.lessonNotes, extra.lessonNotes) : current.lessonNotes,
  };
};

const arduinoReadyToTeachExtras: Record<number, UnitExtras> = {
  1: {
    files: [
      { title: 'ใบงานที่ 1: สำรวจบอร์ด Arduino และ Input-Process-Output', url: '/worksheets/arduino/u1-board-ipo.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานเปิดจากเว็บและพิมพ์ได้ สำหรับให้เด็กระบุส่วนประกอบบอร์ดและคิดระบบแบบ input-process-output' },
    ],
    fun: [
      { title: 'Wokwi Arduino Playground', desc: 'เปิดพื้นที่จำลอง Arduino เพื่อดูภาพรวมบอร์ดและทดลองโค้ดเบื้องต้น', url: 'https://wokwi.com/arduino', emoji: '🔎', noLogin: true },
      { title: 'Tinkercad Circuits', desc: 'สำรวจบอร์ด Arduino และอุปกรณ์อิเล็กทรอนิกส์แบบลากวาง', url: 'https://www.tinkercad.com/circuits', emoji: '🧩', noLogin: true },
    ],
    lessonNotes: {
      activities: ['ใช้ใบงานที่ 1 เป็นงานเดี่ยวหรือคู่ ก่อนให้เด็กเสนอไอเดียชิ้นงาน Arduino 1 ปัญหา'],
      checkQuestions: ['ชิ้นงานของนักเรียนมี input-process-output ครบหรือยัง และส่วนใดคือหลักฐานว่า Arduino เป็นผู้ควบคุม'],
    },
    quiz: [
      { q: 'คำว่า output ในงาน Arduino หมายถึงอะไร?', options: ['ข้อมูลที่เข้าบอร์ด', 'ผลที่บอร์ดสั่งให้อุปกรณ์ทำงาน', 'ชื่อโปรแกรม', 'สาย USB'], answer: 1, explain: 'Output คือผลที่ระบบสั่งออกไป เช่น LED ติด เสียงดัง หรือมอเตอร์หมุน' },
      { q: 'ข้อใดเป็นตัวอย่าง process ของระบบ Arduino?', options: ['ปุ่มกด', 'โค้ดตรวจว่าค่ามากกว่าเกณฑ์หรือไม่', 'LED', 'สาย jumper'], answer: 1 },
      { q: 'GND มีบทบาทสำคัญอย่างไรในวงจร?', options: ['ทำให้ไฟสวยขึ้น', 'เป็นจุดอ้างอิงและทางกลับของวงจร', 'ใช้แทนโค้ด', 'ทำให้คอมพิวเตอร์เร็วขึ้น'], answer: 1 },
      { q: 'ข้อใดควรทำก่อนเสียบไฟเข้าวงจร?', options: ['ตรวจขั้วและตรวจว่า 5V ไม่ลัดกับ GND', 'เขย่าบอร์ด', 'ถอดตัวต้านทานออก', 'เปลี่ยนชื่อไฟล์'], answer: 0 },
      { q: 'Arduino เหมาะกับการเรียนรู้แบบใด?', options: ['ท่องจำอย่างเดียว', 'ทดลอง วัดผล แก้ปัญหา และปรับปรุง', 'ตัดต่อภาพเท่านั้น', 'พิมพ์รายงานเท่านั้น'], answer: 1 },
    ],
  },
  2: {
    files: [
      { title: 'ใบงานที่ 2: Blink โปรแกรมแรกและการปรับ delay', url: '/worksheets/arduino/u2-blink.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานทดลองอัปโหลด Blink ปรับเวลา delay และบันทึกผลการกะพริบของ LED' },
    ],
    fun: [
      { title: 'Wokwi Arduino UNO: Blink', desc: 'เริ่มโปรเจกต์ Arduino UNO สำหรับจำลอง Blink และแก้ delay', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '💡', noLogin: true },
      { title: 'Tinkercad Circuits: Blink', desc: 'สร้างวงจร Arduino + LED ด้วยภาพลากวาง เหมาะกับผู้เริ่มต้น', url: 'https://www.tinkercad.com/circuits', emoji: '🧱', noLogin: true },
    ],
    lessonNotes: {
      activities: ['ใช้ใบงานที่ 2 ให้เด็กทดลอง delay หลายค่า แล้วสรุปความสัมพันธ์ระหว่างตัวเลขในโค้ดกับพฤติกรรมของ LED'],
      checkQuestions: ['ถ้า Verify ผ่านแต่ Upload ไม่ผ่าน ปัญหาน่าจะอยู่ที่โค้ดหรือการเชื่อมต่อ เพราะอะไร'],
    },
    quiz: [
      { q: 'Verify ใน Arduino IDE ใช้ทำอะไร?', options: ['ตรวจโค้ดก่อนอัปโหลด', 'ล้างบอร์ด', 'เพิ่มความสว่างจอ', 'ต่อสายอัตโนมัติ'], answer: 0 },
      { q: 'Upload ใช้ทำอะไร?', options: ['ส่งโปรแกรมลงบอร์ด', 'เปิดเว็บ', 'พิมพ์ใบงาน', 'ชาร์จแบตเตอรี่เท่านั้น'], answer: 0 },
      { q: 'setup() ทำงานเมื่อใด?', options: ['ทำซ้ำตลอดเวลา', 'ทำครั้งเดียวตอนเริ่มโปรแกรม', 'ไม่เคยทำงาน', 'ทำเฉพาะตอนปิดเครื่อง'], answer: 1 },
      { q: 'loop() มีหน้าที่หลักอย่างไร?', options: ['ทำงานซ้ำต่อเนื่อง', 'ติดตั้งไดรเวอร์', 'เลือก Port', 'วาดวงจร'], answer: 0 },
      { q: 'ถ้าอยากให้ไฟกะพริบช้าลงควรทำอย่างไร?', options: ['เพิ่มค่า delay', 'ลดค่า delay เหลือ 0 เสมอ', 'ถอด GND', 'เปลี่ยนชื่อบอร์ด'], answer: 0 },
    ],
  },
  3: {
    files: [
      { title: 'ใบงานที่ 3: LED ปุ่มกด และค่าแอนาลอก', url: '/worksheets/arduino/u3-led-button-analog.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานต่อวงจร LED ภายนอก ปุ่มกด และทดลองอ่านค่า analog จาก potentiometer หรือเซนเซอร์' },
    ],
    lessonNotes: {
      activities: ['ใช้ใบงานที่ 3 ฝึกให้เด็กวาดเส้นทางไฟฟ้าและบันทึกค่าที่อ่านได้ก่อนสรุปผล'],
      checkQuestions: ['เมื่อต่อวงจรไม่ทำงาน นักเรียนตรวจวงจร โค้ด และการตั้งค่าตามลำดับใด'],
    },
    quiz: [
      { q: 'Breadboard มีประโยชน์อย่างไร?', options: ['ต่อวงจรทดลองโดยไม่ต้องบัดกรี', 'ใช้เป็นแบตเตอรี่', 'ใช้แทน Arduino', 'ใช้เขียนรายงาน'], answer: 0 },
      { q: 'digitalRead() อ่านค่าแบบใด?', options: ['HIGH หรือ LOW', 'รูปภาพ', 'เสียงเพลง', 'ไฟล์เอกสาร'], answer: 0 },
      { q: 'INPUT_PULLUP ทำให้ปุ่มกดมักอ่านค่าอย่างไรเมื่อกดลง GND?', options: ['LOW', 'HIGH เสมอ', '1023', '255'], answer: 0 },
      { q: 'analog input บน UNO เหมาะกับงานใด?', options: ['อ่านค่าระดับแสงที่เปลี่ยนต่อเนื่อง', 'เปิดเว็บ', 'พิมพ์เอกสาร', 'ลบโปรแกรม'], answer: 0 },
      { q: 'ถ้า LED ไม่ติด ข้อใดควรตรวจร่วมกับโค้ด?', options: ['ขั้ว LED ตัวต้านทาน สาย GND และขา pin', 'สีพื้นหลัง IDE', 'ชื่อผู้ใช้คอมพิวเตอร์', 'ความเร็วอินเทอร์เน็ต'], answer: 0 },
    ],
  },
  4: {
    files: [
      { title: 'ใบงานที่ 4: Serial Monitor และ PWM ปรับความสว่าง', url: '/worksheets/arduino/u4-serial-pwm.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานอ่านค่า analog ผ่าน Serial Monitor แปลงค่า และใช้ PWM ควบคุม LED' },
    ],
    fun: [
      { title: 'Wokwi: Analog + PWM Lab', desc: 'จำลอง Arduino UNO เพื่ออ่าน potentiometer และปรับ LED ด้วย PWM', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '📊', noLogin: true },
      { title: 'Tinkercad Circuits: Serial/PWM', desc: 'สร้างวงจรอ่าน input และควบคุม output แบบเห็นภาพ', url: 'https://www.tinkercad.com/circuits', emoji: '🎛️', noLogin: true },
    ],
    lessonNotes: {
      activities: ['ใช้ใบงานที่ 4 ให้เด็กบันทึกค่าจาก Serial Monitor แล้วค่อยตั้ง threshold หรือแปลงค่า PWM'],
      checkQuestions: ['ทำไมการตั้ง threshold จากข้อมูลจริงจึงน่าเชื่อถือกว่าการเดาค่า'],
    },
    quiz: [
      { q: 'Serial.begin(9600) ใช้เพื่ออะไร?', options: ['เริ่มสื่อสารผ่าน Serial ที่ความเร็ว 9600', 'ปิดบอร์ด', 'เลือกสี LED', 'ลบไดรเวอร์'], answer: 0 },
      { q: 'Serial.println() ต่างจาก Serial.print() อย่างไรโดยทั่วไป?', options: ['ขึ้นบรรทัดใหม่หลังพิมพ์ค่า', 'ทำให้บอร์ดดับ', 'ใช้ต่อวงจร', 'ใช้แทน delay'], answer: 0 },
      { q: 'analogWrite() บน Arduino UNO ใช้ค่าช่วงใดบ่อยที่สุด?', options: ['0-255', '0-1023', '0-1 เท่านั้น', '1000-2000'], answer: 0 },
      { q: 'map() ช่วยเรื่องใด?', options: ['แปลงช่วงค่าตัวเลข', 'เลือก Port อัตโนมัติ', 'ต่อสายไฟ', 'ล้างหน่วยความจำ'], answer: 0 },
      { q: 'baud rate ในโค้ดและ Serial Monitor ควรเป็นอย่างไร?', options: ['ตรงกัน', 'ต่างกันเสมอ', 'ไม่เกี่ยวกัน', 'ต้องเป็น 0'], answer: 0 },
    ],
  },
  5: {
    files: [
      { title: 'ใบงานที่ 5: มินิโครงงานเซนเซอร์ Arduino', url: '/worksheets/arduino/u5-sensor-project.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานออกแบบมินิโครงงานจากปัญหา เลือกเซนเซอร์ กำหนด output และบันทึกผลการทดลอง' },
    ],
    fun: [
      { title: 'Tinkercad Circuits: Sensor Project', desc: 'ออกแบบวงจรเซนเซอร์และ output ด้วยภาพลากวางก่อนลงมือจริง', url: 'https://www.tinkercad.com/circuits', emoji: '🧪', noLogin: true },
      { title: 'Arduino Project Hub', desc: 'ดูตัวอย่างไอเดียโครงงาน Arduino เพื่อปรับใช้ในระดับนักเรียน', url: 'https://projecthub.arduino.cc/', emoji: '💡', noLogin: true },
    ],
    lessonNotes: {
      activities: ['ใช้ใบงานที่ 5 เป็นงานกลุ่ม ให้เด็กนำเสนอปัญหา input-process-output หลักฐานการทดสอบ และข้อปรับปรุง'],
      checkQuestions: ['โครงงานของกลุ่มมีหลักฐานใดพิสูจน์ว่าทำงานตามเป้าหมาย ไม่ใช่แค่ต่อวงจรได้'],
    },
    quiz: [
      { q: 'Output แบบใดเหมาะกับการเตือนผู้ใช้ทันที?', options: ['Buzzer หรือ LED เตือน', 'ไฟล์เอกสาร', 'ชื่อโฟลเดอร์', 'สาย USB'], answer: 0 },
      { q: 'ทำไมมอเตอร์จึงไม่ควรต่อเข้าขา Arduino โดยตรงในหลายกรณี?', options: ['กินกระแสมากเกินกว่าขาจะจ่ายได้', 'ทำให้โค้ดสั้นเกินไป', 'ทำให้จอใหญ่ขึ้น', 'ไม่มีเหตุผล'], answer: 0 },
      { q: 'ใบงานทดลองที่ดีควรมีอะไร?', options: ['จุดประสงค์ อุปกรณ์ วิธีทดลอง ตารางผล และคำถามวิเคราะห์', 'ชื่อสวยอย่างเดียว', 'รูปภาพอย่างเดียว', 'คำตอบให้ครบทุกข้อ'], answer: 0 },
      { q: 'ถ้าเซนเซอร์อ่านค่าแกว่งมาก ควรทำอย่างไร?', options: ['อ่านหลายครั้ง บันทึกผล และตรวจวงจร/สภาพแวดล้อม', 'ลบโค้ดทั้งหมด', 'เพิ่มเสียงเพลง', 'ไม่ต้องทดสอบ'], answer: 0 },
      { q: 'หลักฐานใดเหมาะกับการนำเสนอโปรเจกต์ Arduino?', options: ['ภาพวงจร โค้ด ตารางทดลอง และข้อปรับปรุง', 'ชื่อโปรเจกต์อย่างเดียว', 'สีของสายไฟอย่างเดียว', 'จำนวนสมาชิกเท่านั้น'], answer: 0 },
    ],
  },
  6: {
    files: [
      { title: 'ใบงานที่ 6: จำลองวงจรและแก้ปัญหาอัปโหลดไม่ได้', url: '/worksheets/arduino/u6-simulation-troubleshooting.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานให้เด็กสร้างวงจรจำลอง เปรียบเทียบกับของจริง และใช้ checklist แก้ปัญหา' },
    ],
    fun: [
      { title: 'Wokwi Arduino Simulator', desc: 'จำลองวงจร Arduino และแชร์ลิงก์โปรเจกต์เพื่อให้ครูตรวจได้', url: 'https://wokwi.com/arduino', emoji: '🧰', noLogin: true },
      { title: 'Tinkercad Circuits', desc: 'จำลองวงจร Arduino ด้วยภาพอุปกรณ์เหมาะกับการสรุปท้ายคอร์ส', url: 'https://www.tinkercad.com/circuits', emoji: '🧱', noLogin: true },
    ],
    lessonNotes: {
      activities: ['ใช้ใบงานที่ 6 เป็นงานรวบยอด ให้เด็กส่งลิงก์จำลองและ checklist การแก้ปัญหาของตนเอง'],
      checkQuestions: ['ถ้าจำลองผ่านแต่ของจริงไม่ผ่าน นักเรียนจะแยกปัญหา simulator, วงจรจริง และการตั้งค่าอย่างไร'],
    },
    quiz: [
      { q: 'ข้อใดเป็นข้อดีของ simulator?', options: ['ทดลองแนวคิดได้เร็วและลดความเสี่ยงต่ออุปกรณ์', 'แทนของจริงได้ทุกกรณี', 'ไม่ต้องเข้าใจวงจร', 'ทำให้ไม่ต้องเขียนโค้ด'], answer: 0 },
      { q: 'ข้อใดเป็นข้อจำกัดของ simulator?', options: ['อาจไม่แสดงปัญหาสายหลวมหรืออุปกรณ์เสียจริง', 'เปิดไม่ได้บนคอมพิวเตอร์ทุกชนิดเสมอ', 'ไม่มีประโยชน์เลย', 'ใช้ดูโค้ดไม่ได้'], answer: 0 },
      { q: 'บูตโหลดเดอร์อยู่เพื่อช่วยเรื่องใดเป็นหลัก?', options: ['รับโปรแกรมใหม่เข้าสู่ไมโครคอนโทรลเลอร์ได้สะดวก', 'ทำให้ LED เปลี่ยนสีเอง', 'เพิ่มจำนวนขา analog', 'ทำให้สาย USB ยาวขึ้น'], answer: 0 },
      { q: 'ก่อนสงสัยว่าบูตโหลดเดอร์เสีย ควรตรวจอะไรก่อน?', options: ['สาย USB, Board, Port, Driver และวงจรภายนอก', 'สีของโต๊ะ', 'ชื่อไฟล์รูปภาพ', 'เวลาในนาฬิกา'], answer: 0 },
      { q: 'ทำไมควรบันทึกข้อความ error และสิ่งที่ลองแก้แล้ว?', options: ['ช่วยวิเคราะห์สาเหตุและไม่แก้ซ้ำแบบเดิม', 'ทำให้บอร์ดสวยขึ้น', 'เพิ่มแรงดันไฟ', 'ลดจำนวนสายไฟ'], answer: 0 },
    ],
  },
};

Object.entries(arduinoReadyToTeachExtras).forEach(([unitNo, extra]) => {
  extendArduinoUnit(Number(unitNo), extra);
});

const arduinoExpandedMediaExtras: Record<number, UnitExtras> = {
  1: {
    files: [
      { title: 'Arduino Built-in Examples', url: 'https://docs.arduino.cc/built-in-examples', source: 'Arduino Docs', kind: 'web', desc: 'หน้ารวมตัวอย่างพื้นฐานที่มีใน Arduino IDE เช่น Blink, Button, AnalogReadSerial และ PWM' },
      { title: 'Arduino Education Starter Kit', url: 'https://www.arduino.cc/education/edu-starter-kit/', source: 'Arduino Education', kind: 'web', desc: 'แนวทางจัดบทเรียนแบบห้องเรียนสำหรับการเรียนอิเล็กทรอนิกส์และโค้ดเป็นคู่' },
    ],
    fun: [
      { title: 'Arduino Project Hub: Beginner ideas', desc: 'ดูไอเดียโครงงานระดับเริ่มต้นก่อนเลือกปัญหาในโรงเรียน', url: 'https://projecthub.arduino.cc/', emoji: '💡', noLogin: true },
    ],
    lessonNotes: {
      activities: ['ให้เด็กเลือกของใช้จริง 1 ชิ้น แล้วแยก input-process-output ก่อนเชื่อมโยงกลับมาที่ Arduino'],
      vocabulary: ['Microcontroller: สมองเล็กในอุปกรณ์', 'Prototype: ต้นแบบที่ทดลองและแก้ไขได้'],
    },
    quiz: [
      { q: 'เหตุใด Arduino จึงเหมาะกับการทำต้นแบบ?', options: ['เขียนและทดลองวงจรได้เร็ว', 'ใช้แทนคอมพิวเตอร์ทุกงาน', 'ทำงานโดยไม่ต้องใช้ไฟ', 'ใช้ได้เฉพาะดูวิดีโอ'], answer: 0 },
      { q: 'ระบบ Arduino ที่อธิบายครบควรมีอะไร?', options: ['input-process-output และเป้าหมาย', 'ชื่ออุปกรณ์อย่างเดียว', 'สีสายไฟอย่างเดียว', 'ราคาอุปกรณ์เท่านั้น'], answer: 0 },
    ],
  },
  2: {
    files: [
      { title: 'Arduino Blink example', url: 'https://docs.arduino.cc/built-in-examples/basics/Blink/', source: 'Arduino Docs', kind: 'web', desc: 'ตัวอย่าง Blink อย่างเป็นทางการสำหรับทดสอบบอร์ดและโครงสร้าง setup/loop' },
      { title: 'Arduino Built-in Examples: Blink Without Delay', url: 'https://docs.arduino.cc/built-in-examples/digital/BlinkWithoutDelay/', source: 'Arduino Docs', kind: 'web', desc: 'แนวคิดไม่ใช้ delay ยาว เหมาะสำหรับต่อยอดเมื่อเด็กเข้าใจ Blink แล้ว' },
    ],
    fun: [
      { title: 'Wokwi: New Arduino UNO Project', desc: 'เปิดโปรเจกต์ Arduino UNO เปล่าแล้วเขียน Blink หรือแก้ delay ได้ทันที', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '💻', noLogin: true },
    ],
    lessonNotes: {
      checkQuestions: ['Verify ผ่านแต่ Upload ไม่ผ่าน บอกอะไรเกี่ยวกับชนิดของปัญหา', 'delay ยาวมีข้อจำกัดอย่างไรถ้าเราต้องอ่านปุ่มพร้อมกัน'],
      vocabulary: ['Compile error: โค้ดผิดก่อนส่งลงบอร์ด', 'Upload error: ส่งโปรแกรมลงบอร์ดไม่สำเร็จ'],
    },
    quiz: [
      { q: 'ถ้า Verify ผ่านแต่ Upload ไม่ผ่าน สาเหตุที่ควรตรวจคือข้อใด?', options: ['Board/Port/สาย USB', 'สีพื้นหลัง IDE', 'ชื่อไฟล์ภาพ', 'ขนาดจอคอม'], answer: 0 },
      { q: 'ข้อจำกัดของ delay() ที่ยาวมากคืออะไร?', options: ['บอร์ดหยุดรอและตอบสนองอย่างอื่นช้า', 'ทำให้ LED เสียทันที', 'ทำให้โค้ดไม่ต้องมี loop', 'ทำให้ Serial Monitor หายไป'], answer: 0 },
    ],
  },
  3: {
    files: [
      { title: 'Arduino Button example', url: 'https://docs.arduino.cc/built-in-examples/digital/Button/', source: 'Arduino Docs', kind: 'web', desc: 'ตัวอย่างปุ่มกดควบคุม LED และแนวคิด digital input' },
      { title: 'Arduino Analog Read Serial', url: 'https://docs.arduino.cc/built-in-examples/basics/AnalogReadSerial/', source: 'Arduino Docs', kind: 'web', desc: 'อ่านค่า analog แล้วแสดงใน Serial Monitor' },
    ],
    fun: [
      { title: 'Wokwi LED/Button/Potentiometer', desc: 'โปรเจกต์ตัวอย่างรวม LED ปุ่มกด และ potentiometer สำหรับฝึก input-output', url: 'https://wokwi.com/projects/410462647202853889', emoji: '🔘', noLogin: true },
    ],
    lessonNotes: {
      activities: ['จัดสถานีตรวจวงจร: เด็กต้องชี้ขา LED, resistor, GND, ขา input และอธิบาย breadboard ก่อนเสียบ USB'],
      checkQuestions: ['ถ้าใช้ INPUT_PULLUP แล้วกดปุ่มอ่านค่า LOW เพราะอะไร'],
      vocabulary: ['Floating input: ขา input ไม่มีค่าอ้างอิงชัดเจน', 'Threshold: ค่าเกณฑ์สำหรับตัดสินใจ'],
    },
    quiz: [
      { q: 'INPUT_PULLUP ช่วยลดปัญหาใด?', options: ['input ลอยและอ่านค่าไม่นิ่ง', 'LED ร้อนเกินไปทุกกรณี', 'เปิด Serial Monitor อัตโนมัติ', 'เปลี่ยนสีสายไฟ'], answer: 0 },
      { q: 'ก่อนตั้ง threshold ควรทำอะไร?', options: ['อ่านและบันทึกค่าจริงหลายครั้ง', 'เดาตัวเลขทันที', 'ลบโค้ด setup', 'ถอด resistor ออก'], answer: 0 },
    ],
  },
  4: {
    files: [
      { title: 'Arduino Analog In, Out Serial', url: 'https://www.arduino.cc/en/Tutorial/BuiltInExamples/AnalogInOutSerial/', source: 'Arduino', kind: 'web', desc: 'อ่าน potentiometer แปลงค่า และใช้ PWM ปรับความสว่าง LED พร้อมพิมพ์ค่าออก Serial' },
      { title: 'Use PWM output with Arduino', url: 'https://support.arduino.cc/hc/en-us/articles/9350537961500-Use-PWM-output-with-Arduino', source: 'Arduino Help Center', kind: 'web', desc: 'คำอธิบาย PWM และรายการขา PWM ของบอร์ด Arduino หลายรุ่น' },
    ],
    fun: [
      { title: 'Wokwi Potentiometer Analog Input', desc: 'ตัวอย่างอ่าน potentiometer ควบคุม LED, RGB และ Servo พร้อม Serial Monitor', url: 'https://wokwi.com/projects/459617449701346305', emoji: '🎛️', noLogin: true },
    ],
    lessonNotes: {
      activities: ['ให้เด็กเก็บค่าจาก Serial Monitor อย่างน้อย 5 ค่า แล้วใช้ map() แปลงเป็น brightness 0-255'],
      vocabulary: ['PWM: การเปิดปิดสัญญาณเร็วเพื่อจำลองระดับความแรง', 'Baud rate: ความเร็วสื่อสาร Serial ที่ต้องตั้งให้ตรงกัน'],
    },
    quiz: [
      { q: 'ขา PWM บน Arduino UNO มักมีสัญลักษณ์ใดกำกับ?', options: ['~', '#', '@', '?'], answer: 0 },
      { q: 'map(sensor, 0, 1023, 0, 255) มีหน้าที่หลักคืออะไร?', options: ['แปลงช่วงค่า analog เป็นช่วง PWM', 'เลือกพอร์ต USB', 'ล้างหน้าจอ', 'เปลี่ยนชื่อบอร์ด'], answer: 0 },
    ],
  },
  5: {
    files: [
      { title: 'Wokwi HC-SR04 ultrasonic reference', url: 'https://docs.wokwi.com/parts/wokwi-hc-sr04', source: 'Wokwi Docs', kind: 'web', desc: 'เอกสารขา TRIG/ECHO การคำนวณระยะ และตัวอย่างโค้ด ultrasonic' },
      { title: 'Wokwi DHT22 reference', url: 'https://docs.wokwi.com/parts/wokwi-dht22', source: 'Wokwi Docs', kind: 'web', desc: 'เอกสารเซนเซอร์อุณหภูมิและความชื้น DHT22 สำหรับจำลองใน Wokwi' },
      { title: 'Arduino Servo library', url: 'https://docs.arduino.cc/libraries/servo/', source: 'Arduino Docs', kind: 'web', desc: 'ข้อมูลไลบรารี Servo สำหรับควบคุมมุมมอเตอร์เซอร์โว' },
    ],
    fun: [
      { title: 'Wokwi Ultrasonic Parking Sensor', desc: 'ตัวอย่างเซนเซอร์วัดระยะ ใช้ปรับเป็นโปรเจกต์เตือนระยะใกล้ได้', url: 'https://docs.wokwi.com/parts/wokwi-hc-sr04#simulator-examples', emoji: '📏', noLogin: true },
      { title: 'Wokwi Servo reference', desc: 'ศึกษาขา servo และตัวอย่าง Sweep/Knob ก่อนต่อจริง', url: 'https://docs.wokwi.com/parts/wokwi-servo', emoji: '⚙️', noLogin: true },
    ],
    lessonNotes: {
      checkQuestions: ['ถ้า servo ทำให้บอร์ดรีเซต ควรสงสัยเรื่องใด', 'ทำไม ultrasonic ต้องมีทั้ง TRIG และ ECHO'],
      vocabulary: ['TRIG: ขาเริ่มวัดของ ultrasonic', 'ECHO: ขารับพัลส์กลับเพื่อคำนวณระยะ'],
    },
    quiz: [
      { q: 'HC-SR04 ใช้ขาใดเริ่มการวัด?', options: ['TRIG', 'GND', 'VCC เท่านั้น', 'A0 เท่านั้น'], answer: 0 },
      { q: 'Servo เหมาะกับงานแบบใด?', options: ['หมุนไปยังมุมที่กำหนด', 'เก็บข้อมูลจำนวนมาก', 'เชื่อมต่อ Wi-Fi โดยตรง', 'แทนตัวต้านทาน'], answer: 0 },
    ],
  },
  6: {
    files: [
      { title: 'Wokwi Arduino UNO reference', url: 'https://docs.wokwi.com/parts/wokwi-arduino-uno', source: 'Wokwi Docs', kind: 'web', desc: 'ข้อมูลบอร์ด Arduino UNO ใน Wokwi สำหรับตรวจขาและจำลองวงจร' },
      { title: '[Arduino #6] การทำบูตโหลดเดอร์', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/91-arduino-6-2', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'บทความภาษาไทยเกี่ยวกับ Arduino as ISP และการเบิร์นบูตโหลดเดอร์' },
    ],
    lessonNotes: {
      activities: ['ให้เด็กทำตาราง 4 ช่อง: อาการ, หมวดปัญหา, สิ่งที่ลองแก้, ผลลัพธ์ เพื่อฝึก troubleshooting'],
      vocabulary: ['Simulator: เครื่องมือจำลองวงจร', 'Bootloader: โปรแกรมเล็กที่ช่วยรับโค้ดใหม่เข้าสู่บอร์ด'],
    },
    quiz: [
      { q: 'การบันทึก error ช่วยอะไร?', options: ['รู้ว่าลองแก้อะไรแล้วและหาสาเหตุเป็นขั้นตอน', 'ทำให้บอร์ดเร็วขึ้นทันที', 'ทำให้ไฟแรงขึ้น', 'เปลี่ยนสีจอ'], answer: 0 },
    ],
  },
  7: {
    intro: 'หน่วยนี้เติมส่วนที่ทำให้โครงงานสื่อสารกับผู้ใช้ได้จริง: จอ LCD/OLED, I2C, การจัดข้อความ และการแสดงค่าจากเซนเซอร์ให้อ่านง่าย',
    videos: [yt('Arduino LCD I2C ภาษาไทย'), yt('Arduino OLED I2C แสดงค่า sensor'), yt('Wokwi LCD1602 Arduino tutorial')],
    files: [
      { title: 'ใบงานที่ 7: LCD I2C แสดงค่าจากเซนเซอร์', url: '/worksheets/arduino/u7-display-i2c.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานต่อจอ LCD I2C แสดงค่าระยะ/อุณหภูมิ พร้อม checklist แก้ปัญหาจอไม่ขึ้น' },
      { title: 'Wokwi LCD1602 reference', url: 'https://docs.wokwi.com/parts/wokwi-lcd1602', source: 'Wokwi Docs', kind: 'web', desc: 'เอกสาร LCD 16x2 ทั้งแบบปกติและ I2C พร้อมความต่างของจำนวนขาที่ใช้' },
      { title: 'Arduino LiquidCrystal library', url: 'https://docs.arduino.cc/libraries/liquidcrystal/', source: 'Arduino Docs', kind: 'web', desc: 'ข้อมูลไลบรารี LiquidCrystal สำหรับจอ LCD' },
    ],
    fun: [
      { title: 'Wokwi LCD1602 examples', desc: 'ดูตัวอย่างจอ LCD แสดงข้อความและค่าจากเซนเซอร์', url: 'https://docs.wokwi.com/parts/wokwi-lcd1602#simulator-examples', emoji: '🖥️', noLogin: true },
      { title: 'Wokwi New Arduino UNO', desc: 'เริ่มโปรเจกต์จำลอง LCD I2C หรือ OLED ด้วย Arduino UNO', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '🧪', noLogin: true },
    ],
    lessonNotes: {
      objectives: ['อธิบายประโยชน์ของจอแสดงผลในโครงงาน Arduino ได้', 'ต่อหรือจำลอง LCD I2C เพื่อแสดงข้อความและค่าจากเซนเซอร์ได้'],
      summary: ['LCD/OLED ทำให้โครงงานสื่อสารกับผู้ใช้ได้โดยไม่ต้องเปิด Serial Monitor', 'I2C ใช้สาย SDA/SCL ลดจำนวนขาที่ต้องใช้ แต่ต้องตรวจ address และไลบรารีให้ถูก'],
      activities: ['ให้เด็กปรับโครงงานเซนเซอร์เดิมให้แสดงค่าและสถานะบนจอ เช่น SAFE/ALERT'],
      checkQuestions: ['ถ้าจอติดไฟแต่ไม่แสดงข้อความ ควรตรวจอะไรบ้าง', 'ข้อความบนจอที่ดีควรมีลักษณะอย่างไร'],
      vocabulary: ['I2C', 'SDA', 'SCL', 'Address', 'Cursor'],
    },
    quiz: [
      { q: 'จอ LCD 16x2 หมายถึงอะไร?', options: ['2 บรรทัด บรรทัดละ 16 ตัวอักษร', '16 บรรทัด บรรทัดละ 2 ตัวอักษร', 'มี 16 สี', 'ใช้ไฟ 16 โวลต์'], answer: 0 },
      { q: 'I2C ใช้สายสัญญาณหลักใด?', options: ['SDA และ SCL', 'TRIG และ ECHO', 'TX และ RX เท่านั้น', 'VCC และ GND เท่านั้น'], answer: 0 },
      { q: 'ถ้า LCD I2C ไม่ขึ้นข้อความ แต่มีไฟหลังจอ ควรตรวจอะไร?', options: ['address, SDA/SCL, ไลบรารี และคำสั่งเริ่มต้น', 'สีของกล่องอุปกรณ์', 'ชื่อไฟล์รูปภาพ', 'จำนวนสมาชิกในกลุ่ม'], answer: 0 },
      { q: 'ข้อความบนจอที่ดีควรเป็นอย่างไร?', options: ['สั้น ชัด มีหน่วยกำกับ', 'ยาวเต็มจอเสมอ', 'ไม่มีหน่วยเพื่อประหยัดที่', 'เปลี่ยนเร็วมากจนอ่านไม่ทัน'], answer: 0 },
      { q: 'ข้อใดคือประโยชน์ของการใช้จอในโครงงาน?', options: ['ผู้ใช้เห็นสถานะหรือค่าที่วัดได้ทันที', 'ทำให้ไม่ต้องต่อวงจร', 'ทำให้ไม่ต้องเขียนโค้ด', 'ทำให้ sensor อ่านค่าเองโดยไม่ใช้ไฟ'], answer: 0 },
    ],
  },
  8: {
    intro: 'หน่วยปลายคอร์สให้เด็กใช้ความรู้ทั้งหมดสร้างโครงงานเล็กที่มีปัญหา วงจร โค้ด ตารางทดสอบ หลักฐาน และการนำเสนอแบบพร้อมประเมินจริง',
    videos: [yt('Arduino final project beginner presentation'), yt('Arduino project based learning classroom'), yt('Arduino ultrasonic parking sensor project')],
    files: [
      { title: 'ใบงานที่ 8: โครงงาน Arduino ปลายคอร์ส', url: '/worksheets/arduino/u8-capstone-project.html', source: 'Kru James', kind: 'worksheet', desc: 'ใบงานโครงงานปลายคอร์ส มีแบบฟอร์มปัญหา IPO แผนวงจร ตารางทดสอบ และ rubric ประเมิน' },
      { title: 'Arduino Project Hub', url: 'https://projecthub.arduino.cc/', source: 'Arduino', kind: 'web', desc: 'คลังไอเดียโครงงาน Arduino เพื่อใช้ดูแนวทางและปรับให้เหมาะกับระดับนักเรียน' },
      { title: '[เอกสาร #3] เรียนรู้และลองเล่น Arduino เบื้องต้น', url: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/97-2-arduino-1', source: 'ครูประภาส สุวรรณเพชร', kind: 'web', desc: 'เอกสารภาษาไทยที่มีรายการใบงานต่อยอดจำนวนมากสำหรับทำโครงงาน' },
    ],
    fun: [
      { title: 'Tinkercad Circuits: Capstone prototype', desc: 'วาดและทดสอบวงจรปลายคอร์สแบบลากวางก่อนต่อจริง', url: 'https://www.tinkercad.com/circuits', emoji: '🧱', noLogin: true },
      { title: 'Wokwi Arduino Simulator', desc: 'สร้างลิงก์โครงงานจำลองเพื่อส่งให้ครูตรวจและให้เพื่อนลองปรับค่า', url: 'https://wokwi.com/arduino', emoji: '🔗', noLogin: true },
    ],
    lessonNotes: {
      objectives: ['ออกแบบโครงงานจากปัญหาที่วัดผลได้', 'สร้างและทดสอบต้นแบบพร้อมหลักฐาน', 'นำเสนอผลและข้อปรับปรุงอย่างมีเหตุผล'],
      summary: ['โครงงาน Arduino ที่ดีเริ่มจากปัญหา มี input-process-output ชัด ทดสอบด้วยข้อมูล และอธิบายข้อจำกัดได้', 'คะแนนควรดูทั้งวงจร โค้ด กระบวนการทดสอบ ความปลอดภัย และการนำเสนอ'],
      activities: ['แบ่งกลุ่ม 2-3 คน ทำโครงงาน 1 ชิ้น ส่งลิงก์จำลอง ภาพวงจรจริง ตารางทดสอบ และนำเสนอ 3 นาที'],
      checkQuestions: ['หลักฐานใดพิสูจน์ว่าโครงงานทำงานตามเป้าหมาย', 'ถ้าให้เวลาปรับปรุงอีก 1 สัปดาห์ กลุ่มจะปรับส่วนใดก่อน'],
      vocabulary: ['Prototype', 'Rubric', 'Evidence', 'Iteration', 'Threshold'],
    },
    quiz: [
      { q: 'โครงงานที่ดีควรเริ่มจากอะไร?', options: ['ปัญหาที่ชัดและวัดผลได้', 'เลือกอุปกรณ์ที่ดูสวยก่อน', 'คัดลอกโค้ดโดยไม่เข้าใจ', 'ตั้งชื่อให้ยาวที่สุด'], answer: 0 },
      { q: 'หลักฐานใดเหมาะกับการประเมินโครงงาน Arduino?', options: ['วงจร โค้ด ตารางทดสอบ และข้อปรับปรุง', 'ชื่อกลุ่มอย่างเดียว', 'สีสายไฟอย่างเดียว', 'จำนวนรูปภาพเท่านั้น'], answer: 0 },
      { q: 'Iteration ในโครงงานหมายถึงอะไร?', options: ['การปรับปรุงจากผลทดสอบซ้ำเป็นรอบ ๆ', 'การลบโค้ดทั้งหมด', 'การเลือกสี LED', 'การปิดโปรแกรม'], answer: 0 },
      { q: 'ถ้าโครงงานเตือนผิดบ่อย ควรทำอะไร?', options: ['ดูข้อมูลทดสอบและปรับ threshold หรือวงจร', 'เปลี่ยนชื่อโครงงาน', 'ไม่ต้องทดสอบอีก', 'ถอด sensor ออกเสมอ'], answer: 0 },
      { q: 'การนำเสนอที่ดีควรอธิบายอะไร?', options: ['ปัญหา วิธีทำ ผลทดสอบ และสิ่งที่จะปรับปรุง', 'เฉพาะชื่อสมาชิก', 'เฉพาะราคาบอร์ด', 'เฉพาะสีของจอ'], answer: 0 },
    ],
  },
};

Object.entries(arduinoExpandedMediaExtras).forEach(([unitNo, extra]) => {
  extendArduinoUnit(Number(unitNo), extra);
});

const electronicsTeacherGuideFile: LearningFile = {
  title: 'คู่มือคอร์สฉบับครูเจมส์: อิเล็กทรอนิกส์เบื้องต้น',
  url: '/worksheets/electronics/electronics-course-outline.html',
  source: 'Kru James',
  kind: 'worksheet',
  desc: 'คู่มือสอนที่เรียบเรียงใหม่เป็นภาษาของเราเอง ใช้คู่กับสไลด์ ใบงาน และกิจกรรมในเว็บ โดยไม่แนบไฟล์ต้นฉบับของผู้อื่น',
};

const electronicsWorksheet = (unitNo: number, title: string, url: string, desc: string): LearningFile => ({
  title: `ใบงานที่ ${unitNo}: ${title}`,
  url,
  source: 'Kru James',
  kind: 'worksheet',
  desc,
});

unitExtras['electronics-basic'] = {
  1: {
    intro: 'เริ่มจากให้เด็กมองเห็นว่าอิเล็กทรอนิกส์ไม่ได้อยู่ไกลตัว แต่ซ่อนอยู่ในโทรศัพท์ รีโมต ไฟจราจร ของเล่น เครื่องใช้ไฟฟ้า และบอร์ด Arduino ทุกชิ้นมีแนวคิด input-process-output และต้องใช้ไฟฟ้าอย่างปลอดภัย',
    videos: [
      yt('อิเล็กทรอนิกส์เบื้องต้น ในชีวิตประจำวัน นักเรียนมัธยม'),
      yt('analog digital signal explained Thai'),
      yt('ไฟฟ้าและอิเล็กทรอนิกส์พื้นฐานสำหรับเด็ก'),
    ],
    files: [
      electronicsTeacherGuideFile,
      electronicsWorksheet(1, 'สำรวจอุปกรณ์อิเล็กทรอนิกส์รอบตัว', '/worksheets/electronics/u1-everyday-systems.html', 'ให้นักเรียนเลือกอุปกรณ์จริง 3 ชิ้น แล้ววิเคราะห์ input-process-output สัญญาณ และกฎความปลอดภัยก่อนใช้งาน'),
    ],
    fun: [
      { title: 'PhET Circuit Construction Kit: DC', desc: 'ทดลองต่อวงจรถ่านไฟฉาย สายไฟ หลอดไฟ และสวิตช์ เห็นกระแสไฟไหลแบบภาพจำลอง', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html', emoji: '🔋', noLogin: true },
      { title: 'Tinkercad Circuits', desc: 'พื้นที่จำลองวงจรแบบลากวาง เหมาะสำหรับต่อยอดก่อนใช้ Arduino จริง', url: 'https://www.tinkercad.com/circuits', emoji: '🧱', noLogin: true },
    ],
    lessonNotes: {
      objectives: [
        'อธิบายความหมายของอิเล็กทรอนิกส์และยกตัวอย่างอุปกรณ์รอบตัวได้',
        'แยก input, process และ output ของอุปกรณ์ใกล้ตัวได้',
        'เปรียบเทียบสัญญาณแอนะล็อกกับดิจิทัลจากสถานการณ์จริงได้',
        'บอกข้อควรระวังในการทดลองวงจรไฟฟ้ากระแสตรงแรงดันต่ำได้',
      ],
      summary: [
        'อิเล็กทรอนิกส์คือการควบคุมการไหลของไฟฟ้าเพื่อรับข้อมูล ประมวลผล และแสดงผล',
        'อุปกรณ์อิเล็กทรอนิกส์ส่วนใหญ่มี input เช่น ปุ่มหรือเซนเซอร์ มี process เช่น วงจรหรือไมโครคอนโทรลเลอร์ และมี output เช่น ไฟ เสียง หรือการเคลื่อนไหว',
        'แอนะล็อกเปลี่ยนค่าได้ต่อเนื่อง ส่วนดิจิทัลใช้ระดับชัดเจน เช่น 0/1 หรือ LOW/HIGH',
        'การทดลองควรเริ่มจากแหล่งจ่ายไฟต่ำ ตรวจขั้วก่อนต่อวงจร และไม่ทดลองกับไฟบ้านโดยเด็ดขาด',
      ],
      activities: [
        'ครูนำอุปกรณ์จริงหรือภาพอุปกรณ์ 5 ชิ้นให้เด็กระบุ input-process-output',
        'ให้นักเรียนจับคู่ภาพสถานการณ์กับคำว่าแอนะล็อกหรือดิจิทัล เช่น เสียงคนพูด ระดับแสง สวิตช์เปิดปิด รหัสผ่าน',
        'ใช้ใบงานที่ 1 ให้เด็กเลือกอุปกรณ์หนึ่งชิ้น แล้ววาดผังการทำงานอย่างง่าย',
      ],
      checkQuestions: [
        'รีโมตทีวีมี input, process และ output คืออะไร',
        'ทำไมปุ่มเปิดปิดจึงมักถือเป็นสัญญาณดิจิทัล',
        'ก่อนต่อวงจรจริง นักเรียนควรตรวจอะไรบ้างเพื่อความปลอดภัย',
      ],
      vocabulary: ['electronics', 'input', 'process', 'output', 'analog', 'digital', 'sensor', 'actuator'],
    },
    quiz: [
      { q: 'ข้อใดเป็นตัวอย่างของ input ในระบบอิเล็กทรอนิกส์', options: ['LED สว่าง', 'ปุ่มกด', 'เสียงจากลำโพง', 'มอเตอร์หมุน'], answer: 1, explain: 'input คือสิ่งที่ระบบรับเข้ามา เช่น ปุ่มกด เซนเซอร์ หรือสัญญาณจากผู้ใช้' },
      { q: 'สัญญาณดิจิทัลเหมาะกับข้อใดมากที่สุด', options: ['ระดับแสงที่ค่อย ๆ เปลี่ยน', 'อุณหภูมิที่เพิ่มทีละน้อย', 'สถานะเปิดหรือปิด', 'เสียงพูดตามธรรมชาติ'], answer: 2, explain: 'ดิจิทัลมีระดับชัดเจน เช่น 0/1 เปิด/ปิด HIGH/LOW' },
      { q: 'ข้อใดเป็น output ของไฟจราจร', options: ['ปุ่มคนข้ามถนน', 'วงจรควบคุมเวลา', 'ไฟสีแดง เหลือง เขียว', 'สายไฟในตู้ควบคุม'], answer: 2 },
      { q: 'เหตุใดจึงไม่ควรทดลองวงจรกับไฟบ้าน', options: ['เพราะไฟบ้านแรงดันสูงและอันตราย', 'เพราะ LED จะสว่างน้อย', 'เพราะต่อวงจรง่ายเกินไป', 'เพราะไม่มีสัญญาณดิจิทัล'], answer: 0 },
      { q: 'ข้อใดอธิบายอิเล็กทรอนิกส์ได้เหมาะสม', options: ['การตกแต่งคอมพิวเตอร์ให้สวย', 'การควบคุมไฟฟ้าเพื่อให้วงจรทำงานตามต้องการ', 'การใช้ไฟฟ้าเฉพาะในบ้าน', 'การเขียนรายงานด้วยคอมพิวเตอร์'], answer: 1 },
    ],
  },
  2: {
    intro: 'หน่วยนี้ทำให้เด็กเข้าใจไฟฟ้าพื้นฐานแบบจับต้องได้: แหล่งจ่ายไฟให้พลังงาน ตัวต้านทานช่วยจำกัดกระแส LED ต้องต่อถูกขั้ว และกฎของโอห์มช่วยคำนวณให้วงจรปลอดภัยก่อนทดลองจริง',
    videos: [
      yt('กฎของโอห์ม ตัวต้านทาน LED เบื้องต้น ภาษาไทย'),
      yt('อ่านค่าสีตัวต้านทาน สำหรับนักเรียน'),
      yt('ต่อวงจร LED กับ resistor Arduino beginner Thai'),
    ],
    files: [
      electronicsTeacherGuideFile,
      electronicsWorksheet(2, 'ตัวต้านทาน LED และกฎของโอห์ม', '/worksheets/electronics/u2-resistor-led-ohm.html', 'ฝึกอ่านค่าตัวต้านทาน คำนวณกระแส LED และทดลองเปลี่ยนค่าความต้านทานเพื่อดูผลต่อความสว่าง'),
    ],
    fun: [
      { title: 'PhET Circuit Construction Kit: DC', desc: 'ทดลองต่อวงจรแบตเตอรี่ ตัวต้านทาน และหลอดไฟเพื่อดูความสัมพันธ์ของแรงดัน กระแส และความต้านทาน', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html', emoji: '💡', noLogin: true },
      { title: 'Tinkercad Circuits: LED + Resistor', desc: 'จำลอง LED กับตัวต้านทานก่อนลงมือจริง เหมาะสำหรับฝึกอ่านขั้วและเลือกค่า R', url: 'https://www.tinkercad.com/circuits', emoji: '🧪', noLogin: true },
      { title: 'Wokwi Arduino UNO', desc: 'เริ่มโปรเจกต์ Arduino UNO เพื่อทดลอง Blink และต่อยอดเรื่อง LED', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '🔌', noLogin: true },
    ],
    lessonNotes: {
      objectives: [
        'อธิบายหน้าที่ของแหล่งจ่ายไฟ ตัวต้านทาน และ LED ได้',
        'ใช้ความสัมพันธ์ V = I x R เพื่อประมาณค่ากระแสหรือความต้านทานได้',
        'เลือกตัวต้านทานจำกัดกระแส LED ในวงจรพื้นฐานได้',
        'ต่อ LED ถูกขั้วและตรวจวงจรก่อนจ่ายไฟได้',
      ],
      summary: [
        'แรงดันไฟฟ้าเปรียบเหมือนแรงผลักให้ประจุเคลื่อนที่ กระแสคือปริมาณไฟฟ้าที่ไหล และความต้านทานคือสิ่งที่ขวางการไหล',
        'กฎของโอห์ม V = I x R ใช้คาดคะเนค่าต่าง ๆ ก่อนทดลองจริง',
        'LED ยอมให้กระแสไหลทางเดียวและต้องมีตัวต้านทานจำกัดกระแสเพื่อป้องกันเสียหาย',
        'ตัวต้านทานยิ่งค่ามาก กระแสมักยิ่งน้อย และ LED มักสว่างลดลง',
      ],
      activities: [
        'ครูสาธิตวงจร LED 1 ดวงกับตัวต้านทาน 220, 330 และ 1k โอห์ม แล้วให้นักเรียนบันทึกความสว่าง',
        'ให้นักเรียนคำนวณกระแสโดยประมาณจากแรงดันและค่าตัวต้านทานที่กำหนด',
        'ใช้ใบงานที่ 2 ให้เด็กวาดวงจรก่อนต่อจริง แล้วแลกกับเพื่อนเพื่อตรวจขั้ว LED',
      ],
      checkQuestions: [
        'ถ้าเพิ่มค่าตัวต้านทาน กระแสในวงจรมักเปลี่ยนอย่างไร',
        'ทำไม LED จึงต้องต่อร่วมกับตัวต้านทาน',
        'สูตร V = I x R ช่วยลดความเสี่ยงในการทดลองอย่างไร',
      ],
      vocabulary: ['voltage', 'current', 'resistance', 'Ohm law', 'LED', 'polarity', 'series circuit'],
    },
    quiz: [
      { q: 'สูตรของกฎโอห์มคือข้อใด', options: ['V = I x R', 'I = V x R', 'R = V x I', 'P = V + I'], answer: 0 },
      { q: 'ตัวต้านทานในวงจร LED มีหน้าที่สำคัญอย่างไร', options: ['เพิ่มเสียง', 'จำกัดกระแส', 'เก็บข้อมูล', 'เปลี่ยนไฟ DC เป็น AC'], answer: 1 },
      { q: 'ถ้า R มากขึ้น โดยแรงดันเท่าเดิม กระแสจะเป็นอย่างไร', options: ['มากขึ้นเสมอ', 'น้อยลง', 'ไม่เกี่ยวข้องกัน', 'กลายเป็นศูนย์ทันที'], answer: 1 },
      { q: 'LED มีคุณสมบัติใดที่ต้องระวังเป็นพิเศษ', options: ['ต้องต่อถูกขั้ว', 'ใช้แทนแบตเตอรี่ได้', 'ต่อกลับขั้วแล้วสว่างขึ้น', 'ไม่ต้องใช้ตัวต้านทาน'], answer: 0 },
      { q: 'หน่วยของความต้านทานคืออะไร', options: ['โวลต์', 'แอมแปร์', 'โอห์ม', 'วัตต์'], answer: 2 },
    ],
  },
  3: {
    intro: 'เมื่อเด็กเริ่มรู้จักไฟและ LED แล้ว หน่วยนี้จะขยายเป็นคลังอุปกรณ์: ตัวเก็บประจุ ไดโอด สวิตช์ รีเลย์ ทรานซิสเตอร์ เซนเซอร์ และมอเตอร์ พร้อมมองว่าแต่ละชิ้นทำหน้าที่เป็น input, output หรือส่วนควบคุมของระบบ',
    videos: [
      yt('อุปกรณ์อิเล็กทรอนิกส์พื้นฐาน capacitor diode transistor relay sensor motor Thai'),
      yt('ทรานซิสเตอร์ทำงานอย่างไร สำหรับผู้เริ่มต้น'),
      yt('เซนเซอร์และมอเตอร์ Arduino เบื้องต้น ภาษาไทย'),
    ],
    files: [
      electronicsTeacherGuideFile,
      electronicsWorksheet(3, 'รู้จักอุปกรณ์และเลือกใช้อย่างปลอดภัย', '/worksheets/electronics/u3-components-safety.html', 'ตารางสรุปหน้าที่ สัญลักษณ์ ข้อควรระวัง และการจัดกลุ่มอุปกรณ์เป็น input-output-control'),
    ],
    fun: [
      { title: 'Tinkercad Circuits: Components Lab', desc: 'สำรวจอุปกรณ์หลากหลายแบบ เช่น ปุ่มกด เซนเซอร์ มอเตอร์ และ LED ในวงจรจำลอง', url: 'https://www.tinkercad.com/circuits', emoji: '🧰', noLogin: true },
      { title: 'Wokwi Arduino UNO + Sensors', desc: 'เริ่มโปรเจกต์ Arduino แล้วเพิ่มเซนเซอร์หรือมอเตอร์เพื่อเข้าใจ input-output', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '🤖', noLogin: true },
    ],
    lessonNotes: {
      objectives: [
        'บอกหน้าที่พื้นฐานของ capacitor, diode, transistor, relay, sensor และ motor ได้',
        'จัดกลุ่มอุปกรณ์เป็น input, output หรือส่วนควบคุมได้',
        'อธิบายเหตุผลที่บางอุปกรณ์ต้องระวังขั้วหรือกระแสได้',
        'เลือกอุปกรณ์ให้เหมาะกับสถานการณ์ง่าย ๆ เช่น ไฟเตือน พัดลมอัตโนมัติ หรือระบบตรวจแสงได้',
      ],
      summary: [
        'ตัวเก็บประจุเก็บและคายประจุ ช่วยหน่วงเวลา กรองสัญญาณ หรือทำให้ไฟเรียบขึ้นในบางวงจร',
        'ไดโอดยอมให้กระแสไหลทางเดียว ส่วน LED เป็นไดโอดชนิดหนึ่งที่ให้แสง',
        'ทรานซิสเตอร์ใช้เป็นสวิตช์อิเล็กทรอนิกส์หรือขยายสัญญาณ จึงช่วยให้อุปกรณ์กำลังต่ำควบคุมโหลดที่ต้องใช้กระแสมากกว่าได้',
        'เซนเซอร์รับข้อมูลจากสิ่งแวดล้อม ส่วนมอเตอร์ รีเลย์ LED และลำโพงมักเป็น output หรือ actuator',
      ],
      activities: [
        'จัดโต๊ะอุปกรณ์หรือรูปภาพอุปกรณ์หลายชนิด แล้วให้เด็กติดป้ายหน้าที่และข้อควรระวัง',
        'ให้นักเรียนออกแบบระบบง่าย ๆ 1 ระบบ เช่น ไฟเปิดเมื่อมืด โดยระบุ input-process-output และอุปกรณ์ที่ใช้',
        'ใช้ใบงานที่ 3 ให้เด็กเปรียบเทียบอุปกรณ์ที่ต่อผิดขั้วแล้วมีปัญหากับอุปกรณ์ที่ไม่ต้องสนใจขั้วมากนัก',
      ],
      checkQuestions: [
        'เซนเซอร์แสงควรจัดเป็น input หรือ output เพราะอะไร',
        'ทำไมมอเตอร์บางตัวจึงไม่ควรต่อเข้าขา Arduino โดยตรง',
        'รีเลย์ต่างจากสวิตช์ธรรมดาอย่างไรในมุมมองระบบควบคุม',
      ],
      vocabulary: ['capacitor', 'diode', 'transistor', 'relay', 'sensor', 'motor', 'actuator', 'polarity'],
    },
    quiz: [
      { q: 'อุปกรณ์ใดมักใช้รับข้อมูลจากสิ่งแวดล้อม', options: ['เซนเซอร์', 'ลำโพง', 'LED', 'มอเตอร์'], answer: 0 },
      { q: 'ไดโอดมีคุณสมบัติเด่นข้อใด', options: ['เก็บข้อมูล', 'ยอมให้กระแสไหลทางเดียวเป็นหลัก', 'สร้างเสียง', 'เปลี่ยนสีสายไฟ'], answer: 1 },
      { q: 'ทรานซิสเตอร์มักใช้ทำหน้าที่ใดในวงจรควบคุม', options: ['เป็นสวิตช์หรือขยายสัญญาณ', 'เป็นแบตเตอรี่', 'เป็นจอภาพ', 'เป็นสาย USB'], answer: 0 },
      { q: 'มอเตอร์จัดเป็นอุปกรณ์ประเภทใดในระบบ input-process-output', options: ['input', 'process เท่านั้น', 'output/actuator', 'แหล่งข้อมูล'], answer: 2 },
      { q: 'ข้อใดเป็นเหตุผลที่ต้องอ่าน datasheet หรือข้อมูลอุปกรณ์ก่อนใช้', options: ['เพื่อรู้ขั้ว แรงดัน และกระแสที่เหมาะสม', 'เพื่อเลือกสีให้สวยเท่านั้น', 'เพื่อทำให้โค้ดยาวขึ้น', 'เพื่อปิดวงจรไม่ให้ทำงาน'], answer: 0 },
    ],
  },
  4: {
    intro: 'หน่วยนี้ทำให้เด็กเห็นว่าวงจรแอนะล็อกคือวงจรที่ค่าต่าง ๆ เปลี่ยนต่อเนื่อง เช่น วงจรกรอง RC วงจรเรียงกระแส วงจรขยาย และวงจรปรับแรงดัน ซึ่งเป็นพื้นฐานสำคัญก่อนเข้าใจแหล่งจ่ายไฟและการอ่านสัญญาณเซนเซอร์',
    videos: [
      yt('วงจร RC filter เบื้องต้น ภาษาไทย'),
      yt('วงจรเรียงกระแส diode bridge ภาษาไทย'),
      yt('op amp transistor amplifier beginner Thai'),
    ],
    files: [
      electronicsTeacherGuideFile,
      electronicsWorksheet(4, 'ทดลองวงจรแอนะล็อก RC และเรียงกระแส', '/worksheets/electronics/u4-analog-circuits.html', 'ให้เด็กสังเกตผลของตัวต้านทานและตัวเก็บประจุต่อการเปลี่ยนสัญญาณ และอธิบายการแปลงไฟ AC เป็น DC ในภาพรวม'),
    ],
    fun: [
      { title: 'Falstad Circuit Simulator', desc: 'จำลองวงจรแอนะล็อกแบบเห็นกระแสและแรงดัน เหมาะกับ RC filter, diode และ amplifier', url: 'https://www.falstad.com/circuit/', emoji: '📈', noLogin: true },
      { title: 'PhET Circuit Construction Kit: DC', desc: 'ใช้ทบทวนวงจรพื้นฐานก่อนเข้าสู่วงจรแอนะล็อกที่ซับซ้อนขึ้น', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html', emoji: '🔎', noLogin: true },
    ],
    lessonNotes: {
      objectives: [
        'อธิบายแนวคิดสัญญาณแอนะล็อกและการเปลี่ยนค่าอย่างต่อเนื่องได้',
        'บอกหน้าที่ของวงจรกรอง RC วงจรเรียงกระแส วงจรขยาย และวงจรปรับแรงดันได้ในระดับพื้นฐาน',
        'อ่านภาพวงจรง่าย ๆ แล้วระบุส่วนที่ทำหน้าที่กรอง เรียงกระแส หรือขยายสัญญาณได้',
        'เชื่อมโยงวงจรแอนะล็อกกับการอ่านค่าเซนเซอร์และระบบ Arduino ได้',
      ],
      summary: [
        'วงจร RC ใช้ตัวต้านทานและตัวเก็บประจุร่วมกันเพื่อหน่วงเวลา กรองสัญญาณ หรือทำให้สัญญาณเปลี่ยนนุ่มขึ้น',
        'วงจรเรียงกระแสใช้ไดโอดเปลี่ยนไฟสลับให้เป็นไฟทางเดียว ก่อนกรองให้เรียบขึ้นด้วยตัวเก็บประจุ',
        'วงจรขยายช่วยทำให้สัญญาณเล็กมีขนาดใหญ่พอจะนำไปใช้ต่อ เช่น เสียงหรือสัญญาณจากเซนเซอร์',
        'วงจรปรับแรงดันช่วยให้แรงดันคงที่มากขึ้น ทำให้อุปกรณ์อิเล็กทรอนิกส์ทำงานเสถียร',
      ],
      activities: [
        'ครูเปิด Falstad ให้เด็กดูการไหลของกระแสในวงจร RC แล้วเปลี่ยนค่า R หรือ C เพื่อเปรียบเทียบผล',
        'ให้เด็กวาดภาพก่อนและหลังการเรียงกระแสด้วยคำของตนเอง โดยไม่ต้องลงคณิตศาสตร์หนัก',
        'ใช้ใบงานที่ 4 ให้เด็กสรุปว่าแต่ละวงจรช่วยแก้ปัญหาอะไรในชีวิตจริง',
      ],
      checkQuestions: [
        'วงจรกรองช่วยให้สัญญาณเปลี่ยนไปอย่างไร',
        'ไดโอดในวงจรเรียงกระแสมีบทบาทสำคัญอย่างไร',
        'ทำไมวงจรขยายจึงจำเป็นเมื่อสัญญาณจากเซนเซอร์มีขนาดเล็ก',
      ],
      vocabulary: ['analog circuit', 'RC filter', 'rectifier', 'amplifier', 'op amp', 'regulator', 'ripple'],
    },
    quiz: [
      { q: 'วงจร RC ประกอบด้วยอุปกรณ์หลักใด', options: ['ตัวต้านทานและตัวเก็บประจุ', 'มอเตอร์และลำโพง', 'คีย์บอร์ดและเมาส์', 'แบตเตอรี่สองก้อนเท่านั้น'], answer: 0 },
      { q: 'วงจรเรียงกระแสมีหน้าที่ใด', options: ['ช่วยแปลงไฟสลับให้เป็นไฟทางเดียว', 'ทำให้เสียงดังขึ้นเสมอ', 'เก็บรหัสผ่าน', 'วาดรูปวงจรอัตโนมัติ'], answer: 0 },
      { q: 'วงจรขยายมีประโยชน์อย่างไร', options: ['ทำให้สัญญาณเล็กมีขนาดใหญ่ขึ้น', 'ลดจำนวนสายไฟให้เหลือศูนย์', 'ทำให้ไฟบ้านปลอดภัยเสมอ', 'เปลี่ยนแบตเตอรี่เป็นเซนเซอร์'], answer: 0 },
      { q: 'ตัวเก็บประจุในแหล่งจ่ายไฟหลังวงจรเรียงกระแสช่วยเรื่องใด', options: ['ทำให้แรงดันเรียบขึ้น', 'ทำให้ไดโอดเปลี่ยนสี', 'ทำให้มอเตอร์ไม่ต้องใช้ไฟ', 'ทำให้โค้ดสั้นลง'], answer: 0 },
      { q: 'สัญญาณแอนะล็อกมีลักษณะเด่นข้อใด', options: ['เปลี่ยนค่าได้ต่อเนื่อง', 'มีได้เฉพาะ 0 และ 1', 'ไม่เกี่ยวกับไฟฟ้า', 'ใช้ได้กับข้อความเท่านั้น'], answer: 0 },
    ],
  },
  5: {
    intro: 'หน่วยนี้เปลี่ยนจากสัญญาณต่อเนื่องมาเป็นโลก 0 และ 1 เด็กจะเรียนเลขฐานสอง ตารางความจริง ลอจิกเกต และการรวมเกตเป็นวงจรคอมบิเนชัน ซึ่งเชื่อมตรงกับ Arduino เพราะคำสั่ง digitalRead และ digitalWrite ก็ทำงานบนแนวคิด HIGH/LOW',
    videos: [
      yt('เลขฐานสอง และ logic gate ภาษาไทย'),
      yt('AND OR NOT gate truth table Thai'),
      yt('digitalRead digitalWrite Arduino Thai'),
    ],
    files: [
      electronicsTeacherGuideFile,
      electronicsWorksheet(5, 'เลขฐานสอง ตารางความจริง และลอจิกเกต', '/worksheets/electronics/u5-digital-logic.html', 'ฝึกแปลงเลขฐานสอง อ่านตารางความจริง และออกแบบเงื่อนไขเปิดไฟด้วย AND OR NOT'),
    ],
    fun: [
      { title: 'CircuitVerse Digital Circuit Simulator', desc: 'จำลองวงจรดิจิทัล ลอจิกเกต ตารางความจริง และวงจรคอมบิเนชันได้ในเว็บ', url: 'https://circuitverse.org/simulator', emoji: '🔢', noLogin: true },
      { title: 'Wokwi Arduino UNO: digitalRead/digitalWrite', desc: 'ทดลองปุ่มกดและ LED ด้วยค่า HIGH/LOW เพื่อเชื่อมลอจิกกับโค้ด Arduino', url: 'https://wokwi.com/projects/new/arduino-uno', emoji: '💻', noLogin: true },
    ],
    lessonNotes: {
      objectives: [
        'แปลงเลขฐานสองระดับง่ายและอธิบายแนวคิดบิตได้',
        'อ่านตารางความจริงของ AND, OR และ NOT ได้',
        'เลือกใช้ลอจิกเกตให้ตรงกับเงื่อนไขง่าย ๆ ในชีวิตจริงได้',
        'เชื่อมโยงแนวคิด HIGH/LOW กับคำสั่ง Arduino digitalRead และ digitalWrite ได้',
      ],
      summary: [
        'ระบบดิจิทัลใช้ค่าที่แยกชัดเจน เช่น 0/1, LOW/HIGH, false/true',
        'AND จะจริงเมื่อเงื่อนไขทุกข้อจริง OR จะจริงเมื่อมีอย่างน้อยหนึ่งข้อจริง และ NOT ใช้กลับค่าจริงเป็นเท็จหรือเท็จเป็นจริง',
        'ตารางความจริงช่วยตรวจว่าทุกกรณีของ input ให้ output เป็นอย่างไร',
        'วงจรคอมบิเนชันคือวงจรที่ output ขึ้นกับ input ปัจจุบัน เช่น ระบบเปิดไฟเมื่อมืดและมีคนอยู่',
      ],
      activities: [
        'ให้เด็กเล่นบทบาทเป็นสัญญาณ A และ B แล้วทั้งห้องตัดสิน output ของ AND/OR/NOT ด้วยบัตร 0/1',
        'ใช้ CircuitVerse สร้าง AND gate และ OR gate แล้วสลับ input เพื่อเทียบกับตารางความจริง',
        'ใช้ใบงานที่ 5 ออกแบบเงื่อนไขระบบเตือน เช่น ถ้าประตูเปิดและเป็นเวลากลางคืนให้ไฟเตือนติด',
      ],
      checkQuestions: [
        'AND ต่างจาก OR อย่างไร',
        'ทำไมตารางความจริงช่วยลดความผิดพลาดในการออกแบบวงจร',
        'ปุ่มกดบน Arduino ที่อ่านเป็น HIGH/LOW คล้ายกับแนวคิดใดในวงจรดิจิทัล',
      ],
      vocabulary: ['binary', 'bit', 'truth table', 'AND', 'OR', 'NOT', 'HIGH', 'LOW', 'combinational circuit'],
    },
    quiz: [
      { q: 'เลขฐานสองใช้สัญลักษณ์หลักใด', options: ['0 และ 1', '0 ถึง 9', 'A ถึง Z', 'เฉพาะเลขคู่'], answer: 0 },
      { q: 'AND gate จะให้ output เป็น 1 เมื่อใด', options: ['เมื่อ input ทุกตัวเป็น 1', 'เมื่อ input อย่างน้อยหนึ่งตัวเป็น 1', 'เมื่อ input ทุกตัวเป็น 0', 'สุ่มค่าเอง'], answer: 0 },
      { q: 'OR gate จะให้ output เป็น 1 เมื่อใด', options: ['เมื่อมี input อย่างน้อยหนึ่งตัวเป็น 1', 'เมื่อ input ทุกตัวเป็น 0 เท่านั้น', 'เมื่อไม่มีไฟเลี้ยง', 'เมื่อกด reset'], answer: 0 },
      { q: 'NOT gate ทำหน้าที่อย่างไร', options: ['กลับค่าจาก 0 เป็น 1 หรือจาก 1 เป็น 0', 'รวมเลขทุกตัว', 'เก็บประจุ', 'เพิ่มแรงดันเสมอ'], answer: 0 },
      { q: 'digitalRead() บน Arduino อ่านค่าแบบใดโดยทั่วไป', options: ['HIGH หรือ LOW', 'รูปภาพ', 'เสียงเพลง', 'ไฟล์ PDF'], answer: 0 },
    ],
  },
  6: {
    intro: 'หน่วยสุดท้ายทำให้เด็กพร้อมทำงานจริง: ใช้มัลติมิเตอร์อย่างถูกโหมด ตรวจวงจรอย่างเป็นระบบ เข้าใจกฎของเคอร์ชอฟฟ์ในระดับพื้นฐาน และแก้ปัญหาแบบมีหลักฐาน ไม่เดาสุ่มเมื่อวงจรไม่ทำงาน',
    videos: [
      yt('การใช้มัลติมิเตอร์ วัดแรงดัน กระแส ความต้านทาน ภาษาไทย'),
      yt('กฎของเคอร์ชอฟฟ์ เบื้องต้น วงจรไฟฟ้า'),
      yt('debug circuit electronics beginner Thai'),
    ],
    files: [
      electronicsTeacherGuideFile,
      electronicsWorksheet(6, 'มัลติมิเตอร์ กฎของเคอร์ชอฟฟ์ และการตรวจวงจร', '/worksheets/electronics/u6-multimeter-kirchhoff.html', 'ฝึกเลือกโหมดวัด วางสายวัดให้ถูกตำแหน่ง บันทึกค่า และใช้ checklist แก้ปัญหาวงจรไม่ทำงาน'),
    ],
    fun: [
      { title: 'PhET Circuit Construction Kit: DC', desc: 'ใช้วัดค่าในวงจรจำลองและฝึกคิดเรื่องแรงดันกับกระแสก่อนจับมัลติมิเตอร์จริง', url: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html', emoji: '📏', noLogin: true },
      { title: 'Falstad Circuit Simulator', desc: 'ดูแรงดันและกระแสในแต่ละจุดของวงจร ช่วยอธิบายกฎของเคอร์ชอฟฟ์แบบเห็นภาพ', url: 'https://www.falstad.com/circuit/', emoji: '🧭', noLogin: true },
      { title: 'Tinkercad Circuits: Troubleshooting', desc: 'จำลองวงจรแล้วลองสลับสาย/ปรับค่า เพื่อฝึกหาสาเหตุเมื่อวงจรไม่ทำงาน', url: 'https://www.tinkercad.com/circuits', emoji: '🛠️', noLogin: true },
    ],
    lessonNotes: {
      objectives: [
        'เลือกโหมดมัลติมิเตอร์สำหรับวัดแรงดัน ความต้านทาน และตรวจความต่อเนื่องได้',
        'อธิบายแนวคิดกฎกระแสและกฎแรงดันของเคอร์ชอฟฟ์ในภาษาง่าย ๆ ได้',
        'ตรวจวงจรไม่ทำงานด้วยลำดับที่เป็นระบบ เช่น ไฟเลี้ยง ขั้ว สาย โค้ด และอุปกรณ์',
        'บันทึกหลักฐานการทดลองและสรุปสาเหตุของปัญหาได้',
      ],
      summary: [
        'มัลติมิเตอร์ต้องเลือกโหมดให้ตรงกับสิ่งที่จะวัด และต้องระวังตำแหน่งสายวัดโดยเฉพาะการวัดกระแส',
        'กฎกระแสของเคอร์ชอฟฟ์บอกว่า กระแสที่ไหลเข้าจุดรวมเท่ากับกระแสที่ไหลออกจากจุดรวมนั้น',
        'กฎแรงดันของเคอร์ชอฟฟ์บอกว่า ผลรวมแรงดันรอบวงปิดสัมพันธ์กันและช่วยตรวจความสมเหตุสมผลของวงจร',
        'การแก้วงจรควรไล่จากแหล่งจ่ายไฟ สายไฟ ขั้วอุปกรณ์ ค่าอุปกรณ์ จุดต่อ และคำสั่งควบคุม',
      ],
      activities: [
        'ครูสาธิตการวัดแรงดันแบตเตอรี่และการตรวจสายขาดด้วยโหมด continuity',
        'ให้นักเรียนใช้ใบงานที่ 6 วัดค่าจำลองหรือค่าจริง แล้วบันทึกว่าค่าที่วัดตรงกับที่คาดไว้หรือไม่',
        'จัดโจทย์วงจรผิด 3 แบบ เช่น LED กลับขั้ว สาย GND หลุด ตัวต้านทานผิดค่า ให้เด็กใช้ checklist หาเหตุผล',
      ],
      checkQuestions: [
        'ก่อนวัดความต้านทาน ควรทำให้วงจรอยู่ในสภาพใด',
        'ทำไมการวัดกระแสจึงเสี่ยงกว่าการวัดแรงดันถ้าตั้งโหมดผิด',
        'เมื่อ LED ไม่ติด ควรตรวจอะไรเป็นลำดับแรก ๆ',
      ],
      vocabulary: ['multimeter', 'voltage mode', 'resistance mode', 'continuity', 'Kirchhoff current law', 'Kirchhoff voltage law', 'troubleshooting'],
    },
    quiz: [
      { q: 'มัลติมิเตอร์โหมด V ใช้ทำอะไร', options: ['วัดแรงดันไฟฟ้า', 'วัดความยาวสายไฟ', 'เปิดโปรแกรม Arduino', 'เปลี่ยนสี LED'], answer: 0 },
      { q: 'โหมด continuity มีประโยชน์อย่างไร', options: ['ตรวจว่าสายหรือจุดต่อเชื่อมถึงกันหรือไม่', 'เพิ่มแรงดัน', 'เขียนโค้ดให้สั้นลง', 'เปลี่ยนไฟ AC เป็น DC'], answer: 0 },
      { q: 'กฎกระแสของเคอร์ชอฟฟ์กล่าวโดยสรุปว่าอย่างไร', options: ['กระแสเข้าและออกที่จุดรวมต้องสมดุลกัน', 'แรงดันต้องเป็นศูนย์ทุกจุด', 'ตัวต้านทานทุกตัวมีค่าเท่ากัน', 'LED ทุกดวงต้องสีเดียวกัน'], answer: 0 },
      { q: 'ถ้าจะวัดความต้านทานของตัวต้านทาน ควรทำอย่างไรเพื่อความปลอดภัยและความแม่นยำ', options: ['ตัดไฟจากวงจรก่อนวัด', 'เพิ่มไฟเลี้ยงให้สูงขึ้น', 'จับขั้ว LED สลับไปมา', 'เปิดมอเตอร์ให้หมุนเร็วที่สุด'], answer: 0 },
      { q: 'เมื่อวงจรไม่ทำงาน วิธีที่เหมาะสมที่สุดคือข้อใด', options: ['ตรวจทีละจุดและบันทึกหลักฐาน', 'เปลี่ยนอุปกรณ์ทุกชิ้นทันที', 'เดาสุ่มแล้วลองไปเรื่อย ๆ โดยไม่จด', 'เพิ่มแรงดันให้มากที่สุด'], answer: 0 },
    ],
  },
};
