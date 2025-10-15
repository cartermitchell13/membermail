import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeEmailHtml } from "@/lib/html/sanitize";
import { getCuratedTemplateById } from "@/lib/templates/curated";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    // Allow curated templates by synthetic id
    const curated = getCuratedTemplateById(id);
    if (curated) {
        return Response.json({ template: { ...curated, html_content: sanitizeEmailHtml(curated.html_content) } });
    }

    // First try dev cookie (works even with no Supabase session)
    const cookieStore = await cookies();
    const uid = cookieStore.get("mm_uid")?.value;
    if (uid) {
        const admin = getAdminSupabaseClient();
        const { data, error } = await admin
            .from("templates")
            .select("id,name,category,thumbnail,html_content,is_default,updated_at,user_id")
            .eq("id", id)
            .eq("user_id", uid)
            .single();
        if (data) return Response.json({ template: { ...data, html_content: sanitizeEmailHtml(data.html_content || "") } });
        if (error) return new Response("Not found", { status: 404 });
    }

    // Else must be a user-owned template accessible via RLS
    const supabase = await getServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user?.id) {
        const { data, error } = await supabase
            .from("templates")
            .select("id,name,category,thumbnail,html_content,is_default,updated_at")
            .eq("id", id)
            .single();
        if (error || !data) return new Response("Not found", { status: 404 });
        return Response.json({ template: { ...data, html_content: sanitizeEmailHtml(data.html_content || "") } });
    }

    return new Response("Unauthorized", { status: 401 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (getCuratedTemplateById(id)) return new Response("Immutable curated template", { status: 400 });
    const body = await req.json();
    const supabase = await getServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user?.id) {
        const { data, error } = await supabase
            .from("templates")
            .update({
                name: body.name,
                category: body.category,
                thumbnail: body.thumbnail,
                content_md: body.content_md,
                html_content: body.html_content,
            })
            .eq("id", id)
            .select("id,name,category,thumbnail,html_content,is_default,updated_at")
            .single();
        if (error) return new Response("Error", { status: 500 });
        return Response.json({ template: data });
    }

    const cookieStore = await cookies();
    const uid = cookieStore.get("mm_uid")?.value;
    if (uid) {
        const admin = getAdminSupabaseClient();
        const { data, error } = await admin
            .from("templates")
            .update({
                name: body.name,
                category: body.category,
                thumbnail: body.thumbnail,
                content_md: body.content_md,
                html_content: body.html_content,
            })
            .eq("id", id)
            .eq("user_id", uid)
            .select("id,name,category,thumbnail,html_content,is_default,updated_at")
            .single();
        if (error) return new Response("Error", { status: 500 });
        return Response.json({ template: data });
    }

    return new Response("Unauthorized", { status: 401 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    if (getCuratedTemplateById(id)) return new Response("Immutable curated template", { status: 400 });
    const supabase = await getServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user?.id) {
        const { error } = await supabase.from("templates").delete().eq("id", id);
        if (error) return new Response("Error", { status: 500 });
        return new Response(null, { status: 204 });
    }

    const cookieStore = await cookies();
    const uid = cookieStore.get("mm_uid")?.value;
    if (uid) {
        const admin = getAdminSupabaseClient();
        const { error } = await admin.from("templates").delete().eq("id", id).eq("user_id", uid);
        if (error) return new Response("Error", { status: 500 });
        return new Response(null, { status: 204 });
    }

    return new Response("Unauthorized", { status: 401 });
}


