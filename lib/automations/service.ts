import type { SupabaseClient } from "@supabase/supabase-js";
import type { AutomationTriggerEvent } from "./events";
import { isCourseAutomationEvent } from "./events";
import {
  courseMetadataMatchesContext,
  extractCourseTriggerContext,
  recordCourseProgress,
  type CourseTriggerContext,
} from "./course/ingest";
import type { CourseStepMetadata } from "./course/types";
import { ensureCourseWatchesForMember } from "./course/watches";

type DatabaseClient = SupabaseClient<any, "public", any>;

type TriggerPayload = {
  supabase: DatabaseClient;
  event: AutomationTriggerEvent;
  companyId: string | null;
  memberWhopId: string | null;
  raw: Record<string, any>;
};

function delayToSeconds(value: number | null | undefined, unit: string | null | undefined): number {
  if (!value || value <= 0) return 0;
  switch (unit) {
    case "hours":
      return value * 60 * 60;
    case "days":
      return value * 24 * 60 * 60;
    case "minutes":
    default:
      return value * 60;
  }
}

async function ensureEnrollment(
  supabase: DatabaseClient,
  sequenceId: number,
  memberId: number,
  firstStepId: number,
) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("automation_enrollments")
    .insert({
      sequence_id: sequenceId,
      member_id: memberId,
      status: "active",
      current_step_id: firstStepId,
      started_at: now,
      updated_at: now,
    } as any)
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: existing } = await supabase
        .from("automation_enrollments")
        .update({ status: "active", current_step_id: firstStepId, updated_at: now })
        .eq("sequence_id", sequenceId)
        .eq("member_id", memberId)
        .select("*")
        .single();
      return existing ?? null;
    }
    throw error;
  }

  return data;
}

async function scheduleJobIfNeeded(
  supabase: DatabaseClient,
  params: {
    sequenceId: number | null;
    stepId: number | null;
    campaignId: number;
    memberId: number;
    scheduledAt: Date;
    payload: Record<string, any>;
  },
) {
  const { sequenceId, stepId, campaignId, memberId, scheduledAt, payload } = params;

  const { data: existingJob } = await supabase
    .from("automation_jobs")
    .select("id, status")
    .eq("campaign_id", campaignId)
    .eq("member_id", memberId)
    .in("status", ["pending", "processing"])
    .limit(1)
    .single();

  if (existingJob) {
    // Avoid duplicating a pending job for the same member/campaign.
    return existingJob;
  }

  const { data: job, error } = await supabase
    .from("automation_jobs")
    .insert({
      sequence_id: sequenceId,
      step_id: stepId,
      campaign_id: campaignId,
      member_id: memberId,
      scheduled_at: scheduledAt.toISOString(),
      status: "pending",
      payload,
    } as any)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return job;
}

