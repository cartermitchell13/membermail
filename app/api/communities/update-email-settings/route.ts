import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
    const url = new URL(req.url);
    const companyId = url.searchParams.get("companyId");
    if (!companyId) return new Response("Missing companyId", { status: 400 });

    const body = await req.json();
    const supabase = getAdminSupabaseClient();

    const { data: community, error } = await supabase
        .from("communities")
        .select("id")
        .eq("whop_community_id", companyId)
        .single();
    if (error || !community) return new Response("Community not found", { status: 404 });

    const { error: updateErr } = await supabase
        .from("communities")
        .update({
            from_name: body.from_name ?? null,
            reply_to_email: body.reply_to_email ?? null,
            footer_text: body.footer_text ?? null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", community.id);

    if (updateErr) return new Response("Error", { status: 500 });
    return Response.json({ ok: true });
}


