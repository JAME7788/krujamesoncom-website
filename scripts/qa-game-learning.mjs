import { chromium } from 'playwright-core';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const games = [...fs.readFileSync('src/data/gamesCatalog.ts', 'utf8').matchAll(/id:\s*'([^']+)'[\s\S]*?path:\s*'([^']+)'/g)].map(m => ({ id: m[1], path: m[2] }));
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || 'C:/Users/KruJames/AppData/Local/ms-playwright/chromium_headless_shell-1217/chrome-headless-shell-win64/chrome-headless-shell.exe' });
fs.mkdirSync('artifacts/game-learning', { recursive: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.addInitScript(() => sessionStorage.setItem('krujames_login_prompt_dismissed_v1', 'true'));
const failures = [];
try {
  for (const game of games) {
    try {
      await page.goto((process.env.QA_BASE_URL || 'http://127.0.0.1:5180') + game.path);
      await page.getByRole('button', { name: /ท้าทายตัวเอง/ }).click();
      assert.equal(await page.getByRole('button', { name: /ท้าทายตัวเอง/ }).getAttribute('aria-pressed'), 'true');
      const cover = page.locator('.gbl-art img');
      await cover.waitFor();
      await page.waitForFunction(() => { const img = document.querySelector('.gbl-art img'); return img?.complete && img.naturalWidth > 0; });
      if (game.id === 'binary') await page.screenshot({ path: 'artifacts/game-learning/mission-desktop.png' });
      await page.getByRole('button', { name: 'รับภารกิจและเข้าเกม', exact: true }).click();
      await page.getByRole('region', { name: 'ทบทวนหลังเล่น', exact: true }).waitFor();
      await page.waitForTimeout(400);
      if (game.id === 'cyber-shield') {
        await page.locator('.cyber-option-btn').first().click();
        await page.getByRole('button', { name: 'เข้าสู่สนามเครือข่าย วางป้อมปราการ 🛡️', exact: true }).click();
      }
      await page.getByRole('button', { name: 'ดูภารกิจ / คำใบ้', exact: true }).click();
      await page.getByRole('button', { name: 'คำใบ้ภารกิจ', exact: true }).click();
      await page.getByRole('button', { name: 'ย่อภารกิจ', exact: true }).click();
      const dialog = page.locator('dialog[open]');
      if (await dialog.count()) await page.keyboard.press('Escape');
      await page.screenshot({ path: `artifacts/game-learning/${game.id}.png` });
      assert(!/เกิดข้อผิดพลาดในการแสดงผล/.test(await page.locator('body').innerText()));
    } catch (error) { failures.push({ id: game.id, error: String(error) }); }
  }
  await page.goto((process.env.QA_BASE_URL || 'http://127.0.0.1:5180') + '/games/binary');
  await page.getByRole('button', { name: 'รับภารกิจและเข้าเกม', exact: true }).click();
  for (let round = 0; round < 12; round++) {
    const target = Number(await page.locator('.binary-target h1').innerText());
    for (const [index, bit] of [...target.toString(2).padStart(8, '0')].entries()) {
      if (bit === '1') await page.locator('.bit-btn').nth(index).click();
    }
    await page.getByRole('button', { name: '✓ ตรวจคำตอบ', exact: true }).click();
    await page.getByRole('button', { name: round === 11 ? 'ดูผลการเล่น' : 'ข้อต่อไป →', exact: true }).click();
  }
  await page.getByRole('button', { name: 'จบรอบแล้ว · ทบทวนสิ่งที่เรียนรู้', exact: true }).waitFor();
  const review = page.getByRole('region', { name: 'ทบทวนหลังเล่น', exact: true });
  await review.getByRole('button', { name: '101', exact: true }).click();
  await review.getByRole('status').filter({ hasText: 'ลองคิดอีกครั้ง' }).waitFor();
  await review.getByRole('button', { name: '5', exact: true }).click();
  await review.getByRole('textbox').fill('เปิดหลัก 4 และ 1 ได้ 5 รอบหน้าจะรวมค่าก่อนกด');
  await review.getByRole('button', { name: 'สรุปการฝึกครั้งนี้', exact: true }).click();
  await review.getByText('ทบทวนแล้ว', { exact: false }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await review.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'artifacts/game-learning/mobile-reflection.png' });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
  await page.goto((process.env.QA_BASE_URL || 'http://127.0.0.1:5180') + '/games/circuit-lab');
  await page.getByRole('button', { name: /ท้าทายตัวเอง/ }).click();
  await page.screenshot({ path: 'artifacts/game-learning/mission-mobile.png', fullPage: true });
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
} finally { await browser.close(); }
console.log(JSON.stringify({ routes: games.length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
