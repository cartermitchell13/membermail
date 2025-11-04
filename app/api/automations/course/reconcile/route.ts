"use server";

import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { fetchLessonInteractionsForMember, fetchCourseStructure } from "@/lib/whop/course";
import {
  computeLessonStatuses,
  isChapterCompleted,
  isCourseCompleted,
  isCourseStarted,
  type LessonStatusMap,
} from "@/lib/automations/course/status";
import { upsertCourseProgressState } from "@/lib/automations/course/ingest";
import { handleAutomationTrigger } from "@/lib/automations/service";
import type { AutomationTriggerEvent } from "@/lib/automations/events";
import type { CourseStepMetadata } from "@/lib/automations/course/types";

const MAX_BATCH = 50;
const WATCH_EVENTS: AutomationTriggerEvent[] = [
  "course_lesson_started",
  "course_lesson_not_started_after_x_days",
  "course_chapter_completed",
  "course_started",
  "course_completed",
];

function requireCronSecret(req: NextRequest) {
  const configured = process.env.AUTOMATION_CRON_SECRET;
  if (!configured) return true;
  const provided = req.headers.get("x-cron-secret");
  return provided === configured;
}

type WatchRow = {
  id: number;
  memberId: number;
  courseId: string;
  chapterId: string | null;
  lessonId: string | null;
  triggerKind: AutomationTriggerEvent;
  metadata: CourseStepMetadata | null;
  deadlineAt: string | null;
  member: {
    communityId: number;
    whopMemberId: string | null;
  } | null;
};

type GroupKey = `${number}|${string}`;

type GroupData = {
  memberId: number;
  courseId: string;
  communityId: number;
  whopMemberId: string;
  watches: WatchRow[];
};

function toGroupKey(memberId: number, courseId: string): GroupKey {
  return `${memberId}|${courseId}`;
}

function parseMetadata(raw: unknown): CourseStepMetadata | null {
  if (!raw || typeof raw !== "object") return null;
  const metadata = { ...(raw as Record<string, unknown>) } as CourseStepMetadata;
  if (!metadata.courseId || typeof metadata.courseId !== "string") {
    return null;
  }
  return metadata;
}

function nextDeadline(waitDays: number, from: Date): string {
  const ms = waitDays * 24 * 60 * 60 * 1000;
  return new Date(from.getTime() + ms).toISOString();
}

function selectLessonByStatus(
  lessonStatuses: LessonStatusMap,
  predicate: (status: { status: string }) => boolean,
  mode: "earliest" | "latest" = "earliest",
): { lessonId: string; occurredAt: string } | null {
  let candidate: { lessonId: string; occurredAt: string } | null = null;
  for (const [lessonId, info] of lessonStatuses.entries()) {
    if (!predicate(info)) continue;
    if (
      !candidate ||
      (mode === "earliest" && info.occurredAt < candidate.occurredAt) ||
      (mode === "latest" && info.occurredAt > candidate.occurredAt)
    ) {
      candidate = { lessonId, occurredAt: info.occurredAt };
    }
  }
  return candidate;
}

