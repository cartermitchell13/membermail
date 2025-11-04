import { getServerWhopSdk } from "@/lib/whop-sdk";

const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 500;

function getErrorStatus(error: unknown): number | null {
  if (!error || typeof error !== "object") return null;
  if ("status" in error && typeof (error as any).status === "number") {
    return (error as any).status;
  }
  if ("response" in error && (error as any).response && typeof (error as any).response.status === "number") {
    return (error as any).response.status;
  }
  return null;
}

function getRetryAfterSeconds(error: unknown): number | null {
  if (!error || typeof error !== "object" || !("response" in error)) {
    return null;
  }
  const response = (error as any).response;
  if (!response) return null;
  const headerValue =
    response.headers?.["retry-after"] ??
    response.headers?.["Retry-After"] ??
    (typeof response.headers?.get === "function" ? response.headers.get("retry-after") : null);
  if (!headerValue) return null;
  const retrySeconds = Number.parseFloat(String(headerValue));
  return Number.isFinite(retrySeconds) ? retrySeconds : null;
}

async function withWhopRetry<T>(label: string, operation: () => Promise<T>): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < MAX_RETRIES) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const status = getErrorStatus(error);
      const shouldRetry =
        status === null || status >= 500 || status === 408 || status === 429 || status === 425;
      if (!shouldRetry || attempt === MAX_RETRIES - 1) {
        console.error(`[whop-course] ${label} failed`, {
          attempt: attempt + 1,
          status,
          error: error instanceof Error ? error.message : error,
        });
        throw error;
      }

      const retryAfter = getRetryAfterSeconds(error);
      const delayMs = retryAfter ? retryAfter * 1000 : BASE_BACKOFF_MS * 2 ** attempt;
      console.warn(`[whop-course] ${label} retrying`, {
        attempt: attempt + 1,
        status,
        delayMs,
      });
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      attempt += 1;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown Whop SDK failure");
}

const COURSE_CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

type CachedCourse = {
  value: CourseStructure;
  expiresAt: number;
};

const courseCache = new Map<string, CachedCourse>();

type LessonSummary = {
  id: string;
  title: string;
  order: number;
  chapterId: string;
  chapterTitle: string;
};

type ChapterSummary = {
  id: string;
  title: string;
  order: number;
  lessons: LessonSummary[];
};

export type CourseStructure = {
  id: string;
  title: string | null;
  chapters: ChapterSummary[];
};

export type CourseSummary = {
  id: string;
  title: string | null;
  experienceId: string | null;
};

export type LessonInteraction = {
  lessonId: string;
  completed: boolean;
  createdAt: Date | null;
};

function toDate(value: number | null | undefined): Date | null {
  if (!value) return null;
  if (Number.isNaN(value)) return null;
  return new Date(value * 1000);
}

/**
 * Load and cache the full chapter/lesson hierarchy for a course.
 */
export async function fetchCourseStructure(courseId: string): Promise<CourseStructure | null> {
  const existing = courseCache.get(courseId);
  if (existing && existing.expiresAt > Date.now()) {
    return existing.value;
  }

  const sdk = getServerWhopSdk();
  if (!sdk) {
    throw new Error("Whop SDK is not configured");
  }

  const response = await withWhopRetry("courses.getCourse", () => sdk.courses.getCourse({ courseId }));
  const courseObj = (response as any)?.course ?? (response as any);
  if (!courseObj) {
    return null;
  }

  const course: CourseStructure = {
    id: courseObj.id,
    title: courseObj.title ?? null,
    chapters:
      (courseObj.chapters as any[])?.map((chapter: any) => ({
        id: chapter.id,
        title: chapter.title,
        order: chapter.order,
        lessons:
          (chapter.lessons as any[])?.map((lesson: any) => ({
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            chapterId: chapter.id,
            chapterTitle: chapter.title,
          })) ?? [],
      })) ?? [],
  };

  courseCache.set(courseId, {
    value: course,
    expiresAt: Date.now() + COURSE_CACHE_TTL_MS,
  });

  return course;
}

export function invalidateCourseCache(courseId?: string) {
  if (courseId) {
    courseCache.delete(courseId);
    return;
  }
  courseCache.clear();
}

/**
 * Retrieve all courses owned by the company the app is provisioned for.
 */
export async function listCompanyCourses(companyId: string): Promise<CourseSummary[]> {
  const sdk = getServerWhopSdk();
  if (!sdk) {
    throw new Error("Whop SDK is not configured");
  }

  const response = await withWhopRetry("courses.listCoursesForCompany", () =>
    sdk.courses.listCoursesForCompany({
      companyId,
      first: 200,
    }),
  );

  const nodes = (response as any)?.company?.courses?.nodes ?? (response as any)?.courses?.nodes ?? [];
  return (nodes as any[]).map((node: any) => ({
    id: node.id,
    title: node.title ?? null,
    experienceId: node.experience?.id ?? null,
  }));
}

/**
 * Fetch lesson interaction info for a specific member by impersonating their Whop user ID.
 * We create a scoped SDK so each call is isolated, and we only ask for the subset of data we need.
 */
export async function fetchLessonInteractionsForMember(options: {
  courseId: string;
  memberWhopId: string;
}): Promise<LessonInteraction[]> {
  const { courseId, memberWhopId } = options;
  const sdk = getServerWhopSdk({ onBehalfOfUserId: memberWhopId });
  if (!sdk) {
    throw new Error("Whop SDK is not configured");
  }

  const response = await withWhopRetry("courses.getUserLessonInteractions", () =>
    sdk.courses.getUserLessonInteractions({ courseId }),
  );
  const chapters = (response as any)?.course?.chapters ?? (response as any)?.chapters ?? [];
  const interactions: LessonInteraction[] = [];
  for (const chapter of chapters as any[]) {
    for (const lesson of (chapter.lessons ?? []) as any[]) {
      if (!lesson.lessonInteraction) continue;
      interactions.push({
        lessonId: lesson.id,
        completed: Boolean(lesson.lessonInteraction.completed),
        createdAt: toDate(lesson.lessonInteraction.createdAt ?? null),
      });
    }
  }

  return interactions;
}
