"use server";

import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeWhopEvent, getEventLabel } from "@/lib/automations/events";

async function resolveCommunityId(supabase: ReturnType<typeof getAdminSupabaseClient>, companyId: string) {
    const { data } = await supabase
        .from("communities")
        .select("id")
        .eq("whop_community_id", companyId)
        .single();
    return data?.id ?? null;
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");
    if (!companyId) {
        return new Response("Missing companyId", { status: 400 });
    }

    const supabase = getAdminSupabaseClient();
    const communityId = await resolveCommunityId(supabase, companyId);
    if (!communityId) {
        return Response.json({ sequences: [] });
    }

    const { data, error } = await supabase
        .from("automation_sequences")
        .select(
            `
                id,
                name,
                description,
                trigger_event,
                trigger_label,
                status,
                timezone,
                quiet_hours_enabled,
                quiet_hours_start,
                quiet_hours_end,
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
            `
        )
        .eq("community_id", communityId)
        .order("created_at", { ascending: false });

    if (error) {
        return new Response(`Failed to load sequences: ${error.message}`, { status: 500 });
    }

    return Response.json({ sequences: data ?? [] });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { companyId, name, triggerEvent, description, timezone } = body ?? {};
        if (!companyId || typeof companyId !== "string") {
            return new Response("companyId is required", { status: 400 });
        }
        if (!name || typeof name !== "string") {
            return new Response("name is required", { status: 400 });
        }
        if (!triggerEvent || typeof triggerEvent !== "string") {
            return new Response("triggerEvent is required", { status: 400 });
        }

        const normalizedEvent = normalizeWhopEvent(triggerEvent);
        if (!normalizedEvent) {
            return new Response("Unsupported trigger event", { status: 400 });
        }

        const supabase = getAdminSupabaseClient();
        const communityId = await resolveCommunityId(supabase, companyId);
        if (!communityId) {
            return new Response("Community not found", { status: 404 });
        }

        const insertPayload = {
            community_id: communityId,
            name,
            description: description ?? null,
            trigger_event: normalizedEvent,
            trigger_label: getEventLabel(normalizedEvent),
            status: "draft",
            timezone: typeof timezone === "string" && timezone.length > 0 ? timezone : "UTC",
            quiet_hours_enabled: null,
            quiet_hours_start: null,
            quiet_hours_end: null,
        };

        const { data, error } = await supabase
            .from("automation_sequences")
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            return new Response(`Failed to create sequence: ${error.message}`, { status: 500 });
        }

        return Response.json({ sequence: data }, { status: 201 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return new Response(`Failed to create sequence: ${message}`, { status: 500 });
    }
}
