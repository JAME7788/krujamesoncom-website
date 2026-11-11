// โครงข้อมูลส่วนขยายของวิชาเลือก (IoT, ฐานข้อมูล, เล่าเรื่องดิจิทัล)
// แยกจากไฟล์หลักสูตรเดิม เพื่อให้เติมเนื้อหาได้โดยไม่ต้องแก้หน่วยเดิม
// extraCourses.ts รวมให้: สไลด์เพิ่มแทรกก่อนแผ่นตรวจความเข้าใจ, แบบทดสอบต่อท้าย, ใบงานเป็น LearningFile
// ใบงาน HTML สร้างจาก worksheet ด้วย `node scripts/build_course_worksheets.mjs`
import type { RichSlide } from '../richSlides';
import type { Article, LessonNotes, QuizQuestion, UnitExtras } from '../unitExtras';

export type Worksheet = {
  /** ชื่อไฟล์ใน public/worksheets/<courseId>/ (ไม่มี .html) */
  slug: string;
  title: string;
  goal: string;
  keyPoints: string[];
  /** ช่องว่าง '' = ช่องให้นักเรียนเขียน */
  tables: { heading: string; head: string[]; rows: string[][] }[];
  questions: string[];
};

export type UnitExpansion = {
  topics?: string[];
  activities?: string[];
  slides: RichSlide[];
  quiz: QuizQuestion[];
  lessonNotes: LessonNotes;
  fun: NonNullable<UnitExtras['fun']>;
  articles: Article[];
  videos?: NonNullable<UnitExtras['videos']>;
  worksheet: Worksheet;
};

export const worksheetUrl = (courseId: string, slug: string) => `/worksheets/${courseId}/${slug}.html`;
