"use server";

import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sequenceId = Number(id);
    if (!Number.isFinite(sequenceId)) {
        return new Response("Invalid sequence id", { status: 400 });
    }

    try {
        const body = await req.json();
        const campaignId = Number(body?.campaignId);
        if (!Number.isFinite(campaignId)) {
            return new Response("campaignId is required", { status: 400 });
        }

        const delayValue = Math.max(0, Number.parseInt(body?.delayValue ?? 0, 10) || 0);
        const delayUnit = ["minutes", "hours", "days"].includes(body?.delayUnit) ? body.delayUnit : "minutes";
        const metadata = body?.metadata && typeof body.metadata === "object" ? body.metadata : null;

        const supabase = getAdminSupabaseClient();

        const { data: sequence } = await supabase
            .from("automation_sequences")
            .select("id, status")
            .eq("id", sequenceId)
            .single();
        if (!sequence) {
            return new Response("Sequence not found", { status: 404 });
        }

        const { data: existingSteps } = await supabase
            .from("automation_steps")
            .select("position")
            .eq("sequence_id", sequenceId)
            .order("position", { ascending: false })
            .limit(1);
        const nextPosition = (existingSteps?.[0]?.position ?? 0) + 1;

        const { data: step, error } = await supabase
            .from("automation_steps")
            .insert({
                sequence_id: sequenceId,
                campaign_id: campaignId,
                position: nextPosition,
                delay_value: delayValue,
                delay_unit: delayUnit,
                metadata,
            })
            .select()
            .single();

        if (error) {
            return new Response(`Failed to create step: ${error.message}`, { status: 500 });
        }

        // Attach campaign to sequence and mark as automation
        await supabase
            .from("campaigns")
            .update({
                send_mode: "automation",
                automation_sequence_id: sequenceId,
                automation_status: sequence.status ?? "draft",
            })
            .eq("id", campaignId);

        return Response.json({ step });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(`Failed to create step: ${message}`, { status: 500 });
    }
}
