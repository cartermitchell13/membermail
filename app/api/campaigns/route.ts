import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("campaigns")
		.select("id, subject, status, sent_at, recipient_count, open_count, click_count, created_at")
		.order("created_at", { ascending: false });
	if (error) return new Response("Error", { status: 500 });
	return Response.json({ campaigns: data });
}

export async function POST(req: NextRequest) {
	const body = await req.json();
	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("campaigns")
		.insert({
			subject: body.subject,
            preview_text: body.preview_text ?? null,
            content_md: body.content_md ?? null,
			html_content: body.html_content,
            audience: body.audience ?? null,
			status: "draft",
			community_id: body.community_id,
		})
		.select()
		.single();
	if (error) return new Response("Error", { status: 500 });
	return Response.json({ campaign: data });
}


