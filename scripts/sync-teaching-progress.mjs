import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { createServer } from 'vite';

const APPLY = process.argv.includes('--apply');
const AS_OF_ARG = process.argv.find((item) => item.startsWith('--as-of='));
const AS_OF = AS_OF_ARG ? new Date(AS_OF_ARG.slice('--as-of='.length)) : new Date();
const GRADE_IDS = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'm1', 'm2', 'm3'];

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
  if ('doubleValue' in value) return value.doubleValue;
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
    url.searchParams.set('pageSize', '500');
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

const commitWrites = async (rest, writes, size = 100) => {
  for (let start = 0; start < writes.length; start += size) {
    const batch = writes.slice(start, start + size);
    const payload = {
      writes: batch.map(({ id, data }) => ({
        update: {
          name: `${rest.documentRoot}/teachingSessions/${id}`,
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
    if (!response.ok) throw new Error(`teaching progress sync failed: ${response.status} ${await response.text()}`);
  }
};

const bangkokParts = (date) => Object.fromEntries(
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).filter((part) => part.type !== 'literal').map((part) => [part.type, part.value]),
);

const asOfState = (date) => {
  const parts = bangkokParts(date);
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

const sessionHasEnded = (session, slots, current) => {
  if (session.plannedDate < current.date) return true;
  if (session.plannedDate > current.date) return false;
  const slot = slots.find((item) => item.classroom === session.classroom && !item.excludeFromGrading);
  if (!slot) return false;
  const [hour, minute] = slot.end.split(':').map(Number);
  return current.minutes >= hour * 60 + minute;
};

const completionTimestamp = (session, slots) => {
  const slot = slots.find((item) => item.classroom === session.classroom && !item.excludeFromGrading);
  return new Date(`${session.plannedDate}T${slot?.end || '16:00'}:00+07:00`).getTime();
};

const main = async () => {
  if (Number.isNaN(AS_OF.getTime())) throw new Error('ค่า --as-of ไม่ถูกต้อง');
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
    const [teaching, scheduleModule, remoteDocuments] = await Promise.all([
      server.ssrLoadModule('/src/services/teachingSessionService.ts'),
      server.ssrLoadModule('/src/data/schedule.ts'),
      listCollection(rest, 'teachingSessions'),
    ]);
    const savedById = new Map(remoteDocuments.map((item) => [item.id, item.data]));
    const current = asOfState(AS_OF);
    const writes = [];
    const summary = {};

    GRADE_IDS.forEach((gradeId) => {
      const sessions = teaching.buildDefaultTeachingSessions(gradeId);
      let completed = 0;
      let currentPlan = null;
      sessions.forEach((canonical) => {
        const saved = savedById.get(canonical.id) || {};
        const elapsed = sessionHasEnded(canonical, scheduleModule.defaultSchedule, current);
        const status = saved.status === 'postponed'
          ? 'postponed'
          : saved.status === 'completed' || elapsed ? 'completed' : saved.status || 'planned';
        if (status === 'completed') completed += 1;
        if (canonical.plannedDate === current.date) currentPlan = canonical.period;
        writes.push({
          id: canonical.id,
          data: {
            ...saved,
            ...canonical,
            plannedDate: canonical.plannedDate,
            status,
            ...(status === 'completed' ? {
              teachingDate: saved.teachingDate || canonical.plannedDate,
              completedAt: Number(saved.completedAt) || completionTimestamp(canonical, scheduleModule.defaultSchedule),
            } : {}),
            updatedAt: Date.now(),
            updatedBy: 'calendar-progress-sync-2569',
          },
        });
      });
      summary[canonicalClassroom(sessions)] = { completed, currentPlan };
    });

    console.log(JSON.stringify({
      mode: APPLY ? 'apply' : 'dry-run',
      asOfBangkok: current,
      summary,
      writes: writes.length,
    }, null, 2));
    if (!APPLY) return;

    const backupDir = path.join(os.homedir(), '.codex', 'backups', 'krujamesoncom-website');
    await mkdir(backupDir, { recursive: true });
    const backupPath = path.join(backupDir, `teaching-progress-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    await writeFile(backupPath, JSON.stringify({ createdAt: new Date().toISOString(), remoteDocuments }, null, 2), 'utf8');
    await commitWrites(rest, writes);

    const verified = await listCollection(rest, 'teachingSessions');
    const p2 = verified.filter((item) => item.data.classroom === 'ป.2');
    const p2Today = p2.find((item) => item.data.plannedDate === current.date);
    const p2Completed = p2.filter((item) => item.data.status === 'completed').length;
    if (current.date === '2026-08-03' && (p2Today?.data.period !== 12 || p2Completed !== 11)) {
      throw new Error(`ป.2 ยังไม่ตรง: แผนวันนี้ ${p2Today?.data.period}, สอนแล้ว ${p2Completed}`);
    }
    console.log(JSON.stringify({ applied: true, p2Today: p2Today?.data.period, p2Completed, backupPath }));
  } finally {
    await server.close();
  }
};

const canonicalClassroom = (sessions) => sessions[0]?.classroom || '(unknown)';

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
