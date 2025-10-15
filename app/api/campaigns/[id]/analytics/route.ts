import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    const url = new URL(req.url);
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);

    const supabase = getAdminSupabaseClient();
    const id = Number(params.id);
    const { data: events, error } = await supabase
        .from("email_events")
        .select("id,type,member_id,created_at")
        .eq("campaign_id", id)
        .order("created_at", { ascending: false })
        .range(offset, offset + limit - 1);
    if (error) return new Response("Error", { status: 500 });
    return Response.json({ events });
}


