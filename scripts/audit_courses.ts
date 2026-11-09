import { grades } from '../src/data/curriculum';
import { richSlides } from '../src/data/richSlides';
import { unitSlideImages } from '../src/data/slideImages';

console.log('=== สรุปสถานะสไลด์ของทุกคอร์สในเว็บไซต์ ===\n');
for (const g of grades) {
  const units = g.units || [];
  let withImages = 0;
  let withRichSlides = 0;
  for (const u of units) {
    const key = `${g.id}_${u.no}`;
    const hasImg = Boolean(unitSlideImages[g.id]?.[u.no]?.length);
    const hasRich = Boolean(richSlides[key]);
    if (hasImg) withImages++;
    if (hasRich) withRichSlides++;
  }
  console.log(`[${g.id}] ${g.title} (${units.length} หน่วย):`);
  console.log(`  - สไลด์ภาพ 16:9 (DALL-E 3 Drive): ${withImages}/${units.length} หน่วย`);
  console.log(`  - สไลด์ richSlides: ${withRichSlides}/${units.length} หน่วย`);
  const missingImgs = units.filter(u => !(unitSlideImages[g.id]?.[u.no]?.length)).map(u => u.no);
  const missingRich = units.filter(u => !richSlides[`${g.id}_${u.no}`]).map(u => u.no);
  if (missingImgs.length) console.log(`    ⚠️ ขาดสไลด์ภาพหน่วย: ${missingImgs.join(', ')}`);
  if (missingRich.length) console.log(`    ⚠️ ขาด richSlides หน่วย: ${missingRich.join(', ')}`);
}
