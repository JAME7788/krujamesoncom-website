import process from 'node:process';
import { createServer } from 'vite';

const main = async () => {
  const server = await createServer({
    appType: 'custom',
    logLevel: 'silent',
    server: { middlewareMode: true },
  });

  try {
    const [
      curriculum,
      slides,
      textContent,
      games,
      resources,
      lessonPlans,
      competencyPlans,
      ctBoard,
      python,
      assessments,
      gameLessonData,
    ] = await Promise.all([
      server.ssrLoadModule('/src/data/curriculum.ts'),
      server.ssrLoadModule('/src/data/richSlides.ts'),
      server.ssrLoadModule('/src/data/unitContent.ts'),
      server.ssrLoadModule('/src/data/gamesCatalog.ts'),
      server.ssrLoadModule('/src/data/learningResources.ts'),
      server.ssrLoadModule('/src/data/technologyLessonPlans.ts'),
      server.ssrLoadModule('/src/data/primaryTechnologyCompetencyPlans.ts'),
      server.ssrLoadModule('/src/data/ctBoardGame.ts'),
      server.ssrLoadModule('/src/data/pythonChallenges.ts'),
      server.ssrLoadModule('/src/data/studentAssessmentTemplates.ts'),
      server.ssrLoadModule('/src/data/gameLessons.ts'),
    ]);

    const gradeCoverage = curriculum.grades.map((grade) => {
      const units = grade.units || [];
      const textUnits = textContent.unitContent[grade.id] || [];
      const unitRows = units.map((unit) => {
        const rich = slides.richSlides[`${grade.id}_${unit.no}`] || [];
        const text = textUnits.find((item) => item.no === unit.no)?.slides || [];
        return {
          unitNo: unit.no,
          richSlides: rich.length,
          textSlides: text.length,
          topics: unit.topics?.length || 0,
          activities: unit.activities?.length || 0,
          hasAnySlideSource: rich.length > 0 || text.length > 0,
        };
      });
      return {
        id: grade.id,
        title: grade.title,
        indicators: grade.indicators.length,
        lessons: grade.lessons.length,
        units: units.length,
        richSlideUnits: unitRows.filter((unit) => unit.richSlides > 0).length,
        textSlideUnits: unitRows.filter((unit) => unit.textSlides > 0).length,
        unitsWithoutStoredSlides: unitRows.filter((unit) => !unit.hasAnySlideSource).length,
        unitsWithoutActivities: unitRows.filter((unit) => unit.activities === 0).length,
        totalRichSlides: unitRows.reduce((sum, unit) => sum + unit.richSlides, 0),
        totalTextSlides: unitRows.reduce((sum, unit) => sum + unit.textSlides, 0),
      };
    });
    const plans = lessonPlans.getAllTechnologyLessonPlans();
    const ctQuestionCounts = Object.fromEntries(
      Object.entries(ctBoard.QUESTION_BANK).map(([tier, items]) => [tier, items.length]),
    );

    const report = {
      auditedAt: new Date().toISOString(),
      curriculum: {
        courses: curriculum.grades.length,
        units: curriculum.grades.reduce((sum, grade) => sum + (grade.units?.length || 0), 0),
        indicators: curriculum.grades.reduce((sum, grade) => sum + grade.indicators.length, 0),
        gradeCoverage,
      },
      primaryTechnologyPlans: Object.fromEntries(
        Object.entries(plans).map(([gradeId, items]) => [gradeId, items.length]),
      ),
      competencyPlans: competencyPlans.primaryTechnologyCompetencyPlans.length,
      games: games.gamesCatalog.length,
      learningResources: {
        total: resources.allResources.length,
        gradeCoverage: Object.fromEntries(
          resources.ALL_GRADES.map((grade) => [grade.id, resources.resourcesForGrade(grade.id).length]),
        ),
      },
      gameQuestionBanks: {
        computationalThinkingBoard: ctQuestionCounts,
        pythonChallenges: python.PY_CHALLENGES.length,
      },
      assessmentTemplates: assessments.studentAssessmentTemplates.length,
      gameLessons: Object.keys(gameLessonData.gameLessons).length,
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await server.close();
  }
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
