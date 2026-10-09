import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { randomInt } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';

const APPLY = process.argv.includes('--apply');
const require = createRequire(import.meta.url);
const emailFor = (studentCode) => `student.${String(studentCode).trim().toLowerCase()}@students.krujames.com`;
const normalizeName = (value) => String(value || '').replace(/\s+/g, '').trim();
const studentIdFor = (classroom, student) => `${classroom}_${student.no}_${normalizeName(student.name)}`;
const secretPath = process.env.STUDENT_AUTH_SECRET_FILE
  || path.join(os.homedir(), 'Desktop', 'KruJames-student-auth-private.json');
const csvPath = process.env.STUDENT_AUTH_CSV_FILE
  || path.join(os.homedir(), 'Desktop', 'รหัส-PIN-นักเรียน-KruJames.csv');

const parseEnv = (source) => Object.fromEntries(
  source.split(/\r?\n/).map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim().replace(/^(['"])(.*)\1$/, '$2')];
    }),
);

const encodeValue = (value) => {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  return { nullValue: null };
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
  if (!candidates[0]) throw new Error('ไม่พบ Firebase CLI กรุณารัน npx firebase-tools login ก่อน');
  return candidates[0].candidate;
};

const identityRequest = async (apiKey, endpoint, body) => {
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${endpoint}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message || `Identity Toolkit failed: ${response.status}`);
  return payload;
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
const withRetry = async (label, operation, attempts = 6) => {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const retryable = /TOO_MANY_ATTEMPTS|429|RESOURCE_EXHAUSTED|timeout|ECONNRESET/i.test(message);
      if (!retryable || attempt === attempts) throw error;
      const delay = Math.min(45_000, 5_000 * (2 ** (attempt - 1)));
      console.log(`${label}: Firebase จำกัดคำขอชั่วคราว รอ ${Math.round(delay / 1000)} วินาที (${attempt}/${attempts})`);
      await wait(delay);
    }
  }
  throw lastError;
};

const loadRoster = async () => {
  const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
  try {
    const module = await server.ssrLoadModule('/src/data/students2569.ts');
    return module.students2569;
  } finally {
    await server.close();
  }
};

const loadSecrets = async () => {
  try { return JSON.parse(await readFile(secretPath, 'utf8')); } catch { return {}; }
};

const csvCell = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

