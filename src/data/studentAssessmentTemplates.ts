export type StudentAssessmentKind =
  | 'learner-analysis'
  | 'desirable-attributes'
  | 'competencies'
  | 'literacy'
  | 'core-values'
  | 'post-lesson';

export interface AssessmentCategory {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  indicators: string[];
}

export interface AssessmentScaleItem {
  value: number;
  label: string;
  shortLabel: string;
  tone: 'muted' | 'danger' | 'warning' | 'success';
}

export interface StudentAssessmentTemplate {
  id: StudentAssessmentKind;
  title: string;
  shortTitle: string;
  description: string;
  guidance: string;
  categories: AssessmentCategory[];
  scale: AssessmentScaleItem[];
  levelMode: 'standard' | 'readiness' | 'post-lesson';
}

const standardScale: AssessmentScaleItem[] = [
  { value: 0, label: 'ไม่ผ่าน', shortLabel: '0', tone: 'danger' },
  { value: 1, label: 'ผ่าน', shortLabel: '1', tone: 'warning' },
  { value: 2, label: 'ดี', shortLabel: '2', tone: 'success' },
  { value: 3, label: 'ดีเยี่ยม', shortLabel: '3', tone: 'success' },
];

const readinessScale: AssessmentScaleItem[] = [
  { value: 0, label: 'ยังไม่มีข้อมูล', shortLabel: '0', tone: 'muted' },
  { value: 1, label: 'ต้องช่วยเหลือ', shortLabel: '1', tone: 'danger' },
  { value: 2, label: 'พร้อมบางส่วน', shortLabel: '2', tone: 'warning' },
  { value: 3, label: 'พร้อมดี', shortLabel: '3', tone: 'success' },
];

const postLessonScale: AssessmentScaleItem[] = [
  { value: 0, label: 'ยังไม่ประเมิน', shortLabel: '0', tone: 'muted' },
  { value: 1, label: 'ต้องซ่อมเสริม', shortLabel: '1', tone: 'danger' },
  { value: 2, label: 'ปานกลาง', shortLabel: '2', tone: 'warning' },
  { value: 3, label: 'ดี', shortLabel: '3', tone: 'success' },
];

