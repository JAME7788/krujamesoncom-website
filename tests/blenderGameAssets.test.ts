import { existsSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoPath = (rel: string) => fileURLToPath(new URL(`../${rel}`, import.meta.url));

describe('Blender 5.2 game graphics asset integrity', () => {
  const glbModels = [
    'public/models/games/runner_robot.glb',
    'public/models/games/runner_barrier.glb',
    'public/models/games/runner_goal_flag.glb',
  ];

  const sprites = [
    'public/images/games/blender/racer_car_player.png',
    'public/images/games/blender/racer_coin.png',
    'public/images/games/blender/racer_nitro.png',
    'public/images/games/blender/racer_shield.png',
    'public/images/games/blender/racer_cone.png',
    'public/images/games/blender/collector_bot.png',
    'public/images/games/blender/cyber_bomb.png',
    'public/images/games/blender/chip_battery.png',
    'public/images/games/blender/chip_gem.png',
    'public/images/games/blender/chip_disk.png',
    'public/images/games/blender/goal_flag_3d.png',
    'public/images/games/blender/gold_star_3d.png',
    'public/images/games/blender/dodge_runner.png',
    'public/images/games/blender/dodge_rocket.png',
    'public/images/games/blender/dodge_asteroid.png',
    'public/images/games/blender/dodge_bolt.png',
    'public/images/games/blender/space_station.png',
    'public/images/games/blender/pc_monitor.png',
    'public/images/games/blender/pc_case.png',
    'public/images/games/blender/pc_keyboard.png',
    'public/images/games/blender/pc_mouse.png',
    'public/images/games/blender/pc_speakers.png',
    'public/images/games/blender/pc_motherboard.png',
    'public/images/games/blender/pc_cpu.png',
    'public/images/games/blender/pc_ram.png',
    'public/images/games/blender/pc_psu.png',
    'public/images/games/blender/pc_ssd.png',
    'public/images/games/blender/pc_gpu.png',
  ];

  it.each(glbModels)('has valid binary glTF (.glb) header: %s', (rel) => {
    const abs = repoPath(rel);
    expect(existsSync(abs), `Missing ${rel}`).toBe(true);
    const buf = readFileSync(abs);
    expect(buf.subarray(0, 4).toString('ascii')).toBe('glTF');
    expect(buf.length).toBeGreaterThan(5_000);
  });

  it.each(sprites)('has valid non-empty PNG sprite: %s', (rel) => {
    const abs = repoPath(rel);
    expect(existsSync(abs), `Missing ${rel}`).toBe(true);
    const stat = statSync(abs);
    expect(stat.size).toBeGreaterThan(5_000);
    const header = readFileSync(abs).subarray(0, 8);
    expect(Array.from(header)).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  });

  it('never alters existing bitmap-art games (ClawPlatformer, DigitalCityQuest, Tycoon, FileOrganizer)', () => {
    const bitmapGames = [
      'src/pages/games/ClawPlatformerGame.tsx',
      'src/pages/games/DigitalCityQuestGame.tsx',
      'src/pages/games/TycoonGame.tsx',
      'src/pages/games/FileOrganizerGame.tsx',
    ];
    bitmapGames.forEach((rel) => {
      const content = readFileSync(repoPath(rel), 'utf8');
      expect(content).not.toContain('/images/games/blender/');
      expect(content).not.toContain('/models/games/');
    });
  });
});
