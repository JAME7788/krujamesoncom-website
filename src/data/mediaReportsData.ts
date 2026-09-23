import { gamesCatalog } from './gamesCatalog';

export interface MediaReportItem {
  id: string;
  title: string;
  author: string;
  dateCreated: string;
  learningArea: string;
  subject: string;
  gradeLevel: string;
  imageUrl: string;
  imageAlt?: string;
  usageInstructions: string;
  category: 'canva-slide' | 'digital-game' | 'interactive-slide' | 'custom';
  dottedLinesCount?: number;
  notes?: string;
  schoolName?: string;
}

// 1. สื่อเกมสไลด์ทำมือและโครงงานจาก Canva (ภาพจริงจาก Canva & คลังโครงงาน)
const CANVA_HANDCRAFTED_REPORTS: MediaReportItem[] = [
  {
    id: 'canva-hardware-robot',
    title: 'สื่ออุปกรณ์คอมพิวเตอร์และฮาร์ดแวร์ (เกมสไลด์หุ่นยนต์)',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '16 พฤษภาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ',
    gradeLevel: 'ประถมศึกษาปีที่ 1-3',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/reports/photo_robot.png',
    imageAlt: 'สื่ออุปกรณ์คอมพิวเตอร์และฮาร์ดแวร์ สไลด์หุ่นยนต์เปิดช่องแถบความรู้',
    usageInstructions: 'ใช้ในการระบุและอธิบายส่วนประกอบต่าง ๆ ของคอมพิวเตอร์และหน้าที่การทำงานของแต่ละส่วน เช่น อุปกรณ์ภายนอกและภายใน และความแตกต่างของหน่วยประมวลผลประเภทต่าง ๆ โดยให้นักเรียนเปิดช่องสไลด์เพื่อสังเกตรูปภาพและตอบคำถาม',
    category: 'canva-slide',
    dottedLinesCount: 6,
    notes: 'สื่อเกมสไลด์จำแนกอุปกรณ์คอมพิวเตอร์ ทำมือพร้อมภาพประกอบสีสันสดใสสำหรับนักเรียนชั้นประถม',
  },
  {
    id: 'canva-pseudocode-chicken',
    title: 'สื่อการแสดงอัลกอริทึมด้วยรหัสลำลอง (โปรแกรมข้าวมันไก่)',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '10 มิถุนายน 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ',
    gradeLevel: 'ประถมศึกษาปีที่ 4-6 / มัธยมศึกษาปีที่ 1',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/reports/photo_chicken.png',
    imageAlt: 'สื่อการแสดงอัลกอริทึมด้วยรหัสลำลอง โปรแกรมข้าวมันไก่',
    usageInstructions: 'ใช้ฝึกการเขียนขั้นตอนการแก้ปัญหาหรือการทำงานเป็นลำดับด้วย รหัสลำลอง (Pseudo Code) ซึ่งเป็นภาษาที่ใกล้เคียงภาษาคอมพิวเตอร์ และใช้การแปลงคำสั่งเป็นขั้นตอนอย่างเป็นระบบ เช่น ขั้นตอนการทำข้าวมันไก่',
    category: 'canva-slide',
    dottedLinesCount: 6,
    notes: 'สื่อเกมสไลด์ขั้นตอนอัลกอริทึมเมนูข้าวมันไก่ ฝึกคิดเป็นลำดับขั้นตอน (Sequencing) และการจัดกระบวนการทำงาน',
  },
  {
    id: 'canva-circuit-project',
    title: 'สื่อโครงงานการเรียนรู้วงจรไฟฟ้าเบื้องต้น (Small Circuit Big Ideas)',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '20 กรกฎาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'การออกแบบและเทคโนโลยี',
    gradeLevel: 'มัธยมศึกษาปีที่ 1 - 3',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/reports/photo_circuit_project.png',
    imageAlt: 'โครงงานการเรียนรู้วงจรไฟฟ้าเบื้องต้น โรงเรียนบ้านคลองมดแดง',
    usageInstructions: 'ใช้เป็นสื่อและชุดฝึกปฏิบัติการประกอบวงจรไฟฟ้าบนเบรดบอร์ด (Breadboard) เรียนรู้การทำงานของตัวต้านทานคงที่, ตัวต้านทานปรับค่าได้ (VR), หลอดไฟ LED และการต่อวงจรแบบอนุกรม-ขนาน พัฒนาทักษะสะเต็มศึกษา (STEM Education)',
    category: 'canva-slide',
    dottedLinesCount: 6,
    notes: 'ชุดสื่อโครงงานวงจรไฟฟ้า ลงมือปฏิบัติจริงพร้อมชุดทดลองและบอร์ดสาธิต',
  },
  {
    id: 'canva-boardgame-ar',
    title: 'สื่อนวัตกรรมบอร์ดเกมผจญภัยดินแดนสองโลกและเทคโนโลยี AR',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '28 กรกฎาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณและวิทยาศาสตร์ชีวภาพ',
    gradeLevel: 'ประถมศึกษาปีที่ 4 - มัธยมศึกษาปีที่ 3',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/reports/photo_boardgame_ar.png',
    imageAlt: 'สื่อนวัตกรรมบอร์ดเกมผจญภัยดินแดนสองโลกและเทคโนโลยีเกม AR',
    usageInstructions: 'ใช้จัดกิจกรรมการเรียนรู้แบบบูรณาการ 5E Model ร่วมกับบอร์ดเกมและการสแกน AR จำแนกประเภทสิ่งมีชีวิต สัตว์มีกระดูกสันหลังและไม่มีกระดูกสันหลัง ฝึกกระบวนการคิดวิเคราะห์ การทำงานเป็นทีม และการแก้ปัญหาภายใต้กติกาเกม',
    category: 'canva-slide',
    dottedLinesCount: 6,
    notes: 'สื่อนวัตกรรมบอร์ดเกมพิมพ์สีขนาดใหญ่พร้อมการ์ดภารกิจและแอปพลิเคชัน AR',
  },
  {
    id: 'canva-pandan-project',
    title: 'สื่อโครงงานการพับใบเตยดับกลิ่นและภูมิปัญญาท้องถิ่น',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '15 สิงหาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี / กิจกรรมพัฒนาผู้เรียน',
    subject: 'การงานอาชีพและเทคโนโลยี',
    gradeLevel: 'ประถมศึกษาปีที่ 1 - 6',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/reports/photo_pandan_project.png',
    imageAlt: 'โครงงานการพับใบเตยดับกลิ่น โรงเรียนบ้านคลองมดแดง',
    usageInstructions: 'ใช้เป็นสื่อสาธิตขั้นตอนกระบวนการแปรรูปพืชสมุนไพรและพืชกลิ่นหอมในท้องถิ่น ฝึกทักษะการพับใบเตยเป็นดอกกุหลาบเพื่อใช้ดับกลิ่นอับและฟอกอากาศ นำหลักการออกแบบเชิงวิศวกรรมและเศรษฐกิจพอเพียงมาประยุกต์ใช้',
    category: 'canva-slide',
    dottedLinesCount: 6,
    notes: 'สื่อโครงงานภูมิปัญญาเชิงบูรณาการ ฝึกกล้ามเนื้อมือและความคิดสร้างสรรค์',
  },
  {
    id: 'canva-plc-learning',
    title: 'สื่อสรุปผลกิจกรรมชุมชนแห่งการเรียนรู้ทางวิชาชีพ (PLC) ด้านเกมสไลด์',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '22 สิงหาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'การพัฒนาการจัดการเรียนรู้',
    gradeLevel: 'ประถมศึกษาปีที่ 4 - 6',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/reports/photo_plc_activity.png',
    imageAlt: 'แบบสรุปการจัดกิจกรรมแลกเปลี่ยนเรียนรู้ในรูปแบบชุมชนแห่งการเรียนรู้ทางวิชาชีพ',
    usageInstructions: 'ใช้เป็นสื่อสังเคราะห์และแลกเปลี่ยนแนวทางการแก้ปัญหาการจัดการเรียนรู้วิทยาการคำนวณและเทคโนโลยี ร่วมกับคณะครูในกลุ่มสาระฯ นำผลการใช้สื่อเกมสไลด์และบอร์ดเกมมาสะท้อนคิด (AAR) เพื่อพัฒนาผู้เรียนอย่างต่อเนื่อง',
    category: 'canva-slide',
    dottedLinesCount: 6,
    notes: 'สรุปการขับเคลื่อนกระบวนการ PLC สู่การพัฒนาสื่อนวัตกรรมการสอนจริงในห้องเรียน',
  },
];