export async function handleAutomationTrigger({
  supabase,
  event,
  companyId,
  memberWhopId,
  raw,
}: TriggerPayload) {
  if (!companyId || !memberWhopId) {
    return { status: "ignored", reason: "Missing companyId or memberId in webhook payload" };
  }

  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("whop_community_id", companyId)
    .single();

  if (!community) {
    return { status: "ignored", reason: "Community not found", companyId };
  }

  const { data: member } = await supabase
    .from("members")
    .select("id")
    .eq("community_id", community.id)
    .eq("whop_member_id", memberWhopId)
    .single();

  if (!member) {
    return { status: "ignored", reason: "Member not found", companyId, memberWhopId };
  }

  const membershipActivationEvents: AutomationTriggerEvent[] = [
    "membership_went_valid",
    "app_membership_went_valid",
  ];
  if (membershipActivationEvents.includes(event)) {
    await ensureCourseWatchesForMember({
      supabase,
      communityId: community.id,
      memberId: member.id,
      memberWhopId,
    });
  }

  let courseContext: CourseTriggerContext | null = null;
  if (isCourseAutomationEvent(event)) {
    courseContext = await extractCourseTriggerContext(event, raw);
    if (courseContext && event === "course_lesson_completed") {
      await recordCourseProgress(supabase, member.id, courseContext);
    }
    if (!courseContext) {
      return { status: "ignored", reason: "Missing course context", companyId, memberId: member.id, event };
    }
  }

  const now = new Date();
  const payloadSnapshot = {
    event,
    triggered_at: now.toISOString(),
    raw,
    course_context: courseContext,
  };

  // Schedule active sequences
  const { data: sequences } = await supabase
    .from("automation_sequences")
    .select("id, status")
    .eq("community_id", community.id)
    .eq("trigger_event", event)
    .eq("status", "active");

  if (sequences && sequences.length > 0) {
    for (const sequence of sequences) {
      const { data: steps } = await supabase
        .from("automation_steps")
        .select("id, position, delay_value, delay_unit, campaign_id, metadata")
        .eq("sequence_id", sequence.id)
        .order("position", { ascending: true });

      if (!steps || steps.length === 0) continue;

      if (isCourseAutomationEvent(event)) {
        const metadata = (steps[0]?.metadata ?? null) as CourseStepMetadata | null;
        if (!courseMetadataMatchesContext(metadata, courseContext, event)) {
          continue;
        }
      }

      const firstStep = steps[0];
      await ensureEnrollment(supabase, sequence.id, member.id, firstStep.id);

      let cumulativeDelaySeconds = 0;
      for (const step of steps) {
        const stepDelay = delayToSeconds(step.delay_value ?? 0, step.delay_unit);
        cumulativeDelaySeconds += stepDelay;
        const scheduledAt = new Date(now.getTime() + cumulativeDelaySeconds * 1000);
        await scheduleJobIfNeeded(supabase, {
          sequenceId: sequence.id,
          stepId: step.id,
          campaignId: step.campaign_id,
          memberId: member.id,
          scheduledAt,
          payload: payloadSnapshot,
        });
      }
    }
  }

  // Standalone automation campaigns (no sequence)
  const { data: automationCampaigns } = await supabase
    .from("campaigns")
    .select("id, trigger_delay_value, trigger_delay_unit, automation_status, automation_trigger_metadata")
    .eq("community_id", community.id)
    .eq("send_mode", "automation")
    .is("automation_sequence_id", null)
    .eq("automation_status", "active")
    .eq("trigger_event", event);

  if (automationCampaigns && automationCampaigns.length > 0) {
    for (const campaign of automationCampaigns) {
      if (
        isCourseAutomationEvent(event) &&
        !courseMetadataMatchesContext(
          (campaign.automation_trigger_metadata ?? null) as CourseStepMetadata | null,
          courseContext,
          event,
        )
      ) {
        continue;
      }

      const delaySeconds = delayToSeconds(campaign.trigger_delay_value ?? 0, campaign.trigger_delay_unit);
      const scheduledAt = new Date(now.getTime() + delaySeconds * 1000);
      await scheduleJobIfNeeded(supabase, {
        sequenceId: null,
        stepId: null,
        campaignId: campaign.id,
        memberId: member.id,
        scheduledAt,
        payload: payloadSnapshot,
      });
    }
  }

  return { status: "scheduled", companyId, memberId: member.id };
}

export function extractAutomationContext(data: Record<string, any>) {
  // Support multiple payload shapes (snake_case and camelCase, nested objects)
  const companyId =
    data?.company_id ??
    data?.companyId ??
    data?.company?.id ??
    data?.community_id ??
    data?.communityId ??
    data?.experience?.company_id ??
    data?.experience?.companyId ??
    data?.experience?.company?.id ??
    data?.course?.company_id ??
    data?.course?.companyId ??
    data?.course?.company?.id ??
    data?.course?.experience?.company_id ??
    data?.course?.experience?.companyId ??
    data?.course?.experience?.company?.id ??
    data?.membership?.company_id ??
    data?.membership?.companyId ??
    null;

  const memberWhopId =
    data?.user_id ??
    data?.userId ??
    data?.member_id ??
    data?.memberId ??
    data?.membership?.member_id ??
    data?.membership?.memberId ??
    data?.pass?.member_id ??
    data?.pass?.memberId ??
    data?.user?.id ??
    null;

  return { companyId, memberWhopId };
}
