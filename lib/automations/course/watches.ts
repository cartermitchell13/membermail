import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchCourseStructure, fetchLessonInteractionsForMember } from "@/lib/whop/course";
import { upsertCourseProgressState } from "./ingest";
import type { CourseStepMetadata } from "./types";
import { isCourseAutomationEvent, type AutomationTriggerEvent } from "@/lib/automations/events";
import {
  computeLessonStatuses,
  isChapterCompleted,
  isCourseCompleted,
  isCourseStarted,
  type LessonStatusMap,
} from "./status";

type DatabaseClient = SupabaseClient<any, "public", any>;

const WATCHABLE_EVENTS: AutomationTriggerEvent[] = [
  "course_lesson_started",
  "course_lesson_not_started_after_x_days",
  "course_chapter_completed",
  "course_started",
  "course_completed",
];

type CourseAutomationDefinition = {
  event: AutomationTriggerEvent;
  metadata: CourseStepMetadata;
};

function normalizeMetadata(raw: unknown, event: AutomationTriggerEvent): CourseStepMetadata | null {
  if (!raw || typeof raw !== "object") return null;
  const metadata = { ...(raw as Record<string, unknown>) } as CourseStepMetadata;
  if (!metadata.courseId || typeof metadata.courseId !== "string") {
    return null;
  }
  if (!isCourseAutomationEvent(event)) {
    return null;
  }
  metadata.triggerKind = event;
  return metadata;
}

async function loadCourseAutomations(
  supabase: DatabaseClient,
  communityId: number,
): Promise<CourseAutomationDefinition[]> {
  const definitions: CourseAutomationDefinition[] = [];

  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("trigger_event, automation_trigger_metadata")
    .eq("community_id", communityId)
    .eq("send_mode", "automation")
    .eq("automation_status", "active")
    .in("trigger_event", WATCHABLE_EVENTS);

  if (campaigns) {
    for (const campaign of campaigns) {
      const event = campaign.trigger_event as AutomationTriggerEvent;
      const metadata = normalizeMetadata(campaign.automation_trigger_metadata, event);
      if (metadata) {
        definitions.push({ event, metadata });
      }
    }
  }

  const { data: sequences } = await supabase
    .from("automation_sequences")
    .select("id, trigger_event, status, automation_steps(id, position, metadata)")
    .eq("community_id", communityId)
    .eq("status", "active")
    .in("trigger_event", WATCHABLE_EVENTS)
    .order("position", { ascending: true, foreignTable: "automation_steps" });

  if (sequences) {
    for (const sequence of sequences) {
      const event = sequence.trigger_event as AutomationTriggerEvent;
      const steps = Array.isArray(sequence.automation_steps) ? sequence.automation_steps : [];
      const firstStep = steps[0];
      if (!firstStep) continue;
      const metadata = normalizeMetadata(firstStep.metadata, event);
      if (metadata) {
        definitions.push({ event, metadata });
      }
    }
  }

  return definitions;
}

type WatchKey = `${AutomationTriggerEvent}|${string}|${string}|${string}`;

function toKey(event: AutomationTriggerEvent, courseId: string, chapterId: string | null, lessonId: string | null): WatchKey {
  return `${event}|${courseId}|${chapterId ?? "null"}|${lessonId ?? "null"}`;
}

