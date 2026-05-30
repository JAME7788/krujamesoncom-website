import type { Grade, Unit } from './curriculum';
import type { Article, LearningFile, LessonNotes } from './unitExtras';

const myIpstUrl = 'https://myipst.ipst.ac.th/baskets/search';
const codingThailandUrl = 'https://codingthailand.org/computer-science/';
const project14HomeUrl = 'https://proj14.ipst.ac.th/';
const computingClassroomUrl = 'https://www.xn--42c2dag4cb3c3ah6pd.xn--o3cw4h/';
const praphasArduinoUrl = 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/';
const praphasArduinoDocsUrl = 'https://praphas.com/index.php/51-knowhow/arduino';

const project14Urls: Record<string, string> = {
  p1: 'https://proj14.ipst.ac.th/p1/p1-cs/',
  p2: 'https://proj14.ipst.ac.th/p2/p2-cs/',
  p3: 'https://proj14.ipst.ac.th/p3/p3-cs/',
  p4: 'https://proj14.ipst.ac.th/p4/p4-cs/',
  p5: 'https://proj14.ipst.ac.th/p5/p5-cs/',
  p6: 'https://proj14.ipst.ac.th/p6/p6-cs/',
  'm1-cs': 'https://proj14.ipst.ac.th/m1/m1-cs/',
  'm2-cs': 'https://proj14.ipst.ac.th/m2/m2-cs/',
  'm3-cs': 'https://proj14.ipst.ac.th/m3/m3-cs/',
  'm1-design': 'https://proj14.ipst.ac.th/m1/m1-dt/',
  'm2-design': 'https://proj14.ipst.ac.th/m2/m2-dt/',
  'm3-design': 'https://proj14.ipst.ac.th/m3/m3-dt/',
};

const dltvUrls: Record<string, string> = {
  p1: 'https://dltv.ac.th/teachplan/lists/1/36000',
  p2: 'https://dltv.ac.th/teachplan/lists/2/36000',
  p3: 'https://dltv.ac.th/teachplan/lists/3/36000',
  p4: 'https://dltv.ac.th/teachplan/lists/4/36000',
  p5: 'https://dltv.ac.th/teachplan/lists/5/36000',
  p6: 'https://dltv.ac.th/teachplan/lists/6/36000',
  'm1-cs': 'https://dltv.ac.th/teachplan/lists/7/90045',
  'm2-cs': 'https://dltv.ac.th/teachplan/lists/8/90045',
  'm3-cs': 'https://dltv.ac.th/teachplan/lists/9/90045',
  'm1-design': 'https://dltv.ac.th/teachplan/lists/7/191918',
  'm2-design': 'https://dltv.ac.th/teachplan/lists/8/191918',
  'm3-design': 'https://dltv.ac.th/teachplan/lists/9/191918',
};

const dltvGuideFiles: Record<string, LearningFile[]> = {
  p1: [
    {
      title: 'คู่มือครูและแผนการสอน เทคโนโลยี ป.1 ภาคเรียนที่ 1-2568',
      url: 'https://dltv.ac.th/utils/files/download/184782',
      source: 'DLTV',
      desc: 'ไฟล์ PDF คู่มือครูและแผนการจัดการเรียนรู้รายชั่วโมง มีสารบัญหน่วย การเปรียบเทียบ การเรียงลำดับ การแก้ปัญหา การเขียนโปรแกรม ประโยชน์ของคอมพิวเตอร์ และโปรแกรมกราฟิก',
      kind: 'pdf',
    },
  ],
};

