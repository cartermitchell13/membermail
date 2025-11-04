import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCourseStructure } from "@/lib/whop/course";
import type { AutomationTriggerEvent } from "@/lib/automations/events";
import type { CourseStepMetadata } from "./types";

type DatabaseClient = SupabaseClient<any, "public", any>;

export type CourseTriggerContext = {
  event: AutomationTriggerEvent;
  occurredAt: string;
  courseId: string;
  courseTitle?: string | null;
  chapterId?: string | null;
  chapterTitle?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  experienceId?: string | null;
};

function coerceIsoTimestamp(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString();
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }
  return new Date().toISOString();
}

async function resolveChapterContext(courseId: string, lessonId: string) {
  try {
    const structure = await fetchCourseStructure(courseId);
    if (!structure) return { chapterId: null, chapterTitle: null };
    for (const chapter of structure.chapters) {
      const match = chapter.lessons.find((lesson) => lesson.id === lessonId);
      if (match) {
        return { chapterId: chapter.id, chapterTitle: chapter.title ?? null };
      }
    }
  } catch (error) {
    console.warn("[course-automation] Failed to resolve chapter context", {
      courseId,
      lessonId,
      error: error instanceof Error ? error.message : error,
    });
  }
  return { chapterId: null, chapterTitle: null };
}

function extractBasicCourseParts(raw: Record<string, any>) {
  const course = raw.course ?? {};
  const chapter = raw.chapter ?? {};
  const lesson = raw.lesson ?? {};
  const experience = course.experience ?? raw.experience ?? {};

  const courseId = course.id ?? raw.course_id ?? raw.courseId ?? null;
  const courseTitle = course.title ?? raw.course_title ?? raw.courseTitle ?? null;
  const chapterId = chapter?.id ?? raw.chapter_id ?? raw.chapterId ?? null;
  const chapterTitle = chapter?.title ?? raw.chapter_title ?? raw.chapterTitle ?? null;
  const lessonId = lesson?.id ?? raw.lesson_id ?? raw.lessonId ?? null;
  const lessonTitle = lesson?.title ?? raw.lesson_title ?? raw.lessonTitle ?? null;
  const experienceId =
    experience?.id ??
    course.experience_id ??
    course.experienceId ??
    raw.experience_id ??
    raw.experienceId ??
    null;

  const occurredAt = coerceIsoTimestamp(
    raw.occurred_at ?? raw.created_at ?? raw.completed_at ?? raw.timestamp ?? raw.deadline_at,
  );

  return { courseId, courseTitle, chapterId, chapterTitle, lessonId, lessonTitle, experienceId, occurredAt };
}

export async function extractCourseTriggerContext(
  event: AutomationTriggerEvent,
  raw: Record<string, any> | null | undefined,
): Promise<CourseTriggerContext | null> {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  switch (event) {
    case "course_lesson_completed": {
      const courseId: string | undefined =
        raw.course_id ?? raw.courseId ?? raw.course?.id ?? raw.lesson?.course_id ?? raw.lesson?.courseId;
      const lessonId: string | undefined = raw.lesson_id ?? raw.lessonId ?? raw.lesson?.id ?? raw.id;
      if (!courseId || !lessonId) {
        return null;
      }

      const occurredAt = coerceIsoTimestamp(raw.created_at ?? raw.completed_at ?? raw.timestamp);
      const courseTitle =
        raw.course?.title ?? raw.course_title ?? raw.courseTitle ?? raw.lesson?.course_title ?? null;
      const lessonTitle = raw.lesson?.title ?? raw.lesson_title ?? raw.lessonTitle ?? null;
      const experienceId =
        raw.experience_id ??
        raw.experienceId ??
        raw.course?.experience_id ??
        raw.course?.experienceId ??
        raw.course?.experience?.id ??
        null;

      const { chapterId, chapterTitle } = await resolveChapterContext(courseId, lessonId);

      return {
        event,
        occurredAt,
        courseId,
        courseTitle,
        chapterId,
        chapterTitle,
        lessonId,
        lessonTitle,
        experienceId,
      };
    }
    case "course_lesson_started":
    case "course_lesson_not_started_after_x_days":
    case "course_chapter_completed":
    case "course_started":
    case "course_completed": {
      const {
        courseId,
        courseTitle,
        chapterId,
        chapterTitle,
        lessonId,
        lessonTitle,
        experienceId,
        occurredAt,
      } = extractBasicCourseParts(raw);

      if (!courseId) {
        return null;
      }
      if (
        ["course_lesson_started", "course_lesson_not_started_after_x_days"].includes(event) &&
        !lessonId
      ) {
        return null;
      }
      if (event === "course_chapter_completed" && !chapterId) {
        return null;
      }

      return {
        event,
        occurredAt,
        courseId,
        courseTitle,
        chapterId,
        chapterTitle,
        lessonId: lessonId ?? null,
        lessonTitle,
        experienceId,
      };
    }
    default:
      return null;
  }
}

