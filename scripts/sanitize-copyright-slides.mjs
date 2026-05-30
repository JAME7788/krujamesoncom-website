import fs from 'node:fs';

const path = 'src/data/unitContent.ts';
let source = fs.readFileSync(path, 'utf8');

source = source.replace(
  /^\/\/ Auto-generated.*$/m,
  '// Locally authored/generated lesson content. Third-party slide images are intentionally not bundled.',
);

const legacyMarker = '  "ai-p1-3-legacy"';
const markerIndex = source.indexOf(legacyMarker);
if (markerIndex !== -1) {
  const beforeLegacy = source
    .slice(0, markerIndex)
    .replace(/"slides":\s*\[[\s\S]*?\]/g, '"slides": []');
  source = beforeLegacy + source.slice(markerIndex);
}

source = source.replace(
  /"slideImages":\s*Array\.from\(\{ length: \d+ \}, \(_, i\) => `\/slides\/[^`]+`\s*\)/g,
  '"slideImages": []',
);

fs.writeFileSync(path, source, 'utf8');