export async function ensureCourseWatchesForMember(options: {
  supabase: DatabaseClient;
  communityId: number;
  memberId: number;
  memberWhopId: string | null;
}) {
  const { supabase, communityId, memberId, memberWhopId } = options;
  if (!memberWhopId) {
    return;
  }

  const automations = await loadCourseAutomations(supabase, communityId);
  if (automations.length === 0) {
    return;
  }

  const { data: existingRows } = await supabase
    .from("course_trigger_watches")
    .select("id, trigger_kind, course_id, chapter_id, lesson_id, satisfied_at, deadline_at")
    .eq("member_id", memberId);

  const existingMap = new Map<
    WatchKey,
    { id: number; satisfiedAt: string | null; deadlineAt: string | null }
  >();
  if (existingRows) {
    for (const row of existingRows) {
      const key = toKey(row.trigger_kind as AutomationTriggerEvent, row.course_id, row.chapter_id, row.lesson_id);
      existingMap.set(key, { id: row.id, satisfiedAt: row.satisfied_at, deadlineAt: row.deadline_at });
    }
  }

  const now = new Date();
  const nowIso = now.toISOString();

  const byCourse = new Map<string, CourseAutomationDefinition[]>();
  for (const definition of automations) {
    if (!definition.metadata.courseId) continue;
    const bucket = byCourse.get(definition.metadata.courseId) ?? [];
    bucket.push(definition);
    byCourse.set(definition.metadata.courseId, bucket);
  }

  for (const [courseId, definitions] of byCourse.entries()) {
    let lessonStatuses: LessonStatusMap = new Map();
    let structure = null;

    try {
      const interactions = await fetchLessonInteractionsForMember({
        courseId,
        memberWhopId,
      });
      lessonStatuses = computeLessonStatuses(interactions, nowIso);

      for (const interaction of interactions) {
        await upsertCourseProgressState(supabase, memberId, {
          courseId,
          lessonId: interaction.lessonId,
          status: interaction.completed ? "completed" : "started",
          occurredAt: interaction.createdAt ? interaction.createdAt.toISOString() : nowIso,
          source: "whop_snapshot",
        });
      }
    } catch (error) {
      console.error("[course-automation] Failed to seed lesson interactions", {
        courseId,
        memberWhopId,
        error: error instanceof Error ? error.message : error,
      });
    }

    try {
      structure = await fetchCourseStructure(courseId);
    } catch (error) {
      console.error("[course-automation] Failed to load course structure for watches", {
        courseId,
        error: error instanceof Error ? error.message : error,
      });
    }

    for (const definition of definitions) {
      const metadata = definition.metadata;
      const key = toKey(definition.event, metadata.courseId, metadata.chapterId ?? null, metadata.lessonId ?? null);

      let satisfied = false;
      let deadlineAt: string | null = null;

      switch (definition.event) {
        case "course_lesson_started": {
          if (metadata.lessonId) {
            const lessonState = lessonStatuses.get(metadata.lessonId);
            satisfied = lessonState?.status === "started" || lessonState?.status === "completed";
          }
          break;
        }
        case "course_lesson_not_started_after_x_days": {
          const waitDays = metadata.waitDays && metadata.waitDays > 0 ? metadata.waitDays : 3;
          deadlineAt = new Date(now.getTime() + waitDays * 24 * 60 * 60 * 1000).toISOString();
          if (metadata.lessonId) {
            const lessonState = lessonStatuses.get(metadata.lessonId);
            satisfied = lessonState?.status === "started" || lessonState?.status === "completed";
          }
          break;
        }
        case "course_chapter_completed": {
          satisfied = isChapterCompleted(metadata.chapterId ?? null, lessonStatuses, structure);
          break;
        }
        case "course_started": {
          satisfied = isCourseStarted(lessonStatuses);
          break;
        }
        case "course_completed": {
          satisfied = isCourseCompleted(lessonStatuses, structure);
          break;
        }
        default:
          break;
      }

      const existing = existingMap.get(key);
      const updates: Record<string, any> = {
        trigger_metadata: metadata,
        updated_at: nowIso,
      };

      if (deadlineAt) {
        updates.deadline_at = deadlineAt;
      }
      if (satisfied) {
        updates.satisfied_at = existing?.satisfiedAt ?? nowIso;
      } else if (existing?.satisfiedAt) {
        updates.satisfied_at = null;
      }

      if (existing) {
        await supabase
          .from("course_trigger_watches")
          .update(updates)
          .eq("id", existing.id);
      } else {
        await supabase.from("course_trigger_watches").insert({
          member_id: memberId,
          course_id: metadata.courseId,
          chapter_id: metadata.chapterId ?? null,
          lesson_id: metadata.lessonId ?? null,
          trigger_kind: definition.event,
          trigger_metadata: metadata,
          deadline_at: deadlineAt,
          satisfied_at: satisfied ? nowIso : null,
          created_at: nowIso,
          updated_at: nowIso,
        });
      }
    }
  }
}
