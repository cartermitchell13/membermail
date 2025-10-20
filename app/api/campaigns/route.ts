import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { renderEmail } from "@/lib/email/render";

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
    // Compile content_json to HTML if provided
    let compiledHtml: string = body.html_content;
    if (!compiledHtml && body.content_json) {
        try {
            compiledHtml = renderEmail(body.content_json);
        } catch {
            return new Response("Invalid content_json", { status: 400 });
        }
    }
	const { data, error } = await supabase
		.from("campaigns")
		.insert({
			subject: body.subject,
            preview_text: body.preview_text ?? null,
            content_md: body.content_md ?? null,
            content_json: body.content_json ?? null,
            html_content: compiledHtml,
            audience: body.audience ?? null,
			status: "draft",
			community_id: body.community_id,
		})
		.select()
		.single();
	if (error) return new Response("Error", { status: 500 });
	return Response.json({ campaign: data });
}