export const studentAssessmentTemplates: StudentAssessmentTemplate[] = [
  {
    id: 'learner-analysis',
    title: 'การวิเคราะห์ผู้เรียนรายบุคคล',
    shortTitle: 'วิเคราะห์ผู้เรียน',
    description: 'สำรวจความพร้อมก่อนจัดการเรียนรู้ แล้วแบ่งกลุ่มเพื่อวางแผนช่วยเหลือได้ตรงจุด',
    guidance: 'ประเมินจากผลการเรียนเดิม การสนทนา การสังเกต และหลักฐานที่มี ไม่ใช้คะแนนเพียงครั้งเดียวตัดสินผู้เรียน',
    levelMode: 'readiness',
    scale: readinessScale,
    categories: [
      {
        id: 'knowledge',
        title: 'ความรู้ ความสามารถ และประสบการณ์',
        shortTitle: 'ความรู้เดิม',
        description: 'พื้นฐานความรู้ ประสบการณ์เดิม และความสนใจที่เกี่ยวข้องกับบทเรียน',
        indicators: ['อธิบายความรู้เดิมที่เกี่ยวข้องได้', 'เชื่อมโยงประสบการณ์กับโจทย์ใหม่ได้', 'แสดงความสนใจและพร้อมเรียนรู้'],
      },
      {
        id: 'thinking',
        title: 'ความพร้อมด้านสติปัญญา',
        shortTitle: 'การคิด',
        description: 'การจับใจความ เรียงลำดับ ให้เหตุผล และแก้ปัญหาตามวัย',
        indicators: ['จับใจความสำคัญได้', 'เรียงลำดับขั้นตอนได้', 'ให้เหตุผลหรือเสนอวิธีแก้ปัญหาได้'],
      },
      {
        id: 'behavior',
        title: 'ความพร้อมด้านพฤติกรรม',
        shortTitle: 'พฤติกรรม',
        description: 'การควบคุมตนเอง ความพยายาม และความรับผิดชอบต่อกิจกรรม',
        indicators: ['ทำตามข้อตกลงของชั้นเรียน', 'ทำงานต่อเนื่องจนเสร็จ', 'ขอความช่วยเหลืออย่างเหมาะสม'],
      },
      {
        id: 'health',
        title: 'ความพร้อมด้านร่างกายและจิตใจ',
        shortTitle: 'กาย–ใจ',
        description: 'สุขภาวะ การมองเห็น การได้ยิน การใช้เครื่องมือ และความพร้อมทางอารมณ์',
        indicators: ['ใช้เครื่องมือได้ตามวัย', 'มีสมาธิร่วมกิจกรรม', 'สื่อสารข้อจำกัดหรือความต้องการได้'],
      },
      {
        id: 'social',
        title: 'ความพร้อมด้านสังคม',
        shortTitle: 'สังคม',
        description: 'การปรับตัว ทำงานร่วมกับผู้อื่น เคารพกติกา และรับฟังความคิดเห็น',
        indicators: ['ร่วมงานกับเพื่อนได้', 'แบ่งปันและรอคอยได้', 'เคารพกติกาและความแตกต่าง'],
      },
    ],
  },
  {
    id: 'desirable-attributes',
    title: 'การประเมินคุณลักษณะอันพึงประสงค์',
    shortTitle: 'คุณลักษณะ',
    description: 'ประเมินพฤติกรรมที่สังเกตได้อย่างต่อเนื่องจากการเรียน งานกลุ่ม และชีวิตประจำวัน',
    guidance: 'เลือกคะแนนจากพฤติกรรมที่เกิดขึ้นจริงหลายครั้ง พร้อมบันทึกหลักฐานสั้น ๆ ในช่องหมายเหตุเมื่อจำเป็น',
    levelMode: 'standard',
    scale: standardScale,
    categories: [
      { id: 'nation', title: 'รักชาติ ศาสน์ กษัตริย์', shortTitle: 'รักชาติฯ', description: 'เห็นคุณค่าความเป็นไทยและปฏิบัติตนเหมาะสม', indicators: ['เข้าร่วมกิจกรรมอย่างเหมาะสม', 'เคารพสัญลักษณ์ของชาติ', 'ปฏิบัติตนตามหลักศาสนาที่นับถือ'] },
      { id: 'honesty', title: 'ซื่อสัตย์สุจริต', shortTitle: 'ซื่อสัตย์', description: 'ทำงานด้วยตนเองและยอมรับผลการกระทำ', indicators: ['ไม่คัดลอกผลงาน', 'บอกแหล่งที่มาของข้อมูล', 'ยอมรับเมื่อทำผิดและแก้ไข'] },
      { id: 'discipline', title: 'มีวินัย', shortTitle: 'วินัย', description: 'ทำตามข้อตกลงและใช้เวลาอย่างเหมาะสม', indicators: ['เข้าเรียนและส่งงานตามเวลา', 'ใช้อุปกรณ์ตามกติกา', 'ดูแลพื้นที่ทำงาน'] },
      { id: 'learning', title: 'ใฝ่เรียนรู้', shortTitle: 'ใฝ่เรียนรู้', description: 'ค้นคว้า ตั้งคำถาม และฝึกฝนอย่างสม่ำเสมอ', indicators: ['ตั้งคำถามที่เกี่ยวข้อง', 'ค้นหาความรู้เพิ่มเติม', 'นำข้อเสนอแนะไปปรับงาน'] },
      { id: 'sufficiency', title: 'อยู่อย่างพอเพียง', shortTitle: 'พอเพียง', description: 'ใช้ทรัพยากรอย่างคุ้มค่าและตัดสินใจมีเหตุผล', indicators: ['เลือกใช้เครื่องมือพอดีกับงาน', 'ประหยัดวัสดุและพลังงาน', 'คำนึงถึงผลกระทบก่อนตัดสินใจ'] },
      { id: 'commitment', title: 'มุ่งมั่นในการทำงาน', shortTitle: 'มุ่งมั่น', description: 'รับผิดชอบและพยายามแก้ปัญหาจนงานสำเร็จ', indicators: ['ทำงานตามหน้าที่', 'ไม่ยอมแพ้ง่ายเมื่อพบปัญหา', 'ตรวจและปรับปรุงผลงาน'] },
      { id: 'thai-culture', title: 'รักความเป็นไทย', shortTitle: 'ความเป็นไทย', description: 'ใช้ภาษาและแสดงออกอย่างเหมาะสมกับวัฒนธรรมไทย', indicators: ['ใช้ภาษาไทยสุภาพ', 'เห็นคุณค่าภูมิปัญญาท้องถิ่น', 'รักษามารยาทในการสื่อสาร'] },
      { id: 'public-mindedness', title: 'มีจิตสาธารณะ', shortTitle: 'จิตสาธารณะ', description: 'ช่วยเหลือ แบ่งปัน และคำนึงถึงประโยชน์ส่วนรวม', indicators: ['ช่วยเพื่อนโดยไม่ทำแทน', 'แบ่งปันอุปกรณ์', 'ร่วมดูแลทรัพย์สินส่วนรวม'] },
    ],
  },
  {
    id: 'competencies',
    title: 'การประเมินสมรรถนะสำคัญ 5 ด้าน',
    shortTitle: 'สมรรถนะ 5 ด้าน',
    description: 'ประเมินความสามารถที่ผู้เรียนแสดงออกระหว่างเรียนและนำไปใช้ในสถานการณ์จริง',
    guidance: 'ใช้ชิ้นงาน การปฏิบัติ การอธิบาย และการทำงานร่วมกันเป็นหลักฐานร่วมกัน',
    levelMode: 'standard',
    scale: standardScale,
    categories: [
      { id: 'communication', title: 'ความสามารถในการสื่อสาร', shortTitle: 'สื่อสาร', description: 'รับสาร ถ่ายทอดความคิด และเลือกวิธีสื่อสารเหมาะกับผู้รับ', indicators: ['ฟังและจับประเด็นได้', 'อธิบายด้วยคำหรือภาพได้ชัดเจน', 'ใช้ภาษาและสื่อดิจิทัลอย่างเหมาะสม'] },
      { id: 'thinking', title: 'ความสามารถในการคิด', shortTitle: 'คิด', description: 'คิดวิเคราะห์ สังเคราะห์ สร้างสรรค์ และตัดสินใจอย่างมีเหตุผล', indicators: ['เปรียบเทียบข้อมูลได้', 'มองเห็นความสัมพันธ์หรือรูปแบบ', 'อธิบายเหตุผลของคำตอบได้'] },
      { id: 'problem-solving', title: 'ความสามารถในการแก้ปัญหา', shortTitle: 'แก้ปัญหา', description: 'ระบุปัญหา วางแผน ทดลอง และปรับวิธีจากผลที่เกิดขึ้น', indicators: ['ระบุปัญหาและเงื่อนไขได้', 'เลือกวิธีแก้ที่เหมาะสม', 'ตรวจสอบและปรับปรุงวิธีแก้'] },
      { id: 'life-skills', title: 'ความสามารถในการใช้ทักษะชีวิต', shortTitle: 'ทักษะชีวิต', description: 'จัดการตนเอง ทำงานร่วมกับผู้อื่น และเรียนรู้จากการเปลี่ยนแปลง', indicators: ['แบ่งหน้าที่และร่วมมือได้', 'จัดการเวลาและอารมณ์ได้', 'นำประสบการณ์ไปใช้ในสถานการณ์ใหม่'] },
      { id: 'technology', title: 'ความสามารถในการใช้เทคโนโลยี', shortTitle: 'เทคโนโลยี', description: 'เลือก ใช้ และสร้างงานด้วยเทคโนโลยีอย่างมีประสิทธิภาพและปลอดภัย', indicators: ['เลือกเครื่องมือเหมาะกับงาน', 'ใช้เทคโนโลยีสร้างหรือจัดการข้อมูลได้', 'ปกป้องข้อมูลและใช้งานอย่างรับผิดชอบ'] },
    ],
  },
  {
    id: 'literacy',
    title: 'การประเมินการอ่าน คิดวิเคราะห์ และเขียน',
    shortTitle: 'อ่าน–คิด–เขียน',
    description: 'ประเมินการรับข้อมูล วิเคราะห์หลักฐาน และสื่อสารความคิดอย่างเป็นลำดับ',
    guidance: 'ใช้ข้อความ ภาพ ตาราง แผนภูมิ สื่อดิจิทัล หรือชิ้นงานจริงให้เหมาะกับระดับชั้น',
    levelMode: 'standard',
    scale: standardScale,
    categories: [
      { id: 'reading', title: 'การอ่านและรับสาร', shortTitle: 'อ่าน', description: 'เข้าใจใจความ จุดประสงค์ และข้อมูลสำคัญจากสื่อหลายรูปแบบ', indicators: ['บอกใจความสำคัญได้', 'ค้นหารายละเอียดที่ต้องการได้', 'ตีความคำ ภาพ ตาราง หรือสัญลักษณ์ได้'] },
      { id: 'analysis', title: 'การคิดวิเคราะห์', shortTitle: 'คิดวิเคราะห์', description: 'แยกข้อเท็จจริง ความคิดเห็น เหตุผล และความน่าเชื่อถือของข้อมูล', indicators: ['จัดกลุ่มหรือเปรียบเทียบข้อมูลได้', 'อธิบายเหตุและผลได้', 'ประเมินความน่าเชื่อถือโดยใช้หลักฐาน'] },
      { id: 'writing', title: 'การเขียนสื่อความ', shortTitle: 'เขียน', description: 'เรียบเรียงและนำเสนอข้อมูลได้ถูกต้อง ชัดเจน และเหมาะกับผู้รับ', indicators: ['วางลำดับเนื้อหาได้', 'ใช้คำหรือสัญลักษณ์ถูกต้อง', 'สรุปและอ้างอิงแหล่งข้อมูลได้ตามวัย'] },
    ],
  },
  {
    id: 'core-values',
    title: 'การประเมินค่านิยมพื้นฐาน 12 ประการ',
    shortTitle: 'ค่านิยม 12 ประการ',
    description: 'ใช้เป็นแนวทางสังเกตพฤติกรรมด้านความรับผิดชอบ คุณธรรม วินัย และส่วนรวม',
    guidance: 'ประเมินจากพฤติกรรมจริงในบริบทโรงเรียนและชุมชน โดยปรับภาษาให้เหมาะกับวัยของผู้เรียน',
    levelMode: 'standard',
    scale: standardScale,
    categories: [
      { id: 'value-1', title: 'รักชาติ ศาสนา พระมหากษัตริย์', shortTitle: 'รักชาติฯ', description: 'เคารพสถาบันหลักและปฏิบัติตนเป็นพลเมืองดี', indicators: ['เข้าร่วมกิจกรรมด้วยความเคารพ', 'ดูแลส่วนรวม', 'ปฏิบัติตนเหมาะสมตามกาลเทศะ'] },
      { id: 'value-2', title: 'ซื่อสัตย์ เสียสละ และอดทน', shortTitle: 'ซื่อสัตย์', description: 'ยึดความถูกต้อง ช่วยเหลือ และอดทนต่ออุปสรรค', indicators: ['พูดและทำตามความจริง', 'แบ่งปันและช่วยเหลือ', 'พยายามทำงานจนสำเร็จ'] },
      { id: 'value-3', title: 'กตัญญูต่อผู้มีพระคุณ', shortTitle: 'กตัญญู', description: 'เห็นคุณค่าและแสดงความเคารพต่อครอบครัว ครู และผู้ช่วยเหลือ', indicators: ['กล่าวขอบคุณและให้เกียรติ', 'ปฏิบัติตามคำแนะนำที่เหมาะสม', 'ช่วยงานตามกำลัง'] },
      { id: 'value-4', title: 'ใฝ่หาความรู้', shortTitle: 'ใฝ่รู้', description: 'ตั้งใจเรียน ค้นคว้า และพัฒนาตนเอง', indicators: ['ตั้งใจร่วมกิจกรรม', 'ค้นหาคำตอบจากแหล่งเรียนรู้', 'ฝึกซ้ำและแก้ไขงาน'] },
      { id: 'value-5', title: 'รักษาวัฒนธรรมและประเพณีไทย', shortTitle: 'วัฒนธรรมไทย', description: 'เห็นคุณค่าและร่วมสืบสานวัฒนธรรมอย่างเหมาะสม', indicators: ['ใช้ภาษาและมารยาทเหมาะสม', 'ร่วมกิจกรรมทางวัฒนธรรม', 'เคารพความหลากหลายของท้องถิ่น'] },
      { id: 'value-6', title: 'มีศีลธรรมและรักษาความสัตย์', shortTitle: 'ศีลธรรม', description: 'แยกแยะสิ่งที่ควรทำและรับผิดชอบต่อผลการกระทำ', indicators: ['เลือกทำสิ่งที่ถูกต้อง', 'รักษาคำพูด', 'ไม่เอาเปรียบผู้อื่น'] },
      { id: 'value-7', title: 'เข้าใจและเรียนรู้ประชาธิปไตย', shortTitle: 'ประชาธิปไตย', description: 'รับฟังความเห็น เคารพสิทธิ และร่วมตัดสินใจตามกติกา', indicators: ['รับฟังความเห็นต่าง', 'ใช้เหตุผลในการตัดสินใจ', 'ยอมรับมติของกลุ่ม'] },
      { id: 'value-8', title: 'มีระเบียบวินัยและเคารพกฎหมาย', shortTitle: 'วินัย', description: 'ปฏิบัติตามข้อตกลงและรับผิดชอบหน้าที่', indicators: ['ตรงต่อเวลา', 'ปฏิบัติตามกติกา', 'ดูแลทรัพย์สินของตนและส่วนรวม'] },
      { id: 'value-9', title: 'มีสติ รู้คิด รู้ทำ', shortTitle: 'รู้คิดรู้ทำ', description: 'คิดก่อนทำและคำนึงถึงผลกระทบต่อตนเองและผู้อื่น', indicators: ['หยุดคิดก่อนตัดสินใจ', 'อธิบายเหตุผลได้', 'แก้ไขเมื่อเกิดผลกระทบ'] },
      { id: 'value-10', title: 'ดำเนินชีวิตอย่างพอเพียง', shortTitle: 'พอเพียง', description: 'ใช้ทรัพยากรพอดี มีเหตุผล และเตรียมพร้อมต่อความเปลี่ยนแปลง', indicators: ['ใช้ของอย่างคุ้มค่า', 'วางแผนก่อนใช้ทรัพยากร', 'เลือกสิ่งจำเป็นก่อนสิ่งที่อยากได้'] },
      { id: 'value-11', title: 'เข้มแข็งและเลือกทำสิ่งที่ถูกต้อง', shortTitle: 'เข้มแข็ง', description: 'ไม่ทำตามแรงชักจูงที่ไม่เหมาะสมและกล้าปฏิเสธอย่างสุภาพ', indicators: ['ปฏิเสธสิ่งที่ไม่ถูกต้อง', 'ขอความช่วยเหลือเมื่อเสี่ยง', 'ควบคุมตนเองได้'] },
      { id: 'value-12', title: 'คำนึงถึงประโยชน์ส่วนรวม', shortTitle: 'ส่วนรวม', description: 'ร่วมมือ ช่วยเหลือ และรับผิดชอบต่อชุมชน', indicators: ['ร่วมทำงานส่วนรวม', 'ช่วยเหลือโดยไม่หวังผลตอบแทน', 'ดูแลสิ่งแวดล้อมและพื้นที่ร่วม'] },
    ],
  },
  {
    id: 'post-lesson',
    title: 'บันทึกหลังสอนรายชั่วโมง',
    shortTitle: 'บันทึกหลังสอน',
    description: 'บันทึกผล K/P/A รายคน แล้วสรุปจำนวน ร้อยละ และรายชื่อนักเรียนที่ต้องซ่อมเสริมอัตโนมัติ',
    guidance: 'ตั้งระดับทั้งห้องก่อน แล้วแก้เฉพาะรายคนเพื่อลดเวลาบันทึก ควรบันทึกหลังจบคาบทันที',
    levelMode: 'post-lesson',
    scale: postLessonScale,
    categories: [
      { id: 'k', title: 'ความรู้ (K)', shortTitle: 'K ความรู้', description: 'ความเข้าใจและการอธิบายเนื้อหาตามจุดประสงค์ของคาบ', indicators: ['ตอบคำถามหรือทำแบบฝึกได้', 'อธิบายแนวคิดด้วยภาษาของตนเองได้', 'นำความรู้ไปใช้กับสถานการณ์ใกล้ตัวได้'] },
      { id: 'p', title: 'ทักษะ/กระบวนการ (P)', shortTitle: 'P ทักษะ', description: 'การปฏิบัติ ใช้เครื่องมือ ทำตามขั้นตอน และแก้ปัญหา', indicators: ['ปฏิบัติตามขั้นตอนได้', 'ใช้เครื่องมือถูกต้องและปลอดภัย', 'ตรวจสอบและปรับปรุงผลงานได้'] },
      { id: 'a', title: 'คุณลักษณะ (A)', shortTitle: 'A คุณลักษณะ', description: 'ความรับผิดชอบ วินัย ความร่วมมือ และความตั้งใจ', indicators: ['ตั้งใจและทำงานต่อเนื่อง', 'รับผิดชอบงานที่ได้รับ', 'ร่วมมือและเคารพผู้อื่น'] },
    ],
  },
];

