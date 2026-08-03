import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';

const APPLY = process.argv.includes('--apply');
const ACADEMIC_YEAR = '2569';
const TERM = '1';
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Bangkok' });
const NOW = Date.now();
const PRIMARY_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
const TEACHING_IDS = [...PRIMARY_IDS, 'm1', 'm2', 'm3'];
const GRADED_IDS = [
  'p1', 'p2', 'p3', 'p4', 'p5', 'p6',
  'm1-cs', 'm1-design', 'm2-cs', 'm2-design', 'm3-cs', 'm3-design',
];
const WEEKDAY_BY_GRADE = { p1: 4, p2: 1, p3: 5, p4: 3, p5: 3, p6: 4, m1: 1, m2: 5, m3: 4 };
const TERM_START = { 1: '2026-05-05', 2: '2026-11-02' };

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [
        line.slice(0, index).trim(),
        line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2'),
      ];
    }),
);

const safeId = (value) => value
  .trim()
  .replace(/[/.#$[\]]/g, '-')
  .replace(/\s+/g, '-')
  .slice(0, 120);

const classroomFor = (gradeId) => {
  const match = gradeId.match(/^[pm](\d)/);
  if (!match) return '';
  return `${gradeId.startsWith('p') ? 'ป' : 'ม'}.${match[1]}`;
};

const subjectFor = (gradeId) => {
  if (gradeId.includes('design')) return 'dt';
  if (gradeId.includes('-cs') || gradeId.startsWith('m')) return 'cs';
  return 'main';
};

const indicatorIdFor = (gradeId, index) => {
  const number = gradeId.match(/^[pm](\d)/)?.[1] || '1';
  if (gradeId.includes('design')) return `dt_m${number}_${index + 1}`;
  return `cs_${gradeId.startsWith('p') ? 'p' : 'm'}${number}_${index + 1}`;
};

const isoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dateForScheduleRow = (gradeId, row) => {
  const [year, month, day] = TERM_START[row.semester].split('-').map(Number);
  const first = new Date(year, month - 1, day);
  const offset = (WEEKDAY_BY_GRADE[gradeId] - first.getDay() + 7) % 7;
  first.setDate(first.getDate() + offset);
  const weekInTerm = row.semester === 1 ? row.week - 1 : row.week - 21;
  first.setDate(first.getDate() + Math.max(0, weekInTerm) * 7);
  return isoDate(first);
};

const stableUnique = (values) => [...new Set(values.filter(Boolean))];

const progressScore = (item) => {
  const data = item.data || {};
  const units = Object.values(data.units || {});
  const unitScore = units.reduce((sum, unit) => (
    sum
    + Number(unit.score || 0)
    + Number(unit.quiz?.score || 0)
    + (unit.completed ? 10 : 0)
    + (unit.slidesViewed?.length || 0)
    + (unit.activities?.length || 0) * 2
  ), 0);
  return Number(data.totalPoints || data.xp || 0)
    + Number(data.totalActivities || 0) * 5
    + Number(data.totalSlidesViewed || 0)
    + Number(data.streak || 0)
    + unitScore;
};

const canonicalProgressFor = (student, classroom, progressDocs) => {
  const normalizedName = student.name.replace(/\s+/g, '');
  return progressDocs
    .filter(({ id, data }) => (
      id === student.studentCode
      || data.studentCode === student.studentCode
      || data.studentId === student.studentCode
      || (
        data.classroom === classroom
        && (
          Number(data.studentNo ?? data.no ?? data.studentNumber) === student.no
          || String(data.studentName ?? data.name ?? '').replace(/\s+/g, '') === normalizedName
        )
      )
    ))
    .reduce((best, item) => Math.max(best, progressScore(item)), 0);
};

const groupRoster = (roster, classroom, progressDocs) => {
  const ordered = roster
    .map((student) => ({
      student,
      performance: canonicalProgressFor(student, classroom, progressDocs),
    }))
    .sort((a, b) => a.performance - b.performance || a.student.no - b.student.no);
  const mediumCount = Math.max(1, Math.round(roster.length * 0.25));
  const mediumCodes = new Set(ordered.slice(0, mediumCount).map((item) => item.student.studentCode));
  return { mediumCodes, mediumCount };
};

const questionOptions = (correct, distractors, answerIndex) => {
  const choices = stableUnique([correct, ...distractors]);
  while (choices.length < 4) choices.push(`ตัวเลือกที่ไม่สอดคล้อง ${choices.length + 1}`);
  const selected = choices.slice(0, 4).filter((item) => item !== correct);
  selected.splice(answerIndex, 0, correct);
  return selected.slice(0, 4);
};

const buildIndicatorQuestions = (grade, indicator, indicatorIndex) => {
  const relatedUnits = (grade.units || []).filter((unit) => (
    !unit.indicators?.length || unit.indicators.includes(indicatorIndex)
  ));
  const unit = relatedUnits[0] || grade.units?.[0];
  const topic = unit?.topics?.[0] || unit?.title || indicator.text;
  const activity = unit?.activities?.[0] || `ลงมือฝึกเรื่อง ${topic}`;
  const otherIndicators = grade.indicators
    .filter((_, index) => index !== indicatorIndex)
    .map((item) => item.text);
  const genericDistractors = [
    ...otherIndicators,
    'ทำงานทันทีโดยไม่ตรวจเงื่อนไขหรือผลลัพธ์',
    'เลือกข้อมูลตามความชอบโดยไม่ตรวจแหล่งที่มา',
    'คัดลอกคำตอบโดยไม่อธิบายเหตุผล',
  ];
  const scenarios = [
    {
      difficulty: 'easy',
      question: `ข้อใดอธิบายเป้าหมายสำคัญของ ${indicator.code} ได้ตรงที่สุด`,
      correct: indicator.text,
      distractors: genericDistractors,
      explanation: `ตัวชี้วัด ${indicator.code} มุ่งให้ผู้เรียน ${indicator.text}`,
    },
    {
      difficulty: 'easy',
      question: `ก่อนเริ่มภารกิจเรื่อง “${topic}” นักเรียนควรทำสิ่งใดก่อน`,
      correct: 'อ่านโจทย์ ระบุเป้าหมาย และตรวจข้อมูลหรืออุปกรณ์ที่ต้องใช้',
      distractors: ['ลงมือทันทีโดยไม่อ่านโจทย์', 'รอคัดลอกคำตอบจากเพื่อน', 'เลือกคำตอบที่ยาวที่สุด'],
      explanation: 'การเข้าใจโจทย์และทรัพยากรก่อนลงมือช่วยลดข้อผิดพลาดและตรวจสอบงานได้ง่ายขึ้น',
    },
    {
      difficulty: 'easy',
      question: `หลักฐานใดเหมาะสำหรับแสดงว่าได้เรียนรู้เรื่อง “${unit?.title || topic}”`,
      correct: 'ชิ้นงานหรือคำตอบพร้อมอธิบายขั้นตอนและผลที่ตรวจสอบได้',
      distractors: ['บอกเพียงว่าทำเสร็จแล้ว', 'ภาพที่ไม่เกี่ยวข้องกับโจทย์', 'คำตอบของเพื่อนโดยไม่ระบุที่มา'],
      explanation: 'หลักฐานที่ดีต้องสัมพันธ์กับเป้าหมายและแสดงกระบวนการหรือผลลัพธ์ที่ตรวจสอบได้',
    },
    {
      difficulty: 'easy',
      question: `เมื่อทำกิจกรรม “${activity}” แล้วผลไม่เป็นไปตามที่คาด ควรทำอย่างไร`,
      correct: 'ตรวจทีละขั้น หาสาเหตุ แก้ไข แล้วทดสอบอีกครั้ง',
      distractors: ['ลบงานทั้งหมดทันที', 'เปลี่ยนคำตอบแบบสุ่ม', 'หยุดทำโดยไม่บันทึกปัญหา'],
      explanation: 'การตรวจทีละขั้นและทดสอบซ้ำเป็นกระบวนการแก้ปัญหาที่ช่วยค้นหาสาเหตุได้',
    },
    {
      difficulty: 'medium',
      question: `ข้อใดเป็นลำดับการทำงานที่เหมาะสมสำหรับ “${topic}”`,
      correct: 'ทำความเข้าใจโจทย์ → วางแผน → ลงมือ → ตรวจสอบ → ปรับปรุง',
      distractors: ['ลงมือ → ส่งงาน → อ่านโจทย์', 'คัดลอก → เปลี่ยนชื่อ → ส่งงาน', 'เดาคำตอบ → หยุดตรวจ → ส่งงาน'],
      explanation: 'ลำดับที่เหมาะสมเริ่มจากเข้าใจโจทย์และจบด้วยการตรวจปรับปรุง',
    },
    {
      difficulty: 'medium',
      question: `ถ้าต้องอธิบายงานตาม ${indicator.code} ให้เพื่อนเข้าใจ ข้อใดดีที่สุด`,
      correct: 'บอกเป้าหมาย ขั้นตอน เหตุผล ผลที่ได้ และสิ่งที่ปรับปรุง',
      distractors: ['บอกเฉพาะชื่อโปรแกรม', 'เปิดชิ้นงานโดยไม่อธิบาย', 'บอกว่าคำตอบถูกเพราะครูบอก'],
      explanation: 'คำอธิบายที่ครบช่วยให้ผู้อื่นตรวจสอบกระบวนการและเรียนรู้จากชิ้นงานได้',
    },
    {
      difficulty: 'medium',
      question: `เมื่อต้องใช้ข้อมูลหรือสื่อในภารกิจ “${unit?.title || topic}” ควรเลือกแบบใด`,
      correct: 'เกี่ยวข้องกับโจทย์ ตรวจสอบที่มาได้ เหมาะกับวัย และไม่เปิดเผยข้อมูลส่วนตัว',
      distractors: ['เป็นผลลัพธ์แรกที่ค้นเจอเสมอ', 'มีภาพสวยแม้ไม่เกี่ยวกับโจทย์', 'ต้องกรอกข้อมูลส่วนตัวจำนวนมาก'],
      explanation: 'ข้อมูลที่นำมาใช้ควรเกี่ยวข้อง น่าเชื่อถือ ปลอดภัย และเคารพสิทธิของผู้อื่น',
    },
    {
      difficulty: 'medium',
      question: `การทำงานเป็นคู่ในกิจกรรม “${activity}” แบบใดแสดงความรับผิดชอบ`,
      correct: 'แบ่งหน้าที่ รับฟังกัน ตรวจงานร่วมกัน และบอกแหล่งที่มาของข้อมูล',
      distractors: ['ให้คนเดียวทำทั้งหมด', 'ต่างคนต่างทำโดยไม่ตรวจรวม', 'ใช้ผลงานผู้อื่นโดยไม่บอกที่มา'],
      explanation: 'การร่วมมือที่ดีต้องมีหน้าที่ชัดเจน รับฟัง ตรวจสอบ และเคารพผลงานผู้อื่น',
    },
    {
      difficulty: 'hard',
      question: `มีวิธีแก้ปัญหา 2 วิธีสำหรับ “${topic}” วิธีใดควรถูกเลือก`,
      correct: 'วิธีที่ผ่านเงื่อนไข ใช้ทรัพยากรเหมาะสม และมีผลทดสอบสนับสนุน',
      distractors: ['วิธีที่ยาวที่สุด', 'วิธีที่ใช้สีมากที่สุด', 'วิธีที่เพื่อนส่วนใหญ่เดาโดยยังไม่ทดสอบ'],
      explanation: 'ควรเปรียบเทียบด้วยเงื่อนไข ประสิทธิภาพ และหลักฐานจากการทดสอบ ไม่ใช่ความชอบเพียงอย่างเดียว',
    },
    {
      difficulty: 'hard',
      question: `หลังจบงานตาม ${indicator.code} ข้อใดเป็นการสะท้อนผลที่มีคุณภาพ`,
      correct: 'ระบุสิ่งที่ทำได้ หลักฐาน ปัญหาที่พบ สาเหตุ และแผนปรับปรุงครั้งถัดไป',
      distractors: ['บอกเพียงว่างานง่ายหรือยาก', 'ให้คะแนนตนเองโดยไม่มีเหตุผล', 'ลบข้อผิดพลาดออกโดยไม่บันทึก'],
      explanation: 'การสะท้อนผลที่ดีเชื่อมผลลัพธ์กับหลักฐานและนำไปสู่การปรับปรุงที่ชัดเจน',
    },
  ];

  return scenarios.map((scenario, index) => {
    const answer = (indicatorIndex + index) % 4;
    return {
      ...scenario,
      options: questionOptions(scenario.correct, scenario.distractors, answer),
      answer,
    };
  });
};

const makeDailyQuestions = () => {
  const bank = [
    ['ถ้าโปรแกรมทำงานไม่ตรงที่คาด ควรทำอะไรเป็นอันดับแรก', ['ตรวจคำสั่งทีละขั้น', 'สุ่มลบคำสั่งทั้งหมด', 'ปิดเครื่องทันที', 'คัดลอกงานเพื่อน'], 0],
    ['ข้อมูลส่วนตัวข้อใดไม่ควรเผยแพร่ในที่สาธารณะ', ['สีที่ชอบ', 'รหัสผ่าน', 'วิชาที่ชอบ', 'งานอดิเรกทั่วไป'], 1],
    ['ข้อใดเป็นลำดับการแก้ปัญหาที่เหมาะสม', ['เข้าใจปัญหา วางแผน ลงมือ ตรวจสอบ', 'ลงมือ ส่งงาน อ่านโจทย์', 'เดา ลบ ส่ง', 'คัดลอก เปลี่ยนชื่อ ส่ง'], 0],
    ['เมื่อนำรูปจากอินเทอร์เน็ตมาใช้ ควรทำอย่างไร', ['ระบุแหล่งที่มาและตรวจสิทธิการใช้', 'ลบชื่อเจ้าของ', 'อ้างว่าเป็นรูปของตน', 'ส่งต่อทันที'], 0],
    ['อุปกรณ์ใดใช้พิมพ์ตัวอักษรเข้าสู่คอมพิวเตอร์', ['จอภาพ', 'ลำโพง', 'แป้นพิมพ์', 'เครื่องพิมพ์'], 2],
    ['ข้อใดเป็นผลลัพธ์ (Output) ของระบบคอมพิวเตอร์', ['การคลิกเมาส์', 'การพิมพ์คำสั่ง', 'ภาพที่แสดงบนจอ', 'การเสียบไมโครโฟน'], 2],
    ['รหัสผ่านแบบใดปลอดภัยกว่า', ['123456', 'ชื่อเล่น', 'ชุดอักษร ตัวเลข และสัญลักษณ์ที่คาดเดายาก', 'วันเกิด'], 2],
    ['ถ้าได้รับข้อความจากคนแปลกหน้าขอข้อมูลส่วนตัว ควรทำอย่างไร', ['ส่งให้ทันที', 'ไม่ตอบและแจ้งผู้ใหญ่ที่ไว้ใจ', 'นัดพบ', 'ส่งต่อให้เพื่อน'], 1],
    ['การทดสอบหลายกรณีช่วยเรื่องใด', ['ทำให้พบข้อผิดพลาดที่ต่างกัน', 'ทำให้ไม่ต้องวางแผน', 'ทำให้คำตอบถูกเสมอ', 'ทำให้ไม่ต้องอธิบาย'], 0],
    ['ข้อใดแสดงการทำงานร่วมกันที่ดี', ['แบ่งหน้าที่และตรวจงานร่วมกัน', 'ให้คนเดียวทำทั้งหมด', 'ไม่ฟังความคิดเห็น', 'คัดลอกโดยไม่บอก'], 0],
  ];
  const items = [];
  const cursor = new Date(`${TODAY}T00:00:00`);
  while (items.length < 30) {
    if (cursor.getDay() !== 0 && cursor.getDay() !== 6) {
      const date = isoDate(cursor);
      const [question, options, correctIndex] = bank[items.length % bank.length];
      items.push({ date, question, options, correctIndex, createdAt: NOW, createdBy: 'system-seed-2569' });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return items;
};

const decodeFirestoreValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeFirestoreValue);
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, child]) => [key, decodeFirestoreValue(child)]),
    );
  }
  return undefined;
};

