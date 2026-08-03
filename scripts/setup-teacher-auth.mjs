import { access, readFile, readdir, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';

const APPLY = process.argv.includes('--apply');
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
  if (!candidates[0]) throw new Error('firebase-tools CLI was not found in the npm cache');
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
  if (!response.ok) throw new Error(payload.error?.message || `Identity Toolkit request failed: ${response.status}`);
  return payload;
};

const main = async () => {
  const env = parseEnv(await readFile(path.resolve('.env'), 'utf8'));
  const email = env.VITE_TEACHER_AUTH_EMAIL;
  if (!email) throw new Error('VITE_TEACHER_AUTH_EMAIL is not configured');
  console.log(JSON.stringify({ mode: APPLY ? 'apply' : 'dry-run', projectId: env.VITE_FIREBASE_PROJECT_ID, emailConfigured: true }));
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

  let teacher;
  try {
    teacher = await identityAdmin.findUser(env.VITE_FIREBASE_PROJECT_ID, email);
  } catch {
    const temporaryPassword = `${crypto.randomUUID()}Aa9!`;
    await identityRequest(env.VITE_FIREBASE_API_KEY, 'accounts:signUp', {
      email,
      password: temporaryPassword,
      returnSecureToken: true,
    });
    teacher = await identityAdmin.findUser(env.VITE_FIREBASE_PROJECT_ID, email);
  }

  await identityAdmin.setCustomClaim(
    env.VITE_FIREBASE_PROJECT_ID,
    teacher.uid,
    { role: 'admin' },
    { merge: true },
  );

  const client = new apiv2.Client({ auth: true, apiVersion: 'v1', urlPrefix: api.firestoreOrigin() });
  const profile = {
    uid: teacher.uid,
    email,
    displayName: 'นายอนันตชัย เพ็ชรรี่',
    role: 'admin',
    active: true,
    updatedAt: Date.now(),
  };
  await client.post(
    `projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents:commit`,
    {
      writes: [{
        update: {
          name: `projects/${env.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents/teacherProfiles/${teacher.uid}`,
          fields: Object.fromEntries(Object.entries(profile).map(([key, value]) => [key, encodeValue(value)])),
        },
        updateMask: { fieldPaths: Object.keys(profile) },
      }],
    },
  );

  await identityRequest(env.VITE_FIREBASE_API_KEY, 'accounts:sendOobCode', {
    requestType: 'PASSWORD_RESET',
    email,
  });
  console.log(JSON.stringify({ configured: true, role: 'admin', active: true, passwordResetEmailSent: true }));
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
