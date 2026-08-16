type SubjectId = 'main' | 'cs' | 'dt';

type SkillLabel = '\u0e1e\u0e2d\u0e43\u0e0a\u0e49' | '\u0e1b\u0e32\u0e19\u0e01\u0e25\u0e32\u0e07' | '\u0e14\u0e35';

const SKILL_BASIC: SkillLabel = '\u0e1e\u0e2d\u0e43\u0e0a\u0e49';
const SKILL_MEDIUM: SkillLabel = '\u0e1b\u0e32\u0e19\u0e01\u0e25\u0e32\u0e07';
const SKILL_GOOD: SkillLabel = '\u0e14\u0e35';
const PRACTICE_MAX_SCORE = 30;
const ATTITUDE_MAX_SCORE = 10;

export interface PostLessonAssessmentEntryLike {
  studentCode?: string;
  studentNo?: number;
  studentName?: string;
  scores?: Record<string, number | undefined>;
}

export interface PostLessonAssessmentLike {
  id: string;
  kind?: string;
  classroom: string;
  sessionId?: string;
  contextKey?: string;
  archived?: boolean;
  provisional?: boolean;
  confirmedByTeacher?: boolean;
  entries?: Record<string, PostLessonAssessmentEntryLike>;
  meta?: {
    status?: string;
    planNo?: string | number;
    teachingDate?: string;
    lessonTitle?: string;
  };
}

export interface PostLessonSessionLike {
  id: string;
  classroom: string;
  subject?: SubjectId;
  period?: number;
  plannedDate?: string;
  teachingDate?: string;
  indicatorCodes?: string[];
}

export interface PostLessonIndicatorLike {
  id: string;
  code?: string;
  maxScore: number;
}

export interface PostLessonIndicatorScoreLike {
  k: number;
  maxK: number;
  webK?: number;
  manualK?: number;
  teacherK?: number;
  p?: SkillLabel;
  pScore?: number;
  webPScore?: number;
  manualPScore?: number;
  teacherPScore?: number;
  practiceLevel?: string;
  practicePassed?: boolean;
  pAssessed?: boolean;
  a?: boolean;
  webAScore?: number;
  aScore?: number;
  teacherA?: boolean;
  aAssessed?: boolean;
  note?: string;
  updatedAt: number;
  postLessonEvidence?: PostLessonGradeEvidence;
}

export interface PostLessonStudentGradeLike {
  studentCode: string;
  studentNo: number;
  name: string;
  classroom: string;
  indicators: Record<string, PostLessonIndicatorScoreLike>;
  updatedAt: number;
}

export interface PostLessonGradeEvidence {
  source: 'post-lesson';
  assessments: string[];
  sessions: string[];
  count: number;
  averageK: number;
  averageP: number;
  averageA: number;
  includedDrafts: boolean;
  lastSyncedAt: number;
}

export interface PostLessonSyncOptions {
  includeDrafts?: boolean;
  now?: number;
}

export interface PostLessonSyncInput {
  grades: PostLessonStudentGradeLike[];
  indicators: PostLessonIndicatorLike[];
  sessions: PostLessonSessionLike[];
  assessments: PostLessonAssessmentLike[];
  options?: PostLessonSyncOptions;
}

export interface PostLessonSyncSummary {
  assessmentsRead: number;
  assessmentsUsed: number;
  skippedDrafts: number;
  skippedArchived: number;
  skippedNonPostLesson: number;
  skippedWithoutSession: number;
  skippedWithoutIndicators: number;
  studentsUpdated: number;
  indicatorsUpdated: number;
  entriesUsed: number;
}

export interface PostLessonSyncResult {
  grades: PostLessonStudentGradeLike[];
  summary: PostLessonSyncSummary;
}