export async function POST(req: NextRequest) {
  if (!requireCronSecret(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getAdminSupabaseClient();
  const now = new Date();
  const nowIso = now.toISOString();

  const { data: rows, error } = await supabase
    .from("course_trigger_watches")
    .select(
      `
        id,
        member_id,
        course_id,
        chapter_id,
        lesson_id,
        trigger_kind,
        trigger_metadata,
        deadline_at,
        satisfied_at,
        members (
          id,
          community_id,
          whop_member_id
        )
      `,
    )
    .in("trigger_kind", WATCH_EVENTS)
    .is("satisfied_at", null)
    .order("deadline_at", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true })
    .limit(MAX_BATCH);

  if (error) {
    return new Response(`Failed to load watches: ${error.message}`, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return Response.json({ processed: 0, triggered: 0, skipped: 0 });
  }

  const watches: WatchRow[] = rows
    .map((row: any) => ({
      id: row.id as number,
      memberId: row.member_id as number,
      courseId: row.course_id as string,
      chapterId: row.chapter_id ?? null,
      lessonId: row.lesson_id ?? null,
      triggerKind: row.trigger_kind as AutomationTriggerEvent,
      metadata: parseMetadata(row.trigger_metadata),
      deadlineAt: row.deadline_at ?? null,
      member: row.members
        ? {
            communityId: row.members.community_id as number,
            whopMemberId: row.members.whop_member_id as string | null,
          }
        : null,
    }))
    .filter((watch) => watch.member && watch.metadata && watch.metadata.courseId);

  if (watches.length === 0) {
    return Response.json({ processed: 0, triggered: 0, skipped: rows.length });
  }

  const communityIds = Array.from(
    new Set(watches.map((watch) => watch.member!.communityId).filter((id): id is number => Number.isFinite(id))),
  );
  const { data: communityRows } = await supabase
    .from("communities")
    .select("id, whop_community_id")
    .in("id", communityIds);

  const communityMap = new Map<number, string>();
  communityRows?.forEach((community) => {
    if (community.whop_community_id) {
      communityMap.set(community.id, community.whop_community_id);
    }
  });

  const groups = new Map<GroupKey, GroupData>();
  for (const watch of watches) {
    const whopMemberId = watch.member?.whopMemberId;
    const communityId = watch.member?.communityId;
    if (!whopMemberId || !communityId) {
      continue;
    }
    const companyId = communityMap.get(communityId);
    if (!companyId) {
      continue;
    }
    const key = toGroupKey(watch.memberId, watch.courseId);
    const existing = groups.get(key);
    if (existing) {
      existing.watches.push(watch);
    } else {
      groups.set(key, {
        memberId: watch.memberId,
        courseId: watch.courseId,
        communityId,
        whopMemberId,
        watches: [watch],
      });
    }
  }

  let processed = 0;
  let triggered = 0;
  let skipped = rows.length - watches.length;

  for (const group of groups.values()) {
    processed += group.watches.length;
    const companyId = communityMap.get(group.communityId);
    if (!companyId) {
      skipped += group.watches.length;
      continue;
    }

    let lessonStatuses: LessonStatusMap = new Map();
    try {
      const interactions = await fetchLessonInteractionsForMember({
        courseId: group.courseId,
        memberWhopId: group.whopMemberId,
      });
      lessonStatuses = computeLessonStatuses(interactions, nowIso);
      for (const interaction of interactions) {
        await upsertCourseProgressState(supabase, group.memberId, {
          courseId: group.courseId,
          lessonId: interaction.lessonId,
          status: interaction.completed ? "completed" : "started",
          occurredAt: interaction.createdAt ? interaction.createdAt.toISOString() : nowIso,
          source: "whop_snapshot",
        });
      }
    } catch (err) {
      console.error("[course-reconcile] Failed to fetch interactions", {
        memberId: group.memberId,
        courseId: group.courseId,
        error: err instanceof Error ? err.message : err,
      });
    }

    const needsStructure = group.watches.some((watch) =>
      ["course_chapter_completed", "course_completed"].includes(watch.triggerKind),
    );
    let structure = null;
    if (needsStructure) {
      try {
        structure = await fetchCourseStructure(group.courseId);
      } catch (err) {
        console.error("[course-reconcile] Failed to fetch course structure", {
          courseId: group.courseId,
          error: err instanceof Error ? err.message : err,
        });
      }
    }

    for (const watch of group.watches) {
      const metadata = watch.metadata!;
      const basePayload = {
        course: {
          id: metadata.courseId,
          title: metadata.courseTitle ?? null,
        },
        chapter: metadata.chapterId
          ? {
              id: metadata.chapterId,
              title: metadata.chapterTitle ?? null,
            }
          : null,
        lesson: metadata.lessonId
          ? {
              id: metadata.lessonId,
              title: metadata.lessonTitle ?? null,
            }
          : null,
        source: "course_watch_reconcile",
        watch_id: watch.id,
      };

      let shouldTrigger = false;
      let triggerOccurredAt = nowIso;
      let updates: Record<string, any> = { updated_at: nowIso };
      let newDeadline: string | null = null;

      switch (watch.triggerKind) {
        case "course_lesson_started": {
          if (metadata.lessonId) {
            const state = lessonStatuses.get(metadata.lessonId);
            if (state && (state.status === "started" || state.status === "completed")) {
              shouldTrigger = true;
              triggerOccurredAt = state.occurredAt;
              updates.satisfied_at = nowIso;
            }
          }
          break;
        }
        case "course_lesson_not_started_after_x_days": {
          const waitDays = metadata.waitDays && metadata.waitDays > 0 ? metadata.waitDays : 3;
          if (metadata.lessonId) {
            const state = lessonStatuses.get(metadata.lessonId);
            if (state && (state.status === "started" || state.status === "completed")) {
              updates.satisfied_at = nowIso;
              break;
            }
          }
          if (watch.deadlineAt && watch.deadlineAt <= nowIso) {
            shouldTrigger = true;
            triggerOccurredAt = watch.deadlineAt;
            newDeadline = nextDeadline(waitDays, now);
            updates.deadline_at = newDeadline;
            updates.trigger_metadata = { ...metadata, lastTriggeredAt: nowIso };
          } else if (!watch.deadlineAt) {
            newDeadline = nextDeadline(waitDays, now);
            updates.deadline_at = newDeadline;
          }
          break;
        }
        case "course_chapter_completed": {
          if (isChapterCompleted(metadata.chapterId ?? null, lessonStatuses, structure)) {
            shouldTrigger = true;
            const completionLesson =
              metadata.lessonId && lessonStatuses.get(metadata.lessonId)
                ? { lessonId: metadata.lessonId, occurredAt: lessonStatuses.get(metadata.lessonId)!.occurredAt }
                : selectLessonByStatus(lessonStatuses, (info) => info.status === "completed", "latest");
            triggerOccurredAt = completionLesson?.occurredAt ?? nowIso;
            updates.satisfied_at = nowIso;
          }
          break;
        }
        case "course_started": {
          if (isCourseStarted(lessonStatuses)) {
            shouldTrigger = true;
            const startedLesson = selectLessonByStatus(
              lessonStatuses,
              (info) => info.status === "started" || info.status === "completed",
            );
            triggerOccurredAt = startedLesson?.occurredAt ?? nowIso;
            if (startedLesson) {
              basePayload.lesson = { id: startedLesson.lessonId, title: null };
            }
            updates.satisfied_at = nowIso;
          }
          break;
        }
        case "course_completed": {
          if (isCourseCompleted(lessonStatuses, structure)) {
            shouldTrigger = true;
            const lastCompleted = selectLessonByStatus(lessonStatuses, (info) => info.status === "completed", "latest");
            triggerOccurredAt = lastCompleted?.occurredAt ?? nowIso;
            if (lastCompleted) {
              basePayload.lesson = { id: lastCompleted.lessonId, title: null };
            }
            updates.satisfied_at = nowIso;
          }
          break;
        }
        default:
          break;
      }

      if (updates.satisfied_at === undefined && watch.deadlineAt) {
        updates.deadline_at = watch.deadlineAt;
      }

      await supabase
        .from("course_trigger_watches")
        .update(updates)
        .eq("id", watch.id);

      if (!shouldTrigger) {
        continue;
      }

      triggered += 1;
      const rawPayload = {
        ...basePayload,
        occurred_at: triggerOccurredAt,
        deadline_at: watch.deadlineAt,
        metadata,
      };

      await handleAutomationTrigger({
        supabase,
        event: watch.triggerKind,
        companyId,
        memberWhopId: group.whopMemberId,
        raw: rawPayload,
      });
    }
  }

  return Response.json({ processed, triggered, skipped });
}
