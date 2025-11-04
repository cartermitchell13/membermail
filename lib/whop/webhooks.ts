import { whopSdk } from "@/lib/whop-sdk";
import { getAdminSupabaseClient } from "@/lib/supabase/admin";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function getAppWebhookUrl(): string {
  const base = requireEnv("APP_URL").replace(/\/$/, "");
  return `${base}/api/whop/webhook`;
}

const TARGET_EVENTS = [
  "membership_went_valid",
  "membership_went_invalid",
  "payment_succeeded",
  "payment_failed",
  "refund_created",
] as const;

/**
 * Ensure a Whop webhook exists for the given company and is stored locally.
 * - Idempotently creates or updates the webhook pointing to our `/api/whop/webhook` URL
 * - Subscribes to the required events using API version v5
 * - Persists `whop_webhook_id` and `webhook_secret` in `company_webhooks`
 */
export async function ensureCompanyWebhook(companyId: string) {
  // If Whop SDK credentials are not present, skip in dev/build without erroring
  const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
  const apiKey = process.env.WHOP_API_KEY;
  const webhookBase = process.env.APP_URL;
  if (!appId || !apiKey || appId === "fallback" || apiKey === "fallback") {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ensureCompanyWebhook] Skipping (missing WHOP env)", { hasAppId: Boolean(appId), hasKey: Boolean(apiKey) });
      return null;
    }
  }
  // Avoid creating webhooks pointing to localhost unless explicitly allowed
  if (!webhookBase) {
    if (process.env.NODE_ENV !== "production") {
      console.info("[ensureCompanyWebhook] Skipping (missing APP_URL)");
      return null;
    }
  }
  if (webhookBase && /localhost|127\.0\.0\.1/.test(webhookBase) && process.env.WEBHOOK_ALLOW_LOCALHOST !== "1") {
    console.info("[ensureCompanyWebhook] Skipping (APP_URL is localhost)", { appUrl: webhookBase });
    return null;
  }

  const url = getAppWebhookUrl();
  const supabase = getAdminSupabaseClient();

  // Resolve community id if present
  const { data: community } = await supabase
    .from("communities")
    .select("id")
    .eq("whop_community_id", companyId)
    .single();

  // 1) Find existing webhook for this company pointing to our URL
  let webhookId: string | null = null;
  let webhookSecret: string | null = null;
  let canonicalCompanyId: string | null = null;

  try {
    const listed = await whopSdk.webhooks.listWebhooks({ companyId });
    const existing = listed?.webhooks?.find((w: any) => w?.url === url) ?? null;

    if (existing) {
      const updated = await whopSdk.webhooks.updateWebhook({
        id: existing.id,
        apiVersion: "v5",
        enabled: true,
        events: [...TARGET_EVENTS],
        url,
      });
      webhookId = updated?.id ?? existing.id;
      webhookSecret = updated?.webhookSecret ?? existing.webhookSecret ?? null;
      canonicalCompanyId = updated?.resourceId ?? existing?.resourceId ?? null;
    } else {
      const created = await whopSdk.webhooks.createWebhook({
        apiVersion: "v5",
        enabled: true,
        events: [...TARGET_EVENTS],
        resourceId: companyId,
        url,
      });
      webhookId = created?.id ?? null;
      webhookSecret = created?.webhookSecret ?? null;
      canonicalCompanyId = created?.resourceId ?? null;
    }
  } catch (error) {
    console.error("[ensureCompanyWebhook] Failed to create/update webhook via Whop SDK", {
      companyId,
      error: error instanceof Error ? error.message : error,
    });
    return null;
  }

  if (!webhookId || !webhookSecret) {
    console.warn("[ensureCompanyWebhook] Missing webhook id/secret from SDK response", { companyId });
    return null;
  }

  // 2) Persist mapping locally for signature verification
  const storageCompanyId = canonicalCompanyId || companyId;
  const payload = {
    whop_community_id: storageCompanyId,
    community_id: community?.id ?? null,
    whop_webhook_id: webhookId,
    webhook_secret: webhookSecret,
    url,
    enabled: true,
    updated_at: new Date().toISOString(),
  } as const;

  // If caller provided a slug while webhook payloads use canonical ids, unify the row key
  if (storageCompanyId !== companyId) {
    const { data: slugRow } = await supabase
      .from("company_webhooks")
      .select("id")
      .eq("whop_community_id", companyId)
      .single();
    const { data: canonicalRow } = await supabase
      .from("company_webhooks")
      .select("id")
      .eq("whop_community_id", storageCompanyId)
      .single();

    if (slugRow && !canonicalRow) {
      // Update existing slug-keyed row to canonical key in-place
      const { error: updErr } = await supabase
        .from("company_webhooks")
        .update({
          whop_community_id: storageCompanyId,
          community_id: community?.id ?? null,
          whop_webhook_id: webhookId,
          webhook_secret: webhookSecret,
          url,
          enabled: true,
          updated_at: new Date().toISOString(),
        } as any)
        .eq("id", slugRow.id);
      if (updErr) {
        console.error("[ensureCompanyWebhook] Failed to convert slug row to canonical id", {
          companyId,
          storageCompanyId,
          error: updErr.message,
        });
      }
    }
  }

  const { data, error } = await supabase
    .from("company_webhooks")
    .upsert(payload as any, { onConflict: "whop_community_id" })
    .select("id")
    .single();

  if (error) {
    console.error("[ensureCompanyWebhook] Failed to save webhook mapping", {
      companyId,
      error: error.message,
    });
    return null;
  }

  return { id: data.id };
}
