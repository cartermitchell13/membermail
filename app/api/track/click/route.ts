import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildClickPayload, verifySignature } from "@/lib/tracking/hmac";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const campaignId = url.searchParams.get("c");
	const memberId = url.searchParams.get("m");
	const u = url.searchParams.get("u");
	const sig = url.searchParams.get("sig");

	if (!campaignId || !memberId || !u || !sig) {
		return new Response("Bad Request", { status: 400 });
	}

	const payload = buildClickPayload(campaignId, memberId, u);
	const isValid = verifySignature(payload, sig);
	if (isValid) {
		const supabase = getAdminSupabaseClient();
		await supabase.from("email_events").insert({
			campaign_id: Number(campaignId),
			member_id: Number(memberId),
			type: "clicked",
		});
		await supabase.rpc("increment_campaign_click_count", { cid: Number(campaignId) }).catch(() => undefined);
	}

	try {
		return Response.redirect(decodeURIComponent(u), 302);
	} catch {
		return new Response("Invalid URL", { status: 400 });
	}
}


