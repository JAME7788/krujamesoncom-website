import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';

const APPLY = process.argv.includes('--apply');
const ACADEMIC_YEAR = '2569';
const TERM = '1';
const NOW = Date.now();
const UPDATED_BY = 'teacher-ability-profile-2026-08-03';

const parseEnv = (source) => Object.fromEntries(
  source
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
    }),
);

const safeId = (value) => value
  .trim()
  .replace(/[/.#$[\]]/g, '-')
  .replace(/\s+/g, '-')
  .slice(0, 120) || 'default';

const assessmentId = (classroom, kind, contextKey = 'main') => (
  [ACADEMIC_YEAR, TERM, classroom, kind, contextKey].map(safeId).join('__')
);

const classroomKey = (classroom) => classroom
  .replace('ป.', 'p')
  .replace('ม.', 'm')
  .replace(/[^a-zA-Z0-9_-]/g, '');

const lessonRecordId = (session) => {
  if (session.classroom === 'ป.1' && session.subject === 'main') {
    return `p1-plan-${session.period}-hour-1-${session.plannedDate}`;
  }
  return `${classroomKey(session.classroom)}-${session.subject}-plan-${session.period}-hour-1-${session.plannedDate}`;
};

const decodeValue = (value) => {
  if (!value || typeof value !== 'object') return value;
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return Number(value.doubleValue);
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in value) return Object.fromEntries(
    Object.entries(value.mapValue.fields || {}).map(([key, child]) => [key, decodeValue(child)]),
  );
  return undefined;
};

const encodeValue = (value) => {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return Number.isInteger(value)
    ? { integerValue: String(value) }
    : { doubleValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encodeValue) } };
  return { mapValue: { fields: Object.fromEntries(
    Object.entries(value)
      .filter(([, child]) => child !== undefined)
      .map(([key, child]) => [key, encodeValue(child)]),
  ) } };
};

const encodeFields = (data) => Object.fromEntries(
  Object.entries(data)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => [key, encodeValue(value)]),
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
    (payload.documents || []).forEach((item) => documents.push({
      id: item.name.split('/').at(-1),
      data: Object.fromEntries(
        Object.entries(item.fields || {}).map(([key, value]) => [key, decodeValue(value)]),
      ),
    }));
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
    Object.entries(item.fields || {}).map(([key, value]) => [key, decodeValue(value)]),
  );
};

