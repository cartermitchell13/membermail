import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeEmailHtml } from "@/lib/html/sanitize";
import { getCuratedTemplatesWithIds } from "@/lib/templates/curated";
import { cookies } from "next/headers";

export async function GET(_req: NextRequest) {
    // Fetch user-owned templates via RLS using server client
    const supabase = await getServerSupabaseClient();
    const { data: sessionData } = await supabase.auth.getUser();
    let userId: string | null = sessionData.user?.id ?? null;

    let userTemplates: any[] = [];
    if (userId) {
        const { data } = await supabase
            .from("templates")
            .select("id,name,category,thumbnail,html_content,is_default,updated_at")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });
        userTemplates = data ?? [];
    } else {
        // Dev fallback: support duplicates created via mm_uid cookie
        const cookieStore = await cookies();
        const uid = cookieStore.get("mm_uid")?.value ?? null;
        if (uid) {
            const admin = getAdminSupabaseClient();
            const { data } = await admin
                .from("templates")
                .select("id,name,category,thumbnail,html_content,is_default,updated_at")
                .eq("user_id", uid)
                .order("updated_at", { ascending: false });
            userTemplates = data ?? [];
        }
    }

    // Curated defaults (read-only), served statically here
    const curated = getCuratedTemplatesWithIds();

    // Sanitize previews server-side to be safe for rendering in the dashboard
    const sanitize = (t: any) => ({ ...t, html_content: sanitizeEmailHtml(t.html_content || "") });
    const templates = [...curated.map(sanitize), ...userTemplates.map(sanitize)];
    return Response.json({ templates });
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const supabase = await getServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth.user?.id;
    if (!userId) return new Response("Unauthorized", { status: 401 });
    if (body.is_default === true) return new Response("Cannot set is_default", { status: 400 });

    const { data, error } = await supabase
        .from("templates")
        .insert({
            user_id: userId,
            name: body.name,
            category: body.category ?? null,
            thumbnail: body.thumbnail ?? null,
            content_md: body.content_md ?? null,
            html_content: body.html_content ?? null,
            is_default: false,
        })
        .select("id,name,category,thumbnail,html_content,is_default,updated_at")
        .single();
    if (error) return new Response("Error", { status: 500 });
    return Response.json({ template: data });
}


