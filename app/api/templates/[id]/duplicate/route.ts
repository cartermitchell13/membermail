import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getServerSupabaseClient } from "@/lib/supabase/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { getCuratedTemplateById } from "@/lib/templates/curated";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const supabase = await getServerSupabaseClient();
    const { data: auth } = await supabase.auth.getUser();
    let userId = auth.user?.id ?? null;

    // Fallback: if no Supabase auth session, use a long-lived cookie and service role
    // to scope duplicates to a pseudo user so the UX works in Whop dev without Supabase auth.
    let useAdmin = false;
    if (!userId) {
        const cookieStore = await cookies();
        let uid = cookieStore.get("mm_uid")?.value;
        if (!uid) {
            uid = crypto.randomUUID();
            cookieStore.set({ name: "mm_uid", value: uid, httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
        }
        userId = uid;
        useAdmin = true;
    }

    const { id: sourceId } = await params;
    let source: any = null;

    // If curated id, use curated source
    const curated = getCuratedTemplateById(sourceId);
    if (curated) {
        source = curated;
    } else {
        // Otherwise, must be a user-owned template
        const client = useAdmin ? getAdminSupabaseClient() : supabase;
        const { data, error } = await client
            .from("templates")
            .select("id,name,category,thumbnail,html_content,is_default,user_id")
            .eq("id", sourceId)
            .single();
        if (error || !data) return new Response("Not found", { status: 404 });
        // Ensure ownership if using admin fallback
        if (useAdmin && data.user_id !== userId) return new Response("Forbidden", { status: 403 });
        source = data;
    }

    const copyName = `${source.name} (Copy)`;

    if (useAdmin) {
        const admin = getAdminSupabaseClient();
        // Ensure a profiles row exists for this pseudo user id (use placeholder email)
        await admin.from("profiles").upsert({ id: userId!, email: `dev+${userId}@example.local`, name: "Whop User" }, { onConflict: "id" });
        const { data: inserted, error: insertError } = await admin
            .from("templates")
            .insert({
                user_id: userId!,
                name: copyName,
                category: source.category ?? null,
                thumbnail: source.thumbnail ?? null,
                html_content: source.html_content ?? null,
                is_default: false,
            })
            .select("id,name,category,thumbnail,html_content,is_default,updated_at")
            .single();
        if (insertError) return new Response("Error", { status: 500 });
        return Response.json({ template: inserted });
    } else {
        const { data: inserted, error: insertError } = await supabase
            .from("templates")
            .insert({
                user_id: userId!,
                name: copyName,
                category: source.category ?? null,
                thumbnail: source.thumbnail ?? null,
                html_content: source.html_content ?? null,
                is_default: false,
            })
            .select("id,name,category,thumbnail,html_content,is_default,updated_at")
            .single();
        if (insertError) return new Response("Error", { status: 500 });
        return Response.json({ template: inserted });
    }
}


