import { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { validateMailUsername } from "@/lib/email/sender-identity";

function json(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const username = url.searchParams.get("username") ?? "";

  const { ok, error, normalized } = validateMailUsername(username);
  if (!ok || !normalized) {
    return json({ available: false, reason: error ?? "Invalid username" });
  }

  const supabase = getAdminSupabaseClient();
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("mail_username", normalized)
    .limit(1)
    .maybeSingle();

  return json({ available: !existing });
}
