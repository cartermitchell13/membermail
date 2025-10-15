import { whopSdk } from "@/lib/whop-sdk";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

// Sync all members for a given Whop company into Supabase members table.
// Expects: ?companyId=biz_xxx
export async function POST(req: NextRequest) {
	const url = new URL(req.url);
	const companyId = url.searchParams.get("companyId") ?? process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
	if (!companyId) {
		return new Response("Missing companyId", { status: 400 });
	}

	const supabase = getAdminSupabaseClient();

	let endCursor: string | undefined;
	let totalUpserts = 0;

	while (true) {
		const result = await whopSdk.companies.listMembers({
			companyId,
			first: 100,
			after: endCursor,
		});

		const nodes = result.members.nodes ?? [];
		if (nodes.length === 0) break;

		const rows = nodes.map((m) => ({
			whop_member_id: m.id,
			// community mapping must be handled separately; for now use a single community row by whop_community_id
			// We'll upsert community if not exists using whop companyId as key
			email: m.user?.email ?? "",
			name: m.user?.name ?? m.user?.username ?? null,
			membership_tier: null,
			status: m.status === "joined" ? "active" : m.status === "left" ? "cancelled" : "paused",
			joined_at: new Date(m.joinedAt * 1000).toISOString(),
			last_active_at: null,
			engagement_score: 0,
		}));

		// Ensure community exists and get id
		const { data: communityData, error: communityErr } = await supabase
			.from("communities")
			.upsert(
				{
					whop_community_id: companyId,
					name: companyId,
					member_count: result.members.totalCount ?? nodes.length,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "whop_community_id" },
			)
			.select()
			.single();

		if (communityErr || !communityData) {
			return new Response("Failed to upsert community", { status: 500 });
		}

		const withCommunity = rows.map((r) => ({ ...r, community_id: communityData.id }));

		const { error } = await supabase
			.from("members")
			.upsert(withCommunity, { onConflict: "whop_member_id" });

		if (error) {
			return new Response("Failed to upsert members", { status: 500 });
		}

		totalUpserts += withCommunity.length;
		const pageInfo = result.members.pageInfo;
		if (!pageInfo?.hasNextPage) break;
		endCursor = pageInfo.endCursor;
	}

	return new Response(JSON.stringify({ ok: true, totalUpserts }), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}


