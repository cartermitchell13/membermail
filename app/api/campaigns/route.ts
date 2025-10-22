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
    try {
        const body = await req.json();
        const supabase = getAdminSupabaseClient();

        // Basic validation
        if (!body || typeof body !== "object") {
            return new Response("Invalid JSON body", { status: 400 });
        }
        const subject: string | undefined = body.subject?.toString();
        const communityId: number | undefined = Number(body.community_id);
        if (!subject || subject.trim().length === 0) {
            return new Response("Subject is required", { status: 400 });
        }
        if (!Number.isFinite(communityId)) {
            return new Response("community_id is required", { status: 400 });
        }

        // Compile content_json to HTML if provided
        let compiledHtml: string | undefined = body.html_content;
        if (!compiledHtml && body.content_json) {
            try {
                compiledHtml = renderEmail(body.content_json);
            } catch {
                return new Response("Invalid content_json", { status: 400 });
            }
        }

        // html_content is required by schema
        if (!compiledHtml || typeof compiledHtml !== "string" || compiledHtml.trim().length === 0) {
            return new Response("html_content is required", { status: 400 });
        }

        // Build insert payload without content_json for backward compatibility
        const insertPayload: any = {
            subject,
            preview_text: body.preview_text ?? null,
            content_md: body.content_md ?? null,
            html_content: compiledHtml,
            audience: body.audience ?? null,
            status: "draft",
            community_id: communityId,
        };

        const { data, error } = await supabase
            .from("campaigns")
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            return new Response(`Database error: ${error.message}`, { status: 500 });
        }
        return Response.json({ campaign: data });
    } catch (e) {
        const message = e instanceof Error ? e.message : "Unknown error";
        return new Response(`Server error: ${message}`, { status: 500 });
    }
}


