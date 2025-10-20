import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { renderEmail } from "@/lib/email/render";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: idParam } = await params;
	const id = Number(idParam);
	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("campaigns")
		.select("*")
		.eq("id", id)
		.single();
	if (error) return new Response("Not found", { status: 404 });
	return Response.json({ campaign: data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: idParam } = await params;
	const id = Number(idParam);
	const body = await req.json();
	const supabase = getAdminSupabaseClient();
    // Compile content_json to HTML if provided
    let compiledHtml: string | undefined = body.html_content;
    if (body.content_json) {
        try {
            compiledHtml = renderEmail(body.content_json);
        } catch {
            return new Response("Invalid content_json", { status: 400 });
        }
    }
    const { data, error } = await supabase
		.from("campaigns")
		.update({
			subject: body.subject,
			preview_text: body.preview_text,
			content_md: body.content_md,
            content_json: body.content_json,
            html_content: compiledHtml,
            audience: body.audience,
			status: body.status,
		})
		.eq("id", id)
		.select()
		.single();
	if (error) return new Response("Error", { status: 500 });
	return Response.json({ campaign: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id: idParam } = await params;
	const id = Number(idParam);
	const supabase = getAdminSupabaseClient();
	const { error } = await supabase.from("campaigns").delete().eq("id", id);
	if (error) return new Response("Error", { status: 500 });
	return new Response(null, { status: 204 });
}