const commitWrites = async (rest, writes, size = 100) => {
  for (let start = 0; start < writes.length; start += size) {
    const batch = writes.slice(start, start + size);
    const payload = {
      writes: batch.map(({ collectionName, id, data }) => ({
        update: {
          name: `${rest.documentRoot}/${collectionName}/${id}`,
          fields: encodeFields(data),
        },
        updateMask: { fieldPaths: Object.keys(data) },
      })),
    };
    const response = await fetch(`${rest.commitUrl}?key=${encodeURIComponent(rest.apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`ability sync failed: ${response.status} ${await response.text()}`);
    console.log(`wrote ${Math.min(start + size, writes.length)}/${writes.length}`);
  }
};

const average = (values) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : 0;

const main = async () => {
  const env = parseEnv(await readFile(path.resolve('.env'), 'utf8'));
  const documentRoot = `projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`;
  const rest = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    documentRoot,
    documentsBase: `https://firestore.googleapis.com/v1/${documentRoot}`,
    commitUrl: `https://firestore.googleapis.com/v1/projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
  };
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });

  try {
    const [templates, ability] = await Promise.all([
      server.ssrLoadModule('/src/data/studentAssessmentTemplates.ts'),
      server.ssrLoadModule('/src/data/studentAbilityProfile.ts'),
    ]);
    const [rosterDocument, assessmentDocs, competencyDocs, lessonRecordDocs, sessionDocs, attendanceDocs] = await Promise.all([
      getDocument(rest, 'settings/rosters2569'),
      listCollection(rest, 'studentAssessments'),
      listCollection(rest, 'primaryCompetencyAssessments'),
      listCollection(rest, 'lessonRecords'),
      listCollection(rest, 'teachingSessions'),
      listCollection(rest, 'attendance'),
    ]);
    const rosters = rosterDocument?.classrooms || {};
    const classrooms = Object.keys(rosters).sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
    const assessmentsById = new Map(assessmentDocs.map((item) => [item.id, item.data]));
    const lessonRecordsById = new Map(lessonRecordDocs.map((item) => [item.id, item.data]));
    const profiles = new Map();
    const targetPostIds = new Set();
    const targetRecordIds = new Set();
    const completedSessionCounts = {};
    const attendanceMatchedCounts = {};

    classrooms.forEach((classroom) => {
      const source = assessmentsById.get(assessmentId(classroom, 'learner-analysis'));
      if (!source) throw new Error(`ไม่พบผลวิเคราะห์ผู้เรียนของ ${classroom}`);
      const classroomProfiles = new Map();
      (rosters[classroom] || []).forEach((student) => {
        const entry = source.entries?.[student.studentCode];
        if (!entry?.scores) throw new Error(`${classroom} เลขที่ ${student.no} ไม่มีโปรไฟล์ฐาน`);
        classroomProfiles.set(
          student.studentCode,
          ability.scorePercent(entry.scores, templates.getStudentAssessmentTemplate('learner-analysis').categories.length),
        );
      });
      profiles.set(classroom, classroomProfiles);
    });

    const writes = [];
    const standardKinds = templates.studentAssessmentTemplates.filter((template) => (
      template.id !== 'learner-analysis' && template.id !== 'post-lesson'
    ));

    classrooms.forEach((classroom, classroomIndex) => {
      const roster = rosters[classroom] || [];
      standardKinds.forEach((template, templateIndex) => {
        const id = assessmentId(classroom, template.id);
        const current = assessmentsById.get(id) || {};
        if (current.confirmedByTeacher === true) return;
        const entries = { ...(current.entries || {}) };
        roster.forEach((student) => {
          const percent = profiles.get(classroom).get(student.studentCode);
          const copy = ability.abilityProfileCopy(percent);
          entries[student.studentCode] = {
            ...(entries[student.studentCode] || {}),
            studentCode: student.studentCode,
            studentNo: student.no,
            studentName: student.name,
            scores: ability.buildAbilityScores(
              template.categories.map((category) => category.id),
              percent,
              student.no + templateIndex + classroomIndex,
            ),
            note: copy.note,
            supportPlan: copy.supportPlan,
            evidence: 'อ้างอิงโปรไฟล์ความสามารถรายบุคคลที่ครูยืนยัน ปีการศึกษา 2569',
          };
        });
        writes.push({
          collectionName: 'studentAssessments',
          id,
          data: {
            id,
            kind: template.id,
            classroom,
            academicYear: ACADEMIC_YEAR,
            term: TERM,
            contextKey: 'main',
            entries,
            meta: current.meta || {},
            provisional: false,
            confirmedByTeacher: true,
            profileSource: 'learner-analysis',
            updatedAt: NOW,
            updatedBy: UPDATED_BY,
          },
        });
      });

      const sessions = sessionDocs
        .map((item) => item.data)
        .filter((session) => session.classroom === classroom && session.status === 'completed')
        .sort((a, b) => Number(a.period) - Number(b.period));
      completedSessionCounts[classroom] = sessions.length;
      attendanceMatchedCounts[classroom] = 0;
      if (sessions.length === 0) throw new Error(`${classroom} ยังไม่มีคาบสถานะสอนแล้ว`);

      sessions.forEach((session) => {
        const contextKey = `${session.plannedDate}__plan-${session.period}`;
        const id = assessmentId(classroom, 'post-lesson', contextKey);
        targetPostIds.add(id);
        const priorPlanDocument = assessmentDocs.find((item) => (
          item.data.classroom === classroom
          && item.data.kind === 'post-lesson'
          && Number(item.data.meta?.planNo) === Number(session.period)
        ));
        const current = assessmentsById.get(id) || priorPlanDocument?.data;
        const entries = {};
        roster.forEach((student) => {
          const percent = profiles.get(classroom).get(student.studentCode);
          const copy = ability.abilityProfileCopy(percent);
          entries[student.studentCode] = {
            ...(current?.entries?.[student.studentCode] || {}),
            studentCode: student.studentCode,
            studentNo: student.no,
            studentName: student.name,
            scores: ability.buildAbilityScores(['k', 'p', 'a'], percent, student.no + session.period),
            note: copy.note,
            supportPlan: copy.supportPlan,
            evidence: 'ฉบับร่างจากโปรไฟล์ความสามารถ รอครูบันทึกหลักฐานจริงหลังสอน',
          };
        });
        writes.push({
          collectionName: 'studentAssessments',
          id,
          data: {
            ...(current || {}),
            id,
            sessionId: session.id,
            kind: 'post-lesson',
            classroom,
            academicYear: ACADEMIC_YEAR,
            term: TERM,
            contextKey,
            entries: current?.confirmedByTeacher === true ? current.entries : entries,
            meta: {
              ...(current?.meta || {}),
              subjectName: session.subject === 'cs' ? 'วิทยาการคำนวณ' : 'เทคโนโลยี (วิทยาการคำนวณ)',
              unitName: session.unitTitle,
              lessonTitle: session.lessonTitle,
              planNo: String(session.period),
              teachingDate: session.plannedDate,
              strengths: '',
              problems: '',
              causes: '',
              improvements: '',
              nextAction: 'ครูตรวจหลักฐาน K/P/A รายคนและยืนยันหลังจบคาบ',
              suggestion: 'ข้อมูลนี้เป็นฉบับร่างจากโปรไฟล์ผู้เรียน ไม่ใช่ผลตัดสินสุดท้าย',
              status: current?.confirmedByTeacher === true ? current.meta?.status || 'complete' : 'draft',
            },
            archived: false,
            provisional: current?.confirmedByTeacher === true ? false : true,
            confirmedByTeacher: current?.confirmedByTeacher === true,
            profileSource: 'learner-analysis',
            updatedAt: NOW,
            updatedBy: 'system-post-plan-draft-2569',
          },
        });

        const priorRecordDocument = lessonRecordDocs.find((item) => (
          item.data.classroom === classroom
          && item.data.subject === session.subject
          && Number(item.data.planNo) === Number(session.period)
        ));
        const recordId = priorRecordDocument?.id || lessonRecordId(session);
        targetRecordIds.add(recordId);
        const currentRecord = lessonRecordsById.get(recordId) || priorRecordDocument?.data;
        if (currentRecord?.status === 'complete') return;
        const attendance = attendanceDocs.find((item) => (
          item.data.classroom === classroom
          && item.data.date === (session.teachingDate || session.plannedDate)
        ))?.data;
        if (attendance) attendanceMatchedCounts[classroom] += 1;
        const attendanceStatuses = Object.values(attendance?.records || {});
        const presentCount = attendanceStatuses.filter((status) => status === 'present' || status === 'late').length;
        const absentCount = attendanceStatuses.filter((status) => status === 'absent').length;
        const percents = roster.map((student) => profiles.get(classroom).get(student.studentCode));
        const passedCount = percents.filter((percent) => percent >= 60).length;
        const averagePercent = average(percents);
        writes.push({
          collectionName: 'lessonRecords',
          id: recordId,
          data: {
            id: recordId,
            sessionId: session.id,
            classroom,
            subject: session.subject,
            courseName: session.subject === 'cs' ? 'วิทยาการคำนวณ' : 'เทคโนโลยี (วิทยาการคำนวณ)',
            planNo: session.period,
            hourNo: 1,
            teachingDate: session.plannedDate,
            indicatorCodes: session.indicatorCodes || [],
            snapshot: {
              present: presentCount,
              absent: absentCount,
              totalStudents: roster.length,
              passed: passedCount,
              averageK: Math.round((averagePercent / 100) * 150) / 10,
              averageP: Math.round((averagePercent / 100) * 300) / 10,
              attitudePassed: percents.filter((percent) => percent >= 60).length,
            },
            totalStudents: roster.length,
            passedCount,
            failedCount: Math.max(0, roster.length - passedCount),
            strengths: 'ร่างจากโปรไฟล์ความสามารถรายบุคคล รอครูปรับตามหลักฐานที่เกิดขึ้นจริงในคาบ',
            problems: '',
            causes: '',
            improvements: 'ตรวจนักเรียนรายคนจากงาน แบบทดสอบ การปฏิบัติ และพฤติกรรมก่อนยืนยัน',
            nextAction: 'บันทึกผลจริงทันทีหลังสอนและเปลี่ยนสถานะเป็นสมบูรณ์',
            summary: 'ฉบับร่างหลังแผนจากโปรไฟล์ผู้เรียน ครูต้องตรวจและยืนยันผล K/P/A หลังสอน',
            teacherName: 'นายอนันตชัย เพ็ชรรี่',
            teacherPosition: 'ครูผู้สอน',
            status: 'draft',
            archived: false,
            week: session.week,
            semester: session.semester,
            academicYear: ACADEMIC_YEAR,
            unitNo: session.unitNo,
            unitTitle: session.unitTitle,
            planTitle: session.lessonTitle,
            createdAt: Number(currentRecord?.createdAt) || NOW,
            updatedAt: NOW,
          },
        });
      });
    });

    competencyDocs.forEach(({ id, data }) => {
      if (data.confirmedByTeacher === true) return;
      const percent = profiles.get(data.classroom)?.get(data.studentCode);
      if (percent === undefined) throw new Error(`ไม่พบโปรไฟล์สมรรถนะ ${data.classroom}/${data.studentCode}`);
      const competencyScores = Object.values(ability.buildAbilityScores(
        ['c1', 'c2', 'c3', 'c4', 'c5'],
        percent,
        Number(data.studentNo) || 0,
      ));
      const characteristicScores = Object.values(ability.buildAbilityScores(
        ['a1', 'a2', 'a3', 'a4', 'a5'],
        percent,
        (Number(data.studentNo) || 0) + 2,
      ));
      const competencyAverage = average(competencyScores);
      const characteristicAverage = average(characteristicScores);
      writes.push({
        collectionName: 'primaryCompetencyAssessments',
        id,
        data: {
          kCorrect: Math.max(0, Math.min(10, Math.round(percent / 10))),
          competencyScores,
          characteristicScores,
          kScore: Math.round((Math.max(0, Math.min(10, Math.round(percent / 10))) / 10) * 15),
          pLevel: competencyAverage >= 2.5 ? 'ดี' : competencyAverage >= 1.5 ? 'ปานกลาง' : 'พอใช้',
          aPassed: characteristicAverage >= 2,
          note: `${ability.abilityProfileCopy(percent).note} | ครูยืนยันโปรไฟล์ฐานแล้ว`,
          provisional: false,
          confirmedByTeacher: true,
          profileSource: 'learner-analysis',
          updatedAt: NOW,
        },
      });
    });

    assessmentDocs.forEach(({ id, data }) => {
      if (data.kind !== 'post-lesson' || targetPostIds.has(id) || data.archived === true) return;
      writes.push({ collectionName: 'studentAssessments', id, data: { archived: true, updatedAt: NOW } });
    });

    lessonRecordDocs.forEach(({ id, data }) => {
      if (targetRecordIds.has(id) || data.status === 'complete' || data.archived === true) return;
      writes.push({ collectionName: 'lessonRecords', id, data: { archived: true, updatedAt: NOW } });
    });

    const countByCollection = Object.fromEntries(
      [...new Set(writes.map((item) => item.collectionName))].map((collectionName) => [
        collectionName,
        writes.filter((item) => item.collectionName === collectionName).length,
      ]),
    );
    console.log(JSON.stringify({
      mode: APPLY ? 'apply' : 'dry-run',
      classrooms: classrooms.length,
      students: classrooms.reduce((sum, classroom) => sum + rosters[classroom].length, 0),
      standardAbilityAssessments: classrooms.length * standardKinds.length,
      completedSessionCounts,
      attendanceMatchedCounts,
      writes: countByCollection,
      totalWrites: writes.length,
    }, null, 2));
    if (!APPLY) return;

    const backupDir = path.join(os.homedir(), '.codex', 'backups', 'krujamesoncom-website');
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `student-ability-system-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await writeFile(backupPath, JSON.stringify({
      createdAt: new Date().toISOString(),
      assessmentDocs,
      competencyDocs,
      lessonRecordDocs,
      attendanceDocs,
    }, null, 2), 'utf8');
    await commitWrites(rest, writes);

    const [savedAssessments, savedCompetencies, savedRecords] = await Promise.all([
      listCollection(rest, 'studentAssessments'),
      listCollection(rest, 'primaryCompetencyAssessments'),
      listCollection(rest, 'lessonRecords'),
    ]);
    const postByClassroom = Object.fromEntries(classrooms.map((classroom) => [
      classroom,
      savedAssessments.filter((item) => (
        item.data.classroom === classroom
        && item.data.kind === 'post-lesson'
        && item.data.archived !== true
      )).length,
    ]));
    const activeRecordsByClassroom = Object.fromEntries(classrooms.map((classroom) => [
      classroom,
      savedRecords.filter((item) => item.data.classroom === classroom && item.data.archived !== true).length,
    ]));
    if (Object.entries(postByClassroom).some(([classroom, count]) => count !== completedSessionCounts[classroom])) {
      throw new Error(`จำนวนแบบหลังแผนไม่ครบ: ${JSON.stringify(postByClassroom)}`);
    }
    if (Object.entries(activeRecordsByClassroom).some(([classroom, count]) => count !== completedSessionCounts[classroom])) {
      throw new Error(`จำนวนบันทึกหลังสอนไม่ครบ: ${JSON.stringify(activeRecordsByClassroom)}`);
    }
    const confirmedCompetencies = savedCompetencies.filter((item) => item.data.confirmedByTeacher === true).length;
    console.log(JSON.stringify({
      applied: true,
      postByClassroom,
      activeRecordsByClassroom,
      confirmedCompetencies,
      backupPath,
    }));
  } finally {
    await server.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
