"use server";

import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildTrackedEmailHtml } from "@/lib/email/build-tracked-email";
import { sendEmail } from "@/lib/email/resend";
import {
  fetchSenderIdentityByUserId,
  formatSenderAddress,
  isSenderIdentityComplete,
} from "@/lib/email/sender-identity";

type ProcessResult = {
  processed: number;
  completed: number;
  failed: number;
  skipped: number;
};

const MAX_BATCH_SIZE = 50;
const MAX_ATTEMPTS = 5;

function requireCronSecret(req: NextRequest) {
  const configured = process.env.AUTOMATION_CRON_SECRET;
  if (!configured) {
    return true;
  }
  const provided = req.headers.get("x-cron-secret");
  return provided === configured;
}

export async function POST(req: NextRequest) {
  if (!requireCronSecret(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = getAdminSupabaseClient();
  const nowIso = new Date().toISOString();

  const { data: jobs, error } = await supabase
    .from("automation_jobs")
    .select("id, sequence_id, step_id, campaign_id, member_id, scheduled_at, attempts, status, payload")
    .eq("status", "pending")
    .lte("scheduled_at", nowIso)
    .order("scheduled_at", { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (error) {
    return new Response(`Failed to load jobs: ${error.message}`, { status: 500 });
  }

  const result: ProcessResult = { processed: 0, completed: 0, failed: 0, skipped: 0 };

  if (!jobs || jobs.length === 0) {
    return Response.json({ ok: true, ...result });
  }

  for (const job of jobs) {
    result.processed += 1;

    const attemptCount = (job.attempts ?? 0) + 1;
    const claimUpdate = await supabase
      .from("automation_jobs")
      .update({ status: "processing", attempts: attemptCount, updated_at: nowIso })
      .eq("id", job.id)
      .eq("status", "pending")
      .select("id")
      .single();

    if (claimUpdate.error || !claimUpdate.data) {
      result.skipped += 1;
      continue;
    }

    try {
      const { data: campaign } = await supabase
        .from("campaigns")
        .select("id, subject, html_content, community_id, send_mode, automation_status, quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
        .eq("id", job.campaign_id)
        .single();

      if (!campaign) {
        throw new Error("Campaign not found");
      }

      if (campaign.send_mode === "automation" && campaign.automation_status === "paused") {
        await supabase
          .from("automation_jobs")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        result.skipped += 1;
        continue;
      }

      const sequenceSettings = {
        timezone: null as string | null,
        quietHoursEnabled: null as boolean | null,
        quietHoursStart: null as number | null,
        quietHoursEnd: null as number | null,
        status: null as string | null,
      };

      if (job.sequence_id) {
        const { data: sequence } = await supabase
          .from("automation_sequences")
          .select("timezone, status, quiet_hours_enabled, quiet_hours_start, quiet_hours_end")
          .eq("id", job.sequence_id)
          .single();
        if (sequence) {
          sequenceSettings.timezone = sequence.timezone ?? null;
          sequenceSettings.status = sequence.status ?? null;
          sequenceSettings.quietHoursEnabled = sequence.quiet_hours_enabled ?? null;
          sequenceSettings.quietHoursStart = sequence.quiet_hours_start ?? null;
          sequenceSettings.quietHoursEnd = sequence.quiet_hours_end ?? null;
        }
      }

      if (job.sequence_id && sequenceSettings.status === "paused") {
        await supabase
          .from("automation_jobs")
          .update({ status: "cancelled", updated_at: new Date().toISOString() })
          .eq("id", job.id);
        result.skipped += 1;
        continue;
      }

      const sequenceQuiet = sequenceSettings.quietHoursEnabled;
      const quietConfig = {
        enabled:
          sequenceQuiet === null
            ? Boolean(campaign.quiet_hours_enabled)
            : Boolean(sequenceQuiet),
        start:
          sequenceQuiet === true && typeof sequenceSettings.quietHoursStart === "number"
            ? sequenceSettings.quietHoursStart
            : typeof campaign.quiet_hours_start === "number"
              ? campaign.quiet_hours_start
              : 9,
        end:
          sequenceQuiet === true && typeof sequenceSettings.quietHoursEnd === "number"
            ? sequenceSettings.quietHoursEnd
            : typeof campaign.quiet_hours_end === "number"
              ? campaign.quiet_hours_end
              : 20,
      };

      const tz = sequenceSettings.timezone ?? "UTC";

      if (quietConfig.enabled) {
        const formatter = new Intl.DateTimeFormat("en-US", {
          timeZone: tz,
          hour: "numeric",
          minute: "numeric",
          hour12: false,
        });
        const parts = formatter.formatToParts(new Date(job.scheduled_at));
        const hourPart = parts.find((part) => part.type === "hour");
        const minutePart = parts.find((part) => part.type === "minute");
        const localHour = Number(hourPart?.value ?? "0");
        const localMinute = Number(minutePart?.value ?? "0");
        const quietStart = quietConfig.start;
        const quietEnd = quietConfig.end;

        let minutesToAdd = 0;
        if (localHour < quietStart) {
          minutesToAdd = (quietStart - localHour) * 60 - localMinute;
        } else if (localHour >= quietEnd) {
          minutesToAdd = ((24 - localHour) + quietStart) * 60 - localMinute;
        }

        if (minutesToAdd > 0) {
          const nextRun = new Date(new Date(job.scheduled_at).getTime() + minutesToAdd * 60 * 1000);
          await supabase
            .from("automation_jobs")
            .update({
              status: "pending",
              scheduled_at: nextRun.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", job.id);
          result.skipped += 1;
          continue;
        }
      }

      const { data: member } = await supabase
        .from("members")
        .select("id, email, name")
        .eq("id", job.member_id)
        .single();

      if (!member || !member.email) {
        throw new Error("Member not found or missing email");
      }

      const { data: community } = await supabase
        .from("communities")
        .select("name, footer_text, reply_to_email, user_id")
        .eq("id", campaign.community_id)
        .single();

      if (!community) {
        throw new Error("Community not found");
      }

      const identity = await fetchSenderIdentityByUserId(supabase, community.user_id);
      if (!isSenderIdentityComplete(identity)) {
        const retryAt = new Date(Date.now() + 10 * 60 * 1000);
        await supabase
          .from("automation_jobs")
          .update({
            status: "pending",
            scheduled_at: retryAt.toISOString(),
            last_error: "Sender identity not configured",
            updated_at: new Date().toISOString(),
          })
          .eq("id", job.id);
        result.skipped += 1;
        continue;
      }

      const fromAddress = formatSenderAddress({
        displayName: identity.displayName,
        mailUsername: identity.mailUsername,
      });
      const replyToAddress = community.reply_to_email ?? undefined;
      const footerBrand = community.name ?? "";
      const footerText = community.footer_text ?? null;

      const html = buildTrackedEmailHtml({
        campaignId: campaign.id,
        memberId: member.id,
        html: campaign.html_content,
        footerBrand,
        footerText,
      });

      await sendEmail({
        to: member.email,
        subject: campaign.subject,
        html,
        from: fromAddress,
        replyTo: replyToAddress,
      });

      await supabase.from("email_events").insert({
        campaign_id: campaign.id,
        member_id: member.id,
        type: "sent",
        metadata: job.payload ?? null,
      });

      if (job.sequence_id && job.step_id) {
        const { data: step } = await supabase
          .from("automation_steps")
          .select("position, sequence_id")
          .eq("id", job.step_id)
          .single();

        if (step) {
          const { data: nextStep } = await supabase
            .from("automation_steps")
            .select("id")
            .eq("sequence_id", step.sequence_id)
            .gt("position", step.position)
            .order("position", { ascending: true })
            .limit(1);

          const nextStepId = nextStep && nextStep.length > 0 ? nextStep[0].id : null;
          await supabase
            .from("automation_enrollments")
            .update({
              current_step_id: nextStepId,
              status: nextStepId ? "active" : "completed",
              completed_at: nextStepId ? null : new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("sequence_id", step.sequence_id)
            .eq("member_id", member.id);
        }
      }

      await supabase
        .from("automation_jobs")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", job.id);

      result.completed += 1;
    } catch (err) {
      const shouldRetry = attemptCount < MAX_ATTEMPTS;
      const nextRun = new Date(Date.now() + 5 * 60 * 1000);
      await supabase
        .from("automation_jobs")
        .update({
          status: shouldRetry ? "pending" : "failed",
          scheduled_at: shouldRetry ? nextRun.toISOString() : job.scheduled_at,
          last_error: err instanceof Error ? err.message : String(err),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job.id);

      console.error("Automation job failed", {
        jobId: job.id,
        error: err instanceof Error ? err.message : err,
      });

      if (shouldRetry) {
        result.skipped += 1;
      } else {
        result.failed += 1;
      }
    }
  }

  return Response.json({ ok: true, ...result });
}

