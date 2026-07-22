import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { PNG } from 'pngjs';

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const artifactDir = fileURLToPath(new URL('../.codex-artifacts/', import.meta.url));
const qaId = `run-${Date.now()}`;

await mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});

const student = {
  id: 'ป.1_1_นักเรียนทดสอบโลก3D',
  name: 'นักเรียนทดสอบโลก 3D',
  classroom: 'ป.1',
  studentNumber: '1',
  loginTime: Date.now(),
};

const results = [];

const inspectCanvas = async (page, name) => {
  const canvas = page.locator('.virtual-classroom-canvas canvas');
  await canvas.waitFor({ state: 'visible', timeout: 15_000 });
  // Custom slides arrive asynchronously and rebuild the Three.js scene once.
  await page.waitForTimeout(5_000);
  const box = await canvas.boundingBox();
  if (!box || box.width < 300 || box.height < 400) {
    throw new Error(`${name}: canvas มีขนาดผิดปกติ ${JSON.stringify(box)}`);
  }
  const image = await canvas.screenshot();
  const png = PNG.sync.read(image);
  const colors = new Set();
  let opaque = 0;
  const pixelCount = png.width * png.height;
  const step = Math.max(1, Math.floor(pixelCount / 20_000));
  for (let pixel = 0; pixel < pixelCount; pixel += step) {
    const offset = pixel * 4;
    if (png.data[offset + 3] > 240) opaque += 1;
    colors.add(`${png.data[offset] >> 4}-${png.data[offset + 1] >> 4}-${png.data[offset + 2] >> 4}`);
  }
  const sampled = Math.ceil(pixelCount / step);
  if (colors.size < 24 || opaque / sampled < 0.95) {
    throw new Error(`${name}: canvas อาจว่าง colors=${colors.size} opaque=${opaque}/${sampled}`);
  }
  return { width: Math.round(box.width), height: Math.round(box.height), colors: colors.size };
};

const verifyMovement = async (page, name) => {
  const canvas = page.locator('.virtual-classroom-canvas canvas');
  const before = PNG.sync.read(await canvas.screenshot());

  await page.keyboard.down('ArrowUp');
  await page.waitForTimeout(550);
  await page.keyboard.up('ArrowUp');
  await page.waitForTimeout(250);

  const after = PNG.sync.read(await canvas.screenshot());
  let changed = 0;
  const pixels = before.width * before.height;
  for (let i = 0; i < before.data.length; i += 4) {
    const delta = Math.abs(before.data[i] - after.data[i])
      + Math.abs(before.data[i + 1] - after.data[i + 1])
      + Math.abs(before.data[i + 2] - after.data[i + 2]);
    if (delta > 30) changed += 1;
  }

  const changedRatio = changed / pixels;
  if (changedRatio < 0.01) {
    throw new Error(`${name}: movement did not change the scene (${(changedRatio * 100).toFixed(2)}%)`);
  }
  return changedRatio;
};

const verifyJump = async (page, name) => {
  const canvas = page.locator('.virtual-classroom-canvas canvas');
  const before = PNG.sync.read(await canvas.screenshot());
  await page.getByRole('button', { name: 'กระโดด', exact: true }).click();
  await page.waitForTimeout(240);
  const after = PNG.sync.read(await canvas.screenshot());
  let changed = 0;
  const pixels = before.width * before.height;
  for (let i = 0; i < before.data.length; i += 4) {
    const delta = Math.abs(before.data[i] - after.data[i])
      + Math.abs(before.data[i + 1] - after.data[i + 1])
      + Math.abs(before.data[i + 2] - after.data[i + 2]);
    if (delta > 30) changed += 1;
  }
  const ratio = changed / pixels;
  if (ratio < 0.01) throw new Error(`${name}: jump did not move the 3D camera`);
  return ratio;
};

