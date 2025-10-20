import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { wrapEmailHtml } from "@/lib/email/templates/wrapper";
import { createSignature, buildOpenPayload, buildClickPayload } from "@/lib/tracking/hmac";

function withTracking(html: string, campaignId: number, memberId: number): string {
    const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const openPayload = buildOpenPayload(String(campaignId), String(memberId));
    const openSig = createSignature(openPayload);
    const openPixelSrc = `${base}/api/track/open?c=${campaignId}&m=${memberId}&sig=${openSig}`;
    const openPixel = `<img src="${openPixelSrc}" width="1" height="1" style="display:none;" />`;
    const trackedHtml = html.replace(/href="([^"]+)"/g, (match, url) => {
        try {
            const encoded = encodeURIComponent(url);
            const clickPayload = buildClickPayload(String(campaignId), String(memberId), encoded);
            const sig = createSignature(clickPayload);
            const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
            return `href="${base}/api/track/click?c=${campaignId}&m=${memberId}&u=${encoded}&sig=${sig}"`;
        } catch {
            return match;
        }
    });
    return trackedHtml + openPixel;
}

// Sends a test email to an arbitrary address provided in the body { to: string }
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: paramId } = await params;
    const body = await req.json().catch(() => ({}));
    const to = body.to as string | undefined;
    if (!to) return new Response("Missing 'to'", { status: 400 });

    const supabase = getAdminSupabaseClient();
    const id = Number(paramId);
    const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single();
    if (!campaign) return new Response("Not found", { status: 404 });

    // Use a temporary synthetic memberId for tracking in tests
    const syntheticMemberId = 0;
    const trackedHtml = withTracking(campaign.html_content, id, syntheticMemberId);
    const wrappedHtml = wrapEmailHtml(trackedHtml);
    await sendEmail({ to, subject: `[Test] ${campaign.subject}`, html: wrappedHtml });
    return Response.json({ ok: true });
}


