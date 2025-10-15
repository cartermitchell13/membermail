import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const companyId = url.searchParams.get("companyId");
	if (!companyId) return new Response("Missing companyId", { status: 400 });

	const supabase = getAdminSupabaseClient();
	
	// Get or create a pseudo user_id for this community (using a cookie-based fallback)
	const cookieStore = await cookies();
	let userId = cookieStore.get("mm_uid")?.value;
	if (!userId) {
		userId = crypto.randomUUID();
		cookieStore.set({ name: "mm_uid", value: userId, httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
	}
	
	// Ensure profile exists for this user
	await supabase.from("profiles").upsert({ id: userId, email: `${userId}@system.local`, name: "System User" }, { onConflict: "id" });
	
	const { data, error } = await supabase
		.from("communities")
		.upsert(
			{
				whop_community_id: companyId,
				name: companyId,
				user_id: userId,
				updated_at: new Date().toISOString(),
			},
			{ onConflict: "whop_community_id" },
		)
		.select()
		.single();
	if (error || !data) return new Response("Error", { status: 500 });
	return Response.json({ id: data.id });
}


