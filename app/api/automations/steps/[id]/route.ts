"use server";

import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const stepId = Number(id);
    if (!Number.isFinite(stepId)) {
        return new Response("Invalid step id", { status: 400 });
    }

    try {
        const body = await req.json();
        const updatePayload: Record<string, unknown> = {};
        if (body.position !== undefined) {
            const position = Number.parseInt(body.position, 10);
            if (!Number.isNaN(position) && position > 0) {
                updatePayload.position = position;
            }
        }
        if (body.delayValue !== undefined) {
            const value = Math.max(0, Number.parseInt(body.delayValue, 10) || 0);
            updatePayload.delay_value = value;
        }
        if (body.delayUnit !== undefined) {
            const unit = String(body.delayUnit);
            if (["minutes", "hours", "days"].includes(unit)) {
                updatePayload.delay_unit = unit;
            }
        }

        if (Object.keys(updatePayload).length === 0) {
            return new Response("No fields to update", { status: 400 });
        }

        const supabase = getAdminSupabaseClient();
        const { data, error } = await supabase
            .from("automation_steps")
            .update({ ...updatePayload, updated_at: new Date().toISOString() })
            .eq("id", stepId)
            .select()
            .single();

        if (error) {
            return new Response(`Failed to update step: ${error.message}`, { status: 500 });
        }

        return Response.json({ step: data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(`Failed to update step: ${message}`, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const stepId = Number(id);
    if (!Number.isFinite(stepId)) {
        return new Response("Invalid step id", { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { error } = await supabase.from("automation_steps").delete().eq("id", stepId);
    if (error) {
        return new Response(`Failed to delete step: ${error.message}`, { status: 500 });
    }
    return new Response(null, { status: 204 });
}