const encodeFirestoreValue = (value) => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value)
      ? { integerValue: String(value) }
      : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(encodeFirestoreValue) } };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(
        Object.entries(value)
          .filter(([, child]) => child !== undefined)
          .map(([key, child]) => [key, encodeFirestoreValue(child)]),
      ),
    },
  };
};

const encodeFields = (data) => Object.fromEntries(
  Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, encodeFirestoreValue(value)]),
);

const listCollection = async (rest, collectionName) => {
  const documents = [];
  let pageToken = '';
  do {
    const url = new URL(`${rest.documentsBase}/${collectionName}`);
    url.searchParams.set('pageSize', '300');
    url.searchParams.set('key', rest.apiKey);
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!response.ok) throw new Error(`${collectionName} read failed: ${response.status} ${await response.text()}`);
    const payload = await response.json();
    (payload.documents || []).forEach((item) => {
      const rawId = item.name.split('/').at(-1);
      let id = rawId;
      try { id = decodeURIComponent(rawId); } catch { /* Firestore may already return Unicode. */ }
      documents.push({
        id,
        data: Object.fromEntries(
          Object.entries(item.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)]),
        ),
      });
    });
    pageToken = payload.nextPageToken || '';
  } while (pageToken);
  return documents;
};

const getDocument = async (rest, documentPath) => {
  const url = new URL(`${rest.documentsBase}/${documentPath}`);
  url.searchParams.set('key', rest.apiKey);
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`${documentPath} read failed: ${response.status} ${await response.text()}`);
  const item = await response.json();
  return Object.fromEntries(
    Object.entries(item.fields || {}).map(([key, value]) => [key, decodeFirestoreValue(value)]),
  );
};