const findOverlaps = (rects) => {
  const overlaps = [];
  for (let i = 0; i < rects.length; i += 1) {
    for (let j = i + 1; j < rects.length; j += 1) {
      const a = rects[i];
      const b = rects[j];
      const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      if (width * height > 100) overlaps.push(`${a.name}<->${b.name}`);
    }
  }
  return overlaps;
};

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
]) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    isMobile: viewport.isMobile,
    hasTouch: viewport.isMobile,
  });
  await context.addInitScript((value) => {
    sessionStorage.setItem('current_student', JSON.stringify(value));
  }, student);
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.goto(`${baseUrl}/world?qa=${qaId}`, { waitUntil: 'domcontentloaded' });
  const canvas = await inspectCanvas(page, viewport.name);
  const movementRatio = await verifyMovement(page, viewport.name);
  const jumpRatio = await verifyJump(page, viewport.name);

  const hudRects = await page.locator(
    '.world-room-label,.world-avatar-badge,.world-star-score,.world-mode-control,.world-actions,.world-dpad',
  ).evaluateAll((elements) => elements.map((element) => {
    const rect = element.getBoundingClientRect();
    return {
      name: element.className,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
    };
  }));
  const overlaps = findOverlaps(hudRects);
  if (overlaps.length) throw new Error(`${viewport.name}: HUD ซ้อนกัน ${overlaps.join(', ')}`);

  await page.getByRole('button', { name: 'โหมดสร้าง', exact: true }).click();
  await page.getByRole('button', { name: 'วางบล็อก' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'สลับมุมมองตัวละคร' }).click();
  await page.getByRole('button', { name: 'สลับมุมมองตัวละคร' }).evaluate((button) => {
    if (!button.classList.contains('active')) throw new Error('third-person mode did not activate');
  });
  await page.getByRole('button', { name: 'สลับมุมมองตัวละคร' }).click();
  await page.getByRole('button', { name: 'โต้ตอบกับสไลด์หรือเกม' }).click();
  const debugPath = join(artifactDir, `virtual-world-${viewport.name}-interaction.png`);
  await page.screenshot({ path: debugPath, fullPage: true });
  try {
    await page.locator('.world-lesson-modal h2').waitFor({ timeout: 5_000 });
  } catch (error) {
    const status = await page.locator('.world-status').allTextContents();
    const headings = await page.getByRole('heading').allTextContents();
      throw new Error(`${viewport.name}: เปิดบอร์ดไม่ได้ status=${JSON.stringify(status)} headings=${JSON.stringify(headings)} ${error}`);
  }
  const lessonLibrary = page.locator('.world-lesson-library');
  await lessonLibrary.waitFor({ timeout: 5_000 });
  const lessonResourceCount = await lessonLibrary.locator('.world-resource-links a').count();
  const knowledgeCheck = lessonLibrary.locator('.world-knowledge-check');
  let knowledgeCheckPassed = false;
  if (await knowledgeCheck.count()) {
    await knowledgeCheck.locator('button').first().click();
    await knowledgeCheck.locator('button.correct').click();
    await knowledgeCheck.locator('.correct-text').waitFor({ timeout: 3_000 });
    knowledgeCheckPassed = true;
  }
  await lessonLibrary.scrollIntoViewIfNeeded();
  await page.screenshot({
    path: join(artifactDir, `virtual-world-${viewport.name}-lesson-details.png`),
    fullPage: true,
  });
  const slideCountText = await page.locator('.world-unit-number').textContent();
  const nextSlide = page.getByRole('button', { name: 'สไลด์ถัดไป' });
  if (await nextSlide.isEnabled()) await nextSlide.click();
  await page.getByRole('button', { name: 'ปิด', exact: true }).click();

  const screenshotPath = join(artifactDir, `virtual-world-${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  let blockPlacement = 'mobile controls available';
  let gamePortal = 'mobile station rendered';
  if (!viewport.isMobile) {
    const sceneCanvas = page.locator('.virtual-classroom-canvas canvas');
    const sceneBox = await sceneCanvas.boundingBox();
    if (!sceneBox) throw new Error('desktop: canvas bounds unavailable for block test');
    await sceneCanvas.dispatchEvent('pointerdown', {
      pointerType: 'touch', pointerId: 41, isPrimary: true, clientX: 100, clientY: 420,
    });
    await sceneCanvas.dispatchEvent('pointermove', {
      pointerType: 'touch', pointerId: 41, isPrimary: true, clientX: 310, clientY: 420,
    });
    await sceneCanvas.dispatchEvent('pointerup', {
      pointerType: 'touch', pointerId: 41, isPrimary: true, clientX: 310, clientY: 420,
    });
    await page.screenshot({ path: join(artifactDir, 'virtual-world-game-aim.png'), fullPage: true });
    await page.getByRole('button', { name: 'โต้ตอบกับสไลด์หรือเกม' }).click();
    try {
      await page.locator('.world-game-modal h2').waitFor({ timeout: 5_000 });
    } catch (error) {
      const status = await page.locator('.world-status').allTextContents();
      throw new Error(`desktop: game portal did not open status=${JSON.stringify(status)} ${error}`);
    }
    const gameHref = await page.locator('.world-play-game').getAttribute('href');
    if (!gameHref?.startsWith('/games/')) throw new Error(`desktop: invalid game portal ${gameHref}`);
    gamePortal = gameHref;
    await page.getByRole('button', { name: 'ปิด', exact: true }).click();
    await sceneCanvas.click({ position: { x: sceneBox.width / 2, y: sceneBox.height / 2 } });
    await page.waitForFunction(() => document.pointerLockElement !== null, null, { timeout: 5_000 });
    await page.mouse.move(
      sceneBox.x + sceneBox.width / 2,
      sceneBox.y + sceneBox.height / 2 + 280,
      { steps: 6 },
    );
    await page.keyboard.press('q');
    await page.waitForTimeout(700);
    const blockCount = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith('kj_virtual_world_'));
      return key ? JSON.parse(localStorage.getItem(key) || '[]').length : 0;
    });
    await page.keyboard.press('Escape');
    if (blockCount < 1) throw new Error('desktop: build mode did not persist a placed block');
    blockPlacement = `${blockCount} block persisted`;
  }
  results.push({
    viewport: viewport.name,
    canvas,
    movementRatio,
    jumpRatio,
    slideCountText,
    lessonResourceCount,
    knowledgeCheckPassed,
    blockPlacement,
    gamePortal,
    pageErrors,
    screenshot: screenshotPath,
  });
  await context.close();
}

// Separate browser contexts do not share localStorage/BroadcastChannel, so this verifies cloud sync.
const teacherContext = await browser.newContext({ viewport: { width: 1100, height: 760 } });
const studentContext = await browser.newContext({ viewport: { width: 1100, height: 760 } });
const teacherPage = await teacherContext.newPage();
const multiplayerWarnings = [];
teacherPage.on('console', (message) => {
  if (message.type() === 'warning') multiplayerWarnings.push(message.text());
});
await teacherPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await teacherPage.evaluate(() => {
  localStorage.setItem('krujames_admin_session_v1', JSON.stringify({
    expiresAt: Date.now() + 60 * 60 * 1000,
  }));
});
await teacherPage.goto(`${baseUrl}/world?qa=${qaId}`, { waitUntil: 'domcontentloaded' });
await teacherPage.locator('.virtual-classroom-canvas canvas').waitFor({ timeout: 15_000 });
await teacherPage.getByRole('combobox', { name: 'เลือกห้องเรียนที่ครูจะเข้าร่วม' }).waitFor();

const studentPage = await studentContext.newPage();
studentPage.on('console', (message) => {
  if (message.type() === 'warning') multiplayerWarnings.push(message.text());
});
await studentPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await studentPage.evaluate(() => {
  sessionStorage.setItem('current_student', JSON.stringify({
    id: 'ป.1_22_นักเรียนทดสอบพร้อมครู',
    name: 'นักเรียนทดสอบพร้อมครู',
    classroom: 'ป.1',
    studentNumber: '22',
    loginTime: Date.now(),
  }));
});
await studentPage.goto(`${baseUrl}/world?qa=${qaId}`, { waitUntil: 'domcontentloaded' });
await studentPage.locator('.virtual-classroom-canvas canvas').waitFor({ timeout: 15_000 });
try {
  await studentPage.waitForFunction(() => {
    const text = document.querySelector('.world-room-label span')?.textContent || '';
    return Number(text.replace(/\D/g, '')) >= 2;
  }, null, { timeout: 20_000 });
} catch (error) {
  const teacherLabel = await teacherPage.locator('.world-room-label').textContent();
  const studentLabel = await studentPage.locator('.world-room-label').textContent();
  throw new Error(`cross-context presence failed teacher=${teacherLabel} student=${studentLabel} warnings=${multiplayerWarnings.join(' | ')} ${error}`);
}
await studentPage.getByRole('button', { name: 'ปรับตัวละครและดูผู้เล่นในห้อง' }).click();
await studentPage.getByText('ครู อนันตชัย', { exact: true }).waitFor({ timeout: 8_000 });
await studentPage.locator('.world-avatar-panel').getByRole('button', { name: 'ปิดแผงตัวละคร' }).click();

await teacherPage.getByRole('button', { name: 'ควบคุมห้องเรียน' }).click();
const teacherPanel = teacherPage.locator('.world-teacher-panel');
await teacherPanel.waitFor({ timeout: 5_000 });

// Approval gate: student is held, teacher approves, then student can move again.
await teacherPanel.getByRole('button', { name: /ครูอนุมัติก่อนเข้า/ }).click();
await studentPage.getByRole('heading', { name: 'ส่งคำขอเข้าห้องแล้ว' }).waitFor({ timeout: 8_000 });
await teacherPanel.getByRole('button', { name: 'อนุมัติ นักเรียนทดสอบพร้อมครู' }).waitFor({ timeout: 8_000 });
await teacherPanel.getByRole('button', { name: 'อนุมัติ นักเรียนทดสอบพร้อมครู' }).click();
await studentPage.locator('.world-access-overlay').waitFor({ state: 'hidden', timeout: 8_000 });

// Teacher locks movement and building for the whole room.
await teacherPanel.getByRole('button', { name: /พักการเดิน/ }).click();
await studentPage.getByRole('button', { name: 'กระโดด', exact: true }).waitFor({ state: 'visible' });
await studentPage.waitForFunction(() => {
  const button = document.querySelector('button[aria-label="กระโดด"]');
  return button instanceof HTMLButtonElement && button.disabled;
}, null, { timeout: 8_000 });
await teacherPanel.getByRole('button', { name: /ปิดโหมดสร้าง/ }).click();
await studentPage.waitForFunction(() => {
  const button = document.querySelector('button[aria-label="โหมดสร้าง"]');
  return button instanceof HTMLButtonElement && button.disabled;
}, null, { timeout: 8_000 });
await teacherPanel.getByRole('button', { name: /พักการเดิน/ }).click();
await teacherPanel.getByRole('button', { name: /ปิดโหมดสร้าง/ }).click();

// Teacher starts a game and students receive the same station.
await teacherPanel.getByTitle(/เริ่ม /).first().click();
await studentPage.locator('.world-game-modal').waitFor({ timeout: 8_000 });
await studentPage.locator('.world-game-modal').getByRole('button', { name: 'ปิด' }).click();

// Access code is hashed in room state and checked before re-entry.
await teacherPanel.getByRole('textbox', { name: 'รหัสเข้าห้องใหม่' }).fill('2468');
await teacherPanel.getByRole('button', { name: 'บันทึก' }).click();
await studentPage.getByRole('heading', { name: 'ใส่รหัสเข้าห้อง' }).waitFor({ timeout: 8_000 });
await studentPage.getByRole('textbox', { name: 'รหัสเข้าห้อง' }).fill('2468');
await studentPage.getByRole('button', { name: 'เข้าห้อง' }).click();
await studentPage.locator('.world-access-overlay').waitFor({ state: 'hidden', timeout: 8_000 });

// Kick and restore access.
await teacherPanel.getByRole('button', { name: 'นำ นักเรียนทดสอบพร้อมครู ออกจากห้อง' }).click();
await studentPage.getByRole('heading', { name: 'ครูนำออกจากห้องชั่วคราว' }).waitFor({ timeout: 8_000 });
await teacherPanel.getByRole('button', { name: 'อนุญาต นักเรียนทดสอบพร้อมครู อีกครั้ง' }).click();
await studentPage.getByRole('heading', { name: 'ส่งคำขอเข้าห้องแล้ว' }).waitFor({ timeout: 8_000 });
await teacherPanel.getByRole('button', { name: 'อนุมัติ นักเรียนทดสอบพร้อมครู' }).click();
await studentPage.locator('.world-access-overlay').waitFor({ state: 'hidden', timeout: 8_000 });

// Graphics control switches renderer quality and recreates a visible canvas.
await studentPage.getByRole('button', { name: 'ปรับตัวละครและดูผู้เล่นในห้อง' }).click();
await studentPage.getByRole('button', { name: 'เบา', exact: true }).click();
await studentPage.locator('.virtual-classroom-canvas canvas').waitFor({ state: 'visible', timeout: 12_000 });
await studentPage.locator('.world-avatar-panel').getByRole('button', { name: 'ปิดแผงตัวละคร' }).click();
const multiplayerScreenshot = join(artifactDir, 'virtual-world-teacher-student.png');
await studentPage.screenshot({ path: multiplayerScreenshot, fullPage: true });
const teacherControlScreenshot = join(artifactDir, 'virtual-world-teacher-controls.png');
await teacherPage.screenshot({ path: teacherControlScreenshot, fullPage: true });
results.push({
  viewport: 'teacher-and-student',
  onlineTogether: true,
  teacherControls: ['approval', 'movement-lock', 'build-lock', 'game-sync', 'access-code', 'kick', 'graphics-low'],
  syncBackend: multiplayerWarnings.some((message) => /local|unavailable/i.test(message))
    ? 'local-fallback'
    : 'firebase',
  screenshot: multiplayerScreenshot,
  teacherControlScreenshot,
});
await studentContext.close();
await teacherPage.evaluate(() => window.dispatchEvent(new Event('kj-world-qa-cleanup')));
await teacherPage.waitForTimeout(1_000);
await teacherContext.close();

const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const adminPage = await adminContext.newPage();
const adminErrors = [];
adminPage.on('pageerror', (error) => adminErrors.push(error.message));
await adminPage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await adminPage.evaluate(() => {
  localStorage.setItem('krujames_admin_session_v1', JSON.stringify({
    expiresAt: Date.now() + 60 * 60 * 1000,
  }));
});
await adminPage.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
await adminPage.getByRole('button', { name: 'ห้องเรียน 3D' }).click();
await adminPage.locator('.vcm').waitFor({ timeout: 12_000 });
const adminScreenshot = join(artifactDir, 'virtual-world-admin-dashboard.png');
await adminPage.screenshot({ path: adminScreenshot, fullPage: true });
if (adminErrors.length) throw new Error(`admin 3D dashboard page errors: ${adminErrors.join(', ')}`);
results.push({
  viewport: 'admin-dashboard',
  kpiCount: await adminPage.locator('.vcm-kpis > span').count(),
  roomControlCount: await adminPage.locator('.vcm-controls button').count(),
  pageErrors: adminErrors,
  screenshot: adminScreenshot,
});
await adminContext.close();

await browser.close();
console.log(JSON.stringify({ ok: true, results }, null, 2));
