import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

type MembersQuery = {
    communityId?: string | null;
    companyId?: string | null;
    status?: string | null;
    tier?: string | null;
    q?: string | null;
    limit?: number;
    offset?: number;
};

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const query: MembersQuery = {
        communityId: url.searchParams.get("communityId"),
        companyId: url.searchParams.get("companyId"),
        status: url.searchParams.get("status"),
        tier: url.searchParams.get("tier"),
        q: url.searchParams.get("q"),
        limit: Math.min(Number(url.searchParams.get("limit") ?? "50"), 200),
        offset: Math.max(Number(url.searchParams.get("offset") ?? "0"), 0),
    };

    const supabase = getAdminSupabaseClient();

    let communityId = query.communityId ? Number(query.communityId) : undefined;

    // Resolve via companyId (Whop company id) if provided
    if (!communityId && query.companyId) {
        const { data: community, error } = await supabase
            .from("communities")
            .select("id")
            .eq("whop_community_id", query.companyId)
            .single();
        if (error || !community) {
            return new Response("Community not found", { status: 404 });
        }
        communityId = community.id as number;
    }

    if (!communityId) {
        return new Response("Missing communityId or companyId", { status: 400 });
    }

    // Base query with filters
    let listQuery = supabase
        .from("members")
        .select(
            "id,email,name,membership_tier,status,joined_at,last_active_at,engagement_score",
            { count: "exact" },
        )
        .eq("community_id", communityId)
        .order("joined_at", { ascending: false })
        .range(query.offset!, query.offset! + query.limit! - 1);

    if (query.status) listQuery = listQuery.eq("status", query.status);
    if (query.tier) listQuery = listQuery.eq("membership_tier", query.tier);
    if (query.q) {
        const q = query.q.trim();
        if (q) {
            // Simple ILIKE filter on email and name
            listQuery = listQuery.or(
                `email.ilike.%${q}%,name.ilike.%${q}%`,
            );
        }
    }

    const { data: members, error: listError, count } = await listQuery;
    if (listError) return new Response("Error fetching members", { status: 500 });

    // Aggregates: total, status breakdown, tier breakdown
    const baseAgg = supabase.from("members").select("id,status,membership_tier", { count: "exact" }).eq("community_id", communityId);
    const [totalRes, activeRes, cancelledRes, pausedRes] = await Promise.all([
        baseAgg,
        baseAgg.eq("status", "active"),
        baseAgg.eq("status", "cancelled"),
        baseAgg.eq("status", "paused"),
    ]);

    const total = totalRes.count ?? 0;
    const active = activeRes.count ?? 0;
    const cancelled = cancelledRes.count ?? 0;
    const paused = pausedRes.count ?? 0;

    // Tier breakdown: fetch distinct tiers and count in JS for simplicity
    const { data: tierRows } = await supabase
        .from("members")
        .select("membership_tier")
        .eq("community_id", communityId);
    const tierCounts: Record<string, number> = {};
    for (const row of tierRows ?? []) {
        const key = row.membership_tier ?? "unknown";
        tierCounts[key] = (tierCounts[key] ?? 0) + 1;
    }

    return Response.json({
        members,
        total,
        pagination: { limit: query.limit, offset: query.offset, count },
        breakdown: { status: { active, cancelled, paused }, tiers: tierCounts },
    });
}


