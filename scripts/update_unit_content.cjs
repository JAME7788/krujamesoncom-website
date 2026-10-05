const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'public', 'slides');
const unitContentPath = path.join(__dirname, 'src', 'data', 'unitContent.ts');
let content = fs.readFileSync(unitContentPath, 'utf8');

// List all directories in public/slides
const dirs = fs.readdirSync(slidesDir).filter(f => fs.statSync(path.join(slidesDir, f)).isDirectory());

const updates = [];
for (const dir of dirs) {
  const match = dir.match(/cs_(p[1-6]|m[1-3])_u(\d+)/);
  if (match) {
    const grade = match[1];
    const unit = parseInt(match[2], 10);
    const images = fs.readdirSync(path.join(slidesDir, dir)).filter(f => f.toLowerCase().endsWith('.jpg'));
    const count = images.length;
    if (count > 0) {
      updates.push({ grade, unit, dir, count });
    }
  }
}

// Group updates by grade
const updatesByGrade = {};
for (const update of updates) {
  if (!updatesByGrade[update.grade]) updatesByGrade[update.grade] = [];
  updatesByGrade[update.grade].push(update);
}

// Now replace in content
// The file is a TypeScript object.
for (const grade in updatesByGrade) {
  // Find grade section: "grade": [
  const gradeRegex = new RegExp(`("${grade}"\\s*:\\s*\\[)([\\s\\S]*?)(?=\\n\\s*"p\\d"|\\n\\s*"m\\d"|\\n\\s*\\]\\n\\})`, 'g');
  
  content = content.replace(gradeRegex, (match, prefix, gradeContent) => {
    let updatedGradeContent = gradeContent;
    for (const update of updatesByGrade[grade]) {
      // Find unit block inside this grade content
      // Starts with { ... "no": unit, ... }
      const unitRegex = new RegExp(`(\\{\\s*"no"\\s*:\\s*${update.unit}\\s*,\\s*)(?:("slides"\\s*:\\s*\\[[\\s\\S]*?\\])(?:,\\s*"slideImages"\\s*:\\s*.*?)?)(\\s*\\})`, 'g');
      
      updatedGradeContent = updatedGradeContent.replace(unitRegex, (m, unitPrefix, slidesStr, unitSuffix) => {
        const replacement = `"slides": [],\n      "slideImages": Array.from({ length: ${update.count} }, (_, i) => \`/slides/${update.dir}/Slide\${i + 1}.JPG\`)`;
        return `${unitPrefix}${replacement}${unitSuffix}`;
      });
    }
    return prefix + updatedGradeContent;
  });
}

fs.writeFileSync(unitContentPath, content, 'utf8');
console.log('Successfully updated unitContent.ts');