function buildProgressMetadata(context: {
  courseTitle?: string | null;
  chapterId?: string | null;
  chapterTitle?: string | null;
  lessonTitle?: string | null;
  experienceId?: string | null;
  source?: string | null;
}) {
  return {
    courseTitle: context.courseTitle ?? null,
    chapterId: context.chapterId ?? null,
    chapterTitle: context.chapterTitle ?? null,
    lessonTitle: context.lessonTitle ?? null,
    experienceId: context.experienceId ?? null,
    source: context.source ?? "whop_webhook",
  };
}

export async function upsertCourseProgressState(
  supabase: DatabaseClient,
  memberId: number,
  state: {
    courseId: string;
    lessonId: string;
    status: "started" | "completed";
    occurredAt: string;
    courseTitle?: string | null;
    chapterId?: string | null;
    chapterTitle?: string | null;
    lessonTitle?: string | null;
    experienceId?: string | null;
    source?: string | null;
  },
) {
  const occurredAt = coerceIsoTimestamp(state.occurredAt);
  const { data: existing } = await supabase
    .from("course_progress_states")
    .select("id, started_at, completed_at, status")
    .eq("member_id", memberId)
    .eq("course_id", state.courseId)
    .eq("lesson_id", state.lessonId)
    .single();

  const metadata = buildProgressMetadata(state);
  const nextStatus =
    state.status === "completed" ? "completed" : existing?.status === "completed" ? "completed" : "started";
  const nextStartedAt =
    existing?.started_at ?? (state.status === "started" || state.status === "completed" ? occurredAt : null);
  const nextCompletedAt = state.status === "completed" ? occurredAt : existing?.completed_at ?? null;

  const payload = {
    member_id: memberId,
    course_id: state.courseId,
    lesson_id: state.lessonId,
    status: nextStatus,
    started_at: nextStartedAt,
    completed_at: nextCompletedAt,
    last_interaction_at: occurredAt,
    metadata,
    updated_at: new Date().toISOString(),
  };

  if (existing?.id) {
    await supabase
      .from("course_progress_states")
      .update(payload as any)
      .eq("id", existing.id);
    return;
  }

  await supabase.from("course_progress_states").insert({
    ...payload,
    created_at: new Date().toISOString(),
  } as any);
}

export async function recordCourseProgress(
  supabase: DatabaseClient,
  memberId: number,
  context: CourseTriggerContext,
) {
  if (!context.lessonId) {
    return;
  }

  await upsertCourseProgressState(supabase, memberId, {
    courseId: context.courseId,
    lessonId: context.lessonId,
    status: "completed",
    occurredAt: context.occurredAt,
    courseTitle: context.courseTitle,
    chapterId: context.chapterId,
    chapterTitle: context.chapterTitle,
    lessonTitle: context.lessonTitle,
    experienceId: context.experienceId,
  });
}

export function courseMetadataMatchesContext(
  metadata: CourseStepMetadata | null | undefined,
  context: CourseTriggerContext | null,
  event: AutomationTriggerEvent,
): boolean {
  if (!context) {
    // Non-course event: only match if metadata absent.
    return !metadata;
  }

  if (!metadata) {
    return false;
  }

  if (metadata.triggerKind && metadata.triggerKind !== event) {
    return false;
  }

  if (metadata.courseId && metadata.courseId !== context.courseId) {
    return false;
  }

  if (metadata.chapterId && metadata.chapterId !== context.chapterId) {
    return false;
  }

  if (metadata.lessonId && metadata.lessonId !== context.lessonId) {
    return false;
  }

  return true;
}
