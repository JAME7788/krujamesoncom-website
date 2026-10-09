import { readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const parseEnv = (source) => Object.fromEntries(
  source.split(/\r?\n/)
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, '')];
    }),
);
const env = parseEnv(await readFile('.env', 'utf8'));
const secretPath = process.env.STUDENT_AUTH_SECRET_FILE
  || path.join(os.homedir(), 'Desktop', 'KruJames-student-auth-private.json');
const secrets = JSON.parse(await readFile(secretPath, 'utf8'));
const account = Object.values(secrets)[0];
if (!account) throw new Error('ไม่พบบัญชีนักเรียนในไฟล์ส่วนตัว');

const response = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(env.VITE_FIREBASE_API_KEY)}`,
  {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: account.email,
      password: account.pin,
      returnSecureToken: true,
    }),
  },
);
const payload = await response.json();
if (!response.ok) throw new Error(payload.error?.message || `เข้าสู่ระบบไม่สำเร็จ ${response.status}`);
const claims = JSON.parse(Buffer.from(payload.idToken.split('.')[1], 'base64url').toString('utf8'));
const projectId = env.VITE_FIREBASE_PROJECT_ID;
const documentUrl = (collection, id) => (
  `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}`
  + `/databases/(default)/documents/${collection}/${encodeURIComponent(id)}`
);
const authorizedGet = (url) => fetch(url, {
  headers: { authorization: `Bearer ${payload.idToken}` },
});
const otherAccount = Object.values(secrets).find((candidate) => candidate.studentId !== account.studentId);
const [ownStudent, ownProgress, otherStudent, questionBank] = await Promise.all([
  authorizedGet(documentUrl('students', account.studentId)),
  authorizedGet(documentUrl('progress', account.studentId)),
  authorizedGet(documentUrl('students', otherAccount.studentId)),
  authorizedGet(
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}`
    + '/databases/(default)/documents/questionBank?pageSize=1',
  ),
]);
console.log(JSON.stringify({
  login: true,
  role: claims.role,
  studentIdMatches: claims.studentId === account.studentId,
  configuredAccounts: Object.keys(secrets).length,
  firestore: {
    ownStudentReadable: ownStudent.ok,
    ownProgressReadable: ownProgress.ok,
    otherStudentDenied: otherStudent.status === 403,
    questionBankDenied: questionBank.status === 403,
  },
}, null, 2));
