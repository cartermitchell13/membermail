import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

function parseId(value: string): number | null {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { id, stepId } = await params;
  const sequenceId = parseId(id);
  const automationStepId = parseId(stepId);
  if (sequenceId === null || automationStepId === null) {
    return new Response("Invalid sequence or step id", { status: 400 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON body", { status: 400 });
  }

  const supabase = getAdminSupabaseClient();
  const { data: existingStep, error: fetchError } = await supabase
    .from("automation_steps")
    .select("id, sequence_id, position, delay_value, delay_unit")
    .eq("id", automationStepId)
    .eq("sequence_id", sequenceId)
    .single();

  if (fetchError || !existingStep) {
    return new Response("Step not found", { status: 404 });
  }

  const updates: Record<string, any> = {};
  if (body?.delayValue !== undefined) {
    const parsedDelay = Number.parseInt(String(body.delayValue), 10);
    if (Number.isNaN(parsedDelay) || parsedDelay < 0) {
      return new Response("delayValue must be a non-negative integer", { status: 400 });
    }
    updates.delay_value = parsedDelay;
  }

  if (body?.delayUnit !== undefined) {
    const allowedUnits = new Set(["minutes", "hours", "days"]);
    if (!allowedUnits.has(String(body.delayUnit))) {
      return new Response("delayUnit must be minutes, hours, or days", { status: 400 });
    }
    updates.delay_unit = body.delayUnit;
  }

  const targetPosition = body?.position !== undefined ? Number.parseInt(String(body.position), 10) : null;
  if (targetPosition !== null && (Number.isNaN(targetPosition) || targetPosition < 1)) {
    return new Response("position must be a positive integer", { status: 400 });
  }

  if (targetPosition === null && Object.keys(updates).length === 0) {
    return Response.json({ ok: true });
  }

  const { data: stepsData, error: stepsError } = await supabase
    .from("automation_steps")
    .select("id, position")
    .eq("sequence_id", sequenceId)
    .order("position", { ascending: true });

  if (stepsError || !stepsData) {
    return new Response("Failed to load steps", { status: 500 });
  }

  const reordered = stepsData.slice();
  if (targetPosition !== null && targetPosition !== existingStep.position) {
    const currentIndex = reordered.findIndex((step) => step.id === automationStepId);
    if (currentIndex === -1) {
      return new Response("Step not found in ordering", { status: 404 });
    }
    const [removed] = reordered.splice(currentIndex, 1);
    const clampedIndex = Math.min(reordered.length, Math.max(0, targetPosition - 1));
    reordered.splice(clampedIndex, 0, removed);
  }

  for (let index = 0; index < reordered.length; index += 1) {
    const step = reordered[index];
    const position = index + 1;
    const payload = step.id === automationStepId ? { ...updates, position } : { position };
    const { error: updateError } = await supabase
      .from("automation_steps")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", step.id);
    if (updateError) {
      return new Response(`Failed to update step order: ${updateError.message}`, { status: 500 });
    }
  }

  return Response.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; stepId: string }> }) {
  const { id, stepId } = await params;
  const sequenceId = parseId(id);
  const automationStepId = parseId(stepId);
  if (sequenceId === null || automationStepId === null) {
    return new Response("Invalid sequence or step id", { status: 400 });
  }

  const supabase = getAdminSupabaseClient();
  const { data: existingStep, error: stepError } = await supabase
    .from("automation_steps")
    .select("id, position, campaign_id")
    .eq("id", automationStepId)
    .eq("sequence_id", sequenceId)
    .single();

  if (stepError || !existingStep) {
    return new Response("Step not found", { status: 404 });
  }

  if (existingStep.campaign_id) {
    const { error: jobError } = await supabase
      .from("automation_jobs")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("campaign_id", existingStep.campaign_id)
      .in("status", ["pending", "processing"]);
    if (jobError) {
      return new Response(`Failed to cancel pending jobs: ${jobError.message}`, { status: 500 });
    }
  }

  const { error: deleteStepError } = await supabase.from("automation_steps").delete().eq("id", automationStepId);
  if (deleteStepError) {
    return new Response(`Failed to delete step: ${deleteStepError.message}`, { status: 500 });
  }

  if (existingStep.campaign_id) {
    const { error: deleteCampaignError } = await supabase.from("campaigns").delete().eq("id", existingStep.campaign_id);
    if (deleteCampaignError) {
      return new Response(`Failed to delete campaign: ${deleteCampaignError.message}`, { status: 500 });
    }
  }

  const { data: remainingSteps } = await supabase
    .from("automation_steps")
    .select("id")
    .eq("sequence_id", sequenceId)
    .order("position", { ascending: true });

  if (remainingSteps) {
    for (let index = 0; index < remainingSteps.length; index += 1) {
      const { error: reindexError } = await supabase
        .from("automation_steps")
        .update({ position: index + 1, updated_at: new Date().toISOString() })
        .eq("id", remainingSteps[index].id);
      if (reindexError) {
        return new Response(`Failed to reindex steps: ${reindexError.message}`, { status: 500 });
      }
    }
  }

  return new Response(null, { status: 204 });
}
