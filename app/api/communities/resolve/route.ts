import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
	const url = new URL(req.url);
	const companyId = url.searchParams.get("companyId");
	if (!companyId) return new Response("Missing companyId", { status: 400 });

	const supabase = getAdminSupabaseClient();

	// First try to find an existing community. If it exists, do NOT overwrite user_id.
	const { data: existing, error: findErr } = await supabase
		.from("communities")
		.select("id, user_id")
		.eq("whop_community_id", companyId)
		.maybeSingle();
	if (findErr) return new Response("Error", { status: 500 });
	if (existing) {
		// If the community exists, prefer keeping its current owner.
		// However, if the current owner profile lacks sender identity but the cookie user has
		// a configured identity, re-link to the cookie user to self-heal prior bad mappings.
		try {
			const { data: ownerProfile } = await supabase
				.from("profiles")
				.select("display_name, mail_username")
				.eq("id", existing.user_id as string)
				.maybeSingle();
			const ownerHasIdentity = Boolean(ownerProfile?.display_name && ownerProfile?.mail_username);

			const cookieStore = await cookies();
			const cookieUserId = cookieStore.get("mm_uid")?.value || null;

			if (!ownerHasIdentity && cookieUserId && cookieUserId !== existing.user_id) {
				const { data: cookieProfile } = await supabase
					.from("profiles")
					.select("display_name, mail_username")
					.eq("id", cookieUserId)
					.maybeSingle();
				const cookieHasIdentity = Boolean(cookieProfile?.display_name && cookieProfile?.mail_username);
				if (cookieHasIdentity) {
					await supabase
						.from("communities")
						.update({ user_id: cookieUserId, updated_at: new Date().toISOString() })
						.eq("id", existing.id);
				}
			}
		} catch {
			// non-fatal; continue returning id
		}
		return Response.json({ id: existing.id });
	}

	// Create a pseudo owner for new communities only (cookie-based fallback)
	const cookieStore = await cookies();
	let userId = cookieStore.get("mm_uid")?.value;
	if (!userId) {
		userId = crypto.randomUUID();
		cookieStore.set({ name: "mm_uid", value: userId, httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
	}

	// Ensure profile exists for this user
	await supabase.from("profiles").upsert({ id: userId, email: `${userId}@system.local`, name: "System User" }, { onConflict: "id" });

	const { data: created, error: createErr } = await supabase
		.from("communities")
		.insert({
			whop_community_id: companyId,
			name: companyId,
			user_id: userId,
			updated_at: new Date().toISOString(),
		})
		.select()
		.single();
	if (createErr || !created) return new Response("Error", { status: 500 });
	return Response.json({ id: created.id });
}


