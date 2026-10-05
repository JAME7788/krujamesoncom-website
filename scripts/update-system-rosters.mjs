import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';

const root = process.cwd();
const apply = process.argv.includes('--apply');
const now = Date.now();

// 1. Load env
const envPath = path.join(root, '.env');
const env = Object.fromEntries(
  fs
    .readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).replace(/^["']|["']$/g, '').trim()];
    })
);

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

// 2. Import students2569.ts
const filePath = path.join(root, 'src/data/students2569.ts');
const source = fs.readFileSync(filePath, 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 },
  fileName: filePath,
}).outputText;
const url = `data:text/javascript;base64,${Buffer.from(output).toString('base64')}`;
const { students2569 } = await import(url);

console.log('================================================================');
console.log('🔄 อัปเดตรายชื่อนักเรียนในระบบกลาง (settings/rosters2569)');
console.log('================================================================');

for (const [c, roster] of Object.entries(students2569)) {
  console.log(`ห้อง ${c}: ${roster.length} คน`);
  if (['ม.1', 'ม.2', 'ม.3'].includes(c)) {
    console.log(roster.map((s) => `  ${s.no}. [${s.studentCode}] ${s.name}`).join('\n'));
  }
}

const ref = doc(db, 'settings', 'rosters2569');
const snap = await getDoc(ref);
const existingData = snap.exists() ? snap.data() : {};

// Backup
const backupDir = path.join(root, 'backups');
if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
const backupPath = path.join(backupDir, `rosters2569_backup_${now}.json`);
fs.writeFileSync(backupPath, JSON.stringify(existingData, null, 2), 'utf8');
console.log(`\n💾 สำรองข้อมูล rosters2569 เดิมไว้ที่: ${backupPath}`);

if (apply) {
  console.log('\n🚀 กำลังบันทึก settings/rosters2569 ลง Firestore...');
  await setDoc(ref, {
    classrooms: students2569,
    academicYear: '2569',
    updatedAt: now,
  });
  console.log('✅ บันทึก settings/rosters2569 สำเร็จเรียบร้อย!');
} else {
  console.log('\n⚠️ โหมด DRY-RUN: เพื่อบันทึกจริงให้รัน: node scripts/update-system-rosters.mjs --apply');
}

process.exit(0);
