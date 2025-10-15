import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("campaigns")
		.select("*")
		.eq("id", params.id)
		.single();
	if (error) return new Response("Not found", { status: 404 });
	return Response.json({ campaign: data });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
	const body = await req.json();
	const supabase = getAdminSupabaseClient();
	const { data, error } = await supabase
		.from("campaigns")
		.update({
			subject: body.subject,
			preview_text: body.preview_text,
			content_md: body.content_md,
			html_content: body.html_content,
            audience: body.audience,
			status: body.status,
		})
		.eq("id", params.id)
		.select()
		.single();
	if (error) return new Response("Error", { status: 500 });
	return Response.json({ campaign: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
	const supabase = getAdminSupabaseClient();
	const { error } = await supabase.from("campaigns").delete().eq("id", params.id);
	if (error) return new Response("Error", { status: 500 });
	return new Response(null, { status: 204 });
}


