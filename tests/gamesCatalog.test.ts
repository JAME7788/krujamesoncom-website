import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { gamesCatalog } from '../src/data/gamesCatalog';

const appSource = readFileSync('src/App.tsx', 'utf8');
const definedRoutes = new Set(
  [...appSource.matchAll(/path="([^"]+)"/g)].map((m) => m[1]),
);

describe('แคตตาล็อกเกม (gamesCatalog)', () => {
  it('มีเกมอยู่จริงอย่างน้อย 10 เกม', () => {
    expect(gamesCatalog.length).toBeGreaterThanOrEqual(10);
  });

  it('id ของเกมต้องไม่ซ้ำกัน', () => {
    const ids = gamesCatalog.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('path ของเกมต้องไม่ซ้ำกัน', () => {
    const paths = gamesCatalog.map((g) => g.path);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('ทุกเกมต้องกรอกข้อมูลครบ (ชื่อ/คำอธิบาย/ระดับ/ทักษะ/สี)', () => {
    const incomplete = gamesCatalog.filter(
      (g) => !g.title?.trim() || !g.desc?.trim() || !g.level?.trim() || !g.skill?.trim() || !/^#[0-9a-f]{3,6}$/i.test(g.color),
    );
    expect(incomplete.map((g) => g.id)).toEqual([]);
  });

  it('ทุกเกมต้องมี route จริงใน App.tsx — กันลิงก์เสียในหน้าเกมและพอร์ทัล 3D', () => {
    const missing = gamesCatalog.filter((g) => !definedRoutes.has(g.path));
    expect(missing.map((g) => `${g.id} → ${g.path}`)).toEqual([]);
  });
});
