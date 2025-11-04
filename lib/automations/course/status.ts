import type { CourseStructure, LessonInteraction } from "@/lib/whop/course";

export type LessonStatus = "not_started" | "started" | "completed";

export type LessonStatusMap = Map<string, { status: LessonStatus; occurredAt: string }>;

export function computeLessonStatuses(
  lessons: LessonInteraction[],
  fallbackIso: string,
): LessonStatusMap {
  const map: LessonStatusMap = new Map();
  for (const interaction of lessons) {
    const occurredAt = interaction.createdAt ? interaction.createdAt.toISOString() : fallbackIso;
    const status: LessonStatus = interaction.completed ? "completed" : "started";
    map.set(interaction.lessonId, { status, occurredAt });
  }
  return map;
}

export function isChapterCompleted(
  chapterId: string | null,
  lessonStatuses: LessonStatusMap,
  courseStructure: CourseStructure | null,
): boolean {
  if (!chapterId || !courseStructure) return false;
  const chapter = courseStructure.chapters.find((item) => item.id === chapterId);
  if (!chapter) return false;
  if (chapter.lessons.length === 0) return false;
  return chapter.lessons.every((lesson) => lessonStatuses.get(lesson.id)?.status === "completed");
}

export function isCourseStarted(lessonStatuses: LessonStatusMap): boolean {
  for (const { status } of lessonStatuses.values()) {
    if (status === "started" || status === "completed") {
      return true;
    }
  }
  return false;
}

export function isCourseCompleted(
  lessonStatuses: LessonStatusMap,
  courseStructure: CourseStructure | null,
): boolean {
  if (!courseStructure) return false;
  const totalLessons = courseStructure.chapters.reduce((count, chapter) => count + chapter.lessons.length, 0);
  if (totalLessons === 0) return false;
  let completedCount = 0;
  for (const chapter of courseStructure.chapters) {
    for (const lesson of chapter.lessons) {
      if (lessonStatuses.get(lesson.id)?.status === "completed") {
        completedCount += 1;
      }
    }
  }
  return completedCount === totalLessons;
}
