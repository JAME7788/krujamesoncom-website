// วิชาเลือกเพิ่มเติม ม.1–ม.3 ที่เรียบเรียงจากเอกสารในคลังโรงเรียนของครูเจมส์
// แต่ละหลักสูตรอยู่แยกไฟล์ใน src/data/courses/ (หลักสูตร + เนื้อหาเสริม + สไลด์ และไฟล์ส่วนขยาย *Expansion.ts)
// ไฟล์นี้รวมให้ curriculum.ts, unitExtras.ts และ richSlides.ts ลงทะเบียนด้วยบรรทัดเดียว
import type { Grade } from './curriculum';
import type { LearningFile, UnitExtras } from './unitExtras';
import type { RichSlide } from './richSlides';
import { moveCorrectTo, spreadAnswers } from '../utils/answerOrder';
import { worksheetUrl, type UnitExpansion } from './courses/courseExpansion';
import { iotCourse, iotExtras, iotSlides } from './courses/iotCourse';
import { iotExpansion } from './courses/iotExpansion';
import { databaseCourse, databaseExtras, databaseSlides } from './courses/databaseCourse';
import { databaseExpansion } from './courses/databaseExpansion';
import { storytellingCourse, storytellingExtras, storytellingSlides } from './courses/storytellingCourse';
import { storytellingExpansion } from './courses/storytellingExpansion';

type CourseBundle = {
  course: Grade;
  extras: Record<number, UnitExtras>;
  slides: RichSlide[][];
  expansion: Record<number, UnitExpansion>;
};

const bundles: CourseBundle[] = [
  { course: iotCourse, extras: iotExtras, slides: iotSlides, expansion: iotExpansion },
  { course: databaseCourse, extras: databaseExtras, slides: databaseSlides, expansion: databaseExpansion },
  { course: storytellingCourse, extras: storytellingExtras, slides: storytellingSlides, expansion: storytellingExpansion },
];

const withExpandedUnits = ({ course, expansion }: CourseBundle): Grade => ({
  ...course,
  units: (course.units ?? []).map((unit) => {
    const more = expansion[unit.no];
    if (!more) return unit;
    return {
      ...unit,
      topics: [...(unit.topics ?? []), ...(more.topics ?? [])],
      activities: [...(unit.activities ?? []), ...(more.activities ?? [])],
    };
  }),
});

export const extraCourses: Grade[] = bundles.map(withExpandedUnits);

const worksheetFile = (courseId: string, more: UnitExpansion): LearningFile => ({
  title: more.worksheet.title,
  url: worksheetUrl(courseId, more.worksheet.slug),
  source: 'Kru James',
  kind: 'worksheet',
  desc: more.worksheet.goal,
});

// คำตอบที่ถูกเขียนไว้ตัวเลือกแรกทุกข้อ — สลับตำแหน่งให้ต่างกันในแต่ละหน่วย
const mergeUnitExtras = (courseId: string, no: number, base: UnitExtras, more?: UnitExpansion): UnitExtras => {
  const quiz = [...(base.quiz ?? []), ...(more?.quiz ?? [])];
  if (!more) return { ...base, quiz: quiz.length ? spreadAnswers(quiz, no) : undefined };
  return {
    ...base,
    videos: [...(base.videos ?? []), ...(more.videos ?? [])],
    quiz: spreadAnswers(quiz, no),
    files: [...(base.files ?? []), worksheetFile(courseId, more)],
    fun: [...(base.fun ?? []), ...more.fun],
    articles: [...(base.articles ?? []), ...more.articles],
    lessonNotes: { ...base.lessonNotes, ...more.lessonNotes },
  };
};

export const extraUnitExtras: Record<string, Record<number, UnitExtras>> = Object.fromEntries(
  bundles.map(({ course, extras, expansion }) => [
    course.id,
    Object.fromEntries(
      Object.entries(extras).map(([no, unit]) => [no, mergeUnitExtras(course.id, Number(no), unit, expansion[Number(no)])]),
    ),
  ]),
);

const varyQuickCheckAnswers = (deck: RichSlide[], unitNo: number): RichSlide[] =>
  deck.map((slide) => {
    if (!slide.quickCheck) return slide;
    const { options, answer } = moveCorrectTo(slide.quickCheck.choices, slide.quickCheck.answer, unitNo);
    return { ...slide, quickCheck: { ...slide.quickCheck, choices: options, answer } };
  });

/** แทรกสไลด์ส่วนขยายก่อนแผ่นตรวจความเข้าใจ (แผ่นสุดท้าย) */
export const mergeDeck = (deck: RichSlide[], extra: RichSlide[] = []): RichSlide[] =>
  extra.length ? [...deck.slice(0, -1), ...extra, deck[deck.length - 1]] : deck;

export const extraRichSlides: Record<string, RichSlide[]> = Object.fromEntries(
  bundles.flatMap(({ course, slides, expansion }) =>
    slides.map((deck, i) => [`${course.id}_${i + 1}`, varyQuickCheckAnswers(mergeDeck(deck, expansion[i + 1]?.slides), i + 1)]),
  ),
);