// 2. สื่อสไลด์บทเรียนอินเทอร์แอคทีฟประจำระดับชั้น (Interactive Rich Slides)
const CURRICULUM_SLIDE_REPORTS: MediaReportItem[] = [
  {
    id: 'slide-interactive-p1',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.1',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '18 พฤษภาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว11101)',
    gradeLevel: 'ประถมศึกษาปีที่ 1',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/p1-unit1-computer-friend.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.1',
    usageInstructions: 'ใช้ประกอบการสอนเรื่องเพื่อนรักคอมพิวเตอร์และการแก้ปัญหาเบื้องต้น สไลด์มีภาพประกอบสีสันสดใส ข้อความสั้นเข้าใจง่ายสำหรับเด็กปฐมวัย-ประถมต้น พร้อมกิจกรรมเช็กความเข้าใจ Quick Check ระหว่างเรียน',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-p2',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.2',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '25 พฤษภาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว12101)',
    gradeLevel: 'ประถมศึกษาปีที่ 2',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-computer-skills.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.2',
    usageInstructions: 'ใช้สอนเรื่องการเขียนโปรแกรมอย่างง่ายโดยใช้บัตรคำสั่ง การตรวจหาข้อผิดพลาดของโปรแกรม และการจัดการไฟล์ข้อมูลอย่างเป็นระบบ มีตัวอย่างแผนผังภาพและสถานการณ์จำลอง',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-p3',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.3',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '1 มิถุนายน 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว13101)',
    gradeLevel: 'ประถมศึกษาปีที่ 3',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/p1-unit1-computer-parts.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.3',
    usageInstructions: 'ใช้สอนการสืบค้นข้อมูลผ่านอินเทอร์เน็ตอย่างปลอดภัย การประเมินความน่าเชื่อถือของสารสนเทศ และการใช้ซอฟต์แวร์ในการนำเสนอข้อมูลเชิงกราฟและตาราง',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-p4',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.4',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '8 มิถุนายน 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว14101)',
    gradeLevel: 'ประถมศึกษาปีที่ 4',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-coding.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.4',
    usageInstructions: 'ใช้สอนขั้นตอนวิธี (Algorithm) และการเขียนโปรแกรมด้วย Scratch เบื้องต้น การสร้างตัวละคร การเคลื่อนไหว และการโต้ตอบด้วยเงื่อนไข เพื่อให้ผู้เรียนเริ่มสร้างสรรค์ชิ้นงานแบบบล็อกโค้ดดิ้ง',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-p5',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.5',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '15 มิถุนายน 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว15101)',
    gradeLevel: 'ประถมศึกษาปีที่ 5',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-digital-literacy.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.5',
    usageInstructions: 'ใช้สอนการใช้เหตุผลเชิงตรรกะในการแก้ปัญหา การคาดการณ์ผลลัพธ์จากสถานการณ์ และการเขียนโปรแกรมตรวจหาข้อผิดพลาดที่ซับซ้อนขึ้น พร้อมแนวทางการใช้เทคโนโลยีอย่างมีมารยาท',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-p6',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.6',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '22 มิถุนายน 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว16101)',
    gradeLevel: 'ประถมศึกษาปีที่ 6',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-design-engineering.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ป.6',
    usageInstructions: 'ใช้สอนการแก้ปัญหาอย่างเป็นระบบ การวางผังงาน Flowchart การประเมินความปลอดภัยของข้อมูลส่วนบุคคล กฎหมายลิขสิทธิ์ และการเตรียมความพร้อมสู่การเรียนรู้ระดับมัธยมศึกษา',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-m1',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ม.1',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '1 กรกฎาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว21103)',
    gradeLevel: 'มัธยมศึกษาปีที่ 1',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-coding.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ม.1',
    usageInstructions: 'ใช้สอนแนวคิดเชิงคำนวณ (Computational Thinking) 4 เสาหลัก การเขียนโปรแกรมภาษา Python เบื้องต้น คำสั่งตัวแปร การรับข้อมูลเข้า และการแสดงผลลัพธ์',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-m2',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ การออกแบบและเทคโนโลยี ม.2',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '10 กรกฎาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'การออกแบบและเทคโนโลยี (ว22103)',
    gradeLevel: 'มัธยมศึกษาปีที่ 2',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-electronics.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ การออกแบบและเทคโนโลยี ม.2',
    usageInstructions: 'ใช้สอนระบบทางเทคโนโลยี โครงสร้างกลไก ล้อและเพลา เฟือง รอก และอุปกรณ์อิเล็กทรอนิกส์พื้นฐาน การออกแบบและพัฒนาชิ้นงานตามกระบวนการออกแบบเชิงวิศวกรรม',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-interactive-m3',
    title: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ม.3 (AI & IoT)',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '20 กรกฎาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'วิทยาการคำนวณ (ว23103)',
    gradeLevel: 'มัธยมศึกษาปีที่ 3',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-arduino.webp',
    imageAlt: 'สื่อสไลด์บทเรียนอินเทอร์แอคทีฟ วิทยาการคำนวณ ม.3',
    usageInstructions: 'ใช้สอนเทคโนโลยีปัญญาประดิษฐ์ (AI), การจัดการและวิเคราะห์ข้อมูลขนาดใหญ่ (Big Data), ความปลอดภัยในโลกไซเบอร์ขั้นสูง และจริยธรรมการใช้งานเทคโนโลยีดิจิทัล',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
  {
    id: 'slide-arduino-stem',
    title: 'สื่อชุดปฏิบัติการสมองกลฝังตัวและหุ่นยนต์ Arduino STEM',
    author: 'นายอนันตชัย เพ็ชรรี่',
    dateCreated: '1 สิงหาคม 2569',
    learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
    subject: 'การออกแบบและเทคโนโลยี',
    gradeLevel: 'มัธยมศึกษาปีที่ 1 - 3',
    schoolName: 'โรงเรียนบ้านคลองมดแดง',
    imageUrl: '/media/lessons/curriculum-arduino.webp',
    imageAlt: 'สื่อชุดปฏิบัติการสมองกลฝังตัวและหุ่นยนต์ Arduino STEM',
    usageInstructions: 'ใช้สอนการเชื่อมต่อบอร์ดไมโครคอนโทรลเลอร์ การเขียนโปรแกรมควบคุมเซนเซอร์ตรวจจับแสง อุณหภูมิ และมอเตอร์เพื่อขับเคลื่อนกลไกอัตโนมัติ ส่งเสริมทักษะความคิดสร้างสรรค์ทางวิศวกรรม',
    category: 'interactive-slide',
    dottedLinesCount: 6,
  },
];

