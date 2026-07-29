import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const projectRoot = path.resolve(import.meta.dirname, '..');
const outputPath = path.resolve(process.argv[2] || path.join(projectRoot, 'artifacts', 'p1-plan-data.json'));
const moduleDir = path.join(projectRoot, '.tmp-p1-plan-export');

await fs.mkdir(moduleDir, { recursive: true });
await fs.mkdir(path.dirname(outputPath), { recursive: true });

const transpile = async (sourceName, outputName) => {
  const sourcePath = path.join(projectRoot, 'src', 'data', sourceName);
  const source = await fs.readFile(sourcePath, 'utf8');
  const result = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: sourcePath,
  });
  const javascript = result.outputText.replace(
    "from './p1HourlyLessonOutlines'",
    "from './p1HourlyLessonOutlines.mjs'",
  );
  await fs.writeFile(path.join(moduleDir, outputName), javascript, 'utf8');
};

await transpile('p1HourlyLessonOutlines.ts', 'p1HourlyLessonOutlines.mjs');
await transpile('p1TechnologyPlan.ts', 'p1TechnologyPlan.mjs');

const data = await import(`${pathToFileURL(path.join(moduleDir, 'p1TechnologyPlan.mjs')).href}?v=${Date.now()}`);
const payload = {
  course: data.p1TechnologyCourse,
  indicators: data.p1Indicators,
  annualUnits: data.p1AnnualUnits,
  lessonPlans: data.p1LessonPlans,
  scoringPlan: data.p1ScoringPlan,
  researchProtocol: data.p1ResearchProtocol,
  references: data.p1References,
};

await fs.writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf8');
console.log(outputPath);
