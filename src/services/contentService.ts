// ระบบจัดการเนื้อหา — สร้าง/แก้ไข/ลบ รายวิชา, หน่วย, สไลด์, สื่อ, ควิซ
// บันทึกใน localStorage layer ทับกับ curriculum.ts ที่ build-in

export interface CustomLink {
  id: string;
  title: string;
  url: string;
  type: 'video' | 'fun' | 'article' | 'other';
  desc?: string;
  emoji?: string;
}

export interface CustomQuiz {
  id: string;
  q: string;
  options: string[];
  answer: number;
  explain?: string;
}

export interface CustomUnit {
  id: string;
  no: number;
  title: string;
  topics: string[];
  intro?: string;
  slides: string[];        // เนื้อหาสไลด์ (text)
  links: CustomLink[];      // วิดีโอ/เกม/บทความ
  quiz: CustomQuiz[];
}

export interface CustomCourse {
  id: string;               // เช่น 'custom-coding-1'
  title: string;
  emoji: string;
  description: string;
  level?: string;           // 'ป.1-3', 'ม.1-3' ฯลฯ
  units: CustomUnit[];
  createdAt: number;
  updatedAt: number;
}

const KEY = 'krujames_custom_courses_v1';

const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const loadCourses = (): CustomCourse[] => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveCourses = (courses: CustomCourse[]) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(courses));
  } catch (e) {
    console.warn('saveCourses failed', e);
  }
};

// ---------- Course CRUD ----------

export const createCourse = (data: Partial<CustomCourse>): CustomCourse => {
  const courses = loadCourses();
  const course: CustomCourse = {
    id: data.id || `custom_${uid()}`,
    title: data.title || 'รายวิชาใหม่',
    emoji: data.emoji || '📚',
    description: data.description || '',
    level: data.level || '',
    units: data.units || [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  courses.push(course);
  saveCourses(courses);
  return course;
};

export const updateCourse = (id: string, patch: Partial<CustomCourse>): CustomCourse | null => {
  const courses = loadCourses();
  const idx = courses.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  courses[idx] = { ...courses[idx], ...patch, updatedAt: Date.now() };
  saveCourses(courses);
  return courses[idx];
};

export const deleteCourse = (id: string) => {
  saveCourses(loadCourses().filter((c) => c.id !== id));
};

// ---------- Unit CRUD ----------

export const addUnit = (courseId: string, unitData?: Partial<CustomUnit>): CustomUnit | null => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;
  const unit: CustomUnit = {
    id: unitData?.id || uid(),
    no: unitData?.no ?? (course.units.length + 1),
    title: unitData?.title || `หน่วยที่ ${course.units.length + 1}`,
    topics: unitData?.topics || [],
    intro: unitData?.intro || '',
    slides: unitData?.slides || [],
    links: unitData?.links || [],
    quiz: unitData?.quiz || [],
  };
  course.units.push(unit);
  course.updatedAt = Date.now();
  saveCourses(courses);
  return unit;
};

export const updateUnit = (courseId: string, unitId: string, patch: Partial<CustomUnit>): CustomUnit | null => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;
  const idx = course.units.findIndex((u) => u.id === unitId);
  if (idx === -1) return null;
  course.units[idx] = { ...course.units[idx], ...patch };
  course.updatedAt = Date.now();
  saveCourses(courses);
  return course.units[idx];
};

export const deleteUnit = (courseId: string, unitId: string) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return;
  course.units = course.units.filter((u) => u.id !== unitId);
  course.updatedAt = Date.now();
  saveCourses(courses);
};

// ---------- Slide / Link / Quiz helpers ----------

export const addSlide = (courseId: string, unitId: string, text: string) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  const unit = course?.units.find((u) => u.id === unitId);
  if (!unit) return;
  unit.slides.push(text);
  course!.updatedAt = Date.now();
  saveCourses(courses);
};

export const updateSlide = (courseId: string, unitId: string, idx: number, text: string) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  const unit = course?.units.find((u) => u.id === unitId);
  if (!unit || idx < 0 || idx >= unit.slides.length) return;
  unit.slides[idx] = text;
  course!.updatedAt = Date.now();
  saveCourses(courses);
};

export const removeSlide = (courseId: string, unitId: string, idx: number) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  const unit = course?.units.find((u) => u.id === unitId);
  if (!unit) return;
  unit.slides.splice(idx, 1);
  course!.updatedAt = Date.now();
  saveCourses(courses);
};

export const addLink = (courseId: string, unitId: string, link: Omit<CustomLink, 'id'>) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  const unit = course?.units.find((u) => u.id === unitId);
  if (!unit) return;
  unit.links.push({ ...link, id: uid() });
  course!.updatedAt = Date.now();
  saveCourses(courses);
};

export const removeLink = (courseId: string, unitId: string, linkId: string) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  const unit = course?.units.find((u) => u.id === unitId);
  if (!unit) return;
  unit.links = unit.links.filter((l) => l.id !== linkId);
  course!.updatedAt = Date.now();
  saveCourses(courses);
};

export const addQuiz = (courseId: string, unitId: string, q: Omit<CustomQuiz, 'id'>) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  const unit = course?.units.find((u) => u.id === unitId);
  if (!unit) return;
  unit.quiz.push({ ...q, id: uid() });
  course!.updatedAt = Date.now();
  saveCourses(courses);
};

export const removeQuiz = (courseId: string, unitId: string, quizId: string) => {
  const courses = loadCourses();
  const course = courses.find((c) => c.id === courseId);
  const unit = course?.units.find((u) => u.id === unitId);
  if (!unit) return;
  unit.quiz = unit.quiz.filter((q) => q.id !== quizId);
  course!.updatedAt = Date.now();
  saveCourses(courses);
};

// ---------- Export / Import ----------

export const exportJSON = (): string => {
  return JSON.stringify(loadCourses(), null, 2);
};

export const importJSON = (json: string): boolean => {
  try {
    const data = JSON.parse(json);
    if (!Array.isArray(data)) return false;
    saveCourses(data);
    return true;
  } catch {
    return false;
  }
};
