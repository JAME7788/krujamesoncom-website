const fs = require('fs');
const path = require('path');

const unitContentPath = path.join(__dirname, 'src', 'data', 'unitContent.ts');
let content = fs.readFileSync(unitContentPath, 'utf8');

// I need to add m1, m2, m3 if they don't exist.
// Also fix p6. 
// Instead of regex, I'll just replace the entire p6 block and append m1, m2, m3 to the end of the object.

const p6Block = `  "p6": [
    { "no": 1, "slides": [], "slideImages": Array.from({ length: 24 }, (_, i) => \`/slides/cs_p6_u1/Slide\${i + 1}.JPG\`) },
    { "no": 2, "slides": [], "slideImages": Array.from({ length: 14 }, (_, i) => \`/slides/cs_p6_u2/Slide\${i + 1}.JPG\`) },
    { "no": 3, "slides": [], "slideImages": Array.from({ length: 13 }, (_, i) => \`/slides/cs_p6_u3/Slide\${i + 1}.JPG\`) },
    { "no": 4, "slides": [], "slideImages": Array.from({ length: 20 }, (_, i) => \`/slides/cs_p6_u4/Slide\${i + 1}.JPG\`) }
  ]`;

const mBlocks = `,
  "m1": [
    { "no": 1, "slides": [], "slideImages": Array.from({ length: 51 }, (_, i) => \`/slides/cs_m1_u1/Slide\${i + 1}.JPG\`) },
    { "no": 2, "slides": [], "slideImages": Array.from({ length: 67 }, (_, i) => \`/slides/cs_m1_u2/Slide\${i + 1}.JPG\`) }
  ],
  "m2": [
    { "no": 1, "slides": [], "slideImages": Array.from({ length: 8 }, (_, i) => \`/slides/cs_m2_u1/Slide\${i + 1}.JPG\`) },
    { "no": 2, "slides": [], "slideImages": Array.from({ length: 15 }, (_, i) => \`/slides/cs_m2_u2/Slide\${i + 1}.JPG\`) },
    { "no": 3, "slides": [], "slideImages": Array.from({ length: 19 }, (_, i) => \`/slides/cs_m2_u3/Slide\${i + 1}.JPG\`) },
    { "no": 4, "slides": [], "slideImages": Array.from({ length: 16 }, (_, i) => \`/slides/cs_m2_u4/Slide\${i + 1}.JPG\`) }
  ],
  "m3": [
    { "no": 1, "slides": [], "slideImages": Array.from({ length: 16 }, (_, i) => \`/slides/cs_m3_u1/Slide\${i + 1}.JPG\`) },
    { "no": 2, "slides": [], "slideImages": Array.from({ length: 25 }, (_, i) => \`/slides/cs_m3_u2/Slide\${i + 1}.JPG\`) },
    { "no": 3, "slides": [], "slideImages": Array.from({ length: 15 }, (_, i) => \`/slides/cs_m3_u3/Slide\${i + 1}.JPG\`) },
    { "no": 4, "slides": [], "slideImages": Array.from({ length: 15 }, (_, i) => \`/slides/cs_m3_u4/Slide\${i + 1}.JPG\`) }
  ]
};`;

// Replace "p6": [ ... ] down to the end of the file.
// We can find the index of '"p6": ['
const p6Index = content.indexOf('"p6": [');
if (p6Index !== -1) {
  content = content.substring(0, p6Index) + p6Block + mBlocks + "\n";
  fs.writeFileSync(unitContentPath, content, 'utf8');
  console.log("Successfully appended p6, m1, m2, m3.");
} else {
  console.error("Could not find p6 block.");
}
