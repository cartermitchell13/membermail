import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { renderEmail } from "@/lib/email/render";

export async function GET(req: NextRequest) {
	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("campaigns")
		.select("id, subject, status, send_mode, trigger_event, trigger_delay_value, trigger_delay_unit, automation_sequence_id, automation_status, sent_at, recipient_count, open_count, click_count, created_at")
		.order("created_at", { ascending: false });
	if (error) return new Response("Error", { status: 500 });
	return Response.json({ campaigns: data });
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const supabase = getAdminSupabaseClient();

        // Basic validation
        if (!body || typeof body !== "object") {
            return new Response("Invalid JSON body", { status: 400 });
        }
        const subject: string | undefined = body.subject?.toString();
        const communityId: number | undefined = Number(body.community_id);
        if (!subject || subject.trim().length === 0) {
            return new Response("Subject is required", { status: 400 });
        }
        if (!Number.isFinite(communityId)) {
            return new Response("community_id is required", { status: 400 });
        }

        // Compile content_json to HTML if provided
        let compiledHtml: string | undefined = body.html_content;
        if (!compiledHtml && body.content_json) {
            try {
                compiledHtml = renderEmail(body.content_json);
            } catch {
                return new Response("Invalid content_json", { status: 400 });
            }
        }

        // html_content is required by schema
        if (!compiledHtml || typeof compiledHtml !== "string" || compiledHtml.trim().length === 0) {
            return new Response("html_content is required", { status: 400 });
        }

        const sendMode = body.send_mode === "automation" ? "automation" : "manual";
        const triggerEvent: string | null =
            sendMode === "automation" && typeof body.trigger_event === "string"
                ? body.trigger_event.trim()
                : null;
        if (sendMode === "automation" && (!triggerEvent || triggerEvent.length === 0)) {
            return new Response("Automation campaigns require a trigger_event", { status: 400 });
        }

        const allowedDelayUnits = new Set(["minutes", "hours", "days"]);
        const triggerDelayValue =
            sendMode === "automation"
                ? Math.max(0, Number.parseInt(String(body.trigger_delay_value ?? "0"), 10) || 0)
                : null;
        const triggerDelayUnit =
            sendMode === "automation"
                ? (allowedDelayUnits.has(String(body.trigger_delay_unit)) ? String(body.trigger_delay_unit) : "minutes")
                : null;

        const automationSequenceId =
            sendMode === "automation" && body.automation_sequence_id
                ? Number(body.automation_sequence_id)
                : null;
        if (automationSequenceId !== null && !Number.isFinite(automationSequenceId)) {
            return new Response("automation_sequence_id must be numeric", { status: 400 });
        }

        const automationTriggerMetadata =
            sendMode === "automation" && body.automation_trigger_metadata && typeof body.automation_trigger_metadata === "object"
                ? body.automation_trigger_metadata
                : null;

        const allowedAutomationStatuses = new Set(["draft", "active", "paused", "archived"]);
        const automationStatusRaw =
            sendMode === "automation" && body.automation_status !== undefined
                ? String(body.automation_status)
                : null;
        const automationStatus = allowedAutomationStatuses.has(automationStatusRaw ?? "")
            ? (automationStatusRaw as string)
            : "draft";

        const parseHour = (value: unknown, fallback: number) => {
            const hour = Number.parseInt(String(value ?? fallback), 10);
            if (Number.isNaN(hour)) return fallback;
            return Math.min(23, Math.max(0, hour));
        };
        const quietHoursEnabled = Boolean(body.quiet_hours_enabled);
        const quietHoursStart = parseHour(body.quiet_hours_start, 9);
        const quietHoursEnd = parseHour(body.quiet_hours_end, 20);

        // Build insert payload without content_json for backward compatibility
        const insertPayload: any = {
            subject,
            preview_text: body.preview_text ?? null,
            content_md: body.content_md ?? null,
            html_content: compiledHtml,
            audience: body.audience ?? null,
            status: "draft",
            community_id: communityId,
            send_mode: sendMode,
            trigger_event: triggerEvent,
            trigger_delay_value: triggerDelayValue,
            trigger_delay_unit: triggerDelayUnit,
            automation_sequence_id: automationSequenceId,
            automation_status: automationStatus,
            quiet_hours_enabled: quietHoursEnabled,
            quiet_hours_start: quietHoursStart,
            quiet_hours_end: quietHoursEnd,
            automation_trigger_metadata: automationTriggerMetadata,
        };

        const { data, error } = await supabase
            .from("campaigns")
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            return new Response(`Database error: ${error.message}`, { status: 500 });
        }
        return Response.json({ campaign: data });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return new Response(`Server error: ${message}`, { status: 500 });
    }
}
