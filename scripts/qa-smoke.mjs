/**
 * Smoke test — เปิดทุกหน้าสำคัญของเว็บด้วยเบราว์เซอร์จริง แล้วตรวจว่า
 * (1) หน้าโหลดขึ้น (mount) (2) ไม่มี JavaScript error
 *
 * ใช้ก่อน deploy ทุกครั้ง:
 *   1) npm run build
 *   2) npx serve -s dist -l 5173
 *   3) npm run qa:smoke
 *
 * ตั้งค่าได้ผ่าน env: QA_BASE_URL, CHROME_PATH
 */
import { chromium } from 'playwright-core';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

const student = {
  id: 'ป.5_1_ทดสอบระบบ', name: 'ทดสอบระบบ', classroom: 'ป.5', studentNumber: '1', loginTime: Date.now(),
};

/** auth: null = ไม่ต้องล็อกอิน, 'student' = นักเรียน, 'admin' = ครู */
const ROUTES = [
  { path: '/', auth: null }, { path: '/login', auth: null },
  { path: '/courses', auth: null }, { path: '/curriculum', auth: null },
  { path: '/resources', auth: null }, { path: '/games', auth: null },
  { path: '/tools', auth: 'student' }, { path: '/dashboard', auth: 'student' },
  { path: '/homework', auth: 'student' }, { path: '/report-card', auth: 'student' },
  { path: '/world', auth: 'student', wait: 4000 },
  { path: '/admin', auth: 'admin' },
  {
    path: '/admin?tab=gradebook',
    auth: 'admin',
    mustInclude: 'สมุดเก็บคะแนน K/P/A',
    mustExclude: 'กำลังดึงคะแนนจาก Firebase',
  },
  {
    path: '/admin?tab=assessments',
    auth: 'admin',
    mustInclude: 'แบบประเมินและบันทึกหลังสอน',
    mustExclude: 'กำลังดึงรายชื่อและผลประเมิน',
  },
  { path: '/admin?tab=p1-plan', auth: 'admin', wait: 4000, mustInclude: 'แผนพร้อมสอน' },
  { path: '/admin?tab=research', auth: 'admin', mustInclude: 'สร้างเอกสารงานวิจัย' },
];

/** เกมทุกเกมที่มีใน catalog — ดึงอัตโนมัติเพื่อไม่ต้องแก้ลิสต์เมื่อเพิ่มเกมใหม่ */
const gamePaths = async () => {
  const src = await import('node:fs').then((fs) => fs.readFileSync('src/data/gamesCatalog.ts', 'utf8'));
  return [...src.matchAll(/path:\s*'(\/games\/[^']+)'/g)].map((m) => m[1]);
};

const run = async () => {
  const browser = await chromium.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
  });

  const targets = [
    ...ROUTES,
    ...(await gamePaths()).map((p) => ({ path: p, auth: 'student' })),
  ];
  const selectedTargets = process.env.QA_ROUTE
    ? targets.filter((target) => target.path === process.env.QA_ROUTE)
    : targets;

  const failures = [];
  let passed = 0;

  for (const target of selectedTargets) {
    const context = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    if (target.auth) {
      await context.addInitScript((arg) => {
        if (arg.role === 'student') sessionStorage.setItem('current_student', JSON.stringify(arg.student));
        if (arg.role === 'admin') localStorage.setItem('krujames_admin_session_v1', JSON.stringify({ expiresAt: Date.now() + 3600000 }));
      }, { role: target.auth, student });
    }
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message.slice(0, 120)));
    try {
      await page.goto(baseUrl + target.path, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(target.wait || 1500);
      const pageState = await page.evaluate(({ mustInclude, mustExclude }) => {
        const root = document.getElementById('root');
        const bodyText = document.body?.innerText || '';
        return {
          mounted: !!root && root.childElementCount > 0,
          includesExpected: !mustInclude || bodyText.includes(mustInclude),
          excludesBlockedState: !mustExclude || !bodyText.includes(mustExclude),
          headings: Array.from(document.querySelectorAll('h1,h2,h3'))
            .slice(0, 8)
            .map((element) => element.textContent?.trim())
            .filter(Boolean),
        };
      }, {
        mustInclude: target.mustInclude || '',
        mustExclude: target.mustExclude || '',
      });
      if (
        pageState.mounted
        && pageState.includesExpected
        && pageState.excludesBlockedState
        && errors.length === 0
      ) passed += 1;
      else failures.push({ path: target.path, ...pageState, errors });
    } catch (e) {
      failures.push({ path: target.path, error: String(e).slice(0, 120) });
    }
    await context.close();
  }

  await browser.close();

  console.log(`\nSmoke test: ${passed}/${selectedTargets.length} ผ่าน`);
  if (failures.length) {
    console.error('ไม่ผ่าน:', JSON.stringify(failures, null, 2));
    process.exit(1);
  }
  console.log('ทุกหน้าเปิดได้ปกติ ไม่มี error');
};

run().catch((e) => { console.error(e); process.exit(1); });
