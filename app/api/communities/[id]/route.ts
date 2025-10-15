import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
    const supabase = getAdminSupabaseClient();
    const { data, error } = await supabase.from("communities").select("*").eq("id", params.id).single();
    if (error || !data) return new Response("Not found", { status: 404 });
    return Response.json(data);
}