// Helper to choose appropriate image for digital games
const getGameImage = (gameId: string): string => {
  switch (gameId) {
    case 'circuit-lab':
      return '/media/reports/photo_circuit_project.png';
    case 'tycoon':
      return '/media/games/tycoon-tech-city.webp';
    case 'mouse':
      return '/media/lessons/p1-unit1-computer-friend.webp';
    case 'keyboard':
      return '/media/lessons/curriculum-computer-skills.webp';
    case 'coding-studio':
    case 'coding-maze':
      return '/media/lessons/curriculum-coding.webp';
    case 'file-organizer':
    case 'safety':
      return '/media/lessons/curriculum-digital-literacy.webp';
    case 'quick-answer':
    case 'device-match':
      return '/media/lessons/p1-unit1-computer-parts.webp';
    case 'robot-maker':
      return '/media/lessons/curriculum-design-engineering.webp';
    case 'ct-board-game':
      return '/media/reports/photo_boardgame_ar.png';
    case 'pc-builder':
      return '/media/reports/photo_robot.png';
    case 'pixel-art':
    case 'color-code-pixel':
      return '/media/media/games/pixel-world/pixel-learning-world.webp';
    default:
      return '/media/lessons/curriculum-coding.webp';
  }
};

// 3. แปลงเกมทั้งหมดในเว็บไซต์จาก gamesCatalog มาเป็นรายการสื่อการสอน
const DIGITAL_GAME_REPORTS: MediaReportItem[] = gamesCatalog.map((g) => ({
  id: `game-${g.id}`,
  title: `สื่อนวัตกรรมเกม${g.title} (${g.skill})`,
  author: 'นายอนันตชัย เพ็ชรรี่',
  dateCreated: 'ปีการศึกษา 2569',
  learningArea: 'วิทยาศาสตร์และเทคโนโลยี',
  subject: 'วิทยาการคำนวณ',
  gradeLevel: g.level,
  schoolName: 'โรงเรียนบ้านคลองมดแดง',
  imageUrl: getGameImage(g.id),
  imageAlt: `สื่อนวัตกรรมเกม ${g.title}`,
  usageInstructions: `ใช้เป็นสื่อนวัตกรรมเกมการเรียนรู้เชิงปฏิสัมพันธ์ (Interactive Educational Game) เพื่อฝึกทักษะ ${g.skill} โดยให้นักเรียน ${g.desc} สามารถวัดและประเมินผลทักษะด้าน K/P/A และสมรรถนะการเรียนรู้แบบเรียลไทม์`,
  category: 'digital-game',
  dottedLinesCount: 6,
  notes: g.desc,
}));

