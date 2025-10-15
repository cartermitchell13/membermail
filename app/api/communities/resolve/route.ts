import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const companyId = url.searchParams.get("companyId");
	if (!companyId) return new Response("Missing companyId", { status: 400 });

	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("communities")
		.upsert(
			{
				whop_community_id: companyId,
				name: companyId,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "whop_community_id" },
		)
		.select()
		.single();
	if (error || !data) return new Response("Error", { status: 500 });
	return Response.json({ id: data.id });
}


