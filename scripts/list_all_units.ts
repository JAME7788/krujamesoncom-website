import { grades } from '../src/data/curriculum.ts';
import { richSlides } from '../src/data/richSlides.ts';
import { primaryRichSlides } from '../src/data/richSlidesPrimary.ts';
import { secondaryRichSlides } from '../src/data/richSlidesSecondary.ts';
import { electiveRichSlides } from '../src/data/richSlidesElective.ts';

console.log('Total Grades in curriculum:', grades.length);
let totalUnits = 0;
for (const g of grades) {
  const unitsCount = g.units ? g.units.length : 0;
  totalUnits += unitsCount;
  console.log(`Grade: ${g.id} (${g.title}) - ${unitsCount} units`);
  if (g.units) {
    for (const u of g.units) {
      const richKey = `${g.id}_${u.no}`;
      const hasRich = richSlides[richKey] || primaryRichSlides[richKey] || secondaryRichSlides[richKey] || electiveRichSlides[richKey];
      const count = hasRich ? hasRich.length : 0;
      console.log(`   Unit ${u.no}: ${u.title} (slides: ${count})`);
    }
  }
}
console.log('Total units across all grades:', totalUnits);
