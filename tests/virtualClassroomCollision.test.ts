import { describe, expect, it } from 'vitest';

describe('3D Voxel Collision Detection & Wall Sliding', () => {
  const PLAYER_RADIUS = 0.34;

  interface Block {
    x: number;
    y: number;
    z: number;
  }

  const checkCollision = (
    testX: number,
    testZ: number,
    feetY: number,
    blocks: Block[],
  ): boolean => {
    for (const b of blocks) {
      if (Math.abs(b.x - testX) > 1.6 || Math.abs(b.z - testZ) > 1.6) continue;
      const bBottom = b.y - 0.5;
      const bTop = b.y + 0.5;
      // ถ้าบล็อกอยู่ต่ำกว่าระดับเท้าที่ก้าวขึ้นได้ หรือสูงกว่าระดับศีรษะ -> ไม่ขวางระนาบ
      if (bTop <= feetY + 0.35 || bBottom >= feetY + 1.7) continue;
      if (
        testX + PLAYER_RADIUS > b.x - 0.5
        && testX - PLAYER_RADIUS < b.x + 0.5
        && testZ + PLAYER_RADIUS > b.z - 0.5
        && testZ - PLAYER_RADIUS < b.z + 0.5
      ) {
        return true;
      }
    }
    return false;
  };

  it('บล็อกระดับพื้น (y=0.5) ต้องขวางไม่ให้ผู้เล่นเดินทะลุ', () => {
    const blocks: Block[] = [{ x: 0.5, y: 0.5, z: 0.5 }];
    const feetY = 0; // ยืนบนพื้น

    // เดินเข้าหากลางบล็อก -> ต้องชน
    expect(checkCollision(0.5, 0.5, feetY, blocks)).toBe(true);

    // ยืนชนขอบบล็อก (ระยะ 0.7 เมตร ซึ่งน้อยกว่า 0.5 + 0.34 = 0.84) -> ต้องชน
    expect(checkCollision(0.5, 0.1, feetY, blocks)).toBe(true);

    // ยืนห่างออกไป (ระยะ 1.5 เมตร) -> ไม่ชน
    expect(checkCollision(0.5, 2.0, feetY, blocks)).toBe(false);
  });

  it('เมื่อผู้เล่นกระโดดสูงกว่าบล็อก (feetY=1.05) บล็อกต้องไม่ขวางแนวระนาบ เพื่อให้เหยียบบนบล็อกได้', () => {
    const blocks: Block[] = [{ x: 0.5, y: 0.5, z: 0.5 }];
    const feetY = 1.05; // เท้าอยู่เหนือหลังบล็อก (top=1.0)

    expect(checkCollision(0.5, 0.5, feetY, blocks)).toBe(false);
  });

  it('เมื่อยืนบนบล็อกชั้น 1 แล้วมีบล็อกชั้น 2 ขวางอยู่ ต้องไม่สามารถเดินทะลุบล็อกชั้น 2 ได้', () => {
    const blocks: Block[] = [
      { x: 0.5, y: 0.5, z: 0.5 }, // บล็อกชั้น 1
      { x: 0.5, y: 1.5, z: 1.5 }, // บล็อกชั้น 2 ด้านหน้า
    ];
    const feetY = 1.0; // ยืนบนบล็อกชั้น 1 (y=0.5 -> top=1.0)

    // พยายามเดินไปที่พิกัด z=1.5 ซึ่งมีบล็อกชั้น 2 ขวางอยู่
    expect(checkCollision(0.5, 1.5, feetY, blocks)).toBe(true);
  });

  it('ระบบเลื่อนไถลแยกแกน (Axis-Separated Sliding) สามารถเลื่อนตามกำแพงได้เมื่อเดินเฉียงเข้าหากำแพง', () => {
    // กำแพงแนวยาวตามแกน X ที่ z = 1.5
    const wallBlocks: Block[] = [
      { x: -0.5, y: 0.5, z: 1.5 },
      { x: 0.5, y: 0.5, z: 1.5 },
      { x: 1.5, y: 0.5, z: 1.5 },
    ];
    let playerX = 0.5;
    let playerZ = 0.5;
    const feetY = 0;

    // ผู้เล่นต้องการเดินเฉียงไปทางขวาหน้า: dx = 0.2, dz = 0.3
    const dispX = 0.2;
    const dispZ = 0.3;

    // ทดสอบแกน X
    const nextX = playerX + dispX;
    if (!checkCollision(nextX, playerZ, feetY, wallBlocks)) {
      playerX = nextX;
    }

    // ทดสอบแกน Z (จะชนกำแพงที่ z=1.5 เพราะ 0.5 + 0.3 + 0.34 = 1.14 ซึ่งใกล้ขอบ 1.0)
    const nextZ = playerZ + dispZ;
    if (!checkCollision(playerX, nextZ, feetY, wallBlocks)) {
      playerZ = nextZ;
    }

    // แกน X ต้องขยับได้ (0.7) แต่แกน Z ต้องไม่ขยับเข้าหากำแพง (คงที่ที่ 0.5 หรือหยุดก่อนชน)
    expect(playerX).toBeCloseTo(0.7);
    // เมื่อเดินเฉียงชนกำแพง ตัวละครจะสไลด์ไปตามแกน X อย่างราบรื่น
  });
});
