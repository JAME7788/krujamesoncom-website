import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const rulesPath = fileURLToPath(new URL('../firestore.rules', import.meta.url));
const rules = readFileSync(rulesPath, 'utf8');

const collectionBlock = (name: string): string => {
  const marker = `match /${name} {`;
  const start = rules.indexOf(marker);
  expect(start, `ไม่พบกฎของ ${name}`).toBeGreaterThanOrEqual(0);
  const next = rules.indexOf('\n    match /', start + marker.length);
  return rules.slice(start, next === -1 ? rules.length : next);
};

describe('Firestore security rule regression checks', () => {
  it.each([
    'grades/{docId}',
    'primaryCompetencyAssessments/{recordId}',
    'lessonRecords/{recordId}',
    'teachingSessions/{sessionId}',
    'studentAssessments/{recordId}',
    'attendance/{id}',
  ])('keeps teacher records private: %s', (path) => {
    const block = collectionBlock(path);
    expect(block).toContain('allow read: if isTeacher()');
    expect(block).not.toMatch(/allow\s+(?:read|write)[^;]*:\s*if\s+true/);
  });

  it.each([
    'announcements/{id}',
    'events/{id}',
    'courses/{id}',
    'questionBank/{id}',
    'homeworkAssignments/{id}',
    'schedule/{id}',
    'custom_slides/{id}',
    'settings/{id}',
    'dailyQuestions/{id}',
  ])('requires a teacher for teacher-managed writes: %s', (path) => {
    const block = collectionBlock(path);
    expect(block).toMatch(/allow\s+(?:create, update|write)[^;]*:\s*if\s+isTeacher\(\)/);
  });

  it('keeps game reflections immutable and teacher-readable', () => {
    const block = collectionBlock('gameReflections/{reflectionId}');
    expect(block).toContain('allow read: if isTeacher()');
    expect(block).toContain('allow update, delete: if false');
    expect(block).toContain('isAcademicStudentId(request.resource.data.studentId)');
    expect(block).toContain("strOk('recommendedNextStep', 1000)");
    expect(block).toContain("'learningStars' in request.resource.data");
    expect(block).toContain("'attemptNumber' in request.resource.data");
  });

  it('keeps question bank answers teacher-only', () => {
    const block = collectionBlock('questionBank/{id}');
    expect(block).toContain('allow read: if isTeacher()');
    expect(block).not.toMatch(/allow\s+read[^;]*:\s*if\s+true/);
  });

  it('keeps the default rule closed', () => {
    expect(rules).toMatch(/match \/\{document=\*\*\}[\s\S]*allow read, write: if false;/);
  });
});
