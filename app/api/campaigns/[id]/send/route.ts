import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { wrapEmailHtml } from "@/lib/email/templates/wrapper";
import { createSignature, buildOpenPayload, buildClickPayload, buildUnsubscribePayload } from "@/lib/tracking/hmac";
import { renderEmailFooterHtml } from "@/lib/email/footer";

function withTracking(html: string, campaignId: number, memberId: number, footerBrand: string, footerText: string | null): string {
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

    // Footer with unsubscribe link
    const unsubPayload = buildUnsubscribePayload(String(campaignId), String(memberId));
    const unsubSig = createSignature(unsubPayload);
    const unsubscribeUrl = `${base}/api/unsubscribe?c=${campaignId}&m=${memberId}&sig=${unsubSig}`;
    const safeBrand = footerBrand || "MemberMail";
    const custom = footerText ? `<div style=\"margin-top:8px\">${footerText}</div>` : "";
    const footerHtml = renderEmailFooterHtml(safeBrand, unsubscribeUrl, footerText);

    return trackedHtml + openPixel + footerHtml;
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: paramId } = await params;
	const supabase = getAdminSupabaseClient();
	const id = Number(paramId);
	const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single();
	if (!campaign) return new Response("Not found", { status: 404 });

	// Fetch recipients: all members of the campaign's community who are active
    let membersQuery = supabase
        .from("members")
        .select("id, email, name, membership_tier")
        .eq("community_id", campaign.community_id)
        .eq("status", "active");

    // Audience filter by tiers if provided
    const audience = campaign.audience as { tiers?: string[]; Tiers?: string[] } | null;
    const tiers: string[] | undefined = audience?.tiers ?? audience?.Tiers;
    if (Array.isArray(tiers) && tiers.length > 0) {
        membersQuery = membersQuery.in("membership_tier", tiers);
    }

    const { data: members } = await membersQuery;

	if (!members || members.length === 0) {
		return new Response("No recipients", { status: 400 });
	}

    // load community branding/footer
    const { data: community } = await supabase
        .from("communities")
        .select("name, footer_text")
        .eq("id", campaign.community_id)
        .single();
    const footerBrand = community?.name || "";
    const footerText = community?.footer_text ?? null;

    let sent = 0;
    for (const m of members) {
        const trackedHtml = withTracking(campaign.html_content, id, m.id, footerBrand, footerText);
        const wrappedHtml = wrapEmailHtml(trackedHtml);
		await sendEmail({ to: m.email, subject: campaign.subject, html: wrappedHtml });
		sent += 1;
		await supabase.from("email_events").insert({ campaign_id: id, member_id: m.id, type: "sent" });
	}

	await supabase
		.from("campaigns")
		.update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: sent })
		.eq("id", id);

	return Response.json({ ok: true, sent });
}


