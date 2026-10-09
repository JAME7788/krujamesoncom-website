import * as fs from 'fs';
import * as path from 'path';
import { grades } from '../src/data/curriculum.ts';
import { richSlides } from '../src/data/richSlides.ts';
import { primaryRichSlides } from '../src/data/richSlidesPrimary.ts';
import { secondaryRichSlides } from '../src/data/richSlidesSecondary.ts';
import { electiveRichSlides } from '../src/data/richSlidesElective.ts';

interface ExportedUnit {
  gradeId: string;
  gradeTitle: string;
  gradeEmoji: string;
  unitNo: number;
  unitTitle: string;
  topics: string[];
  activities: string[];
  indicators: string[];
  slides: unknown[];
}

const allData: ExportedUnit[] = [];

for (const g of grades) {
  if (!g.units) continue;
  for (const u of g.units) {
    const key = `${g.id}_${u.no}`;
    const slides = richSlides[key] || primaryRichSlides[key] || secondaryRichSlides[key] || electiveRichSlides[key] || [];

    // Extract indicator descriptions
    const unitIndicators: string[] = [];
    if (u.indicators && g.indicators) {
      for (const idx of u.indicators) {
        const ind = g.indicators[idx];
        if (ind) {
          unitIndicators.push(`${ind.code} ${ind.text}`);
        }
      }
    }

    allData.push({
      gradeId: g.id,
      gradeTitle: g.title,
      gradeEmoji: g.emoji,
      unitNo: u.no,
      unitTitle: u.title,
      topics: u.topics || [],
      activities: u.activities || [],
      indicators: unitIndicators,
      slides,
    });
  }
}

const outputPath = path.resolve(process.cwd(), 'scripts', 'all_curriculum_slides.json');
fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2), 'utf8');
console.log(`Successfully exported ${allData.length} units to ${outputPath}`);
