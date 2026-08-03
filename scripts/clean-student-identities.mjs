import { access, mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';

const APPLY = process.argv.includes('--apply');
const NOW = Date.now();
const require = createRequire(import.meta.url);

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
    if (!response.ok) throw new Error(`${collectionName} read failed: ${response.status}`);
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
  if (!response.ok) throw new Error(`${documentPath} read failed: ${response.status}`);
  const item = await response.json();
  return Object.fromEntries(
    Object.entries(item.fields || {}).map(([key, value]) => [key, decodeValue(value)]),
  );
};

const normalizeName = (value) => String(value || '').replace(/\s+/g, '').trim();
const canonicalId = (classroom, student) => `${classroom}_${student.no}_${normalizeName(student.name)}`;
const keyOf = (classroom, value) => `${classroom}:${String(value || '').trim()}`;

const uniquePrimitive = (items) => [...new Set(items.filter((item) => item !== undefined && item !== null))];
const uniqueObjects = (items, keyBuilder) => {
  const seen = new Set();
  return items.filter((item) => {
    const key = keyBuilder(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const bestQuiz = (left, right) => {
  const leftRate = Number(left.bestQuizMax || 0) > 0 ? Number(left.bestQuizScore || 0) / Number(left.bestQuizMax) : 0;
  const rightRate = Number(right.bestQuizMax || 0) > 0 ? Number(right.bestQuizScore || 0) / Number(right.bestQuizMax) : 0;
  return rightRate > leftRate || (rightRate === leftRate && Number(right.bestQuizScore || 0) > Number(left.bestQuizScore || 0))
    ? right
    : left;
};

const mergeUnit = (left = {}, right = {}) => {
  const quiz = bestQuiz(left, right);
  const attempts = [left.lastAttempt, right.lastAttempt].filter(Boolean)
    .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0));
  const scoreEvidence = uniqueObjects(
    [...(left.scoreEvidence || []), ...(right.scoreEvidence || [])],
    (item) => item?.id || JSON.stringify(item),
  ).slice(-240);
  const worldEvidence = uniqueObjects(
    [...(left.worldEvidence || []), ...(right.worldEvidence || [])],
    (item) => item?.id || JSON.stringify(item),
  ).slice(-80);
  const slidesViewed = uniquePrimitive([...(left.slidesViewed || []), ...(right.slidesViewed || [])])
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  const videosClicked = uniquePrimitive([...(left.videosClicked || []), ...(right.videosClicked || [])]).map(String);
  const funClicked = uniquePrimitive([...(left.funClicked || []), ...(right.funClicked || [])]).map(String);
  const articlesClicked = uniquePrimitive([...(left.articlesClicked || []), ...(right.articlesClicked || [])]).map(String);
  const practiceCompleted = uniquePrimitive([...(left.practiceCompleted || []), ...(right.practiceCompleted || [])]).map(String);
  const totalSlides = Math.max(Number(left.totalSlides || 0), Number(right.totalSlides || 0));
  const mediaCount = videosClicked.length + funClicked.length + articlesClicked.length + practiceCompleted.length;
  const slidePct = totalSlides > 0 ? (slidesViewed.length / totalSlides) * 100 : 0;
  const mediaPct = mediaCount > 0 ? Math.min(100, mediaCount * 25) : 0;
  const quizPct = Number(quiz.bestQuizMax || 0) > 0
    ? (Number(quiz.bestQuizScore || 0) / Number(quiz.bestQuizMax)) * 100
    : 0;
  const completionPct = Math.round(Math.min(100, totalSlides > 0
    ? slidePct * 0.4 + mediaPct * 0.2 + quizPct * 0.4
    : mediaPct * 0.4 + quizPct * 0.6));
  return {
    ...left,
    ...right,
    slidesViewed,
    totalSlides,
    videosClicked,
    funClicked,
    articlesClicked,
    practiceCompleted,
    bestQuizScore: Number(quiz.bestQuizScore || 0),
    bestQuizMax: Number(quiz.bestQuizMax || 0),
    quizAttempts: Math.max(Number(left.quizAttempts || 0), Number(right.quizAttempts || 0)),
    ...(attempts[0] ? { lastAttempt: attempts[0] } : {}),
    completionPct,
    inClassDays: uniquePrimitive([...(left.inClassDays || []), ...(right.inClassDays || [])]).map(String),
    scoreEvidence,
    worldEvidence,
    worldKnowledgeCorrect: Math.max(Number(left.worldKnowledgeCorrect || 0), Number(right.worldKnowledgeCorrect || 0)),
    worldKnowledgeMax: Math.max(Number(left.worldKnowledgeMax || 0), Number(right.worldKnowledgeMax || 0)),
    updatedAt: Math.max(Number(left.updatedAt || 0), Number(right.updatedAt || 0)),
  };
};

const mergeProgress = (canonical, records) => {
  const merged = records.reduce((result, item) => {
    const data = item.data || {};
    const units = { ...(result.units || {}) };
    Object.entries(data.units || {}).forEach(([key, unit]) => {
      units[key] = mergeUnit(units[key], unit);
    });
    return {
      ...result,
      ...data,
      units,
      attempts: uniqueObjects(
        [...(result.attempts || []), ...(data.attempts || [])],
        (entry) => `${entry?.gradeId}|${entry?.unitNo}|${entry?.timestamp}|${entry?.score}|${entry?.maxScore}`,
      ).slice(-300),
      activities: uniqueObjects(
        [...(result.activities || []), ...(data.activities || [])],
        (entry) => `${entry?.type}|${entry?.gradeId}|${entry?.unitNo}|${entry?.timestamp}|${entry?.detail || ''}|${entry?.index ?? ''}`,
      ).slice(-500),
      daysActive: uniquePrimitive([...(result.daysActive || []), ...(data.daysActive || [])]).map(String).slice(-365),
      inClassDays: uniquePrimitive([...(result.inClassDays || []), ...(data.inClassDays || [])]).map(String).slice(-365),
      bonuses: uniqueObjects(
        [...(result.bonuses || []), ...(data.bonuses || [])],
        (entry) => `${entry?.reason}|${entry?.awardedAt}|${entry?.xp}`,
      ).slice(-50),
      bonusXp: Math.max(Number(result.bonusXp || 0), Number(data.bonusXp || 0)),
      lastActive: Math.max(Number(result.lastActive || 0), Number(data.lastActive || 0)),
    };
  }, {
    studentId: canonical.id,
    units: {},
    attempts: [],
    activities: [],
    totalPoints: 0,
    totalSlidesViewed: 0,
    totalActivities: 0,
    unitsCompleted: 0,
    lastActive: 0,
    daysActive: [],
    inClassDays: [],
    bonusXp: 0,
    bonuses: [],
  });
  merged.studentId = canonical.id;
  merged.studentCode = canonical.student.studentCode;
  merged.studentName = canonical.student.name;
  merged.classroom = canonical.classroom;
  merged.studentNo = canonical.student.no;
  merged.totalSlidesViewed = Object.values(merged.units).reduce((sum, unit) => sum + (unit.slidesViewed?.length || 0), 0);
  merged.totalActivities = Object.values(merged.units).reduce((sum, unit) => (
    sum
    + (unit.videosClicked?.length || 0)
    + (unit.funClicked?.length || 0)
    + (unit.articlesClicked?.length || 0)
    + (unit.practiceCompleted?.length || 0)
  ), 0);
  merged.totalPoints = Object.values(merged.units).reduce((sum, unit) => sum + Number(unit.bestQuizScore || 0), 0);
  merged.unitsCompleted = Object.values(merged.units).filter((unit) => Number(unit.completionPct || 0) >= 80).length;
  merged.identityCleanedAt = NOW;
  return merged;
};

const mergeLegacyStudent = (canonical, records) => {
  const result = records.reduce((merged, item) => {
    const next = { ...merged, ...item.data };
    const units = { ...(merged.units || {}) };
    Object.entries(item.data?.units || {}).forEach(([key, unit]) => {
      const current = units[key] || {};
      units[key] = {
        ...current,
        ...unit,
        k: Math.max(Number(current.k || 0), Number(unit.k || 0)),
        maxK: Math.max(Number(current.maxK || 0), Number(unit.maxK || 0)),
      };
    });
    next.units = units;
    next.totalPoints = Math.max(Number(merged.totalPoints || 0), Number(item.data?.totalPoints || 0));
    return next;
  }, {});
  return {
    ...result,
    id: canonical.id,
    name: canonical.student.name,
    classroom: canonical.classroom,
    studentNumber: String(canonical.student.no),
    studentCode: canonical.student.studentCode,
    accountType: 'student',
    identityCleanedAt: NOW,
  };
};

const commitPublicUpdates = async (rest, writes, size = 300) => {
  for (let start = 0; start < writes.length; start += size) {
    const payload = {
      writes: writes.slice(start, start + size).map((write) => {
        const data = JSON.parse(JSON.stringify(write.data));
        return {
          update: {
            name: `${rest.documentRoot}/${write.collectionName}/${write.id}`,
            fields: encodeFields(data),
          },
        };
      }),
    };
    const response = await fetch(`${rest.commitUrl}?key=${encodeURIComponent(rest.apiKey)}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`identity merge failed: ${response.status} ${await response.text()}`);
    console.log(`merged ${Math.min(start + size, writes.length)}/${writes.length}`);
  }
};

const findFirebaseCli = async () => {
  const npxRoot = path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'npm-cache', '_npx');
  const candidates = [];
  for (const folder of await readdir(npxRoot)) {
    const candidate = path.join(npxRoot, folder, 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
    try {
      await access(candidate);
      candidates.push({ candidate, modified: (await stat(candidate)).mtimeMs });
    } catch { /* not a firebase-tools cache entry */ }
  }
  candidates.sort((a, b) => b.modified - a.modified);
  if (!candidates[0]) throw new Error('firebase-tools CLI was not found in the npm cache');
  return candidates[0].candidate;
};

const deleteAliasDocuments = async (projectId, deletions, size = 250) => {
  const cli = await findFirebaseCli();
  const libRoot = path.resolve(path.dirname(cli), '..');
  const { configstore } = require(path.join(libRoot, 'configstore.js'));
  const auth = require(path.join(libRoot, 'auth.js'));
  const firestore = require(path.join(libRoot, 'gcp', 'firestore.js'));
  const tokens = configstore.get('tokens');
  if (!tokens?.refresh_token) throw new Error('Firebase CLI refresh token is unavailable');
  auth.setRefreshToken(tokens.refresh_token);
  const root = `projects/${projectId}/databases/(default)/documents`;
  for (let start = 0; start < deletions.length; start += size) {
    const documents = deletions.slice(start, start + size).map((item) => ({
      name: `${root}/${item.collectionName}/${item.id}`,
    }));
    await firestore.deleteDocuments(projectId, documents, '(default)');
    console.log(`deleted ${Math.min(start + size, deletions.length)}/${deletions.length}`);
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
  const server = await createServer({ appType: 'custom', logLevel: 'silent', server: { middlewareMode: true } });
  try {
    const rosterModule = await server.ssrLoadModule('/src/data/students2569.ts');
    const remoteRosterDocument = await getDocument(rest, 'settings/rosters2569');
    const rosterSource = remoteRosterDocument?.classrooms
      && typeof remoteRosterDocument.classrooms === 'object'
      ? remoteRosterDocument.classrooms
      : rosterModule.students2569;
    const canonical = [];
    Object.entries(rosterSource).forEach(([classroom, roster]) => {
      roster.forEach((student) => canonical.push({
        id: canonicalId(classroom, student),
        classroom,
        student,
      }));
    });
    const byId = new Map(canonical.map((item) => [item.id, item]));
    const byCode = new Map(canonical.map((item) => [String(item.student.studentCode), item]));
    const byNumber = new Map(canonical.map((item) => [keyOf(item.classroom, item.student.no), item]));
    const byName = new Map(canonical.map((item) => [keyOf(item.classroom, normalizeName(item.student.name)), item]));

    const matchCanonical = (record) => {
      const data = record.data || {};
      const directValues = [record.id, data.id, data.studentId].map(String);
      const testIdentity = [record.id, data.id, data.studentId, data.studentName, data.name]
        .map((value) => String(value || ''))
        .join(' ');
      if (/ทดสอบ|external_visitor_|(?:^|[_-])qa(?:[_-]|$)/i.test(testIdentity)) return null;
      for (const value of directValues) {
        if (byId.has(value)) return byId.get(value);
        if (byCode.has(value)) return byCode.get(value);
      }
      if (data.studentCode && byCode.has(String(data.studentCode))) return byCode.get(String(data.studentCode));
      const classroom = String(data.classroom || directValues.find((value) => /^(ป|ม)\.\d+_/.test(value))?.split('_')[0] || '');
      const number = data.studentNumber ?? data.studentNo ?? data.no;
      if (number !== undefined && byNumber.has(keyOf(classroom, number))) return byNumber.get(keyOf(classroom, number));
      const name = data.studentName ?? data.name;
      if (name && byName.has(keyOf(classroom, normalizeName(name)))) return byName.get(keyOf(classroom, normalizeName(name)));
      for (const value of directValues) {
        const parts = value.split('_');
        if (parts.length >= 3) {
          const parsedClassroom = parts[0];
          if (byNumber.has(keyOf(parsedClassroom, parts[1]))) return byNumber.get(keyOf(parsedClassroom, parts[1]));
          const parsedName = parts.slice(2).join('_');
          if (byName.has(keyOf(parsedClassroom, normalizeName(parsedName)))) return byName.get(keyOf(parsedClassroom, normalizeName(parsedName)));
        }
      }
      return null;
    };

    const [studentDocs, progressDocs, competencyDocs] = await Promise.all([
      listCollection(rest, 'students'),
      listCollection(rest, 'progress'),
      listCollection(rest, 'primaryCompetencyAssessments'),
    ]);
    const studentGroups = new Map(canonical.map((item) => [item.id, []]));
    const progressGroups = new Map(canonical.map((item) => [item.id, []]));
    const unmappedStudents = [];
    const unmappedProgress = [];
    studentDocs.forEach((item) => {
      const target = matchCanonical(item);
      if (target) studentGroups.get(target.id).push(item);
      else unmappedStudents.push(item);
    });
    progressDocs.forEach((item) => {
      const target = matchCanonical(item);
      if (target) progressGroups.get(target.id).push(item);
      else unmappedProgress.push(item);
    });

    const writes = [];
    canonical.forEach((item) => {
      writes.push({ collectionName: 'students', id: item.id, data: mergeLegacyStudent(item, studentGroups.get(item.id)) });
      writes.push({ collectionName: 'progress', id: item.id, data: mergeProgress(item, progressGroups.get(item.id)) });
    });
    studentDocs.filter((item) => !byId.has(item.id)).forEach((item) => {
      writes.push({ collectionName: 'students', id: item.id, delete: true });
    });
    progressDocs.filter((item) => !byId.has(item.id)).forEach((item) => {
      writes.push({ collectionName: 'progress', id: item.id, delete: true });
    });
    const rosterCodesByClassroom = new Map(Object.entries(rosterSource).map(([classroom, roster]) => [
      classroom,
      new Set(roster.map((student) => String(student.studentCode))),
    ]));
    competencyDocs.forEach((item) => {
      const classroom = String(item.data?.classroom || item.data?.grade || '');
      const studentCode = String(item.data?.studentCode || '');
      if (!rosterCodesByClassroom.get(classroom)?.has(studentCode)) {
        writes.push({ collectionName: 'primaryCompetencyAssessments', id: item.id, delete: true });
      }
    });

    const mappedStudentAliases = studentDocs.length - unmappedStudents.length - studentDocs.filter((item) => byId.has(item.id)).length;
    const mappedProgressAliases = progressDocs.length - unmappedProgress.length - progressDocs.filter((item) => byId.has(item.id)).length;
    const candidateDeletes = writes
      .filter((item) => item.delete)
      .map((item) => `${item.collectionName}/${item.id}`);
    const report = {
      mode: APPLY ? 'apply' : 'dry-run',
      canonicalStudents: canonical.length,
      before: { students: studentDocs.length, progress: progressDocs.length },
      aliasesMerged: { students: mappedStudentAliases, progress: mappedProgressAliases },
      unmappedRemovedAfterBackup: { students: unmappedStudents.length, progress: unmappedProgress.length },
      staleCompetencyAssessments: writes.filter((item) => (
        item.delete && item.collectionName === 'primaryCompetencyAssessments'
      )).length,
      expectedAfter: { students: canonical.length, progress: canonical.length },
      writes: writes.length,
      candidateDeletes,
    };
    console.log(JSON.stringify(report, null, 2));

    if (APPLY) {
      const backupDir = path.join(os.homedir(), '.codex', 'backups', 'krujamesoncom-website');
      await mkdir(backupDir, { recursive: true });
      const backupPath = path.join(backupDir, `student-identity-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
      await writeFile(
        backupPath,
        JSON.stringify({ createdAt: new Date().toISOString(), studentDocs, progressDocs, competencyDocs }, null, 2),
        'utf8',
      );
      const updates = writes.filter((item) => !item.delete);
      const deletions = writes.filter((item) => item.delete);
      await commitPublicUpdates(rest, updates);
      await deleteAliasDocuments(env.VITE_FIREBASE_PROJECT_ID, deletions);
      console.log(JSON.stringify({ backupPath, applied: true }));
    }
  } finally {
    await server.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
