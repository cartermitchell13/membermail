import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/resend";
import { buildTrackedEmailHtml } from "@/lib/email/build-tracked-email";
import {
  fetchSenderIdentityByUserId,
  formatSenderAddress,
  isSenderIdentityComplete,
} from "@/lib/email/sender-identity";
import { getSubscriptionAccess } from "@/lib/subscriptions/access";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: paramId } = await params;
	const supabase = getAdminSupabaseClient();
	const id = Number(paramId);
	const { data: campaign } = await supabase.from("campaigns").select("*").eq("id", id).single();
	if (!campaign) return new Response("Not found", { status: 404 });
    if (campaign.send_mode === "automation") {
        return new Response("Automation campaigns are delivered automatically", { status: 400 });
    }

    const { data: community } = await supabase
        .from("communities")
        .select("name, footer_text, reply_to_email, user_id, whop_community_id")
        .eq("id", campaign.community_id)
        .single();

    if (!community) {
        return new Response("Community not found", { status: 404 });
    }

    const access = await getSubscriptionAccess({ companyId: community.whop_community_id });
    if (!access.canSend) {
        return Response.json(
            {
                success: false,
                error: "Sending campaigns requires a Pro or Enterprise subscription",
                tier: access.tier,
            },
            { status: 402 },
        );
    }

    if (community.whop_community_id && !access.isCompanyMember) {
        return Response.json(
            {
                success: false,
                error: "You do not have permission to send for this company",
            },
            { status: 403 },
        );
    }

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

    const identity = await fetchSenderIdentityByUserId(supabase, community.user_id);
    if (!isSenderIdentityComplete(identity)) {
        return new Response("Sender identity not configured", { status: 400 });
    }

    const fromAddress = formatSenderAddress({
        displayName: identity.displayName,
        mailUsername: identity.mailUsername,
    });
    const replyToAddress = community.reply_to_email ?? undefined;
    const footerBrand = community.name || "";
    const footerText = community.footer_text ?? null;

    let sent = 0;
    for (const m of members) {
        const html = buildTrackedEmailHtml({
            campaignId: id,
            memberId: m.id,
            html: campaign.html_content,
            footerBrand,
            footerText,
        });
		await sendEmail({
            to: m.email,
            subject: campaign.subject,
            html,
            from: fromAddress,
            replyTo: replyToAddress,
        });
		sent += 1;
		await supabase.from("email_events").insert({ campaign_id: id, member_id: m.id, type: "sent" });
	}

	await supabase
		.from("campaigns")
		.update({ status: "sent", sent_at: new Date().toISOString(), recipient_count: sent })
		.eq("id", id);

	return Response.json({ ok: true, sent });
}


