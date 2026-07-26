import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { getGameTargetUnits } from '../src/services/gameProgressService';
import type { GameProgressId } from '../src/services/gameProgressService';

const PRIMARY = ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'];
const MIDDLE = ['ม.1', 'ม.2', 'ม.3'];
const ALL_CLASSROOMS = [...PRIMARY, ...MIDDLE];

/** ดึง gameId ที่เกมใช้จริงจากซอร์ส เพื่อกันกรณีลืมผูกเกมใหม่เข้าระบบคะแนน */
const usedGameIds = (): string[] => {
  const dirs = ['src/pages/games', 'src/components'];
  const ids = new Set<string>();
  for (const dir of dirs) {
    for (const file of readdirSync(dir)) {
      if (!file.endsWith('.tsx') && !file.endsWith('.ts')) continue;
      const src = readFileSync(join(dir, file), 'utf8');
      for (const m of src.matchAll(/useGameProgress\(\s*'([^']+)'/g)) ids.add(m[1]);
    }
  }
  return [...ids];
};

describe('ระบบคะแนน — การผูกเกมเข้ากับหน่วยการเรียนรู้', () => {
  const ids = usedGameIds();

  it('ตรวจพบเกมที่ผูกระบบคะแนนแล้วอย่างน้อย 15 เกม', () => {
    expect(ids.length).toBeGreaterThanOrEqual(15);
  });

  it('ทุกเกมต้องให้คะแนนได้อย่างน้อย 1 ระดับชั้น — กันเกมที่เล่นแล้วไม่ได้คะแนนเลย', () => {
    const dead = ids.filter((id) =>
      ALL_CLASSROOMS.every((c) => getGameTargetUnits(id as GameProgressId, c).length === 0),
    );
    expect(dead).toEqual([]);
  });

  it('หน่วยที่ผูกต้องมี gradeId และ unitNo ที่ถูกต้อง', () => {
    const bad: string[] = [];
    for (const id of ids) {
      for (const c of ALL_CLASSROOMS) {
        for (const t of getGameTargetUnits(id as GameProgressId, c)) {
          if (!t.gradeId || !/^(p[1-6]|m[1-3])/.test(t.gradeId)) bad.push(`${id}/${c}: gradeId=${t.gradeId}`);
          if (!Number.isInteger(t.unitNo) || t.unitNo < 1) bad.push(`${id}/${c}: unitNo=${t.unitNo}`);
        }
      }
    }
    expect(bad).toEqual([]);
  });

  it('ห้องเรียนที่ไม่รู้จักต้องไม่ได้คะแนน (กันข้อมูลขยะ)', () => {
    expect(getGameTargetUnits('binary', 'อนุบาล 1')).toEqual([]);
    expect(getGameTargetUnits('binary', '')).toEqual([]);
  });

  it('เกมเลขฐานสองให้คะแนนเฉพาะ ม.ต้น (ตามหลักสูตร)', () => {
    PRIMARY.forEach((c) => expect(getGameTargetUnits('binary', c)).toEqual([]));
    MIDDLE.forEach((c) => expect(getGameTargetUnits('binary', c).length).toBeGreaterThan(0));
  });

  it('เกมสำหรับเด็กเล็กต้องให้คะแนนระดับประถมได้', () => {
    (['device-match', 'step-sort'] as GameProgressId[]).forEach((id) => {
      PRIMARY.forEach((c) => expect(getGameTargetUnits(id, c).length).toBeGreaterThan(0));
    });
  });

  it('ชื่อเกมแบบเก่า (maze/bug) ต้องให้ผลเหมือนชื่อใหม่ — กันคะแนนหายตอนเปลี่ยนชื่อ', () => {
    ALL_CLASSROOMS.forEach((c) => {
      expect(getGameTargetUnits('maze', c)).toEqual(getGameTargetUnits('coding-maze', c));
      expect(getGameTargetUnits('bug', c)).toEqual(getGameTargetUnits('bug-catcher', c));
    });
  });
});

describe('ระบบคะแนน — การกันปั๊มคะแนนซ้ำ', () => {
  it('คีย์กันซ้ำของเกมต้องไม่มีคะแนนปนอยู่ (ไม่งั้นเล่นซ้ำจะได้คะแนน P เพิ่มเรื่อย ๆ)', () => {
    const src = readFileSync('src/services/gameProgressService.ts', 'utf8');
    // อาร์กิวเมนต์ตัวที่ 6 ของ trackMediaClick คือคีย์กันซ้ำ ต้องคงที่ต่อเกม
    const call = src.match(/trackMediaClick\(([\s\S]*?)\);/);
    expect(call, 'ไม่พบการเรียก trackMediaClick').toBeTruthy();
    const args = call![1].split(',').map((s) => s.trim()).filter(Boolean);
    expect(args.length, 'ต้องส่งคีย์กันซ้ำเป็นอาร์กิวเมนต์ที่ 6').toBeGreaterThanOrEqual(6);
    expect(args[5]).not.toContain('score');
  });

  it('progressService ต้องรองรับพารามิเตอร์คีย์กันซ้ำ', () => {
    const src = readFileSync('src/services/progressService.ts', 'utf8');
    expect(src).toContain('dedupKey');
  });
});
