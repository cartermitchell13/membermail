import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";
import { normalizeWhopEvent } from "@/lib/automations/events";
import { extractAutomationContext, handleAutomationTrigger } from "@/lib/automations/service";
import crypto from "node:crypto";

const SIGNATURE_HEADER = "x-whop-signature";
const MAX_SKEW_SECONDS = 300; // 5 minutes

async function verifySignature({
  bodyText,
  header,
  secret,
}: {
  bodyText: string;
  header: string | null;
  secret: string;
}) {
  if (!header) throw new Error("Missing signature header");
  const parts = header.split(",");
  if (parts.length !== 2) throw new Error("Invalid signature header format");

  const [timestampStr, signatureStr] = parts;
  const [, timestampRaw] = timestampStr.split("=");
  const [version, sentSignature] = signatureStr.split("=");

  if (!timestampRaw || !sentSignature) throw new Error("Invalid signature header values");
  if (version !== "v1") throw new Error("Unsupported signature version");

  const now = Math.round(Date.now() / 1000);
  const ts = Number.parseInt(timestampRaw, 10);
  if (Number.isNaN(ts) || Math.abs(now - ts) > MAX_SKEW_SECONDS) {
    throw new Error("Invalid or expired timestamp");
  }

  const stringToHash = `${timestampRaw}.${bodyText}`;
  const computed = crypto.createHmac("sha256", secret).update(stringToHash).digest("hex");
  if (computed !== sentSignature) throw new Error("Signature mismatch");
}

export async function POST(request: NextRequest): Promise<Response> {
  const supabase = getAdminSupabaseClient();
  const rawBody = await request.text();

  let parsed: any;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Extract company id from webhook payload to load the correct secret
  const normalizedEvent = normalizeWhopEvent(parsed?.action);
  const extracted = extractAutomationContext(parsed?.data ?? {});

  // Try primary path: lookup secret by extracted company id
  const header = request.headers.get(SIGNATURE_HEADER);
  let effectiveCompanyId = extracted.companyId;
  let secretToUse: string | null = null;

  if (effectiveCompanyId) {
    const { data: mapping } = await supabase
      .from("company_webhooks")
      .select("webhook_secret")
      .eq("whop_community_id", effectiveCompanyId)
      .single();
    if (mapping?.webhook_secret) {
      secretToUse = mapping.webhook_secret;
    }
  }

  // Fallback (dev-only): attempt to verify against any stored secret to support test payloads
  if (!secretToUse && process.env.NODE_ENV !== "production") {
    const { data: rows } = await supabase
      .from("company_webhooks")
      .select("whop_community_id, webhook_secret, enabled");
    if (rows && rows.length > 0) {
      for (const row of rows) {
        try {
          await verifySignature({ bodyText: rawBody, header, secret: row.webhook_secret });
          // Match found
          effectiveCompanyId = row.whop_community_id;
          secretToUse = row.webhook_secret;
          break;
        } catch {
          // try next
        }
      }
    }
  }

  if (!secretToUse || !effectiveCompanyId) {
    console.warn("[Webhook] Unknown company for webhook", { extractedCompanyId: extracted.companyId });
    return new Response("Unknown company", { status: 400 });
  }

  // Verify HMAC signature with the resolved secret
  try {
    await verifySignature({ bodyText: rawBody, header, secret: secretToUse });
  } catch (err) {
    return new Response("Invalid signature", { status: 401 });
  }

  if (normalizedEvent) {
    waitUntil(
      handleAutomationTrigger({
        supabase,
        event: normalizedEvent,
        companyId: effectiveCompanyId,
        memberWhopId: extracted.memberWhopId,
        raw: parsed?.data ?? {},
      }).catch((error) => {
        console.error("Failed to handle automation trigger", {
          error: error instanceof Error ? error.message : error,
          event: normalizedEvent,
        });
      }),
    );
  }

  // Return 2xx quickly to avoid retries
  return new Response("OK", { status: 200 });
}
