import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const root = process.cwd();
const now = Date.now();

// 1. Firebase Init
const envPath = path.join(root, '.env');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('='))
    .map(line => {
      const idx = line.indexOf('=');
      return [line.slice(0, idx).trim(), line.slice(idx + 1).replace(/^["']|["']$/g, '').trim()];
    })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const cleanForFirestore = (val) => JSON.parse(JSON.stringify(val));

console.log('========================================================================');
console.log('🚀 กำลังบันทึกคะแนนระดับมัธยมศึกษา (ม.1, ม.2, ม.3) ลงระบบเว็บ');
console.log('========================================================================\n');

// 2. ม.2 DATA (ตรงตาม ม2_คะแนน.csv บน Desktop)
const m2Scores = {
  1: { mid: 13, final: 30, canva: 24, clip: 7, practice: 10, total: 84, grade: '4' },
  2: { mid: 9,  final: 30, canva: 24, clip: 13, practice: 10, total: 86, grade: '4' },
  3: { mid: 14, final: 30, canva: 25, clip: 7, practice: 10, total: 86, grade: '4' },
  4: { mid: 9,  final: 22, canva: 24, clip: 7, practice: 10, total: 72, grade: '3' },
  5: { mid: 9,  final: 21, canva: 23, clip: 7, practice: 10, total: 70, grade: '3' },
  6: { mid: 8,  final: 22, canva: 19, clip: 14, practice: 8, total: 71, grade: '3' },
  7: { mid: 10, final: 30, canva: 23, clip: 13, practice: 9, total: 85, grade: '4' },
  8: { mid: 8,  final: 23, canva: 18, clip: 13, practice: 8, total: 70, grade: '3' },
  9: { mid: 8,  final: 21, canva: 19, clip: 14, practice: 8, total: 70, grade: '3' },
  10: { mid: 9, final: 18, canva: 25, clip: 14, practice: 10, total: 76, grade: '3.5' },
  11: { mid: 14, final: 30, canva: 24, clip: 13, practice: 10, total: 91, grade: '4' },
  12: { mid: 13, final: 30, canva: 24, clip: 14, practice: 10, total: 91, grade: '4' },
  13: { mid: 8,  final: 20, canva: 17, clip: 7, practice: 8, total: 60, grade: '2' },
  14: { mid: 7,  final: 18, canva: 19, clip: 7, practice: 9, total: 60, grade: '2' },
};

// 3. ม.1 DATA (ข้อสอบเต็ม 30 จากใบตรวจ 17 ก.ย. 2569)
const m1Scores = {
  1: { final: 25, name: 'เอกพล รักชาติ' },
  2: { final: 26, name: 'พัชรพล ภูเด่นตา' },
  3: { final: 9,  name: 'กฤษณชัย แซ่ม้า' },
  4: { final: 28, name: 'ณัชชา คงทน' },
  5: { final: 10, name: 'พิชญธิดา มาไกล' },
  6: { final: 16, name: 'เขมิกา ลึบอ' },
  7: { final: 28, name: 'วราภรณ์ -' },
  8: { final: 28, name: 'สิริกานต์ เปี่ยมใจ' },
  9: { final: 27, name: 'สุพิชชา พูลจวง' },
  10: { final: 23, name: 'บุญจิรา ธัญชาติไพศาล' },
  11: { final: 25, name: 'กชกร แซ่ม้า' },
  12: { final: 28, name: 'นิชา แซ่โซ้ง' },
};

// 4. ม.3 DATA (ข้อสอบเต็ม 30 จากใบตรวจ 17 ก.ย. 2569 + ส่งงาน 3 ชิ้น)
const m3Scores = {
  1: { final: 6,  t1: true, t2: true, t3: true, name: 'หิน หมื่นหาญ' },
  2: { final: 4,  t1: false, t2: false, t3: false, name: 'ชาญชัย สุขจิตร' },
  3: { final: 20, t1: false, t2: false, t3: false, name: 'ณัฐวุฒิ รื่นจิตร' },
  4: { final: 28, t1: true, t2: true, t3: true, name: 'อภิชัย ปูตือ' },
  5: { final: 28, t1: true, t2: true, t3: true, name: 'ธิวากร สุราบุตร์' },
  6: { final: 29, t1: true, t2: false, t3: true, name: 'อดิเทพ หมู่ทอง' },
  7: { final: 30, t1: true, t2: true, t3: true, name: 'ก้องภพ แสงทองศรี' },
  8: { final: 20, t1: true, t2: false, t3: true, name: 'มนชิต รักกลิ่น' },
  9: { final: 5,  t1: false, t2: false, t3: true, name: 'กมลภพ วัฒนศิริ' },
  10: { final: 29, t1: true, t2: true, t3: false, name: 'วงศกร เฟื่องจันทร์' },
  11: { final: 28, t1: true, t2: true, t3: true, name: 'พรชิตา ดันบิน' },
  12: { final: 29, t1: true, t2: true, t3: true, name: 'กัญญาพัชร ขัดสี' },
  13: { final: 30, t1: true, t2: true, t3: true, name: 'สรัญญา วิจิตรปัญญา' },
  14: { final: 27, t1: true, t2: true, t3: true, name: 'สุวรรณษา นาน้อง' },
  15: { final: 26, t1: true, t2: true, t3: true, name: 'ณัฐณิชา แก้วมณี' },
  16: { final: 30, t1: true, t2: true, t3: true, name: 'สุรัมภา จูมงคล' },
  17: { final: 23, t1: true, t2: true, t3: true, name: 'กัญญานัท แสงทองศรี' },
  18: { final: 28, t1: true, t2: true, t3: true, name: 'กัญญาภัทร ดานบิน' },
  19: { final: 26, t1: false, t2: true, t3: true, name: 'สุธิดา รัตนาวงค์' },
  20: { final: 30, t1: true, t2: true, t3: false, name: 'ชลดา พันธ์ศรี' },
};

// 5. Apply Updates for Secondary
async function updateClass(cls, subj, scoreMap, isM2 = false) {
  const legacyDocId = `${cls}_${subj}`;
  const periodDocId = `2569_t1_${cls}_${subj}`;

  let snap = await getDoc(doc(db, 'grades', legacyDocId));
  if (!snap.exists()) {
    snap = await getDoc(doc(db, 'grades', periodDocId));
  }
  if (!snap.exists()) {
    console.warn(`Doc not found: ${legacyDocId}`);
    return;
  }

  const data = snap.data();
  const students = (data.students || []).map((s) => {
    const info = scoreMap[s.studentNo] || {};
    const updated = {
      ...s,
      updatedAt: now,
      gradingPolicyVersion: 'school-2569-v1',
    };

    if (isM2) {
      if (info.mid !== undefined) {
        updated.midtermExam = info.mid;
        updated.midtermExamMax = 15;
        updated.midtermExamUpdatedAt = now;
      }
      if (info.final !== undefined) {
        updated.finalExam = info.final;
        updated.finalExamMax = 30;
        updated.finalExamUpdatedAt = now;
      }
      updated.comment = `คะแนนรวม 1/2569: ${info.total}/100 เกรด ${info.grade}`;
    } else {
      if (info.final !== undefined) {
        updated.finalExam = info.final;
        updated.finalExamMax = 30;
        updated.finalExamUpdatedAt = now;
      }
      if (info.mid !== undefined) {
        updated.midtermExam = info.mid;
        updated.midtermExamMax = 15;
        updated.midtermExamUpdatedAt = now;
      }
    }

    // Special indicator updates for M.3 based on submitted works
    if (cls === 'ม.3' && subj === 'cs') {
      const indicators = { ...(updated.indicators || {}) };
      // Task 1: Sheet รายชื่อ -> cs_m3_2
      if (info.t1) {
        indicators.cs_m3_2 = {
          ...(indicators.cs_m3_2 || {}),
          practicePassed: true,
          practiceLevel: 'ดีมาก',
          pScore: 30,
          pAssessed: true,
          k: 15,
          maxK: 15,
          updatedAt: now,
        };
      }
      // Task 2: Infographic ประโยชน์และโทษ -> cs_m3_4
      if (info.t2) {
        indicators.cs_m3_4 = {
          ...(indicators.cs_m3_4 || {}),
          practicePassed: true,
          practiceLevel: 'ดีมาก',
          pScore: 30,
          pAssessed: true,
          k: 15,
          maxK: 15,
          updatedAt: now,
        };
      }
      // Task 3: Google Interland Certificate -> cs_m3_3
      if (info.t3) {
        indicators.cs_m3_3 = {
          ...(indicators.cs_m3_3 || {}),
          practicePassed: true,
          practiceLevel: 'ดีมาก',
          pScore: 30,
          pAssessed: true,
          k: 15,
          maxK: 15,
          updatedAt: now,
        };
      }
      updated.indicators = indicators;
    }

    return updated;
  });

  const payload = {
    ...data,
    classroom: cls,
    subject: subj,
    academicYear: '2569',
    term: '1',
    students,
    updatedAt: now,
    examScoresUpdatedAt: now,
  };

  const cleanPayload = cleanForFirestore(payload);
  await setDoc(doc(db, 'grades', periodDocId), cleanPayload, { merge: true });
  await setDoc(doc(db, 'grades', legacyDocId), cleanPayload, { merge: true });

  console.log(`✅ ${legacyDocId}: บันทึกข้อมูลเรียบร้อย (${students.length} คน) -> ${periodDocId} & ${legacyDocId}`);
}

// Execute
for (const subj of ['cs', 'dt']) {
  await updateClass('ม.1', subj, m1Scores, false);
  await updateClass('ม.2', subj, m2Scores, true);
  await updateClass('ม.3', subj, m3Scores, false);
}

console.log('\n🎉 ดำเนินการอัปเดตข้อมูลมัธยมศึกษา (ม.1, ม.2, ม.3) ครบถ้วน 100%!');
process.exit(0);
