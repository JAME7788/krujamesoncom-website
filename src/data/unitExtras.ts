// เนื้อหาเสริม: คลิปวิดีโอ, ภาพประกอบ, แบบทดสอบ ต่อหน่วยการเรียน

export type QuizQuestion = {
  q: string;
  options: string[];
  answer: number;
  explain?: string;
};

export type Article = { title: string; url: string; source: string; desc?: string };

export type UnitExtras = {
  intro?: string;
  videos?: { title: string; query: string }[];
  fun?: { title: string; desc: string; url?: string; emoji: string; noLogin?: boolean }[];
  quiz?: QuizQuestion[];
  articles?: Article[];
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
        { title: 'TypingClub', desc: 'ฝึกพิมพ์ดีด เล่นได้เลย', url: 'https://www.typingclub.com/', emoji: '⌨️', noLogin: true },
        { title: 'TypingStudy ภาษาไทย', desc: 'ฝึกพิมพ์ไทย ไม่ต้องสมัคร', url: 'https://www.typingstudy.com/th/', emoji: '🇹🇭', noLogin: true },
        { title: 'Mouse Practice (ABCya)', desc: 'เกมฝึกใช้เมาส์', url: 'https://www.abcya.com/games/cup_stack_typing', emoji: '🖱️', noLogin: true },
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
        { title: 'Scratch (Try It)', desc: 'เขียนโปรแกรมเลย ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Lightbot Hour', desc: 'เกมสั่งหุ่นยนต์ — เล่นได้เลย', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
        { title: 'Blockly Games', desc: '7 เกมเขียนโค้ด ไม่ต้อง login', url: 'https://blockly.games/', emoji: '🎮', noLogin: true },
        { title: 'Hour of Code', desc: 'เลือกบทเรียนเล่น 1 ชั่วโมง', url: 'https://hourofcode.com/th/learn', emoji: '⏰', noLogin: true },
        { title: 'Code Monster', desc: 'เรียน JS แบบ Interactive', url: 'http://www.crunchzilla.com/code-monster', emoji: '👾', noLogin: true },
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
        { title: 'Scratch Try It', desc: 'เขียนโปรแกรมเลย ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Hour of Code', desc: 'เกมเขียนโค้ด 1 ชั่วโมง', url: 'https://hourofcode.com/th/learn', emoji: '⏰', noLogin: true },
        { title: 'Blockly Games', desc: '7 เกมเขียนโค้ด', url: 'https://blockly.games/', emoji: '🎮', noLogin: true },
        { title: 'Lightbot Hour', desc: 'สั่งหุ่นยนต์ผ่านโค้ด', url: 'https://lightbot.com/hour-of-code-2023.html', emoji: '💡', noLogin: true },
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
        { title: 'Scratch Try It', desc: 'แพลตฟอร์มหลัก ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Hour of Code', desc: 'บทเรียน 1 ชั่วโมง', url: 'https://hourofcode.com/th/learn', emoji: '⏰', noLogin: true },
        { title: 'Blockly Games', desc: '7 เกมเขียนโค้ด', url: 'https://blockly.games/', emoji: '🧩', noLogin: true },
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
        { title: 'Scratch Try It', desc: 'สร้างเกมตรรกะ ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Blockly Bird', desc: 'ฝึก if/else กับนก', url: 'https://blockly.games/bird', emoji: '🐦', noLogin: true },
        { title: 'Blockly Pond', desc: 'เขียนโค้ดเงื่อนไขขั้นสูง', url: 'https://blockly.games/pond-tutor', emoji: '🐢', noLogin: true },
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
        { title: 'Scratch Try It', desc: 'ลองเขียน Scratch ไม่ต้องสมัคร', url: 'https://scratch.mit.edu/projects/editor/?tutorial=getStarted', emoji: '🐱', noLogin: true },
        { title: 'Scratch Examples', desc: 'ดูตัวอย่างโครงการ Scratch', url: 'https://scratch.mit.edu/explore/projects/games/', emoji: '🎮', noLogin: true },
        { title: 'Code.org App Lab', desc: 'สร้างแอปด้วยบล็อก', url: 'https://code.org/educate/applab', emoji: '📱', noLogin: true },
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
  }
};
