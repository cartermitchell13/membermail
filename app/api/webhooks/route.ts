import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeWhopEvent } from "@/lib/automations/events";
import { extractAutomationContext, handleAutomationTrigger } from "@/lib/automations/service";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	// Validate the webhook to ensure it's from Whop
	const webhookData = await validateWebhook(request);
	const normalizedEvent = normalizeWhopEvent(webhookData.action);

	if (normalizedEvent) {
		const { companyId, memberWhopId } = extractAutomationContext(webhookData.data ?? {});

		waitUntil(
			handleAutomationTrigger({
				supabase: getAdminSupabaseClient(),
				event: normalizedEvent,
				companyId,
				memberWhopId,
				raw: webhookData.data ?? {},
			}).catch((error) => {
				console.error("Failed to handle automation trigger", {
					error: error instanceof Error ? error.message : error,
					event: normalizedEvent,
				});
			}),
		);
	}

	// Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried.
	return new Response("OK", { status: 200 });
}
