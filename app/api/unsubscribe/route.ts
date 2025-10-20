import { NextRequest } from "next/server";
import { verifySignature, buildUnsubscribePayload } from "@/lib/tracking/hmac";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const c = url.searchParams.get("c");
    const m = url.searchParams.get("m");
    const sig = url.searchParams.get("sig");
    if (!c || !m || !sig) return new Response("Bad Request", { status: 400 });

    const payload = buildUnsubscribePayload(String(c), String(m));
    if (!verifySignature(payload, sig)) return new Response("Invalid signature", { status: 400 });

    try {
        const supabase = getAdminSupabaseClient();
        // Best-effort mark member as cancelled to suppress future sends
        await supabase
            .from("members")
            .update({ status: "cancelled", updated_at: new Date().toISOString() })
            .eq("id", Number(m));
    } catch {}

    const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Unsubscribed</title>
    <style>body{background:#0b0b0b;color:#eaeaea;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;margin:0;padding:40px} .card{max-width:560px;margin:40px auto;background:#141414;border:1px solid #222;border-radius:12px;padding:24px;text-align:center} a{color:#FA4616}</style>
    </head><body>
      <div class="card">
        <h1 style="margin:0 0 12px">You’ve been unsubscribed</h1>
        <p style="margin:0 0 16px">You won’t receive future emails from this sender.</p>
        <p style="opacity:.75">If this was a mistake, contact support or re-subscribe in your account.</p>
      </div>
    </body></html>`;
    return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}


