/**
 * Metadata describing a course-related automation step.
 * Persisted inside utomation_steps.metadata for fast lookup while scheduling.
 */
export type CourseStepMetadata = {
  courseId: string;
  courseTitle?: string;
  chapterId?: string | null;
  chapterTitle?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  triggerKind:
    | "course_lesson_started"
    | "course_lesson_completed"
    | "course_chapter_completed"
    | "course_started"
    | "course_completed"
    | "course_lesson_not_started_after_x_days";
  /**
   * Optional number of days used for the "lesson not started" guard.
   * Stored to avoid recomputing deadlines.
   */
  waitDays?: number | null;
};

/**
 * Payload snapshot stored in course_progress_states.
 */
export type CourseProgressState = {
  memberId: number;
  courseId: string;
  lessonId: string;
  status: "not_started" | "started" | "completed";
  startedAt?: Date | null;
  completedAt?: Date | null;
  lastInteractionAt?: Date | null;
};

/**
 * Event payload delivered to handleAutomationTrigger when a course trigger fires.
 */
export type CourseAutomationTriggerPayload = {
  courseId: string;
  courseTitle?: string;
  chapterId?: string | null;
  chapterTitle?: string | null;
  lessonId?: string | null;
  lessonTitle?: string | null;
  triggerEvent: string;
  memberWhopId: string;
  occurredAt: string;
};
