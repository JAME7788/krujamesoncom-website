const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const pptxFiles = [
  // P2
  { grade: 'p2', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป2\\หน่วย1_การแก้ปัญหาอย่างเป็นขั้นตอน.pptx' },
  { grade: 'p2', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป2\\หน่วย2_การตรวจหาข้อผิดพลาดของโปรแกรม.pptx' },
  { grade: 'p2', unit: 3, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป2\\หน่วย3_การจัดการไฟล์อย่างมีระบบ.pptx' },
  { grade: 'p2', unit: 4, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป2\\หน่วย4_การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย.pptx' },
  
  // P3
  { grade: 'p3', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป3\\เทคโนโลยี (วิทยาการคำนวณ) ป.3 หน่วย1_อัลกอริทึมกับการแก้ปัญหา.pptx' },
  { grade: 'p3', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป3\\เทคโนโลยี (วิทยาการคำนวณ) ป.3 หน่วย2_การเขียนโปรแกรมอย่างง่าย.pptx' },
  { grade: 'p3', unit: 3, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป3\\เทคโนโลยี (วิทยาการคำนวณ) ป.3 หน่วย3_อินเทอร์เน็ตและเทคโนโลยีสารสนเทศ.pptx' },
  { grade: 'p3', unit: 4, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป3\\เทคโนโลยี (วิทยาการคำนวณ) ป.3 หน่วย4_การรวบรวม ประมวลผลและนำเสนอข้อมูล.pptx' },
  { grade: 'p3', unit: 5, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป3\\เทคโนโลยี (วิทยาการคำนวณ) ป.3 หน่วย5_การใช้งานซอฟต์แวร์.pptx' },
  
  // P4
  { grade: 'p4', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\PPTCSป4\\หน่วย 1 ขั้นตอนวิธีการแก้ปัญหา.pptx' },
  { grade: 'p4', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\PPTCSป4\\หน่วย2 การเขียนโปรแกรมอย่างง่าย.pptx' },
  { grade: 'p4', unit: 3, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\PPTCSป4\\หน่วย3 การใช้งานอินเทอร์เน็ต.pptx' },
  { grade: 'p4', unit: 4, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\PPTCSป4\\หน่วย4 การนำเสนอข้อมูลด้วยซอฟต์แวร์.pptx' },
  { grade: 'p4', unit: 5, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\PPTCSป4\\หน่วย5 การใช้เทคโนโลยีอย่างปลอดภัย.pptx' },
  
  // P5
  { grade: 'p5', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\1518038PP-cs-p5\\-¦F¦-1_a-¦+++a¬+º¦++í-í-¦í-+ßíT+-¡--.pptx' },
  { grade: 'p5', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\1518038PP-cs-p5\\-¦F¦-2_í-+aó+-¦G++ßí+-G¦-p¬Ta-¦+++a¬+º¦++í-.pptx' },
  { grade: 'p5', unit: 3, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\1518038PP-cs-p5\\-¦F¦-3_óT--++--+-¦a++.pptx' },
  { grade: 'p5', unit: 4, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\1518038PP-cs-p5\\-¦F¦-4_í-+p¬T-+¦a+-+8a¦t¦--F-º++-¦+--.pptx' },
  
  // P6
  { grade: 'p6', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป.6\\เทคโนโลยี (วิทยาการคำนวณ) ป.6 หน่วย1_การแก้ปัญหาโดยใช้เหตุผลเชิงตรรกะ.pptx' },
  { grade: 'p6', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป.6\\เทคโนโลยี (วิทยาการคำนวณ) ป.6 หน่วย2_การออกแบบและเขียนโปรแกรมอย่างง่าย.pptx' },
  { grade: 'p6', unit: 3, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป.6\\เทคโนโลยี (วิทยาการคำนวณ) ป.6 หน่วย3_การใช้งานอินเทอร์เน็ตอย่างมีประสิทธิภาพ.pptx' },
  { grade: 'p6', unit: 4, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csป.6\\เทคโนโลยี (วิทยาการคำนวณ) ป.6 หน่วย4_ความปลอดภัยในการใช้งานเทคโนโลยีสารสนเทศ.pptx' },
  
  // M1
  { grade: 'm1', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.1\\CS ม1 หน่วย1 การออกแบบและการเขียนอัลกอริทึม.pptx' },
  { grade: 'm1', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.1\\CS ม1 หน่วย2 การออกแบบและการเขียนโปรแกรม.pptx' },
  
  // M2
  { grade: 'm2', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.2\\หน่วย1_แนวคิดเชิงคำนวณกับการแก้ปัญหา.pptx' },
  { grade: 'm2', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.2\\หน่วย2_การออกแบบขั้นตอนการทำงานและการเขียนโปรแกรมด้วยภาษาไพทอน.pptx' },
  { grade: 'm2', unit: 3, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.2\\หน่วย3_ระบบคอมพิวเตอร์.pptx' },
  { grade: 'm2', unit: 4, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.2\\หน่วย4_การใช้เทคโนโลยีสารสนเทศอย่างปลอดภัย.pptx' },
  
  // M3
  { grade: 'm3', unit: 1, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.3\\เทคโนโลยี (วิทยาการคำนวณ) ม.3 หน่วย1_การจัดการข้อมูลและสารสนเทศ.pptx' },
  { grade: 'm3', unit: 2, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.3\\เทคโนโลยี (วิทยาการคำนวณ) ม.3 หน่วย2_ความน่าเชื่อถือของข้อมูล.pptx' },
  { grade: 'm3', unit: 3, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.3\\เทคโนโลยี (วิทยาการคำนวณ) ม.3 หน่วย3_เทคโนโลยีสารสนเทศ.pptx' },
  { grade: 'm3', unit: 4, path: 'D:\\เอกสารโรงเรียน\\KMD\\2567\\แผน อจท รวมทั้งหมด แผน power point\\สื่อสไลด์\\csม.3\\เทคโนโลยี (วิทยาการคำนวณ) ม.3 หน่วย4_แอปพลิเคชัน.pptx' }
];

// Add P1 to the update list as well, since they're already exported.
const allUnits = [
  { grade: 'p1', unit: 1, exported: true, dir: 'cs_p1_u1' },
  { grade: 'p1', unit: 2, exported: true, dir: 'cs_p1_u2' }
];

async function run() {
  for (const file of pptxFiles) {
    const dirName = `cs_${file.grade}_u${file.unit}`;
    const targetDir = path.join(__dirname, 'public', 'slides', dirName);
    
    // Check if we need to export
    if (!fs.existsSync(targetDir) || fs.readdirSync(targetDir).filter(f => f.toLowerCase().endsWith('.jpg')).length === 0) {
      console.log(`Exporting ${file.grade} Unit ${file.unit}...`);
      try {
        execSync(`powershell -ExecutionPolicy Bypass -File export_pptx.ps1 "${file.path}" "${targetDir}"`, { stdio: 'inherit' });
        console.log(`Successfully exported ${file.grade} Unit ${file.unit}`);
      } catch (e) {
        console.error(`Failed to export ${file.grade} Unit ${file.unit}:`, e.message);
        continue;
      }
    } else {
      console.log(`Skipping export for ${file.grade} Unit ${file.unit} (already exists)`);
    }
    allUnits.push({ grade: file.grade, unit: file.unit, dir: dirName });
  }

  console.log('Generating code for unitContent.ts...');
  
  let contentTsPath = path.join(__dirname, 'src', 'data', 'unitContent.ts');
  let contentTs = fs.readFileSync(contentTsPath, 'utf-8');

  for (const item of allUnits) {
    const targetDir = path.join(__dirname, 'public', 'slides', item.dir);
    if (!fs.existsSync(targetDir)) continue;
    
    // Count images
    const images = fs.readdirSync(targetDir).filter(f => f.toLowerCase().endsWith('.jpg'));
    const count = images.length;
    if (count === 0) continue;

    console.log(`Updating ${item.grade} Unit ${item.unit} with ${count} images...`);

    // We need to replace the "slides: [...]" array in unitContent.ts
    // with "slides: [], slideImages: Array.from({ length: COUNT }, (_, i) => \`/slides/${item.dir}/Slide\${i + 1}.JPG\`)"
    
    // Find the unit block in the specific grade array.
    // This regex looks for: "no": UNIT, and then matches until the end of the "slides" array.
    // It is a bit tricky, but since we know the structure, we can do it safely.
    const regex = new RegExp(`("${item.grade}"\\s*:\\s*\\[[\\s\\S]*?\\{\\s*"no"\\s*:\\s*${item.unit}\\s*,[\\s\\S]*?)"slides"\\s*:\\s*\\[[\\s\\S]*?\\](.*)`, 'i');
    
    // Actually, doing this with regex for each might be hard to match the exact block.
    // Let's use a simpler string replacement.
  }
}

run();
