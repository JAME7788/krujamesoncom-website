/**
 * Course Cover Images Mapping
 * Maps course IDs to their 3D Hero Art cover image URLs.
 * Generated with 16:9 4K DALL-E 3 Pixar-style renders.
 */
export const COURSE_COVERS: Record<string, string> = {
  'iot-smart': '/images/courses/iot-smart-cover.png',
  'database-basic': '/images/courses/database-basic-cover.png',
  'digital-story': '/images/courses/digital-story-cover.png',
  'python-basic': '/images/courses/python-basic-cover.png',
  'arduino-basic': '/images/courses/arduino-basic-cover.png',
  'electronics-basic': '/images/courses/electronics-basic-cover.png',
};

export function getCourseCover(courseId: string): string | null {
  return COURSE_COVERS[courseId] || null;
}