const main = async () => {
  const env = parseEnv(await readFile(path.resolve('.env'), 'utf8'));
  const roster = await loadRoster();
  const students = Object.entries(roster).flatMap(([classroom, items]) => (
    items.map((student) => ({ classroom, ...student, studentId: studentIdFor(classroom, student) }))
  ));
  const duplicateCodes = students.filter((student, index) => (
    students.findIndex((item) => item.studentCode === student.studentCode) !== index
  ));
  if (duplicateCodes.length) throw new Error(`พบรหัสนักเรียนซ้ำ ${duplicateCodes.length} รายการ`);

  console.log(JSON.stringify({
    mode: APPLY ? 'apply' : 'dry-run',
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    students: students.length,
    output: APPLY ? csvPath : undefined,
  }, null, 2));
  if (!APPLY) return;

  const cli = await findFirebaseCli();
  const libRoot = path.resolve(path.dirname(cli), '..');
  const { configstore } = require(path.join(libRoot, 'configstore.js'));
  const authState = require(path.join(libRoot, 'auth.js'));
  const identityAdmin = require(path.join(libRoot, 'gcp', 'auth.js'));
  const apiv2 = require(path.join(libRoot, 'apiv2.js'));
  const api = require(path.join(libRoot, 'api.js'));
  const tokens = configstore.get('tokens');
  if (!tokens?.refresh_token) throw new Error('Firebase CLI login is required');
  authState.setRefreshToken(tokens.refresh_token);

  const identityConfigClient = new apiv2.Client({ auth: true, urlPrefix: api.identityOrigin() });
  await identityConfigClient.patch(
    `/admin/v2/projects/${env.VITE_FIREBASE_PROJECT_ID}/config`,
    { signIn: { email: { enabled: true, passwordRequired: true } } },
    {
      queryParams: { updateMask: 'signIn.email.enabled,signIn.email.passwordRequired' },
      headers: { 'x-goog-user-project': env.VITE_FIREBASE_PROJECT_ID },
    },
  );

  const storedSecrets = await loadSecrets();
  const nextSecrets = { ...storedSecrets };
  const profiles = [];
  let created = 0;
  let updated = 0;
  await mkdir(path.dirname(secretPath), { recursive: true });
  for (const student of students) {
    const email = emailFor(student.studentCode);
    const pin = storedSecrets[student.studentCode]?.pin
      || String(randomInt(100000, 1000000));
    let account = null;
    try {
      account = await withRetry(`ค้นหาบัญชี ${student.studentCode}`, () => (
        identityAdmin.findUser(env.VITE_FIREBASE_PROJECT_ID, email)
      ));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (!/No users found/i.test(message)) throw error;
    }
    if (account) {
      if (!storedSecrets[student.studentCode]?.pin) {
        await withRetry(`ตั้ง PIN ${student.studentCode}`, () => identityConfigClient.post('/v1/accounts:update', {
          targetProjectId: env.VITE_FIREBASE_PROJECT_ID,
          localId: account.uid,
          password: pin,
          displayName: student.name,
        }));
      }
      updated += 1;
    } else {
      const createdAccount = await withRetry(`สร้างบัญชี ${student.studentCode}`, () => (
        identityRequest(env.VITE_FIREBASE_API_KEY, 'accounts:signUp', {
          email,
          password: pin,
          displayName: student.name,
          returnSecureToken: false,
        })
      ));
      account = { uid: createdAccount.localId };
      created += 1;
    }
    await withRetry(`กำหนดสิทธิ์ ${student.studentCode}`, () => identityAdmin.setCustomClaim(
      env.VITE_FIREBASE_PROJECT_ID,
      account.uid,
      {
        role: 'student',
        studentId: student.studentId,
        studentCode: student.studentCode,
        classroom: student.classroom,
      },
      { merge: false },
    ));
    nextSecrets[student.studentCode] = { pin, uid: account.uid, studentId: student.studentId, email };
    await writeFile(secretPath, JSON.stringify(nextSecrets, null, 2), { encoding: 'utf8', mode: 0o600 });
    profiles.push({
      uid: account.uid,
      studentId: student.studentId,
      studentCode: student.studentCode,
      classroom: student.classroom,
      studentNo: student.no,
      name: student.name,
      role: 'student',
      active: true,
      updatedAt: Date.now(),
    });
    if (profiles.length % 20 === 0) console.log(`configured ${profiles.length}/${students.length}`);
  }

  const firestoreClient = new apiv2.Client({ auth: true, apiVersion: 'v1', urlPrefix: api.firestoreOrigin() });
  for (let index = 0; index < profiles.length; index += 400) {
    const batch = profiles.slice(index, index + 400);
    await firestoreClient.post(
      `projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
      {
        writes: batch.map((profile) => ({
          update: {
            name: `projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/studentProfiles/${profile.uid}`,
            fields: Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, encodeValue(value)])),
          },
          updateMask: { fieldPaths: Object.keys(profile) },
        })),
      },
    );
  }

  await writeFile(secretPath, JSON.stringify(nextSecrets, null, 2), { encoding: 'utf8', mode: 0o600 });
  const csvRows = [
    ['ชั้น', 'เลขที่', 'รหัสนักเรียน', 'ชื่อ', 'PIN 6 หลัก'],
    ...students.map((student) => [
      student.classroom,
      student.no,
      student.studentCode,
      student.name,
      nextSecrets[student.studentCode].pin,
    ]),
  ];
  await writeFile(csvPath, `\uFEFF${csvRows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`, 'utf8');
  console.log(JSON.stringify({ configured: profiles.length, created, updated, csvPath, secretPath }, null, 2));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