interface Accumulator {
  k: number[];
  p: number[];
  a: number[];
  assessments: Set<string>;
  sessions: Set<string>;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

const clampRubric = (value: number | undefined): number | null => {
  if (!Number.isFinite(value)) return null;
  return Math.max(0, Math.min(3, Number(value)));
};

const average = (values: number[]): number | null => (
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
);

const normalize = (value: string | undefined): string => (
  (value || '').replace(/\s+/g, '').toLowerCase()
);

const getPracticeLevel = (score: number): string => {
  if (score >= 30) return '\u0e14\u0e35\u0e21\u0e32\u0e01';
  if (score >= 20) return '\u0e1b\u0e32\u0e19\u0e01\u0e25\u0e32\u0e07';
  if (score >= 15) return '\u0e1e\u0e2d\u0e43\u0e0a\u0e49';
  return '\u0e44\u0e21\u0e48\u0e1c\u0e48\u0e32\u0e19';
};

const skillFromPracticeScore = (score: number): SkillLabel => {
  if (score >= 30) return SKILL_GOOD;
  if (score >= 20) return SKILL_MEDIUM;
  return SKILL_BASIC;
};

export const subjectFromClassroom = (classroom: string): SubjectId => (
  classroom.startsWith('\u0e21.') ? 'cs' : 'main'
);

export const indicatorIdFromCode = (code: string): string | null => {
  const compact = normalize(code);
  const match = compact.match(/\u0e274\.(1|2)([\u0e1b\u0e21])\.(\d+)\/(\d+)/u);
  if (!match) return compact.match(/^(cs|dt)_[pm]\d+_\d+$/u) ? compact : null;
  const strand = match[1] === '1' ? 'dt' : 'cs';
  const gradePrefix = match[2] === '\u0e1b' ? 'p' : 'm';
  return `${strand}_${gradePrefix}${match[3]}_${match[4]}`;
};

export const isEligiblePostLessonAssessment = (
  assessment: PostLessonAssessmentLike,
  options: PostLessonSyncOptions = {},
): boolean => (
  assessment.kind === 'post-lesson'
  && assessment.archived !== true
  && (
    options.includeDrafts === true
    || assessment.confirmedByTeacher === true
    || assessment.meta?.status === 'complete'
  )
);

const findSessionForAssessment = (
  assessment: PostLessonAssessmentLike,
  sessions: PostLessonSessionLike[],
): PostLessonSessionLike | null => {
  if (assessment.sessionId) {
    const byId = sessions.find((session) => session.id === assessment.sessionId);
    if (byId) return byId;
  }
  const planNo = assessment.meta?.planNo;
  const date = assessment.meta?.teachingDate || assessment.contextKey?.split('__')[0];
  return sessions.find((session) => (
    session.classroom === assessment.classroom
    && String(session.period || '') === String(planNo || '')
    && (!date || session.teachingDate === date || session.plannedDate === date)
  )) || null;
};

const resolveIndicatorIds = (
  session: PostLessonSessionLike,
  indicators: PostLessonIndicatorLike[],
): string[] => {
  const byNormalized = new Map<string, PostLessonIndicatorLike>();
  indicators.forEach((indicator) => {
    byNormalized.set(normalize(indicator.id), indicator);
    byNormalized.set(normalize(indicator.code), indicator);
  });

  return Array.from(new Set(
    (session.indicatorCodes || [])
      .map((code) => byNormalized.get(normalize(code))?.id
        || byNormalized.get(normalize(indicatorIdFromCode(code) || ''))?.id
        || indicatorIdFromCode(code))
      .filter((id): id is string => Boolean(id && indicators.some((indicator) => indicator.id === id))),
  ));
};

const emptyScore = (maxK: number, now: number): PostLessonIndicatorScoreLike => ({
  k: 0,
  maxK,
  p: SKILL_BASIC,
  a: false,
  pAssessed: false,
  aAssessed: false,
  updatedAt: now,
});

const getStudentKey = (entry: PostLessonAssessmentEntryLike, fallbackCode: string): string => (
  entry.studentCode || fallbackCode
);

const sameStudent = (
  grade: PostLessonStudentGradeLike,
  entry: PostLessonAssessmentEntryLike,
  fallbackCode: string,
): boolean => (
  grade.studentCode === getStudentKey(entry, fallbackCode)
  || (entry.studentNo !== undefined && Number(grade.studentNo) === Number(entry.studentNo))
  || (!!entry.studentName && grade.name === entry.studentName)
);

export const applyPostLessonAssessmentsToGradeRows = ({
  grades,
  indicators,
  sessions,
  assessments,
  options = {},
}: PostLessonSyncInput): PostLessonSyncResult => {
  const now = options.now || Date.now();
  const summary: PostLessonSyncSummary = {
    assessmentsRead: assessments.length,
    assessmentsUsed: 0,
    skippedDrafts: 0,
    skippedArchived: 0,
    skippedNonPostLesson: 0,
    skippedWithoutSession: 0,
    skippedWithoutIndicators: 0,
    studentsUpdated: 0,
    indicatorsUpdated: 0,
    entriesUsed: 0,
  };
  const evidenceByStudent = new Map<string, Map<string, Accumulator>>();

  assessments.forEach((assessment) => {
    if (assessment.kind !== 'post-lesson') {
      summary.skippedNonPostLesson += 1;
      return;
    }
    if (assessment.archived === true) {
      summary.skippedArchived += 1;
      return;
    }
    if (!isEligiblePostLessonAssessment(assessment, options)) {
      summary.skippedDrafts += 1;
      return;
    }

    const session = findSessionForAssessment(assessment, sessions);
    if (!session) {
      summary.skippedWithoutSession += 1;
      return;
    }
    const indicatorIds = resolveIndicatorIds(session, indicators);
    if (indicatorIds.length === 0) {
      summary.skippedWithoutIndicators += 1;
      return;
    }

    summary.assessmentsUsed += 1;
    Object.entries(assessment.entries || {}).forEach(([fallbackCode, entry]) => {
      const k = clampRubric(entry.scores?.k);
      const p = clampRubric(entry.scores?.p);
      const a = clampRubric(entry.scores?.a);
      if ((k ?? 0) <= 0 && (p ?? 0) <= 0 && (a ?? 0) <= 0) return;

      const grade = grades.find((item) => sameStudent(item, entry, fallbackCode));
      if (!grade) return;
      let byIndicator = evidenceByStudent.get(grade.studentCode);
      if (!byIndicator) {
        byIndicator = new Map<string, Accumulator>();
        evidenceByStudent.set(grade.studentCode, byIndicator);
      }

      indicatorIds.forEach((indicatorId) => {
        const acc = byIndicator.get(indicatorId) || {
          k: [],
          p: [],
          a: [],
          assessments: new Set<string>(),
          sessions: new Set<string>(),
        };
        if (k !== null && k > 0) acc.k.push(k);
        if (p !== null && p > 0) acc.p.push(p);
        if (a !== null && a > 0) acc.a.push(a);
        acc.assessments.add(assessment.id);
        acc.sessions.add(session.id);
        byIndicator.set(indicatorId, acc);
      });
      summary.entriesUsed += 1;
    });
  });

  const nextGrades = grades.map((grade) => {
    const byIndicator = evidenceByStudent.get(grade.studentCode);
    if (!byIndicator) return grade;

    let changedForStudent = false;
    const nextIndicators = { ...grade.indicators };

    byIndicator.forEach((acc, indicatorId) => {
      const indicator = indicators.find((item) => item.id === indicatorId);
      const maxK = indicator?.maxScore || nextIndicators[indicatorId]?.maxK || 15;
      const current = nextIndicators[indicatorId] || emptyScore(maxK, now);
      const avgK = average(acc.k);
      const avgP = average(acc.p);
      const avgA = average(acc.a);

      const manualK = avgK === null
        ? current.manualK
        : Math.max(current.manualK || 0, round1((avgK / 3) * maxK));
      const manualPScore = avgP === null
        ? current.manualPScore
        : Math.max(current.manualPScore || 0, round1((avgP / 3) * PRACTICE_MAX_SCORE));
      const webAScore = avgA === null
        ? current.webAScore
        : Math.max(current.webAScore || 0, round1((avgA / 3) * ATTITUDE_MAX_SCORE));

      const teacherK = current.teacherK || 0;
      const teacherPScore = current.teacherPScore || 0;
      const k = Math.max(
        current.k || 0,
        teacherK,
        Math.min(maxK, (current.webK || 0) + (manualK || 0)),
      );
      const pScore = Math.max(
        current.pScore || 0,
        teacherPScore,
        Math.min(PRACTICE_MAX_SCORE, (current.webPScore || 0) + (manualPScore || 0)),
      );
      const aScore = current.teacherA === undefined
        ? Math.max(current.aScore || 0, webAScore || 0)
        : current.teacherA ? ATTITUDE_MAX_SCORE : 0;
      const a = current.teacherA ?? Boolean(current.a || aScore >= 6);

      const nextScore: PostLessonIndicatorScoreLike = {
        ...current,
        maxK,
        manualK,
        k,
        manualPScore,
        pScore,
        p: pScore > 0 ? skillFromPracticeScore(pScore) : current.p || SKILL_BASIC,
        practiceLevel: pScore > 0 ? getPracticeLevel(pScore) : current.practiceLevel,
        practicePassed: pScore > 0 ? pScore >= 15 : current.practicePassed,
        pAssessed: Boolean(current.pAssessed || avgP !== null),
        webAScore,
        aScore,
        a,
        aAssessed: Boolean(current.aAssessed || avgA !== null),
        note: current.note,
        postLessonEvidence: {
          source: 'post-lesson',
          assessments: Array.from(acc.assessments).sort(),
          sessions: Array.from(acc.sessions).sort(),
          count: Math.max(acc.k.length, acc.p.length, acc.a.length),
          averageK: avgK === null ? 0 : round1(avgK),
          averageP: avgP === null ? 0 : round1(avgP),
          averageA: avgA === null ? 0 : round1(avgA),
          includedDrafts: options.includeDrafts === true,
          lastSyncedAt: now,
        },
        updatedAt: now,
      };

      if (JSON.stringify(current) !== JSON.stringify(nextScore)) {
        nextIndicators[indicatorId] = nextScore;
        summary.indicatorsUpdated += 1;
        changedForStudent = true;
      }
    });

    if (!changedForStudent) return grade;
    summary.studentsUpdated += 1;
    return {
      ...grade,
      indicators: nextIndicators,
      updatedAt: now,
    };
  });

  return { grades: nextGrades, summary };
};