const chunkedWrite = async (rest, writes, size = 300) => {
  for (let start = 0; start < writes.length; start += size) {
    const payload = {
      writes: writes.slice(start, start + size).map(({ collectionName, id, data, merge = true }) => {
        const cleaned = JSON.parse(JSON.stringify(data));
        const write = {
          update: {
            name: `${rest.documentRoot}/${collectionName}/${id}`,
            fields: encodeFields(cleaned),
          },
        };
        if (merge) write.updateMask = { fieldPaths: Object.keys(cleaned) };
        return write;
      }),
    };
    const url = `${rest.commitUrl}?key=${encodeURIComponent(rest.apiKey)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`commit failed: ${response.status} ${await response.text()}`);
    console.log(`wrote ${Math.min(start + size, writes.length)}/${writes.length}`);
  }
};

const main = async () => {
  const env = parseEnv(await readFile(path.resolve('.env'), 'utf8'));
  const documentRoot = `projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const rest = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    documentRoot,
    documentsBase: `https://firestore.googleapis.com/v1/${documentRoot}`,
    commitUrl: `https://firestore.googleapis.com/v1/projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
  };

  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });

  try {
    const [curriculum, schedules, plans, students, templates, competencyPlans] = await Promise.all([
      server.ssrLoadModule('/src/data/curriculum.ts'),
      server.ssrLoadModule('/src/data/technologyTeachingSchedule.ts'),
      server.ssrLoadModule('/src/data/technologyLessonPlans.ts'),
      server.ssrLoadModule('/src/data/students2569.ts'),
      server.ssrLoadModule('/src/data/studentAssessmentTemplates.ts'),
      server.ssrLoadModule('/src/data/primaryTechnologyCompetencyPlans.ts'),
    ]);

    const [progressDocs, sessionDocs, gradeDocs, assessmentDocs, remoteRosterDocument] = await Promise.all([
      listCollection(rest, 'progress'),
      listCollection(rest, 'teachingSessions'),
      listCollection(rest, 'grades'),
      listCollection(rest, 'studentAssessments'),
      getDocument(rest, 'settings/rosters2569'),
    ]);
    const rosterSource = remoteRosterDocument?.classrooms
      && typeof remoteRosterDocument.classrooms === 'object'
      ? remoteRosterDocument.classrooms
      : students.students2569;
    const classrooms = students.allClassrooms2569.filter((classroom) => Array.isArray(rosterSource[classroom]));
    const savedSessions = new Map(sessionDocs.map((item) => [item.id, item.data]));
    const savedGrades = new Map(gradeDocs.map((item) => [item.id, item.data]));
    const savedAssessments = new Map(assessmentDocs.map((item) => [item.id, item.data]));
    const allPlans = plans.getAllTechnologyLessonPlans();
    const writes = [];
    const counts = {};
    const add = (collectionName, id, data, merge = true) => {
      writes.push({ collectionName, id, data, merge });
      counts[collectionName] = (counts[collectionName] || 0) + 1;
    };

    const scheduleRowsByGrade = {};
    TEACHING_IDS.forEach((gradeId) => {
      const schedule = schedules.buildTechnologyTeachingSchedule(gradeId);
      const subject = subjectFor(gradeId);
      scheduleRowsByGrade[gradeId] = schedule.rows.map((row) => ({
        ...row,
        plannedDate: dateForScheduleRow(gradeId, row),
      }));
      scheduleRowsByGrade[gradeId].forEach((row) => {
        const id = `${ACADEMIC_YEAR}_${gradeId}_${subject}_${String(row.period).padStart(2, '0')}`;
        const previous = savedSessions.get(id) || {};
        add('teachingSessions', id, {
          id,
          academicYear: ACADEMIC_YEAR,
          gradeId,
          classroom: schedule.gradeLabel,
          subject,
          period: row.period,
          week: row.week,
          semester: row.semester,
          unitNo: row.unitNo,
          unitTitle: row.unitTitle,
          lessonTitle: row.lessonTitle,
          indicatorCodes: row.indicators,
          plannedDate: row.plannedDate,
          learningActivity: row.learningActivity,
          evidence: row.evidence,
          assessment: row.assessment,
          status: previous.status || 'planned',
          ...(previous.teachingDate ? { teachingDate: previous.teachingDate } : {}),
          ...(previous.note ? { note: previous.note } : {}),
          ...(previous.startedAt ? { startedAt: previous.startedAt } : {}),
          ...(previous.completedAt ? { completedAt: previous.completedAt } : {}),
          updatedAt: NOW,
          updatedBy: 'system-seed-2569',
        });
      });
    });

    PRIMARY_IDS.forEach((gradeId) => {
      const classroom = classroomFor(gradeId);
      const roster = rosterSource[classroom] || [];
      scheduleRowsByGrade[gradeId]
        .filter((row) => row.plannedDate <= TODAY)
        .forEach((row) => {
          const id = gradeId === 'p1'
            ? `p1-plan-${row.period}-hour-1-${row.plannedDate}`
            : `${gradeId}-main-plan-${row.period}-hour-1-${row.plannedDate}`;
          const plan = allPlans[gradeId]?.find((item) => item.no === row.period);
          add('lessonRecords', id, {
            id,
            classroom,
            subject: 'main',
            courseName: 'เทคโนโลยี (วิทยาการคำนวณ)',
            planNo: row.period,
            hourNo: 1,
            teachingDate: row.plannedDate,
            indicatorCodes: row.indicators,
            snapshot: {
              present: 0,
              absent: 0,
              totalStudents: roster.length,
              passed: 0,
              averageK: 0,
              averageP: 0,
              attitudePassed: 0,
            },
            strengths: '',
            problems: '',
            causes: '',
            improvements: '',
            nextAction: '',
            teacherName: 'นายอนันตชัย เพ็ชรรี่',
            teacherPosition: 'ครูผู้สอน',
            status: 'draft',
            week: row.week,
            semester: row.semester,
            academicYear: ACADEMIC_YEAR,
            unitNo: row.unitNo,
            unitTitle: row.unitTitle,
            planTitle: plan?.title || row.lessonTitle,
            summary: 'ฉบับร่างอัตโนมัติ รอครูบันทึกผลจริงหลังสอนและกดยืนยันความสมบูรณ์',
            createdAt: NOW,
            updatedAt: NOW,
          });
        });
    });

    const classroomGroups = {};
    classrooms.forEach((classroom) => {
      const roster = rosterSource[classroom] || [];
      classroomGroups[classroom] = groupRoster(roster, classroom, progressDocs);
      const { mediumCodes } = classroomGroups[classroom];
      templates.studentAssessmentTemplates
        .filter((template) => template.id !== 'post-lesson')
        .forEach((template) => {
          const id = [ACADEMIC_YEAR, TERM, classroom, template.id, 'main'].map(safeId).join('__');
          const savedAssessment = savedAssessments.get(id);
          // ข้อมูลที่ครูยืนยันเป็นข้อมูลจริง ห้าม seed ตั้งต้นเขียนทับ
          if (savedAssessment?.confirmedByTeacher === true) return;
          const entries = Object.fromEntries(roster.map((student) => {
            const medium = mediumCodes.has(student.studentCode);
            return [student.studentCode, {
              studentCode: student.studentCode,
              studentNo: student.no,
              studentName: student.name,
              scores: Object.fromEntries(template.categories.map((category) => [category.id, medium ? 2 : 3])),
              note: medium
                ? 'ข้อมูลตั้งต้น: ระดับกลาง/ควรเสริมบางจุด กรุณาตรวจยืนยันจากหลักฐานจริง'
                : 'ข้อมูลตั้งต้น: ทำได้ดีพอสมควร กรุณาตรวจยืนยันจากหลักฐานจริง',
              supportPlan: medium
                ? 'จัดคู่ช่วยเรียน ให้คำใบ้ทีละขั้น และติดตามชิ้นงานระหว่างคาบ'
                : 'มอบโจทย์ท้าทายและบทบาทช่วยอธิบายกระบวนการแก่เพื่อน',
              evidence: 'จัดกลุ่มตั้งต้นจากความก้าวหน้าในเว็บและสัดส่วนที่ครูระบุ ไม่ใช่ผลประเมินสมบูรณ์',
            }];
          }));
          add('studentAssessments', id, {
            id,
            kind: template.id,
            classroom,
            academicYear: ACADEMIC_YEAR,
            term: TERM,
            contextKey: 'main',
            provisional: true,
            confirmedByTeacher: false,
            entries,
            meta: {
              subjectName: 'เทคโนโลยี (วิทยาการคำนวณ)',
              strengths: 'ผู้เรียนส่วนใหญ่ทำกิจกรรมได้ดีพอสมควร',
              problems: 'ประมาณร้อยละ 20-30 ของห้องควรได้รับคำชี้แนะและเวลาฝึกเพิ่ม',
              improvements: 'ใช้การจัดคู่ช่วยเรียน โจทย์หลายระดับ และติดตามรายบุคคลจากหลักฐานจริง',
              nextAction: 'ครูตรวจแก้รายบุคคลและยืนยันแบบประเมินก่อนใช้รายงานผล',
              status: 'draft',
            },
            updatedAt: NOW,
            updatedBy: 'system-provisional-2569',
          });
        });
    });

    competencyPlans.primaryTechnologyCompetencyPlans.forEach((plan) => {
      const classroom = plan.grade;
      const roster = rosterSource[classroom] || [];
      const { mediumCodes } = classroomGroups[classroom];
      roster.forEach((student) => {
        const medium = mediumCodes.has(student.studentCode);
        const id = safeId(`${ACADEMIC_YEAR}_${plan.id}_${classroom}_${student.studentCode}`).replace(/-/g, '_');
        add('primaryCompetencyAssessments', id, {
          id,
          academicYear: ACADEMIC_YEAR,
          planId: plan.id,
          grade: plan.grade,
          classroom,
          studentCode: student.studentCode,
          studentNo: student.no,
          studentName: student.name,
          kCorrect: medium ? 6 : 8,
          competencyScores: Array(5).fill(medium ? 2 : 3),
          characteristicScores: Array(5).fill(medium ? 2 : 3),
          note: 'ผลตั้งต้นตามสัดส่วนชั้นเรียนและความก้าวหน้าในเว็บ รอครูตรวจยืนยันก่อนใช้ตัดสินผล',
          kScore: medium ? 9 : 12,
          pLevel: medium ? 'ปานกลาง' : 'ดี',
          aPassed: true,
          linkedIndicatorIds: plan.subIndicators.map((indicator) => indicator.id),
          provisional: true,
          confirmedByTeacher: false,
          updatedAt: NOW,
        });
      });
    });

    GRADED_IDS.forEach((gradeId) => {
      const grade = curriculum.findGrade(gradeId);
      if (!grade) return;
      grade.indicators.forEach((indicator, indicatorIndex) => {
        buildIndicatorQuestions(grade, indicator, indicatorIndex).forEach((question, questionIndex) => {
          const id = `qb_2569_${safeId(gradeId)}_${String(indicatorIndex + 1).padStart(2, '0')}_${String(questionIndex + 1).padStart(2, '0')}`;
          add('questionBank', id, {
            id,
            classroom: classroomFor(gradeId),
            subject: subjectFor(gradeId),
            indicatorId: indicatorIdFor(gradeId, indicatorIndex),
            indicatorCode: indicator.code,
            difficulty: question.difficulty,
            question: question.question,
            options: question.options,
            answer: question.answer,
            explanation: question.explanation,
            attempts: 0,
            correct: 0,
            status: 'published',
            createdAt: NOW,
            updatedAt: NOW,
          });
        });
      });
    });

    PRIMARY_IDS.forEach((gradeId) => {
      const classroom = classroomFor(gradeId);
      const grade = curriculum.findGrade(gradeId);
      const schedule = scheduleRowsByGrade[gradeId];
      const manualAssessments = [];
      (grade?.units || []).forEach((unit) => {
        const indicatorIndex = unit.indicators?.[0] ?? 0;
        const indicatorId = indicatorIdFor(gradeId, indicatorIndex);
        const rows = schedule.filter((row) => row.unitNo === unit.no);
        const finalDate = rows.at(-1)?.plannedDate || TODAY;
        const due = new Date(`${finalDate}T00:00:00`);
        due.setDate(due.getDate() + 7);
        const assignmentId = `assignment_2569_${gradeId}_unit_${unit.no}`;
        const kId = `${assignmentId}_k`;
        const pId = `${assignmentId}_p`;
        const resourceUrl = `/curriculum/${gradeId}/unit/${unit.no}`;
        add('homeworkAssignments', assignmentId, {
          id: assignmentId,
          title: `งานประจำหน่วยที่ ${unit.no}: ${unit.title}`,
          description: `ศึกษาเนื้อหาในลิงก์ ทำกิจกรรมประจำหน่วย และส่งลิงก์ชิ้นงานพร้อมอธิบายขั้นตอน สิ่งที่ตรวจสอบ และสิ่งที่ปรับปรุง`,
          classroom,
          dueDate: isoDate(due),
          maxScore: 10,
          resourceUrl,
          knowledgeMaxScore: 5,
          practiceMaxScore: 5,
          createdAt: NOW,
          createdBy: 'system-seed-2569',
          subject: 'main',
          indicatorId,
          category: 'k',
          linkedKnowledgeAssessmentId: kId,
          linkedPracticeAssessmentId: pId,
          lessonPlanId: `${gradeId}-unit-${unit.no}`,
        });
        manualAssessments.push(
          { id: kId, title: `K งานหน่วยที่ ${unit.no}: ${unit.title}`, indicatorId, category: 'k', maxScore: 5, source: 'outside-web', groupId: assignmentId, resourceUrl, lessonPlanId: `${gradeId}-unit-${unit.no}`, createdAt: NOW },
          { id: pId, title: `P งานหน่วยที่ ${unit.no}: ${unit.title}`, indicatorId, category: 'p', maxScore: 5, source: 'outside-web', groupId: assignmentId, resourceUrl, lessonPlanId: `${gradeId}-unit-${unit.no}`, createdAt: NOW },
        );
      });
      const gradeDoc = savedGrades.get(classroom) || {};
      const existingManual = gradeDoc.manualAssessments || [];
      const seededIds = new Set(manualAssessments.map((item) => item.id));
      add('grades', classroom, {
        classroom,
        subject: 'main',
        manualAssessments: [
          ...existingManual.filter((item) => !seededIds.has(item.id)),
          ...manualAssessments,
        ],
        manualAssessmentScores: gradeDoc.manualAssessmentScores || {},
        manualUpdatedAt: NOW,
      });
    });

    add('announcements', 'system-ready-2569', {
      id: 'system-ready-2569',
      title: 'ระบบบทเรียนและงานปีการศึกษา 2569 พร้อมใช้งาน',
      body: 'นักเรียนเข้าเรียนตามตาราง ศึกษาบทเรียน ทำกิจกรรม และตรวจงานที่ได้รับมอบหมายในหน้า การบ้าน',
      type: 'info',
      pinned: true,
      createdAt: NOW,
    });
    add('announcements', 'homework-link-guide-2569', {
      id: 'homework-link-guide-2569',
      title: 'การส่งงานใช้ลิงก์ชิ้นงาน',
      body: 'เปิดสิทธิ์ให้ครูดูชิ้นงานก่อนส่งลิงก์ เช่น Canva หรือเอกสารออนไลน์ และตรวจว่าลิงก์ไม่เปิดเผยข้อมูลส่วนตัว',
      type: 'warn',
      createdAt: NOW,
    });

    PRIMARY_IDS.forEach((gradeId) => {
      const classroom = classroomFor(gradeId);
      const rows = scheduleRowsByGrade[gradeId];
      [
        { row: rows.find((item) => item.period === 20), label: 'ประเมินกลางปี' },
        { row: rows.find((item) => item.period === 40), label: 'ประเมินปลายปี' },
      ].forEach(({ row, label }) => {
        if (!row) return;
        const id = `exam_2569_${gradeId}_${row.period}`;
        add('events', id, {
          id,
          title: `${label} วิชาเทคโนโลยี ${classroom}`,
          desc: `ประเมิน K/P/A และชิ้นงานตามกำหนดการสอน คาบที่ ${row.period}`,
          type: 'exam',
          date: row.plannedDate,
          classroom,
          url: `/curriculum/${gradeId}/unit/${row.unitNo}`,
          createdAt: NOW,
        });
      });
    });
    add('events', 'term2-start-2569', {
      id: 'term2-start-2569',
      title: 'เริ่มกำหนดการสอนภาคเรียนที่ 2',
      desc: 'ระบบเริ่มใช้คาบที่ 21 เป็นต้นไปตามวันสอนประจำชั้น',
      type: 'activity',
      date: TERM_START[2],
      createdAt: NOW,
    });

    makeDailyQuestions().forEach((item) => add('dailyQuestions', item.date, item));

    const distribution = Object.fromEntries(classrooms.map((classroom) => {
      const total = rosterSource[classroom]?.length || 0;
      const medium = classroomGroups[classroom]?.mediumCount || 0;
      return [classroom, { total, medium, good: total - medium, mediumPercent: total ? Math.round((medium / total) * 100) : 0 }];
    }));
    console.log(JSON.stringify({
      mode: APPLY ? 'apply' : 'dry-run',
      projectId: env.VITE_FIREBASE_PROJECT_ID,
      today: TODAY,
      counts,
      totalWrites: writes.length,
      provisionalDistribution: distribution,
      learningEvidenceWrites: counts.learningEvidence || 0,
    }, null, 2));

    if (APPLY) await chunkedWrite(rest, writes);
  } finally {
    await server.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
