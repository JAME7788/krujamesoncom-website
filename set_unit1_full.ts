import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';
import { students2569 } from './src/data/students2569';
import { grades as curriculumGrades } from './src/data/curriculum';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env: Record<string, string> = {};
envContent.split('\n').forEach(line => {
  const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (m) {
    const key = m[1];
    let val = m[2] || '';
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[key] = val.trim();
  }
});

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Define indicator lists to avoid importing gradeService.ts
const csIndicators: Record<string, { id: string; code: string; title: string; maxScore: number }[]> = {
  'ป.1': [
    { id: 'cs_p1_1', code: 'ว 4.2 ป.1/1', title: 'แก้ปัญหาอย่างง่ายโดยใช้การลองผิดลองถูก', maxScore: 15 },
    { id: 'cs_p1_2', code: 'ว 4.2 ป.1/2', title: 'แสดงลำดับขั้นตอนการทำงาน', maxScore: 15 },
    { id: 'cs_p1_3', code: 'ว 4.2 ป.1/3', title: 'เขียนโปรแกรมอย่างง่ายโดยใช้ซอฟต์แวร์/สื่อ', maxScore: 15 },
    { id: 'cs_p1_4', code: 'ว 4.2 ป.1/4', title: 'ใช้เทคโนโลยีในการสร้าง จัดเก็บ เรียกใช้ข้อมูล', maxScore: 15 },
    { id: 'cs_p1_5', code: 'ว 4.2 ป.1/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.2': [
    { id: 'cs_p2_1', code: 'ว 4.2 ป.2/1', title: 'แสดงลำดับขั้นตอนแก้ปัญหา', maxScore: 15 },
    { id: 'cs_p2_2', code: 'ว 4.2 ป.2/2', title: 'เขียนโปรแกรมอย่างง่ายโดยใช้สื่อ', maxScore: 15 },
    { id: 'cs_p2_3', code: 'ว 4.2 ป.2/3', title: 'ใช้เทคโนโลยีค้นหาข้อมูล', maxScore: 15 },
    { id: 'cs_p2_4', code: 'ว 4.2 ป.2/4', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.3': [
    { id: 'cs_p3_1', code: 'ว 4.2 ป.3/1', title: 'แสดงอัลกอริทึมแก้ปัญหา', maxScore: 15 },
    { id: 'cs_p3_2', code: 'ว 4.2 ป.3/2', title: 'เขียนโปรแกรมโดยใช้สื่อ', maxScore: 15 },
    { id: 'cs_p3_3', code: 'ว 4.2 ป.3/3', title: 'ใช้อินเทอร์เน็ตค้นหาความรู้', maxScore: 15 },
    { id: 'cs_p3_4', code: 'ว 4.2 ป.3/4', title: 'รวบรวมและประมวลผลข้อมูล', maxScore: 15 },
    { id: 'cs_p3_5', code: 'ว 4.2 ป.3/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.4': [
    { id: 'cs_p4_1', code: 'ว 4.2 ป.4/1', title: 'ใช้เหตุผลเชิงตรรกะ', maxScore: 15 },
    { id: 'cs_p4_2', code: 'ว 4.2 ป.4/2', title: 'ออกแบบและเขียนโปรแกรมอย่างง่าย', maxScore: 15 },
    { id: 'cs_p4_3', code: 'ว 4.2 ป.4/3', title: 'ใช้อินเทอร์เน็ตค้นหา/ประเมินข้อมูล', maxScore: 15 },
    { id: 'cs_p4_4', code: 'ว 4.2 ป.4/4', title: 'รวบรวมประเมินนำเสนอข้อมูล', maxScore: 15 },
    { id: 'cs_p4_5', code: 'ว 4.2 ป.4/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย เคารพสิทธิ', maxScore: 15 },
  ],
  'ป.5': [
    { id: 'cs_p5_1', code: 'ว 4.2 ป.5/1', title: 'ใช้เหตุผลเชิงตรรกะแก้ปัญหา', maxScore: 15 },
    { id: 'cs_p5_2', code: 'ว 4.2 ป.5/2', title: 'ออกแบบ/เขียนโปรแกรมที่มีเงื่อนไข', maxScore: 15 },
    { id: 'cs_p5_3', code: 'ว 4.2 ป.5/3', title: 'ใช้อินเทอร์เน็ตค้นหาข้อมูล', maxScore: 15 },
    { id: 'cs_p5_4', code: 'ว 4.2 ป.5/4', title: 'รวบรวม/ประเมิน/นำเสนอข้อมูล', maxScore: 15 },
    { id: 'cs_p5_5', code: 'ว 4.2 ป.5/5', title: 'ใช้เทคโนโลยีอย่างปลอดภัย', maxScore: 15 },
  ],
  'ป.6': [
    { id: 'cs_p6_1', code: 'ว 4.2 ป.6/1', title: 'ใช้เหตุผลเชิงตรรกะแก้ปัญหาซับซ้อน', maxScore: 15 },
    { id: 'cs_p6_2', code: 'ว 4.2 ป.6/2', title: 'ออกแบบ/เขียนโปรแกรมที่มีการทำซ้ำ', maxScore: 15 },
    { id: 'cs_p6_3', code: 'ว 4.2 ป.6/3', title: 'ใช้อินเทอร์เน็ตอย่างมีวิจารณญาณ', maxScore: 15 },
    { id: 'cs_p6_4', code: 'ว 4.2 ป.6/4', title: 'นำเสนอข้อมูลเปรียบเทียบความน่าเชื่อถือ', maxScore: 15 },
  ],
};

const csIndicatorsM: Record<string, { id: string; code: string; title: string; maxScore: number }[]> = {
  'ม.1': [
    { id: 'cs_m1_1', code: 'ว 4.2 ม.1/1', title: 'ออกแบบอัลกอริทึมที่ใช้แนวคิดเชิงนามธรรมเพื่อแก้ปัญหา', maxScore: 15 },
    { id: 'cs_m1_2', code: 'ว 4.2 ม.1/2', title: 'ออกแบบและเขียนโปรแกรมอย่างง่ายเพื่อแก้ปัญหาทางคณิตศาสตร์/วิทยาศาสตร์', maxScore: 15 },
    { id: 'cs_m1_3', code: 'ว 4.2 ม.1/3', title: 'รวบรวมข้อมูลปฐมภูมิ ประมวลผล ประเมินผล นำเสนอข้อมูลและสารสนเทศ', maxScore: 15 },
    { id: 'cs_m1_4', code: 'ว 4.2 ม.1/4', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย ใช้สื่อ/แหล่งข้อมูลตามข้อกำหนด', maxScore: 15 },
  ],
  'ม.2': [
    { id: 'cs_m2_1', code: 'ว 4.2 ม.2/1', title: 'ออกแบบอัลกอริทึมที่ใช้แนวคิดเชิงคำนวณในการแก้ปัญหา', maxScore: 15 },
    { id: 'cs_m2_2', code: 'ว 4.2 ม.2/2', title: 'ออกแบบและเขียนโปรแกรมที่ใช้ตรรกะและฟังก์ชันในการแก้ปัญหา', maxScore: 15 },
    { id: 'cs_m2_3', code: 'ว 4.2 ม.2/3', title: 'อภิปรายองค์ประกอบและหลักการทำงานของระบบคอมพิวเตอร์ + Cloud', maxScore: 15 },
    { id: 'cs_m2_4', code: 'ว 4.2 ม.2/4', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย มีจริยธรรม วิเคราะห์สื่อ', maxScore: 15 },
  ],
  'ม.3': [
    { id: 'cs_m3_1', code: 'ว 4.2 ม.3/1', title: 'พัฒนาแอปพลิเคชันที่มีการบูรณาการกับวิชาอื่นเพื่อแก้ปัญหาในชีวิตจริง', maxScore: 15 },
    { id: 'cs_m3_2', code: 'ว 4.2 ม.3/2', title: 'รวบรวมข้อมูล ประมวลผล ประเมินผล นำเสนอข้อมูลและสารสนเทศ', maxScore: 15 },
    { id: 'cs_m3_3', code: 'ว 4.2 ม.3/3', title: 'ประเมินความน่าเชื่อถือของข้อมูล วิเคราะห์สื่อและผลกระทบ', maxScore: 15 },
    { id: 'cs_m3_4', code: 'ว 4.2 ม.3/4', title: 'ใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย รับผิดชอบต่อสังคม ปฏิบัติตามกฎหมาย', maxScore: 15 },
  ],
};

const run = async () => {
  console.log("Starting script to set Unit 1 scores to full...");

  try {
    // Primary
    for (let gradeNum = 1; gradeNum <= 6; gradeNum++) {
      const classroom = `ป.${gradeNum}`;
      const gradeId = `p${gradeNum}`;
      const subject = 'main';
      await updateClassroomUnit1(classroom, gradeId, subject, csIndicators[classroom]);
    }

    // Secondary
    for (let gradeNum = 1; gradeNum <= 3; gradeNum++) {
      const classroom = `ม.${gradeNum}`;
      const gradeId = `m${gradeNum}-cs`;
      const subject = 'cs';
      await updateClassroomUnit1(classroom, gradeId, subject, csIndicatorsM[classroom]);
    }

    console.log("Script completed successfully!");
  } catch (err) {
    console.error("Fatal error during script execution:", err);
  }
};

const updateClassroomUnit1 = async (
  classroom: string,
  gradeId: string,
  subject: string,
  indicators: { id: string; maxScore: number }[]
) => {
  console.log(`Processing ${classroom} (${subject})...`);

  // 1) Find indicator IDs that map to Unit 1
  const grade = curriculumGrades.find(g => g.id === gradeId);
  if (!grade) {
    console.error(`Curriculum grade not found for ${gradeId}`);
    return;
  }
  const unit1 = grade.units?.find(u => u.no === 1);
  if (!unit1) {
    console.error(`Unit 1 not found for ${gradeId}`);
    return;
  }
  const unit1IndicatorIndices = unit1.indicators || []; // index of indicator (0-based)
  
  // The indicator IDs linked to Unit 1:
  const linkedIndicatorIds = unit1IndicatorIndices.map(idx => {
    const levelKey = gradeId.split('-')[0]; // e.g. 'p1' or 'm1'
    return `cs_${levelKey}_${idx + 1}`;
  });

  console.log(`Unit 1 linked indicators for ${classroom}:`, linkedIndicatorIds);
  if (linkedIndicatorIds.length === 0) {
    console.log(`No indicators linked to Unit 1 for ${classroom}`);
    return;
  }

  // 2) Load existing grades document from Firestore
  const docId = subject === 'main' ? classroom : `${classroom}_${subject}`;
  const docRef = doc(db, 'grades', docId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let studentsList: any[] = [];
  
  try {
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      studentsList = data.students || [];
      console.log(`Found existing document for ${classroom}_${subject} with ${studentsList.length} students.`);
    } else {
      console.log(`Document not found for ${classroom}_${subject}. Initializing with default roster.`);
      const roster = students2569[classroom] || [];
      studentsList = roster.map(s => ({
        studentCode: s.studentCode,
        classroom: classroom,
        studentNo: s.no,
        name: s.name,
        emoji: s.emoji,
        indicators: {},
        updatedAt: Date.now()
      }));
    }

    // 3) Set Unit 1 indicators to full marks for each student
    studentsList.forEach(student => {
      if (!student.indicators) student.indicators = {};
      
      // Initialize other indicators if not present
      indicators.forEach(ind => {
        if (!student.indicators[ind.id]) {
          student.indicators[ind.id] = {
            k: 0,
            maxK: ind.maxScore,
            p: 'พอใช้',
            a: false,
            pAssessed: false,
            aAssessed: false,
            updatedAt: Date.now()
          };
        }
      });

      // Update Unit 1 indicators to full marks
      linkedIndicatorIds.forEach(id => {
        const indDef = indicators.find(i => i.id === id);
        const maxScore = indDef ? indDef.maxScore : 15;
        
        student.indicators[id] = {
          k: maxScore,
          maxK: maxScore,
          p: 'ดี',
          a: true,
          pAssessed: true,
          aAssessed: true,
          updatedAt: Date.now()
        };
      });
      
      student.updatedAt = Date.now();
    });

    // 4) Save updated grades document back to Firestore
    await setDoc(docRef, {
      classroom,
      subject,
      students: studentsList,
      updatedAt: Date.now()
    }, { merge: true });
    
    console.log(`Successfully updated and saved ${classroom}_${subject} to Firestore.`);
  } catch (error) {
    console.error(`Error processing ${classroom}_${subject}:`, error);
  }
};

run();
