import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root = process.cwd();
const gameFile = (name) => path.join(root, 'src', 'pages', 'games', name);
const failures = [];
let checks = 0;

const check = (condition, message) => {
  checks += 1;
  if (!condition) failures.push(message);
};

const read = (name) => fs.readFileSync(gameFile(name), 'utf8');

const literalValue = (node, sourceFile) => {
  if (!node) return undefined;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand)) {
    return node.operator === ts.SyntaxKind.MinusToken ? -Number(node.operand.text) : Number(node.operand.text);
  }
  if (ts.isArrayLiteralExpression(node)) return node.elements.map((item) => literalValue(item, sourceFile));
  if (ts.isObjectLiteralExpression(node)) {
    const output = {};
    node.properties.forEach((property) => {
      if (!ts.isPropertyAssignment(property)) return;
      const key = ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)
        ? property.name.text
        : property.name.getText(sourceFile);
      output[key] = literalValue(property.initializer, sourceFile);
    });
    return output;
  }
  return undefined;
};

const readVariable = (fileName, variableName) => {
  const source = read(fileName);
  const sourceFile = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let output;
  const visit = (node) => {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === variableName
    ) {
      output = literalValue(node.initializer, sourceFile);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return output;
};

const unique = (items) => new Set(items).size === items.length;

const auditQuestionBanks = () => {
  const quickLevels = readVariable('QuickAnswerComputing.tsx', 'quickLevels');
  check(Array.isArray(quickLevels) && quickLevels.length >= 3, 'เกมตอบไวต้องมีอย่างน้อย 3 ระดับ');
  quickLevels?.forEach((level, levelIndex) => {
    const questions = level.questions || [];
    check(questions.length >= 25, `เกมตอบไวระดับ ${levelIndex + 1} มีน้อยกว่า 25 ข้อ`);
    check(unique(questions.map((item) => item.question)), `เกมตอบไวระดับ ${levelIndex + 1} มีคำถามซ้ำ`);
    check(unique(questions.map((item) => item.answer)), `เกมตอบไวระดับ ${levelIndex + 1} มีคำตอบซ้ำบนกระดาน`);
    questions.forEach((item, questionIndex) => {
      check(Boolean(item.question && item.answer && item.note), `เกมตอบไวระดับ ${levelIndex + 1} ข้อ ${questionIndex + 1} ข้อมูลไม่ครบ`);
    });
  });

  const searchQuestions = readVariable('SearchSmartGame.tsx', 'QUESTIONS');
  check(searchQuestions?.length >= 12, 'นักสืบคำค้นต้องมีอย่างน้อย 12 ข้อ');
  searchQuestions?.forEach((item, index) => {
    const options = item.options || [];
    check(options.length >= 3, `นักสืบคำค้นข้อ ${index + 1} มีตัวเลือกน้อยเกินไป`);
    check(options.filter((option) => option.correct).length === 1, `นักสืบคำค้นข้อ ${index + 1} ต้องมีคำตอบถูกเพียงข้อเดียว`);
    check(unique(options.map((option) => option.query)), `นักสืบคำค้นข้อ ${index + 1} มีตัวเลือกซ้ำ`);
  });

  const tasks = readVariable('StepSort.tsx', 'TASKS');
  check(tasks?.length >= 10, 'เกมเรียงขั้นตอนต้องมีอย่างน้อย 10 เรื่อง');
  tasks?.forEach((task, index) => {
    const steps = task.steps || [];
    check(steps.length >= 4, `เกมเรียงขั้นตอนเรื่อง ${index + 1} มีขั้นตอนไม่ครบ`);
    check(unique(steps.map((step) => step.text)), `เกมเรียงขั้นตอนเรื่อง ${index + 1} มีข้อความซ้ำ`);
  });

  const puzzles = readVariable('AlgorithmSorter.tsx', 'puzzles');
  check(puzzles?.length >= 12, 'เกมจัดอัลกอริทึมต้องมีอย่างน้อย 12 ปริศนา');
  puzzles?.forEach((puzzle, index) => {
    check(puzzle.steps?.length >= 5, `ปริศนาอัลกอริทึม ${index + 1} มีขั้นตอนน้อยเกินไป`);
    check(unique(puzzle.steps || []), `ปริศนาอัลกอริทึม ${index + 1} มีขั้นตอนซ้ำ`);
  });

  const devices = readVariable('DeviceMatch.tsx', 'DEVICES');
  check(devices?.length >= 12, 'เกมจับคู่อุปกรณ์ต้องมีอย่างน้อย 12 ชิ้น');
  check(unique(devices?.map((item) => item.name) || []), 'เกมจับคู่อุปกรณ์มีชื่อซ้ำ');

  const systems = readVariable('TechSystemGame.tsx', 'DEVICES');
  check(systems?.length >= 10, 'เกมระบบเทคโนโลยีต้องมีอย่างน้อย 10 ระบบ');
  systems?.forEach((item, index) => {
    check(
      unique([item.input, item.process, item.output]),
      `ระบบเทคโนโลยีข้อ ${index + 1} มีคำอธิบาย Input/Process/Output ซ้ำกัน`,
    );
  });

  const safety = readVariable('SafetyGame.tsx', 'SCENARIOS');
  check(safety?.length >= 15, 'เกมความปลอดภัยต้องมีอย่างน้อย 15 สถานการณ์');
  check(safety?.some((item) => item.safe) && safety?.some((item) => !item.safe), 'เกมความปลอดภัยต้องมีทั้งสถานการณ์ปลอดภัยและไม่ปลอดภัย');

  const pictures = readVariable('PixelArtGame.tsx', 'PICS');
  check(pictures?.length >= 10, 'เกมพิกเซลต้องมีอย่างน้อย 10 ภาพ');
  pictures?.forEach((picture, index) => {
    check(picture.rows?.length === 8, `ภาพพิกเซล ${index + 1} ต้องมี 8 แถว`);
    picture.rows?.forEach((row, rowIndex) => {
      check(/^[01]{8}$/.test(row), `ภาพพิกเซล ${index + 1} แถว ${rowIndex + 1} ไม่ใช่บิต 8 ช่อง`);
    });
  });
};

const auditMazes = () => {
  const source = read('CodingMaze.tsx');
  const levelPattern = /\.\.\.parseGrid\(\[([\s\S]*?)\]\),\s*maxBlocks:\s*(\d+)/g;
  let match;
  let levelIndex = 0;
  while ((match = levelPattern.exec(source))) {
    levelIndex += 1;
    const rows = [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
    const maxBlocks = Number(match[2]);
    let start;
    let goal;
    const stars = [];
    rows.forEach((row, y) => [...row].forEach((cell, x) => {
      if (cell === 'S') start = [x, y];
      if (cell === 'G') goal = [x, y];
      if (cell === '*') stars.push([x, y]);
    }));
    check(Boolean(start && goal), `Coding Maze ด่าน ${levelIndex} ไม่มีจุดเริ่มหรือเป้าหมาย`);
    if (!start || !goal) continue;

    const fullMask = (1 << stars.length) - 1;
    const queue = [[start[0], start[1], 0, 0]];
    const visited = new Set([`${start[0]},${start[1]},0`]);
    let shortest = null;
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const [x, y, mask, distance] = queue[cursor];
      if (x === goal[0] && y === goal[1] && mask === fullMask) {
        shortest = distance;
        break;
      }
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nextX = x + dx;
        const nextY = y + dy;
        if (!rows[nextY] || rows[nextY][nextX] === '#') return;
        let nextMask = mask;
        stars.forEach(([starX, starY], starIndex) => {
          if (nextX === starX && nextY === starY) nextMask |= 1 << starIndex;
        });
        const key = `${nextX},${nextY},${nextMask}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push([nextX, nextY, nextMask, distance + 1]);
        }
      });
    }
    check(shortest !== null, `Coding Maze ด่าน ${levelIndex} ไม่มีเส้นทางชนะ`);
    check(shortest !== null && shortest <= maxBlocks, `Coding Maze ด่าน ${levelIndex} ต้องใช้ ${shortest} คำสั่ง แต่กำหนดไว้ ${maxBlocks}`);
  }
  check(levelIndex >= 10, 'Coding Maze ต้องมีอย่างน้อย 10 ด่าน');
};

const auditRunner = () => {
  const source = read('AlgorithmRunner3D.tsx');
  const levelPattern = /rows:\s*\[([^\]]+)\][\s\S]*?start:\s*\[(\d+),\s*(\d+)\][\s\S]*?goal:\s*\[(\d+),\s*(\d+)\][\s\S]*?startDir:\s*(\d+)[\s\S]*?optimal:\s*(\d+)[\s\S]*?maxCommands:\s*(\d+)/g;
  const vectors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  let match;
  let levelIndex = 0;
  while ((match = levelPattern.exec(source))) {
    levelIndex += 1;
    const rows = [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1]);
    const start = [Number(match[2]), Number(match[3])];
    const goal = [Number(match[4]), Number(match[5])];
    const startDirection = Number(match[6]);
    const optimal = Number(match[7]);
    const maxCommands = Number(match[8]);
    const queue = [[start[0], start[1], startDirection, 0]];
    const visited = new Set([`${start[0]},${start[1]},${startDirection}`]);
    let shortest = null;

    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const [x, y, direction, distance] = queue[cursor];
      if (x === goal[0] && y === goal[1]) {
        shortest = distance;
        break;
      }
      ['forward', 'left', 'right', 'jump'].forEach((command) => {
        let nextX = x;
        let nextY = y;
        let nextDirection = direction;
        if (command === 'left') nextDirection = (direction + 3) % 4;
        if (command === 'right') nextDirection = (direction + 1) % 4;
        if (command === 'forward') {
          nextX += vectors[direction][0];
          nextY += vectors[direction][1];
          if (!rows[nextY] || !'.SG'.includes(rows[nextY][nextX])) return;
        }
        if (command === 'jump') {
          const middleX = x + vectors[direction][0];
          const middleY = y + vectors[direction][1];
          nextX = x + (2 * vectors[direction][0]);
          nextY = y + (2 * vectors[direction][1]);
          if (
            !rows[middleY]
            || !'#~'.includes(rows[middleY][middleX])
            || !rows[nextY]
            || !'.SG'.includes(rows[nextY][nextX])
          ) return;
        }
        const key = `${nextX},${nextY},${nextDirection}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push([nextX, nextY, nextDirection, distance + 1]);
        }
      });
    }
    check(shortest !== null && shortest <= maxCommands, `นักวิ่ง 3D ด่าน ${levelIndex} ไม่มีคำตอบภายใน ${maxCommands} คำสั่ง`);
    check(shortest === optimal, `นักวิ่ง 3D ด่าน ${levelIndex} ค่า optimal ควรเป็น ${shortest} แต่กำหนดเป็น ${optimal}`);
  }
  check(levelIndex >= 8, 'นักวิ่ง 3D ต้องมีอย่างน้อย 8 ด่าน');
};

auditQuestionBanks();
auditMazes();
auditRunner();

if (failures.length > 0) {
  console.error(`Game content QA failed (${failures.length}/${checks} checks):`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Game content QA passed: ${checks} checks`);