export const getStudentAssessmentTemplate = (kind: StudentAssessmentKind): StudentAssessmentTemplate => {
  const template = studentAssessmentTemplates.find((item) => item.id === kind);
  if (!template) throw new Error(`Unknown assessment template: ${kind}`);
  return template;
};

export interface AssessmentResult {
  total: number;
  maxTotal: number;
  percent: number;
  completed: number;
  categoryCount: number;
  level: string;
  passed: boolean;
  tone: 'muted' | 'danger' | 'warning' | 'success';
}

export const calculateAssessmentResult = (
  kind: StudentAssessmentKind,
  scores: Record<string, number | undefined>,
): AssessmentResult => {
  const template = getStudentAssessmentTemplate(kind);
  const values = template.categories
    .map((category) => scores[category.id])
    .filter((value): value is number => Number.isFinite(value));
  const completed = values.length;
  const total = values.reduce((sum, value) => sum + Math.max(0, Math.min(3, value)), 0);
  const maxTotal = template.categories.length * 3;
  const percent = maxTotal > 0 ? Math.round((total / maxTotal) * 100) : 0;

  if (completed === 0) {
    return { total, maxTotal, percent: 0, completed, categoryCount: template.categories.length, level: 'ยังไม่ประเมิน', passed: false, tone: 'muted' };
  }

  if (template.levelMode === 'readiness') {
    if (percent >= 70) return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'พร้อมดี', passed: true, tone: 'success' };
    if (percent >= 40) return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'พร้อมบางส่วน/ควรเสริม', passed: true, tone: 'warning' };
    return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ต้องวางแผนช่วยเหลือ', passed: false, tone: 'danger' };
  }

  if (template.levelMode === 'post-lesson') {
    if (percent >= 70) return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ดี', passed: true, tone: 'success' };
    if (percent >= 51) return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ปานกลาง', passed: true, tone: 'warning' };
    return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ต้องซ่อมเสริม', passed: false, tone: 'danger' };
  }

  if (percent >= 80) return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ดีเยี่ยม', passed: true, tone: 'success' };
  if (percent >= 60) return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ดี', passed: true, tone: 'success' };
  if (percent >= 50) return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ผ่าน', passed: true, tone: 'warning' };
  return { total, maxTotal, percent, completed, categoryCount: template.categories.length, level: 'ไม่ผ่าน', passed: false, tone: 'danger' };
};