const project14P1Lessons: Record<number, LearningFile[]> = {
  1: [
    {
      title: 'Project 14: การเปรียบเทียบ',
      url: 'https://proj14.ipst.ac.th/p1/p1-cs/cs-p1b1-001/',
      source: 'Project 14 / สสวท.',
      desc: 'วีดิทัศน์ 10.02 นาที จากหนังสือเรียนเทคโนโลยี ป.1 บทที่ 1 โป้ง ก้อย และ อิ่ม',
      kind: 'video',
    },
  ],
  2: [
    {
      title: 'Project 14: การลำดับเรื่องราวหรือเหตุการณ์',
      url: 'https://proj14.ipst.ac.th/p1/p1-cs/cs-p1b1-002/',
      source: 'Project 14 / สสวท.',
      desc: 'วีดิทัศน์สำหรับฝึกเรียงลำดับเหตุการณ์และขั้นตอนในชีวิตประจำวัน',
      kind: 'video',
    },
  ],
  3: [
    {
      title: 'Project 14: การแก้ปัญหาแบบลองผิดลองถูก',
      url: 'https://proj14.ipst.ac.th/p1/p1-cs/cs-p1b1-003/',
      source: 'Project 14 / สสวท.',
      desc: 'วีดิทัศน์ 12.42 นาที จากหนังสือเรียนเทคโนโลยี ป.1 บทที่ 3 เส้นทางกลับบ้าน',
      kind: 'video',
    },
  ],
  4: [
    {
      title: 'Project 14: การเขียนโปรแกรมโดยใช้บัตรคำสั่ง',
      url: 'https://proj14.ipst.ac.th/p1/p1-cs/cs-p1b1-004/',
      source: 'Project 14 / สสวท.',
      desc: 'วีดิทัศน์สำหรับฝึกจัดเรียงบัตรคำสั่งและเข้าใจลำดับคำสั่งเบื้องต้น',
      kind: 'video',
    },
  ],
};

const praphasArduinoLessonUrls: Record<number, string> = {
  1: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/86-arduino-1',
  2: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/87-arduino-2-sketch',
  3: 'https://praphas.com/index.php/2008-11-03-14-25-25/51-arduino/90-arduino-5-1-uno-r3.PROTEUS',
  4: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/96-2-arduino',
  5: praphasArduinoDocsUrl,
  6: 'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/91-arduino-6-2',
};

const article = (title: string, url: string, source: string, desc: string): Article => ({
  title,
  url,
  source,
  desc,
});

const file = (
  title: string,
  url: string,
  source: string,
  desc: string,
  kind: LearningFile['kind'] = 'web'
): LearningFile => ({
  title,
  url,
  source,
  desc,
  kind,
});

