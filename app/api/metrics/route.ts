import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const whopCommunityId = url.searchParams.get("communityId");

	if (!whopCommunityId) {
		return Response.json({ error: "Missing communityId" }, { status: 400 });
	}

	const supabase = getAdminSupabaseClient();

	try {
		// First, find the community by whop_community_id
		const { data: community, error: communityError } = await supabase
			.from("communities")
			.select("id")
			.eq("whop_community_id", whopCommunityId)
			.single();

		if (communityError || !community) {
			console.error("Community not found:", communityError);
			return Response.json({ error: "Community not found" }, { status: 404 });
		}

		// Fetch all campaigns for this community
		const { data: campaigns, error: campaignsError } = await supabase
			.from("campaigns")
			.select("*")
			.eq("community_id", community.id)
			.order("created_at", { ascending: false });

		if (campaignsError) throw campaignsError;

		// Calculate overall metrics
		const totalCampaigns = campaigns?.length || 0;
		const sentCampaigns = campaigns?.filter((c) => c.status === "sent") || [];
		const totalRecipients = sentCampaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0);
		const totalOpens = sentCampaigns.reduce((sum, c) => sum + (c.open_count || 0), 0);
		const totalClicks = sentCampaigns.reduce((sum, c) => sum + (c.click_count || 0), 0);

		const avgOpenRate =
			totalRecipients > 0 ? ((totalOpens / totalRecipients) * 100).toFixed(1) : "0.0";
		const avgClickRate =
			totalRecipients > 0 ? ((totalClicks / totalRecipients) * 100).toFixed(1) : "0.0";

		// Get recent campaigns with calculated rates
		const recentCampaigns = sentCampaigns.slice(0, 10).map((campaign) => ({
			id: campaign.id,
			subject: campaign.subject,
			sent_at: campaign.sent_at,
			recipient_count: campaign.recipient_count || 0,
			open_count: campaign.open_count || 0,
			click_count: campaign.click_count || 0,
			open_rate:
				campaign.recipient_count && campaign.recipient_count > 0
					? ((campaign.open_count || 0) / campaign.recipient_count) * 100
					: 0,
			click_rate:
				campaign.recipient_count && campaign.recipient_count > 0
					? ((campaign.click_count || 0) / campaign.recipient_count) * 100
					: 0,
		}));

		// Get top performing campaigns
		const topCampaigns = [...sentCampaigns]
			.map((campaign) => ({
				id: campaign.id,
				subject: campaign.subject,
				sent_at: campaign.sent_at,
				recipient_count: campaign.recipient_count || 0,
				open_count: campaign.open_count || 0,
				click_count: campaign.click_count || 0,
				open_rate:
					campaign.recipient_count && campaign.recipient_count > 0
						? ((campaign.open_count || 0) / campaign.recipient_count) * 100
						: 0,
				click_rate:
					campaign.recipient_count && campaign.recipient_count > 0
						? ((campaign.click_count || 0) / campaign.recipient_count) * 100
						: 0,
			}))
			.sort((a, b) => b.open_rate - a.open_rate)
			.slice(0, 5);

		// Get email events summary
		const campaignIds = campaigns?.map((c) => c.id) || [];
		let eventsSummary = {
			opened: 0,
			clicked: 0,
			bounced: 0,
			complained: 0,
		};

		if (campaignIds.length > 0) {
			const { data: events, error: eventsError } = await supabase
				.from("email_events")
				.select("type")
				.in("campaign_id", campaignIds);

			if (!eventsError && events) {
				eventsSummary = events.reduce(
					(acc, event) => {
						if (event.type === "opened") acc.opened++;
						else if (event.type === "clicked") acc.clicked++;
						else if (event.type === "bounced") acc.bounced++;
						else if (event.type === "complained") acc.complained++;
						return acc;
					},
					{ opened: 0, clicked: 0, bounced: 0, complained: 0 },
				);
			}
		}

		// Get campaign performance over time (last 30 days)
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const performanceOverTime = sentCampaigns
			.filter((c) => c.sent_at && new Date(c.sent_at) >= thirtyDaysAgo)
			.map((campaign) => ({
				date: campaign.sent_at ? new Date(campaign.sent_at).toISOString().split("T")[0] : "",
				opens: campaign.open_count || 0,
				clicks: campaign.click_count || 0,
				recipients: campaign.recipient_count || 0,
			}));

		return Response.json({
			overview: {
				totalCampaigns,
				totalRecipients,
				avgOpenRate,
				avgClickRate,
				sentCampaigns: sentCampaigns.length,
			},
			recentCampaigns,
			topCampaigns,
			eventsSummary,
			performanceOverTime,
		});
	} catch (error) {
		console.error("Error fetching metrics:", error);
		return Response.json({ error: "Failed to fetch metrics" }, { status: 500 });
	}
}

