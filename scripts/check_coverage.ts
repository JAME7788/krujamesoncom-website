import { grades } from '../src/data/curriculum';
import { hasRichSlides, getRichSlides } from '../src/data/richSlides';

let totalUnits = 0;
let richUnits = 0;
for (const g of grades) {
  for (const u of g.units) {
    totalUnits++;
    const has = hasRichSlides(g.id, u.no);
    const count = has ? getRichSlides(g.id, u.no).length : 0;
    if (has) richUnits++;
    console.log(`${g.id} ${g.title} - Unit ${u.no} ${u.title}: ${has ? `YES (${count} slides)` : 'NO'}`);
  }
}
console.log(`\nTotal: ${richUnits} / ${totalUnits} units have rich slides`);
