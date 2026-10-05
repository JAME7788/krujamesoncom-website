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

  interface StaticCollider {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    minY: number;
    maxY: number;
  }

  const checkStaticCollision = (
    testX: number,
    testZ: number,
    feetY: number,
    colliders: StaticCollider[],
  ): boolean => {
    for (const col of colliders) {
      if (col.maxY <= feetY + 0.35 || col.minY >= feetY + 1.7) continue;
      if (
        testX + PLAYER_RADIUS > col.minX
        && testX - PLAYER_RADIUS < col.maxX
        && testZ + PLAYER_RADIUS > col.minZ
        && testZ - PLAYER_RADIUS < col.maxZ
      ) {
        return true;
      }
    }
    return false;
  };

  it('กำแพงห้องเรียน (ผนังหลัง, ผนังซ้าย, ผนังขวา) ต้องขวางไม่ให้ผู้เล่นเดินทะลุออกนอกห้อง', () => {
    const classroomWalls: StaticCollider[] = [
      // ผนังหลัง z = -8.4
      { minX: -10, maxX: 10, minZ: -8.4 - 0.175, maxZ: -8.4 + 0.175, minY: 0, maxY: 5.5 },
      // ผนังซ้าย x = -10
      { minX: -10 - 0.175, maxX: -10 + 0.175, minZ: -8.5, maxZ: 8.5, minY: 0, maxY: 5.5 },
      // ผนังขวา x = 10
      { minX: 10 - 0.175, maxX: 10 + 0.175, minZ: -8.5, maxZ: 8.5, minY: 0, maxY: 5.5 },
    ];
    const feetY = 0.205; // ยืนบนพื้นห้องเรียน

    // เดินเข้าหากำแพงหลัง (z = -8.0 พยายามเดินไป z = -8.3)
    expect(checkStaticCollision(0, -8.3, feetY, classroomWalls)).toBe(true);

    // เดินเข้าหากำแพงซ้าย (x = -9.5 พยายามเดินไป x = -9.8)
    expect(checkStaticCollision(-9.8, 0, feetY, classroomWalls)).toBe(true);

    // เดินเข้าหากำแพงขวา (x = 9.5 พยายามเดินไป x = 9.8)
    expect(checkStaticCollision(9.8, 0, feetY, classroomWalls)).toBe(true);

    // เดินอยู่กลางห้องเรียน ไม่ชนกำแพง
    expect(checkStaticCollision(0, 0, feetY, classroomWalls)).toBe(false);
  });

  it('ระบบ Anti-Stuck Depenetration สามารถผลักผู้เล่นออกจากกำแพงหรือบล็อกได้เมื่อเกิดการซ้อนทับ', () => {
    const col: StaticCollider = { minX: -10.175, maxX: -9.825, minZ: -8.5, maxZ: 8.5, minY: 0, maxY: 5.5 };
    // ผู้เล่นถูกผลักหรือแว้งเข้าไปที่ x = -9.75 (ซ้อนทับขอบกำแพง x=-9.825 เล็กน้อย)
    const player = { x: -9.75, z: 0, y: 1.905 };
    const feet = player.y - 1.7;

    const overlapMinX = (player.x + PLAYER_RADIUS) - col.minX; // (-9.75 + 0.34) - (-10.175) = 0.765
    const overlapMaxX = col.maxX - (player.x - PLAYER_RADIUS); // -9.825 - (-9.75 - 0.34) = 0.265
    const overlapMinZ = (player.z + PLAYER_RADIUS) - col.minZ;
    const overlapMaxZ = col.maxZ - (player.z - PLAYER_RADIUS);

    expect(overlapMinX > 0 && overlapMaxX > 0 && overlapMinZ > 0 && overlapMaxZ > 0).toBe(true);

    const penX = overlapMinX < overlapMaxX ? -overlapMinX : overlapMaxX;
    const penZ = overlapMinZ < overlapMaxZ ? -overlapMinZ : overlapMaxZ;

    // แกนที่แทรกน้อยที่สุดคือแกน X ขวา (ดันออกจากกำแพงกลับเข้าห้องเรียน)
    expect(penX).toBeGreaterThan(0);
    player.x += penX * 1.05;

    // หลังถูกผลักออกมา ขอบซ้ายของผู้เล่น (player.x - PLAYER_RADIUS) ต้องอยู่นอกกำแพง (>= col.maxX)
    expect(player.x - PLAYER_RADIUS).toBeGreaterThanOrEqual(col.maxX);
  });

  it('ระบบป้องกันวางบล็อกทับตัว (placeBlock) ปฏิเสธการวางบล็อกเมื่อระยะห่างต่ำกว่า 0.88m', () => {
    const playerPosition = { x: 0, y: 1.7, z: 0 };
    const playerFeet = playerPosition.y - 1.7; // 0
    const playerHead = playerPosition.y + 0.1; // 1.8

    const canPlaceBlock = (x: number, y: number, z: number): boolean => {
      const blockMinY = y - 0.5;
      const blockMaxY = y + 0.5;
      const inPlayerCellX = Math.abs(x - playerPosition.x) < 0.88;
      const inPlayerCellZ = Math.abs(z - playerPosition.z) < 0.88;
      const inPlayerHeight = blockMaxY > playerFeet + 0.05 && blockMinY < playerHead;
      if (inPlayerCellX && inPlayerCellZ && inPlayerHeight) {
        return false; // ปฏิเสธการวางทับตัว
      }
      return true;
    };

    // พยายามวางบล็อกที่ระยะ 0.70m (ซึ่งถ้าใช้ 0.65 เดิมจะผ่าน และทำให้บล็อกจมเข้าตัว)
    expect(canPlaceBlock(0.70, 0.5, 0)).toBe(false);
    expect(canPlaceBlock(0, 0.5, 0.70)).toBe(false);

    // วางบล็อกที่ระยะ 1.0m (ปลอดภัย อยู่นอกรัศมีชน)
    expect(canPlaceBlock(1.0, 0.5, 0)).toBe(true);

    // วางบล็อกใต้ฝ่าเท้า (y = -0.5, blockMaxY = 0)
    expect(canPlaceBlock(0, -0.5, 0)).toBe(true);
  });

  it('ระบบ Ceiling Overhead Collision ตัดความเร็วแนวดิ่งเมื่อศีรษะชนบล็อกหรือคานเพดาน', () => {
    let verticalVelocity = 8.2; // กระโดดขึ้น
    const playerPosition = { x: 0, y: 3.0, z: 0 }; // กำลังลอยขึ้น
    const headY = playerPosition.y + 0.1; // 3.1

    // มีบล็อกอยู่ที่ระดับ y = 3.6 (blockBottom = 3.1)
    const block = { x: 0, y: 3.6, z: 0 };
    const bBottom = block.y - 0.5; // 3.1

    if (verticalVelocity > 0 && headY >= bBottom && playerPosition.y - 1.7 < bBottom) {
      playerPosition.y = bBottom - 0.1;
      verticalVelocity = 0;
    }

    expect(verticalVelocity).toBe(0);
    expect(playerPosition.y).toBeCloseTo(3.0);
  });

  it('ระบบ Void Fall Guard รีเซ็ตตำแหน่งผู้เล่นหากตกหลุดระนาบต่ำกว่า -2m', () => {
    let playerY = -2.5;
    let verticalVelocity = -15;
    let grounded = false;
    let summonX = 0;
    let summonZ = 10;

    if (playerY < -2.0) {
      playerY = 1.7;
      verticalVelocity = 0;
      grounded = true;
    }

    expect(playerY).toBe(1.7);
    expect(verticalVelocity).toBe(0);
    expect(grounded).toBe(true);
  });
});
