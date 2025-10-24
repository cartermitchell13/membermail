"use server";

import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeWhopEvent, getEventLabel } from "@/lib/automations/events";

function sequenceSelectColumns() {
    return `
        id,
        community_id,
        name,
        description,
        trigger_event,
        trigger_label,
        status,
        timezone,
        metadata,
        created_at,
        updated_at,
        automation_steps (
            id,
            position,
            delay_value,
            delay_unit,
            campaign_id,
            campaign:campaign_id (
                id,
                subject,
                status,
                send_mode,
                automation_status
            )
        )
    `;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const supabase = getAdminSupabaseClient();
    const sequenceId = Number(id);
    if (!Number.isFinite(sequenceId)) {
        return new Response("Invalid sequence id", { status: 400 });
    }

    const { data, error } = await supabase
        .from("automation_sequences")
        .select(sequenceSelectColumns())
        .eq("id", sequenceId)
        .single();

    if (error) {
        return new Response(`Sequence not found: ${error.message}`, { status: 404 });
    }

    return Response.json({ sequence: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sequenceId = Number(id);
    if (!Number.isFinite(sequenceId)) {
        return new Response("Invalid sequence id", { status: 400 });
    }

    try {
        const body = await req.json();
        const supabase = getAdminSupabaseClient();

        const updatePayload: Record<string, unknown> = {};

        if (typeof body.name === "string" && body.name.trim().length > 0) {
            updatePayload.name = body.name.trim();
        }
        if (body.description !== undefined) {
            updatePayload.description = body.description ? String(body.description) : null;
        }
        if (body.status && ["draft", "active", "paused", "archived"].includes(body.status)) {
            updatePayload.status = body.status;
        }
        if (body.timezone && typeof body.timezone === "string") {
            updatePayload.timezone = body.timezone;
        }
        if (body.triggerEvent) {
            const normalized = normalizeWhopEvent(String(body.triggerEvent));
            if (!normalized) {
                return new Response("Unsupported trigger event", { status: 400 });
            }
            updatePayload.trigger_event = normalized;
            updatePayload.trigger_label = getEventLabel(normalized);
        }

        if (Object.keys(updatePayload).length === 0) {
            return new Response("No fields to update", { status: 400 });
        }

        const { data, error } = await supabase
            .from("automation_sequences")
            .update({ ...updatePayload, updated_at: new Date().toISOString() })
            .eq("id", sequenceId)
            .select(sequenceSelectColumns())
            .single();

        if (error) {
            return new Response(`Failed to update sequence: ${error.message}`, { status: 500 });
        }

        return Response.json({ sequence: data });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(`Failed to update sequence: ${message}`, { status: 500 });
    }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const sequenceId = Number(id);
    if (!Number.isFinite(sequenceId)) {
        return new Response("Invalid sequence id", { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const { error } = await supabase.from("automation_sequences").delete().eq("id", sequenceId);
    if (error) {
        return new Response(`Failed to delete sequence: ${error.message}`, { status: 500 });
    }
    return new Response(null, { status: 204 });
}
