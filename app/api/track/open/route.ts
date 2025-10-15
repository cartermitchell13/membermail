import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { buildOpenPayload, verifySignature } from "@/lib/tracking/hmac";

const ONE_BY_ONE_GIF_BASE64 = "R0lGODlhAQABAPAAAP///wAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const campaignId = url.searchParams.get("c");
	const memberId = url.searchParams.get("m");
	const sig = url.searchParams.get("sig");

	if (!campaignId || !memberId || !sig) {
		return pixelResponse();
	}

	const payload = buildOpenPayload(campaignId, memberId);
	const isValid = verifySignature(payload, sig);
	if (isValid) {
		const supabase = getAdminSupabaseClient();
		await supabase.from("email_events").insert({
			campaign_id: Number(campaignId),
			member_id: Number(memberId),
			type: "opened",
		});
		await supabase.rpc("increment_campaign_open_count", { cid: Number(campaignId) }).catch(() => undefined);
	}

	return pixelResponse();
}

function pixelResponse(): Response {
	return new Response(Buffer.from(ONE_BY_ONE_GIF_BASE64, "base64"), {
		status: 200,
		headers: {
			"Content-Type": "image/gif",
			"Cache-Control": "no-store, must-revalidate",
			"Pragma": "no-cache",
			"Expires": "0",
		},
	});
}