// รวมเป็นคลังสื่อการสอนเริ่มต้นทั้งหมด 52+ รายการ
export const DEFAULT_MEDIA_REPORTS: MediaReportItem[] = [
  ...CANVA_HANDCRAFTED_REPORTS,
  ...CURRICULUM_SLIDE_REPORTS,
  ...DIGITAL_GAME_REPORTS,
];

const STORAGE_KEY = 'krujames_media_reports_v2';

export const loadMediaReports = (): MediaReportItem[] => {
  try {
    if (typeof localStorage === 'undefined') return DEFAULT_MEDIA_REPORTS;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // If user already saved custom items, preserve them
        const customItems = parsed.filter((p: MediaReportItem) => p.category === 'custom');
        if (customItems.length > 0) {
          // Merge custom items at the top of default list
          const defaultIds = new Set(DEFAULT_MEDIA_REPORTS.map((d) => d.id));
          const uniqueCustom = customItems.filter((c: MediaReportItem) => !defaultIds.has(c.id));
          return [...uniqueCustom, ...DEFAULT_MEDIA_REPORTS];
        }
        if (parsed.length >= DEFAULT_MEDIA_REPORTS.length) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.error('Failed to load media reports from localStorage:', e);
  }
  return DEFAULT_MEDIA_REPORTS;
};

export const saveMediaReports = (items: MediaReportItem[]): boolean => {
  try {
    if (typeof localStorage === 'undefined') return true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    return true;
  } catch (e) {
    console.error('Failed to save media reports to localStorage:', e);
    return false;
  }
};

export const resetMediaReports = (): MediaReportItem[] => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('krujames_media_reports_v1');
    }
  } catch (e) {
    console.error('Failed to reset media reports in localStorage:', e);
  }
  return DEFAULT_MEDIA_REPORTS;
};