const uniqArticles = (items: Article[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.url}|${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const uniqFiles = (items: LearningFile[]) => {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = `${item.url}|${item.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const detectSourceTheme = (grade: Grade, unit: Unit) => {
  const text = `${grade.title} ${unit.title} ${(unit.topics || []).join(' ')}`;
  if (/AI|ปัญญาประดิษฐ์|Machine Learning|Prompt|โมเดล/i.test(text)) return 'ai';
  if (/ออกแบบ|เทคโนโลยีกับ|วิศวกรรม|วัสดุ|ชิ้นงาน|ต้นแบบ|Design/i.test(text)) return 'design';
  if (/ข้อมูล|Data|กราฟ|แผนภูมิ|ประมวลผล|สถิติ|สารสนเทศ/i.test(text)) return 'data';
  if (/ปลอดภัย|ส่วนตัว|รหัสผ่าน|ออนไลน์|รู้เท่าทัน|กฎหมาย|ลิขสิทธิ์|จริยธรรม/i.test(text)) return 'safety';
  if (/โปรแกรม|โค้ด|Scratch|Python|Loop|คำสั่ง|อัลกอริทึม|แอปพลิเคชัน/i.test(text)) return 'coding';
  return 'computational';
};

export const buildOfficialArticles = (grade: Grade, unit: Unit): Article[] => {
  if (grade.id === 'arduino-basic') {
    return uniqArticles([
      article(
        `ครูประภาส: เนื้อหา Arduino หน่วยที่ ${unit.no}`,
        praphasArduinoLessonUrls[unit.no] || praphasArduinoUrl,
        'ครูประภาส สุวรรณเพชร',
        'บทความต้นทางสำหรับจัดรายวิชา Arduino เบื้องต้น ใช้เปิดอ่านประกอบก่อนลงมือทดลอง'
      ),
      article(
        'เอกสารเรียนรู้และลองเล่น Arduino เบื้องต้น',
        praphasArduinoDocsUrl,
        'ครูประภาส สุวรรณเพชร',
        'หน้ารวมเอกสาร Arduino ฉบับปรับปรุงและใบงานทดลองจำนวนมากสำหรับต่อยอดในคอร์ส'
      ),
      article(
        'Arduino Software',
        'https://www.arduino.cc/en/software',
        'Arduino',
        'หน้าดาวน์โหลด Arduino IDE จากต้นทาง ใช้ประกอบหน่วยติดตั้งเครื่องมือ'
      ),
    ]);
  }

  const theme = detectSourceTheme(grade, unit);
  const isAiCourse = grade.id.startsWith('ai-');
  const isDesignCourse = grade.id.includes('design');
  const isCoreComputing = /^p\d$/.test(grade.id) || grade.id.endsWith('-cs');

  const items: Article[] = [
    article(
      `My IPST: คลังสื่อ สสวท. สำหรับ ${grade.title}`,
      myIpstUrl,
      'My IPST / สสวท.',
      'ค้นหาคู่มือครู แนวการจัดการเรียนรู้ ไฟล์นำเสนอ วีดิทัศน์ แบบทดสอบ และใบกิจกรรมที่ตรงกับหนังสือเรียน'
    ),
  ];

  if (isCoreComputing && grade.courseUrl && grade.courseUrl !== '#') {
    items.push(article(
      `CodingThailand: ห้องเรียน ${grade.title}`,
      grade.courseUrl,
      'CodingThailand',
      'ใช้ฝึกบทเรียนวิทยาการคำนวณแบบออนไลน์ เชื่อมกับทักษะคิดเชิงคำนวณและกิจกรรม coding'
    ));
  } else if (isCoreComputing || isAiCourse) {
    items.push(article(
      'CodingThailand: วิทยาการคำนวณคืออะไร',
      codingThailandUrl,
      'CodingThailand',
      'สรุปแนวคิดวิทยาการคำนวณ การแบ่งย่อยปัญหา การคิดเชิงนามธรรม การหารูปแบบ และการออกแบบขั้นตอน'
    ));
  }

  const project14Url = project14Urls[grade.id] || project14HomeUrl;
  items.push(article(
    isDesignCourse
      ? `Project 14: วีดิทัศน์การออกแบบและเทคโนโลยี ${grade.title}`
      : `Project 14: วีดิทัศน์เทคโนโลยี/วิทยาการคำนวณ ${grade.title}`,
    project14Url,
    'Project 14 / สสวท.',
    'บทเรียนวิดีโอของ สสวท. ที่สอดคล้องกับมาตรฐาน ตัวชี้วัด และหนังสือเรียน ใช้ทบทวนก่อนหรือหลังเรียน'
  ));

  const dltvUrl = dltvUrls[grade.id];
  if (dltvUrl) {
    items.push(article(
      isDesignCourse
        ? `DLTV: แผนการสอนและใบกิจกรรมการออกแบบและเทคโนโลยี ${grade.title}`
        : `DLTV: แผนการสอน ใบงาน และแบบประเมิน ${grade.title}`,
      dltvUrl,
      'DLTV',
      'แผนรายชั่วโมง คู่มือครู ใบงาน ใบกิจกรรม และแบบประเมิน ใช้เสริมกิจกรรมในห้องเรียน'
    ));
  }

  if (isCoreComputing && !isDesignCourse) {
    items.push(article(
      'ห้องเรียนวิทยาการคำนวณ: บทเรียนเสริมรายบท',
      computingClassroomUrl,
      'ห้องเรียนวิทยาการคำนวณ',
      'รวมบทเรียนและกิจกรรมเสริม ป.1-ป.6 และ ม.1-ม.3 สำหรับใช้ทบทวนหรือให้เด็กเรียนเพิ่มเติม'
    ));
  }

  if (theme === 'data') {
    items.push(article(
      'Project 14 / DLTV: เนื้อหาข้อมูล การประมวลผล และการนำเสนอ',
      project14Url,
      'Project 14 / DLTV',
      'ใช้ค้นวิดีโอและใบกิจกรรมที่เกี่ยวกับการเก็บข้อมูล จัดข้อมูล วิเคราะห์ข้อมูล และสื่อสารผลด้วยตารางหรือกราฟ'
    ));
  }

  if (theme === 'safety') {
    items.push(article(
      'CodingThailand: พื้นฐานการรู้เท่าทันสื่อและข่าวสาร',
      codingThailandUrl,
      'CodingThailand',
      'เสริมเรื่อง Digital technology และ Media and information literacy สำหรับใช้เทคโนโลยีอย่างรับผิดชอบ'
    ));
  }

  return uniqArticles(items).slice(0, 6);
};

export const buildOfficialFiles = (grade: Grade, unit: Unit): LearningFile[] => {
  if (grade.id === 'arduino-basic') {
    const items: LearningFile[] = [
      file(
        `ไฟล์/บทความต้นทาง Arduino หน่วยที่ ${unit.no}`,
        praphasArduinoLessonUrls[unit.no] || praphasArduinoUrl,
        'ครูประภาส สุวรรณเพชร',
        'เปิดอ่านเนื้อหาต้นทางของหน่วยนี้จากเว็บครูประภาส',
        'web'
      ),
      file(
        '[เอกสาร #5] เรียนรู้และลองเล่น Arduino เบื้องต้น',
        praphasArduinoDocsUrl,
        'ครูประภาส สุวรรณเพชร',
        'หน้ารวมเอกสารฉบับปรับปรุงและใบงาน Arduino 33 ใบงานสำหรับใช้เป็นชุดฝึกปฏิบัติ',
        'worksheet'
      ),
    ];

    if (unit.no === 2) {
      items.push(file(
        'Arduino IDE Download',
        'https://www.arduino.cc/en/software',
        'Arduino',
        'ดาวน์โหลด Arduino IDE จากเว็บไซต์ทางการ',
        'web'
      ));
    }

    if (unit.no === 6) {
      items.push(
        file(
          '[Arduino #4] การสร้าง Arduino บน Proteus',
          'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/89-arduino-4-arduino-proteus',
          'ครูประภาส สุวรรณเพชร',
          'บทความเสริมการจำลองวงจร Arduino ใน Proteus',
          'web'
        ),
        file(
          '[Arduino #8] การซ่อมบูตโหลดเดอร์',
          'https://www.praphas.com/index.php/2008-11-03-14-25-25/51-arduino/94-arduino-8',
          'ครูประภาส สุวรรณเพชร',
          'บทความเสริมการซ่อมบูตโหลดเดอร์ด้วย Arduino as ISP',
          'web'
        )
      );
    }

    return uniqFiles(items);
  }

  const isDesignCourse = grade.id.includes('design');
  const isCoreComputing = /^p\d$/.test(grade.id) || grade.id.endsWith('-cs');
  const project14Url = project14Urls[grade.id] || project14HomeUrl;
  const dltvUrl = dltvUrls[grade.id];

  const items: LearningFile[] = [
    file(
      `My IPST: ค้นไฟล์สื่อการสอนของ ${grade.title}`,
      myIpstUrl,
      'My IPST / สสวท.',
      'ใช้ค้นคู่มือครู แนวการจัดการเรียนรู้ ไฟล์นำเสนอ วีดิทัศน์ แบบทดสอบ และใบกิจกรรมตามหนังสือเรียน',
      'web'
    ),
  ];

  if (dltvGuideFiles[grade.id]) {
    items.push(...dltvGuideFiles[grade.id]);
  }

  if (dltvUrl) {
    items.push(file(
      `DLTV: แผนการสอน ใบงาน และแบบประเมิน ${grade.title}`,
      dltvUrl,
      'DLTV',
      'หน้ารวมคู่มือครู แผนรายชั่วโมง ใบงาน ใบกิจกรรม และแบบประเมิน ใช้เปิดหาไฟล์ตามหน่วยเรียน',
      'lesson-plan'
    ));
  }

  if (grade.id === 'p1' && project14P1Lessons[unit.no]) {
    items.push(...project14P1Lessons[unit.no]);
  } else {
    items.push(file(
      isDesignCourse
        ? `Project 14: วิดีโอบทเรียนออกแบบและเทคโนโลยี ${grade.title}`
        : `Project 14: วิดีโอบทเรียนวิทยาการคำนวณ ${grade.title}`,
      project14Url,
      'Project 14 / สสวท.',
      'หน้ารวมวิดีโอบทเรียนออนไลน์ตามมาตรฐานและตัวชี้วัด ใช้ทบทวนก่อนเรียนหรือหลังเรียน',
      'video'
    ));
  }

  if (isCoreComputing && grade.courseUrl && grade.courseUrl !== '#') {
    items.push(file(
      `CodingThailand: ห้องเรียนออนไลน์ ${grade.title}`,
      grade.courseUrl,
      'CodingThailand',
      'ห้องเรียนออนไลน์สำหรับฝึกบทเรียนวิทยาการคำนวณและกิจกรรม coding ตามระดับชั้น',
      'web'
    ));
  }

  if (isCoreComputing && !isDesignCourse) {
    items.push(file(
      'ห้องเรียนวิทยาการคำนวณ: รวมบทเรียนเสริมรายบท',
      computingClassroomUrl,
      'ห้องเรียนวิทยาการคำนวณ',
      'เว็บไซต์รวมบทเรียนเสริม ป.1-ป.6 และ ม.1-ม.3 ใช้เปิดประกอบการสอนหรือให้นักเรียนทบทวน',
      'web'
    ));
  }

  return uniqFiles(items).slice(0, 7);
};

export const buildOfficialLessonNotes = (grade: Grade, unit: Unit): LessonNotes => {
  if (grade.id === 'arduino-basic') {
    return {
      objectives: [
        `เชื่อมโยงเนื้อหา "${unit.title}" กับการทดลอง Arduino จริงตามแนวบทความครูประภาส`,
        'อธิบายวงจร โค้ด ผลการทดลอง และข้อควรระวังด้วยภาษาของตนเองได้',
      ],
      summary: [
        'รายวิชานี้เรียบเรียงใหม่จากชุดบทความและเอกสาร Arduino ของครูประภาส โดยใช้เป็นแหล่งอ้างอิงและปรับให้เป็นหน่วยเรียนสำหรับนักเรียน',
        'การเรียน Arduino ต้องทำเป็นวงจรคิดครบชุด: ระบุปัญหา เลือก input เขียนโปรแกรมประมวลผล สั่ง output ทดลอง วัดผล และแก้ไขข้อผิดพลาด',
        'ทุกหน่วยควรให้ผู้เรียนบันทึกสิ่งที่ต่อจริง โค้ดที่ใช้ ค่าที่อ่านได้ ปัญหาที่พบ และวิธีแก้ไข เพื่อฝึกทั้งทักษะวิทยาการคำนวณและทักษะช่าง',
      ],
      activities: [
        'เปิดไฟล์หรือบทความต้นทางของหน่วย แล้วให้ผู้เรียนสรุปเป็น 3 ส่วน: อุปกรณ์ที่ใช้ คำสั่งสำคัญ และผลลัพธ์ที่ควรเกิดขึ้น',
        'ให้ผู้เรียนวาดแผนภาพ input-process-output ก่อนเขียนโค้ดหรือก่อนต่อวงจรจริง',
        'หลังทดลอง ให้เขียนบันทึก debug 1 รายการว่าเจอปัญหาอะไร ตรวจอย่างไร และแก้ไขอย่างไร',
      ],
      checkQuestions: [
        'วงจรนี้รับข้อมูลจากอะไร ประมวลผลอย่างไร และสั่งงานอะไร',
        'ถ้าผลลัพธ์ไม่ตรงกับที่คาดไว้ นักเรียนควรตรวจฮาร์ดแวร์หรือซอฟต์แวร์ส่วนใดก่อน',
        'หลักฐานใดแสดงว่านักเรียนเข้าใจการทดลอง ไม่ใช่แค่ทำตามขั้นตอน',
      ],
      vocabulary: [
        'Input: ข้อมูลหรือสัญญาณที่เข้าสู่บอร์ด เช่น ปุ่มกดหรือเซนเซอร์',
        'Output: อุปกรณ์ที่บอร์ดสั่งงาน เช่น LED buzzer motor หรือจอแสดงผล',
        'Debug: การตรวจหาและแก้ไขข้อผิดพลาดของวงจรหรือโปรแกรม',
      ],
    };
  }

  const theme = detectSourceTheme(grade, unit);
  const sourceLabel = grade.id.startsWith('ai-')
    ? 'My IPST, CodingThailand และ Project 14'
    : 'My IPST, CodingThailand, Project 14 และ DLTV';

  const themeActivity = {
    ai: 'ทดลองใช้เครื่องมือ AI อย่างปลอดภัย แล้วจดว่าข้อมูลใดควรตรวจสอบซ้ำก่อนเชื่อหรือก่อนนำไปใช้',
    design: 'เลือกใบกิจกรรมหรือวิดีโอที่เกี่ยวกับกระบวนการออกแบบ แล้วนำมาทำแผนระบุปัญหา รวบรวมข้อมูล ออกแบบ ทดสอบ และปรับปรุง',
    data: 'เลือกข้อมูลใกล้ตัว 1 ชุด แล้วฝึกตั้งคำถาม จัดตาราง เลือกกราฟ และเขียนข้อสรุปจากหลักฐาน',
    safety: 'ดูตัวอย่างสถานการณ์จากวิดีโอหรือใบงาน แล้วจัดกลุ่มเป็น ปลอดภัย ควรระวัง และต้องปรึกษาผู้ใหญ่',
    coding: 'ดูตัวอย่างจาก Project 14 หรือ CodingThailand แล้วเขียนลำดับคำสั่ง รหัสลำลอง ผังงาน หรือบล็อกโปรแกรมตามวัย',
    computational: 'ใช้กิจกรรมจาก DLTV หรือ My IPST เพื่อฝึกแยกปัญหา เปรียบเทียบ หาแบบรูป และอธิบายวิธีคิดเป็นขั้นตอน',
  }[theme];

  return {
    objectives: [
      `ใช้แหล่งเรียนรู้ทางการเพื่อทบทวนเรื่อง "${unit.title}" และเชื่อมโยงกับตัวชี้วัดของ ${grade.title}`,
      'เลือกสื่อให้เหมาะกับเป้าหมาย เช่น วิดีโอสำหรับทำความเข้าใจ ใบงานสำหรับฝึกปฏิบัติ และแบบประเมินสำหรับตรวจผล',
    ],
    summary: [
      `${sourceLabel} ช่วยเติมบทเรียนให้ครบทั้งวิดีโอ ใบงาน ใบกิจกรรม คู่มือครู และแบบประเมิน`,
      'CodingThailand ย้ำแนวคิดคิดเชิงคำนวณ ได้แก่ การแบ่งย่อยปัญหา การคิดเชิงนามธรรม การหารูปแบบ และการออกแบบขั้นตอน',
      'Project 14 และ DLTV เหมาะสำหรับใช้ทบทวนเนื้อหาเป็นตอน ๆ แล้วต่อด้วยกิจกรรมหรือใบงานตามตัวชี้วัด',
    ],
    activities: [
      `เปิดแหล่งเรียนรู้ที่แนะนำ 1 รายการ แล้วสรุปว่าเชื่อมกับหัวข้อ "${unit.title}" ตรงส่วนใด`,
      themeActivity,
      'หลังเรียนให้เด็กเขียน 3 สิ่ง: สิ่งที่เข้าใจแล้ว สิ่งที่ยังสงสัย และกิจกรรมที่อยากลองต่อ',
    ],
    checkQuestions: [
      'แหล่งใดเหมาะสำหรับดูวิดีโอทบทวน และแหล่งใดเหมาะสำหรับหาใบงานหรือกิจกรรม',
      `ตัวอย่างจากแหล่งเรียนรู้ช่วยให้นักเรียนเข้าใจ "${unit.title}" ดีขึ้นอย่างไร`,
      'นักเรียนจะตรวจอย่างไรว่าสื่อที่เลือกสอดคล้องกับตัวชี้วัดของบทเรียนจริง',
    ],
    vocabulary: [
      'แหล่งเรียนรู้: เว็บไซต์ หนังสือ วิดีโอ หรือใบงานที่ใช้ช่วยเรียนรู้',
      'ตัวชี้วัด: เป้าหมายที่บอกว่านักเรียนควรทำอะไรได้หลังเรียน',
      'หลักฐานการเรียนรู้: ผลงาน คำตอบ หรือกิจกรรมที่แสดงว่านักเรียนเข้าใจจริง',
    ],
  };
};
