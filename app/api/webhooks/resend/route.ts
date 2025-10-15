import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

// Minimal Resend webhook handler:
// Expect JSON body with fields: type ('delivered'|'bounced'|'complained'),
// metadata: { campaign_id?: number, member_id?: number }
export async function POST(req: NextRequest) {
    const body = await req.json().catch(() => null);
    if (!body) return new Response("Bad Request", { status: 400 });

    const type = body.type as string | undefined;
    const campaignId = body.metadata?.campaign_id as number | undefined;
    const memberId = body.metadata?.member_id as number | undefined;
    if (!type || !campaignId || !memberId) return new Response("Missing fields", { status: 400 });

    const supabase = getAdminSupabaseClient();
    await supabase.from("email_events").insert({
        campaign_id: campaignId,
        member_id: memberId,
        type,
        metadata: body,
    });
    return Response.json({ ok: true });
}


