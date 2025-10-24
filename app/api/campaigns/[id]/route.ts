import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { renderEmail } from "@/lib/email/render";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: idParam } = await params;
	const id = Number(idParam);
	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("campaigns")
		.select("*")
		.eq("id", id)
		.single();
	if (error) return new Response("Not found", { status: 404 });
	return Response.json({ campaign: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: idParam } = await params;
	const id = Number(idParam);
	const supabase = getAdminSupabaseClient();

    const { data: existing, error: existingError } = await supabase
        .from("campaigns")
        .select(
            "send_mode, trigger_event, trigger_delay_value, trigger_delay_unit, automation_sequence_id, automation_status, quiet_hours_enabled, quiet_hours_start, quiet_hours_end"
        )
        .eq("id", id)
        .single();
    if (existingError) return new Response("Not found", { status: 404 });

	const body = await req.json();
    // Compile content_json to HTML if provided
    let compiledHtml: string | undefined = body.html_content;
    if (body.content_json) {
        try {
            compiledHtml = renderEmail(body.content_json);
        } catch {
            return new Response("Invalid content_json", { status: 400 });
        }
    }

    const updatePayload: Record<string, any> = {};
    if (body.subject !== undefined) updatePayload.subject = body.subject;
    if (body.preview_text !== undefined) updatePayload.preview_text = body.preview_text;
    if (body.content_md !== undefined) updatePayload.content_md = body.content_md;
    if (compiledHtml !== undefined) updatePayload.html_content = compiledHtml;
    if (body.audience !== undefined) updatePayload.audience = body.audience;
    if (body.status !== undefined) updatePayload.status = body.status;

    const existingSendMode: "manual" | "automation" = existing?.send_mode === "automation" ? "automation" : "manual";
    const requestedSendMode =
        body.send_mode !== undefined ? (body.send_mode === "automation" ? "automation" : "manual") : existingSendMode;

    const allowedDelayUnits = new Set(["minutes", "hours", "days"]);
    const allowedAutomationStatuses = new Set(["draft", "active", "paused", "archived"]);

    if (body.send_mode !== undefined) {
        updatePayload.send_mode = requestedSendMode;
    }

    const triggerEvent =
        requestedSendMode === "automation"
            ? body.trigger_event !== undefined
                ? typeof body.trigger_event === "string"
                    ? body.trigger_event.trim()
                    : null
                : existing?.trigger_event ?? null
            : null;

    if (requestedSendMode === "automation" && (!triggerEvent || triggerEvent.length === 0)) {
        return new Response("Automation campaigns require a trigger_event", { status: 400 });
    }

    const triggerDelayValue =
        requestedSendMode === "automation"
            ? body.trigger_delay_value !== undefined
                ? Math.max(0, Number.parseInt(String(body.trigger_delay_value), 10) || 0)
                : existing?.trigger_delay_value ?? 0
            : null;
    const triggerDelayUnit =
        requestedSendMode === "automation"
            ? body.trigger_delay_unit !== undefined
                ? allowedDelayUnits.has(String(body.trigger_delay_unit))
                    ? String(body.trigger_delay_unit)
                    : "minutes"
                : existing?.trigger_delay_unit ?? "minutes"
            : null;

    const automationSequenceId =
        requestedSendMode === "automation"
            ? body.automation_sequence_id !== undefined
                ? body.automation_sequence_id === null
                    ? null
                    : Number(body.automation_sequence_id)
                : existing?.automation_sequence_id ?? null
            : null;
    if (automationSequenceId !== null && automationSequenceId !== undefined && !Number.isFinite(automationSequenceId)) {
        return new Response("automation_sequence_id must be numeric", { status: 400 });
    }

    const automationStatus =
        requestedSendMode === "automation"
            ? body.automation_status !== undefined
                ? allowedAutomationStatuses.has(body.automation_status)
                    ? body.automation_status
                    : "draft"
                : existing?.automation_status ?? "draft"
            : null;

    const parseHour = (value: unknown, fallback: number) => {
        const hour = Number.parseInt(String(value ?? fallback), 10);
        if (Number.isNaN(hour)) return fallback;
        return Math.min(23, Math.max(0, hour));
    };

    if (body.quiet_hours_enabled !== undefined) {
        updatePayload.quiet_hours_enabled = Boolean(body.quiet_hours_enabled);
    }
    if (body.quiet_hours_start !== undefined) {
        updatePayload.quiet_hours_start = parseHour(body.quiet_hours_start, existing?.quiet_hours_start ?? 9);
    }
    if (body.quiet_hours_end !== undefined) {
        updatePayload.quiet_hours_end = parseHour(body.quiet_hours_end, existing?.quiet_hours_end ?? 20);
    }

    updatePayload.trigger_event = triggerEvent;
    updatePayload.trigger_delay_value = triggerDelayValue;
    updatePayload.trigger_delay_unit = triggerDelayUnit;
    updatePayload.automation_sequence_id = automationSequenceId;
    updatePayload.automation_status = automationStatus;

    const { data, error } = await supabase
        .from("campaigns")
        .update(updatePayload)
		.eq("id", id)
		.select()
		.single();
	if (error) return new Response("Error", { status: 500 });
	return Response.json({ campaign: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: idParam } = await params;
	const id = Number(idParam);
	const supabase = getAdminSupabaseClient();
	const { error } = await supabase.from("campaigns").delete().eq("id", id);
	if (error) return new Response("Error", { status: 500 });
	return new Response(null, { status: 204 });
}
